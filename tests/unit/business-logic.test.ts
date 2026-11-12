import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  calculateRentalDays,
  calculateBookingPrice,
  formatINR,
} from '@/lib/pricing/calculator';
import {
  checkVehicleAvailability,
  ACTIVE_BLOCKING_STATUSES,
} from '@/lib/booking/availability';
import type { Vehicle } from '@/types/vehicle';
import type { Booking } from '@/types/booking';

const mockGetUser = vi.fn();
const mockProfileMaybeSingle = vi.fn();
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: mockProfileMaybeSingle,
    })),
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ __isAdminClient: true })),
}));

import { requireAuthUser, requireAdminUser } from '@/lib/supabase/auth-guard';

const sampleCar: Vehicle = {
  id: 'veh-car-1',
  name: 'Hyundai Creta SX',
  brand: 'Hyundai',
  model: 'Creta',
  variant: 'SX Petrol',
  year: 2024,
  type: 'car',
  category: 'SUV',
  registrationNumber: 'TN09CD1234',
  transmission: 'Automatic',
  fuelType: 'Petrol',
  seatingCapacity: 5,
  mileage: '17 km/l',
  pricePerDay: 3000,
  securityDeposit: 5000,
  rating: 4.8,
  reviewCount: 4,
  images: [],
  coverImage: '/images/creta.jpg',
  location: 'Chennai Airport Hub',
  description: 'Compact SUV',
  features: ['ABS', 'Airbags'],
  status: 'available',
  minRentalHours: 24,
  odometer: 12000,
  isActive: true,
};

const sampleBike: Vehicle = {
  ...sampleCar,
  id: 'veh-bike-1',
  name: 'Royal Enfield Classic 350',
  brand: 'Royal Enfield',
  model: 'Classic 350',
  type: 'bike',
  category: 'Cruiser',
  pricePerDay: 1200,
  securityDeposit: 2000,
};

const baseBooking: Booking = {
  id: 'bkg-1',
  vehicleId: 'veh-car-1',
  vehicleName: 'Hyundai Creta SX',
  vehicleBrand: 'Hyundai',
  vehicleType: 'car',
  vehicleImage: '/images/creta.jpg',
  customerName: 'Barath M',
  customerEmail: 'barath@example.com',
  customerPhone: '9876543210',
  customerId: 'user-1',
  pickupDate: '2027-05-10',
  pickupTime: '09:00',
  returnDate: '2027-05-12',
  returnTime: '09:00',
  pickupLocation: 'Chennai Central',
  returnLocation: 'Chennai Central',
  deliveryType: 'hub',
  durationDays: 2,
  rentalCharges: 6000,
  securityDeposit: 5000,
  gstAmount: 1080,
  insuranceFee: 499,
  totalAmount: 12579,
  bookingStatus: 'confirmed',
  paymentStatus: 'paid',
  licenceStatus: 'verified',
  createdAt: '2027-05-01T10:00:00Z',
  statusHistory: [],
};

describe('RentRide Pricing Calculator', () => {
  it('computes rental duration in whole ceiling days with minimum 1 day', () => {
    expect(calculateRentalDays('2027-05-10', '09:00', '2027-05-12', '09:00')).toBe(2);
    expect(calculateRentalDays('2027-05-10', '09:00', '2027-05-12', '10:00')).toBe(3);
    expect(calculateRentalDays('2027-05-10', '09:00', '2027-05-10', '18:00')).toBe(1);
    expect(calculateRentalDays('2027-05-12', '09:00', '2027-05-10', '09:00')).toBe(1);
  });

  it('calculates car booking totals with 18% GST, doorstep fee, discount, and deposit', () => {
    const pricing = calculateBookingPrice(sampleCar, {
      pickupDate: '2027-05-10',
      pickupTime: '09:00',
      returnDate: '2027-05-12',
      returnTime: '09:00',
      deliveryType: 'doorstep',
      appliedDiscountPercent: 10,
    });

    expect(pricing.rentalDurationDays).toBe(2);
    expect(pricing.baseRental).toBe(6000);
    expect(pricing.doorstepDeliveryFee).toBe(299);
    expect(pricing.subtotal).toBe(6299);
    expect(pricing.discountAmount).toBe(630);
    expect(pricing.gstAmount).toBe(Math.round((6299 - 630) * 0.18));
    expect(pricing.insuranceFee).toBe(499);
    expect(pricing.securityDeposit).toBe(5000);
    expect(pricing.totalAmount).toBe(
      6299 - 630 + Math.round((6299 - 630) * 0.18) + 499 + 5000
    );
  });

  it('uses bike insurance fee (₹199) and zero doorstep fee for hub pickup', () => {
    const pricing = calculateBookingPrice(sampleBike, {
      pickupDate: '2027-05-10',
      pickupTime: '09:00',
      returnDate: '2027-05-11',
      returnTime: '09:00',
      deliveryType: 'hub',
    });

    expect(pricing.rentalDurationDays).toBe(1);
    expect(pricing.insuranceFee).toBe(199);
    expect(pricing.doorstepDeliveryFee).toBe(0);
    expect(pricing.gstAmount).toBe(216);
    expect(pricing.totalAmount).toBe(1200 + 216 + 199 + 2000);
  });

  it('formats INR amounts with currency symbol and Indian grouping', () => {
    expect(formatINR(1499)).toBe('₹1,499');
    expect(formatINR(125000)).toBe('₹1,25,000');
  });
});

describe('RentRide Double-Booking & Maintenance Availability Engine', () => {
  it('blocks single-day maintenance blackouts inclusively', () => {
    const res = checkVehicleAvailability({
      vehicleId: 'veh-car-1',
      requestedPickup: '2027-06-10T09:00',
      requestedReturn: '2027-06-11T18:00',
      existingBookings: [],
      blockedDates: [
        {
          id: 'blk-1',
          vehicleId: 'veh-car-1',
          startDate: '2027-06-10',
          endDate: '2027-06-10',
          reason: 'maintenance',
          notes: 'Periodic brake inspection',
        },
      ],
    });

    expect(res.isAvailable).toBe(false);
    expect(res.reason).toContain('maintenance');
    expect(res.conflictingDates).toEqual({
      start: '2027-06-10',
      end: '2027-06-10',
    });
  });

  it('blocks boundary-touching maintenance windows and permits non-overlapping dates', () => {
    const blocked = [
      {
        id: 'blk-2',
        vehicleId: 'veh-car-1',
        startDate: '2027-06-15',
        endDate: '2027-06-16',
        reason: 'inspection' as const,
        notes: 'RTO fitness',
      },
    ];

    const conflict = checkVehicleAvailability({
      vehicleId: 'veh-car-1',
      requestedPickup: '2027-06-16T10:00',
      requestedReturn: '2027-06-17T18:00',
      existingBookings: [],
      blockedDates: blocked,
    });
    expect(conflict.isAvailable).toBe(false);

    const clear = checkVehicleAvailability({
      vehicleId: 'veh-car-1',
      requestedPickup: '2027-06-17T09:00',
      requestedReturn: '2027-06-18T18:00',
      existingBookings: [],
      blockedDates: blocked,
    });
    expect(clear.isAvailable).toBe(true);
  });

  it('detects overlapping active bookings while ignoring cancelled/completed/excluded bookings', () => {
    expect(ACTIVE_BLOCKING_STATUSES).toContain('confirmed');
    expect(ACTIVE_BLOCKING_STATUSES).not.toContain('cancelled');

    const conflict = checkVehicleAvailability({
      vehicleId: 'veh-car-1',
      requestedPickup: '2027-05-11T10:00',
      requestedReturn: '2027-05-13T10:00',
      existingBookings: [baseBooking],
    });
    expect(conflict.isAvailable).toBe(false);
    expect(conflict.conflictingBookingId).toBe('bkg-1');

    const cancelledOk = checkVehicleAvailability({
      vehicleId: 'veh-car-1',
      requestedPickup: '2027-05-11T10:00',
      requestedReturn: '2027-05-13T10:00',
      existingBookings: [{ ...baseBooking, bookingStatus: 'cancelled' }],
    });
    expect(cancelledOk.isAvailable).toBe(true);

    const excludedOk = checkVehicleAvailability({
      vehicleId: 'veh-car-1',
      requestedPickup: '2027-05-11T10:00',
      requestedReturn: '2027-05-13T10:00',
      existingBookings: [baseBooking],
      excludeBookingId: 'bkg-1',
    });
    expect(excludedOk.isAvailable).toBe(true);
  });

  it('rejects inverted return <= pickup timestamps', () => {
    const invalid = checkVehicleAvailability({
      vehicleId: 'veh-car-1',
      requestedPickup: '2027-05-12T10:00',
      requestedReturn: '2027-05-10T10:00',
      existingBookings: [],
    });
    expect(invalid.isAvailable).toBe(false);
  });
});

describe('RentRide Server Authorization Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no user session exists', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await requireAuthUser();
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.response.status).toBe(401);
    }
  });

  it('returns 403 for authenticated customer calling admin guard', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'cust-1', email: 'c@test.in' } } });
    mockProfileMaybeSingle.mockResolvedValueOnce({ data: { role: 'customer' } });

    const res = await requireAdminUser();
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.response.status).toBe(403);
    }
  });

  it('grants adminClient to verified admin and fleet_manager roles', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'fm-1', email: 'fm@test.in' } } });
    mockProfileMaybeSingle.mockResolvedValueOnce({ data: { role: 'fleet_manager' } });

    const res = await requireAdminUser();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.role).toBe('fleet_manager');
      expect((res.adminClient as unknown as { __isAdminClient: boolean }).__isAdminClient).toBe(true);
    }
  });
});

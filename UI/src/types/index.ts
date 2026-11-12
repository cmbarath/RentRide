export type VehicleType = 'car' | 'bike';

export type CarCategory = 'SUV' | 'Sedan' | 'Hatchback' | 'Luxury' | 'Electric SUV';
export type BikeCategory = 'Scrambler' | 'Naked Sport' | 'Cruiser' | 'Electric Scooter' | 'Sport' | 'Adventure';
export type VehicleCategory = CarCategory | BikeCategory;

export type TransmissionType = 'Manual' | 'Automatic';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';

export type VehicleStatus = 'available' | 'booked' | 'rented' | 'maintenance';

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  type: VehicleType;
  category: VehicleCategory;
  registrationNumber: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  seatingCapacity?: number; // for cars
  engineCapacity?: string; // for bikes, e.g. "349 cc" or "Electric 6.4kW"
  mileage: string; // e.g. "17 km/l" or "146 km/charge"
  pricePerDay: number; // in INR
  securityDeposit: number; // in INR
  rating: number;
  reviewCount: number;
  images: string[];
  coverImage: string;
  location: string;
  description: string;
  features: string[];
  status: VehicleStatus;
  minRentalHours: number;
  odometer: number; // in km
}

export type BookingStatus =
  | 'submitted'
  | 'awaiting_licence'
  | 'approved'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type LicenceVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Booking {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleBrand: string;
  vehicleType: VehicleType;
  vehicleImage: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:mm
  returnDate: string; // YYYY-MM-DD
  returnTime: string; // HH:mm
  pickupLocation: string;
  returnLocation: string;
  deliveryType: 'hub' | 'doorstep';
  deliveryAddress?: string;
  durationDays: number;
  rentalCharges: number;
  securityDeposit: number;
  gstAmount: number;
  insuranceFee: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  licenceStatus: LicenceVerificationStatus;
  licenceFrontImage?: string;
  licenceBackImage?: string;
  licenceNumber?: string;
  rejectionReason?: string;
  createdAt: string;
  pickupOtp?: string;
  returnOtp?: string;
  statusHistory: {
    status: BookingStatus;
    timestamp: string;
    note: string;
  }[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  licenceStatus: LicenceVerificationStatus;
  licenceNumber?: string;
  licenceFront?: string;
  licenceBack?: string;
  totalBookings: number;
  totalSpent: number;
  status: 'active' | 'suspended';
  avatar?: string;
  rating: number;
}

export interface Transaction {
  id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking';
  transactionDate: string;
  status: 'success' | 'pending' | 'refunded' | 'failed';
  type: 'rental_charge' | 'security_deposit' | 'deposit_refund' | 'cancellation_refund';
}

export interface HubLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  operatingHours: string;
  contactNumber: string;
  vehiclesAvailable: number;
}

export interface BlockedDateRange {
  id: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  reason: 'maintenance' | 'vip_reservation' | 'inspection' | 'relocation';
  notes: string;
}

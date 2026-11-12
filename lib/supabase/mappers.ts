import { Vehicle } from '@/types/vehicle';
import { Booking, BookingStatus, PaymentStatus, LicenceVerificationStatus } from '@/types/booking';
import { Customer } from '@/types/customer';
import { Transaction } from '@/types/payment';

/**
 * Maps a Supabase PostgreSQL row from public.vehicles to TypeScript Vehicle
 */
export function mapVehicleFromDb(row: any): Vehicle {
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    variant: row.variant || '',
    year: row.year,
    type: row.type,
    category: row.category,
    bodyType: row.body_type,
    bikeSegment: row.bike_segment,
    registrationNumber: row.registration_number,
    transmission: row.transmission,
    fuelType: row.fuel_type,
    seatingCapacity: row.seating_capacity,
    engineCapacity: row.engine_capacity,
    mileage: row.mileage,
    pricePerDay: Number(row.price_per_day),
    weekendPrice: row.weekend_price ? Number(row.weekend_price) : undefined,
    securityDeposit: Number(row.security_deposit),
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.review_count || 0),
    images: row.images || [row.cover_image],
    coverImage: row.cover_image,
    location: row.location_name || 'T. Nagar Hub, Chennai',
    pickupLocationId: row.location_id,
    description: row.description || '',
    features: row.features || [],
    status: row.status || 'available',
    minRentalHours: row.min_rental_hours || 12,
    odometer: row.odometer || 0,
    isActive: row.is_active ?? true,
  };
}

/**
 * Maps a TypeScript Vehicle or Partial<Vehicle> to Supabase PostgreSQL row
 */
export function mapVehicleToDb(v: Partial<Vehicle>): Record<string, any> {
  const row: Record<string, any> = {};

  if (v.id !== undefined) row.id = v.id;
  if (v.slug !== undefined) row.slug = v.slug;
  if (v.name !== undefined) row.name = v.name;
  if (v.brand !== undefined) row.brand = v.brand;
  if (v.model !== undefined) row.model = v.model;
  if (v.variant !== undefined) row.variant = v.variant;
  if (v.year !== undefined) row.year = v.year;
  if (v.type !== undefined) row.type = v.type;
  if (v.category !== undefined) row.category = v.category;
  if (v.bodyType !== undefined) row.body_type = v.bodyType;
  if (v.bikeSegment !== undefined) row.bike_segment = v.bikeSegment;
  if (v.registrationNumber !== undefined) row.registration_number = v.registrationNumber;
  if (v.transmission !== undefined) row.transmission = v.transmission;
  if (v.fuelType !== undefined) row.fuel_type = v.fuelType;
  if (v.seatingCapacity !== undefined) row.seating_capacity = v.seatingCapacity;
  if (v.engineCapacity !== undefined) row.engine_capacity = v.engineCapacity;
  if (v.mileage !== undefined) row.mileage = v.mileage;
  if (v.pricePerDay !== undefined) row.price_per_day = v.pricePerDay;
  if (v.weekendPrice !== undefined) row.weekend_price = v.weekendPrice;
  if (v.securityDeposit !== undefined) row.security_deposit = v.securityDeposit;
  if (v.rating !== undefined) row.rating = v.rating;
  if (v.reviewCount !== undefined) row.review_count = v.reviewCount;
  if (v.coverImage !== undefined) row.cover_image = v.coverImage;
  if (v.pickupLocationId !== undefined) row.location_id = v.pickupLocationId;
  if (v.location !== undefined) row.location_name = v.location;
  if (v.description !== undefined) row.description = v.description;
  if (v.features !== undefined) row.features = v.features;
  if (v.status !== undefined) row.status = v.status;
  if (v.minRentalHours !== undefined) row.min_rental_hours = v.minRentalHours;
  if (v.odometer !== undefined) row.odometer = v.odometer;
  if (v.isActive !== undefined) row.is_active = v.isActive;

  return row;
}

/**
 * Maps a Supabase PostgreSQL row from public.bookings to TypeScript Booking
 */
export function mapBookingFromDb(row: any): Booking {
  return {
    id: row.id,
    bookingCode: row.booking_code || row.id,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    vehicleBrand: row.vehicle_brand,
    vehicleType: row.vehicle_type,
    vehicleImage: row.vehicle_image,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerId: row.user_id || 'cust-guest',
    pickupDate: row.pickup_date,
    pickupTime: row.pickup_time ? row.pickup_time.slice(0, 5) : '09:00',
    returnDate: row.return_date,
    returnTime: row.return_time ? row.return_time.slice(0, 5) : '18:00',
    pickupLocation: row.pickup_location,
    pickupLocationId: row.pickup_location_id,
    returnLocation: row.return_location,
    returnLocationId: row.return_location_id,
    deliveryType: row.delivery_type || 'hub',
    deliveryAddress: row.delivery_address,
    durationDays: row.duration_days,
    pricingSnapshot: row.pricing_snapshot,
    rentalCharges: Number(row.rental_charges),
    securityDeposit: Number(row.security_deposit),
    gstAmount: Number(row.tax_amount || 0),
    insuranceFee: Number(row.insurance_fee || 0),
    additionalCharges: Number(row.additional_charges || 0),
    discountAmount: Number(row.discount_amount || 0),
    totalAmount: Number(row.total_amount),
    bookingStatus: row.booking_status as BookingStatus,
    paymentStatus: row.payment_status as PaymentStatus,
    licenceStatus: (row.licence_status || 'pending') as LicenceVerificationStatus,
    licenceNumber: row.licence_number,
    licenceFrontImage: row.licence_front_image,
    licenceBackImage: row.licence_back_image,
    pickupOtp: row.pickup_otp,
    returnOtp: row.return_otp,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    createdAt: row.created_at,
    statusHistory: row.booking_status_history || [],
  };
}

/**
 * Maps a TypeScript Booking to Supabase PostgreSQL row
 */
export function mapBookingToDb(b: Partial<Booking>): Record<string, any> {
  const row: Record<string, any> = {};

  if (b.id !== undefined) row.id = b.id;
  if (b.bookingCode !== undefined) row.booking_code = b.bookingCode;
  if (b.customerId !== undefined && b.customerId !== 'cust-guest' && b.customerId.includes('-')) {
    row.user_id = b.customerId;
  }
  if (b.vehicleId !== undefined) row.vehicle_id = b.vehicleId;
  if (b.vehicleName !== undefined) row.vehicle_name = b.vehicleName;
  if (b.vehicleBrand !== undefined) row.vehicle_brand = b.vehicleBrand;
  if (b.vehicleType !== undefined) row.vehicle_type = b.vehicleType;
  if (b.vehicleImage !== undefined) row.vehicle_image = b.vehicleImage;
  if (b.customerName !== undefined) row.customer_name = b.customerName;
  if (b.customerEmail !== undefined) row.customer_email = b.customerEmail;
  if (b.customerPhone !== undefined) row.customer_phone = b.customerPhone;
  if (b.pickupDate !== undefined) row.pickup_date = b.pickupDate;
  if (b.pickupTime !== undefined) row.pickup_time = b.pickupTime;
  if (b.returnDate !== undefined) row.return_date = b.returnDate;
  if (b.returnTime !== undefined) row.return_time = b.returnTime;
  if (b.pickupLocation !== undefined) row.pickup_location = b.pickupLocation;
  if (b.pickupLocationId !== undefined) row.pickup_location_id = b.pickupLocationId;
  if (b.returnLocation !== undefined) row.return_location = b.returnLocation;
  if (b.returnLocationId !== undefined) row.return_location_id = b.returnLocationId;
  if (b.deliveryType !== undefined) row.delivery_type = b.deliveryType;
  if (b.deliveryAddress !== undefined) row.delivery_address = b.deliveryAddress;
  if (b.durationDays !== undefined) row.duration_days = b.durationDays;
  if (b.pricingSnapshot !== undefined) row.pricing_snapshot = b.pricingSnapshot;
  if (b.rentalCharges !== undefined) row.rental_charges = b.rentalCharges;
  if (b.securityDeposit !== undefined) row.security_deposit = b.securityDeposit;
  if (b.gstAmount !== undefined) row.tax_amount = b.gstAmount;
  if (b.insuranceFee !== undefined) row.insurance_fee = b.insuranceFee;
  if (b.totalAmount !== undefined) row.total_amount = b.totalAmount;
  if (b.bookingStatus !== undefined) row.booking_status = b.bookingStatus;
  if (b.paymentStatus !== undefined) row.payment_status = b.paymentStatus;
  if (b.licenceStatus !== undefined) row.licence_status = b.licenceStatus;
  if (b.licenceNumber !== undefined) row.licence_number = b.licenceNumber;
  if (b.pickupOtp !== undefined) row.pickup_otp = b.pickupOtp;
  if (b.returnOtp !== undefined) row.return_otp = b.returnOtp;
  if (b.razorpayOrderId !== undefined) row.razorpay_order_id = b.razorpayOrderId;
  if (b.razorpayPaymentId !== undefined) row.razorpay_payment_id = b.razorpayPaymentId;

  return row;
}

/**
 * Maps a Supabase PostgreSQL row from public.profiles to TypeScript Customer
 */
export function mapCustomerFromDb(p: any): Customer {
  return {
    id: p.id,
    name: p.full_name || 'Renter',
    email: p.email,
    phone: p.phone || '',
    role: p.role || 'customer',
    joinedDate: new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    licenceStatus: p.licence_verification_status || 'unverified',
    totalBookings: 0,
    totalSpent: 0,
    status: 'active',
    rating: 5.0,
    avatar: p.avatar_url,
  };
}

/**
 * Maps a Supabase PostgreSQL row from public.payments to TypeScript Transaction
 */
export function mapTransactionFromDb(t: any): Transaction {
  return {
    id: t.id,
    bookingId: t.booking_id,
    customerId: t.user_id,
    customerName: t.customer_name,
    customerEmail: t.customer_email,
    amount: Number(t.amount),
    paymentMethod: t.payment_method,
    transactionDate: new Date(t.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: t.status,
    type: t.type,
    razorpayPaymentId: t.razorpay_payment_id,
    razorpayOrderId: t.razorpay_order_id,
  };
}

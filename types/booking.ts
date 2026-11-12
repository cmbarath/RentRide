import { VehicleType } from './vehicle';

export type BookingStatus =
  | 'pending_review'
  | 'approved_pending_payment'
  | 'confirmed'
  | 'active'
  | 'awaiting_inspection'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'submitted' // for backward compatibility
  | 'awaiting_licence'
  | 'approved';

export type PaymentStatus =
  | 'not_paid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refund_pending'
  | 'partially_refunded'
  | 'refunded'
  | 'success';

export type LicenceVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface BookingStatusHistoryItem {
  status: BookingStatus;
  timestamp: string;
  note: string;
  updatedBy?: string;
}

export interface PricingSnapshot {
  rentalDurationDays: number;
  dailyRate: number;
  baseRental: number;
  doorstepDeliveryFee: number;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  securityDeposit: number;
  insuranceFee: number;
  discountAmount: number;
  totalAmount: number;
}

export interface Booking {
  id: string;
  bookingCode?: string;
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
  pickupLocationId?: string;
  returnLocation: string;
  returnLocationId?: string;
  deliveryType: 'hub' | 'doorstep';
  deliveryAddress?: string;
  durationDays: number;
  pricingSnapshot?: PricingSnapshot;
  rentalCharges: number;
  securityDeposit: number;
  gstAmount: number;
  insuranceFee: number;
  additionalCharges?: number;
  discountAmount?: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  licenceStatus: LicenceVerificationStatus;
  licenceNumber?: string;
  licenceFrontImage?: string;
  licenceBackImage?: string;
  paymentDeadline?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  pickupOtp?: string;
  returnOtp?: string;
  createdAt: string;
  updatedAt?: string;
  statusHistory: BookingStatusHistoryItem[];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

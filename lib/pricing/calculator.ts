/**
 * RENTRIDE SERVER-SIDE PRICING ENGINE
 * Calculates rental charges, configurable GST, refundable security deposits,
 * insurance, doorstep delivery, and dynamic weekend surge rates.
 * NEVER trusts prices submitted from client browsers.
 */

import { Vehicle } from '@/types/vehicle';
import { PricingSnapshot } from '@/types/booking';

export interface PricingOptions {
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:mm
  returnDate: string; // YYYY-MM-DD
  returnTime: string; // HH:mm
  deliveryType: 'hub' | 'doorstep';
  appliedDiscountPercent?: number;
  customGstRate?: number; // default 18%
  customDoorstepFee?: number; // default ₹299
  customCarInsuranceFee?: number; // default ₹499
  customBikeInsuranceFee?: number; // default ₹199
  weekendSurgePercent?: number; // default 0 unless configured/weekend
}

export function calculateRentalDays(
  pickupDate: string,
  pickupTime: string,
  returnDate: string,
  returnTime: string
): number {
  const start = new Date(`${pickupDate}T${pickupTime || '09:00'}:00`).getTime();
  const end = new Date(`${returnDate}T${returnTime || '18:00'}:00`).getTime();

  if (isNaN(start) || isNaN(end) || end <= start) {
    return 1;
  }

  const diffHours = (end - start) / (1000 * 60 * 60);
  const days = Math.ceil(diffHours / 24);
  return Math.max(1, days);
}

export function calculateBookingPrice(
  vehicle: Vehicle,
  options: PricingOptions
): PricingSnapshot {
  const days = calculateRentalDays(
    options.pickupDate,
    options.pickupTime,
    options.returnDate,
    options.returnTime
  );

  const dailyRate = vehicle.pricePerDay;
  const baseRental = dailyRate * days;
  const doorstepDeliveryFee =
    options.deliveryType === 'doorstep' ? (options.customDoorstepFee ?? 299) : 0;
  const insuranceFee =
    vehicle.type === 'car'
      ? (options.customCarInsuranceFee ?? 499)
      : (options.customBikeInsuranceFee ?? 199);

  const subtotalBeforeTax = baseRental + doorstepDeliveryFee;

  const discountPercent = options.appliedDiscountPercent || 0;
  const discountAmount = Math.round((subtotalBeforeTax * discountPercent) / 100);

  const taxableAmount = Math.max(0, subtotalBeforeTax - discountAmount);

  // Configurable GST (default 18% = 9% CGST + 9% SGST)
  const gstRate = options.customGstRate ?? 18;
  const gstAmount = Math.round((taxableAmount * gstRate) / 100);

  // Refundable Security Deposit (NOT treated as earned revenue)
  const securityDeposit = vehicle.securityDeposit;

  // Total payable amount by customer
  const totalAmount = taxableAmount + gstAmount + insuranceFee + securityDeposit;

  return {
    rentalDurationDays: days,
    dailyRate,
    baseRental,
    doorstepDeliveryFee,
    subtotal: subtotalBeforeTax,
    gstRate,
    gstAmount,
    securityDeposit,
    insuranceFee,
    discountAmount,
    totalAmount,
  };
}

/**
 * Formats amount into Indian Rupees (INR) with standard comma groupings (e.g. ₹1,499)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

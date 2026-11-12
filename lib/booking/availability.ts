/**
 * RENTRIDE DOUBLE-BOOKING PREVENTION ENGINE
 * Enforces atomic availability checks and prevents conflicting reservations.
 * Overlap formula: (Existing_Pickup < Requested_Return) AND (Existing_Return > Requested_Pickup)
 */

import { Booking, BookingStatus } from '@/types/booking';
import { BlockedDateRange } from '@/types';

// Active booking statuses that lock the vehicle
export const ACTIVE_BLOCKING_STATUSES: BookingStatus[] = [
  'approved_pending_payment',
  'approved',
  'confirmed',
  'active',
  'awaiting_inspection',
  'submitted',
  'awaiting_licence',
  'pending_review',
];

export interface AvailabilityCheckParams {
  vehicleId: string;
  requestedPickup: string; // ISO string or YYYY-MM-DDTHH:mm
  requestedReturn: string; // ISO string or YYYY-MM-DDTHH:mm
  existingBookings: Booking[];
  blockedDates?: BlockedDateRange[];
  excludeBookingId?: string; // for updates/edits
}

export interface AvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  conflictingBookingId?: string;
  conflictingDates?: {
    start: string;
    end: string;
  };
}

export function checkVehicleAvailability({
  vehicleId,
  requestedPickup,
  requestedReturn,
  existingBookings,
  blockedDates = [],
  excludeBookingId,
}: AvailabilityCheckParams): AvailabilityResult {
  const reqStart = new Date(requestedPickup).getTime();
  const reqEnd = new Date(requestedReturn).getTime();

  if (isNaN(reqStart) || isNaN(reqEnd)) {
    return { isAvailable: false, reason: 'Invalid date/time format provided.' };
  }

  if (reqEnd <= reqStart) {
    return { isAvailable: false, reason: 'Return date and time must be after pickup date and time.' };
  }

  // 1. Check against maintenance blocks (inclusive YYYY-MM-DD range matching DB create_booking_atomic)
  const reqStartDateStr = requestedPickup.slice(0, 10);
  const reqEndDateStr = requestedReturn.slice(0, 10);

  for (const block of blockedDates) {
    if (block.vehicleId === vehicleId) {
      const blockStartStr = block.startDate.slice(0, 10);
      const blockEndStr = block.endDate.slice(0, 10);

      // Overlap: blockStart <= reqEndDate AND blockEnd >= reqStartDate
      if (blockStartStr <= reqEndDateStr && blockEndStr >= reqStartDateStr) {
        return {
          isAvailable: false,
          reason: `Vehicle is scheduled for ${block.reason} between ${block.startDate} and ${block.endDate}.`,
          conflictingDates: {
            start: block.startDate,
            end: block.endDate,
          },
        };
      }
    }
  }

  // 2. Check against active reservations
  for (const booking of existingBookings) {
    if (booking.vehicleId !== vehicleId) continue;
    if (excludeBookingId && booking.id === excludeBookingId) continue;

    // Only active, approved, or pending review bookings hold the slot
    if (!ACTIVE_BLOCKING_STATUSES.includes(booking.bookingStatus)) {
      continue;
    }

    const existStart = new Date(`${booking.pickupDate}T${booking.pickupTime || '09:00'}:00`).getTime();
    const existEnd = new Date(`${booking.returnDate}T${booking.returnTime || '18:00'}:00`).getTime();

    // Standard interval overlap condition
    if (existStart < reqEnd && existEnd > reqStart) {
      return {
        isAvailable: false,
        reason: `Vehicle already has an active reservation (${booking.id}) during the requested period.`,
        conflictingBookingId: booking.id,
        conflictingDates: {
          start: `${booking.pickupDate} ${booking.pickupTime}`,
          end: `${booking.returnDate} ${booking.returnTime}`,
        },
      };
    }
  }

  return { isAvailable: true };
}

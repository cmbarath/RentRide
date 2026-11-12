/**
 * BOOKING SERVICE
 * Handles server-side booking creation, atomic double-booking protection via PostgreSQL RPC,
 * admin approval/rejection, trip lifecycle transitions, and status history tracking.
 */

import { Booking, BookingStatus } from '@/types/booking';
import { checkVehicleAvailability } from '@/lib/booking/availability';
import { calculateBookingPrice } from '@/lib/pricing/calculator';
import { VehicleService } from './vehicle.service';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { mapBookingFromDb, mapBookingToDb } from '@/lib/supabase/mappers';
import type { SupabaseClient } from '@supabase/supabase-js';

function resolveClient(client?: SupabaseClient): SupabaseClient {
  if (client) return client;
  return createClient();
}

function resolveAdminClient(client?: SupabaseClient): SupabaseClient {
  if (client) return client;
  if (typeof window === 'undefined' && isAdminConfigured()) {
    return createAdminClient();
  }
  return createClient();
}

export class BookingService {
  /**
   * Retrieves bookings with optional status/user/vehicle filters and status history.
   * Preserves user-scoped client so PostgreSQL RLS enforces tenant isolation.
   */
  static async getBookings(
    filter?: {
      status?: BookingStatus;
      userId?: string;
      vehicleId?: string;
    },
    client?: SupabaseClient
  ): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      const supabase = resolveClient(client);
      let query = supabase
        .from('bookings')
        .select('*, booking_status_history(status, note, created_at)')
        .order('created_at', { ascending: false });

      if (filter?.status) {
        query = query.eq('booking_status', filter.status);
      }
      if (filter?.userId) {
        query = query.eq('user_id', filter.userId);
      }
      if (filter?.vehicleId) {
        query = query.eq('vehicle_id', filter.vehicleId);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message || 'Failed to retrieve bookings.');
      }

      return (data || []).map((row: any) => {
        const mapped = mapBookingFromDb(row);
        if (Array.isArray(row.booking_status_history)) {
          mapped.statusHistory = row.booking_status_history
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((h: any) => ({
              status: h.status,
              timestamp: new Date(h.created_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              note: h.note || '',
            }));
        }
        return mapped;
      });
    }

    return [];
  }

  /**
   * Retrieves a single booking by ID with hydrated status history
   */
  static async getBookingById(bookingId: string, client?: SupabaseClient): Promise<Booking | null> {
    if (isSupabaseConfigured()) {
      const supabase = resolveClient(client);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message || 'Failed to fetch booking.');
      }
      if (!data) return null;

      const booking = mapBookingFromDb(data);

      const { data: history } = await supabase
        .from('booking_status_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (history && history.length > 0) {
        booking.statusHistory = history.map((h: any) => ({
          status: h.status,
          timestamp: new Date(h.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          note: h.note || '',
        }));
      }

      return booking;
    }

    return null;
  }

  /**
   * Submits a new booking with strict server-side pricing and atomic PostgreSQL overlap checks
   */
  static async createBooking(
    bookingData: {
      vehicleId: string;
      pickupDate: string;
      pickupTime: string;
      returnDate: string;
      returnTime: string;
      pickupLocation: string;
      pickupLocationId?: string;
      returnLocation: string;
      deliveryType: 'hub' | 'doorstep';
      deliveryAddress?: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      customerId?: string;
      licenceNumber?: string;
      licenceFrontImage?: string;
      licenceBackImage?: string;
    },
    client?: SupabaseClient
  ): Promise<{ success: boolean; bookingId?: string; pickupOtp?: string; booking?: Booking | null; error?: string }> {
    const vehicle = await VehicleService.getVehicleById(bookingData.vehicleId);
    if (!vehicle) {
      return { success: false, error: 'Selected vehicle does not exist.' };
    }

    const pickupDt = new Date(`${bookingData.pickupDate}T${bookingData.pickupTime || '09:00'}:00`);
    const returnDt = new Date(`${bookingData.returnDate}T${bookingData.returnTime || '18:00'}:00`);
    if (Number.isNaN(pickupDt.getTime()) || Number.isNaN(returnDt.getTime()) || returnDt <= pickupDt) {
      return { success: false, error: 'Return date & time must be after pickup date & time.' };
    }

    // 1. Resolve active pricing rules from DB (never trust frontend amounts)
    let customGstRate = 18;
    let customDoorstepFee = 299;
    let customCarInsuranceFee = 499;
    let customBikeInsuranceFee = 199;

    if (isSupabaseConfigured()) {
      const supabase = resolveClient(client);
      const { data: rules } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (rules && rules.length > 0) {
        const rule = rules[0];
        if (rule.gst_percentage !== null && rule.gst_percentage !== undefined) {
          customGstRate = Number(rule.gst_percentage);
        }
        if (rule.doorstep_delivery_fee !== null && rule.doorstep_delivery_fee !== undefined) {
          customDoorstepFee = Number(rule.doorstep_delivery_fee);
        }
        if (rule.car_insurance_fee !== null && rule.car_insurance_fee !== undefined) {
          customCarInsuranceFee = Number(rule.car_insurance_fee);
        }
        if (rule.bike_insurance_fee !== null && rule.bike_insurance_fee !== undefined) {
          customBikeInsuranceFee = Number(rule.bike_insurance_fee);
        }
      }
    }

    const pricing = calculateBookingPrice(vehicle, {
      pickupDate: bookingData.pickupDate,
      pickupTime: bookingData.pickupTime,
      returnDate: bookingData.returnDate,
      returnTime: bookingData.returnTime,
      deliveryType: bookingData.deliveryType,
      customGstRate,
      customDoorstepFee,
      customCarInsuranceFee,
      customBikeInsuranceFee,
    });

    const bookingId = `RR-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-3)}`;

    // 2. Execute PostgreSQL create_booking_atomic() (row-level locking + date overlap + maintenance blackouts)
    if (isSupabaseConfigured()) {
      const supabase = resolveClient(client);
      const { data, error } = await supabase.rpc('create_booking_atomic', {
        p_booking_id: bookingId,
        p_user_id: bookingData.customerId && bookingData.customerId.includes('-') ? bookingData.customerId : null,
        p_vehicle_id: vehicle.id,
        p_pickup_date: bookingData.pickupDate,
        p_pickup_time: bookingData.pickupTime || '09:00:00',
        p_return_date: bookingData.returnDate,
        p_return_time: bookingData.returnTime || '18:00:00',
        p_pickup_location_id: bookingData.pickupLocationId || null,
        p_pickup_location: bookingData.pickupLocation,
        p_return_location_id: null,
        p_return_location: bookingData.returnLocation,
        p_delivery_type: bookingData.deliveryType,
        p_delivery_address: bookingData.deliveryAddress || null,
        p_customer_name: bookingData.customerName,
        p_customer_email: bookingData.customerEmail,
        p_customer_phone: bookingData.customerPhone,
        p_licence_id: null,
        p_licence_number: bookingData.licenceNumber || null,
        p_duration_days: pricing.rentalDurationDays,
        p_rental_charges: pricing.baseRental,
        p_security_deposit: pricing.securityDeposit,
        p_tax_amount: pricing.gstAmount,
        p_insurance_fee: pricing.insuranceFee,
        p_total_amount: pricing.totalAmount,
        p_pricing_snapshot: pricing,
      });

      if (error) {
        return { success: false, error: error.message || 'Database rejected booking request.' };
      }
      if (data && !data.success) {
        return { success: false, error: data.error || 'Vehicle unavailable for the selected dates.' };
      }

      const createdBooking = await this.getBookingById(bookingId, supabase);
      return {
        success: true,
        bookingId,
        pickupOtp: data?.pickup_otp || createdBooking?.pickupOtp,
        booking: createdBooking,
      };
    }

    // Fallback check when Supabase is not configured in offline local mode
    const currentBookings = await this.getBookings({}, client);
    const availability = checkVehicleAvailability({
      vehicleId: vehicle.id,
      requestedPickup: `${bookingData.pickupDate}T${bookingData.pickupTime || '09:00'}:00`,
      requestedReturn: `${bookingData.returnDate}T${bookingData.returnTime || '18:00'}:00`,
      existingBookings: currentBookings,
    });
    if (!availability.isAvailable) {
      return { success: false, error: availability.reason || 'Vehicle is not available for selected dates.' };
    }

    return { success: true, bookingId };
  }

  /**
   * Admin approves booking and verifies driving licence (keeps payment_status separate at 'pending')
   */
  static async approveBooking(bookingId: string, client?: SupabaseClient): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = resolveAdminClient(client);
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_status: 'confirmed',
          licence_status: 'verified',
          payment_status: 'pending',
        })
        .eq('id', bookingId);

      if (error) {
        throw new Error(error.message || 'Failed to approve booking.');
      }

      await supabase.from('booking_status_history').insert([
        {
          booking_id: bookingId,
          status: 'confirmed',
          note: 'Admin verified driving licence and approved reservation. Digital pickup pass issued for hub handover (Counter settlement pending).',
        },
      ]);
    }
    return true;
  }

  /**
   * Admin rejects booking with explicit audit reason
   */
  static async rejectBooking(bookingId: string, reason: string, client?: SupabaseClient): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = resolveAdminClient(client);
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_status: 'rejected',
          licence_status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', bookingId);

      if (error) {
        throw new Error(error.message || 'Failed to reject booking.');
      }

      await supabase.from('booking_status_history').insert([
        {
          booking_id: bookingId,
          status: 'rejected',
          note: `Booking rejected by administrator: ${reason}`,
        },
      ]);
    }
    return true;
  }

  /**
   * Confirms in-person/counter payment independently of booking approval transitions
   */
  static async confirmPayment(bookingId: string, paymentMethod: string, client?: SupabaseClient): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = resolveAdminClient(client);
      const { data: current } = await supabase
        .from('bookings')
        .select('booking_status')
        .eq('id', bookingId)
        .maybeSingle();

      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
        })
        .eq('id', bookingId);

      if (error) {
        throw new Error(error.message || 'Failed to confirm counter payment.');
      }

      await supabase.from('booking_status_history').insert([
        {
          booking_id: bookingId,
          status: current?.booking_status || 'confirmed',
          note: `Counter payment confirmed via ${paymentMethod}.`,
        },
      ]);
    }
    return true;
  }

  /**
   * General booking lifecycle transition (cancelled, active, completed) with audit history
   */
  static async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    note?: string,
    client?: SupabaseClient
  ): Promise<boolean> {
    if (status === 'approved_pending_payment') {
      return this.approveBooking(bookingId, client);
    }
    if (status === 'rejected') {
      return this.rejectBooking(bookingId, note || 'Booking rejected by administrator', client);
    }

    if (isSupabaseConfigured()) {
      const supabase = resolveClient(client);
      const updatePayload: Record<string, unknown> = { booking_status: status };
      if (status === 'cancelled' && note) {
        updatePayload.cancellation_reason = note;
      }

      const { data: updatedRow, error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId)
        .select('id')
        .maybeSingle();

      if (error || !updatedRow) {
        throw new Error(error?.message || `Booking ${bookingId} status update was not permitted or not found.`);
      }

      await supabase.from('booking_status_history').insert([
        {
          booking_id: bookingId,
          status,
          note: note || `Booking status updated to ${status}`,
        },
      ]);
    }

    return true;
  }
}

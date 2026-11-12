import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/booking.service';
import { requireAuthUser, requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const UpdateBookingSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel', 'activate', 'complete', 'confirm_payment']),
  reason: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthUser(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: bookingId } = await params;
    const booking = await BookingService.getBookingById(bookingId, authResult.supabase);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (!authResult.isAdmin && booking.customerId !== authResult.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view this booking.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await req.json();
    const validated = UpdateBookingSchema.parse(body);

    // Customer cancellation: owner or admin can cancel
    if (validated.action === 'cancel') {
      const authResult = await requireAuthUser(req);
      if (!authResult.success) {
        return authResult.response;
      }

      const booking = await BookingService.getBookingById(bookingId, authResult.supabase);
      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      if (!authResult.isAdmin && booking.customerId !== authResult.user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You can only cancel your own bookings.' },
          { status: 403 }
        );
      }

      const terminalStatuses = ['completed', 'cancelled', 'rejected', 'expired'];
      if (terminalStatuses.includes(booking.bookingStatus) || (!authResult.isAdmin && booking.bookingStatus === 'active')) {
        return NextResponse.json(
          { success: false, error: `Cannot cancel a booking in '${booking.bookingStatus}' status.` },
          { status: 400 }
        );
      }

      // Use restricted admin client AFTER strict ownership & state verification so PostgreSQL RLS
      // remains locked against direct customer table mutations while legitimate cancellation persists.
      await BookingService.updateBookingStatus(
        bookingId,
        'cancelled',
        validated.reason || 'Booking cancelled. Slot released.',
        createAdminClient()
      );
      return NextResponse.json({ success: true, message: 'Booking cancelled successfully.' });
    }

    // Privileged actions require verified administrator role
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    if (validated.action === 'approve') {
      await BookingService.approveBooking(bookingId, adminAuth.adminClient);
      await recordAdminAuditLog({
        adminId: adminAuth.user.id,
        action: 'approve_booking',
        entityType: 'booking',
        entityId: bookingId,
      });
      return NextResponse.json({
        success: true,
        message: 'Booking approved and confirmed. Digital handover pass issued for counter pickup.',
      });
    }

    if (validated.action === 'reject') {
      if (!validated.reason) {
        return NextResponse.json({ success: false, error: 'A rejection reason is mandatory.' }, { status: 400 });
      }
      await BookingService.rejectBooking(bookingId, validated.reason, adminAuth.adminClient);
      await recordAdminAuditLog({
        adminId: adminAuth.user.id,
        action: 'reject_booking',
        entityType: 'booking',
        entityId: bookingId,
        metadata: { reason: validated.reason },
      });
      return NextResponse.json({ success: true, message: 'Booking rejected and customer notified.' });
    }

    if (validated.action === 'activate') {
      await BookingService.updateBookingStatus(
        bookingId,
        'active',
        validated.reason || 'Vehicle keys handed over at hub. Trip active.',
        adminAuth.adminClient
      );
      await recordAdminAuditLog({
        adminId: adminAuth.user.id,
        action: 'activate_booking',
        entityType: 'booking',
        entityId: bookingId,
      });
      return NextResponse.json({ success: true, message: 'Vehicle handed over. Booking is now active.' });
    }

    if (validated.action === 'complete') {
      await BookingService.updateBookingStatus(
        bookingId,
        'completed',
        validated.reason || 'Vehicle returned and inspection completed safely.',
        adminAuth.adminClient
      );
      await recordAdminAuditLog({
        adminId: adminAuth.user.id,
        action: 'complete_booking',
        entityType: 'booking',
        entityId: bookingId,
      });
      return NextResponse.json({ success: true, message: 'Booking marked completed.' });
    }

    if (validated.action === 'confirm_payment') {
      await BookingService.confirmPayment(
        bookingId,
        validated.paymentMethod || 'Cash at Counter',
        adminAuth.adminClient
      );
      await recordAdminAuditLog({
        adminId: adminAuth.user.id,
        action: 'confirm_counter_payment',
        entityType: 'booking',
        entityId: bookingId,
        metadata: { paymentMethod: validated.paymentMethod || 'Cash at Counter' },
      });
      return NextResponse.json({ success: true, message: 'Counter payment status marked paid.' });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action.' }, { status: 400 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0]?.message || 'Validation error' },
        { status: 422 }
      );
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

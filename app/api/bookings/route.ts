import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/booking.service';
import { NotificationService } from '@/services/notification.service';
import { requireAuthUser } from '@/lib/supabase/auth-guard';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { z } from 'zod';

const CreateBookingSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid pickup date is required'),
  pickupTime: z.string().default('09:00'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid return date is required'),
  returnTime: z.string().default('18:00'),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  pickupLocationId: z.string().optional(),
  returnLocation: z.string().min(1, 'Return location is required'),
  deliveryType: z.enum(['hub', 'doorstep']).default('hub'),
  deliveryAddress: z.string().optional(),
  customerName: z.string().min(2, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(10, 'Valid 10-digit phone number is required'),
  customerId: z.string().optional(),
  licenceNumber: z.string().optional(),
  licenceFrontImage: z.string().optional(),
  licenceBackImage: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthUser(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any;
    const vehicleId = searchParams.get('vehicleId') || undefined;

    // Strict tenant isolation: Non-admin customers can ONLY access their own bookings.
    let targetUserId: string | undefined = authResult.user.id;
    if (authResult.isAdmin) {
      targetUserId = searchParams.get('userId') || undefined;
    }

    const bookings = await BookingService.getBookings(
      {
        status,
        userId: targetUserId,
        vehicleId,
      },
      authResult.supabase
    );

    return NextResponse.json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error fetching bookings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthUser(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await req.json();
    const validated = CreateBookingSchema.parse(body);

    // Bind bookings strictly to the authenticated user identity
    validated.customerId = authResult.user.id;

    const result = await BookingService.createBooking(validated, authResult.supabase);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Create internal fleet-admin notification securely via server admin client after atomic booking succeeds
    if (isAdminConfigured() && result.booking) {
      try {
        await NotificationService.notifyAdminNewBooking(result.booking, createAdminClient());
      } catch (notifErr) {
        console.warn('Non-fatal notification log warning:', notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      bookingId: result.bookingId,
      pickupOtp: result.pickupOtp,
      booking: result.booking,
      message: 'Booking request submitted successfully! Awaiting fleet manager review.',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0]?.message || 'Validation error' },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error processing booking' },
      { status: 500 }
    );
  }
}

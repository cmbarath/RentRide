import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, getAuthContext } from '@/lib/supabase/auth-guard';
import { createClient as createAnonClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { recalculateVehicleRating } from '@/lib/reviews/recalculate-rating';
import { z } from 'zod';

const SubmitReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5 stars'),
  comment: z.string().min(5, 'Review comment must be at least 5 characters'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');
    const authCtx = await getAuthContext(req);

    if (isSupabaseConfigured()) {
      const supabase = authCtx.supabase || createAnonClient();
      let query = supabase.from('reviews').select('*');

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      // Non-admins only see approved reviews
      if (!authCtx.isAdmin) {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        const total = data.length;
        const avgRating = total > 0 ? (data.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : 5.0;

        return NextResponse.json({
          success: true,
          total,
          averageRating: Number(avgRating),
          reviews: data,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: 0,
      averageRating: 5.0,
      reviews: [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthUser(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.user.id;
    const body = await req.json();
    const validated = SubmitReviewSchema.parse(body);

    // 1. Validate booking eligibility: Booking must exist, belong to this user, and be for this vehicle
    const { data: booking, error: bErr } = await authResult.supabase
      .from('bookings')
      .select('id, user_id, vehicle_id, customer_name')
      .eq('id', validated.bookingId)
      .single();

    if (bErr || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found or not accessible.' },
        { status: 404 }
      );
    }

    if (booking.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only review bookings made from your own account.' },
        { status: 403 }
      );
    }

    if (booking.vehicle_id !== validated.vehicleId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle ID does not match this booking reservation.' },
        { status: 400 }
      );
    }

    // 2. Prevent duplicate reviews: Check if review already exists for this booking_id
    const { data: existingReview } = await authResult.supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', validated.bookingId)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'A review has already been submitted for this rental booking.' },
        { status: 409 }
      );
    }

    // 3. Insert review
    const customerName = booking.customer_name || authResult.user.user_metadata?.full_name || 'Verified Customer';
    const { data: newReview, error: revErr } = await authResult.supabase
      .from('reviews')
      .insert([
        {
          booking_id: validated.bookingId,
          vehicle_id: validated.vehicleId,
          user_id: userId,
          user_name: customerName,
          rating: validated.rating,
          comment: validated.comment,
          is_approved: true, // auto-approved or admin moderated
        },
      ])
      .select()
      .single();

    if (revErr) {
      return NextResponse.json({ success: false, error: revErr.message }, { status: 400 });
    }

    // 4. Update vehicle aggregate rating in public.vehicles via server admin client
    try {
      if (isAdminConfigured()) {
        await recalculateVehicleRating(createAdminClient(), validated.vehicleId);
      }
    } catch {
      // Aggregate update failure non-fatal
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! Your verified rental review has been published.',
        review: newReview,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message || 'Validation error' }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

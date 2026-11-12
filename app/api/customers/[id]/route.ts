import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/supabase/auth-guard';
import { BookingService } from '@/services/booking.service';
import { mapCustomerFromDb } from '@/lib/supabase/mappers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthUser(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: customerId } = await params;

    // Strict customer isolation: non-admin can only query their own customer ID
    if (!authResult.isAdmin && customerId !== authResult.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access denied to other customer profiles.' },
        { status: 403 }
      );
    }

    const { data: profile, error } = await authResult.supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const bookings = await BookingService.getBookings({ userId: customerId }, authResult.supabase);

    return NextResponse.json({
      success: true,
      customer: mapCustomerFromDb(profile),
      bookings,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

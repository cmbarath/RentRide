import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/supabase/auth-guard';
import { BookingService } from '@/services/booking.service';
import { mapCustomerFromDb } from '@/lib/supabase/mappers';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be under 100 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s\-()]{10,18}$/, 'Please enter a valid 10-digit phone number')
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthUser(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.user.id;
    const { data: profile, error } = await authResult.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // Fetch user's bookings
    const bookings = await BookingService.getBookings({ userId }, authResult.supabase);

    return NextResponse.json({
      success: true,
      profile: mapCustomerFromDb(profile),
      totalBookings: bookings.length,
      bookings,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuthUser(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.user.id;
    const body = await req.json();

    // Explicitly block privilege escalation or KYC status tampering
    if (
      body &&
      typeof body === 'object' &&
      ('role' in body ||
        'licenceStatus' in body ||
        'licence_verification_status' in body ||
        'id' in body ||
        'email' in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Forbidden: Customers cannot modify account role, email, or licence verification status directly.',
        },
        { status: 403 }
      );
    }

    const validated = UpdateProfileSchema.parse(body);

    const updateData: Record<string, any> = {};
    if (validated.fullName !== undefined) updateData.full_name = validated.fullName;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.avatarUrl !== undefined) updateData.avatar_url = validated.avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No permitted profile fields supplied to update.' },
        { status: 400 }
      );
    }

    // RLS policy "Users can update own profile" enforces auth.uid() = id AND role = 'customer'
    // (or Admins can update own profile via is_admin())
    const { data, error } = await authResult.supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profile: mapCustomerFromDb(data),
      message: 'Profile updated successfully',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message || 'Validation error' }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { recalculateVehicleRating } from '@/lib/reviews/recalculate-rating';
import { z } from 'zod';

const ModerateReviewSchema = z.object({
  isApproved: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const { id } = await params;
    const body = await req.json();
    const validated = ModerateReviewSchema.parse(body);

    const { data, error } = await adminAuth.adminClient
      .from('reviews')
      .update({ is_approved: validated.isApproved })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: error?.message || 'Review not found' }, { status: error ? 400 : 404 });
    }

    if (data.vehicle_id) {
      await recalculateVehicleRating(adminAuth.adminClient, data.vehicle_id);
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'moderate_review',
      entityType: 'review',
      entityId: id,
      metadata: { isApproved: validated.isApproved },
    });

    return NextResponse.json({ success: true, review: data, message: 'Review moderation updated.' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message || 'Validation error' }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const { id } = await params;
    const { data: deleted, error } = await adminAuth.adminClient
      .from('reviews')
      .delete()
      .eq('id', id)
      .select('id, vehicle_id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    if (deleted.vehicle_id) {
      await recalculateVehicleRating(adminAuth.adminClient, deleted.vehicle_id);
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'delete_review',
      entityType: 'review',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Review deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

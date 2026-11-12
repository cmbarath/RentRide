import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { z } from 'zod';

const UpdateLocationSchema = z.object({
  displayName: z.string().optional(),
  address: z.string().optional(),
  landmark: z.string().optional(),
  operatingHours: z.string().optional(),
  contactNumber: z.string().optional(),
  isActive: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data, error } = await supabase.from('pickup_locations').select('*').eq('id', id).single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, location: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

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
    const validated = UpdateLocationSchema.parse(body);

    const updatePayload: Record<string, any> = {};
    if (validated.displayName !== undefined) updatePayload.display_name = validated.displayName;
    if (validated.address !== undefined) updatePayload.address = validated.address;
    if (validated.landmark !== undefined) updatePayload.landmark = validated.landmark;
    if (validated.operatingHours !== undefined) updatePayload.operating_hours = validated.operatingHours;
    if (validated.contactNumber !== undefined) updatePayload.contact_number = validated.contactNumber;
    if (validated.isActive !== undefined) updatePayload.is_active = validated.isActive;
    if (validated.latitude !== undefined) updatePayload.latitude = validated.latitude;
    if (validated.longitude !== undefined) updatePayload.longitude = validated.longitude;

    const { data, error } = await adminAuth.adminClient
      .from('pickup_locations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'update_pickup_location',
      entityType: 'pickup_location',
      entityId: id,
      metadata: updatePayload,
    });

    return NextResponse.json({ success: true, location: data, message: 'Location updated successfully' });
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

    // Soft delete / disable
    const { error } = await adminAuth.adminClient
      .from('pickup_locations')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'disable_pickup_location',
      entityType: 'pickup_location',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Location disabled successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

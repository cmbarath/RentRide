import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { z } from 'zod';

const UpdateMaintenanceSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date required').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid end date required').optional(),
  reason: z.enum(['maintenance', 'vip_reservation', 'inspection', 'relocation']).optional(),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional(),
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
    const validated = UpdateMaintenanceSchema.parse(body);

    const { data: existing, error: fetchErr } = await adminAuth.adminClient
      .from('vehicle_maintenance')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: 'Maintenance record not found' }, { status: 404 });
    }

    const nextStart = validated.startDate ?? existing.start_date;
    const nextEnd = validated.endDate ?? existing.end_date;

    if (new Date(nextEnd) < new Date(nextStart)) {
      return NextResponse.json(
        { success: false, error: 'End date must be on or after the start date.' },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {};
    if (validated.startDate !== undefined) updatePayload.start_date = validated.startDate;
    if (validated.endDate !== undefined) updatePayload.end_date = validated.endDate;
    if (validated.reason !== undefined) updatePayload.reason = validated.reason;
    if (validated.notes !== undefined) updatePayload.notes = validated.notes;
    if (validated.isCompleted !== undefined) updatePayload.is_completed = validated.isCompleted;

    const { data, error } = await adminAuth.adminClient
      .from('vehicle_maintenance')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'update_maintenance_block',
      entityType: 'vehicle_maintenance',
      entityId: id,
      metadata: updatePayload,
    });

    return NextResponse.json({
      success: true,
      block: {
        id: data.id,
        vehicleId: data.vehicle_id,
        startDate: data.start_date,
        endDate: data.end_date,
        reason: data.reason,
        notes: data.notes || '',
        isCompleted: data.is_completed,
      },
      message: 'Maintenance block updated successfully.',
    });
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
    const { data, error } = await adminAuth.adminClient
      .from('vehicle_maintenance')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: 'Maintenance record not found' }, { status: 404 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'delete_maintenance_block',
      entityType: 'vehicle_maintenance',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Vehicle blackout block removed.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

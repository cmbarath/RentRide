import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { z } from 'zod';

const CreateMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date required'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid end date required'),
  reason: z.enum(['maintenance', 'vip_reservation', 'inspection', 'relocation']).default('maintenance'),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const { data, error } = await adminAuth.adminClient
      .from('vehicle_maintenance')
      .select('*')
      .eq('is_completed', false)
      .order('start_date', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const blockedDates = (data || []).map((row: any) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      startDate: row.start_date,
      endDate: row.end_date,
      reason: row.reason,
      notes: row.notes || '',
    }));

    return NextResponse.json({ success: true, total: blockedDates.length, blockedDates });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const body = await req.json();
    const validated = CreateMaintenanceSchema.parse(body);

    if (new Date(validated.endDate) < new Date(validated.startDate)) {
      return NextResponse.json(
        { success: false, error: 'End date must be on or after the start date.' },
        { status: 400 }
      );
    }

    const { data, error } = await adminAuth.adminClient
      .from('vehicle_maintenance')
      .insert([
        {
          vehicle_id: validated.vehicleId,
          start_date: validated.startDate,
          end_date: validated.endDate,
          reason: validated.reason,
          notes: validated.notes || null,
          is_completed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'create_maintenance_block',
      entityType: 'vehicle_maintenance',
      entityId: data.id,
      metadata: validated,
    });

    return NextResponse.json(
      {
        success: true,
        block: {
          id: data.id,
          vehicleId: data.vehicle_id,
          startDate: data.start_date,
          endDate: data.end_date,
          reason: data.reason,
          notes: data.notes || '',
        },
      },
      { status: 201 }
    );
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

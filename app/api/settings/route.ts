import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAnonClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { z } from 'zod';

const UpdateSettingsSchema = z.object({
  companyName: z.string().min(2).optional(),
  gstin: z.string().min(10).optional(),
  supportPhone: z.string().min(6).optional(),
  supportEmail: z.string().email().optional(),
  emergencyPhone: z.string().min(6).optional(),
  speedLimit: z.number().int().min(40).max(200).optional(),
  minDriverAge: z.number().int().min(18).max(30).optional(),
  fuelPolicy: z.enum(['same_to_same', 'full_to_full']).optional(),
  cancellationGraceHours: z.number().int().min(1).max(72).optional(),
});

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from('application_settings')
        .select(
          'id, company_name, gstin, support_phone, support_email, emergency_phone, speed_limit, min_driver_age, fuel_policy, cancellation_grace_hours, updated_at'
        )
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          settings: {
            id: data.id,
            companyName: data.company_name,
            gstin: data.gstin,
            supportPhone: data.support_phone,
            supportEmail: data.support_email,
            emergencyPhone: data.emergency_phone,
            speedLimit: data.speed_limit,
            minDriverAge: data.min_driver_age,
            fuelPolicy: data.fuel_policy,
            cancellationGraceHours: data.cancellation_grace_hours,
            updatedAt: data.updated_at,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: 'default',
        companyName: 'RentRide Mobility Private Limited',
        gstin: '33AABCR8721K1ZM',
        supportPhone: '+91 800-RENTRIDE',
        supportEmail: 'support@rentride.in',
        emergencyPhone: '1800-209-9090',
        speedLimit: 120,
        minDriverAge: 21,
        fuelPolicy: 'same_to_same',
        cancellationGraceHours: 6,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const body = await req.json();
    const validated = UpdateSettingsSchema.parse(body);

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (validated.companyName !== undefined) payload.company_name = validated.companyName;
    if (validated.gstin !== undefined) payload.gstin = validated.gstin;
    if (validated.supportPhone !== undefined) payload.support_phone = validated.supportPhone;
    if (validated.supportEmail !== undefined) payload.support_email = validated.supportEmail;
    if (validated.emergencyPhone !== undefined) payload.emergency_phone = validated.emergencyPhone;
    if (validated.speedLimit !== undefined) payload.speed_limit = validated.speedLimit;
    if (validated.minDriverAge !== undefined) payload.min_driver_age = validated.minDriverAge;
    if (validated.fuelPolicy !== undefined) payload.fuel_policy = validated.fuelPolicy;
    if (validated.cancellationGraceHours !== undefined) {
      payload.cancellation_grace_hours = validated.cancellationGraceHours;
    }

    const { data, error } = await adminAuth.adminClient
      .from('application_settings')
      .upsert({ id: 'default', ...payload })
      .select(
        'id, company_name, gstin, support_phone, support_email, emergency_phone, speed_limit, min_driver_age, fuel_policy, cancellation_grace_hours, updated_at'
      )
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'update_application_settings',
      entityType: 'application_settings',
      entityId: 'default',
      metadata: payload,
    });

    return NextResponse.json({
      success: true,
      settings: {
        id: data.id,
        companyName: data.company_name,
        gstin: data.gstin,
        supportPhone: data.support_phone,
        supportEmail: data.support_email,
        emergencyPhone: data.emergency_phone,
        speedLimit: data.speed_limit,
        minDriverAge: data.min_driver_age,
        fuelPolicy: data.fuel_policy,
        cancellationGraceHours: data.cancellation_grace_hours,
        updatedAt: data.updated_at,
      },
      message: 'Platform settings updated successfully.',
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

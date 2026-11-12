import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAnonClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { z } from 'zod';

const PricingRuleSchema = z.object({
  id: z.string().optional(),
  ruleName: z.string().min(2, 'Rule name is required'),
  targetType: z.enum(['all', 'car', 'bike', 'category', 'vehicle']).default('all'),
  targetValue: z.string().optional(),
  weekendSurgePercent: z.number().min(0).max(100).default(15.0),
  gstPercentage: z.number().min(0).max(50).default(18.0),
  doorstepDeliveryFee: z.number().min(0).default(299.0),
  carInsuranceFee: z.number().min(0).default(499.0),
  bikeInsuranceFee: z.number().min(0).default(199.0),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    if (isSupabaseConfigured()) {
      const supabase = createAnonClient();
      const { data, error } = await supabase.from('pricing_rules').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, total: data.length, rules: data });
      }
    }

    // Default system pricing rules
    return NextResponse.json({
      success: true,
      total: 1,
      rules: [
        {
          rule_name: 'Tamil Nadu Standard Statutory Pricing',
          target_type: 'all',
          weekend_surge_percent: 15.0,
          gst_percentage: 18.0,
          doorstep_delivery_fee: 299.0,
          car_insurance_fee: 499.0,
          bike_insurance_fee: 199.0,
          is_active: true,
        },
      ],
    });
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
    const validated = PricingRuleSchema.parse(body);

    const payload = {
      rule_name: validated.ruleName,
      target_type: validated.targetType,
      target_value: validated.targetValue || null,
      weekend_surge_percent: validated.weekendSurgePercent,
      gst_percentage: validated.gstPercentage,
      doorstep_delivery_fee: validated.doorstepDeliveryFee,
      car_insurance_fee: validated.carInsuranceFee,
      bike_insurance_fee: validated.bikeInsuranceFee,
      is_active: validated.isActive,
    };

    let result;
    if (validated.id) {
      result = await adminAuth.adminClient
        .from('pricing_rules')
        .update(payload)
        .eq('id', validated.id)
        .select()
        .single();
    } else {
      result = await adminAuth.adminClient
        .from('pricing_rules')
        .insert([payload])
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: validated.id ? 'update_pricing_rule' : 'create_pricing_rule',
      entityType: 'pricing_rule',
      entityId: result.data.id,
      metadata: payload,
    });

    return NextResponse.json({ success: true, rule: result.data }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message || 'Validation error' }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

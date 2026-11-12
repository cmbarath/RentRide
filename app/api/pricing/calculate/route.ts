import { NextRequest, NextResponse } from 'next/server';
import { VehicleService } from '@/services/vehicle.service';
import { calculateBookingPrice } from '@/lib/pricing/calculator';
import { createClient as createAnonClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { z } from 'zod';

const PricingQuerySchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid pickup date is required'),
  pickupTime: z.string().default('09:00'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid return date is required'),
  returnTime: z.string().default('18:00'),
  deliveryType: z.enum(['hub', 'doorstep']).default('hub'),
  appliedDiscountPercent: z.number().min(0).max(100).default(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = PricingQuerySchema.parse(body);

    const startDt = new Date(`${validated.pickupDate}T${validated.pickupTime || '09:00'}:00`);
    const endDt = new Date(`${validated.returnDate}T${validated.returnTime || '18:00'}:00`);
    if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime()) || endDt <= startDt) {
      return NextResponse.json(
        { success: false, error: 'Return date & time must be after pickup date & time.' },
        { status: 400 }
      );
    }

    const vehicle = await VehicleService.getVehicleById(validated.vehicleId);
    if (!vehicle) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }

    // Read active configured pricing & tax rules from Supabase pricing_rules table
    let customGstRate = 18;
    let customDoorstepFee = 299;
    let customCarInsuranceFee = 499;
    let customBikeInsuranceFee = 199;
    let weekendSurgePercent = 15;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAnonClient();
        const { data: rules } = await supabase
          .from('pricing_rules')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (rules && rules.length > 0) {
          const rule = rules[0];
          if (rule.gst_percentage !== null && rule.gst_percentage !== undefined) {
            customGstRate = Number(rule.gst_percentage);
          }
          if (rule.doorstep_delivery_fee !== null && rule.doorstep_delivery_fee !== undefined) {
            customDoorstepFee = Number(rule.doorstep_delivery_fee);
          }
          if (rule.car_insurance_fee !== null && rule.car_insurance_fee !== undefined) {
            customCarInsuranceFee = Number(rule.car_insurance_fee);
          }
          if (rule.bike_insurance_fee !== null && rule.bike_insurance_fee !== undefined) {
            customBikeInsuranceFee = Number(rule.bike_insurance_fee);
          }
          if (rule.weekend_surge_percent !== null && rule.weekend_surge_percent !== undefined) {
            weekendSurgePercent = Number(rule.weekend_surge_percent);
          }
        }
      } catch (err) {
        console.warn('Supabase pricing rule fetch fallback:', err);
      }
    }

    const pricing = calculateBookingPrice(vehicle, {
      pickupDate: validated.pickupDate,
      pickupTime: validated.pickupTime,
      returnDate: validated.returnDate,
      returnTime: validated.returnTime,
      deliveryType: validated.deliveryType,
      appliedDiscountPercent: validated.appliedDiscountPercent,
      customGstRate,
      customDoorstepFee,
      customCarInsuranceFee,
      customBikeInsuranceFee,
      weekendSurgePercent,
    });

    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message || 'Validation error' }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

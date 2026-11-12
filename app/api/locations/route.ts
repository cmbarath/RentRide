import { NextRequest, NextResponse } from 'next/server';
import { TN_CITIES, getAllTNHubs } from '@/lib/tn-locations';
import { createClient as createAnonClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getAuthContext, requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { z } from 'zod';

const CreateLocationSchema = z.object({
  id: z.string().optional(),
  cityId: z.string().min(1, 'City ID is required'),
  cityName: z.string().min(1, 'City name is required'),
  areaName: z.string().min(1, 'Area name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  address: z.string().min(5, 'Full address is required'),
  landmark: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit Tamil Nadu PIN code is required'),
  operatingHours: z.string().default('06:00 AM - 11:30 PM (All 7 Days)'),
  contactNumber: z.string().min(10, 'Contact number is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get('cityId');
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    if (isSupabaseConfigured()) {
      const authCtx = await getAuthContext(req);
      const supabase = authCtx.isAdmin ? authCtx.supabase : createAnonClient();
      let query = supabase.from('pickup_locations').select('*');

      if (activeOnly || !authCtx.isAdmin) {
        query = query.eq('is_active', true);
      }
      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query.order('city_name').order('area_name');

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      let locations = (data || []).map((row: any) => ({
        id: row.id,
        cityId: row.city_id,
        cityName: row.city_name,
        areaName: row.area_name,
        displayName: row.display_name,
        address: row.address,
        landmark: row.landmark,
        pincode: row.pincode,
        operatingHours: row.operating_hours,
        contactNumber: row.contact_number,
        isActive: row.is_active,
        latitude: Number(row.latitude) || undefined,
        longitude: Number(row.longitude) || undefined,
      }));

      if (search) {
        const q = search.toLowerCase();
        locations = locations.filter(
          (l: any) =>
            l.displayName.toLowerCase().includes(q) ||
            l.areaName.toLowerCase().includes(q) ||
            l.cityName.toLowerCase().includes(q) ||
            l.address.toLowerCase().includes(q)
        );
      }

      return NextResponse.json({
        success: true,
        total: locations.length,
        cities: TN_CITIES,
        locations,
      });
    }

    // Resilient fallback
    let hubs = getAllTNHubs();
    if (cityId) hubs = hubs.filter((h) => h.cityId === cityId);
    if (search) {
      const q = search.toLowerCase();
      hubs = hubs.filter(
        (h) =>
          h.displayName.toLowerCase().includes(q) ||
          h.areaName.toLowerCase().includes(q) ||
          h.cityName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      total: hubs.length,
      cities: TN_CITIES,
      locations: hubs,
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
    const validated = CreateLocationSchema.parse(body);

    const locationId =
      validated.id || `hub-${validated.cityId.slice(0, 3)}-${Date.now().toString().slice(-4)}`;

    const { data, error } = await adminAuth.adminClient
      .from('pickup_locations')
      .insert([
        {
          id: locationId,
          city_id: validated.cityId,
          city_name: validated.cityName,
          area_name: validated.areaName,
          display_name: validated.displayName,
          address: validated.address,
          landmark: validated.landmark || null,
          pincode: validated.pincode,
          operating_hours: validated.operatingHours,
          contact_number: validated.contactNumber,
          is_active: validated.isActive,
          latitude: validated.latitude || null,
          longitude: validated.longitude || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'create_pickup_location',
      entityType: 'pickup_location',
      entityId: locationId,
      metadata: { displayName: validated.displayName, city: validated.cityName },
    });

    return NextResponse.json({ success: true, location: data }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message || 'Validation error' }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { VehicleService } from '@/services/vehicle.service';
import { getAuthContext, requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { z } from 'zod';

const CreateVehicleSchema = z.object({
  name: z.string().min(2, 'Vehicle name is required'),
  brand: z.string().min(2, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  variant: z.string().default(''),
  year: z.number().int().min(2015).max(2027),
  type: z.enum(['car', 'bike']),
  category: z.string().min(2, 'Category is required'),
  registrationNumber: z.string().min(6, 'Valid registration number is required'),
  transmission: z.enum(['Manual', 'Automatic']).default('Manual'),
  fuelType: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid']).default('Petrol'),
  seatingCapacity: z.number().optional(),
  engineCapacity: z.string().optional(),
  mileage: z.string().default('15 kmpl'),
  pricePerDay: z.number().positive('Daily rate must be positive'),
  weekendPrice: z.number().optional(),
  securityDeposit: z.number().nonnegative('Security deposit cannot be negative'),
  coverImage: z.string().min(1, 'Cover image path is required'),
  location: z.string().default('T. Nagar Hub, Chennai'),
  pickupLocationId: z.string().optional(),
  description: z.string().min(5, 'Description is required'),
  features: z.array(z.string()).default([]),
  status: z.enum(['available', 'booked', 'rented', 'maintenance', 'inactive']).default('available'),
  minRentalHours: z.number().default(12),
  odometer: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') as any) || undefined;
    const category = searchParams.get('category') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const cityId = searchParams.get('cityId') || undefined;
    const searchQuery = searchParams.get('search') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const fuelType = searchParams.get('fuel') || undefined;
    const transmission = searchParams.get('transmission') || undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
    const onlyAvailable = searchParams.get('available') === 'true';
    const sortBy = (searchParams.get('sort') as any) || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    let includeInactive = false;
    let client: any = undefined;
    if (searchParams.get('includeInactive') === 'true') {
      const authCtx = await getAuthContext(req);
      if (authCtx.isAdmin) {
        includeInactive = true;
        client = authCtx.supabase;
      }
    }

    const result = await VehicleService.getVehicles(
      {
        type,
        category,
        locationId,
        cityId,
        searchQuery,
        brand,
        fuelType,
        transmission,
        maxPrice,
        minRating,
        onlyAvailable,
        includeInactive,
        sortBy,
        page,
        limit,
      },
      client
    );

    const total = result.total;
    const totalPages = limit && limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

    return NextResponse.json({
      success: true,
      total,
      page: page || 1,
      limit: limit || total,
      totalPages,
      vehicles: result.vehicles,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error fetching vehicles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const body = await req.json();
    const validated = CreateVehicleSchema.parse(body);

    const newVehicle = await VehicleService.createVehicle(validated as any, adminAuth.adminClient);

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'create_vehicle',
      entityType: 'vehicle',
      entityId: newVehicle.id,
      metadata: {
        name: newVehicle.name,
        type: newVehicle.type,
        registration: newVehicle.registrationNumber,
      },
    });

    return NextResponse.json({ success: true, vehicle: newVehicle }, { status: 201 });
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

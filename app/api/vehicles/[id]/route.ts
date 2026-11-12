import { NextRequest, NextResponse } from 'next/server';
import { VehicleService } from '@/services/vehicle.service';
import { requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { z } from 'zod';

const UpdateVehicleSchema = z.object({
  name: z.string().min(2).optional(),
  brand: z.string().min(2).optional(),
  model: z.string().min(1).optional(),
  variant: z.string().optional(),
  year: z.number().int().min(2015).max(2027).optional(),
  type: z.enum(['car', 'bike']).optional(),
  category: z
    .enum([
      'Hatchback',
      'Sedan',
      'SUV',
      'Family MPV',
      'Luxury',
      'Electric SUV',
      'Family & Commuter',
      'City & Street',
      'Touring & Highway',
      'Scooter',
      'Scrambler',
      'Cruiser',
      'Naked Sport',
      'Adventure',
    ])
    .optional(),
  registrationNumber: z.string().min(6).optional(),
  transmission: z.enum(['Manual', 'Automatic']).optional(),
  fuelType: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid']).optional(),
  seatingCapacity: z.number().int().min(1).max(12).optional(),
  engineCapacity: z.string().optional(),
  mileage: z.string().optional(),
  pricePerDay: z.number().positive('Daily rent must be positive').optional(),
  weekendPrice: z.number().positive().optional(),
  securityDeposit: z.number().nonnegative('Security deposit cannot be negative').optional(),
  coverImage: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  pickupLocationId: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  status: z.enum(['available', 'booked', 'rented', 'maintenance', 'inactive']).optional(),
  minRentalHours: z.number().int().positive().optional(),
  odometer: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicle = await VehicleService.getVehicleById(id);
    if (!vehicle) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, vehicle });
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
    const validated = UpdateVehicleSchema.parse(body);

    const success = await VehicleService.updateVehicle(id, validated, adminAuth.adminClient);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update vehicle' }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'update_vehicle',
      entityType: 'vehicle',
      entityId: id,
      metadata: validated,
    });

    return NextResponse.json({ success: true, message: 'Vehicle updated successfully' });
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
    const success = await VehicleService.deleteVehicle(id, adminAuth.adminClient);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete vehicle' }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'delete_vehicle',
      entityType: 'vehicle',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Vehicle deactivated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

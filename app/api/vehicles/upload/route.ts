import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const vehicleId = formData.get('vehicleId') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Image file is required' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Image size must not exceed 5MB.' },
        { status: 422 }
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image format. Allowed types: JPEG, PNG, WEBP.' },
        { status: 422 }
      );
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `vehicles/${Date.now()}_${cleanName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { data, error: uploadErr } = await adminAuth.adminClient.storage
      .from('vehicle-images')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr || !data) {
      return NextResponse.json(
        { success: false, error: uploadErr?.message || 'Storage upload failed.' },
        { status: 500 }
      );
    }

    const { data: urlData } = adminAuth.adminClient.storage
      .from('vehicle-images')
      .getPublicUrl(data.path);

    if (vehicleId) {
      await adminAuth.adminClient.from('vehicle_images').insert([
        {
          vehicle_id: vehicleId,
          image_url: urlData.publicUrl,
          is_cover: false,
        },
      ]);
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'upload_vehicle_image',
      entityType: 'vehicle',
      entityId: vehicleId || storagePath,
      metadata: { publicUrl: urlData.publicUrl },
    });

    return NextResponse.json(
      {
        success: true,
        publicUrl: urlData.publicUrl,
        path: data.path,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

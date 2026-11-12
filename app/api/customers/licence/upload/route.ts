import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/supabase/auth-guard';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthUser(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.user.id;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const side = (formData.get('side') as string) || 'front'; // 'front' | 'back'
    const licenceNumber = formData.get('licenceNumber') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    // 1. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowed limit of 5MB.' },
        { status: 422 }
      );
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file format. Allowed types are JPEG, PNG, WEBP, and PDF.',
        },
        { status: 422 }
      );
    }

    // 3. Upload to private driving-licences bucket
    const ext = file.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg');
    const storagePath = `${userId}/${side}_${Date.now()}.${ext}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const adminClient = createAdminClient();
    const { error: uploadErr } = await adminClient.storage
      .from('driving-licences')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      return NextResponse.json({ success: false, error: uploadErr.message }, { status: 500 });
    }

    // 4. Update public.driving_licences record
    const updateField = side === 'back' ? 'back_image_url' : 'front_image_url';
    const licenceData: Record<string, any> = {
      user_id: userId,
      status: 'pending',
      [updateField]: storagePath,
    };
    if (licenceNumber) {
      licenceData.licence_number = licenceNumber;
    }

    // Check if licence record exists
    const { data: existing } = await adminClient
      .from('driving_licences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await adminClient.from('driving_licences').update(licenceData).eq('id', existing.id);
    } else {
      if (!licenceData.front_image_url) licenceData.front_image_url = storagePath;
      if (!licenceData.back_image_url) licenceData.back_image_url = storagePath;
      await adminClient.from('driving_licences').insert([licenceData]);
    }

    // 5. Update profile status to pending
    await adminClient
      .from('profiles')
      .update({ licence_verification_status: 'pending' })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      message: `Driving licence ${side} uploaded successfully. Awaiting verification by fleet desk.`,
      filePath: storagePath,
      status: 'pending',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

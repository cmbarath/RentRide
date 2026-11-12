import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/services/customer.service';
import { requireAuthUser, requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const UpdateLicenceSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  reason: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthUser(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: customerId } = await params;

    // Strict access control: Only the licence owner or an admin can view licence documents
    if (!authResult.isAdmin && customerId !== authResult.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view this driving licence.' },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();
    const { data: licence, error } = await adminClient
      .from('driving_licences')
      .select('*')
      .eq('user_id', customerId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (!licence) {
      return NextResponse.json({
        success: true,
        licence: null,
        signedUrls: { front: null, back: null },
      });
    }

    // Generate short-lived signed URLs (1 hour expiry) for private storage access
    let frontSignedUrl: string | null = null;
    let backSignedUrl: string | null = null;

    if (licence.front_image_url) {
      const cleanPath = licence.front_image_url.replace('driving-licences/', '');
      const { data: frontData } = await adminClient.storage
        .from('driving-licences')
        .createSignedUrl(cleanPath, 3600);
      frontSignedUrl = frontData?.signedUrl || null;
    }

    if (licence.back_image_url) {
      const cleanPath = licence.back_image_url.replace('driving-licences/', '');
      const { data: backData } = await adminClient.storage
        .from('driving-licences')
        .createSignedUrl(cleanPath, 3600);
      backSignedUrl = backData?.signedUrl || null;
    }

    return NextResponse.json({
      success: true,
      licence: {
        id: licence.id,
        userId: licence.user_id,
        licenceNumber: licence.licence_number,
        status: licence.status,
        rejectionReason: licence.rejection_reason,
        verifiedAt: licence.verified_at,
        frontImageUrl: frontSignedUrl || licence.front_image_url,
        backImageUrl: backSignedUrl || licence.back_image_url,
      },
      signedUrls: {
        front: frontSignedUrl,
        back: backSignedUrl,
      },
    });
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

    const { id: customerId } = await params;
    const body = await req.json();
    const validated = UpdateLicenceSchema.parse(body);

    if (validated.status === 'rejected' && !validated.reason) {
      return NextResponse.json({ success: false, error: 'A rejection reason is required.' }, { status: 400 });
    }

    const success = await CustomerService.updateLicenceStatus(
      customerId,
      validated.status,
      validated.reason,
      adminAuth.adminClient
    );

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update licence status' }, { status: 400 });
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: `licence_${validated.status}`,
      entityType: 'customer_licence',
      entityId: customerId,
      metadata: { status: validated.status, reason: validated.reason },
    });

    return NextResponse.json({
      success: true,
      message: `Licence ${validated.status} successfully.`,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message || 'Validation error' }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

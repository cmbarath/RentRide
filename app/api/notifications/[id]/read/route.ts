import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/auth-guard';
import { NotificationService } from '@/services/notification.service';

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
    const success = await NotificationService.markAsRead(id, adminAuth.userClient);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update notification read status' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Notification marked as read.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

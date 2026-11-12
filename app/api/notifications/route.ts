import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/auth-guard';
import { NotificationService } from '@/services/notification.service';
import { z } from 'zod';

const CreateNotificationSchema = z.object({
  recipient: z.string().min(1),
  title: z.string().min(2),
  message: z.string().min(2),
  bookingId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const recipient = searchParams.get('recipient') || 'fleet-admin';

    const result = await NotificationService.getNotifications(
      { recipient, unreadOnly },
      adminAuth.userClient
    );

    return NextResponse.json({
      success: true,
      total: result.notifications.length,
      unreadCount: result.unreadCount,
      notifications: result.notifications,
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
    const validated = CreateNotificationSchema.parse(body);

    const result = await NotificationService.createNotification(
      {
        bookingId: validated.bookingId,
        recipient: validated.recipient,
        title: validated.title,
        message: validated.message,
      },
      adminAuth.userClient
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message || 'Failed to record notification.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notificationId: result.id,
        notification: result.id ? { id: result.id } : undefined,
        message: result.message,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message || 'Validation error' }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

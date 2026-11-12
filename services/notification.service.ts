/**
 * NOTIFICATION SERVICE
 * Manages in-app notifications and system delivery logs.
 */

import { Booking } from '@/types/booking';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

function resolveClient(client?: SupabaseClient): SupabaseClient {
  if (client) return client;
  return createClient();
}

export class NotificationService {
  /**
   * Records an internal notification log for a new booking
   */
  static async notifyAdminNewBooking(booking: Booking, client?: SupabaseClient): Promise<{ success: boolean; message: string }> {
    const summary = `Booking ${booking.id} submitted for ${booking.vehicleName} by ${booking.customerName}`;
    return this.createNotification(
      {
        bookingId: booking.id,
        recipient: 'fleet-admin',
        title: 'New Booking Reservation',
        message: summary,
      },
      client
    );
  }

  /**
   * Creates an internal notification
   */
  static async createNotification(
    params: {
      bookingId?: string;
      recipient: string;
      title: string;
      message: string;
      channel?: string;
    },
    client?: SupabaseClient
  ): Promise<{ success: boolean; id?: string; message: string }> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = resolveClient(client);
        const { data, error } = await supabase
          .from('notification_logs')
          .insert([
            {
              booking_id: params.bookingId || null,
              recipient: params.recipient,
              channel: params.channel || 'in_app',
              title: params.title,
              message_payload: params.message,
              status: 'delivered',
              is_read: false,
            },
          ])
          .select('id')
          .maybeSingle();
        if (error) {
          console.error('[NotificationService] Failed to insert notification:', error.message);
          return { success: false, message: error.message };
        }
        return { success: true, id: data?.id, message: params.message };
      } catch (err: any) {
        console.error('[NotificationService] createNotification error:', err?.message || err);
        return { success: false, message: err?.message || 'Failed to create notification' };
      }
    }

    return { success: false, message: 'Supabase is not configured' };
  }

  /**
   * Retrieves notification logs
   */
  static async getNotifications(
    filters?: {
      recipient?: string;
      unreadOnly?: boolean;
    },
    client?: SupabaseClient
  ): Promise<{ notifications: any[]; unreadCount: number }> {
    if (!isSupabaseConfigured()) {
      return { notifications: [], unreadCount: 0 };
    }

    const supabase = resolveClient(client);
    let query = supabase.from('notification_logs').select('*').order('created_at', { ascending: false });

    if (filters?.recipient) {
      query = query.eq('recipient', filters.recipient);
    }
    if (filters?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to load notifications: ${error.message}`);
    }

    const rows = data || [];
    const unreadCount = rows.filter((n: any) => !n.is_read).length;
    return { notifications: rows, unreadCount };
  }

  /**
   * Marks a notification as read
   */
  static async markAsRead(notificationId: string, client?: SupabaseClient): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = resolveClient(client);
        const { error } = await supabase
          .from('notification_logs')
          .update({ is_read: true })
          .eq('id', notificationId);
        return !error;
      } catch {
        return false;
      }
    }
    return true;
  }
}

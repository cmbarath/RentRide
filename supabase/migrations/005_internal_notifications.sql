-- =============================================================================
-- RENTRIDE INTERNAL NOTIFICATIONS ENHANCEMENT
-- Migration: 005_internal_notifications.sql
-- Non-destructive: Expands check constraint to support in-app notifications
-- and adds read-status tracking.
-- =============================================================================

-- 1. Expand channel check constraint to allow 'in_app' and 'system'
ALTER TABLE public.notification_logs 
  DROP CONSTRAINT IF EXISTS notification_logs_channel_check;

ALTER TABLE public.notification_logs 
  ADD CONSTRAINT notification_logs_channel_check 
  CHECK (channel IN ('in_app', 'system', 'email', 'sms', 'whatsapp'));

-- 2. Add is_read column for in-app notification tracking
ALTER TABLE public.notification_logs 
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

-- 3. Add title column for rich in-app notification alerts
ALTER TABLE public.notification_logs 
  ADD COLUMN IF NOT EXISTS title TEXT;

-- 4. Enable RLS policy for reading notifications
DROP POLICY IF EXISTS "Admins view all notifications" ON public.notification_logs;
CREATE POLICY "Admins view all notifications" ON public.notification_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update notification read status" ON public.notification_logs;
CREATE POLICY "Admins update notification read status" ON public.notification_logs
  FOR UPDATE USING (public.is_admin());

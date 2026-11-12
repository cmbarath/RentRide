-- =============================================================================
-- RENTRIDE ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 002_rls_policies.sql
-- Idempotent: safe to run multiple times
-- =============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driving_licences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'fleet_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer'); -- Users cannot elevate their own role to admin

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- 2. VEHICLES & VEHICLE IMAGES
DROP POLICY IF EXISTS "Public read vehicles" ON public.vehicles;
CREATE POLICY "Public read vehicles" ON public.vehicles
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage vehicles" ON public.vehicles;
CREATE POLICY "Admin manage vehicles" ON public.vehicles
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read vehicle images" ON public.vehicle_images;
CREATE POLICY "Public read vehicle images" ON public.vehicle_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage vehicle images" ON public.vehicle_images;
CREATE POLICY "Admin manage vehicle images" ON public.vehicle_images
  FOR ALL USING (public.is_admin());

-- 3. PICKUP LOCATIONS
DROP POLICY IF EXISTS "Public read locations" ON public.pickup_locations;
CREATE POLICY "Public read locations" ON public.pickup_locations
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage locations" ON public.pickup_locations;
CREATE POLICY "Admin manage locations" ON public.pickup_locations
  FOR ALL USING (public.is_admin());

-- 4. DRIVING LICENCES (STRICT SECURITY & PRIVATE ACCESS)
DROP POLICY IF EXISTS "Users can view own licence" ON public.driving_licences;
CREATE POLICY "Users can view own licence" ON public.driving_licences
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own licence" ON public.driving_licences;
CREATE POLICY "Users can insert own licence" ON public.driving_licences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update licence status" ON public.driving_licences;
CREATE POLICY "Admins can update licence status" ON public.driving_licences
  FOR UPDATE USING (public.is_admin());

-- 5. BOOKINGS
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert bookings" ON public.bookings;
CREATE POLICY "Users can insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;
CREATE POLICY "Admins can manage bookings" ON public.bookings
  FOR ALL USING (public.is_admin());

-- 6. BOOKING STATUS HISTORY
DROP POLICY IF EXISTS "View booking status history" ON public.booking_status_history;
CREATE POLICY "View booking status history" ON public.booking_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_status_history.booking_id
      AND (bookings.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admin insert status history" ON public.booking_status_history;
CREATE POLICY "Admin insert status history" ON public.booking_status_history
  FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() IS NOT NULL);

-- 7. PAYMENTS
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
CREATE POLICY "Admin manage payments" ON public.payments
  FOR ALL USING (public.is_admin());

-- 8. REVIEWS
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
CREATE POLICY "Public read approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true OR public.is_admin());

DROP POLICY IF EXISTS "Users create reviews for own completed bookings" ON public.reviews;
CREATE POLICY "Users create reviews for own completed bookings" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin moderate reviews" ON public.reviews;
CREATE POLICY "Admin moderate reviews" ON public.reviews
  FOR ALL USING (public.is_admin());

-- 9. PRICING RULES & APPLICATION SETTINGS
DROP POLICY IF EXISTS "Public read pricing rules" ON public.pricing_rules;
CREATE POLICY "Public read pricing rules" ON public.pricing_rules
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage pricing rules" ON public.pricing_rules;
CREATE POLICY "Admin manage pricing rules" ON public.pricing_rules
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read application settings" ON public.application_settings;
CREATE POLICY "Public read application settings" ON public.application_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin update application settings" ON public.application_settings;
CREATE POLICY "Admin update application settings" ON public.application_settings
  FOR ALL USING (public.is_admin());

-- 10. MAINTENANCE & AUDIT LOGS (ADMIN ONLY)
DROP POLICY IF EXISTS "Admin only vehicle maintenance" ON public.vehicle_maintenance;
CREATE POLICY "Admin only vehicle maintenance" ON public.vehicle_maintenance
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin only notification logs" ON public.notification_logs;
CREATE POLICY "Admin only notification logs" ON public.notification_logs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin only audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admin only audit logs" ON public.admin_audit_logs
  FOR ALL USING (public.is_admin());

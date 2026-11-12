-- =============================================================================
-- RENTRIDE CAR & BIKE RENTAL PLATFORM – SUPABASE POSTGRESQL SCHEMA
-- Migration: 001_initial_schema.sql
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'fleet_manager')),
  avatar_url TEXT,
  licence_verification_status TEXT NOT NULL DEFAULT 'unverified' 
    CHECK (licence_verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to automatically create profile row when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    'customer' -- Role is strictly enforced as 'customer' on signup. Admin role requires trusted manual/SQL promotion.
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PICKUP LOCATIONS (Tamil Nadu cities and hubs)
CREATE TABLE IF NOT EXISTS public.pickup_locations (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL,
  city_name TEXT NOT NULL,
  area_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  pincode TEXT,
  operating_hours TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. VEHICLES (Fleet inventory)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('car', 'bike')),
  category TEXT NOT NULL,
  body_type TEXT,
  bike_segment TEXT,
  registration_number TEXT UNIQUE NOT NULL,
  transmission TEXT NOT NULL CHECK (transmission IN ('Manual', 'Automatic')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'Hybrid')),
  seating_capacity INTEGER,
  engine_capacity TEXT,
  mileage TEXT NOT NULL,
  price_per_day NUMERIC(10, 2) NOT NULL,
  weekend_price NUMERIC(10, 2),
  security_deposit NUMERIC(10, 2) NOT NULL,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  cover_image TEXT NOT NULL,
  location_id TEXT REFERENCES public.pickup_locations(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  description TEXT NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'rented', 'maintenance', 'inactive')),
  min_rental_hours INTEGER NOT NULL DEFAULT 12,
  odometer INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. VEHICLE IMAGES (Multi-image galleries)
CREATE TABLE IF NOT EXISTS public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. DRIVING LICENCES (Private KYC documents)
CREATE TABLE IF NOT EXISTS public.driving_licences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  licence_number TEXT,
  front_image_url TEXT NOT NULL,
  back_image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('unverified', 'pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  booking_code TEXT UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  vehicle_name TEXT NOT NULL,
  vehicle_brand TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'bike')),
  vehicle_image TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  return_date DATE NOT NULL,
  return_time TIME NOT NULL,
  pickup_location_id TEXT REFERENCES public.pickup_locations(id),
  pickup_location TEXT NOT NULL,
  return_location_id TEXT REFERENCES public.pickup_locations(id),
  return_location TEXT NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('hub', 'doorstep')),
  delivery_address TEXT,
  duration_days INTEGER NOT NULL DEFAULT 1,
  pricing_snapshot JSONB NOT NULL,
  rental_charges NUMERIC(10, 2) NOT NULL,
  security_deposit NUMERIC(10, 2) NOT NULL,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  insurance_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  additional_charges NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  booking_status TEXT NOT NULL DEFAULT 'pending_review' 
    CHECK (booking_status IN ('pending_review', 'approved_pending_payment', 'confirmed', 'active', 'awaiting_inspection', 'completed', 'rejected', 'cancelled', 'expired', 'submitted', 'awaiting_licence', 'approved')),
  payment_status TEXT NOT NULL DEFAULT 'not_paid' 
    CHECK (payment_status IN ('not_paid', 'pending', 'paid', 'failed', 'refund_pending', 'partially_refunded', 'refunded', 'success')),
  licence_id UUID REFERENCES public.driving_licences(id),
  licence_status TEXT NOT NULL DEFAULT 'pending' CHECK (licence_status IN ('unverified', 'pending', 'verified', 'rejected')),
  licence_number TEXT,
  payment_deadline TIMESTAMPTZ,
  rejection_reason TEXT,
  cancellation_reason TEXT,
  pickup_otp TEXT,
  return_otp TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. BOOKING STATUS HISTORY (Audit trail)
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. PAYMENTS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.profiles(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rental_charge', 'security_deposit', 'deposit_refund', 'cancellation_refund', 'late_fee')),
  status TEXT NOT NULL CHECK (status IN ('success', 'pending', 'refunded', 'failed')),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  refund_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. PRICING RULES
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'car', 'bike', 'category', 'vehicle')),
  target_value TEXT,
  weekend_surge_percent NUMERIC(5, 2) DEFAULT 15.0,
  gst_percentage NUMERIC(5, 2) DEFAULT 18.0,
  doorstep_delivery_fee NUMERIC(10, 2) DEFAULT 299.0,
  car_insurance_fee NUMERIC(10, 2) DEFAULT 499.0,
  bike_insurance_fee NUMERIC(10, 2) DEFAULT 199.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. VEHICLE MAINTENANCE & DATE BLOCKING
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('maintenance', 'vip_reservation', 'inspection', 'relocation')),
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. REVIEWS & RATINGS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. NOTIFICATION LOGS (WhatsApp / Email logs)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
  message_payload TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('delivered', 'sent', 'failed', 'fallback_opened')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. APPLICATION SETTINGS
CREATE TABLE IF NOT EXISTS public.application_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT 'RentRide Mobility Private Limited',
  gstin TEXT NOT NULL DEFAULT '33AABCR8721K1ZM', -- Tamil Nadu State GST code: 33
  support_phone TEXT NOT NULL DEFAULT '+91 800-RENTRIDE',
  support_email TEXT NOT NULL DEFAULT 'support@rentride.in',
  emergency_phone TEXT NOT NULL DEFAULT '1800-209-9090',
  speed_limit INTEGER NOT NULL DEFAULT 120,
  min_driver_age INTEGER NOT NULL DEFAULT 21,
  fuel_policy TEXT NOT NULL DEFAULT 'same_to_same',
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  cancellation_grace_hours INTEGER NOT NULL DEFAULT 6,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON public.vehicles(location_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(pickup_date, return_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_dates ON public.vehicle_maintenance(vehicle_id, start_date, end_date);

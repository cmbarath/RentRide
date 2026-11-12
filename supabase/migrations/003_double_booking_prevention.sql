-- =============================================================================
-- RENTRIDE DOUBLE BOOKING PREVENTION & ATOMIC RESERVATION RPC
-- Migration: 003_double_booking_prevention.sql
-- Idempotent: safe to run multiple times
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_booking_id TEXT,
  p_user_id UUID,
  p_vehicle_id TEXT,
  p_pickup_date DATE,
  p_pickup_time TIME,
  p_return_date DATE,
  p_return_time TIME,
  p_pickup_location_id TEXT,
  p_pickup_location TEXT,
  p_return_location_id TEXT,
  p_return_location TEXT,
  p_delivery_type TEXT,
  p_delivery_address TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_licence_id UUID,
  p_licence_number TEXT,
  p_duration_days INTEGER,
  p_rental_charges NUMERIC,
  p_security_deposit NUMERIC,
  p_tax_amount NUMERIC,
  p_insurance_fee NUMERIC,
  p_total_amount NUMERIC,
  p_pricing_snapshot JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle RECORD;
  v_overlap_count INTEGER;
  v_maintenance_count INTEGER;
  v_pickup_otp TEXT;
  v_return_otp TEXT;
BEGIN
  -- 1. Lock the vehicle record FOR UPDATE to prevent concurrent race conditions
  SELECT * INTO v_vehicle
  FROM public.vehicles
  WHERE id = p_vehicle_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vehicle does not exist.');
  END IF;

  IF NOT v_vehicle.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vehicle is currently inactive.');
  END IF;

  IF v_vehicle.status = 'maintenance' OR v_vehicle.status = 'inactive' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vehicle is temporarily out of service for maintenance.');
  END IF;

  -- 2. Check for maintenance date blocks (inclusive boundary overlap check)
  SELECT COUNT(*) INTO v_maintenance_count
  FROM public.vehicle_maintenance
  WHERE vehicle_id = p_vehicle_id
    AND is_completed = false
    AND start_date <= p_return_date
    AND end_date >= p_pickup_date;

  IF v_maintenance_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vehicle is scheduled for maintenance during the selected dates.');
  END IF;

  -- 3. Check for overlapping active reservations: (Existing Pickup < Requested Return AND Existing Return > Requested Pickup)
  SELECT COUNT(*) INTO v_overlap_count
  FROM public.bookings
  WHERE vehicle_id = p_vehicle_id
    AND booking_status IN ('pending_review', 'approved_pending_payment', 'confirmed', 'active', 'awaiting_inspection', 'submitted', 'awaiting_licence', 'approved')
    AND pickup_date < p_return_date
    AND return_date > p_pickup_date;

  IF v_overlap_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Vehicle was just reserved by another customer for these dates. Please choose another vehicle or different dates.'
    );
  END IF;

  -- 4. Generate random 4-digit OTPs for digital pickup and return verification
  v_pickup_otp := LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
  v_return_otp := LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

  -- 5. Atomically insert the new booking
  INSERT INTO public.bookings (
    id,
    booking_code,
    user_id,
    vehicle_id,
    vehicle_name,
    vehicle_brand,
    vehicle_type,
    vehicle_image,
    customer_name,
    customer_email,
    customer_phone,
    pickup_date,
    pickup_time,
    return_date,
    return_time,
    pickup_location_id,
    pickup_location,
    return_location_id,
    return_location,
    delivery_type,
    delivery_address,
    duration_days,
    pricing_snapshot,
    rental_charges,
    security_deposit,
    tax_amount,
    insurance_fee,
    total_amount,
    booking_status,
    payment_status,
    licence_id,
    licence_status,
    licence_number,
    pickup_otp,
    return_otp
  ) VALUES (
    p_booking_id,
    p_booking_id,
    p_user_id,
    p_vehicle_id,
    v_vehicle.name,
    v_vehicle.brand,
    v_vehicle.type,
    v_vehicle.cover_image,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_pickup_date,
    p_pickup_time,
    p_return_date,
    p_return_time,
    p_pickup_location_id,
    p_pickup_location,
    p_return_location_id,
    p_return_location,
    p_delivery_type,
    p_delivery_address,
    p_duration_days,
    p_pricing_snapshot,
    p_rental_charges,
    p_security_deposit,
    p_tax_amount,
    p_insurance_fee,
    p_total_amount,
    'pending_review',
    'not_paid',
    p_licence_id,
    'pending',
    p_licence_number,
    v_pickup_otp,
    v_return_otp
  );

  -- 6. Insert initial status history record
  INSERT INTO public.booking_status_history (
    booking_id,
    status,
    note
  ) VALUES (
    p_booking_id,
    'pending_review',
    'Booking submitted online. Awaiting driving licence verification by fleet manager.'
  );

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'pickup_otp', v_pickup_otp
  );
END;
$$;

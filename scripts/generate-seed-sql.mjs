import fs from 'fs';
import path from 'path';
import { SEED_VEHICLES } from '../lib/seed-catalog.ts';
import { TN_CITIES } from '../lib/tn-locations.ts';

let sql = `-- =============================================================================
-- RENTRIDE SEED DATA SCRIPT (TAMIL NADU REGION)
-- Populates 16 Tamil Nadu Cities/Hubs and 51+ Verified Cars & Bikes
-- =============================================================================

-- 1. SEED APPLICATION SETTINGS
INSERT INTO public.application_settings (
  id, company_name, gstin, support_phone, support_email, emergency_phone, speed_limit, min_driver_age, fuel_policy, whatsapp_enabled, cancellation_grace_hours
) VALUES (
  'default', 'RentRide Mobility Private Limited', '33AABCU9603R1ZM', '+91 800-RENTRIDE', 'concierge@rentride.in', '1800-209-9090', 120, 21, 'same_to_same', true, 6
) ON CONFLICT (id) DO NOTHING;

-- 2. SEED TAMIL NADU PICKUP HUBS
`;

TN_CITIES.forEach((city) => {
  city.hubs.forEach((hub) => {
    sql += `INSERT INTO public.pickup_locations (
  id, city_id, city_name, area_name, display_name, address, landmark, pincode, operating_hours, contact_number, is_active, latitude, longitude
) VALUES (
  '${hub.id}', '${hub.cityId}', '${hub.cityName.replace(/'/g, "''")}', '${hub.areaName.replace(/'/g, "''")}', '${hub.displayName.replace(/'/g, "''")}',
  '${hub.address.replace(/'/g, "''")}', '${(hub.landmark || '').replace(/'/g, "''")}', '${hub.pincode}', '${hub.operatingHours}', '${hub.contactNumber}', true, ${hub.latitude}, ${hub.longitude}
) ON CONFLICT (id) DO NOTHING;\n`;
  });
});

sql += `\n-- 3. SEED VEHICLES (26 BIKES + 25 CARS = 51+ MODELS)\n`;

SEED_VEHICLES.forEach((v) => {
  const featArr = `ARRAY[${v.features.map((f) => `'${f.replace(/'/g, "''")}'`).join(', ')}]`;
  sql += `INSERT INTO public.vehicles (
  id, slug, name, brand, model, variant, year, type, category, body_type, bike_segment,
  registration_number, transmission, fuel_type, seating_capacity, engine_capacity, mileage,
  price_per_day, weekend_price, security_deposit, rating, review_count, cover_image,
  location_id, location_name, description, features, status, min_rental_hours, odometer, is_active
) VALUES (
  '${v.id}', '${v.slug}', '${v.name.replace(/'/g, "''")}', '${v.brand.replace(/'/g, "''")}', '${v.model.replace(/'/g, "''")}', '${v.variant.replace(/'/g, "''")}',
  ${v.year}, '${v.type}', '${v.category}', ${v.bodyType ? `'${v.bodyType}'` : 'NULL'}, ${v.bikeSegment ? `'${v.bikeSegment}'` : 'NULL'},
  '${v.registrationNumber}', '${v.transmission}', '${v.fuelType}', ${v.seatingCapacity || 'NULL'}, ${v.engineCapacity ? `'${v.engineCapacity}'` : 'NULL'}, '${v.mileage}',
  ${v.pricePerDay}, ${v.weekendPrice || v.pricePerDay}, ${v.securityDeposit}, ${v.rating}, ${v.reviewCount}, '${v.coverImage}',
  '${v.pickupLocationId || 'hub-chn-tnagar'}', '${v.location.replace(/'/g, "''")}', '${v.description.replace(/'/g, "''")}',
  ${featArr}, '${v.status}', ${v.minRentalHours}, ${v.odometer}, true
) ON CONFLICT (id) DO UPDATE SET
  price_per_day = EXCLUDED.price_per_day,
  cover_image = EXCLUDED.cover_image,
  description = EXCLUDED.description;\n\n`;
});

sql += `\n-- 4. SEED SAMPLE BOOKINGS (FOR TESTING & DEMO)\n`;
sql += `INSERT INTO public.bookings (
  id, booking_code, vehicle_id, vehicle_name, vehicle_brand, vehicle_type, vehicle_image,
  customer_name, customer_email, customer_phone, pickup_date, pickup_time, return_date, return_time,
  pickup_location_id, pickup_location, return_location_id, return_location, delivery_type,
  duration_days, pricing_snapshot, rental_charges, security_deposit, tax_amount, insurance_fee, total_amount,
  booking_status, payment_status, licence_status, licence_number, pickup_otp, return_otp
) VALUES
(
  'RR-8921', 'RR-8921', 'veh-cr-20', 'Hyundai Creta SX (O) 1.5 Turbo DCT', 'Hyundai', 'car',
  '/images/vehicles/cars/hyundai-creta.jpg', 'Priya Nambiar', 'priya.nambiar@outlook.com', '+91 97112 44901',
  CURRENT_DATE + INTERVAL '2 days', '09:00:00', CURRENT_DATE + INTERVAL '5 days', '18:00:00',
  'hub-chn-tnagar', 'T. Nagar Hub, Chennai', 'hub-chn-tnagar', 'T. Nagar Hub, Chennai', 'hub',
  3, '{"rentalDays": 3, "dailyRate": 3499}'::jsonb, 10497.00, 4500.00, 1889.00, 499.00, 17385.00,
  'pending_review', 'not_paid', 'pending', 'TN-01-2021-0089123', '8492', '3318'
),
(
  'RR-8919', 'RR-8919', 'veh-cr-26', 'Mercedes-Benz E-Class Exclusive', 'Mercedes-Benz', 'car',
  '/images/vehicles/cars/mercedes-benz-e-class.jpg', 'Rohan Sharma', 'rohan.sharma@gmail.com', '+91 98450 12345',
  CURRENT_DATE + INTERVAL '1 day', '10:00:00', CURRENT_DATE + INTERVAL '3 days', '20:00:00',
  'hub-chn-adyar', 'Adyar Hub, Chennai', 'hub-chn-adyar', 'Adyar Hub, Chennai', 'doorstep',
  2, '{"rentalDays": 2, "dailyRate": 9500}'::jsonb, 19000.00, 10000.00, 3420.00, 499.00, 32919.00,
  'approved_pending_payment', 'pending', 'verified', 'TN-01-2019-0048192', '5192', '9012'
),
(
  'RR-8914', 'RR-8914', 'veh-bk-17', 'Royal Enfield Hunter 350 Rebel', 'Royal Enfield', 'bike',
  '/images/vehicles/bikes/royal-enfield-hunter-350.jpg', 'Ananya Deshmukh', 'ananya.deshmukh@yahoo.com', '+91 98200 66782',
  CURRENT_DATE - INTERVAL '1 day', '08:00:00', CURRENT_DATE + INTERVAL '1 day', '20:00:00',
  'hub-chn-velachery', 'Velachery Hub, Chennai', 'hub-chn-velachery', 'Velachery Hub, Chennai', 'hub',
  2, '{"rentalDays": 2, "dailyRate": 1100}'::jsonb, 2200.00, 1500.00, 396.00, 199.00, 4295.00,
  'confirmed', 'paid', 'verified', 'TN-04-2018-0033101', '2840', '7419'
) ON CONFLICT (id) DO NOTHING;

-- 5. SEED INITIAL TRANSACTIONS
INSERT INTO public.payments (
  id, booking_id, customer_name, customer_email, amount, payment_method, type, status, razorpay_payment_id
) VALUES
('TXN-90214', 'RR-8914', 'Ananya Deshmukh', 'ananya.deshmukh@yahoo.com', 4295.00, 'UPI', 'rental_charge', 'success', 'pay_RR_90214_test'),
('TXN-90180', 'RR-8914', 'Ananya Deshmukh', 'ananya.deshmukh@yahoo.com', 1500.00, 'UPI', 'security_deposit', 'success', 'pay_RR_90180_test')
ON CONFLICT (id) DO NOTHING;
`;

fs.writeFileSync(path.join(process.cwd(), 'supabase', 'seed.sql'), sql, 'utf8');
console.log('Successfully generated supabase/seed.sql!');

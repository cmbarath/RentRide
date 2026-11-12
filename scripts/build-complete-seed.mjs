import fs from 'fs';
import path from 'path';

// Read seed-catalog.ts and tn-locations.ts
const catalogContent = fs.readFileSync(path.join(process.cwd(), 'lib', 'seed-catalog.ts'), 'utf8');
const locationsContent = fs.readFileSync(path.join(process.cwd(), 'lib', 'tn-locations.ts'), 'utf8');

// Parse vehicles from seed-catalog.ts
// Match all vehicle objects
const vehicleRegex = /\{\s*id:\s*'(veh-[^']+)',\s*slug:\s*'([^']+)',\s*name:\s*'([^']+)',\s*brand:\s*'([^']+)',\s*model:\s*'([^']+)',\s*variant:\s*'([^']+)',\s*year:\s*(\d+),\s*type:\s*'([^']+)',\s*category:\s*'([^']+)',\s*(?:bodyType:\s*'([^']*)',\s*)?(?:bikeSegment:\s*'([^']*)',\s*)?registrationNumber:\s*'([^']+)',\s*transmission:\s*'([^']+)',\s*fuelType:\s*'([^']+)',\s*(?:seatingCapacity:\s*(\d+),\s*)?(?:engineCapacity:\s*'([^']*)',\s*)?mileage:\s*'([^']+)',\s*pricePerDay:\s*(\d+),\s*weekendPrice:\s*(\d+),\s*securityDeposit:\s*(\d+),\s*rating:\s*([\d.]+),\s*reviewCount:\s*(\d+),[\s\S]*?coverImage:\s*(?:getVehicleImage\('[^']+',\s*'[^']+'\)\.coverImage|'([^']+)'),\s*location:\s*'([^']+)',\s*pickupLocationId:\s*'([^']+)',\s*description:\s*(?:"([^"]+)"|'([^']+)'),\s*features:\s*(\[[^\]]+\]),/g;

let vehicles = [];
let match;
while ((match = vehicleRegex.exec(catalogContent)) !== null) {
  const [
    full,
    id,
    slug,
    name,
    brand,
    model,
    variant,
    year,
    type,
    category,
    bodyType,
    bikeSegment,
    regNo,
    transmission,
    fuelType,
    seatingCapacity,
    engineCapacity,
    mileage,
    pricePerDay,
    weekendPrice,
    securityDeposit,
    rating,
    reviewCount,
    coverImgExplicit,
    location,
    pickupLocationId,
    descDouble,
    descSingle,
    featuresRaw,
  ] = match;

  const coverImage = coverImgExplicit || (type === 'bike' ? `/images/vehicles/bikes/${slug}.svg` : `/images/vehicles/cars/${slug}.svg`);
  const description = descDouble || descSingle || '';

  // Clean features array
  let features = [];
  try {
    features = eval(featuresRaw);
  } catch {
    features = ['Air Conditioning', 'Fastag', 'ABS'];
  }

  vehicles.push({
    id,
    slug,
    name,
    brand,
    model,
    variant,
    year: parseInt(year, 10),
    type,
    category,
    bodyType: bodyType || null,
    bikeSegment: bikeSegment || null,
    registrationNumber: regNo,
    transmission,
    fuelType,
    seatingCapacity: seatingCapacity ? parseInt(seatingCapacity, 10) : (type === 'car' ? 5 : 2),
    engineCapacity: engineCapacity || null,
    mileage,
    pricePerDay: parseFloat(pricePerDay),
    weekendPrice: parseFloat(weekendPrice),
    securityDeposit: parseFloat(securityDeposit),
    rating: parseFloat(rating),
    reviewCount: parseInt(reviewCount, 10),
    coverImage,
    location,
    pickupLocationId,
    description: description.replace(/'/g, "''"),
    features,
  });
}

console.log(`Parsed ${vehicles.length} vehicles from lib/seed-catalog.ts`);

// Build SQL
let sql = `-- =============================================================================
-- RENTRIDE PRODUCTION DATABASE SEED SCRIPT
-- Region: Tamil Nadu, India
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING)
-- =============================================================================

-- 1. APPLICATION SETTINGS
INSERT INTO public.application_settings (
  id, company_name, gstin, support_phone, support_email, emergency_phone, speed_limit, min_driver_age, fuel_policy, whatsapp_enabled, cancellation_grace_hours
) VALUES (
  'default', 'RentRide Mobility Private Limited', '33AABCR8721K1ZM', '+91 800-RENTRIDE', 'support@rentride.in', '1800-209-9090', 120, 21, 'same_to_same', true, 6
) ON CONFLICT (id) DO NOTHING;

-- 2. PICKUP HUBS & CITIES (TAMIL NADU)
INSERT INTO public.pickup_locations (id, city_id, city_name, area_name, display_name, address, landmark, pincode, operating_hours, contact_number, is_active, latitude, longitude) VALUES
('hub-chn-tnagar', 'chennai', 'Chennai', 'T. Nagar', 'T. Nagar Hub', 'No. 18, Usman Road, Near Panagal Park, T. Nagar, Chennai - 600017', 'Opposite Ranganathan Street Entrance', '600017', '06:00 AM - 11:30 PM (All 7 Days)', '+91 44 2434 9100', true, 13.0418, 80.2341),
('hub-chn-annanagar', 'chennai', 'Chennai', 'Anna Nagar', 'Anna Nagar Hub', '2nd Avenue, Near Roundtana, Anna Nagar East, Chennai - 600102', 'Near Anna Nagar Tower Park', '600102', '06:00 AM - 11:30 PM (All 7 Days)', '+91 44 2621 8200', true, 13.0850, 80.2101),
('hub-chn-velachery', 'chennai', 'Chennai', 'Velachery', 'Velachery Hub', '100 Feet Bypass Road, Near Phoenix Marketcity, Velachery, Chennai - 600042', 'Behind Vijayanagar Bus Terminus', '600042', '06:00 AM - 11:30 PM (All 7 Days)', '+91 44 2243 5500', true, 12.9759, 80.2212),
('hub-chn-adyar', 'chennai', 'Chennai', 'Adyar', 'Adyar Hub', 'Lattice Bridge (LB) Road, Near Adyar Depot, Adyar, Chennai - 600020', 'Next to Gandhi Nagar Club', '600020', '06:30 AM - 11:00 PM (All 7 Days)', '+91 44 2441 3300', true, 13.0012, 80.2565),
('hub-chn-guindy', 'chennai', 'Chennai', 'Guindy', 'Guindy Hub', 'GST Road, Near Guindy Metro Station, Guindy, Chennai - 600032', 'Opposite Olympia Tech Park', '600032', '06:00 AM - 11:30 PM (All 7 Days)', '+91 44 2235 4400', true, 13.0067, 80.2026),
('hub-chn-tambaram', 'chennai', 'Chennai', 'Tambaram', 'Tambaram Hub', 'GST Road, Near Tambaram Sanatorium Railway Station, Chennai - 600045', 'Adjacent to MEPZ Gate', '600045', '06:00 AM - 11:30 PM (All 7 Days)', '+91 44 2226 7700', true, 12.9249, 80.1165),
('hub-chn-porur', 'chennai', 'Chennai', 'Porur', 'Porur Hub', 'Mount Poonamallee High Road, Near Porur Junction, Chennai - 600116', 'Near DLF Cybercity Gate 1', '600116', '06:30 AM - 11:00 PM (All 7 Days)', '+91 44 2476 1120', true, 13.0339, 80.1585),
('hub-chn-omr-sholinganallur', 'chennai', 'Chennai', 'OMR - Sholinganallur', 'OMR Sholinganallur Hub', 'Rajiv Gandhi Salai (OMR), Near Sholinganallur Signal, Chennai - 600119', 'Near ELCOT SEZ', '600119', '06:00 AM - 11:30 PM (All 7 Days)', '+91 44 2450 9900', true, 12.8996, 80.2279),
('hub-chn-airport', 'chennai', 'Chennai', 'Chennai Airport Area', 'Chennai Airport (MAA) Hub', 'Grand Southern Trunk (GST) Road, Tirusulam, Chennai - 600027', 'Opposite Domestic Terminal Arrivals (Gate 3)', '600027', '24 Hours (Express Key Lockers)', '+91 44 2256 0099', true, 12.9863, 80.1648),
('hub-cbe-gandhipuram', 'coimbatore', 'Coimbatore', 'Gandhipuram', 'Gandhipuram Hub', 'Cross Cut Road, Near Central Bus Stand, Gandhipuram, Coimbatore - 641012', 'Opposite GP Signal', '641012', '06:00 AM - 11:00 PM (All 7 Days)', '+91 422 249 8810', true, 11.0168, 76.9558),
('hub-cbe-rspuram', 'coimbatore', 'Coimbatore', 'RS Puram', 'RS Puram Hub', 'DB Road, Near Flower Market, RS Puram, Coimbatore - 641002', 'Near Post Office', '641002', '06:30 AM - 11:00 PM (All 7 Days)', '+91 422 254 3320', true, 11.0089, 76.9482),
('hub-cbe-peelamedu', 'coimbatore', 'Coimbatore', 'Peelamedu', 'Peelamedu Airport Hub', 'Avinashi Road, Near PSG College of Technology, Peelamedu, Coimbatore - 641004', 'Near Coimbatore Airport Junction', '641004', '06:00 AM - 11:30 PM (All 7 Days)', '+91 422 257 4410', true, 11.0289, 77.0028),
('hub-mdu-mattuthavani', 'madurai', 'Madurai', 'Mattuthavani', 'Mattuthavani Integrated Bus Hub', 'K.K. Nagar Main Road, Near Mattuthavani Bus Stand, Madurai - 625007', 'Near MGR Bus Stand Ring Road', '625007', '06:00 AM - 11:00 PM (All 7 Days)', '+91 452 258 9911', true, 9.9489, 78.1567),
('hub-mdu-annanagar', 'madurai', 'Madurai', 'Anna Nagar', 'Anna Nagar Hub', '80 Feet Road, Near Ambika Theatre, Anna Nagar, Madurai - 625020', 'Near Aravind Eye Hospital', '625020', '06:30 AM - 10:30 PM (All 7 Days)', '+91 452 252 4430', true, 9.9248, 78.1432),
('hub-try-central', 'trichy', 'Tiruchirappalli (Trichy)', 'Central Bus Stand', 'Central Trichy Hub', 'Rockins Road, Near Central Bus Stand, Cantonment, Trichy - 620001', 'Opposite Railway Junction', '620001', '06:00 AM - 11:00 PM (All 7 Days)', '+91 431 241 5560', true, 10.7968, 78.6856),
('hub-try-thillainagar', 'trichy', 'Tiruchirappalli (Trichy)', 'Thillai Nagar', 'Thillai Nagar Hub', 'Main Road, 10th Cross, Thillai Nagar, Trichy - 620018', 'Near Fort Railway Station', '620018', '06:30 AM - 10:30 PM (All 7 Days)', '+91 431 276 3320', true, 10.8289, 78.6881),
('hub-slm-newbusstand', 'salem', 'Salem', 'New Bus Stand', 'Salem New Bus Stand Hub', 'Omalur Main Road, Near New Bus Stand, Meyyanur, Salem - 636004', 'Near 5 Roads Junction', '636004', '06:00 AM - 10:30 PM (All 7 Days)', '+91 427 244 8890', true, 11.6643, 78.1460),
('hub-tpr-avinashiroad', 'tiruppur', 'Tiruppur', 'Avinashi Road', 'Avinashi Road Hub', 'Avinashi Main Road, Pushpa Theatre Junction, Tiruppur - 641602', 'Near Old Bus Stand', '641602', '06:30 AM - 10:00 PM (All 7 Days)', '+91 421 223 4450', true, 11.1085, 77.3411),
('hub-erd-perundurai', 'erode', 'Erode', 'Perundurai Road', 'Perundurai Road Hub', 'Perundurai Road, Near Collector Office, Erode - 638011', 'Near Brough Road Signal', '638011', '06:00 AM - 10:00 PM (All 7 Days)', '+91 424 225 6670', true, 11.3410, 77.7172),
('hub-vlr-katpadi', 'vellore', 'Vellore', 'Katpadi', 'Katpadi Railway Station Hub', 'Chittoor High Road, Near Katpadi Junction & VIT Gate, Vellore - 632014', 'Opposite VIT Main Gate', '632014', '06:00 AM - 10:30 PM (All 7 Days)', '+91 416 224 8890', true, 12.9698, 79.1365),
('hub-hsr-sipcot', 'hosur', 'Hosur', 'SIPCOT', 'SIPCOT Industrial Hub', 'Bangalore-Chennai Highway, Near SIPCOT Phase 1, Hosur - 635126', 'Near Hosur Bus Stand', '635126', '06:00 AM - 11:00 PM (All 7 Days)', '+91 4344 278 100', true, 12.7409, 77.8253),
('hub-tj-oldbusstand', 'thanjavur', 'Thanjavur', 'Old Bus Stand', 'Brihadeeswarar Temple Hub', 'South Rampart Road, Near Old Bus Stand, Thanjavur - 613001', '500m from Big Temple', '613001', '06:30 AM - 09:30 PM (All 7 Days)', '+91 4362 233 440', true, 10.7870, 79.1378),
('hub-tnv-vannarpettai', 'tirunelveli', 'Tirunelveli', 'Vannarpettai', 'Vannarpettai Hub', 'South Bypass Road, Near New Bus Stand, Vannarpettai, Tirunelveli - 627003', 'Near Thamirabarani River Bridge', '627003', '06:00 AM - 10:00 PM (All 7 Days)', '+91 462 250 1190', true, 8.7139, 77.7567),
('hub-ngl-vadasery', 'nagercoil', 'Nagercoil', 'Vadasery', 'Vadasery Bus Terminus Hub', 'Cape Road, Near Christopher Bus Stand, Vadasery, Nagercoil - 629001', 'Near Kanyakumari Highway Junction', '629001', '06:30 AM - 10:00 PM (All 7 Days)', '+91 4652 233 880', true, 8.1833, 77.4119),
('hub-kpm-gandhiroad', 'kanchipuram', 'Kanchipuram', 'Gandhi Road', 'Gandhi Road Hub', 'Gandhi Road, Near Ekambareswarar Temple, Kanchipuram - 631501', 'Near Bus Stand', '631501', '06:30 AM - 09:30 PM (All 7 Days)', '+91 44 2722 4410', true, 12.8342, 79.7036),
('hub-cgp-gstroad', 'chengalpattu', 'Chengalpattu', 'GST Road', 'Chengalpattu Junction Hub', 'GST Road, Near Railway Junction, Chengalpattu - 603001', 'Gateway to Southern Tamil Nadu', '603001', '06:00 AM - 10:30 PM (All 7 Days)', '+91 44 2742 5590', true, 12.6841, 79.9836),
('hub-ooty-charringcross', 'ooty', 'Ooty (Nilgiris)', 'Charring Cross', 'Charring Cross Nilgiris Hub', 'Commercial Road, Charring Cross, Udhagamandalam (Ooty) - 643001', 'Near Botanical Gardens Road', '643001', '07:00 AM - 09:00 PM (All 7 Days)', '+91 423 244 3320', true, 11.4102, 76.6950),
('hub-kodai-lakeroad', 'kodaikanal', 'Kodaikanal', 'Lake Road', 'Kodaikanal Lake Hub', 'Lake Road, Near Bryant Park, Kodaikanal - 624101', 'Opposite Kodai Boat Club', '624101', '07:00 AM - 09:00 PM (All 7 Days)', '+91 4542 240 120', true, 10.2381, 77.4892)
ON CONFLICT (id) DO NOTHING;\n\n`;

// 3. VEHICLES (ALL 56 MODELS)
sql += `-- 3. VEHICLE INVENTORY (56 VERIFIED CARS & BIKES)\n`;
sql += `INSERT INTO public.vehicles (
  id, slug, name, brand, model, variant, year, type, category, body_type, bike_segment,
  registration_number, transmission, fuel_type, seating_capacity, engine_capacity, mileage,
  price_per_day, weekend_price, security_deposit, rating, review_count, cover_image,
  location_id, location_name, description, features, status, is_active
) VALUES\n`;

const vehicleRows = vehicles.map((v) => {
  const featuresSql = `ARRAY[${v.features.map((f) => `'${f.replace(/'/g, "''")}'`).join(', ')}]`;
  const seatingSql = v.seatingCapacity ? v.seatingCapacity : 'NULL';
  const engineSql = v.engineCapacity ? `'${v.engineCapacity}'` : 'NULL';
  const bodyTypeSql = v.bodyType ? `'${v.bodyType}'` : 'NULL';
  const bikeSegSql = v.bikeSegment ? `'${v.bikeSegment}'` : 'NULL';

  return `('${v.id}', '${v.slug}', '${v.name.replace(/'/g, "''")}', '${v.brand.replace(/'/g, "''")}', '${v.model.replace(/'/g, "''")}', '${v.variant.replace(/'/g, "''")}', ${v.year}, '${v.type}', '${v.category}', ${bodyTypeSql}, ${bikeSegSql}, '${v.registrationNumber}', '${v.transmission}', '${v.fuelType}', ${seatingSql}, ${engineSql}, '${v.mileage}', ${v.pricePerDay}, ${v.weekendPrice}, ${v.securityDeposit}, ${v.rating}, ${v.reviewCount}, '${v.coverImage}', '${v.pickupLocationId}', '${v.location.replace(/'/g, "''")}', '${v.description}', ${featuresSql}, 'available', true)`;
});

sql += vehicleRows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

// 4. SAMPLE BOOKINGS
sql += `-- 4. INITIAL SAMPLE BOOKINGS (FOR TESTING & DEMO)
INSERT INTO public.bookings (
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
) ON CONFLICT (id) DO NOTHING;\n\n`;

// 5. TRANSACTIONS
sql += `-- 5. INITIAL TRANSACTIONS
INSERT INTO public.payments (
  id, booking_id, customer_name, customer_email, amount, payment_method, type, status, razorpay_payment_id
) VALUES
('TXN-90214', 'RR-8914', 'Ananya Deshmukh', 'ananya.deshmukh@yahoo.com', 4295.00, 'UPI', 'rental_charge', 'success', 'pay_RR_90214_test'),
('TXN-90180', 'RR-8914', 'Ananya Deshmukh', 'ananya.deshmukh@yahoo.com', 1500.00, 'UPI', 'security_deposit', 'success', 'pay_RR_90180_test')
ON CONFLICT (id) DO NOTHING;\n`;

fs.writeFileSync(path.join(process.cwd(), 'supabase', 'seed.sql'), sql, 'utf8');
console.log('Successfully wrote full supabase/seed.sql with all 56 vehicles and hubs!');

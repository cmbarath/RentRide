import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { createEphemeralQaCustomer, cleanupEphemeralQaUsers } from './qa-temp-users.mjs';

function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const envConfig = loadEnv();
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envConfig.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = envConfig.SUPABASE_SECRET_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = 'http://localhost:3000';

const results = [];

function recordTest(id, section, description, passed, details = '') {
  results.push({ id, section, description, passed, details, status: passed ? 'VERIFIED WORKING' : 'FAILED' });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${id}] [${section}] ${description} ${details ? '(' + details + ')' : ''}`);
}

async function main() {
  console.log('=== RENTRIDE SECURITY AUDIT SUITE ===');
  console.log('Target URL:', supabaseUrl);
  console.log('API Base:', API_BASE);

  // Initialize raw admin client
  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const adminEmail = envConfig.QA_ADMIN_EMAIL;
  const adminPass = envConfig.QA_ADMIN_PASSWORD;

  if (!adminEmail || !adminPass) {
    console.error('Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD in .env.local before running.');
    process.exit(1);
  }

  const ephemeralIds = [];
  const custA = await createEphemeralQaCustomer(adminClient, 'audit-a');
  ephemeralIds.push(custA.id);
  const custB = await createEphemeralQaCustomer(adminClient, 'audit-b');
  ephemeralIds.push(custB.id);

  const custAEmail = custA.email;
  const custAPhone = custA.phone;
  const custBEmail = custB.email;
  const custBPhone = custB.phone;

  try {
  // 1. Authenticate Ephemeral Customer A
  const custAAuth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: custASession, error: aErr } = await custAAuth.auth.signInWithPassword({
    email: custA.email,
    password: custA.password,
  });
  if (aErr || !custASession.session) {
    console.error('Failed to authenticate Customer A:', aErr);
    process.exit(1);
  }
  const tokenA = custASession.session.access_token;
  const userAId = custASession.user.id;

  // 2. Authenticate Ephemeral Customer B
  const custBAuth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: custBSession, error: bErr } = await custBAuth.auth.signInWithPassword({
    email: custB.email,
    password: custB.password,
  });
  if (bErr || !custBSession.session) {
    console.error('Failed to authenticate Customer B:', bErr);
    process.exit(1);
  }
  const tokenB = custBSession.session.access_token;
  const userBId = custBSession.user.id;

  // 3. Authenticate Admin
  const adminAuth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: adminSession, error: admErr } = await adminAuth.auth.signInWithPassword({
    email: adminEmail,
    password: adminPass,
  });
  if (admErr || !adminSession.session) {
    console.error('Failed to authenticate Admin:', admErr);
    process.exit(1);
  }
  const tokenAdmin = adminSession.session.access_token;
  const adminId = adminSession.user.id;

  console.log(`Authenticated:`);
  console.log(`- Customer A: ${userAId}`);
  console.log(`- Customer B: ${userBId}`);
  console.log(`- Admin: ${adminId}\n`);

  // Clean up prior test artefacts for idempotent testing
  await adminClient.from('bookings').delete().like('id', 'RR-AUDIT-%');
  await adminClient.from('bookings').delete().like('id', 'RR-OVERLAP-%');
  await adminClient.from('driving_licences').delete().in('user_id', [userAId, userBId]);

  // Create RLS user clients
  const clientAnon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const clientA = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${tokenA}` } },
    auth: { persistSession: false },
  });
  const clientB = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${tokenB}` } },
    auth: { persistSession: false },
  });
  const clientAdminUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${tokenAdmin}` } },
    auth: { persistSession: false },
  });

  // ==========================================
  // SECTION 1: PROFILES & ROLE ESCALATION
  // ==========================================
  console.log('--- SECTION 1: Customer Profiles & Role Escalation ---');

  // Test 1: Customer A reads own profile
  {
    const { data, error } = await clientA.from('profiles').select('*').eq('id', userAId);
    recordTest('P-1', 'Profiles', 'Customer A can read own profile', !error && data && data.length === 1);
  }

  // Test 2: Customer A cannot read Customer B's profile via direct RLS
  {
    const { data, error } = await clientA.from('profiles').select('*').eq('id', userBId);
    recordTest('P-2', 'Profiles', "Customer A cannot view Customer B's profile (RLS)", (!data || data.length === 0));
  }

  // Test 3: Customer A cannot escalate role to admin
  {
    const { error } = await clientA
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userAId);
    
    // Check if role is still customer
    const { data } = await adminClient.from('profiles').select('role').eq('id', userAId).single();
    const prevented = data?.role === 'customer';
    recordTest('P-3', 'Profiles', 'Customer A cannot escalate own role to admin (RLS WITH CHECK)', prevented, `Role: ${data?.role}`);
  }

  // Test 4: Admin can read all profiles
  {
    const { data, error } = await clientAdminUser.from('profiles').select('*');
    recordTest('P-4', 'Profiles', 'Admin can view all customer profiles (RLS)', !error && data && data.length >= 3, `Count: ${data?.length}`);
  }

  // ==========================================
  // SECTION 2: DRIVING LICENCES & KYC
  // ==========================================
  console.log('\n--- SECTION 2: Driving Licences & KYC ---');

  // Setup test licences in DB
  await adminClient.from('driving_licences').insert([
    {
      user_id: userAId,
      licence_number: 'TN-01-20230001234',
      status: 'pending',
      front_image_url: 'driving-licences/' + userAId + '/front.jpg',
      back_image_url: 'driving-licences/' + userAId + '/back.jpg',
    },
    {
      user_id: userBId,
      licence_number: 'TN-02-20230005678',
      status: 'pending',
      front_image_url: 'driving-licences/' + userBId + '/front.jpg',
      back_image_url: 'driving-licences/' + userBId + '/back.jpg',
    },
  ]);

  // Test 5: Customer A reads own licence
  {
    const { data } = await clientA.from('driving_licences').select('*').eq('user_id', userAId);
    recordTest('L-1', 'KYC Licences', 'Customer A can view own driving licence', data && data.length >= 1);
  }

  // Test 6: Customer A cannot read Customer B's licence
  {
    const { data } = await clientA.from('driving_licences').select('*').eq('user_id', userBId);
    recordTest('L-2', 'KYC Licences', "Customer A cannot view Customer B's licence (RLS)", (!data || data.length === 0));
  }

  // Test 7: Customer A cannot approve/verify own licence
  {
    const { error } = await clientA
      .from('driving_licences')
      .update({ status: 'verified' })
      .eq('user_id', userAId);

    const { data } = await adminClient.from('driving_licences').select('status').eq('user_id', userAId).limit(1);
    recordTest('L-3', 'KYC Licences', 'Customer A cannot self-verify driving licence (RLS)', data?.[0]?.status === 'pending', `Status: ${data?.[0]?.status}`);
  }

  // Test 8: Admin can update customer licence status
  {
    const { error } = await clientAdminUser
      .from('driving_licences')
      .update({ status: 'verified', verified_at: new Date().toISOString() })
      .eq('user_id', userAId);
    const { data } = await adminClient.from('driving_licences').select('status').eq('user_id', userAId).limit(1);
    recordTest('L-4', 'KYC Licences', 'Admin can verify customer driving licence', data?.[0]?.status === 'verified');
  }

  // ==========================================
  // SECTION 3: BOOKING MANAGEMENT & RPC ATOMIC
  // ==========================================
  console.log('\n--- SECTION 3: Booking Security & Atomic Prevention ---');

  // Find a test vehicle
  const { data: vehs } = await adminClient.from('vehicles').select('id, name').eq('is_active', true).limit(1);
  const testVehicle = vehs?.[0];
  if (!testVehicle) {
    console.error('No active vehicles found in DB!');
    process.exit(1);
  }

  // Test 9: Create booking via atomic RPC by Customer A
  const bookingAId = `RR-AUDIT-A-${Date.now().toString().slice(-4)}`;
  {
    const { data, error } = await clientA.rpc('create_booking_atomic', {
      p_booking_id: bookingAId,
      p_user_id: userAId,
      p_vehicle_id: testVehicle.id,
      p_pickup_date: '2026-12-01',
      p_pickup_time: '10:00:00',
      p_return_date: '2026-12-03',
      p_return_time: '18:00:00',
      p_pickup_location_id: null,
      p_pickup_location: 'Chennai Central Hub',
      p_return_location_id: null,
      p_return_location: 'Chennai Central Hub',
      p_delivery_type: 'hub',
      p_delivery_address: null,
      p_customer_name: 'Customer A Test',
      p_customer_email: custAEmail,
      p_customer_phone: custAPhone,
      p_licence_id: null,
      p_licence_number: 'TN-01-20230001234',
      p_duration_days: 2,
      p_rental_charges: 3000,
      p_security_deposit: 2000,
      p_tax_amount: 540,
      p_insurance_fee: 300,
      p_total_amount: 5840,
      p_pricing_snapshot: {},
    });

    recordTest('B-1', 'Bookings', 'Customer A creates booking via create_booking_atomic', !error && (data?.success || data === true));
  }

  // Test 10: Double booking protection (overlapping dates for same vehicle)
  {
    const overlapId = `RR-OVERLAP-${Date.now().toString().slice(-4)}`;
    const { data, error } = await clientB.rpc('create_booking_atomic', {
      p_booking_id: overlapId,
      p_user_id: userBId,
      p_vehicle_id: testVehicle.id,
      p_pickup_date: '2026-12-02', // Overlaps with 2026-12-01 to 2026-12-03!
      p_pickup_time: '10:00:00',
      p_return_date: '2026-12-04',
      p_return_time: '18:00:00',
      p_pickup_location_id: null,
      p_pickup_location: 'Chennai Central Hub',
      p_return_location_id: null,
      p_return_location: 'Chennai Central Hub',
      p_delivery_type: 'hub',
      p_delivery_address: null,
      p_customer_name: 'Customer B Test',
      p_customer_email: custBEmail,
      p_customer_phone: custBPhone,
      p_licence_id: null,
      p_licence_number: 'TN-02-20230005678',
      p_duration_days: 2,
      p_rental_charges: 3000,
      p_security_deposit: 2000,
      p_tax_amount: 540,
      p_insurance_fee: 300,
      p_total_amount: 5840,
      p_pricing_snapshot: {},
    });

    const isRejected = (error !== null) || (data && data.success === false);
    recordTest('B-2', 'Bookings', 'Double booking atomic protection rejects overlapping dates', isRejected, error?.message || data?.error);
  }

  // Create booking for Customer B on non-overlapping dates
  const bookingBId = `RR-AUDIT-B-${Date.now().toString().slice(-4)}`;
  await adminClient.rpc('create_booking_atomic', {
    p_booking_id: bookingBId,
    p_user_id: userBId,
    p_vehicle_id: testVehicle.id,
    p_pickup_date: '2026-12-10',
    p_pickup_time: '10:00:00',
    p_return_date: '2026-12-12',
    p_return_time: '18:00:00',
    p_pickup_location_id: null,
    p_pickup_location: 'Coimbatore Airport Hub',
    p_return_location_id: null,
    p_return_location: 'Coimbatore Airport Hub',
    p_delivery_type: 'hub',
    p_delivery_address: null,
    p_customer_name: 'Customer B Test',
    p_customer_email: custBEmail,
    p_customer_phone: custBPhone,
    p_licence_id: null,
    p_licence_number: 'TN-02-20230005678',
    p_duration_days: 2,
    p_rental_charges: 3000,
    p_security_deposit: 2000,
    p_tax_amount: 540,
    p_insurance_fee: 300,
    p_total_amount: 5840,
    p_pricing_snapshot: {},
  });

  // Test 11: Customer A reads own booking
  {
    const { data } = await clientA.from('bookings').select('*').eq('id', bookingAId);
    recordTest('B-3', 'Bookings', 'Customer A can view own booking (RLS)', data && data.length === 1);
  }

  // Test 12: Customer A cannot read Customer B's booking directly via RLS
  {
    const { data } = await clientA.from('bookings').select('*').eq('id', bookingBId);
    recordTest('B-4', 'Bookings', "Customer A cannot read Customer B's booking (RLS)", (!data || data.length === 0));
  }

  // Test 13: Customer A cannot update Customer B's booking directly via RLS
  {
    const { error } = await clientA.from('bookings').update({ booking_status: 'confirmed' }).eq('id', bookingBId);
    const { data } = await adminClient.from('bookings').select('booking_status').eq('id', bookingBId).single();
    recordTest('B-5', 'Bookings', "Customer A cannot update Customer B's booking (RLS)", data?.booking_status !== 'confirmed', `Status: ${data?.booking_status}`);
  }

  // Test 14: Customer A cannot approve bookings directly via RLS
  {
    const { error } = await clientA.from('bookings').update({ booking_status: 'confirmed' }).eq('id', bookingAId);
    const { data } = await adminClient.from('bookings').select('booking_status').eq('id', bookingAId).single();
    recordTest('B-6', 'Bookings', 'Customer A cannot self-approve own booking (RLS)', data?.booking_status !== 'confirmed', `Status: ${data?.booking_status}`);
  }

  // Test 15: Admin can view all bookings
  {
    const { data } = await clientAdminUser.from('bookings').select('*');
    recordTest('B-7', 'Bookings', 'Admin can read all bookings across all customers (RLS)', data && data.length >= 2, `Total: ${data?.length}`);
  }

  // ==========================================
  // SECTION 4: VEHICLE MANAGEMENT RLS
  // ==========================================
  console.log('\n--- SECTION 4: Vehicle Management RLS ---');

  // Test 16: Public user can view active vehicles
  {
    const { data } = await clientAnon.from('vehicles').select('id, name, is_active').eq('is_active', true);
    recordTest('V-1', 'Vehicles', 'Public anonymous user can view active vehicles (RLS)', data && data.length > 0, `Count: ${data?.length}`);
  }

  // Test 17: Customer A cannot insert a new vehicle
  const hackVehId = `veh-hack-${Date.now().toString().slice(-4)}`;
  {
    const { error } = await clientA.from('vehicles').insert([
      {
        id: hackVehId,
        slug: `hack-vehicle-${Date.now()}`,
        name: 'Hacked Vehicle',
        brand: 'Fake',
        model: 'Rogue',
        variant: 'Base',
        year: 2024,
        type: 'car',
        category: 'suv',
        description: 'Unauthorized vehicle insertion attempt by customer',
        registration_number: `TN-00-HACK-${Math.floor(1000 + Math.random() * 9000)}`,
        transmission: 'Manual',
        fuel_type: 'Petrol',
        mileage: '15 kmpl',
        price_per_day: 1000,
        security_deposit: 1000,
        cover_image: '/images/vehicles/sample.jpg',
        location_id: null,
        location_name: 'Chennai Central Hub',
        status: 'available',
        is_active: true,
      },
    ]);
    const { data } = await adminClient.from('vehicles').select('id').eq('id', hackVehId).maybeSingle();
    recordTest('V-2', 'Vehicles', 'Customer A cannot insert vehicle into fleet (RLS)', !data, error?.message);
  }

  // Test 18: Admin can insert a vehicle
  const adminVehId = `veh-adm-${Date.now().toString().slice(-4)}`;
  {
    const { error } = await clientAdminUser.from('vehicles').insert([
      {
        id: adminVehId,
        slug: `admin-fleet-vehicle-${Date.now()}`,
        name: 'Admin Fleet Vehicle',
        brand: 'Tata',
        model: 'Safari',
        variant: 'XZA Plus',
        year: 2024,
        type: 'car',
        category: 'suv',
        description: 'Premium Tata Safari SUV for luxury rentals across Tamil Nadu',
        registration_number: `TN-01-AF-${Math.floor(1000 + Math.random() * 9000)}`,
        transmission: 'Automatic',
        fuel_type: 'Diesel',
        mileage: '16.14 kmpl',
        price_per_day: 3500,
        security_deposit: 4000,
        cover_image: '/images/vehicles/sample.jpg',
        location_id: null,
        location_name: 'Chennai Central Hub',
        status: 'available',
        is_active: true,
      },
    ]);
    const { data } = await adminClient.from('vehicles').select('id').eq('id', adminVehId).maybeSingle();
    recordTest('V-3', 'Vehicles', 'Admin can add vehicle to fleet (RLS)', !!data, error?.message);
  }

  // ==========================================
  // SECTION 5: HTTP API ROUTE GUARDS & RBAC
  // ==========================================
  console.log('\n--- SECTION 5: HTTP API Route Guards (Server Authentication & RBAC) ---');

  // Check if API server is up
  let serverReachable = false;
  try {
    const res = await fetch(`${API_BASE}/api/vehicles`);
    if (res.ok) serverReachable = true;
  } catch {}

  if (!serverReachable) {
    console.warn(`\n⚠️  Next.js server is not reachable at ${API_BASE}. Running API tests in direct mode if needed or start Next.js.`);
    recordTest('API-0', 'API Server', 'Next.js server availability check', false, 'Server not running on port 3000');
  } else {
    // Test 19: GET /api/bookings without auth -> 401
    {
      const res = await fetch(`${API_BASE}/api/bookings`);
      recordTest('API-1', 'API Bookings', 'GET /api/bookings without auth returns 401 Unauthorized', res.status === 401, `Status: ${res.status}`);
    }

    // Test 20: GET /api/bookings with Customer A token -> Returns only Customer A's bookings
    {
      const res = await fetch(`${API_BASE}/api/bookings?userId=${userBId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const body = await res.json();
      const onlyCustomerABookings = body.bookings?.every(b => b.customerId === userAId);
      recordTest('API-2', 'API Bookings', "GET /api/bookings with Customer A token cannot view Customer B's bookings (forced to own)", res.status === 200 && onlyCustomerABookings, `Returned: ${body.bookings?.length}`);
    }

    // Test 21: Customer A cannot approve booking via PATCH /api/bookings/[id] -> 403 Forbidden
    {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingAId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      recordTest('API-3', 'API Bookings', 'Customer A cannot approve booking via PATCH /api/bookings/[id] (403 Forbidden)', res.status === 403, `Status: ${res.status}`);
    }

    // Test 22: Customer A cannot reject booking via PATCH /api/bookings/[id] -> 403 Forbidden
    {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingAId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ action: 'reject', reason: 'Customer attempt' }),
      });
      recordTest('API-4', 'API Bookings', 'Customer A cannot reject booking via PATCH /api/bookings/[id] (403 Forbidden)', res.status === 403, `Status: ${res.status}`);
    }

    // Test 23: Customer A cannot confirm payment via PATCH /api/bookings/[id] -> 403 Forbidden
    {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingAId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ action: 'confirm_payment' }),
      });
      recordTest('API-5', 'API Bookings', 'Customer A cannot confirm counter payment (403 Forbidden)', res.status === 403, `Status: ${res.status}`);
    }

    // Test 24: Customer A cannot add vehicle via POST /api/vehicles -> 403 Forbidden
    {
      const res = await fetch(`${API_BASE}/api/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ name: 'Hacked Car', brand: 'Test', type: 'car', category: 'suv' }),
      });
      recordTest('API-6', 'API Vehicles', 'Customer A cannot create vehicle via POST /api/vehicles (403 Forbidden)', res.status === 403, `Status: ${res.status}`);
    }

    // Test 25: Admin can approve booking via PATCH /api/bookings/[id] -> 200 OK
    {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingAId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      const body = await res.json();
      recordTest('API-7', 'API Admin', 'Admin can approve booking via PATCH /api/bookings/[id] (200 OK)', res.status === 200 && body.success, `Status: ${res.status}`);
    }

    // Test 26: Admin action generates audit log in public.admin_audit_logs
    {
      const { data } = await adminClient
        .from('admin_audit_logs')
        .select('*')
        .eq('entity_id', bookingAId)
        .eq('action', 'approve_booking');
      recordTest('API-8', 'Audit Logs', 'Admin approval action is recorded in public.admin_audit_logs', data && data.length > 0, `Logs found: ${data?.length}`);
    }

    // Test 27: Admin can record counter payment via POST /api/payments -> 200 OK
    {
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({
          bookingId: bookingAId,
          customerName: 'Customer A Test',
          customerEmail: custAEmail,
          amount: 5840,
          paymentMethod: 'Cash',
          type: 'rental_charge',
        }),
      });
      const body = await res.json();
      recordTest('API-9', 'API Payments', 'Admin can record counter payment settlement via POST /api/payments', res.status === 200 && body.success);
    }

    // Test 28: Admin can view all customers via GET /api/customers
    {
      const res = await fetch(`${API_BASE}/api/customers`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      const body = await res.json();
      recordTest('API-10', 'API Customers', 'Admin can view customer list via GET /api/customers', res.status === 200 && body.customers?.length >= 3, `Count: ${body.customers?.length}`);
    }

    // Test 29: Customer A cannot view customer list via GET /api/customers -> 403 Forbidden
    {
      const res = await fetch(`${API_BASE}/api/customers`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      recordTest('API-11', 'API Customers', 'Customer A cannot view customer list via GET /api/customers (403 Forbidden)', res.status === 403, `Status: ${res.status}`);
    }

    // Test 30: Admin can update customer licence verification via PATCH /api/customers/[id]/licence
    {
      const res = await fetch(`${API_BASE}/api/customers/${userAId}/licence`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({ status: 'verified' }),
      });
      const body = await res.json();
      recordTest('API-12', 'API Customers', 'Admin can update customer licence status via API', res.status === 200 && body.success);
    }
  }

  // Clean up test admin vehicle
  await adminClient.from('vehicles').delete().eq('id', adminVehId);
  } finally {
    await cleanupEphemeralQaUsers(adminClient, ephemeralIds);
  }

  // Summary Table
  console.log('\n======================================================');
  console.log('                 AUDIT SUMMARY REPORT                 ');
  console.log('======================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log('======================================================\n');
}

main().catch(console.error);

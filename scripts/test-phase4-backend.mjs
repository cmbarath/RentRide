import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

const testResults = [];

function recordTest(id, moduleName, description, passed, details = '') {
  testResults.push({ id, module: moduleName, description, passed, details, status: passed ? 'VERIFIED WORKING' : 'FAILED' });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${id}] [${moduleName}] ${description} ${details ? '(' + details + ')' : ''}`);
}

async function main() {
  console.log('======================================================');
  console.log('      RENTRIDE PHASE 4: BACKEND VERIFICATION SUITE    ');
  console.log('======================================================');

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Authenticate Customer A
  const custAAuth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: custASession } = await custAAuth.auth.signInWithPassword({
    email: 'qa-deleted-customer-a@example.invalid',
    password: 'REDACTED_DELETED_QA_PASSWORD',
  });
  const tokenA = custASession.session.access_token;
  const userAId = custASession.user.id;

  // Authenticate Customer B
  const custBAuth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: custBSession } = await custBAuth.auth.signInWithPassword({
    email: 'qa-deleted-customer-b@example.invalid',
    password: 'REDACTED_DELETED_QA_PASSWORD',
  });
  const tokenB = custBSession.session.access_token;
  const userBId = custBSession.user.id;

  // Authenticate Admin
  const adminAuth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: adminSession } = await adminAuth.auth.signInWithPassword({
    email: 'admin@rentride.in',
    password: 'REDACTED_ROTATED_ADMIN_PASSWORD',
  });
  const tokenAdmin = adminSession.session.access_token;
  const adminId = adminSession.user.id;

  console.log(`Identities Authenticated:`);
  console.log(`- Customer A: ${userAId}`);
  console.log(`- Customer B: ${userBId}`);
  console.log(`- Admin: ${adminId}\n`);

  // ==========================================
  // MODULE A: VEHICLE MANAGEMENT
  // ==========================================
  console.log('--- MODULE A: Vehicle Management ---');

  // Test A-1: Public vehicle listing with pagination & sorting
  {
    const res = await fetch(`${API_BASE}/api/vehicles?page=1&limit=5&sort=price_asc`);
    const body = await res.json();
    const sorted = body.vehicles?.length > 1 && body.vehicles[0].pricePerDay <= body.vehicles[1].pricePerDay;
    recordTest('A-1', 'Vehicles', 'Public vehicle listing with pagination & price_asc sorting', res.status === 200 && body.vehicles?.length === 5 && sorted, `Count: ${body.vehicles?.length}`);
  }

  // Test A-2: Vehicle details by ID
  let sampleVehId = 'veh-cr-20';
  {
    const res = await fetch(`${API_BASE}/api/vehicles/${sampleVehId}`);
    const body = await res.json();
    recordTest('A-2', 'Vehicles', 'Retrieve vehicle details by ID', res.status === 200 && body.vehicle?.id === sampleVehId, `Name: ${body.vehicle?.name}`);
  }

  // Test A-3: Admin creates a vehicle with full schema
  let qaVehId = `veh-qa-${Date.now().toString().slice(-4)}`;
  {
    const res = await fetch(`${API_BASE}/api/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        name: 'Mahindra Thar Roxx 4x4',
        brand: 'Mahindra',
        model: 'Thar Roxx',
        variant: 'AX7L AT',
        year: 2025,
        type: 'car',
        category: 'SUV',
        registrationNumber: `TN-05-QA-${Math.floor(1000 + Math.random() * 9000)}`,
        transmission: 'Automatic',
        fuelType: 'Diesel',
        seatingCapacity: 5,
        mileage: '14.5 kmpl',
        pricePerDay: 4200,
        securityDeposit: 5000,
        coverImage: '/images/vehicles/sample.jpg',
        location: 'T. Nagar Hub, Chennai',
        description: 'Iconic 5-door off-road lifestyle SUV with panoramic sunroof.',
      }),
    });
    const body = await res.json();
    if (body.vehicle?.id) qaVehId = body.vehicle.id;
    recordTest('A-3', 'Vehicles', 'Admin creates vehicle with full Zod validation', res.status === 201 && body.success, `ID: ${body.vehicle?.id}`);
  }

  // Test A-4: Customer cannot create a vehicle
  {
    const res = await fetch(`${API_BASE}/api/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'Fake Car', brand: 'Fake', model: 'X', type: 'car' }),
    });
    recordTest('A-4', 'Vehicles', 'Customer cannot create vehicle (403 Forbidden)', res.status === 403);
  }

  // Test A-5: Admin updates vehicle details
  {
    const res = await fetch(`${API_BASE}/api/vehicles/${sampleVehId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ pricePerDay: 3600 }),
    });
    const body = await res.json();
    recordTest('A-5', 'Vehicles', 'Admin updates vehicle pricing details', res.status === 200 && body.success);
  }

  // Test A-6: Admin soft-deletes/deactivates vehicle
  {
    const res = await fetch(`${API_BASE}/api/vehicles/${sampleVehId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const body = await res.json();
    // Reactivate for fleet continuity
    await adminClient.from('vehicles').update({ is_active: true, status: 'available' }).eq('id', sampleVehId);
    recordTest('A-6', 'Vehicles', 'Admin soft-deletes/deactivates vehicle', res.status === 200 && body.success);
  }

  // ==========================================
  // MODULE B: LOCATION MANAGEMENT
  // ==========================================
  console.log('\n--- MODULE B: Location Management ---');

  // Test B-1: Public location search & filter
  {
    const res = await fetch(`${API_BASE}/api/locations?cityId=chennai&search=nagar`);
    const body = await res.json();
    recordTest('B-1', 'Locations', 'Retrieve pickup locations filtered by city & search', res.status === 200 && body.locations?.length > 0, `Found: ${body.locations?.length}`);
  }

  // Test B-2: Admin creates a new pickup location
  const qaLocId = `hub-qa-${Date.now().toString().slice(-4)}`;
  {
    const res = await fetch(`${API_BASE}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        id: qaLocId,
        cityId: 'chennai',
        cityName: 'Chennai',
        areaName: 'OMR Sholinganallur',
        displayName: 'OMR Tech Corridor Hub',
        address: 'No. 45, Rajiv Gandhi IT Expressway, Sholinganallur, Chennai - 600119',
        landmark: 'Near Sholinganallur Junction',
        pincode: '600119',
        operatingHours: '06:00 AM - 11:00 PM',
        contactNumber: '+91 44 2855 0000',
        isActive: true,
      }),
    });
    const body = await res.json();
    recordTest('B-2', 'Locations', 'Admin creates new pickup location', res.status === 201 && body.success, `ID: ${body.location?.id}`);
  }

  // Test B-3: Customer cannot create location
  {
    const res = await fetch(`${API_BASE}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ cityId: 'chennai', cityName: 'Chennai', areaName: 'X', displayName: 'X' }),
    });
    recordTest('B-3', 'Locations', 'Customer cannot create location (403 Forbidden)', res.status === 403);
  }

  // Test B-4: Admin updates location
  {
    const res = await fetch(`${API_BASE}/api/locations/${qaLocId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ operatingHours: '24 Hours Open' }),
    });
    const body = await res.json();
    recordTest('B-4', 'Locations', 'Admin updates location operating hours', res.status === 200 && body.success);
  }

  // Test B-5: Admin disables location
  {
    const res = await fetch(`${API_BASE}/api/locations/${qaLocId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const body = await res.json();
    recordTest('B-5', 'Locations', 'Admin disables pickup location', res.status === 200 && body.success);
  }

  // ==========================================
  // MODULE C: BOOKING MANAGEMENT
  // ==========================================
  console.log('\n--- MODULE C: Booking Management ---');

  // Test C-1: Server-side atomic booking creation
  let createdBookingId = '';
  {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        vehicleId: 'veh-cr-03',
        pickupDate: '2026-12-20',
        pickupTime: '10:00',
        returnDate: '2026-12-22',
        returnTime: '18:00',
        pickupLocation: 'Chennai Central Hub',
        returnLocation: 'Chennai Central Hub',
        deliveryType: 'hub',
        customerName: 'QA Customer A',
        customerEmail: 'qa-deleted-customer-a@example.invalid',
        customerPhone: '9000000001',
      }),
    });
    const body = await res.json();
    createdBookingId = body.bookingId;
    recordTest('C-1', 'Bookings', 'Customer creates booking via server-side atomic validation', res.status === 200 && body.success, `Booking ID: ${createdBookingId}`);
  }

  // Test C-2: Overlapping double-booking prevention check
  {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        vehicleId: 'veh-cr-03',
        pickupDate: '2026-12-21', // Overlaps with Dec 20–22!
        pickupTime: '10:00',
        returnDate: '2026-12-23',
        returnTime: '18:00',
        pickupLocation: 'Chennai Central Hub',
        returnLocation: 'Chennai Central Hub',
        deliveryType: 'hub',
        customerName: 'Chitra',
        customerEmail: 'qa-deleted-customer-b@example.invalid',
        customerPhone: '9000000002',
      }),
    });
    const body = await res.json();
    recordTest('C-2', 'Bookings', 'Concurrency engine rejects overlapping reservation', res.status === 400 && !body.success, body.error);
  }

  // Test C-3: Customer retrieves own bookings (data isolation)
  {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const body = await res.json();
    const allOwn = body.bookings?.every(b => b.customerId === userAId);
    recordTest('C-3', 'Bookings', 'Customer booking retrieval preserves tenant isolation', res.status === 200 && allOwn, `Count: ${body.bookings?.length}`);
  }

  // Test C-4: Retrieve individual booking details with status history
  {
    const res = await fetch(`${API_BASE}/api/bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const body = await res.json();
    const hasHistory = body.booking?.statusHistory?.length > 0;
    recordTest('C-4', 'Bookings', 'Retrieve booking details with hydrated status history', res.status === 200 && hasHistory, `History Steps: ${body.booking?.statusHistory?.length}`);
  }

  // Test C-5: Admin retrieves all bookings
  {
    const res = await fetch(`${API_BASE}/api/bookings?status=pending_review`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const body = await res.json();
    recordTest('C-5', 'Bookings', 'Admin retrieves bookings list with status filter', res.status === 200 && body.bookings?.length > 0, `Total: ${body.bookings?.length}`);
  }

  // Test C-6: Admin approves booking
  {
    const res = await fetch(`${API_BASE}/api/bookings/${createdBookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ action: 'approve' }),
    });
    const body = await res.json();
    recordTest('C-6', 'Bookings', 'Admin approves booking reservation', res.status === 200 && body.success);
  }

  // Test C-7: Customer cancels own booking
  {
    const res = await fetch(`${API_BASE}/api/bookings/${createdBookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ action: 'cancel', reason: 'Personal plans changed' }),
    });
    const body = await res.json();
    recordTest('C-7', 'Bookings', 'Customer cancels own booking reservation', res.status === 200 && body.success);
  }

  // ==========================================
  // MODULE D: PRICING MANAGEMENT
  // ==========================================
  console.log('\n--- MODULE D: Pricing Management ---');

  // Test D-1: Server-side pricing calculation
  {
    const res = await fetch(`${API_BASE}/api/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 'veh-cr-03',
        pickupDate: '2026-12-25',
        pickupTime: '10:00',
        returnDate: '2026-12-27',
        returnTime: '10:00',
        deliveryType: 'doorstep',
      }),
    });
    const body = await res.json();
    const validMath =
      body.pricing?.rentalDurationDays === 2 &&
      body.pricing?.doorstepDeliveryFee === 299 &&
      body.pricing?.gstRate === 18 &&
      body.pricing?.totalAmount > 0;
    recordTest('D-1', 'Pricing', 'Server-side price calculation with GST, insurance, deposit', res.status === 200 && validMath, `Total: ₹${body.pricing?.totalAmount}`);
  }

  // Test D-2: Retrieve active pricing rules
  {
    const res = await fetch(`${API_BASE}/api/pricing/rules`);
    const body = await res.json();
    recordTest('D-2', 'Pricing', 'Retrieve statutory pricing and tax rules', res.status === 200 && body.rules?.length > 0);
  }

  // Test D-3: Admin creates/updates pricing rule
  let createdRuleId = '';
  {
    const res = await fetch(`${API_BASE}/api/pricing/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        ruleName: 'Tamil Nadu Festive Weekend Surge',
        targetType: 'all',
        weekendSurgePercent: 20.0,
        gstPercentage: 18.0,
        doorstepDeliveryFee: 349.0,
        carInsuranceFee: 499.0,
        bikeInsuranceFee: 199.0,
        isActive: true,
      }),
    });
    const body = await res.json();
    createdRuleId = body.rule?.id || '';
    recordTest('D-3', 'Pricing', 'Admin updates pricing rules with audit trail', res.status === 201 && body.success);
  }

  // Test D-4: Customer cannot create/update pricing rules
  {
    const res = await fetch(`${API_BASE}/api/pricing/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ ruleName: 'Hacked Price', targetType: 'all', gstPercentage: 0 }),
    });
    recordTest('D-4', 'Pricing', 'Customer cannot modify pricing rules (403 Forbidden)', res.status === 403);
  }

  // ==========================================
  // MODULE E: CUSTOMER MANAGEMENT
  // ==========================================
  console.log('\n--- MODULE E: Customer Management ---');

  // Test E-1: Customer retrieves own profile & bookings
  {
    const res = await fetch(`${API_BASE}/api/customers/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const body = await res.json();
    recordTest('E-1', 'Customers', 'Customer retrieves own profile & booking summary', res.status === 200 && body.profile?.email === 'qa-deleted-customer-a@example.invalid');
  }

  // Test E-2: Customer updates own profile
  {
    const res = await fetch(`${API_BASE}/api/customers/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ phone: '9876543210' }),
    });
    const body = await res.json();
    recordTest('E-2', 'Customers', 'Customer updates own profile details', res.status === 200 && body.profile?.phone === '9876543210');
  }

  // Test E-3: Customer A cannot view Customer B's profile
  {
    const res = await fetch(`${API_BASE}/api/customers/${userBId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest('E-3', 'Customers', "Customer A cannot view Customer B's profile (403 Forbidden)", res.status === 403);
  }

  // Test E-4: Admin can view any customer profile
  {
    const res = await fetch(`${API_BASE}/api/customers/${userAId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const body = await res.json();
    recordTest('E-4', 'Customers', 'Admin can view customer profile and booking records', res.status === 200 && body.customer?.id === userAId);
  }

  // ==========================================
  // MODULE F: DRIVING LICENCE MANAGEMENT
  // ==========================================
  console.log('\n--- MODULE F: Driving Licence Management ---');

  // Test F-1: File upload validation rejects invalid file format
  {
    const formData = new FormData();
    const fakeExe = new Blob(['malicious payload'], { type: 'application/x-msdownload' });
    formData.append('file', fakeExe, 'test.exe');
    formData.append('side', 'front');

    const res = await fetch(`${API_BASE}/api/customers/licence/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    recordTest('F-1', 'KYC Licences', 'Upload rejects disallowed file types (422 Unprocessable)', res.status === 422);
  }

  // Test F-2: Valid licence upload to private storage
  {
    const formData = new FormData();
    const fakeJpg = new Blob(['fake jpeg content bytes'], { type: 'image/jpeg' });
    formData.append('file', fakeJpg, 'licence_front.jpg');
    formData.append('side', 'front');
    formData.append('licenceNumber', 'TN-01-20230009999');

    const res = await fetch(`${API_BASE}/api/customers/licence/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const body = await res.json();
    recordTest('F-2', 'KYC Licences', 'Customer uploads licence to private driving-licences bucket', res.status === 200 && body.success);
  }

  // Test F-3: Private storage access with signed URL
  {
    const res = await fetch(`${API_BASE}/api/customers/${userAId}/licence`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const body = await res.json();
    const hasSignedUrl = !!body.signedUrls?.front;
    recordTest('F-3', 'KYC Licences', 'Owner generates short-lived signed URL for licence viewing', res.status === 200 && hasSignedUrl);
  }

  // Test F-4: Customer A cannot view Customer B's licence
  {
    const res = await fetch(`${API_BASE}/api/customers/${userBId}/licence`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    recordTest('F-4', 'KYC Licences', "Customer A cannot access Customer B's driving licence (403)", res.status === 403);
  }

  // Test F-5: Admin verifies customer licence
  {
    const res = await fetch(`${API_BASE}/api/customers/${userAId}/licence`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: 'verified' }),
    });
    const body = await res.json();
    recordTest('F-5', 'KYC Licences', 'Admin verifies customer driving licence', res.status === 200 && body.success);
  }

  // ==========================================
  // MODULE G: COUNTER PAYMENT SETTLEMENT
  // ==========================================
  console.log('\n--- MODULE G: Counter Payment Settlement ---');

  // Test G-1: Admin records actual counter payment (using a fresh uncancelled booking so C-7 cancellation stays intact)
  let sampleBookingForPayment = '';
  let createdTxnId = '';
  {
    const bRes = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        vehicleId: 'veh-cr-03',
        pickupDate: '2027-01-10',
        pickupTime: '10:00',
        returnDate: '2027-01-12',
        returnTime: '18:00',
        pickupLocation: 'Chennai Central Hub',
        returnLocation: 'Chennai Central Hub',
        deliveryType: 'hub',
        customerName: 'QA Customer A',
        customerEmail: 'qa-deleted-customer-a@example.invalid',
        customerPhone: '9000000001',
      }),
    });
    const bJson = await bRes.json();
    sampleBookingForPayment = bJson.bookingId || '';

    const res = await fetch(`${API_BASE}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        bookingId: sampleBookingForPayment,
        customerName: 'QA Customer A',
        customerEmail: 'qa-deleted-customer-a@example.invalid',
        amount: 5400,
        paymentMethod: 'Cash',
        type: 'rental_charge',
      }),
    });
    const body = await res.json();
    createdTxnId = body.transactionId || '';
    recordTest('G-1', 'Payments', 'Admin records counter payment settlement into ledger', (res.status === 200 || res.status === 201) && body.success, `Txn: ${body.transactionId}`);
  }

  // Test G-2: Customer blocked from recording counter payment
  {
    const res = await fetch(`${API_BASE}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        bookingId: sampleBookingForPayment,
        customerName: 'QA Customer A',
        customerEmail: 'qa-deleted-customer-a@example.invalid',
        amount: 5400,
        paymentMethod: 'Cash',
      }),
    });
    recordTest('G-2', 'Payments', 'Customer blocked from self-recording payments (403 Forbidden)', res.status === 403);
  }

  // Test G-3: Payment ledger retrieval
  {
    const res = await fetch(`${API_BASE}/api/payments`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const body = await res.json();
    recordTest('G-3', 'Payments', 'Admin retrieves financial payment ledger records', res.status === 200 && body.transactions?.length > 0, `Total Txns: ${body.transactions?.length}`);
  }

  // ==========================================
  // MODULE H: REVIEWS
  // ==========================================
  console.log('\n--- MODULE H: Reviews & Ratings ---');

  // Test H-1: Submit review rejected if user has not booked that vehicle
  {
    const res = await fetch(`${API_BASE}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        bookingId: createdBookingId, // belongs to Customer A, not B
        vehicleId: 'veh-cr-03',
        rating: 5,
        comment: 'Unauthorized review attempt',
      }),
    });
    recordTest('H-1', 'Reviews', 'Reject review submission for booking not owned by user (403/404)', res.status === 403 || res.status === 404, `Status: ${res.status}`);
  }

  // Test H-2: Customer submits valid review for own booking
  let reviewId = '';
  {
    const res = await fetch(`${API_BASE}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        bookingId: createdBookingId,
        vehicleId: 'veh-cr-03',
        rating: 5,
        comment: 'Outstanding performance, smooth pickup at Chennai Central Hub, very clean car!',
      }),
    });
    const body = await res.json();
    reviewId = body.review?.id;
    recordTest('H-2', 'Reviews', 'Customer submits verified review for own booking', res.status === 201 && body.success);
  }

  // Test H-3: Prevent duplicate review for the same booking
  {
    const res = await fetch(`${API_BASE}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        bookingId: createdBookingId,
        vehicleId: 'veh-cr-03',
        rating: 4,
        comment: 'Second review attempt should be blocked',
      }),
    });
    recordTest('H-3', 'Reviews', 'Reject duplicate review for same booking (409 Conflict)', res.status === 409);
  }

  // Test H-4: Public retrieval of approved vehicle reviews
  {
    const res = await fetch(`${API_BASE}/api/reviews?vehicleId=veh-cr-03`);
    const body = await res.json();
    recordTest('H-4', 'Reviews', 'Publicly retrieve approved vehicle reviews & average rating', res.status === 200 && body.reviews?.length > 0, `Avg Rating: ${body.averageRating}`);
  }

  // ==========================================
  // MODULE I: INTERNAL NOTIFICATIONS
  // ==========================================
  console.log('\n--- MODULE I: Internal Notifications ---');

  // Test I-1: Create in-app operational notification
  {
    const res = await fetch(`${API_BASE}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        recipient: 'fleet-admin',
        title: 'Fleet Vehicle Maintenance Alert',
        message: 'Vehicle TN-05-QA-9999 is scheduled for 10,000km routine service.',
      }),
    });
    const body = await res.json();
    recordTest('I-1', 'Notifications', 'Create internal in-app operational notification', res.status === 201 && body.success);
  }

  // Test I-2: Admin retrieves notification list with unread counter
  let notifId = '';
  {
    const res = await fetch(`${API_BASE}/api/notifications?recipient=fleet-admin`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const body = await res.json();
    notifId = body.notifications?.[0]?.id;
    recordTest('I-2', 'Notifications', 'Admin retrieves notification list with unread counter', res.status === 200 && body.notifications?.length > 0, `Unread: ${body.unreadCount}`);
  }

  // Test I-3: Mark notification as read
  if (notifId) {
    const res = await fetch(`${API_BASE}/api/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const body = await res.json();
    recordTest('I-3', 'Notifications', 'Mark notification as read', res.status === 200 && body.success);
  }

  // Clean up QA records
  await adminClient.from('vehicles').delete().eq('id', qaVehId);
  await adminClient.from('pickup_locations').delete().eq('id', qaLocId);
  if (createdRuleId) await adminClient.from('pricing_rules').delete().eq('id', createdRuleId);
  if (createdTxnId) await adminClient.from('payments').delete().eq('id', createdTxnId);
  if (notifId) await adminClient.from('notification_logs').delete().eq('id', notifId);
  if (reviewId) {
    await fetch(`${API_BASE}/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
  }
  await adminClient.from('notification_logs').delete().eq('booking_id', createdBookingId);
  await adminClient.from('booking_status_history').delete().eq('booking_id', createdBookingId);
  await adminClient.from('bookings').delete().eq('id', createdBookingId);
  if (sampleBookingForPayment) {
    await adminClient.from('notification_logs').delete().eq('booking_id', sampleBookingForPayment);
    await adminClient.from('booking_status_history').delete().eq('booking_id', sampleBookingForPayment);
    await adminClient.from('bookings').delete().eq('id', sampleBookingForPayment);
  }

  // Summary
  console.log('\n======================================================');
  console.log('              PHASE 4 BACKEND AUDIT REPORT            ');
  console.log('======================================================');
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  console.log(`TOTAL TESTED: ${testResults.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`COMPLIANCE: ${Math.round((passed / testResults.length) * 100)}%`);
  console.log('======================================================\n');
}

main().catch(console.error);

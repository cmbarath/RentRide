import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration.');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function auditSupabase() {
  console.log('=== PHASE 9: SUPABASE PRODUCTION INFRASTRUCTURE AUDIT ===');
  console.log('Supabase URL:', supabaseUrl);

  const tables = [
    'vehicles',
    'locations',
    'bookings',
    'booking_status_history',
    'counter_payments',
    'pricing_rules',
    'maintenance_blackouts',
    'customer_licences',
    'reviews',
    'internal_notifications',
    'platform_settings',
    'profiles',
    'vehicle_images',
    'audit_logs'
  ];

  console.log('\n--- 1. TABLE INVENTORY & ROW COUNTS ---');
  for (const t of tables) {
    const { count, error } = await adminClient.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table ${t}: ERROR ->`, error.message);
    } else {
      console.log(`Table ${t}: OK (${count} rows)`);
    }
  }

  console.log('\n--- 2. RPC ATOMIC RESERVATION FUNCTION AUDIT ---');
  const { data: rpcTest, error: rpcErr } = await adminClient.rpc('create_booking_atomic', {
    p_booking_id: 'TEST-PROBE',
    p_user_id: null,
    p_vehicle_id: 'veh-bk-01',
    p_pickup_date: '2099-01-01',
    p_pickup_time: '09:00:00',
    p_return_date: '2099-01-02',
    p_return_time: '18:00:00',
    p_pickup_location_id: 'hub-chn-tnagar',
    p_pickup_location: 'T. Nagar Hub, Chennai',
    p_return_location_id: null,
    p_return_location: 'T. Nagar Hub, Chennai',
    p_delivery_type: 'hub',
    p_delivery_address: null,
    p_customer_name: 'Test Probe',
    p_customer_email: 'testprobe@test.in',
    p_customer_phone: '9999999999',
    p_licence_id: null,
    p_licence_number: null,
    p_duration_days: 1,
    p_rental_charges: 100,
    p_security_deposit: 100,
    p_tax_amount: 18,
    p_insurance_fee: 10,
    p_total_amount: 228,
    p_pricing_snapshot: { test: true },
  });

  if (rpcErr) {
    console.log('RPC create_booking_atomic error:', rpcErr.message);
  } else {
    console.log('RPC create_booking_atomic: VERIFIED & ACTIVE! Result:', rpcTest);
    // Clean up probe booking
    await adminClient.from('bookings').delete().eq('id', 'TEST-PROBE');
  }

  console.log('\n--- 3. STORAGE BUCKET AUDIT ---');
  const { data: buckets, error: bErr } = await adminClient.storage.listBuckets();
  if (bErr) {
    console.log('Storage buckets listing error:', bErr.message);
  } else {
    console.log('Active Storage Buckets:');
    buckets.forEach(b => console.log(`- ${b.name} (public: ${b.public})`));
  }

  console.log('\n--- 4. RLS ENFORCEMENT PROBE (ANON CLIENT) ---');
  // Anon user should NOT be able to modify public.vehicles
  const { error: anonUpdateErr } = await anonClient
    .from('vehicles')
    .update({ name: 'Hacked Name' })
    .eq('id', 'veh-bk-01');

  if (anonUpdateErr) {
    console.log('RLS Protection on vehicles: ENFORCED (Anon update rejected:', anonUpdateErr.message, ')');
  } else {
    // If no error, check if rows were affected
    const { data: checkRow } = await adminClient.from('vehicles').select('name').eq('id', 'veh-bk-01').single();
    if (checkRow?.name === 'Hacked Name') {
      console.error('CRITICAL: RLS failed! Anon was able to update vehicle!');
      // revert immediately
      await adminClient.from('vehicles').update({ name: 'Hero Splendor Plus XTEC' }).eq('id', 'veh-bk-01');
    } else {
      console.log('RLS Protection on vehicles: ENFORCED (0 rows updated for unauthenticated caller)');
    }
  }

  console.log('\n=== SUPABASE PRODUCTION AUDIT COMPLETE ===');
}

auditSupabase().catch(console.error);

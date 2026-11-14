import fs from 'fs';
import path from 'path';
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

if (!supabaseUrl || !supabaseKey || !anonKey) {
  console.error('Missing required Supabase environment keys.');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseKey);
const anonClient = createClient(supabaseUrl, anonKey);

const results = [];
function record(checkName, status, details) {
  results.push({ checkName, status, details });
  console.log(`[${status}] ${checkName}: ${details}`);
}

async function runPhase9Tests() {
  console.log('===============================================================');
  console.log('  RENTRIDE PHASE 9: VERCEL + SUPABASE PRODUCTION TEST SUITE   ');
  console.log('===============================================================\n');

  // Test 1: Vercel Configuration Manifest
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    if (vercelConfig.framework === 'nextjs' && Array.isArray(vercelConfig.headers)) {
      record('Vercel Config Manifest', 'PASS', 'vercel.json valid with security & cache headers');
    } else {
      record('Vercel Config Manifest', 'FAIL', 'vercel.json missing expected configuration');
    }
  } catch (err) {
    record('Vercel Config Manifest', 'FAIL', err.message);
  }

  // Test 2: Next.js Production Config
  try {
    const nextConfigContent = fs.readFileSync('next.config.mjs', 'utf8');
    if (nextConfigContent.includes('image/avif') && nextConfigContent.includes('Cache-Control')) {
      record('Next.js Production Config', 'PASS', 'next.config.mjs optimized for AVIF & CDN caching');
    } else {
      record('Next.js Production Config', 'FAIL', 'next.config.mjs missing image/cache settings');
    }
  } catch (err) {
    record('Next.js Production Config', 'FAIL', err.message);
  }

  // Test 3: Supabase Production Database Connectivity
  try {
    const { count, error } = await adminClient.from('vehicles').select('*', { count: 'exact', head: true });
    if (!error && count === 56) {
      record('Database Connectivity & Fleet Count', 'PASS', `Connected to ${supabaseUrl} (56 seeded vehicles active)`);
    } else {
      record('Database Connectivity & Fleet Count', 'FAIL', error?.message || `Unexpected count: ${count}`);
    }
  } catch (err) {
    record('Database Connectivity & Fleet Count', 'FAIL', err.message);
  }

  // Test 4: Supabase Storage Buckets
  try {
    const { data: buckets, error: bErr } = await adminClient.storage.listBuckets();
    if (!bErr && buckets) {
      const dlBucket = buckets.find(b => b.name === 'driving-licences');
      const vBucket = buckets.find(b => b.name === 'vehicle-images');
      if (dlBucket && !dlBucket.public && vBucket && vBucket.public) {
        record('Storage Bucket Security', 'PASS', 'driving-licences is private; vehicle-images is public');
      } else {
        record('Storage Bucket Security', 'FAIL', `Unexpected bucket config: dl public=${dlBucket?.public}, v public=${vBucket?.public}`);
      }
    } else {
      record('Storage Bucket Security', 'FAIL', bErr?.message || 'Failed to list buckets');
    }
  } catch (err) {
    record('Storage Bucket Security', 'FAIL', err.message);
  }

  // Test 5: Atomic Reservation RPC Execution
  try {
    const { data: rpcRes, error: rpcErr } = await adminClient.rpc('create_booking_atomic', {
      p_booking_id: 'PHASE9-AUDIT-PROBE',
      p_user_id: null,
      p_vehicle_id: 'veh-bk-01',
      p_pickup_date: '2099-06-01',
      p_pickup_time: '10:00:00',
      p_return_date: '2099-06-02',
      p_return_time: '18:00:00',
      p_pickup_location_id: 'hub-chn-tnagar',
      p_pickup_location: 'T. Nagar Hub, Chennai',
      p_return_location_id: null,
      p_return_location: 'T. Nagar Hub, Chennai',
      p_delivery_type: 'hub',
      p_delivery_address: null,
      p_customer_name: 'Audit User',
      p_customer_email: 'audit@test.in',
      p_customer_phone: '9876543210',
      p_licence_id: null,
      p_licence_number: null,
      p_duration_days: 1,
      p_rental_charges: 499,
      p_security_deposit: 1000,
      p_tax_amount: 90,
      p_insurance_fee: 199,
      p_total_amount: 1788,
      p_pricing_snapshot: { test: true },
    });

    if (!rpcErr && rpcRes?.success) {
      record('create_booking_atomic RPC', 'PASS', `Atomic lock & reservation successful (PIN: ${rpcRes.pickup_otp})`);
      await adminClient.from('bookings').delete().eq('id', 'PHASE9-AUDIT-PROBE');
    } else {
      record('create_booking_atomic RPC', 'FAIL', rpcErr?.message || JSON.stringify(rpcRes));
    }
  } catch (err) {
    record('create_booking_atomic RPC', 'FAIL', err.message);
  }

  // Test 6: RLS Tenant Security Probe
  try {
    const { error: rlsErr } = await anonClient.from('bookings').select('*');
    if (!rlsErr) {
      // Unauthenticated anon client should get 0 rows or error under RLS
      const { data: anonData } = await anonClient.from('bookings').select('*');
      if (!anonData || anonData.length === 0) {
        record('PostgreSQL RLS Isolation', 'PASS', 'Unauthenticated anon query returns 0 rows from bookings');
      } else {
        record('PostgreSQL RLS Isolation', 'FAIL', `Anon client leaked ${anonData.length} booking records`);
      }
    } else {
      record('PostgreSQL RLS Isolation', 'PASS', `Anon query blocked by RLS (${rlsErr.message})`);
    }
  } catch (err) {
    record('PostgreSQL RLS Isolation', 'FAIL', err.message);
  }

  // Test 7: HTTP Production Server & API Routes
  try {
    const baseUrl = 'http://localhost:3000';
    const endpoints = [
      { path: '/', expected: 200 },
      { path: '/vehicles', expected: 200 },
      { path: '/account', expected: 200 },
      { path: '/admin', expected: 200 },
      { path: '/api/vehicles', expected: 200 },
      { path: '/api/locations', expected: 200 },
      { path: '/images/Car/toyota-innova-crysta.avif', expected: 200 },
      { path: '/images/Bike/hero-splendor-plus.avif', expected: 200 },
      { path: '/images/Car/mahindra%20scorpio-n.avif', expected: 200 }
    ];

    let passedEndpoints = 0;
    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`);
      if (res.status === ep.expected) {
        passedEndpoints++;
      } else {
        console.error(`Endpoint failed: ${ep.path} returned HTTP ${res.status}`);
      }
    }

    if (passedEndpoints === endpoints.length) {
      record('Production HTTP Endpoints', 'PASS', `All ${endpoints.length} routes & static assets returned HTTP 200`);
    } else {
      record('Production HTTP Endpoints', 'FAIL', `${passedEndpoints}/${endpoints.length} endpoints passed`);
    }
  } catch (err) {
    record('Production HTTP Endpoints', 'FAIL', `Server unreachable: ${err.message}`);
  }

  console.log('\n===============================================================');
  console.log('                 PHASE 9 TEST SUMMARY                         ');
  console.log('===============================================================');
  const passes = results.filter(r => r.status === 'PASS').length;
  const fails = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Checks: ${results.length} | Passed: ${passes} | Failed: ${fails}`);
  console.table(results);

  if (fails > 0) {
    process.exit(1);
  }
}

runPhase9Tests().catch(err => {
  console.error(err);
  process.exit(1);
});

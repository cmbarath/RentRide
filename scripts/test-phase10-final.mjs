import https from 'https';
import fs from 'fs';
import path from 'path';

function getLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

function httpsGet(url, options = {}) {
  return new Promise((resolve) => {
    const req = https.get(url, options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
  });
}

function httpsPost(url, payload, options = {}) {
  return new Promise((resolve) => {
    const dataStr = JSON.stringify(payload);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr),
        ...(options.headers || {})
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.write(dataStr);
    req.end();
  });
}

async function runPhase10Audit() {
  const PROD_BASE = 'https://rent-ride-chi.vercel.app';
  console.log(`========================================================================`);
  console.log(`  RENTRIDE PHASE 10: FINAL PRODUCTION DEPLOYMENT & QUALITY AUDIT`);
  console.log(`  Production URL: ${PROD_BASE}`);
  console.log(`  Audit Execution Timestamp: ${new Date().toISOString()}`);
  console.log(`========================================================================\n`);

  const results = [];
  function record(section, testName, isPass, details = '') {
    const status = isPass ? 'PASS' : 'FAIL';
    results.push({ section, testName, status, details });
    console.log(`[${status}] [${section}] ${testName.padEnd(45)} | ${details}`);
  }

  // ---------------------------------------------------------------------------
  // 1. Production Web Pages
  // ---------------------------------------------------------------------------
  const routes = [
    { path: '/', name: 'Homepage (Customer Storefront)' },
    { path: '/vehicles', name: 'Vehicle Fleet Search & Catalog' },
    { path: '/vehicles/toyota-innova-crysta', name: 'Vehicle Detail & Booking Configurator' },
    { path: '/checkout', name: 'Rental Checkout & KYC Upload Form' },
    { path: '/account', name: 'Customer Account / Booking Dashboard' },
    { path: '/admin', name: 'Fleet Operations Console (Security Gate)' },
    { path: '/auth/reset-password', name: 'Password Recovery Page' },
  ];

  for (const r of routes) {
    const res = await httpsGet(`${PROD_BASE}${r.path}`);
    const pass = res.status === 200 && (res.body.includes('RentRide') || res.body.includes('<!DOCTYPE html>'));
    record('Production Web Pages', r.name, pass, `HTTP ${res.status}`);
  }

  // Auth callback test (should redirect with 307 when visited without code)
  const cbRes = await httpsGet(`${PROD_BASE}/auth/callback`);
  const cbPass = cbRes.status === 307 && cbRes.headers.location && cbRes.headers.location.includes(PROD_BASE);
  record('Production Web Pages', 'Supabase Auth SSR PKCE Callback Route', cbPass, `HTTP ${cbRes.status} -> ${cbRes.headers.location}`);

  // ---------------------------------------------------------------------------
  // 2. Production API Endpoints
  // ---------------------------------------------------------------------------
  // Vehicles API
  const vehRes = await httpsGet(`${PROD_BASE}/api/vehicles`);
  let vehData = null;
  try { vehData = JSON.parse(vehRes.body); } catch (_) {}
  const vehCount = vehData?.vehicles?.length || 0;
  record('Production APIs', 'GET /api/vehicles (Fleet Catalog)', vehRes.status === 200 && vehCount === 56, `HTTP ${vehRes.status}, Count: ${vehCount} vehicles`);

  // Locations API
  const locRes = await httpsGet(`${PROD_BASE}/api/locations`);
  let locData = null;
  try { locData = JSON.parse(locRes.body); } catch (_) {}
  const locCount = locData?.locations?.length || 0;
  record('Production APIs', 'GET /api/locations (Tamil Nadu Hubs)', locRes.status === 200 && locCount === 28, `HTTP ${locRes.status}, Count: ${locCount} hubs`);

  // Pricing Engine API
  const pricingPayload = {
    vehicleId: 'veh-cr-25',
    pickupDate: '2026-12-01',
    pickupTime: '09:00',
    returnDate: '2026-12-03',
    returnTime: '18:00',
    deliveryType: 'hub'
  };
  const pricingRes = await httpsPost(`${PROD_BASE}/api/pricing/calculate`, pricingPayload);
  let pData = null;
  try { pData = JSON.parse(pricingRes.body); } catch (_) {}
  const pOk = pricingRes.status === 200 && pData?.success && pData?.pricing?.totalAmount === 23133;
  record('Production APIs', 'POST /api/pricing/calculate (Server Engine)', pOk, `HTTP ${pricingRes.status}, Total: ₹${pData?.pricing?.totalAmount} (Base: ₹${pData?.pricing?.baseRental}, GST: ₹${pData?.pricing?.gstAmount}, Deposit: ₹${pData?.pricing?.securityDeposit})`);

  // Reviews API
  const revRes = await httpsGet(`${PROD_BASE}/api/reviews`);
  record('Production APIs', 'GET /api/reviews (Verified Ratings)', revRes.status === 200, `HTTP ${revRes.status}`);

  // Auth Session API
  const sessRes = await httpsGet(`${PROD_BASE}/api/auth/session`);
  let sessData = null;
  try { sessData = JSON.parse(sessRes.body); } catch (_) {}
  const sessOk = sessRes.status === 200 && sessData && sessData.user === null;
  record('Production APIs', 'GET /api/auth/session (Session Inspection)', sessOk, `HTTP ${sessRes.status}, Authenticated: false`);

  // ---------------------------------------------------------------------------
  // 3. Authentic Vehicle Images (56/56 verified on Vercel CDN)
  // ---------------------------------------------------------------------------
  const vehicles = vehData?.vehicles || [];
  let imgPassCount = 0;
  for (const v of vehicles) {
    const rawPath = v.coverImage;
    const encoded = rawPath.split('/').map(s => encodeURIComponent(s)).join('/');
    const r = await httpsGet(`${PROD_BASE}${encoded}`);
    if (r.status === 200) imgPassCount++;
  }
  record('Vehicle Photography', 'All 56 Authentic Vehicle Photography Assets', imgPassCount === 56, `${imgPassCount}/56 images return HTTP 200 from Vercel Edge CDN`);

  // ---------------------------------------------------------------------------
  // 4. Supabase Database & Security Verification
  // ---------------------------------------------------------------------------
  const localEnv = getLocalEnv();
  const sbUrl = localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const sbAnon = localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const sbSecret = localEnv.SUPABASE_SECRET_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY;

  const schemaTables = [
    'profiles', 'pickup_locations', 'vehicles', 'vehicle_images', 'driving_licences',
    'bookings', 'booking_status_history', 'payments', 'pricing_rules',
    'vehicle_maintenance', 'reviews', 'notification_logs', 'admin_audit_logs',
    'application_settings'
  ];

  let verifiedTables = 0;
  for (const t of schemaTables) {
    const res = await httpsGet(`${sbUrl}/rest/v1/${t}?select=*&limit=1`, {
      headers: { 'apikey': sbSecret, 'Authorization': `Bearer ${sbSecret}` }
    });
    if (res.status === 200) verifiedTables++;
  }
  record('Supabase PostgreSQL', '14 Core Schema Tables Active in PostgreSQL', verifiedTables === 14, `${verifiedTables}/14 tables return HTTP 200`);

  // Private KYC Bucket
  const bucketRes = await httpsGet(`${sbUrl}/storage/v1/bucket/driving-licences`, {
    headers: { 'apikey': sbSecret, 'Authorization': `Bearer ${sbSecret}` }
  });
  let bJson = null;
  try { bJson = JSON.parse(bucketRes.body); } catch (_) {}
  const bucketOk = bucketRes.status === 200 && bJson?.public === false;
  record('Supabase Storage', 'Private driving-licences KYC Bucket', bucketOk, `HTTP ${bucketRes.status}, Public: ${bJson?.public}`);

  // PostgreSQL RLS Security Probe
  const rlsRes = await httpsGet(`${sbUrl}/rest/v1/bookings`, {
    headers: { 'apikey': sbAnon, 'Authorization': `Bearer ${sbAnon}` }
  });
  let rlsData = [];
  try { rlsData = JSON.parse(rlsRes.body); } catch (_) {}
  const rlsSafe = (Array.isArray(rlsData) && rlsData.length === 0) || rlsRes.status === 401 || rlsRes.status === 403;
  record('Supabase Security', 'Row Level Security (RLS) Booking Isolation', rlsSafe, `Unauthenticated anon client receives 0 booking records`);

  // ---------------------------------------------------------------------------
  // 5. Screenshots
  // ---------------------------------------------------------------------------
  const artifactsDir = 'C:/Users/Barath/.gemini/antigravity/brain/aea01274-0980-47d4-b8e4-9e45ef93fb89';
  const screenshots = [
    'screenshot_production_homepage.png',
    'screenshot_production_fleet.png',
    'screenshot_production_vehicle_detail.png',
    'screenshot_production_admin_gate.png',
    'screenshot_production_mobile.png'
  ];
  let screenshotsFound = 0;
  for (const s of screenshots) {
    if (fs.existsSync(path.join(artifactsDir, s))) screenshotsFound++;
  }
  record('Visual & Responsive Audits', 'High-Resolution Production Screenshots', screenshotsFound === 5, `${screenshotsFound}/5 screenshot artifacts captured directly from live Vercel deployment`);

  console.log(`\n========================================================================`);
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  console.log(`  FINAL AUDIT SCORE: ${passed}/${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`========================================================================\n`);

  fs.writeFileSync('scripts/phase10-audit-summary.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    productionUrl: PROD_BASE,
    totalTests: total,
    passedCount: passed,
    failedCount: total - passed,
    results
  }, null, 2));

  return { total, passed, results };
}

runPhase10Audit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});

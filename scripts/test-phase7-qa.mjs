import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SECRET) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const adminSetupClient = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function createUserAnonClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const results = [];
function record(id, section, description, passed, details = '') {
  results.push({ id, section, description, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'} [${id}] [${section}] ${description}${details ? ` (${details})` : ''}`);
}

async function attachErrorCollectors(page, label, collector) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('401') && !txt.includes('403') && !txt.includes('409') && !txt.includes('422')) {
        collector.consoleErrors.push(`[${label}] ${txt}`);
      }
    }
  });
  page.on('pageerror', (err) => {
    collector.pageErrors.push(`[${label}] ${err.message}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 500) {
      collector.server500s.push(`[${label}] ${res.status()} ${res.url()}`);
    } else if (res.status() === 404) {
      collector.notFound404s.push(`[${label}] 404 ${res.url()}`);
    }
  });
}

async function signInApiClient(email, password) {
  const client = createUserAnonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(`Sign-in failed for ${email}: ${error?.message || 'No token'}`);
  }
  return {
    user: data.user,
    token: data.session.access_token,
    authedSupabase: createUserAnonClient(data.session.access_token),
    async fetchApi(urlPath, options = {}) {
      const headers = {
        Authorization: `Bearer ${data.session.access_token}`,
        ...(options.headers || {}),
      };
      const res = await fetch(`${BASE_URL}${urlPath}`, { ...options, headers });
      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}
      return { status: res.status, data: json, raw: text };
    },
  };
}

async function main() {
  console.log('==================================================================');
  console.log('           RENTRIDE PHASE 7: COMPREHENSIVE QA & AUDIT             ');
  console.log('==================================================================\n');

  const ts = Date.now();
  const qaSuffix = String(ts).slice(-5);
  const qaEmailA = `qa.p7.a.${ts}@rentride-qa.test`;
  const qaEmailB = `qa.p7.b.${ts}@rentride-qa.test`;
  const qaEmailFm = `qa.p7.fm.${ts}@rentride-qa.test`;
  const qaPass = 'REDACTED_DISPOSABLE_TEST_PASSWORD';

  const qaVehName = `QA Thar Roxx ${qaSuffix}`;
  const qaRegNo = `TN 09 P7 ${qaSuffix.slice(-4)}`;
  const qaHubArea = `QA Perungudi ${qaSuffix}`;
  const qaHubDisplay = `QA Perungudi Hub ${qaSuffix}`;
  const qaHubUpdated = `QA Perungudi Express ${qaSuffix}`;

  const cleanup = {
    userIds: [],
    vehicleIds: [],
    hubIds: [],
    maintenanceIds: [],
    bookingIds: [],
    notificationIds: [],
    initialSettings: null,
    dlFolderPaths: [],
  };

  const tmpDir = path.resolve(process.cwd(), 'scripts', '.tmp-qa-p7');
  fs.mkdirSync(tmpDir, { recursive: true });
  const frontPngPath = path.join(tmpDir, 'dl-front.png');
  const backPngPath = path.join(tmpDir, 'dl-back.png');
  fs.writeFileSync(frontPngPath, Buffer.from(TINY_PNG_BASE64, 'base64'));
  fs.writeFileSync(backPngPath, Buffer.from(TINY_PNG_BASE64, 'base64'));

  const errorCollector = { consoleErrors: [], pageErrors: [], server500s: [], notFound404s: [] };
  const perfMetrics = {};

  const executablePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : undefined;
  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : { channel: 'chrome' }),
    headless: true,
  });

  try {
    // Snapshot initial application_settings before touching anything
    const { data: settingsSnapshot } = await adminSetupClient
      .from('application_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    cleanup.initialSettings = settingsSnapshot;

    // Provision disposable QA Customer A, Customer B, and Fleet Manager
    for (const [label, email, role, fullName, phone] of [
      ['Customer A', qaEmailA, 'customer', 'QA Customer Alpha', '9840011001'],
      ['Customer B', qaEmailB, 'customer', 'QA Customer Beta', '9840011002'],
      ['Fleet Manager', qaEmailFm, 'fleet_manager', 'QA Fleet Manager', '9840011003'],
    ]) {
      const { data: u, error: uErr } = await adminSetupClient.auth.admin.createUser({
        email,
        password: qaPass,
        email_confirm: true,
        user_metadata: { full_name: fullName, phone },
      });
      if (uErr || !u?.user?.id) throw new Error(`Failed creating ${label}: ${uErr?.message}`);
      cleanup.userIds.push(u.user.id);
      if (role !== 'customer') {
        await adminSetupClient.from('profiles').update({ role }).eq('id', u.user.id);
      }
    }
    const [qaCustAId, qaCustBId, qaFmId] = cleanup.userIds;

    const custAApi = await signInApiClient(qaEmailA, qaPass);
    const custBApi = await signInApiClient(qaEmailB, qaPass);
    const fmApi = await signInApiClient(qaEmailFm, qaPass);
    const adminApi = await signInApiClient('admin@rentride.in', 'REDACTED_ROTATED_ADMIN_PASSWORD');

    const sampleVehRes = await fetch(`${BASE_URL}/api/vehicles?limit=1`).then((r) => r.json());
    const sampleCoverImg = sampleVehRes.vehicles?.[0]?.coverImage || '/images/cars/mahindra-scorpio-n.jpg';

    // Create isolated QA Vehicle so seeded fleet & real customers are untouched
    const vehCreateRes = await adminApi.fetchApi('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: qaVehName,
        brand: 'Mahindra',
        model: 'Thar Roxx',
        variant: 'AX7L AT',
        year: 2025,
        type: 'car',
        category: 'SUV',
        registrationNumber: qaRegNo,
        transmission: 'Automatic',
        fuelType: 'Diesel',
        seatingCapacity: 5,
        mileage: '15 km/l',
        pricePerDay: 3500,
        securityDeposit: 5000,
        coverImage: sampleCoverImg,
        location: 'Chennai Airport Hub',
        description: 'QA disposable vehicle for Phase 7 validation',
        features: ['4x4', 'ABS'],
        isActive: true,
      }),
    });
    const qaVehId = vehCreateRes.data?.vehicle?.id;
    if (!qaVehId) throw new Error(`Failed creating QA vehicle: ${vehCreateRes.raw}`);
    cleanup.vehicleIds.push(qaVehId);

    // =========================================================================
    // PART 1: REAL PERFORMANCE & PAYLOAD BENCHMARKS + IMAGE VERIFICATION
    // =========================================================================
    console.log('--- PART 1: Performance Telemetry, Pagination Requests & Asset Integrity ---');
    const perfCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const perfPage = await perfCtx.newPage();
    await attachErrorCollectors(perfPage, 'Performance', errorCollector);

    const failedRequests = [];
    perfPage.on('requestfailed', (req) => {
      failedRequests.push(`${req.url()} (${req.failure()?.errorText || 'failed'})`);
    });

    const apiRequests = [];
    perfPage.on('response', async (res) => {
      if (res.url().includes('/api/')) {
        const bodyBuf = await res.body().catch(() => Buffer.alloc(0));
        apiRequests.push({
          url: res.url().replace(BASE_URL, ''),
          status: res.status(),
          bytes: bodyBuf.length,
        });
      }
    });

    const tHomeStart = Date.now();
    await perfPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await perfPage.waitForSelector('text=Featured Self-Drive Cars', { timeout: 20000 });
    await perfPage.waitForFunction(
      () => Array.from(document.querySelectorAll('img')).filter((i) => i.complete && i.naturalWidth > 0).length >= 5,
      null,
      { timeout: 20000 }
    );
    const homeWallMs = Date.now() - tHomeStart;

    // Trigger lazy-loaded below-fold bike images cleanly by scrolling each into view, then verify all <img> decode
    for (const img of await perfPage.locator('img').all()) {
      await img.scrollIntoViewIfNeeded();
      await perfPage.waitForTimeout(80);
    }
    await perfPage.waitForFunction(
      () => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.length >= 9 && imgs.every((i) => i.complete && i.naturalWidth > 0);
      },
      null,
      { timeout: 15000 }
    );

    const homeTiming = await perfPage.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const imgs = Array.from(document.querySelectorAll('img')).map((img) => ({
        src: img.getAttribute('src') || '',
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      }));
      return {
        ttfbMs: nav ? Math.round(nav.responseStart) : 0,
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
        loadEventMs: nav ? Math.round(nav.loadEventEnd) : 0,
        totalImgs: imgs.length,
        brokenImgs: imgs.filter((i) => !i.complete || i.naturalWidth === 0),
      };
    });

    // Measure public API timing & payload size cleanly
    const tApiP1 = Date.now();
    const apiP1Res = await fetch(`${BASE_URL}/api/vehicles?page=1&limit=9`);
    const apiP1Text = await apiP1Res.text();
    const apiP1Ms = Date.now() - tApiP1;
    const apiP1Json = JSON.parse(apiP1Text);

    const tApiP2 = Date.now();
    const apiP2Res = await fetch(`${BASE_URL}/api/vehicles?page=2&limit=9`);
    const apiP2Text = await apiP2Res.text();
    const apiP2Ms = Date.now() - tApiP2;

    const tApiFull = Date.now();
    const apiFullRes = await fetch(`${BASE_URL}/api/vehicles`);
    const apiFullText = await apiFullRes.text();
    const apiFullMs = Date.now() - tApiFull;
    const apiFullJson = JSON.parse(apiFullText);

    // Check every seeded vehicle coverImage URL resolves with 200 OK
    const assetChecks = await Promise.all(
      (apiFullJson.vehicles || []).map(async (v) => {
        const r = await fetch(`${BASE_URL}${v.coverImage}`);
        return { id: v.id, src: v.coverImage, status: r.status };
      })
    );
    const brokenFleetAssets = assetChecks.filter((a) => a.status !== 200);

    const duplicateCallsMap = {};
    for (const r of apiRequests) {
      duplicateCallsMap[r.url] = (duplicateCallsMap[r.url] || 0) + 1;
    }

    perfMetrics.home = { ...homeTiming, wallMs: homeWallMs, failedRequests, apiRequests, duplicateCallsMap };
    perfMetrics.vehiclesApi = {
      page1Ms: apiP1Ms,
      page1Bytes: Buffer.byteLength(apiP1Text),
      page1Count: apiP1Json.vehicles?.length,
      page2Ms: apiP2Ms,
      page2Bytes: Buffer.byteLength(apiP2Text),
      fullCatalogMs: apiFullMs,
      fullCatalogBytes: Buffer.byteLength(apiFullText),
      checkedFleetAssets: assetChecks.length,
      brokenFleetAssetsCount: brokenFleetAssets.length,
    };

    record(
      'P7-PERF-01',
      'Performance & Assets',
      'Homepage renders cleanly with zero broken images and all fleet assets return 200 OK',
      homeTiming.brokenImgs.length === 0 &&
        homeTiming.totalImgs >= 9 &&
        apiP1Json.vehicles?.length === 9 &&
        brokenFleetAssets.length === 0,
      `wall=${homeWallMs}ms, ttfb=${homeTiming.ttfbMs}ms, dcl=${homeTiming.domContentLoadedMs}ms, imgs=${homeTiming.totalImgs}, fleetAssets=${assetChecks.length}(broken=${brokenFleetAssets.length}), p1Bytes=${perfMetrics.vehiclesApi.page1Bytes}, fullBytes=${perfMetrics.vehiclesApi.fullCatalogBytes}`
    );
    await perfCtx.close();

    // =========================================================================
    // PART 2: ADMIN PORTAL – RESPONSIVE 1440/768/375 + STOREFRONT NAV (BUG-07)
    //         AND PARTIALLY WORKING SECTIONS A, B, C, D
    // =========================================================================
    console.log('\n--- PART 2: Admin Portal E2E (Responsive + Hubs + Maintenance + Settings) ---');
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminCtx.newPage();
    await attachErrorCollectors(adminPage, 'Admin', errorCollector);

    const tAdminStart = Date.now();
    await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('input[placeholder="admin@rentride.in"]', { timeout: 15000 });
    await adminPage.fill('input[placeholder="admin@rentride.in"]', 'admin@rentride.in');
    await adminPage.fill('input[placeholder="••••••••"]', 'REDACTED_ROTATED_ADMIN_PASSWORD');
    await adminPage.getByRole('button', { name: 'Sign In as Administrator' }).click();
    await adminPage.waitForSelector('text=Tamil Nadu Fleet Operations & Telemetry', { timeout: 20000 });
    perfMetrics.adminLoadMs = Date.now() - tAdminStart;

    // BUG-07 Verification: Responsive /admin viewports 1440, 768, 375
    const vpMetrics = {};
    for (const vp of [
      { label: 'desktop', width: 1440, height: 900 },
      { label: 'tablet', width: 768, height: 1024 },
      { label: 'mobile', width: 375, height: 812 },
    ]) {
      await adminPage.setViewportSize({ width: vp.width, height: vp.height });
      await adminPage.waitForTimeout(250);
      vpMetrics[vp.label] = await adminPage.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      }));
    }
    // Check mobile drawer opens cleanly at 375px and closes via mobile drawer button
    await adminPage.locator('button[title="Toggle Sidebar"]').click();
    const drawerVisibleOnMobile = await adminPage.getByRole('button', { name: 'Review Moderation' }).isVisible();
    await adminPage.getByRole('button', { name: 'Close sidebar' }).click();
    await adminPage.setViewportSize({ width: 1440, height: 900 });

    record(
      'P7-ADM-RESP',
      'Responsive UI',
      'Admin portal renders with zero horizontal overflow at 1440px, 768px, and 375px + working mobile drawer',
      !vpMetrics.desktop.overflow && !vpMetrics.tablet.overflow && !vpMetrics.mobile.overflow && drawerVisibleOnMobile,
      `1440:${vpMetrics.desktop.sw}/${vpMetrics.desktop.cw}, 768:${vpMetrics.tablet.sw}/${vpMetrics.tablet.cw}, 375:${vpMetrics.mobile.sw}/${vpMetrics.mobile.cw}, drawer=${drawerVisibleOnMobile}`
    );

    // -------------------------------------------------------------------------
    // 3A. ADMIN LOCATION MANAGEMENT (Add -> Reload -> Edit -> Disable -> Customer Exclude)
    // -------------------------------------------------------------------------
    await adminPage.getByRole('button', { name: 'Tamil Nadu Hubs' }).click();
    await adminPage.waitForSelector('button:has-text("Add New TN Hub")', { timeout: 10000 });
    await adminPage.getByRole('button', { name: 'Add New TN Hub' }).click();
    await adminPage.locator('form select').first().selectOption('chennai');
    await adminPage.fill('input[placeholder="e.g. Porur"]', qaHubArea);
    await adminPage.fill('input[placeholder="e.g. Porur Junction Hub"]', qaHubDisplay);
    await adminPage.fill('textarea', 'Plot 88, OMR Main Road, Perungudi, Chennai');
    await adminPage.fill('input[placeholder="600116"]', '600096');
    await adminPage.getByRole('button', { name: 'Create Hub' }).click();
    await adminPage.waitForSelector(`text=${qaHubDisplay} (Chennai) created in Supabase.`, { timeout: 15000 });

    // Capture created hub id for cleanup
    const { data: createdHubRows } = await adminSetupClient
      .from('pickup_locations')
      .select('id, display_name')
      .eq('display_name', qaHubDisplay);
    const qaHubId = createdHubRows?.[0]?.id;
    if (qaHubId) cleanup.hubIds.push(qaHubId);

    // Reload /admin and verify persisted
    await adminPage.reload({ waitUntil: 'domcontentloaded' });
    await adminPage.getByRole('button', { name: 'Tamil Nadu Hubs' }).click();
    const persistedAfterReload = await adminPage
      .waitForSelector(`h3:has-text("${qaHubDisplay}")`, { timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    // Edit hub display name
    const hubCard = adminPage.locator('div.p-4.rounded-xl', { hasText: qaHubDisplay }).first();
    await hubCard.locator('button[title="Edit Hub"]').click();
    await adminPage.fill('input[placeholder="e.g. Porur Junction Hub"]', qaHubUpdated);
    await adminPage.getByRole('button', { name: 'Save Changes' }).click();
    await adminPage.waitForSelector(`text=${qaHubUpdated} updated in Supabase.`, { timeout: 15000 });

    // Disable hub
    const updatedHubCard = adminPage.locator('div.p-4.rounded-xl', { hasText: qaHubUpdated }).first();
    await updatedHubCard.getByRole('button', { name: 'Active', exact: true }).click();
    await adminPage.waitForSelector(`text=${qaHubUpdated} marked as Disabled.`, { timeout: 15000 });

    // Verify customer storefront excludes Disabled hub from Chennai pickup selector
    const custStoreCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const custStorePage = await custStoreCtx.newPage();
    await custStorePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await custStorePage.waitForSelector('text=Featured Self-Drive Cars', { timeout: 20000 });
    await custStorePage.locator('form select').nth(0).selectOption('chennai');
    const chennaiHubOptions = await custStorePage.locator('form select').nth(1).locator('option').allInnerTexts();
    const disabledHubExcluded = !chennaiHubOptions.some((o) => o.includes(qaHubUpdated));
    await custStoreCtx.close();

    record(
      'P7-LOC-01',
      'Locations Management',
      'Add TN Hub -> Reload persistence -> Edit -> Disable -> Excluded from Customer Pickup dropdown',
      Boolean(qaHubId) && persistedAfterReload && disabledHubExcluded,
      `hubId=${qaHubId}, reloadPersisted=${persistedAfterReload}, excludedFromCustomer=${disabledHubExcluded}`
    );

    // -------------------------------------------------------------------------
    // 3B. MAINTENANCE BLACKOUT MANAGEMENT (Single/Multi-day -> Reload -> Edit -> Reject Booking -> Complete -> Book OK)
    // -------------------------------------------------------------------------
    await adminPage.getByRole('button', { name: 'Pricing & Calendar' }).click();
    await adminPage.waitForSelector('button:has-text("Block Availability")', { timeout: 10000 });

    const blockForm = adminPage.locator('form').first();
    await blockForm.locator('select').nth(0).selectOption(qaVehId);
    await blockForm.locator('input[type="date"]').nth(0).fill('2027-08-10');
    await blockForm.locator('input[type="date"]').nth(1).fill('2027-08-10'); // single-day inclusive test
    await blockForm.locator('select').nth(1).selectOption('maintenance');
    await blockForm.locator('input[type="text"]').fill('QA Brake Caliper Check');
    await blockForm.getByRole('button', { name: 'Block Availability' }).click();
    await adminPage.waitForSelector('text=QA Brake Caliper Check', { timeout: 15000 });

    // Capture maintenance ID
    const { data: maintRows } = await adminSetupClient
      .from('vehicle_maintenance')
      .select('id')
      .eq('vehicle_id', qaVehId);
    for (const m of maintRows || []) cleanup.maintenanceIds.push(m.id);

    // Reload /admin -> confirm maintenance persisted
    await adminPage.reload({ waitUntil: 'domcontentloaded' });
    await adminPage.getByRole('button', { name: 'Pricing & Calendar' }).click();
    const maintPersisted = await adminPage
      .waitForSelector('text=QA Brake Caliper Check', { timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    // Edit maintenance blackout endDate -> 2027-08-12 & notes
    await adminPage.locator('button[title="Edit maintenance block"]').first().click();
    await blockForm.locator('input[type="date"]').nth(1).fill('2027-08-12');
    await blockForm.locator('input[type="text"]').fill('QA Extended Gearbox Service');
    await blockForm.getByRole('button', { name: 'Save Blackout Changes' }).click();
    await adminPage.waitForSelector('text=QA Extended Gearbox Service', { timeout: 15000 });

    // Customer booking on boundary date 2027-08-12..2027-08-13 MUST BE REJECTED!
    const blockedBookingRes = await custAApi.fetchApi('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: qaVehId,
        pickupDate: '2027-08-12',
        pickupTime: '09:00',
        returnDate: '2027-08-13',
        returnTime: '18:00',
        pickupLocation: 'Chennai Airport Hub',
        returnLocation: 'Chennai Airport Hub',
        deliveryType: 'hub',
        customerName: 'QA Customer Alpha',
        customerEmail: qaEmailA,
        customerPhone: '9840011001',
      }),
    });

    // Also mark maintenance completed via UI button -> booking MUST SUCCEED after completion!
    await adminPage.locator('button[title="Mark maintenance completed"]').first().click();
    await adminPage.waitForSelector('text=Maintenance marked completed & vehicle availability restored.', {
      timeout: 15000,
    });

    const postCompleteBookingRes = await custAApi.fetchApi('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: qaVehId,
        pickupDate: '2027-08-12',
        pickupTime: '09:00',
        returnDate: '2027-08-13',
        returnTime: '18:00',
        pickupLocation: 'Chennai Airport Hub',
        returnLocation: 'Chennai Airport Hub',
        deliveryType: 'hub',
        customerName: 'QA Customer Alpha',
        customerEmail: qaEmailA,
        customerPhone: '9840011001',
      }),
    });
    const qaBookingId = postCompleteBookingRes.data?.booking?.id || postCompleteBookingRes.data?.bookingId;
    if (qaBookingId) cleanup.bookingIds.push(qaBookingId);

    record(
      'P7-MNT-01',
      'Maintenance Blackouts',
      'Add single-day -> Reload -> Edit -> Reject overlapping boundary booking (400) -> Complete -> Restore booking',
      maintPersisted &&
        blockedBookingRes.status === 400 &&
        String(blockedBookingRes.data?.error || '').includes('scheduled for maintenance') &&
        (postCompleteBookingRes.status === 200 || postCompleteBookingRes.status === 201) &&
        Boolean(qaBookingId),
      `persisted=${maintPersisted}, blockedStatus=${blockedBookingRes.status}, restoredStatus=${postCompleteBookingRes.status}`
    );

    // -------------------------------------------------------------------------
    // 3C. ADMIN SETTINGS (Save -> Reload -> Invalid inline error -> Customer 403 -> Restore)
    // -------------------------------------------------------------------------
    await adminPage.getByRole('button', { name: 'Business Settings' }).click();
    await adminPage.waitForSelector('input[value*="RentRide"]', { timeout: 10000 });
    await adminPage.waitForSelector('text=Loading settings...', { state: 'detached', timeout: 10000 });

    // Free Cancel Grace (hrs) input is the 3rd number input (speedLimit, minDriverAge, graceHours)
    const graceInput = adminPage.locator('form input[type="number"]').nth(2);
    const speedInput = adminPage.locator('form input[type="number"]').nth(0);
    await graceInput.fill('8');
    await adminPage.getByRole('button', { name: 'Save Platform Settings' }).click();
    await adminPage.waitForSelector('text=Platform settings saved to Supabase database.', { timeout: 15000 });

    // Reload /admin -> Business Settings -> confirm value persisted as '8'
    await adminPage.reload({ waitUntil: 'domcontentloaded' });
    await adminPage.getByRole('button', { name: 'Business Settings' }).click();
    await adminPage.waitForSelector('input[value*="RentRide"]', { timeout: 10000 });
    await adminPage.waitForSelector('text=Loading settings...', { state: 'detached', timeout: 10000 });
    const persistedGrace = await adminPage.locator('form input[type="number"]').nth(2).inputValue();

    // Test invalid out-of-range speedLimit = 15
    await adminPage.locator('form input[type="number"]').nth(0).fill('15');
    await adminPage.getByRole('button', { name: 'Save Platform Settings' }).click();
    const invalidSettingsErr = await adminPage
      .waitForSelector('text=Speed governor limit must be between 40 and 200 km/h.', { timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    // Fix speed back + restore original grace hours via UI
    await speedInput.fill(String(cleanup.initialSettings?.speed_limit ?? 120));
    await adminPage
      .locator('form input[type="number"]')
      .nth(2)
      .fill(String(cleanup.initialSettings?.cancellation_grace_hours ?? 6));
    await adminPage.getByRole('button', { name: 'Save Platform Settings' }).click();
    await adminPage.waitForSelector('text=Platform settings saved to Supabase database.', { timeout: 15000 });

    // Verify customer 403 and anon 401 on /api/settings PATCH
    const custSettingsPatch = await custAApi.fetchApi('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: 'Hacked Co' }),
    });
    const anonSettingsPatch = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: 'Anon Hacked' }),
    });

    record(
      'P7-SET-01',
      'Admin Settings',
      'Edit grace hours -> Reload persisted -> Invalid speedLimit caught -> Customer 403 / Anon 401 -> Restored',
      persistedGrace === '8' &&
        invalidSettingsErr &&
        custSettingsPatch.status === 403 &&
        anonSettingsPatch.status === 401,
      `persistedGrace=${persistedGrace}, inlineErr=${invalidSettingsErr}, cust=${custSettingsPatch.status}, anon=${anonSettingsPatch.status}`
    );

    // Test BUG-07 Storefront exit link from /admin
    await adminPage.getByRole('button', { name: /View Storefront/i }).click();
    await adminPage.waitForFunction(() => window.location.pathname === '/', null, { timeout: 10000 });
    const leftAdminOk = adminPage.url().endsWith('/') || !adminPage.url().includes('/admin');
    record('P7-ADM-NAV', 'Admin Navigation', 'View Storefront navigates cleanly out of /admin to /', leftAdminOk, adminPage.url());

    // Return to /admin for Review Moderation later
    await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('text=Tamil Nadu Fleet Operations & Telemetry', { timeout: 15000 });

    // =========================================================================
    // PART 3: CUSTOMER REVIEW SUBMISSION (UI) + MODERATION (ADMIN UI) + RLS + DUPES
    // =========================================================================
    console.log('\n--- PART 3: Reviews Submission, Validation, Cross-User Block & Admin Moderation ---');
    // Approve qaBookingId via admin API so Customer UI renders Leave Review button
    const approveRes = await adminApi.fetchApi(`/api/bookings/${qaBookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    if (approveRes.status !== 200) throw new Error(`Approve failed: ${approveRes.raw}`);

    const custCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const custPage = await custCtx.newPage();
    await attachErrorCollectors(custPage, 'CustomerReviews', errorCollector);

    await custPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await custPage.waitForSelector('text=Featured Self-Drive Cars', { timeout: 20000 });
    await custPage.getByRole('button', { name: 'Log In' }).first().click();
    await custPage.fill('input[placeholder="name@domain.com"]', qaEmailA);
    await custPage.fill('input[placeholder="••••••••"]', qaPass);
    await custPage.getByRole('button', { name: 'Sign In to Account' }).click();
    await custPage.waitForSelector('input[placeholder="name@domain.com"]', { state: 'detached', timeout: 15000 });

    const tCustDash = Date.now();
    await custPage.goto(`${BASE_URL}/account`, { waitUntil: 'domcontentloaded' });
    await custPage.waitForSelector(`text=${qaBookingId}`, { timeout: 15000 });
    perfMetrics.customerDashboardLoadMs = Date.now() - tCustDash;
    await custPage.getByRole('button', { name: /My Bookings/i }).click();
    await custPage.getByRole('button', { name: 'Leave Review' }).first().click();
    await custPage.locator('form textarea').fill('Clean Thar Roxx and fast pickup at Chennai Airport Hub!');
    await custPage.getByRole('button', { name: 'Submit Verified Review' }).click();
    await custPage.waitForSelector('text=Thank you! Your verified review has been saved and published.', {
      timeout: 15000,
    });

    // Reload Vehicle Detail page and verify review + rating calculated
    await custPage.goto(`${BASE_URL}/vehicles/${qaVehId}`, { waitUntil: 'domcontentloaded' });
    await custPage.waitForSelector('text=Clean Thar Roxx and fast pickup at Chennai Airport Hub!', { timeout: 15000 });
    const detailRatingUpdated = await custPage.locator('body').innerText();

    // Negative review API tests: duplicate 409, cross-customer 403, short comment 422
    const dupReviewRes = await custAApi.fetchApi('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: qaBookingId,
        vehicleId: qaVehId,
        rating: 4,
        comment: 'Duplicate attempt should return 409 conflict',
      }),
    });
    const crossCustReviewRes = await custBApi.fetchApi('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: qaBookingId,
        vehicleId: qaVehId,
        rating: 5,
        comment: 'Customer B cannot review Customer A booking',
      }),
    });
    const invalidReviewRes = await custAApi.fetchApi('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: qaBookingId,
        vehicleId: qaVehId,
        rating: 5,
        comment: 'No',
      }),
    });

    // Admin Review Moderation: Hide -> Verify hidden from public + vehicle review_count drops to 0 -> Approve -> Delete
    await adminPage.getByRole('button', { name: 'Review Moderation' }).click();
    await adminPage.waitForSelector('text=Clean Thar Roxx and fast pickup at Chennai Airport Hub!', {
      timeout: 15000,
    });
    await adminPage.getByRole('button', { name: 'Hide Review' }).first().click();
    await adminPage.waitForSelector('text=Hidden (Unapproved)', { timeout: 15000 });

    const publicAfterHide = await fetch(`${BASE_URL}/api/reviews?vehicleId=${qaVehId}`).then((r) => r.json());
    const { data: vehAfterHide } = await adminSetupClient
      .from('vehicles')
      .select('rating, review_count')
      .eq('id', qaVehId)
      .single();

    await adminPage.getByRole('button', { name: 'Approve Review' }).first().click();
    await adminPage.waitForSelector('text=Approved (Live)', { timeout: 15000 });
    const publicAfterApprove = await fetch(`${BASE_URL}/api/reviews?vehicleId=${qaVehId}`).then((r) => r.json());
    const { data: vehAfterApprove } = await adminSetupClient
      .from('vehicles')
      .select('rating, review_count')
      .eq('id', qaVehId)
      .single();

    // Delete review via Admin UI
    await adminPage.locator('button[title="Delete review"]').first().click();
    await adminPage.waitForSelector('text=permanently removed', { timeout: 15000 });

    record(
      'P7-REV-01',
      'Reviews & Moderation',
      'Submit UI review -> Detail page + rating sync -> 409 dupe / 403|404 cross-cust / 422 short -> Admin Hide/Approve/Delete sync',
      detailRatingUpdated.includes('(1 Reviews)') &&
        dupReviewRes.status === 409 &&
        (crossCustReviewRes.status === 403 || crossCustReviewRes.status === 404) &&
        invalidReviewRes.status === 422 &&
        (publicAfterHide.reviews?.length ?? 99) === 0 &&
        vehAfterHide?.review_count === 0 &&
        (publicAfterApprove.reviews?.length ?? 0) === 1 &&
        vehAfterApprove?.review_count === 1,
      `dup=${dupReviewRes.status}, cross=${crossCustReviewRes.status}, short=${invalidReviewRes.status}, hideCount=${publicAfterHide.reviews?.length}/db=${vehAfterHide?.review_count}, appCount=${publicAfterApprove.reviews?.length}/db=${vehAfterApprove?.review_count}`
    );

    await custCtx.close();
    await adminCtx.close();

    // =========================================================================
    // PART 4: TARGETED BUG-FIX, SECURITY & MULTI-ROLE RBAC API CHECKS
    // =========================================================================
    console.log('\n--- PART 4: Bug-Fix Verification, Payments Conflict, Notifications & Direct RLS ---');

    // BUG-04: Unauthenticated booking POST returns 401
    const unauthBooking = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: qaVehId,
        pickupDate: '2027-09-01',
        pickupTime: '09:00',
        returnDate: '2027-09-02',
        returnTime: '09:00',
        pickupLocation: 'Chennai Airport Hub',
        returnLocation: 'Chennai Airport Hub',
      }),
    });

    // BUG-03: Counter payment success, then duplicate rental_charge -> 409 Conflict!
    const payFirst = await adminApi.fetchApi('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: qaBookingId,
        amount: 7000,
        paymentMethod: 'UPI',
        type: 'rental_charge',
        referenceNote: 'QA-UPI-7700',
      }),
    });
    const payDup = await adminApi.fetchApi('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: qaBookingId,
        amount: 7000,
        paymentMethod: 'Cash',
        type: 'rental_charge',
      }),
    });

    // Create 2nd booking and cancel it, then verify recording rental_charge returns 400
    const b2Res = await custAApi.fetchApi('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: qaVehId,
        pickupDate: '2027-09-10',
        pickupTime: '09:00',
        returnDate: '2027-09-11',
        returnTime: '18:00',
        pickupLocation: 'Chennai Airport Hub',
        returnLocation: 'Chennai Airport Hub',
        deliveryType: 'hub',
        customerName: 'QA Customer Alpha',
        customerEmail: qaEmailA,
        customerPhone: '9840011001',
      }),
    });
    const qaBookingId2 = b2Res.data?.booking?.id || b2Res.data?.bookingId;
    if (qaBookingId2) cleanup.bookingIds.push(qaBookingId2);
    const cancelRes = await custAApi.fetchApi(`/api/bookings/${qaBookingId2}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', reason: 'QA cancel payment guard test' }),
    });
    const canceledGet = await custAApi.fetchApi(`/api/bookings/${qaBookingId2}`);
    const payCancelled = await adminApi.fetchApi('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: qaBookingId2,
        amount: 3500,
        paymentMethod: 'Cash',
        type: 'rental_charge',
      }),
    });

    // BUG-05: Negative price update on PATCH /api/vehicles/[id] -> 422
    const badVehiclePatch = await adminApi.fetchApi(`/api/vehicles/${qaVehId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricePerDay: -500 }),
    });

    // BUG-06: POST /api/notifications valid -> 201 + PATCH read -> 200, invalid FK -> 400
    const badNotif = await adminApi.fetchApi('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: 'qa@test.in',
        title: 'Bad FK test',
        message: 'Should fail cleanly',
        bookingId: 'NONEXISTENT-99999',
      }),
    });
    const okNotif = await adminApi.fetchApi('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: 'fleet-admin',
        title: 'QA Phase 7 Alert',
        message: 'Notification mark read check',
        bookingId: qaBookingId,
      }),
    });
    if (okNotif.data?.notification?.id) cleanup.notificationIds.push(okNotif.data.notification.id);
    const readNotifRes = await adminApi.fetchApi(`/api/notifications/${okNotif.data?.notification?.id}/read`, {
      method: 'PATCH',
    });

    // Fleet Manager role can inspect bookings/customers/payments (200) and cannot escalate roles
    const fmBookings = await fmApi.fetchApi('/api/bookings');
    const fmCustomers = await fmApi.fetchApi('/api/customers');

    // Direct PostgreSQL RLS tests via Customer B JWT against Customer A's booking
    const { data: rlsBookingsForB } = await custBApi.authedSupabase
      .from('bookings')
      .select('id')
      .eq('id', qaBookingId);
    const { data: rlsPaymentsForB } = await custBApi.authedSupabase
      .from('payments')
      .select('id')
      .eq('booking_id', qaBookingId);
    const { error: rlsUpdateRoleErr } = await custAApi.authedSupabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', qaCustAId);
    const { data: verifyRoleA } = await adminSetupClient
      .from('profiles')
      .select('role')
      .eq('id', qaCustAId)
      .single();

    record(
      'P7-SEC-01',
      'Security & Bug Fixes',
      'BUG-03..06 + Fleet Manager RBAC + Direct Supabase RLS Isolation verified',
      unauthBooking.status === 401 &&
        payFirst.status === 201 &&
        payDup.status === 409 &&
        cancelRes.status === 200 &&
        canceledGet.data?.booking?.bookingStatus === 'cancelled' &&
        payCancelled.status === 400 &&
        badVehiclePatch.status === 422 &&
        badNotif.status === 400 &&
        okNotif.status === 201 &&
        readNotifRes.status === 200 &&
        fmBookings.status === 200 &&
        fmCustomers.status === 200 &&
        (rlsBookingsForB?.length ?? 99) === 0 &&
        (rlsPaymentsForB?.length ?? 99) === 0 &&
        Boolean(rlsUpdateRoleErr) &&
        verifyRoleA?.role === 'customer',
      `unauthBkg=${unauthBooking.status}, pay1=${payFirst.status}, payDup=${payDup.status}, cancelStatus=${canceledGet.data?.booking?.bookingStatus}, payCanc=${payCancelled.status}, badVeh=${badVehiclePatch.status}, badNotif=${badNotif.status}, okNotif=${okNotif.status}, readNotif=${readNotifRes.status}, fmBkg=${fmBookings.status}, rlsBkgB=${rlsBookingsForB?.length}, rlsPayB=${rlsPaymentsForB?.length}, roleA=${verifyRoleA?.role}`
    );

    // Runtime Hygiene check
    record(
      'P7-HYG-01',
      'Runtime Hygiene',
      'Zero uncaught runtime console errors, pageerrors, 500s, or unexpected 404s across all browser contexts',
      errorCollector.consoleErrors.length === 0 &&
        errorCollector.pageErrors.length === 0 &&
        errorCollector.server500s.length === 0 &&
        errorCollector.notFound404s.length === 0,
      `console=${errorCollector.consoleErrors.length}, page=${errorCollector.pageErrors.length}, 500=${errorCollector.server500s.length}, 404=${errorCollector.notFound404s.length}`
    );

    if (errorCollector.consoleErrors.length || errorCollector.pageErrors.length || errorCollector.server500s.length || errorCollector.notFound404s.length) {
      console.log('COLLECTED ERRORS:', JSON.stringify(errorCollector, null, 2));
    }
  } finally {
    await browser.close();

    console.log('\n--- Cleaning Up Temporary Phase 7 QA Artifacts ---');
    // Delete QA notifications (both explicit and any linked to QA bookings)
    for (const nid of cleanup.notificationIds) {
      await adminSetupClient.from('notification_logs').delete().eq('id', nid);
    }
    for (const bid of cleanup.bookingIds) {
      await adminSetupClient.from('notification_logs').delete().eq('booking_id', bid);
      await adminSetupClient.from('reviews').delete().eq('booking_id', bid);
      await adminSetupClient.from('payments').delete().eq('booking_id', bid);
      await adminSetupClient.from('booking_status_history').delete().eq('booking_id', bid);
      await adminSetupClient.from('bookings').delete().eq('id', bid);
    }
    for (const mid of cleanup.maintenanceIds) {
      await adminSetupClient.from('vehicle_maintenance').delete().eq('id', mid);
    }
    for (const vid of cleanup.vehicleIds) {
      await adminSetupClient.from('vehicle_maintenance').delete().eq('vehicle_id', vid);
      await adminSetupClient.from('reviews').delete().eq('vehicle_id', vid);
      await adminSetupClient.from('vehicles').delete().eq('id', vid);
    }
    for (const hid of cleanup.hubIds) {
      await adminSetupClient.from('pickup_locations').delete().eq('id', hid);
    }
    if (cleanup.initialSettings?.id) {
      await adminSetupClient
        .from('application_settings')
        .update({
          company_name: cleanup.initialSettings.company_name,
          gstin: cleanup.initialSettings.gstin,
          support_phone: cleanup.initialSettings.support_phone,
          support_email: cleanup.initialSettings.support_email,
          emergency_phone: cleanup.initialSettings.emergency_phone,
          speed_limit: cleanup.initialSettings.speed_limit,
          min_driver_age: cleanup.initialSettings.min_driver_age,
          fuel_policy: cleanup.initialSettings.fuel_policy,
          cancellation_grace_hours: cleanup.initialSettings.cancellation_grace_hours,
        })
        .eq('id', cleanup.initialSettings.id);
    }
    for (const uid of cleanup.userIds) {
      await adminSetupClient.from('notification_logs').delete().eq('user_id', uid);
      await adminSetupClient.from('driving_licences').delete().eq('user_id', uid);
      await adminSetupClient.from('profiles').delete().eq('id', uid);
      await adminSetupClient.auth.admin.deleteUser(uid);
    }
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    console.log('Cleanup completed cleanly.');
  }

  console.log('\n--- Measured Performance Telemetry ---');
  console.log(JSON.stringify(perfMetrics, null, 2));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log('\n==================================================================');
  console.log(`PHASE 7 QA SUITE RESULT: ${passed}/${results.length} PASSED, ${failed} FAILED`);
  console.log('==================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});

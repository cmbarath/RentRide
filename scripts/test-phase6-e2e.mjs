import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const adminSetupClient = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const testResults = [];
function record(id, section, description, passed, details = '') {
  testResults.push({ id, section, description, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'} [${id}] [${section}] ${description}${details ? ` (${details})` : ''}`);
}

async function attachErrorCollectors(page, label, collector) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Ignore expected browser auth negative-test network rejections during forbidden/login check
      if (!txt.includes('401') && !txt.includes('403')) {
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

async function main() {
  console.log('======================================================');
  console.log('       RENTRIDE PHASE 6: E2E INTEGRATION SUITE        ');
  console.log('======================================================');

  const ts = Date.now();
  const qaEmail = `qa.phase6.${ts}@rentride-qa.test`;
  const qaPassword = `QaP6#${crypto.randomBytes(8).toString('hex')}!`;
  const qaRegNo = `TN 09 QA ${String(ts).slice(-4)}`;
  const qaVehName = `QA Maruti Jimny ${String(ts).slice(-4)}`;
  let qaUserId = '';
  let createdBookingId = '';
  let createdVehicleId = '';

  const tmpDir = path.resolve(process.cwd(), 'scripts', '.tmp-qa');
  fs.mkdirSync(tmpDir, { recursive: true });
  const frontPngPath = path.join(tmpDir, 'dl-front.png');
  const backPngPath = path.join(tmpDir, 'dl-back.png');
  fs.writeFileSync(frontPngPath, Buffer.from(TINY_PNG_BASE64, 'base64'));
  fs.writeFileSync(backPngPath, Buffer.from(TINY_PNG_BASE64, 'base64'));

  // Provision clean confirmed QA Customer account (avoids rate_limit_email_sent = 2 SMTP quota)
  const { data: createdUser, error: userCreateErr } = await adminSetupClient.auth.admin.createUser({
    email: qaEmail,
    password: qaPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'QA Phase6 Renter',
      phone: '9876501234',
    },
  });

  if (userCreateErr || !createdUser?.user?.id) {
    console.error('Failed to provision QA customer user:', userCreateErr);
    process.exit(1);
  }
  qaUserId = createdUser.user.id;
  console.log(`Provisioned temporary QA Customer: ${qaEmail} (${qaUserId})\n`);

  const executablePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : undefined;

  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : { channel: 'chrome' }),
    headless: true,
  });

  const errorCollector = { consoleErrors: [], pageErrors: [], server500s: [], notFound404s: [] };

  try {
    // =========================================================================
    // 1. RESPONSIVE VIEWPORTS & HOMEPAGE REAL DATA
    // =========================================================================
    console.log('--- PART 1: Responsive Layout & Homepage Live Supabase Load ---');
    const respContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const respPage = await respContext.newPage();
    await attachErrorCollectors(respPage, 'Responsive', errorCollector);

    await respPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await respPage.waitForSelector('text=Featured Self-Drive Cars', { timeout: 20000 });
    await respPage.waitForFunction(
      () => Array.from(document.querySelectorAll('img')).filter((i) => i.complete && i.naturalWidth > 0).length >= 3,
      null,
      { timeout: 20000 }
    );

    const homeMetrics = await respPage.evaluate(() => {
      const overflowDesktop = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      const bodyText = document.body.innerText;
      const loadedImgs = Array.from(document.querySelectorAll('img')).filter(
        (img) => img.complete && img.naturalWidth > 0
      ).length;
      return {
        overflowDesktop,
        hasLiveCount: bodyText.includes('Verified'),
        reviewsRendered: bodyText.toLowerCase().includes('verified database reviews'),
        loadedImgs,
      };
    });
    record(
      'R-1',
      'Responsive',
      'Desktop 1440px homepage loads live vehicles without broken images or overflow',
      !homeMetrics.overflowDesktop && homeMetrics.reviewsRendered && homeMetrics.loadedImgs >= 3,
      `loadedImgs=${homeMetrics.loadedImgs}, overflow=${homeMetrics.overflowDesktop}`
    );

    // Tablet 768x1024
    await respPage.setViewportSize({ width: 768, height: 1024 });
    await respPage.waitForTimeout(300);
    const overflowTablet = await respPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    record('R-2', 'Responsive', 'Tablet 768px renders without horizontal overflow', !overflowTablet);

    // Mobile 375x812 (Homepage + Explore Catalog via mobile menu)
    await respPage.setViewportSize({ width: 375, height: 812 });
    await respPage.waitForTimeout(300);
    const overflowMobileHome = await respPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    await respPage.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await respPage.getByRole('button', { name: 'Explore Vehicles' }).click();
    await respPage.waitForSelector('text=Explore Vehicles in Tamil Nadu', { timeout: 15000 });
    await respPage.waitForTimeout(300);
    const overflowMobileExplore = await respPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    record(
      'R-3',
      'Responsive',
      'Mobile 375px homepage & explore render cleanly without horizontal overflow',
      !overflowMobileHome && !overflowMobileExplore,
      `homeOverflow=${overflowMobileHome}, exploreOverflow=${overflowMobileExplore}`
    );
    await respContext.close();

    // =========================================================================
    // 2. COMPLETE CUSTOMER JOURNEY (Desktop 1440x900)
    // =========================================================================
    console.log('\n--- PART 2: Full Customer Journey (Explore -> Detail -> Auth -> Booking -> Dashboard) ---');
    const custContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const custPage = await custContext.newPage();
    await attachErrorCollectors(custPage, 'Customer', errorCollector);

    await custPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await custPage.waitForSelector('text=Featured Self-Drive Cars', { timeout: 20000 });
    await custPage.getByRole('button', { name: 'Explore Vehicles' }).click();
    await custPage.waitForSelector('text=Explore Vehicles in Tamil Nadu', { timeout: 15000 });
    await custPage.waitForSelector('text=Page 1 of', { timeout: 15000 });

    const page1TitleText = await custPage.locator('h3').first().innerText();
    await Promise.all([
      custPage.waitForResponse((res) => res.url().includes('/api/vehicles') && res.url().includes('page=2')),
      custPage.getByRole('button', { name: 'Next', exact: true }).click(),
    ]);
    await custPage.waitForSelector('text=Page 2 of', { timeout: 15000 });
    await custPage.waitForFunction(
      (prevTitle) => {
        const h = document.querySelector('h3');
        return Boolean(h && h.textContent && h.textContent.trim() !== prevTitle);
      },
      page1TitleText,
      { timeout: 10000 }
    ).catch(() => {});
    const page2TitleText = await custPage.locator('h3').first().innerText();
    record(
      'C-1',
      'Customer UI',
      'Explore Vehicles queries /api/vehicles with real backend pagination',
      page1TitleText !== page2TitleText,
      `Page1="${page1TitleText}" -> Page2="${page2TitleText}"`
    );

    // Filter search for Creta and open Detail Page
    await Promise.all([
      custPage.waitForResponse((res) => res.url().includes('/api/vehicles') && res.url().includes('page=1')),
      custPage.getByRole('button', { name: 'Prev', exact: true }).click(),
    ]);
    await custPage.waitForSelector('text=Page 1 of', { timeout: 15000 });
    const searchInput = custPage.getByPlaceholder(/Search by model, brand/i);
    await searchInput.fill('Creta');
    await custPage.waitForFunction(
      () => document.body.innerText.includes('Hyundai Creta') && !document.body.innerText.includes('Querying live Supabase'),
      null,
      { timeout: 15000 }
    );

    await custPage.getByRole('button', { name: 'Details' }).first().click();
    await custPage.waitForSelector('button:has-text("Proceed to Book Ride")', { timeout: 15000 });
    const detailHasPricing = await custPage.waitForSelector('text=Total Payable at Hub', { timeout: 15000 }).then(() => true).catch(() => false);
    record('C-2', 'Customer UI', 'Vehicle Detail page displays live /api/pricing/calculate total & reviews panel', detailHasPricing);

    await custPage.getByRole('button', { name: 'Proceed to Book Ride' }).click();
    await custPage.waitForSelector('text=Sign In / Create Account', { timeout: 15000 });
    record('C-3', 'Customer UI', 'Checkout prompts authentication when unauthenticated', true);

    // Authenticate via AuthModal
    await custPage.getByRole('button', { name: 'Sign In / Create Account' }).click();
    await custPage.waitForSelector('input[placeholder="name@domain.com"]', { timeout: 10000 });
    await custPage.fill('input[placeholder="name@domain.com"]', qaEmail);
    await custPage.fill('input[placeholder="••••••••"]', qaPassword);
    await custPage.getByRole('button', { name: 'Sign In to Account' }).click();
    await custPage.waitForSelector('input[placeholder="name@domain.com"]', { state: 'detached', timeout: 15000 });
    record('C-4', 'Customer UI', 'Customer signs in through AuthModal cleanly without manual reload', true);

    // Fill Booking schedule (safe 2027 future dates: 09:00 -> 18:00 across 2 calendar dates = 3 24-hr cycles) + Upload Licence PNGs + Submit
    const dateInputs = custPage.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2027-03-10');
    await dateInputs.nth(1).fill('2027-03-12');
    await custPage.waitForSelector('text=3 Days (24-hr cycle)', { timeout: 15000 });

    await custPage.fill('input[placeholder="TN-01-2020-XXXXXXX"]', 'TN-09-QA-2026001');
    const fileInputs = custPage.locator('input[type="file"]');
    await fileInputs.nth(0).setInputFiles(frontPngPath);
    await fileInputs.nth(1).setInputFiles(backPngPath);

    await custPage.getByRole('button', { name: 'Submit Booking Request' }).click();
    await custPage.waitForSelector('text=Booking Request Submitted!', { timeout: 25000 });

    createdBookingId = await custPage.locator('span.text-\\[\\#C7F36B\\].font-mono').first().innerText().catch(async () => {
      const m = (await custPage.locator('body').innerText()).match(/RR-\d+-\d+/);
      return m ? m[0] : '';
    });
    const stage2Text = await custPage.locator('body').innerText();
    record(
      'C-5',
      'Customer UI',
      'Checkout submits real atomic booking & optional KYC upload via Supabase',
      Boolean(createdBookingId) && stage2Text.includes('Pending Fleet Review') && stage2Text.includes('Payment Status: Not Paid'),
      `BookingID=${createdBookingId}`
    );

    // Go to Customer Dashboard & verify persistence + profile update across reload
    await custPage.getByRole('button', { name: 'Go to My Bookings' }).click();
    await custPage.waitForSelector(`text=${createdBookingId}`, { timeout: 15000 });
    const dashBookingText = await custPage.locator('body').innerText();
    record(
      'C-6',
      'Customer UI',
      'Customer Dashboard shows booking with separate Pending Review & Pay at Pickup Hub badges',
      dashBookingText.includes('Pending Review') && dashBookingText.includes('Pay at Pickup Hub')
    );

    // Edit Profile & reload to verify persistence
    await custPage.getByRole('button', { name: 'My Profile' }).click();
    const profileNameInput = custPage.locator('form input[type="text"]').first();
    await profileNameInput.fill('QA Phase6 Edited');
    await custPage.getByRole('button', { name: /Save Profile Changes/i }).click();
    await custPage.waitForSelector('text=Your profile details have been saved securely.', { timeout: 15000 });
    await custPage.reload({ waitUntil: 'domcontentloaded' });
    await custPage.waitForSelector('header button:has-text("QA")', { timeout: 20000 });

    // Re-open Dashboard via Navbar dropdown
    await custPage.locator('header button').filter({ hasText: 'QA' }).first().click();
    await custPage.getByRole('button', { name: /My Account & Profile/i }).click();
    await custPage.getByRole('button', { name: 'My Profile' }).click();
    const persistedProfileName = await custPage.locator('form input[type="text"]').first().inputValue();
    record(
      'C-7',
      'Customer UI',
      'Profile update persists in Supabase across browser reload',
      persistedProfileName === 'QA Phase6 Edited',
      `Value="${persistedProfileName}"`
    );

    // Check Unauthorized Customer visiting /admin
    await custPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    const blockedAdminText = await custPage.waitForSelector('text=Administrator or Fleet Manager role is required', { timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    record('S-1', 'Security', 'Signed-in Customer cannot enter Admin Console (/admin RBAC gate)', blockedAdminText);

    // =========================================================================
    // 3. COMPLETE ADMIN JOURNEY (Isolated Admin BrowserContext)
    // =========================================================================
    console.log('\n--- PART 3: Full Admin Journey (Fleet CRUD -> KYC Signed URL -> Approve -> Counter Settlement) ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();
    await attachErrorCollectors(adminPage, 'Admin', errorCollector);

    const adminEmail = process.env.QA_ADMIN_EMAIL;
    const adminPassword = process.env.QA_ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      throw new Error('Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD in .env.local before running E2E suite.');
    }

    await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('input[placeholder="admin@rentride.in"]', { timeout: 15000 });
    await adminPage.fill('input[placeholder="admin@rentride.in"]', adminEmail);
    await adminPage.fill('input[placeholder="••••••••"]', adminPassword);
    await adminPage.getByRole('button', { name: 'Sign In as Administrator' }).click();
    await adminPage.waitForSelector('text=Tamil Nadu Fleet Operations & Telemetry', { timeout: 20000 });
    record('A-1', 'Admin UI', 'Administrator signs into Fleet Operations Console cleanly', true);

    // Verify Admin Settings & Tamil Nadu Hubs & Pricing load cleanly from Supabase
    await adminPage.getByRole('button', { name: 'Tamil Nadu Hubs' }).click();
    await adminPage.waitForSelector('text=Tamil Nadu Hubs & Location Networks', { timeout: 10000 });
    const hubsLoaded = await adminPage.waitForSelector('text=Total Rental Hubs', { timeout: 10000 }).then(() => true).catch(() => false);
    await adminPage.getByRole('button', { name: 'Pricing & Calendar' }).click();
    await adminPage.waitForSelector('text=Save Pricing Configuration', { timeout: 10000 });
    await adminPage.getByRole('button', { name: 'Business Settings' }).click();
    await adminPage.waitForSelector('input[value*="RentRide"]', { timeout: 10000 });
    record('A-2', 'Admin UI', 'Locations, Pricing Rules, and Settings screens load live DB state', hubsLoaded);

    // Add New Vehicle in Fleet Management
    await adminPage.getByRole('button', { name: 'Fleet Management' }).click();
    await adminPage.waitForSelector('button:has-text("Add New Vehicle")', { timeout: 10000 });
    await adminPage.getByRole('button', { name: 'Add New Vehicle' }).click();
    await adminPage.fill('input[placeholder="e.g. Royal Enfield Hunter 350"]', qaVehName);
    await adminPage.fill('input[placeholder="e.g. Royal Enfield, Tata, Hyundai"]', 'Maruti Suzuki');
    await adminPage.fill('input[placeholder="e.g. Hunter 350, Creta, Safari"]', 'Jimny');
    await adminPage.fill('input[placeholder="e.g. TN 09 BK 8921"]', qaRegNo);
    const numInputs = adminPage.locator('form input[type="number"]');
    // Year, Daily Rent, Security Deposit
    await numInputs.nth(1).fill('3200');
    await numInputs.nth(2).fill('4000');
    await adminPage.getByRole('button', { name: 'Add Vehicle to Fleet' }).click();
    await adminPage.waitForSelector(`text=${qaVehName} added to live fleet.`, { timeout: 15000 });

    // Confirm QA vehicle shows up via public Customer API/Explore UI
    await custPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await custPage.waitForSelector('text=Featured Self-Drive Cars', { timeout: 20000 });
    await custPage.getByRole('button', { name: 'Explore Vehicles' }).click();
    await custPage.waitForSelector('input[placeholder*="Search by model"]', { timeout: 15000 });
    await custPage.locator('input[placeholder*="Search by model"]').fill(qaVehName);
    const visibleInExplore = await custPage.waitForSelector(`text=${qaVehName}`, { timeout: 15000 }).then(() => true).catch(() => false);
    record('A-3', 'Admin UI', 'Admin adds vehicle -> appears immediately in Customer Explore catalog', visibleInExplore);

    // Edit QA vehicle daily rent to 3500 & verify persisted across reload
    await adminPage.locator('input[placeholder*="Search by model"]').fill(qaVehName);
    await adminPage.locator('button[title="Edit Vehicle"]').first().click();
    await adminPage.locator('form input[type="number"]').nth(1).fill('3500');
    await adminPage.getByRole('button', { name: 'Update Vehicle' }).click();
    await adminPage.waitForSelector(`text=${qaVehName} updated in fleet database.`, { timeout: 15000 });

    // Capture ID from Supabase for clean teardown
    const { data: qaVehRows } = await adminSetupClient.from('vehicles').select('id, price_per_day').eq('name', qaVehName);
    createdVehicleId = qaVehRows?.[0]?.id || '';
    record(
      'A-4',
      'Admin UI',
      'Admin updates vehicle pricing -> persisted in Supabase',
      Number(qaVehRows?.[0]?.price_per_day) === 3500,
      `VehicleID=${createdVehicleId}, Price=₹${qaVehRows?.[0]?.price_per_day}`
    );

    // Open Bookings & KYC -> Inspect booking + signed DL URL -> Approve Booking
    await adminPage.getByRole('button', { name: 'Bookings & KYC' }).click();
    await adminPage.waitForSelector(`text=${createdBookingId}`, { timeout: 15000 });
    const bookingRow = adminPage.locator('tr', { hasText: createdBookingId });
    await bookingRow.locator('button[title="View Details & Licence"]').click();
    await adminPage.waitForSelector(`text=Booking ${createdBookingId} Details`, { timeout: 10000 });
    await adminPage.waitForSelector('img[alt="Front"]', { timeout: 10000 });
    const dlFrontLoaded = await adminPage.locator('img[alt="Front"]').evaluate(
      (img) => img instanceof HTMLImageElement && Boolean(img.src) && !img.src.includes('sample_licence')
    );
    await adminPage.locator('button:has-text("Approve Booking")').click();
    await adminPage.waitForSelector(`text=Booking ${createdBookingId} approved.`, { timeout: 15000 });

    const bookingRowAfterApprove = await adminPage.locator('tr', { hasText: createdBookingId }).innerText();
    record(
      'A-5',
      'Admin UI',
      'Admin views private DL signed URL & approves booking without marking Payment Paid',
      dlFrontLoaded && bookingRowAfterApprove.includes('Confirmed') && bookingRowAfterApprove.includes('Pay at Hub')
    );

    // Verify Customer Dashboard shows Confirmed + Pay at Hub separately after reload
    await custPage.reload({ waitUntil: 'domcontentloaded' });
    await custPage.waitForSelector('header button:has-text("QA")', { timeout: 20000 });
    await custPage.locator('header button').filter({ hasText: 'QA' }).first().click();
    await custPage.getByRole('button', { name: /My Bookings/i }).click();
    await custPage.waitForSelector(`text=${createdBookingId}`, { timeout: 15000 });
    const custDashAfterApprove = await custPage.locator('body').innerText();
    record(
      'C-8',
      'Integration',
      'Customer Dashboard reflects Admin Approval (Confirmed) while Payment Status stays Pay at Pickup Hub',
      custDashAfterApprove.includes('Confirmed') && custDashAfterApprove.includes('Pay at Pickup Hub')
    );

    // Admin Records Counter Settlement (UPI) in AdminPayments
    await adminPage.getByRole('button', { name: 'Revenue & Payments' }).click();
    await adminPage.getByRole('button', { name: 'Record Counter Settlement' }).click();
    await adminPage.locator('form select').nth(0).selectOption(createdBookingId);
    await adminPage.locator('form select').nth(1).selectOption('UPI');
    await adminPage.fill('input[placeholder*="UPI Ref"]', 'QA-UPI-99881');
    await adminPage.getByRole('button', { name: 'Confirm Counter Settlement' }).click();
    await adminPage.waitForSelector(`text=Recorded UPI counter settlement`, { timeout: 15000 });
    const ledgerText = await adminPage.locator('body').innerText();
    record(
      'A-6',
      'Admin UI',
      'Admin records Counter Settlement -> ledger entry created & Booking updated independently',
      ledgerText.includes(createdBookingId) && ledgerText.includes('UPI')
    );

    // Reload Customer Dashboard -> Confirm Counter Settled while booking stays Confirmed
    await custPage.reload({ waitUntil: 'domcontentloaded' });
    await custPage.waitForSelector('header button:has-text("QA")', { timeout: 20000 });
    await custPage.locator('header button').filter({ hasText: 'QA' }).first().click();
    await custPage.getByRole('button', { name: /My Bookings/i }).click();
    await custPage.waitForSelector(`text=${createdBookingId}`, { timeout: 15000 });
    const custDashAfterSettlement = await custPage.locator('body').innerText();
    record(
      'C-9',
      'Integration',
      'Customer Dashboard reflects Settled at Counter after Admin settlement payment',
      custDashAfterSettlement.includes('Settled at Counter')
    );

    // Verify Zero Runtime Console Errors, Page Errors, or HTTP >= 500
    record(
      'E-1',
      'Runtime Stability',
      'Zero uncaught page errors, console errors, or HTTP 500+ responses across entire E2E flow',
      errorCollector.consoleErrors.length === 0 &&
        errorCollector.pageErrors.length === 0 &&
        errorCollector.server500s.length === 0,
      `consoleErr=${errorCollector.consoleErrors.length}, pageErr=${errorCollector.pageErrors.length}, http500=${errorCollector.server500s.length}`
    );

    if (errorCollector.consoleErrors.length > 0) console.log('Console Errors:', errorCollector.consoleErrors);
    if (errorCollector.notFound404s.length > 0) console.log('404 URLs:', errorCollector.notFound404s);
    if (errorCollector.pageErrors.length > 0) console.log('Page Errors:', errorCollector.pageErrors);
    if (errorCollector.server500s.length > 0) console.log('HTTP 500s:', errorCollector.server500s);

    await custContext.close();
    await adminContext.close();
  } finally {
    await browser.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });

    // Clean up ALL QA artifacts cleanly
    console.log('\nCleaning up QA test data from Supabase...');
    if (createdBookingId) {
      await adminSetupClient.from('payments').delete().eq('booking_id', createdBookingId);
      await adminSetupClient.from('notification_logs').delete().eq('booking_id', createdBookingId);
      await adminSetupClient.from('booking_status_history').delete().eq('booking_id', createdBookingId);
      await adminSetupClient.from('reviews').delete().eq('booking_id', createdBookingId);
      await adminSetupClient.from('bookings').delete().eq('id', createdBookingId);
    }
    if (createdVehicleId) {
      await adminSetupClient.from('vehicle_images').delete().eq('vehicle_id', createdVehicleId);
      await adminSetupClient.from('vehicles').delete().eq('id', createdVehicleId);
    }
    if (qaUserId) {
      await adminSetupClient.from('driving_licences').delete().eq('user_id', qaUserId);
      const { data: licenceFiles } = await adminSetupClient.storage.from('driving-licences').list(qaUserId);
      if (licenceFiles?.length) {
        await adminSetupClient.storage
          .from('driving-licences')
          .remove(licenceFiles.map((f) => `${qaUserId}/${f.name}`));
      }
      await adminSetupClient.from('profiles').delete().eq('id', qaUserId);
      await adminSetupClient.auth.admin.deleteUser(qaUserId);
    }
    console.log('QA cleanup complete.');
  }

  console.log('\n======================================================');
  console.log('            PHASE 6 E2E INTEGRATION REPORT            ');
  console.log('======================================================');
  const passedCount = testResults.filter((r) => r.passed).length;
  const failedCount = testResults.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTED: ${testResults.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log('======================================================\n');

  if (failedCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Unhandled E2E error:', err);
  process.exit(1);
});

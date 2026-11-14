import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/Barath/.gemini/antigravity/brain/aea01274-0980-47d4-b8e4-9e45ef93fb89';
const PROD_BASE = 'https://rent-ride-chi.vercel.app';

async function capture() {
  console.log('Launching Chrome to capture production screenshots from', PROD_BASE);
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  // 1. Homepage
  console.log('Capturing Homepage...');
  await page.goto(`${PROD_BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_production_homepage.png'), fullPage: false });

  // 2. Fleet Page
  console.log('Capturing Fleet Page (/vehicles)...');
  await page.goto(`${PROD_BASE}/vehicles`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_production_fleet.png'), fullPage: false });

  // 3. Vehicle Detail Page
  console.log('Capturing Vehicle Detail Page (/vehicles/toyota-innova-crysta)...');
  await page.goto(`${PROD_BASE}/vehicles/toyota-innova-crysta`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_production_vehicle_detail.png'), fullPage: false });

  // 4. Admin Portal Gate
  console.log('Capturing Admin Operations Gate (/admin)...');
  await page.goto(`${PROD_BASE}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_production_admin_gate.png'), fullPage: false });

  // 5. Mobile Viewport
  console.log('Capturing Mobile Viewport (/vehicles)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${PROD_BASE}/vehicles`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_production_mobile.png'), fullPage: false });

  await browser.close();
  console.log('All production screenshots captured successfully in artifacts directory!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});

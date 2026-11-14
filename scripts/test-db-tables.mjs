import fs from 'fs';
import path from 'path';
import https from 'https';

const envLines = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8').split('\n');
const env = {};
for (const l of envLines) {
  const trimmed = l.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const k = trimmed.slice(0, idx).trim();
    let v = trimmed.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
}

const sbUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const sbSecret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

// Check existing schema tables in PostgreSQL
const tables = [
  'profiles',
  'pickup_locations',
  'vehicles',
  'vehicle_images',
  'driving_licences',
  'bookings',
  'booking_status_history',
  'payments',
  'pricing_rules',
  'vehicle_maintenance',
  'reviews',
  'notification_logs',
  'admin_audit_logs',
  'application_settings'
];

async function check() {
  console.log('Querying Supabase PostgREST tables with service-role key...');
  for (const t of tables) {
    await new Promise((resolve) => {
      const u = new URL(sbUrl + '/rest/v1/' + t + '?select=*&limit=1');
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'apikey': sbSecret,
          'Authorization': 'Bearer ' + sbSecret
        }
      }, (res) => {
        let b = '';
        res.on('data', d => b += d);
        res.on('end', () => {
          console.log(`Table: ${t.padEnd(26)} -> Status: ${res.statusCode} (content-range: ${res.headers['content-range'] || 'none'})`);
          resolve();
        });
      });
      req.end();
    });
  }
}

check();

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

const supabase = createClient(supabaseUrl, supabaseKey);

const mapping = JSON.parse(fs.readFileSync('scripts/vehicle-image-mapping.json', 'utf8'));
const mapByVehicleId = new Map(mapping.map(m => [m.id, m]));

async function updateBookings() {
  const { data: bookings, error } = await supabase.from('bookings').select('id, vehicle_id, vehicle_name, vehicle_image');
  if (error) {
    console.error('Error fetching bookings:', error);
    return;
  }

  console.log(`Checking ${bookings.length} existing bookings for vehicle image updates...`);
  for (const b of bookings) {
    const mapped = mapByVehicleId.get(b.vehicle_id);
    if (mapped) {
      const { error: uErr } = await supabase
        .from('bookings')
        .update({ vehicle_image: mapped.coverImage })
        .eq('id', b.id);
      if (uErr) {
        console.error(`Failed to update booking ${b.id}:`, uErr.message);
      } else {
        console.log(`Updated booking ${b.id} with ${mapped.coverImage}`);
      }
    }
  }
}

updateBookings();

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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const mapping = JSON.parse(fs.readFileSync('scripts/vehicle-image-mapping.json', 'utf8'));

async function updateDbImages() {
  console.log(`Starting non-destructive update of 56 vehicle cover_image records...`);
  let successCount = 0;
  let errorCount = 0;

  for (const item of mapping) {
    const { error } = await supabase
      .from('vehicles')
      .update({
        cover_image: item.coverImage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (error) {
      console.error(`Failed to update ${item.id} (${item.vehicleName}):`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`Update complete: ${successCount} vehicles updated successfully, ${errorCount} errors.`);

  // Verify updated records
  const { data: sample, error: vErr } = await supabase
    .from('vehicles')
    .select('id, name, cover_image')
    .limit(5);

  if (!vErr) {
    console.log('Sample updated records from Supabase:');
    console.table(sample);
  }
}

updateDbImages().catch(err => {
  console.error(err);
  process.exit(1);
});

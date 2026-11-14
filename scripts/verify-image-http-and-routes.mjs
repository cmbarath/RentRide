import fs from 'fs';
import path from 'path';

const mapping = JSON.parse(fs.readFileSync('scripts/vehicle-image-mapping.json', 'utf8'));

async function verifyHttp() {
  console.log('--- 1. VERIFYING ALL 56 VEHICLE IMAGES OVER HTTP ---');
  let httpOk = 0;
  let httpFailed = 0;

  for (const item of mapping) {
    const safeUrl = `http://localhost:3000${encodeURI(decodeURI(item.coverImage))}`;
    try {
      const res = await fetch(safeUrl);
      if (res.status === 200) {
        const buf = await res.arrayBuffer();
        const contentType = res.headers.get('content-type');
        if (buf.byteLength > 1000) {
          httpOk++;
        } else {
          console.error(`Suspicious small byte length (${buf.byteLength}) for ${item.vehicleName}: ${safeUrl}`);
          httpFailed++;
        }
      } else {
        console.error(`HTTP ${res.status} for ${item.vehicleName}: ${safeUrl}`);
        httpFailed++;
      }
    } catch (err) {
      console.error(`Fetch error for ${item.vehicleName}:`, err.message);
      httpFailed++;
    }
  }

  console.log(`HTTP Image Check Result: ${httpOk}/56 returned HTTP 200 with valid binary payloads. Failed: ${httpFailed}`);

  console.log('\n--- 2. VERIFYING GET /api/vehicles ENDPOINT ---');
  const apiRes = await fetch('http://localhost:3000/api/vehicles');
  if (apiRes.status === 200) {
    const apiData = await apiRes.json();
    console.log(`API returned status 200. Total vehicles in DB payload: ${apiData.vehicles?.length || 0}`);
    const sample = apiData.vehicles?.slice(0, 3).map(v => ({ id: v.id, name: v.name, coverImage: v.coverImage }));
    console.log('Sample vehicles from /api/vehicles:');
    console.table(sample);

    const missingCovers = apiData.vehicles?.filter(v => !v.coverImage || v.coverImage.endsWith('.svg'));
    console.log(`Vehicles still referencing generic SVG or null: ${missingCovers.length}`);
  } else {
    console.error('API /api/vehicles failed with status:', apiRes.status);
  }

  console.log('\n--- 3. VERIFYING STOREFRONT ROUTES ---');
  for (const route of ['/', '/vehicles', '/account', '/admin']) {
    const rRes = await fetch(`http://localhost:3000${route}`);
    console.log(`Route ${route}: HTTP ${rRes.status}`);
  }
}

verifyHttp().catch(err => {
  console.error(err);
  process.exit(1);
});

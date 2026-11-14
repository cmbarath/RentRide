import fs from 'fs';
import path from 'path';

const bikeDir = 'C:/Full Stack/Prjcts/RentRide/public/images/Bike';
const carDir = 'C:/Full Stack/Prjcts/RentRide/public/images/Car';

const bikeFiles = fs.readdirSync(bikeDir);
const carFiles = fs.readdirSync(carDir);

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Read seed-catalog to get all vehicles
const fileContent = fs.readFileSync('lib/seed-catalog.ts', 'utf8');
const blocks = fileContent.split(/\{\s*id:\s*'/).slice(1);
const catalog = [];
for (const block of blocks) {
  const idM = block.match(/^(veh-[a-z]+-[0-9]+)/);
  const slugM = block.match(/slug:\s*(?:'([^']+)'|"([^"]+)")/);
  const nameM = block.match(/name:\s*(?:'([^']+)'|"([^"]+)")/);
  const brandM = block.match(/brand:\s*(?:'([^']+)'|"([^"]+)")/);
  const modelM = block.match(/model:\s*(?:'([^']+)'|"([^"]+)")/);
  const typeM = block.match(/type:\s*(?:'([^']+)'|"([^"]+)")/);
  const catM = block.match(/category:\s*(?:'([^']+)'|"([^"]+)")/);
  if (idM && slugM && nameM && typeM) {
    const slug = slugM[1] || slugM[2];
    const name = nameM[1] || nameM[2];
    const brand = brandM ? (brandM[1] || brandM[2]) : '';
    const model = modelM ? (modelM[1] || modelM[2]) : '';
    const type = typeM[1] || typeM[2];
    const category = catM ? (catM[1] || catM[2]) : '';
    catalog.push({
      id: idM[1],
      slug,
      name,
      brand,
      model,
      type,
      category
    });
  }
}

console.log('Total catalog items:', catalog.length);

const registryEntries = [];
let bikeMatches = 0;
let carMatches = 0;

for (const v of catalog) {
  const normSlug = normalize(v.slug);
  const normModel = normalize(v.brand + v.model);
  const normName = normalize(v.name);
  
  const files = v.type === 'bike' ? bikeFiles : carFiles;
  const folder = v.type === 'bike' ? 'Bike' : 'Car';
  
  let matched = files.find(f => {
    const base = normalize(path.parse(f).name);
    return base === normSlug || base === normModel || normSlug.includes(base) || base.includes(normSlug);
  });
  
  if (matched) {
    if (v.type === 'bike') bikeMatches++;
    else carMatches++;
    registryEntries.push({
      id: v.id,
      key: v.slug,
      vehicleName: v.name,
      type: v.type,
      category: v.category,
      coverImage: `/images/${folder}/${matched}`,
      galleryImages: [`/images/${folder}/${matched}`],
      altText: `${v.brand} ${v.model} ${v.category} ${v.type === 'bike' ? 'Motorcycle' : 'Car'}`,
      matchedFile: matched,
      format: path.extname(matched),
      status: 'Exact Match'
    });
  } else {
    console.warn('NO MATCH for:', v);
  }
}

console.log('Bike matches:', bikeMatches, 'out of 30');
console.log('Car matches:', carMatches, 'out of 26');
console.log('Total matches:', registryEntries.length, 'out of 56');

// Save mapping table to json for reporting and reference
fs.writeFileSync('scripts/vehicle-image-mapping.json', JSON.stringify(registryEntries, null, 2));
console.log('Saved mapping to scripts/vehicle-image-mapping.json');

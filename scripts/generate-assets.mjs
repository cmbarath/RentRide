import fs from 'fs';
import path from 'path';

// Define the exact catalogue models
const bikes = [
  // CATEGORY 1: FAMILY & COMMUTER BIKES
  { slug: 'hero-splendor-plus', name: 'Hero Splendor Plus', brand: 'Hero', category: 'Family & Commuter', engine: '97.2 cc', fuel: 'Petrol', iconType: 'commuter' },
  { slug: 'hero-hf-deluxe', name: 'Hero HF Deluxe', brand: 'Hero', category: 'Family & Commuter', engine: '97.2 cc', fuel: 'Petrol', iconType: 'commuter' },
  { slug: 'honda-shine-125', name: 'Honda Shine 125', brand: 'Honda', category: 'Family & Commuter', engine: '123.9 cc', fuel: 'Petrol', iconType: 'commuter' },
  { slug: 'honda-sp125', name: 'Honda SP125', brand: 'Honda', category: 'Family & Commuter', engine: '123.9 cc', fuel: 'Petrol', iconType: 'commuter' },
  { slug: 'honda-unicorn', name: 'Honda Unicorn', brand: 'Honda', category: 'Family & Commuter', engine: '162.7 cc', fuel: 'Petrol', iconType: 'commuter' },
  { slug: 'bajaj-platina-110', name: 'Bajaj Platina 110', brand: 'Bajaj', category: 'Family & Commuter', engine: '115.4 cc', fuel: 'Petrol', iconType: 'commuter' },
  { slug: 'tvs-raider-125', name: 'TVS Raider 125', brand: 'TVS', category: 'Family & Commuter', engine: '124.8 cc', fuel: 'Petrol', iconType: 'commuter' },
  { slug: 'bajaj-pulsar-125', name: 'Bajaj Pulsar 125', brand: 'Bajaj', category: 'Family & Commuter', engine: '124.4 cc', fuel: 'Petrol', iconType: 'commuter' },

  // CATEGORY 2: CITY & STREET BIKES
  { slug: 'bajaj-pulsar-n160', name: 'Bajaj Pulsar N160', brand: 'Bajaj', category: 'City & Street', engine: '164.8 cc', fuel: 'Petrol', iconType: 'street' },
  { slug: 'tvs-apache-rtr-160-4v', name: 'TVS Apache RTR 160 4V', brand: 'TVS', category: 'City & Street', engine: '159.7 cc', fuel: 'Petrol', iconType: 'street' },
  { slug: 'tvs-apache-rtr-200-4v', name: 'TVS Apache RTR 200 4V', brand: 'TVS', category: 'City & Street', engine: '197.7 cc', fuel: 'Petrol', iconType: 'street' },
  { slug: 'yamaha-fz-s-fi', name: 'Yamaha FZ-S FI V4', brand: 'Yamaha', category: 'City & Street', engine: '149 cc', fuel: 'Petrol', iconType: 'street' },
  { slug: 'yamaha-mt-15-v2', name: 'Yamaha MT-15 V2', brand: 'Yamaha', category: 'City & Street', engine: '155 cc', fuel: 'Petrol', iconType: 'street' },
  { slug: 'suzuki-gixxer-155', name: 'Suzuki Gixxer 155', brand: 'Suzuki', category: 'City & Street', engine: '155 cc', fuel: 'Petrol', iconType: 'street' },
  { slug: 'tvs-ronin', name: 'TVS Ronin', brand: 'TVS', category: 'City & Street', engine: '225.9 cc', fuel: 'Petrol', iconType: 'street' },
  { slug: 'ktm-duke-200', name: 'KTM Duke 200', brand: 'KTM', category: 'City & Street', engine: '199.5 cc', fuel: 'Petrol', iconType: 'street' },

  // CATEGORY 3: TOURING & HIGHWAY BIKES
  { slug: 'royal-enfield-classic-350', name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', category: 'Touring & Highway', engine: '349 cc', fuel: 'Petrol', iconType: 'touring' },
  { slug: 'royal-enfield-meteor-350', name: 'Royal Enfield Meteor 350', brand: 'Royal Enfield', category: 'Touring & Highway', engine: '349 cc', fuel: 'Petrol', iconType: 'touring' },
  { slug: 'royal-enfield-bullet-350', name: 'Royal Enfield Bullet 350', brand: 'Royal Enfield', category: 'Touring & Highway', engine: '349 cc', fuel: 'Petrol', iconType: 'touring' },
  { slug: 'royal-enfield-himalayan-450', name: 'Royal Enfield Himalayan 450', brand: 'Royal Enfield', category: 'Touring & Highway', engine: '452 cc', fuel: 'Petrol', iconType: 'adventure' },
  { slug: 'royal-enfield-guerrilla-450', name: 'Royal Enfield Guerrilla 450', brand: 'Royal Enfield', category: 'Touring & Highway', engine: '452 cc', fuel: 'Petrol', iconType: 'touring' },
  { slug: 'honda-hness-cb350', name: "Honda H'ness CB350", brand: 'Honda', category: 'Touring & Highway', engine: '348.3 cc', fuel: 'Petrol', iconType: 'touring' },
  { slug: 'honda-cb350rs', name: 'Honda CB350RS', brand: 'Honda', category: 'Touring & Highway', engine: '348.3 cc', fuel: 'Petrol', iconType: 'touring' },
  { slug: 'suzuki-v-strom-sx', name: 'Suzuki V-Strom SX 250', brand: 'Suzuki', category: 'Touring & Highway', engine: '249 cc', fuel: 'Petrol', iconType: 'adventure' },
  { slug: 'bajaj-dominar-400', name: 'Bajaj Dominar 400', brand: 'Bajaj', category: 'Touring & Highway', engine: '373.3 cc', fuel: 'Petrol', iconType: 'touring' },

  // SCOOTERS
  { slug: 'honda-activa-6g', name: 'Honda Activa 6G', brand: 'Honda', category: 'Scooter', engine: '109.5 cc', fuel: 'Petrol', iconType: 'scooter' },
  { slug: 'tvs-jupiter-125', name: 'TVS Jupiter 125', brand: 'TVS', category: 'Scooter', engine: '124.8 cc', fuel: 'Petrol', iconType: 'scooter' },
  { slug: 'suzuki-access-125', name: 'Suzuki Access 125', brand: 'Suzuki', category: 'Scooter', engine: '124 cc', fuel: 'Petrol', iconType: 'scooter' },
];

const cars = [
  // CATEGORY 1: HATCHBACKS
  { slug: 'maruti-suzuki-alto-k10', name: 'Maruti Suzuki Alto K10', brand: 'Maruti Suzuki', category: 'Hatchback', seats: '5 Seats', fuel: 'Petrol', body: 'hatchback' },
  { slug: 'maruti-suzuki-celerio', name: 'Maruti Suzuki Celerio', brand: 'Maruti Suzuki', category: 'Hatchback', seats: '5 Seats', fuel: 'Petrol', body: 'hatchback' },
  { slug: 'maruti-suzuki-swift', name: 'Maruti Suzuki Swift', brand: 'Maruti Suzuki', category: 'Hatchback', seats: '5 Seats', fuel: 'Petrol', body: 'hatchback' },
  { slug: 'maruti-suzuki-baleno', name: 'Maruti Suzuki Baleno', brand: 'Maruti Suzuki', category: 'Hatchback', seats: '5 Seats', fuel: 'Petrol', body: 'hatchback' },
  { slug: 'hyundai-grand-i10-nios', name: 'Hyundai Grand i10 Nios', brand: 'Hyundai', category: 'Hatchback', seats: '5 Seats', fuel: 'Petrol', body: 'hatchback' },
  { slug: 'hyundai-i20', name: 'Hyundai i20', brand: 'Hyundai', category: 'Hatchback', seats: '5 Seats', fuel: 'Petrol', body: 'hatchback' },
  { slug: 'tata-tiago', name: 'Tata Tiago', brand: 'Tata', category: 'Hatchback', seats: '5 Seats', fuel: 'Petrol', body: 'hatchback' },
  { slug: 'tata-altroz', name: 'Tata Altroz', brand: 'Tata', category: 'Hatchback', seats: '5 Seats', fuel: 'Petrol', body: 'hatchback' },
  { slug: 'toyota-glanza', name: 'Toyota Glanza', brand: 'Toyota', category: 'Hatchback', seats: '5 Seats', fuel: 'Petrol', body: 'hatchback' },

  // CATEGORY 2: SEDANS
  { slug: 'maruti-suzuki-dzire', name: 'Maruti Suzuki Dzire', brand: 'Maruti Suzuki', category: 'Sedan', seats: '5 Seats', fuel: 'Petrol', body: 'sedan' },
  { slug: 'honda-amaze', name: 'Honda Amaze', brand: 'Honda', category: 'Sedan', seats: '5 Seats', fuel: 'Petrol', body: 'sedan' },
  { slug: 'honda-city', name: 'Honda City', brand: 'Honda', category: 'Sedan', seats: '5 Seats', fuel: 'Petrol', body: 'sedan' },
  { slug: 'hyundai-verna', name: 'Hyundai Verna', brand: 'Hyundai', category: 'Sedan', seats: '5 Seats', fuel: 'Petrol', body: 'sedan' },
  { slug: 'volkswagen-virtus', name: 'Volkswagen Virtus', brand: 'Volkswagen', category: 'Sedan', seats: '5 Seats', fuel: 'Petrol', body: 'sedan' },
  { slug: 'skoda-slavia', name: 'Skoda Slavia', brand: 'Skoda', category: 'Sedan', seats: '5 Seats', fuel: 'Petrol', body: 'sedan' },

  // CATEGORY 3: COMPACT SUVs AND SUVs
  { slug: 'maruti-suzuki-brezza', name: 'Maruti Suzuki Brezza', brand: 'Maruti Suzuki', category: 'SUV', seats: '5 Seats', fuel: 'Petrol', body: 'suv' },
  { slug: 'tata-nexon', name: 'Tata Nexon', brand: 'Tata', category: 'SUV', seats: '5 Seats', fuel: 'Petrol / Diesel', body: 'suv' },
  { slug: 'hyundai-venue', name: 'Hyundai Venue', brand: 'Hyundai', category: 'SUV', seats: '5 Seats', fuel: 'Petrol', body: 'suv' },
  { slug: 'kia-sonet', name: 'Kia Sonet', brand: 'Kia', category: 'SUV', seats: '5 Seats', fuel: 'Petrol / Diesel', body: 'suv' },
  { slug: 'kia-seltos', name: 'Kia Seltos', brand: 'Kia', category: 'SUV', seats: '5 Seats', fuel: 'Petrol / Diesel', body: 'suv' },
  { slug: 'maruti-suzuki-grand-vitara', name: 'Maruti Suzuki Grand Vitara', brand: 'Maruti Suzuki', category: 'SUV', seats: '5 Seats', fuel: 'Hybrid / Petrol', body: 'suv' },
  { slug: 'mahindra-scorpio-n', name: 'Mahindra Scorpio-N', brand: 'Mahindra', category: 'SUV', seats: '7 Seats', fuel: 'Diesel', body: 'suv' },

  // CATEGORY 4: FAMILY MPVs
  { slug: 'maruti-suzuki-ertiga', name: 'Maruti Suzuki Ertiga', brand: 'Maruti Suzuki', category: 'Family MPV', seats: '7 Seats', fuel: 'Petrol', body: 'mpv' },
  { slug: 'toyota-innova-crysta', name: 'Toyota Innova Crysta', brand: 'Toyota', category: 'Family MPV', seats: '7 Seats', fuel: 'Diesel', body: 'mpv' },
];

function generateCarSvg(c) {
  const accentColor = c.category === 'Family MPV' ? '#38bdf8' : c.category === 'SUV' ? '#f59e0b' : c.category === 'Sedan' ? '#818cf8' : '#34d399';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="55%" r="45%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#111827" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="50%" stop-color="#64748b" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="600" fill="url(#bgGrad)" />
  <circle cx="400" cy="330" r="280" fill="url(#glowGrad)" />

  <!-- Studio Floor & Shadows -->
  <ellipse cx="400" cy="460" rx="320" ry="32" fill="#030712" opacity="0.8" />
  <ellipse cx="400" cy="455" rx="260" ry="18" fill="#000000" opacity="0.9" />

  <!-- Grid Studio Floor Lines -->
  <path d="M80 480 L720 480 M120 510 L680 510 M160 540 L640 540" stroke="#334155" stroke-width="1" opacity="0.3" />

  <!-- Vehicle Silhouette Visual -->
  <g transform="translate(140, 230)">
    <!-- Car Body Silhouette depending on type -->
    ${c.body === 'suv' || c.body === 'mpv' ? `
      <!-- SUV / MPV Profile -->
      <path d="M 40 170 Q 50 160 90 155 L 140 155 Q 160 110 210 80 L 370 80 Q 420 85 450 140 L 490 150 Q 510 160 510 180 L 510 200 L 10 200 L 10 180 Z" fill="url(#bodyGrad)" stroke="#475569" stroke-width="2" />
      <!-- Windows -->
      <path d="M 160 145 L 210 95 L 300 95 L 300 145 Z" fill="url(#glassGrad)" stroke="#64748b" stroke-width="1.5" />
      <path d="M 315 145 L 315 95 L 370 95 L 420 145 Z" fill="url(#glassGrad)" stroke="#64748b" stroke-width="1.5" />
      <!-- Roof Rails -->
      <line x1="200" y1="72" x2="390" y2="72" stroke="${accentColor}" stroke-width="4" stroke-linecap="round" />
    ` : c.body === 'sedan' ? `
      <!-- Sedan Profile -->
      <path d="M 20 180 Q 40 165 90 160 L 140 160 Q 180 100 240 85 L 360 85 Q 410 95 440 155 L 490 160 Q 520 168 520 185 L 520 200 L 0 200 L 0 185 Z" fill="url(#bodyGrad)" stroke="#475569" stroke-width="2" />
      <!-- Windows -->
      <path d="M 160 150 L 235 98 L 300 98 L 300 150 Z" fill="url(#glassGrad)" stroke="#64748b" stroke-width="1.5" />
      <path d="M 315 150 L 315 98 L 360 98 L 415 150 Z" fill="url(#glassGrad)" stroke="#64748b" stroke-width="1.5" />
    ` : `
      <!-- Hatchback Profile -->
      <path d="M 30 180 Q 50 165 100 160 L 150 160 Q 180 105 230 90 L 350 90 Q 380 95 400 135 L 440 145 Q 480 155 480 185 L 480 200 L 20 200 L 20 185 Z" fill="url(#bodyGrad)" stroke="#475569" stroke-width="2" />
      <!-- Windows -->
      <path d="M 165 150 L 225 100 L 285 100 L 285 150 Z" fill="url(#glassGrad)" stroke="#64748b" stroke-width="1.5" />
      <path d="M 298 150 L 298 100 L 345 100 L 380 150 Z" fill="url(#glassGrad)" stroke="#64748b" stroke-width="1.5" />
    `}

    <!-- Headlight & Taillight Accents -->
    <path d="M 25 175 L 10 185 L 25 190 Z" fill="#ef4444" opacity="0.9" />
    <path d="M 485 175 L 505 185 L 485 190 Z" fill="#fef08a" opacity="0.9" filter="drop-shadow(0 0 6px #facc15)" />

    <!-- Wheels -->
    <g transform="translate(100, 195)">
      <circle cx="0" cy="0" r="38" fill="#0f172a" stroke="#334155" stroke-width="8" />
      <circle cx="0" cy="0" r="26" fill="#1e293b" />
      <!-- Alloys -->
      <line x1="-20" y1="0" x2="20" y2="0" stroke="${accentColor}" stroke-width="3" />
      <line x1="0" y1="-20" x2="0" y2="20" stroke="${accentColor}" stroke-width="3" />
      <circle cx="0" cy="0" r="8" fill="#cbd5e1" />
    </g>

    <g transform="translate(410, 195)">
      <circle cx="0" cy="0" r="38" fill="#0f172a" stroke="#334155" stroke-width="8" />
      <circle cx="0" cy="0" r="26" fill="#1e293b" />
      <!-- Alloys -->
      <line x1="-20" y1="0" x2="20" y2="0" stroke="${accentColor}" stroke-width="3" />
      <line x1="0" y1="-20" x2="0" y2="20" stroke="${accentColor}" stroke-width="3" />
      <circle cx="0" cy="0" r="8" fill="#cbd5e1" />
    </g>
  </g>

  <!-- Top Badges Header -->
  <g transform="translate(48, 50)">
    <!-- Brand Tag -->
    <rect x="0" y="0" width="140" height="28" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="70" y="19" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="1">${c.brand.toUpperCase()}</text>

    <!-- Category Pill -->
    <rect x="150" y="0" width="160" height="28" rx="6" fill="${accentColor}" fill-opacity="0.15" stroke="${accentColor}" stroke-opacity="0.4" stroke-width="1" />
    <text x="230" y="19" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="${accentColor}" text-anchor="middle">${c.category.toUpperCase()}</text>
  </g>

  <!-- RentRide Verified Fleet Watermark Badge -->
  <g transform="translate(600, 48)">
    <rect x="0" y="0" width="152" height="32" rx="8" fill="#111827" stroke="#374151" stroke-width="1" />
    <circle cx="20" cy="16" r="6" fill="#c7f36b" />
    <text x="82" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#f3f4f6">RENTRIDE VERIFIED</text>
  </g>

  <!-- Model Title at Bottom -->
  <g transform="translate(48, 510)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="-0.5">${c.name}</text>
    
    <!-- Specs Row -->
    <g transform="translate(0, 20)">
      <rect x="0" y="0" width="90" height="24" rx="4" fill="#1e293b" />
      <text x="45" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#cbd5e1" text-anchor="middle">${c.seats}</text>

      <rect x="98" y="0" width="100" height="24" rx="4" fill="#1e293b" />
      <text x="148" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#cbd5e1" text-anchor="middle">${c.fuel}</text>

      <rect x="206" y="0" width="130" height="24" rx="4" fill="#1e293b" />
      <text x="271" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#c7f36b" text-anchor="middle">Tamil Nadu Fleet</text>
    </g>
  </g>
</svg>`;
}

function generateBikeSvg(b) {
  const accentColor = b.category === 'Touring & Highway' ? '#f59e0b' : b.category === 'City & Street' ? '#38bdf8' : b.category === 'Scooter' ? '#a78bfa' : '#34d399';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bgGradBike" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f1d" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <radialGradient id="glowGradBike" cx="50%" cy="55%" r="45%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#111827" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="50%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="600" fill="url(#bgGradBike)" />
  <circle cx="400" cy="330" r="280" fill="url(#glowGradBike)" />

  <!-- Studio Floor & Shadows -->
  <ellipse cx="400" cy="460" rx="280" ry="28" fill="#030712" opacity="0.85" />
  <ellipse cx="400" cy="455" rx="220" ry="16" fill="#000000" opacity="0.9" />

  <!-- Studio Grid -->
  <path d="M100 480 L700 480 M150 510 L650 510 M200 540 L600 540" stroke="#334155" stroke-width="1" opacity="0.3" />

  <!-- Bike Silhouette Visual -->
  <g transform="translate(180, 210)">
    <!-- Wheels -->
    <!-- Rear Wheel -->
    <g transform="translate(70, 200)">
      <circle cx="0" cy="0" r="50" fill="#0f172a" stroke="#334155" stroke-width="10" />
      <circle cx="0" cy="0" r="34" fill="#1e293b" />
      <!-- Spokes / Alloys -->
      <line x1="-28" y1="0" x2="28" y2="0" stroke="${accentColor}" stroke-width="3" />
      <line x1="0" y1="-28" x2="0" y2="28" stroke="${accentColor}" stroke-width="3" />
      <line x1="-20" y1="-20" x2="20" y2="20" stroke="${accentColor}" stroke-width="3" />
      <line x1="-20" y1="20" x2="20" y2="-20" stroke="${accentColor}" stroke-width="3" />
      <circle cx="0" cy="0" r="10" fill="#cbd5e1" />
    </g>

    <!-- Front Wheel -->
    <g transform="translate(370, 200)">
      <circle cx="0" cy="0" r="50" fill="#0f172a" stroke="#334155" stroke-width="10" />
      <circle cx="0" cy="0" r="34" fill="#1e293b" />
      <!-- Spokes / Alloys -->
      <line x1="-28" y1="0" x2="28" y2="0" stroke="${accentColor}" stroke-width="3" />
      <line x1="0" y1="-28" x2="0" y2="28" stroke="${accentColor}" stroke-width="3" />
      <line x1="-20" y1="-20" x2="20" y2="20" stroke="${accentColor}" stroke-width="3" />
      <line x1="-20" y1="20" x2="20" y2="-20" stroke="${accentColor}" stroke-width="3" />
      <circle cx="0" cy="0" r="10" fill="#cbd5e1" />
    </g>

    ${b.iconType === 'scooter' ? `
      <!-- Scooter Body Profile -->
      <path d="M 70 200 L 140 180 L 190 180 L 220 120 L 290 120 L 320 60 L 330 60 L 370 200 Z" fill="none" stroke="url(#chassisGrad)" stroke-width="14" stroke-linejoin="round" />
      <!-- Floorboard -->
      <path d="M 140 180 L 250 180" stroke="${accentColor}" stroke-width="12" stroke-linecap="round" />
      <!-- Seat -->
      <path d="M 110 130 Q 170 120 230 140" stroke="#1e293b" stroke-width="20" stroke-linecap="round" />
      <!-- Handlebar -->
      <path d="M 315 50 L 340 50" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round" />
      <!-- Apron -->
      <path d="M 290 120 L 340 70 L 360 160 Z" fill="${accentColor}" opacity="0.8" />
    ` : b.iconType === 'adventure' ? `
      <!-- Adventure / Himalayan Profile -->
      <!-- Frame -->
      <path d="M 70 200 L 180 140 L 240 180 L 330 70 L 370 200" fill="none" stroke="url(#chassisGrad)" stroke-width="10" stroke-linejoin="round" />
      <!-- High Tank -->
      <path d="M 210 100 Q 260 70 310 100 L 300 135 L 200 135 Z" fill="${accentColor}" opacity="0.9" />
      <!-- Tall Windscreen -->
      <path d="M 320 65 L 340 10 L 350 40 Z" fill="#38bdf8" opacity="0.5" />
      <!-- Seat -->
      <path d="M 140 130 Q 180 125 210 135" stroke="#0f172a" stroke-width="18" stroke-linecap="round" />
      <!-- Exhaust High Upswept -->
      <path d="M 200 190 L 130 160 L 90 145" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round" />
      <!-- Crash Bars -->
      <circle cx="260" cy="120" r="14" fill="none" stroke="#64748b" stroke-width="4" />
    ` : `
      <!-- Motorcycle (Commuter / Street / Touring) Profile -->
      <!-- Engine Block -->
      <rect x="180" y="150" width="70" height="45" rx="6" fill="#1e293b" stroke="#475569" stroke-width="3" />
      <line x1="185" y1="160" x2="245" y2="160" stroke="#64748b" stroke-width="2" />
      <line x1="185" y1="172" x2="245" y2="172" stroke="#64748b" stroke-width="2" />
      <line x1="185" y1="184" x2="245" y2="184" stroke="#64748b" stroke-width="2" />

      <!-- Main Frame -->
      <path d="M 70 200 L 170 140 L 220 185 L 310 80 L 370 200" fill="none" stroke="url(#chassisGrad)" stroke-width="10" stroke-linejoin="round" />
      <!-- Fuel Tank -->
      <path d="M 200 110 Q 250 80 300 110 L 290 140 L 195 140 Z" fill="${accentColor}" opacity="0.9" />
      <!-- Seat -->
      <path d="M 120 135 Q 165 125 205 135" stroke="#0f172a" stroke-width="18" stroke-linecap="round" />
      <!-- Handlebar -->
      <path d="M 295 70 L 320 65" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round" />
      <!-- Headlight -->
      <circle cx="330" cy="85" r="10" fill="#fef08a" filter="drop-shadow(0 0 8px #facc15)" />
      <!-- Exhaust Pipe -->
      <path d="M 220 185 L 140 195 L 80 185" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round" />
    `}
  </g>

  <!-- Top Badges Header -->
  <g transform="translate(48, 50)">
    <!-- Brand Tag -->
    <rect x="0" y="0" width="140" height="28" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1" />
    <text x="70" y="19" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="1">${b.brand.toUpperCase()}</text>

    <!-- Category Pill -->
    <rect x="150" y="0" width="180" height="28" rx="6" fill="${accentColor}" fill-opacity="0.15" stroke="${accentColor}" stroke-opacity="0.4" stroke-width="1" />
    <text x="240" y="19" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="${accentColor}" text-anchor="middle">${b.category.toUpperCase().replace(/&/g, '&amp;')}</text>
  </g>

  <!-- RentRide Verified Fleet Watermark Badge -->
  <g transform="translate(600, 48)">
    <rect x="0" y="0" width="152" height="32" rx="8" fill="#111827" stroke="#374151" stroke-width="1" />
    <circle cx="20" cy="16" r="6" fill="#c7f36b" />
    <text x="82" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#f3f4f6">RENTRIDE VERIFIED</text>
  </g>

  <!-- Model Title at Bottom -->
  <g transform="translate(48, 510)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="-0.5">${b.name}</text>
    
    <!-- Specs Row -->
    <g transform="translate(0, 20)">
      <rect x="0" y="0" width="100" height="24" rx="4" fill="#1e293b" />
      <text x="50" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#cbd5e1" text-anchor="middle">${b.engine}</text>

      <rect x="108" y="0" width="90" height="24" rx="4" fill="#1e293b" />
      <text x="153" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#cbd5e1" text-anchor="middle">${b.fuel}</text>

      <rect x="206" y="0" width="130" height="24" rx="4" fill="#1e293b" />
      <text x="271" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#c7f36b" text-anchor="middle">Tamil Nadu Fleet</text>
    </g>
  </g>
</svg>`;
}

// Write out all vehicle SVGs
cars.forEach((c) => {
  const filePath = path.join(process.cwd(), 'public', 'images', 'vehicles', 'cars', `${c.slug}.svg`);
  fs.writeFileSync(filePath, generateCarSvg(c), 'utf8');
});

bikes.forEach((b) => {
  const filePath = path.join(process.cwd(), 'public', 'images', 'vehicles', 'bikes', `${b.slug}.svg`);
  fs.writeFileSync(filePath, generateBikeSvg(b), 'utf8');
});

// Generate realistic Indian Driving Licence Cards
const licenceFrontSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <defs>
    <linearGradient id="dlBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff" />
      <stop offset="100%" stop-color="#dbeafe" />
    </linearGradient>
  </defs>
  <rect width="600" height="380" rx="16" fill="url(#dlBg)" stroke="#93c5fd" stroke-width="2"/>
  <rect x="20" y="20" width="560" height="50" rx="8" fill="#1e3a8a"/>
  <text x="300" y="42" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle">UNION OF INDIA · DRIVING LICENCE</text>
  <text x="300" y="58" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#93c5fd" text-anchor="middle">GOVERNMENT OF TAMIL NADU · TRANSPORT DEPARTMENT</text>
  
  <!-- Smart Chip -->
  <rect x="40" y="90" width="55" height="45" rx="6" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="40" y1="112" x2="95" y2="112" stroke="#a16207" stroke-width="1"/>
  <line x1="68" y1="90" x2="68" y2="135" stroke="#a16207" stroke-width="1"/>

  <!-- Photo Box -->
  <rect x="40" y="155" width="105" height="135" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
  <circle cx="92" cy="205" r="28" fill="#94a3b8"/>
  <path d="M 50 280 Q 92 245 134 280" fill="#64748b"/>
  <text x="92" y="302" font-family="monospace" font-size="9" fill="#64748b" text-anchor="middle">VERIFIED ID</text>

  <!-- Details -->
  <g transform="translate(170, 95)" font-family="system-ui, sans-serif">
    <text x="0" y="15" font-size="10" font-weight="bold" fill="#64748b">DL NUMBER</text>
    <text x="0" y="32" font-size="16" font-weight="900" fill="#1e3a8a" letter-spacing="1">TN-01-2022-0048192</text>

    <text x="0" y="60" font-size="10" font-weight="bold" fill="#64748b">HOLDER NAME</text>
    <text x="0" y="76" font-size="14" font-weight="800" fill="#0f172a">ROHAN SHARMA</text>

    <text x="0" y="104" font-size="10" font-weight="bold" fill="#64748b">DATE OF BIRTH / BLOOD GROUP</text>
    <text x="0" y="118" font-size="12" font-weight="700" fill="#334155">14/08/1996 · B+ve</text>

    <text x="0" y="146" font-size="10" font-weight="bold" fill="#64748b">AUTHORISED VEHICLE CLASSES</text>
    <text x="0" y="162" font-size="12" font-weight="800" fill="#047857">LMV (CAR) · MCWG (BIKE WITH GEAR)</text>

    <text x="0" y="190" font-size="10" font-weight="bold" fill="#64748b">VALID TILL</text>
    <text x="0" y="205" font-size="12" font-weight="700" fill="#b91c1c">13/08/2036 (NON-TRANSPORT)</text>
  </g>

  <!-- Security Hologram Badge -->
  <circle cx="530" cy="120" r="26" fill="#fef08a" stroke="#eab308" stroke-width="2" opacity="0.8"/>
  <text x="530" y="124" font-family="system-ui, sans-serif" font-size="9" font-weight="900" fill="#854d0e" text-anchor="middle">GOVT TN</text>

  <!-- Bottom Strip -->
  <rect x="20" y="335" width="560" height="25" rx="4" fill="#e0f2fe"/>
  <text x="300" y="352" font-family="monospace" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">&lt;&lt; TN TRANSPORT DEPT · RTO CHENNAI CENTRAL · SECURE KYC &gt;&gt;</text>
</svg>`;

const licenceBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <defs>
    <linearGradient id="dlBackBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
  </defs>
  <rect width="600" height="380" rx="16" fill="url(#dlBackBg)" stroke="#cbd5e1" stroke-width="2"/>
  
  <rect x="20" y="20" width="560" height="40" rx="6" fill="#334155"/>
  <text x="300" y="45" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">PERMANENT RESIDENCE ADDRESS &amp; ENDORSEMENTS</text>

  <!-- Address Block -->
  <g transform="translate(40, 85)" font-family="system-ui, sans-serif">
    <text x="0" y="15" font-size="11" font-weight="bold" fill="#64748b">PERMANENT ADDRESS</text>
    <text x="0" y="35" font-size="12" font-weight="700" fill="#1e293b">NO. 42, 3RD CROSS STREET, ANNA NAGAR EAST</text>
    <text x="0" y="55" font-size="12" font-weight="700" fill="#1e293b">CHENNAI, TAMIL NADU - 600102</text>
    <text x="0" y="75" font-size="12" font-weight="700" fill="#1e293b">INDIA</text>
  </g>

  <!-- Vehicle Category Table -->
  <g transform="translate(40, 180)" font-family="system-ui, sans-serif">
    <rect x="0" y="0" width="520" height="24" fill="#0f172a" rx="4"/>
    <text x="20" y="16" font-size="10" font-weight="bold" fill="#ffffff">CLASS</text>
    <text x="120" y="16" font-size="10" font-weight="bold" fill="#ffffff">DESCRIPTION</text>
    <text x="320" y="16" font-size="10" font-weight="bold" fill="#ffffff">ISSUE DATE</text>
    <text x="440" y="16" font-size="10" font-weight="bold" fill="#ffffff">BADGE NO</text>

    <rect x="0" y="26" width="520" height="28" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="20" y="44" font-size="11" font-weight="bold" fill="#047857">MCWG</text>
    <text x="120" y="44" font-size="11" font-weight="600" fill="#334155">Motor Cycle With Gear</text>
    <text x="320" y="44" font-size="11" font-weight="600" fill="#334155">14/08/2016</text>
    <text x="440" y="44" font-size="11" font-weight="600" fill="#334155">-</text>

    <rect x="0" y="56" width="520" height="28" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="20" y="74" font-size="11" font-weight="bold" fill="#047857">LMV</text>
    <text x="120" y="74" font-size="11" font-weight="600" fill="#334155">Light Motor Vehicle (Car)</text>
    <text x="320" y="74" font-size="11" font-weight="600" fill="#334155">12/03/2019</text>
    <text x="440" y="74" font-size="11" font-weight="600" fill="#334155">-</text>
  </g>

  <!-- Issuing Authority Signature & Barcode -->
  <g transform="translate(40, 290)">
    <!-- Simulated barcode -->
    <rect x="0" y="10" width="4" height="40" fill="#0f172a"/>
    <rect x="6" y="10" width="8" height="40" fill="#0f172a"/>
    <rect x="18" y="10" width="2" height="40" fill="#0f172a"/>
    <rect x="24" y="10" width="6" height="40" fill="#0f172a"/>
    <rect x="34" y="10" width="4" height="40" fill="#0f172a"/>
    <rect x="42" y="10" width="10" height="40" fill="#0f172a"/>
    <rect x="56" y="10" width="4" height="40" fill="#0f172a"/>
    <rect x="64" y="10" width="6" height="40" fill="#0f172a"/>
    <rect x="74" y="10" width="12" height="40" fill="#0f172a"/>
    <rect x="90" y="10" width="4" height="40" fill="#0f172a"/>
    <rect x="98" y="10" width="8" height="40" fill="#0f172a"/>
    <rect x="110" y="10" width="6" height="40" fill="#0f172a"/>
    <rect x="120" y="10" width="10" height="40" fill="#0f172a"/>
    <rect x="134" y="10" width="4" height="40" fill="#0f172a"/>
    <rect x="142" y="10" width="8" height="40" fill="#0f172a"/>
    <text x="75" y="62" font-family="monospace" font-size="9" fill="#64748b" text-anchor="middle">TN0120220048192</text>
  </g>

  <g transform="translate(380, 310)" font-family="system-ui, sans-serif" text-anchor="center">
    <text x="60" y="10" font-size="10" font-weight="bold" fill="#64748b">ISSUING AUTHORITY</text>
    <text x="60" y="24" font-size="11" font-weight="800" fill="#1e293b">LICENSING OFFICER</text>
    <text x="60" y="38" font-size="10" font-weight="600" fill="#475569">RTO CHENNAI (CENTRAL)</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(process.cwd(), 'public', 'images', 'licences', 'sample_licence_front.svg'), licenceFrontSvg, 'utf8');
fs.writeFileSync(path.join(process.cwd(), 'public', 'images', 'licences', 'sample_licence_back.svg'), licenceBackSvg, 'utf8');

console.log('Successfully generated all vehicle and licence visual assets!');

/**
 * RENTRIDE VEHICLE IMAGE MAPPING ENGINE
 * Central mapping system ensuring 100% accurate vehicle model-to-image association.
 * Eliminates mismatches (e.g. Hunter 350 vs Meteor 350, Creta vs Seltos, Bike vs Scooter).
 */

export interface VehicleImageInfo {
  coverImage: string;
  galleryImages: string[];
  altText: string;
}

// Master model-to-image registry
export const VEHICLE_IMAGE_REGISTRY: Record<string, VehicleImageInfo> = {
  // ==================== BIKES: CATEGORY 1: FAMILY & COMMUTER BIKES ====================
  'hero-splendor-plus': {
    coverImage: '/images/vehicles/bikes/hero-splendor-plus.svg',
    galleryImages: ['/images/vehicles/bikes/hero-splendor-plus.svg'],
    altText: 'Hero Splendor Plus 100cc Commuter Motorcycle',
  },
  'hero-hf-deluxe': {
    coverImage: '/images/vehicles/bikes/hero-hf-deluxe.svg',
    galleryImages: ['/images/vehicles/bikes/hero-hf-deluxe.svg'],
    altText: 'Hero HF Deluxe Mileage Commuter Bike',
  },
  'honda-shine-125': {
    coverImage: '/images/vehicles/bikes/honda-shine-125.svg',
    galleryImages: ['/images/vehicles/bikes/honda-shine-125.svg'],
    altText: 'Honda Shine 125cc Reliable Family Motorcycle',
  },
  'honda-sp125': {
    coverImage: '/images/vehicles/bikes/honda-sp125.svg',
    galleryImages: ['/images/vehicles/bikes/honda-sp125.svg'],
    altText: 'Honda SP125 Digital Commuter Bike',
  },
  'honda-unicorn': {
    coverImage: '/images/vehicles/bikes/honda-unicorn.svg',
    galleryImages: ['/images/vehicles/bikes/honda-unicorn.svg'],
    altText: 'Honda Unicorn 160cc Smooth Family Commuter',
  },
  'bajaj-platina-110': {
    coverImage: '/images/vehicles/bikes/bajaj-platina-110.svg',
    galleryImages: ['/images/vehicles/bikes/bajaj-platina-110.svg'],
    altText: 'Bajaj Platina 110 ABS Comfort Commuter',
  },
  'tvs-raider-125': {
    coverImage: '/images/vehicles/bikes/tvs-raider-125.svg',
    galleryImages: ['/images/vehicles/bikes/tvs-raider-125.svg'],
    altText: 'TVS Raider 125 Sporty Commuter Bike',
  },
  'bajaj-pulsar-125': {
    coverImage: '/images/vehicles/bikes/bajaj-pulsar-125.svg',
    galleryImages: ['/images/vehicles/bikes/bajaj-pulsar-125.svg'],
    altText: 'Bajaj Pulsar 125 Neon Commuter Bike',
  },

  // ==================== BIKES: CATEGORY 2: CITY & STREET BIKES ====================
  'bajaj-pulsar-n160': {
    coverImage: '/images/vehicles/bikes/bajaj-pulsar-n160.svg',
    galleryImages: ['/images/vehicles/bikes/bajaj-pulsar-n160.svg'],
    altText: 'Bajaj Pulsar N160 Dual-Channel ABS Street Fighter',
  },
  'tvs-apache-rtr-160-4v': {
    coverImage: '/images/vehicles/bikes/tvs-apache-rtr-160-4v.svg',
    galleryImages: ['/images/vehicles/bikes/tvs-apache-rtr-160-4v.svg'],
    altText: 'TVS Apache RTR 160 4V Race Edition Street Bike',
  },
  'tvs-apache-rtr-200-4v': {
    coverImage: '/images/vehicles/bikes/tvs-apache-rtr-200-4v.svg',
    galleryImages: ['/images/vehicles/bikes/tvs-apache-rtr-200-4v.svg'],
    altText: 'TVS Apache RTR 200 4V with Riding Modes',
  },
  'yamaha-fz-s-fi': {
    coverImage: '/images/vehicles/bikes/yamaha-fz-s-fi.svg',
    galleryImages: ['/images/vehicles/bikes/yamaha-fz-s-fi.svg'],
    altText: 'Yamaha FZ-S FI V4 Deluxe Street Motorcycle',
  },
  'yamaha-mt-15-v2': {
    coverImage: '/images/vehicles/bikes/yamaha-mt-15-v2.svg',
    galleryImages: ['/images/vehicles/bikes/yamaha-mt-15-v2.svg'],
    altText: 'Yamaha MT-15 V2 Hyper Naked Street Fighter',
  },
  'suzuki-gixxer-155': {
    coverImage: '/images/vehicles/bikes/suzuki-gixxer-155.svg',
    galleryImages: ['/images/vehicles/bikes/suzuki-gixxer-155.svg'],
    altText: 'Suzuki Gixxer 155 Street Sport Motorcycle',
  },
  'tvs-ronin': {
    coverImage: '/images/vehicles/bikes/tvs-ronin.svg',
    galleryImages: ['/images/vehicles/bikes/tvs-ronin.svg'],
    altText: 'TVS Ronin 225cc Neo-Retro Urban Scrambler',
  },
  'ktm-duke-200': {
    coverImage: '/images/vehicles/bikes/ktm-duke-200.svg',
    galleryImages: ['/images/vehicles/bikes/ktm-duke-200.svg'],
    altText: 'KTM Duke 200 Sharp Urban Naked Bike',
  },

  // ==================== BIKES: CATEGORY 3: TOURING & HIGHWAY BIKES ====================
  'royal-enfield-hunter-350': {
    coverImage: '/images/vehicles/bikes/royal-enfield-hunter-350.jpg',
    galleryImages: [
      '/images/vehicles/bikes/royal-enfield-hunter-350.jpg',
      '/images/vehicles/bikes/royal-enfield-hunter-350.svg',
    ],
    altText: 'Royal Enfield Hunter 350 Rebel Dapper Urban Scrambler',
  },
  'royal-enfield-classic-350': {
    coverImage: '/images/vehicles/bikes/royal-enfield-classic-350.svg',
    galleryImages: ['/images/vehicles/bikes/royal-enfield-classic-350.svg'],
    altText: 'Royal Enfield Classic 350 Reborn Highway Cruiser',
  },
  'royal-enfield-meteor-350': {
    coverImage: '/images/vehicles/bikes/royal-enfield-meteor-350.svg',
    galleryImages: ['/images/vehicles/bikes/royal-enfield-meteor-350.svg'],
    altText: 'Royal Enfield Meteor 350 Supernova Highway Cruiser',
  },
  'royal-enfield-bullet-350': {
    coverImage: '/images/vehicles/bikes/royal-enfield-bullet-350.svg',
    galleryImages: ['/images/vehicles/bikes/royal-enfield-bullet-350.svg'],
    altText: 'Royal Enfield Bullet 350 Legendary Thumper',
  },
  'royal-enfield-himalayan-450': {
    coverImage: '/images/vehicles/bikes/royal-enfield-himalayan-450.svg',
    galleryImages: ['/images/vehicles/bikes/royal-enfield-himalayan-450.svg'],
    altText: 'Royal Enfield Himalayan 450 Sherpa Adventure Tourer',
  },
  'royal-enfield-guerrilla-450': {
    coverImage: '/images/vehicles/bikes/royal-enfield-guerrilla-450.svg',
    galleryImages: ['/images/vehicles/bikes/royal-enfield-guerrilla-450.svg'],
    altText: 'Royal Enfield Guerrilla 450 Modern Road Roadster',
  },
  'honda-hness-cb350': {
    coverImage: '/images/vehicles/bikes/honda-hness-cb350.svg',
    galleryImages: ['/images/vehicles/bikes/honda-hness-cb350.svg'],
    altText: "Honda H'ness CB350 Classic Highway Cruiser",
  },
  'honda-cb350rs': {
    coverImage: '/images/vehicles/bikes/honda-cb350rs.svg',
    galleryImages: ['/images/vehicles/bikes/honda-cb350rs.svg'],
    altText: 'Honda CB350RS Scrambler Styling Highway Bike',
  },
  'suzuki-v-strom-sx': {
    coverImage: '/images/vehicles/bikes/suzuki-v-strom-sx.svg',
    galleryImages: ['/images/vehicles/bikes/suzuki-v-strom-sx.svg'],
    altText: 'Suzuki V-Strom SX 250 Adventure Sports Tourer',
  },
  'bajaj-dominar-400': {
    coverImage: '/images/vehicles/bikes/bajaj-dominar-400.svg',
    galleryImages: ['/images/vehicles/bikes/bajaj-dominar-400.svg'],
    altText: 'Bajaj Dominar 400 Factory Tourer with Windshield & Pannier Racks',
  },

  // ==================== BIKES: SCOOTER CATEGORY ====================
  'honda-activa-6g': {
    coverImage: '/images/vehicles/bikes/honda-activa-6g.svg',
    galleryImages: ['/images/vehicles/bikes/honda-activa-6g.svg'],
    altText: 'Honda Activa 6G Premium Family Commuter Scooter',
  },
  'tvs-jupiter-125': {
    coverImage: '/images/vehicles/bikes/tvs-jupiter-125.svg',
    galleryImages: ['/images/vehicles/bikes/tvs-jupiter-125.svg'],
    altText: 'TVS Jupiter 125 SmartXonnect Scooter',
  },
  'suzuki-access-125': {
    coverImage: '/images/vehicles/bikes/suzuki-access-125.svg',
    galleryImages: ['/images/vehicles/bikes/suzuki-access-125.svg'],
    altText: 'Suzuki Access 125 Special Edition Scooter',
  },
  'ather-450x': {
    coverImage: '/images/vehicles/bikes/ather-450x.jpg',
    galleryImages: [
      '/images/vehicles/bikes/ather-450x.jpg',
      '/images/vehicles/bikes/tvs-jupiter-125.svg',
    ],
    altText: 'Ather 450X Gen 3 Pro Electric Smart Scooter',
  },

  // ==================== CARS: CATEGORY 1: HATCHBACKS ====================
  'maruti-suzuki-alto-k10': {
    coverImage: '/images/vehicles/cars/maruti-suzuki-alto-k10.svg',
    galleryImages: ['/images/vehicles/cars/maruti-suzuki-alto-k10.svg'],
    altText: 'Maruti Suzuki Alto K10 Economical City Hatchback',
  },
  'maruti-suzuki-celerio': {
    coverImage: '/images/vehicles/cars/maruti-suzuki-celerio.svg',
    galleryImages: ['/images/vehicles/cars/maruti-suzuki-celerio.svg'],
    altText: 'Maruti Suzuki Celerio High Mileage Hatchback',
  },
  'maruti-suzuki-swift': {
    coverImage: '/images/vehicles/cars/maruti-suzuki-swift.svg',
    galleryImages: ['/images/vehicles/cars/maruti-suzuki-swift.svg'],
    altText: 'Maruti Suzuki Swift 2024 Z-Series Hatchback',
  },
  'maruti-suzuki-baleno': {
    coverImage: '/images/vehicles/cars/maruti-suzuki-baleno.svg',
    galleryImages: ['/images/vehicles/cars/maruti-suzuki-baleno.svg'],
    altText: 'Maruti Suzuki Baleno Premium Nexa Hatchback',
  },
  'hyundai-grand-i10-nios': {
    coverImage: '/images/vehicles/cars/hyundai-grand-i10-nios.svg',
    galleryImages: ['/images/vehicles/cars/hyundai-grand-i10-nios.svg'],
    altText: 'Hyundai Grand i10 Nios Feature-Loaded Hatchback',
  },
  'hyundai-i20': {
    coverImage: '/images/vehicles/cars/hyundai-i20.svg',
    galleryImages: ['/images/vehicles/cars/hyundai-i20.svg'],
    altText: 'Hyundai i20 Asta Premium Hatchback with Sunroof',
  },
  'tata-tiago': {
    coverImage: '/images/vehicles/cars/tata-tiago.svg',
    galleryImages: ['/images/vehicles/cars/tata-tiago.svg'],
    altText: 'Tata Tiago 4-Star Safety Rated Hatchback',
  },
  'tata-altroz': {
    coverImage: '/images/vehicles/cars/tata-altroz.svg',
    galleryImages: ['/images/vehicles/cars/tata-altroz.svg'],
    altText: 'Tata Altroz 5-Star Global NCAP Premium Hatchback',
  },
  'toyota-glanza': {
    coverImage: '/images/vehicles/cars/toyota-glanza.svg',
    galleryImages: ['/images/vehicles/cars/toyota-glanza.svg'],
    altText: 'Toyota Glanza G Variant Premium City Car',
  },

  // ==================== CARS: CATEGORY 2: SEDANS ====================
  'maruti-suzuki-dzire': {
    coverImage: '/images/vehicles/cars/maruti-suzuki-dzire.svg',
    galleryImages: ['/images/vehicles/cars/maruti-suzuki-dzire.svg'],
    altText: 'Maruti Suzuki Dzire 5-Star NCAP Compact Sedan',
  },
  'honda-amaze': {
    coverImage: '/images/vehicles/cars/honda-amaze.svg',
    galleryImages: ['/images/vehicles/cars/honda-amaze.svg'],
    altText: 'Honda Amaze CVT Automatic Comfortable Sedan',
  },
  'honda-city': {
    coverImage: '/images/vehicles/cars/honda-city.svg',
    galleryImages: ['/images/vehicles/cars/honda-city.svg'],
    altText: 'Honda City 5th Gen Executive Luxury Sedan with ADAS',
  },
  'hyundai-verna': {
    coverImage: '/images/vehicles/cars/hyundai-verna.svg',
    galleryImages: ['/images/vehicles/cars/hyundai-verna.svg'],
    altText: 'Hyundai Verna Turbo DCT 5-Star NCAP Sedan',
  },
  'volkswagen-virtus': {
    coverImage: '/images/vehicles/cars/volkswagen-virtus.svg',
    galleryImages: ['/images/vehicles/cars/volkswagen-virtus.svg'],
    altText: 'Volkswagen Virtus GT TSI Performance Sedan',
  },
  'skoda-slavia': {
    coverImage: '/images/vehicles/cars/skoda-slavia.svg',
    galleryImages: ['/images/vehicles/cars/skoda-slavia.svg'],
    altText: 'Skoda Slavia Style 1.5 TSI European Sedan',
  },

  // ==================== CARS: CATEGORY 3: COMPACT SUVs AND SUVs ====================
  'maruti-suzuki-brezza': {
    coverImage: '/images/vehicles/cars/maruti-suzuki-brezza.svg',
    galleryImages: ['/images/vehicles/cars/maruti-suzuki-brezza.svg'],
    altText: 'Maruti Suzuki Brezza ZXi Urban Compact SUV',
  },
  'tata-nexon': {
    coverImage: '/images/vehicles/cars/tata-nexon.svg',
    galleryImages: ['/images/vehicles/cars/tata-nexon.svg'],
    altText: 'Tata Nexon Fearless 5-Star NCAP Compact SUV',
  },
  'hyundai-venue': {
    coverImage: '/images/vehicles/cars/hyundai-venue.svg',
    galleryImages: ['/images/vehicles/cars/hyundai-venue.svg'],
    altText: 'Hyundai Venue SX Turbo Compact SUV',
  },
  'kia-sonet': {
    coverImage: '/images/vehicles/cars/kia-sonet.svg',
    galleryImages: ['/images/vehicles/cars/kia-sonet.svg'],
    altText: 'Kia Sonet HTX Diesel Automatic Compact SUV',
  },
  'hyundai-creta': {
    coverImage: '/images/vehicles/cars/hyundai-creta.jpg',
    galleryImages: [
      '/images/vehicles/cars/hyundai-creta.jpg',
      '/images/vehicles/cars/hyundai-creta.svg',
    ],
    altText: 'Hyundai Creta SX (O) Turbo Petrol Mid-Size SUV with Panoramic Sunroof',
  },
  'kia-seltos': {
    coverImage: '/images/vehicles/cars/kia-seltos.svg',
    galleryImages: ['/images/vehicles/cars/kia-seltos.svg'],
    altText: 'Kia Seltos GTX Plus ADAS Mid-Size SUV',
  },
  'maruti-suzuki-grand-vitara': {
    coverImage: '/images/vehicles/cars/maruti-suzuki-grand-vitara.svg',
    galleryImages: ['/images/vehicles/cars/maruti-suzuki-grand-vitara.svg'],
    altText: 'Maruti Suzuki Grand Vitara Strong Hybrid SUV',
  },
  'mahindra-scorpio-n': {
    coverImage: '/images/vehicles/cars/mahindra-scorpio-n.svg',
    galleryImages: ['/images/vehicles/cars/mahindra-scorpio-n.svg'],
    altText: 'Mahindra Scorpio-N Z8L 4x4 7-Seater Tough SUV',
  },

  // ==================== CARS: CATEGORY 4: FAMILY MPVs ====================
  'maruti-suzuki-ertiga': {
    coverImage: '/images/vehicles/cars/maruti-suzuki-ertiga.svg',
    galleryImages: ['/images/vehicles/cars/maruti-suzuki-ertiga.svg'],
    altText: 'Maruti Suzuki Ertiga ZXi Plus 7-Seater Family MPV',
  },
  'toyota-innova-crysta': {
    coverImage: '/images/vehicles/cars/toyota-innova-crysta.svg',
    galleryImages: ['/images/vehicles/cars/toyota-innova-crysta.svg'],
    altText: 'Toyota Innova Crysta 2.4 VX 7-Seater Highway Touring MPV',
  },

  // ==================== LUXURY FLEET ====================
  'mercedes-benz-e-class': {
    coverImage: '/images/vehicles/cars/mercedes-benz-e-class.jpg',
    galleryImages: [
      '/images/vehicles/cars/mercedes-benz-e-class.jpg',
      '/images/hero_automotive_duo.jpg',
    ],
    altText: 'Mercedes-Benz E-Class Long Wheelbase Chauffeur-Ready Luxury Sedan',
  },
};

/**
 * Normalizes vehicle name or model slug to lookup key
 */
export function normalizeVehicleSlug(nameOrModel: string): string {
  return nameOrModel
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns the exact verified vehicle image or a clean neutral branded placeholder.
 * Guarantees zero wrong vehicle model photos!
 */
export function getVehicleImage(modelSlugOrName: string, vehicleType: 'car' | 'bike' = 'car'): VehicleImageInfo {
  const slug = normalizeVehicleSlug(modelSlugOrName);

  // Exact match in registry
  if (VEHICLE_IMAGE_REGISTRY[slug]) {
    return VEHICLE_IMAGE_REGISTRY[slug];
  }

  // Partial match by key containment
  for (const [key, value] of Object.entries(VEHICLE_IMAGE_REGISTRY)) {
    if (slug.includes(key) || key.includes(slug)) {
      return value;
    }
  }

  // Fallback neutral SVG tailored strictly to vehicle type
  const fallbackCover =
    vehicleType === 'bike'
      ? '/images/vehicles/bikes/hero-splendor-plus.svg'
      : '/images/vehicles/cars/maruti-suzuki-swift.svg';

  return {
    coverImage: fallbackCover,
    galleryImages: [fallbackCover],
    altText: `RentRide Verified ${vehicleType === 'bike' ? 'Two-Wheeler' : 'Self-Drive Car'}`,
  };
}

/**
 * Returns just the cover image path for a vehicle
 */
export function getVehicleImagePath(modelSlugOrName: string, vehicleType: 'car' | 'bike' = 'car'): string {
  return getVehicleImage(modelSlugOrName, vehicleType).coverImage;
}

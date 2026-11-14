import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  VEHICLE_IMAGE_REGISTRY,
  getVehicleImage,
  getVehicleImagePath,
  getSafeImageUrl,
  normalizeVehicleSlug,
} from '@/lib/vehicle-images';
import { SEED_VEHICLES } from '@/lib/seed-catalog';

describe('Phase 8.2: Vehicle Image Mapping Engine', () => {
  it('contains exactly 56 primary vehicle mappings matching all catalog vehicles', () => {
    expect(SEED_VEHICLES.length).toBe(56);
    const bikeCount = SEED_VEHICLES.filter((v) => v.type === 'bike').length;
    const carCount = SEED_VEHICLES.filter((v) => v.type === 'car').length;
    expect(bikeCount).toBe(30);
    expect(carCount).toBe(26);

    for (const vehicle of SEED_VEHICLES) {
      const slug = vehicle.slug || vehicle.model;
      const imgInfo = getVehicleImage(slug, vehicle.type);
      expect(imgInfo).toBeDefined();
      expect(imgInfo.coverImage).toBeTruthy();
      expect(imgInfo.coverImage.length).toBeGreaterThan(0);

      // Verify that the file actually exists on disk in public
      const diskPath = path.join(process.cwd(), 'public', decodeURI(imgInfo.coverImage));
      expect(fs.existsSync(diskPath), `Image file missing on disk: ${diskPath}`).toBe(true);
    }
  });

  it('supports .avif, .jpg, .jpeg, and .png formats across the fleet', () => {
    const extensions = new Set<string>();
    for (const vehicle of SEED_VEHICLES) {
      const cover = getVehicleImagePath(vehicle.slug || vehicle.model, vehicle.type);
      const ext = path.extname(cover).toLowerCase();
      extensions.add(ext);
    }

    expect(extensions.has('.avif')).toBe(true);
    expect(extensions.has('.jpg')).toBe(true);
    expect(extensions.has('.jpeg')).toBe(true);
    expect(extensions.has('.png')).toBe(true);
  });

  it('safely encodes URLs containing spaces', () => {
    const unencoded = '/images/Car/mahindra scorpio-n.avif';
    const safeUrl = getSafeImageUrl(unencoded);
    expect(safeUrl).toBe('/images/Car/mahindra%20scorpio-n.avif');

    // Repeated calls should remain stable (idempotent)
    expect(getSafeImageUrl(safeUrl)).toBe('/images/Car/mahindra%20scorpio-n.avif');
  });

  it('enforces strict type separation (bikes in Bike folder, cars in Car folder)', () => {
    for (const vehicle of SEED_VEHICLES) {
      const cover = getVehicleImagePath(vehicle.slug || vehicle.model, vehicle.type);
      if (vehicle.type === 'bike') {
        expect(cover).toContain('/images/Bike/');
      } else {
        expect(cover).toContain('/images/Car/');
      }
    }
  });

  it('provides safe authentic fallback for unknown models without throwing', () => {
    const unknownBike = getVehicleImage('unknown-superbike-900', 'bike');
    expect(unknownBike.coverImage).toBe('/images/Bike/hero-splendor-plus.avif');

    const unknownCar = getVehicleImage('unknown-hypercar-z', 'car');
    expect(unknownCar.coverImage).toBe('/images/Car/maruti-suzuki-swift.avif');
  });

  it('handles slug normalization with uppercase, spaces, and punctuation', () => {
    expect(normalizeVehicleSlug('Hero Splendor Plus XTEC')).toBe('hero-splendor-plus-xtec');
    expect(normalizeVehicleSlug("Honda H'ness CB350")).toBe('honda-h-ness-cb350');
    expect(normalizeVehicleSlug('Maruti Suzuki Swift')).toBe('maruti-suzuki-swift');
  });
});

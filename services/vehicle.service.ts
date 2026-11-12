/**
 * VEHICLE SERVICE
 * Manages fleet querying, filtering, details, and CRUD operations via Supabase PostgreSQL.
 */

import { Vehicle, VehicleType, VehicleCategory } from '@/types/vehicle';
import { TN_CITIES } from '@/lib/tn-locations';
import { SEED_VEHICLES } from '@/lib/seed-catalog';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { mapVehicleFromDb, mapVehicleToDb } from '@/lib/supabase/mappers';
import type { SupabaseClient } from '@supabase/supabase-js';

function resolveClient(client?: SupabaseClient): SupabaseClient {
  if (client) return client;
  return createClient();
}

function resolveAdminClient(client?: SupabaseClient): SupabaseClient {
  if (client) return client;
  if (typeof window === 'undefined' && isAdminConfigured()) {
    return createAdminClient();
  }
  return createClient();
}

export class VehicleService {
  /**
   * Retrieves vehicles, filtered by type, category, city/location, price, availability, search, and pagination.
   */
  static async getVehicles(
    filters?: {
      type?: 'all' | VehicleType;
      category?: VehicleCategory | string;
      locationId?: string;
      cityId?: string;
      maxPrice?: number;
      onlyAvailable?: boolean;
      searchQuery?: string;
      brand?: string;
      fuelType?: string;
      transmission?: string;
      minRating?: number;
      includeInactive?: boolean;
      sortBy?: 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc' | 'rating' | 'name_asc';
      page?: number;
      limit?: number;
    },
    client?: SupabaseClient
  ): Promise<{ vehicles: Vehicle[]; total: number }> {
    if (isSupabaseConfigured()) {
      const supabase = resolveClient(client);
      let query = supabase.from('vehicles').select('*');

      if (!filters?.includeInactive) {
        query = query.eq('is_active', true);
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.locationId) {
        query = query.eq('location_id', filters.locationId);
      }
      if (filters?.onlyAvailable) {
        query = query.eq('status', 'available');
      }

      if (filters?.sortBy === 'price_asc') {
        query = query.order('price_per_day', { ascending: true });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('price_per_day', { ascending: false });
      } else if (filters?.sortBy === 'name_asc') {
        query = query.order('name', { ascending: true });
      } else {
        query = query.order('rating', { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message || 'Failed to fetch vehicles from database.');
      }

      let mapped = (data || []).map(mapVehicleFromDb);

      if (filters?.cityId && filters.cityId !== 'all') {
        const cityObj = TN_CITIES.find(
          (c) => c.id.toLowerCase() === filters.cityId!.toLowerCase() || c.name.toLowerCase() === filters.cityId!.toLowerCase()
        );
        const cityMatch = (cityObj?.name || filters.cityId).toLowerCase();
        mapped = mapped.filter(
          (v) =>
            v.location.toLowerCase().includes(cityMatch) ||
            (v.pickupLocationId && v.pickupLocationId.toLowerCase().includes(filters.cityId!.slice(0, 3).toLowerCase()))
        );
      }

      if (filters?.brand && filters.brand !== 'all') {
        mapped = mapped.filter((v) => v.brand.toLowerCase() === filters.brand!.toLowerCase());
      }
      if (filters?.fuelType && filters.fuelType !== 'all') {
        mapped = mapped.filter((v) => v.fuelType.toLowerCase() === filters.fuelType!.toLowerCase());
      }
      if (filters?.transmission && filters.transmission !== 'all') {
        mapped = mapped.filter((v) => v.transmission.toLowerCase() === filters.transmission!.toLowerCase());
      }
      if (filters?.minRating && filters.minRating > 0) {
        mapped = mapped.filter((v) => v.rating >= filters.minRating!);
      }
      if (filters?.maxPrice && filters.maxPrice > 0) {
        mapped = mapped.filter((v) => v.pricePerDay <= filters.maxPrice!);
      }
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        mapped = mapped.filter((v) =>
          `${v.name} ${v.brand} ${v.model} ${v.category} ${v.location} ${v.registrationNumber}`
            .toLowerCase()
            .includes(q)
        );
      }

      if (filters?.sortBy === 'recommended' || !filters?.sortBy) {
        mapped.sort((a, b) => {
          if (a.status === 'available' && b.status !== 'available') return -1;
          if (b.status === 'available' && a.status !== 'available') return 1;
          return b.rating - a.rating;
        });
      }

      const total = mapped.length;

      if (filters?.page && filters?.limit && filters.limit > 0) {
        const start = (filters.page - 1) * filters.limit;
        mapped = mapped.slice(start, start + filters.limit);
      }

      return { vehicles: mapped, total };
    }

    // Offline local fallback ONLY when Supabase credentials are not present
    let fallback = SEED_VEHICLES.filter((v) => {
      if (filters?.type && filters.type !== 'all' && v.type !== filters.type) return false;
      if (filters?.category && filters.category !== 'all' && v.category !== filters.category) return false;
      if (filters?.onlyAvailable && v.status !== 'available') return false;
      return true;
    });
    const total = fallback.length;
    if (filters?.page && filters?.limit && filters.limit > 0) {
      const start = (filters.page - 1) * filters.limit;
      fallback = fallback.slice(start, start + filters.limit);
    }
    return { vehicles: fallback, total };
  }

  /**
   * Retrieves single vehicle by ID or slug
   */
  static async getVehicleById(idOrSlug: string, client?: SupabaseClient): Promise<Vehicle | undefined> {
    if (isSupabaseConfigured()) {
      const supabase = resolveClient(client);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .maybeSingle();

      if (error || !data) {
        return undefined;
      }

      const mapped = mapVehicleFromDb(data);

      // Hydrate any extra gallery images from public.vehicle_images
      const { data: galleryRows } = await supabase
        .from('vehicle_images')
        .select('image_url')
        .eq('vehicle_id', data.id)
        .order('display_order', { ascending: true });

      if (galleryRows && galleryRows.length > 0) {
        const urls = galleryRows.map((r: any) => r.image_url).filter(Boolean);
        if (urls.length > 0) {
          mapped.images = Array.from(new Set([mapped.coverImage, ...urls]));
        }
      }

      return mapped;
    }

    return SEED_VEHICLES.find((v) => v.id === idOrSlug || v.slug === idOrSlug);
  }

  /**
   * Admin: Add new vehicle
   */
  static async createVehicle(vehicleData: Omit<Vehicle, 'id'>, client?: SupabaseClient): Promise<Vehicle> {
    const newId = `veh-${vehicleData.type === 'bike' ? 'bk' : 'cr'}-${Date.now().toString().slice(-4)}`;
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: newId,
      slug: vehicleData.slug || `${vehicleData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${newId.slice(-4)}`,
    };

    if (isSupabaseConfigured()) {
      const supabase = resolveAdminClient(client);
      const dbRow = mapVehicleToDb(newVehicle);
      const { data, error } = await supabase.from('vehicles').insert([dbRow]).select().single();
      if (error) {
        console.error('Supabase createVehicle error:', error);
        throw new Error(error.message);
      }
      return data ? mapVehicleFromDb(data) : newVehicle;
    }

    return newVehicle;
  }

  /**
   * Admin: Update vehicle details, pricing, status
   */
  static async updateVehicle(id: string, updates: Partial<Vehicle>, client?: SupabaseClient): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = resolveAdminClient(client);
      const dbRow = mapVehicleToDb(updates);
      const { error } = await supabase.from('vehicles').update(dbRow).eq('id', id);
      if (error) {
        console.error('Supabase updateVehicle error:', error);
        throw new Error(error.message);
      }
      return true;
    }
    return true;
  }

  /**
   * Admin: Soft delete / archive vehicle
   */
  static async deleteVehicle(id: string, client?: SupabaseClient): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const supabase = resolveAdminClient(client);
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: false, status: 'inactive' })
        .eq('id', id);
      if (error) {
        console.error('Supabase deleteVehicle error:', error);
        throw new Error(error.message);
      }
      return true;
    }
    return true;
  }
}

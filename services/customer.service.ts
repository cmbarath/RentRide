/**
 * CUSTOMER SERVICE
 * Manages customer profiles, driving licence KYC uploads, and customer statistics via Supabase.
 */

import { Customer } from '@/types/customer';
import { LicenceVerificationStatus } from '@/types/booking';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { mapCustomerFromDb } from '@/lib/supabase/mappers';
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

export class CustomerService {
  /**
   * Retrieves all customers for Admin management
   */
  static async getCustomers(client?: SupabaseClient): Promise<Customer[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = resolveAdminClient(client);
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(mapCustomerFromDb);
        }
      } catch (err) {
        console.warn('Supabase getCustomers fallback:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rr_customers_v2') || localStorage.getItem('rr_customers');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }

    return [];
  }

  /**
   * Updates customer driving licence verification status (Admin action)
   */
  static async updateLicenceStatus(
    customerId: string,
    status: LicenceVerificationStatus,
    reason?: string,
    client?: SupabaseClient
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = resolveAdminClient(client);
        await supabase
          .from('profiles')
          .update({ licence_verification_status: status })
          .eq('id', customerId);

        await supabase
          .from('driving_licences')
          .update({ status, rejection_reason: reason || null, verified_at: new Date().toISOString() })
          .eq('user_id', customerId);
      } catch (err) {
        console.warn('Supabase updateLicenceStatus fallback:', err);
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rr_customers_v2');
      if (saved) {
        try {
          const list: Customer[] = JSON.parse(saved);
          const updated = list.map((c) =>
            c.id === customerId
              ? { ...c, licenceStatus: status, rejectionReason: reason }
              : c
          );
          localStorage.setItem('rr_customers_v2', JSON.stringify(updated));
        } catch {}
      }
    }

    return true;
  }
}

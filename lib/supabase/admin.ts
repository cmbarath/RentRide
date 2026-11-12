import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export function isAdminConfigured(): boolean {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(secret && secret.length > 20);
}

// Server-side privileged admin client with Service Role / Secret Key
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yhjqudjqlevnngvxcece.supabase.co';
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseSecretKey) {
    console.warn('SUPABASE_SECRET_KEY is not configured in server environment.');
  }

  if (!adminClient) {
    adminClient = createSupabaseClient(supabaseUrl, supabaseSecretKey || 'placeholder-secret-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

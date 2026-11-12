import { createClient as createServerClient } from './server';
import { createAdminClient } from './admin';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthContext {
  user: User | null;
  role: 'anonymous' | 'customer' | 'admin' | 'fleet_manager';
  isAdmin: boolean;
  supabase: SupabaseClient;
}

/**
 * Resolves the authenticated user from the current request cookies (user-scoped SSR client)
 * or from the Authorization Bearer header if provided.
 * RLS is enforced automatically by PostgreSQL for all operations performed via this client.
 */
export async function getAuthContext(req?: NextRequest): Promise<AuthContext> {
  let supabase: SupabaseClient;
  const authHeader = req?.headers?.get('authorization');

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yhjqudjqlevnngvxcece.supabase.co';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'placeholder-anon-key';

    supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } else {
    supabase = await createServerClient();
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      role: 'anonymous',
      isAdmin: false,
      supabase,
    };
  }

  // Fetch role from public.profiles table using the user-scoped client.
  // RLS policy "Users can view own profile" permits auth.uid() = id.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as any) || 'customer';
  const isAdmin = role === 'admin' || role === 'fleet_manager';

  return {
    user,
    role,
    isAdmin,
    supabase,
  };
}

/**
 * Enforces that the request has an active authenticated user session.
 * Rejects with 401 Unauthorized if unauthenticated.
 */
export async function requireAuthUser(req?: NextRequest): Promise<
  | { success: true; user: User; role: string; isAdmin: boolean; supabase: SupabaseClient }
  | { success: false; response: NextResponse }
> {
  const ctx = await getAuthContext(req);
  if (!ctx.user) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }
  return { success: true, user: ctx.user, role: ctx.role, isAdmin: ctx.isAdmin, supabase: ctx.supabase };
}

/**
 * Enforces that the request is made by a verified administrator (admin or fleet_manager).
 * 1. Checks valid session cookies / bearer token (401 if unauthenticated).
 * 2. Checks trusted server-side profile role in public.profiles (403 if role != admin/fleet_manager).
 * Only after verification does it grant access to privileged actions.
 */
export async function requireAdminUser(req?: NextRequest): Promise<
  | { success: true; user: User; role: string; adminClient: SupabaseClient; userClient: SupabaseClient }
  | { success: false; response: NextResponse }
> {
  const ctx = await getAuthContext(req);
  if (!ctx.user) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator session required. Please log in.' },
        { status: 401 }
      ),
    };
  }

  if (!ctx.isAdmin) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Access denied. Fleet management or administrator privileges required.',
        },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    user: ctx.user,
    role: ctx.role,
    adminClient: createAdminClient(),
    userClient: ctx.supabase,
  };
}

/**
 * Records sensitive administrative actions into public.admin_audit_logs table.
 */
export async function recordAdminAuditLog(params: {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const adminClient = createAdminClient();
    await adminClient.from('admin_audit_logs').insert([
      {
        admin_id: params.adminId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        metadata: params.metadata || {},
      },
    ]);
  } catch (err) {
    console.warn('Failed to record admin audit log:', err);
  }
}

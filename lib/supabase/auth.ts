import { createClient, isSupabaseConfigured } from './client';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'fleet_manager';
  avatarUrl?: string;
  licenceStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  createdAt?: string;
}

function getCallbackUrl(nextPath: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

/**
 * Register a new customer via Supabase Auth.
 * Role is automatically enforced as 'customer' by the PostgreSQL signup trigger & RLS.
 */
export async function signUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}): Promise<{
  user?: User | null;
  session?: Session | null;
  requiresEmailConfirmation?: boolean;
  error?: string;
}> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        session: null,
        error: 'Supabase credentials are not configured yet in .env.local.',
      };
    }

    const normalizedEmail = params.email.trim().toLowerCase();
    const trimmedName = params.fullName.trim();
    const trimmedPhone = params.phone.trim();

    if (trimmedName.length < 2) {
      return { error: 'Please enter your full name (minimum 2 characters).' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { error: 'Please enter a valid email address.' };
    }
    if (params.password.length < 8) {
      return { error: 'Password must be at least 8 characters long.' };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: params.password,
      options: {
        emailRedirectTo: getCallbackUrl('/?verified=true'),
        data: {
          full_name: trimmedName,
          phone: trimmedPhone,
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return { error: 'An account with this email already exists. Please sign in instead.' };
      }
      if (msg.includes('rate limit') || msg.includes('security purposes')) {
        return {
          error:
            'Verification email limit reached temporarily. Please wait a few minutes and try again.',
        };
      }
      return { error: error.message };
    }

    // Supabase returns a user object with empty identities when email enumeration protection is active for existing accounts
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        error: 'An account with this email already exists. Please sign in or reset your password.',
      };
    }

    // Only upsert profile client-side if an authenticated session was immediately granted;
    // otherwise the PostgreSQL trigger handle_new_user() already created the profile securely.
    if (data.user && data.session) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: trimmedName,
          email: normalizedEmail,
          phone: trimmedPhone,
          role: 'customer',
        });
      } catch {
        // Trigger already handles profile creation
      }
    }

    const requiresEmailConfirmation = Boolean(data.user && !data.session);

    return {
      user: data.user,
      session: data.session,
      requiresEmailConfirmation,
    };
  } catch (err: any) {
    return { error: err?.message || 'Failed to register account' };
  }
}

/**
 * Sign in existing user with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{
  user?: User | null;
  session?: Session | null;
  profile?: UserProfile | null;
  needsEmailVerification?: boolean;
  error?: string;
}> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        session: null,
        error: 'Supabase credentials are not configured yet in .env.local.',
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('email not confirmed')) {
        return {
          needsEmailVerification: true,
          error:
            'Your email address has not been verified yet. Please check your inbox or resend the verification link below.',
        };
      }
      if (msg.includes('invalid login credentials')) {
        return { error: 'Invalid email or password. Please verify your credentials and try again.' };
      }
      return { error: error.message };
    }

    // Fetch authoritative profile using verified user ID
    const profile = await getCurrentUserProfile(data.user.id);

    return { user: data.user, session: data.session, profile };
  } catch (err: any) {
    return { error: err?.message || 'Failed to sign in' };
  }
}

/**
 * Resend signup verification email for unconfirmed customer accounts.
 */
export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase credentials are not configured in .env.local.' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: getCallbackUrl('/?verified=true'),
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('security purposes')) {
        return {
          success: false,
          error:
            'Email sending cooldown active. Please wait a minute before requesting another verification link.',
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to resend verification email' };
  }
}

/**
 * Sign out current user globally and clear SSR session cookies.
 */
export async function signOutUser(): Promise<{ error?: string }> {
  try {
    if (!isSupabaseConfigured()) return {};
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: 'global' });

    // Also clear SSR cookies cleanly via server route
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
      } catch {
        // Non-blocking cleanup
      }
    }

    if (error) return { error: error.message };
    return {};
  } catch (err: any) {
    return { error: err?.message || 'Failed to sign out' };
  }
}

/**
 * Send password reset email link routed through the SSR PKCE /auth/callback handler.
 */
export async function sendPasswordResetEmail(
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase credentials are not configured in .env.local.' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const supabase = createClient();
    const callbackRedirect =
      redirectTo || getCallbackUrl('/auth/reset-password');

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: callbackRedirect,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('security purposes')) {
        return {
          success: false,
          error:
            'Too many password recovery emails sent recently. Please wait a few minutes before retrying.',
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send password reset email' };
  }
}

/**
 * Update password (used after verifying recovery link session).
 */
export async function updateUserPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase credentials are not configured in .env.local.' };
    }

    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: 'Your password recovery session has expired or is invalid. Please request a new reset link.',
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update password' };
  }
}

/**
 * Refresh the active session and verify user authenticity with Supabase Auth.
 */
export async function refreshAuthSession(): Promise<{ user: User | null; error?: string }> {
  try {
    if (!isSupabaseConfigured()) return { user: null };
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return { user: null, error: error.message };
    return { user: data.user ?? null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Failed to refresh session' };
  }
}

/**
 * Fetch current authenticated user's profile from public.profiles via server-verified getUser().
 * Never fetches profiles for unauthenticated callers or arbitrary user IDs.
 */
export async function getCurrentUserProfile(expectedUserId?: string): Promise<UserProfile | null> {
  try {
    if (!isSupabaseConfigured()) return null;
    const supabase = createClient();

    // Always verify identity against the Supabase Auth server using getUser()
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    if (expectedUserId && user.id !== expectedUserId) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        fullName: data.full_name || 'User',
        email: data.email || user.email || '',
        phone: data.phone || '',
        role: data.role || 'customer',
        avatarUrl: data.avatar_url,
        licenceStatus: data.licence_verification_status || 'unverified',
        createdAt: data.created_at,
      };
    }

    // Fallback upsert if auth.user exists without a profiles row yet
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';
    const phone = user.user_metadata?.phone || '';
    const email = user.email || '';

    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        email,
        phone,
        role: 'customer',
      });
    } catch {
      // RLS ensures non-admins cannot tamper with existing elevated profiles
    }

    return {
      id: user.id,
      fullName,
      email,
      phone,
      role: 'customer',
      licenceStatus: 'unverified',
      createdAt: user.created_at,
    };
  } catch {
    return null;
  }
}

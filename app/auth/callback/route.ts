import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

function getSafeNextPath(rawNext: string | null): string {
  if (!rawNext) return '/';
  // Prevent open redirect attacks (e.g. //evil.com or https://evil.com)
  if (rawNext.startsWith('/') && !rawNext.startsWith('//')) {
    return rawNext;
  }
  return '/';
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const oauthError = searchParams.get('error');
  const oauthErrorDesc = searchParams.get('error_description');
  const next = getSafeNextPath(searchParams.get('next'));
  const isRecoveryFlow = next.startsWith('/auth/reset-password');
  const isHttps = request.url.startsWith('https://');

  const buildErrorRedirect = (message: string) => {
    if (isRecoveryFlow) {
      return NextResponse.redirect(
        `${origin}/auth/reset-password?error=link_expired&message=${encodeURIComponent(message)}`
      );
    }
    return NextResponse.redirect(
      `${origin}/?auth_error=verification_failed&message=${encodeURIComponent(message)}`
    );
  };

  if (oauthError || oauthErrorDesc) {
    return buildErrorRedirect(
      oauthErrorDesc || 'The verification or recovery link is invalid or has expired.'
    );
  }

  if (!code) {
    return buildErrorRedirect(
      isRecoveryFlow
        ? 'Missing password recovery token. Please request a fresh password reset link.'
        : 'Verification token is missing or invalid. Please request a new confirmation email.'
    );
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey || supabaseKey === 'placeholder-anon-key') {
    return buildErrorRedirect('Authentication service is not configured.');
  }

  const pendingCookies: Array<{ name: string; value: string; options?: any }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options });
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Route handler response cookies applied explicitly below
          }
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return buildErrorRedirect(
      error.message || 'This link has expired or has already been used.'
    );
  }

  const targetPath = next === '/' ? '/?verified=true' : next;
  const response = NextResponse.redirect(`${origin}${targetPath}`);

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      path: options?.path || '/',
      sameSite: options?.sameSite || 'lax',
      secure: isHttps ? true : options?.secure,
    });
  });

  return response;
}

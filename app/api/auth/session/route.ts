import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/supabase/auth-guard';
import { mapCustomerFromDb } from '@/lib/supabase/mappers';

/**
 * GET /api/auth/session
 * Server-verified SSR session inspection using supabase.auth.getUser()
 * and authoritative role lookup in public.profiles.
 */
export async function GET(req: NextRequest) {
  try {
    const authCtx = await getAuthContext(req);

    if (!authCtx.user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          role: 'anonymous',
          isAdmin: false,
          profile: null,
        },
        { status: 200 }
      );
    }

    const { data: profileRow } = await authCtx.supabase
      .from('profiles')
      .select('*')
      .eq('id', authCtx.user.id)
      .maybeSingle();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authCtx.user.id,
        email: authCtx.user.email,
        emailConfirmedAt: authCtx.user.email_confirmed_at || null,
      },
      role: authCtx.role,
      isAdmin: authCtx.isAdmin,
      profile: profileRow ? mapCustomerFromDb(profileRow) : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { authenticated: false, error: err?.message || 'Failed to verify session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Terminates the active Supabase session globally and clears SSR auth cookies.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authCtx = await getAuthContext(req);
    if (authCtx.user) {
      await authCtx.supabase.auth.signOut({ scope: 'global' });
    }

    const response = NextResponse.json({
      success: true,
      authenticated: false,
      message: 'Signed out cleanly and session terminated.',
    });

    // Clear all Supabase SSR auth cookies on the response
    req.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, '', {
          path: '/',
          maxAge: 0,
          sameSite: 'lax',
          secure: req.url.startsWith('https://'),
        });
      }
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to terminate session' },
      { status: 500 }
    );
  }
}

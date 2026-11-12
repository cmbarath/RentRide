import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Load .env.local cleanly without external dependencies
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq !== -1) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SECRET) {
  console.error('Missing required Supabase env vars in .env.local');
  process.exit(1);
}

// Admin setup/teardown client (NEVER used to simulate customer API requests!)
const adminSetupClient = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function createPublicAnonClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Simulates a browser's HTTP Cookie Jar interacting with @supabase/ssr + Next.js App Router
function createBrowserCookieSimulator() {
  const jar = new Map();

  const ssrClient = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return Array.from(jar.entries()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          if (!value || options?.maxAge === 0) {
            jar.delete(name);
          } else {
            jar.set(name, value);
          }
        }
      },
    },
  });

  const applySetCookies = (res) => {
    const rawSetCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const header of rawSetCookies) {
      const [pair, ...attrs] = header.split(';').map((s) => s.trim());
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) continue;
      const name = pair.slice(0, eqIdx);
      const val = decodeURIComponent(pair.slice(eqIdx + 1));
      const maxAgeAttr = attrs.find((a) => a.toLowerCase().startsWith('max-age='));
      const isCleared = val === '' || (maxAgeAttr && Number(maxAgeAttr.split('=')[1]) <= 0);
      if (isCleared) {
        jar.delete(name);
      } else {
        jar.set(name, val);
      }
    }
    return rawSetCookies;
  };

  const fetchWithCookies = async (path, options = {}) => {
    const cookieHeader = Array.from(jar.entries())
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('; ');

    const headers = {
      ...(options.headers || {}),
    };
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      redirect: options.redirect || 'manual',
    });

    const setCookieHeaders = applySetCookies(res);
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return { status: res.status, headers: res.headers, setCookieHeaders, data };
  };

  return { jar, ssrClient, fetchWithCookies };
}

const results = [];
function assertTest(id, category, description, condition, details = '') {
  const status = condition ? 'PASS' : 'FAIL';
  results.push({ id, category, description, status, details });
  const icon = condition ? '✅' : '❌';
  console.log(`${icon} ${status} [${id}] (${category}) ${description}${details ? ` — ${details}` : ''}`);
}

const qaUserIdsToCleanup = [];

async function runPhase5AuthTests() {
  console.log('==================================================================');
  console.log('         RENTRIDE PHASE 5: AUTHENTICATION & SECURITY SUITE        ');
  console.log('==================================================================');

  const uniq = Date.now();
  const qaCustomerEmail = `qa.phase5.${uniq}@gmail.com`;
  const qaCustomerPass = 'REDACTED_DISPOSABLE_TEST_PASSWORD';
  const qaCustomerNewPass = 'REDACTED_DISPOSABLE_TEST_PASSWORD';
  const qaFleetEmail = `qa.fleetmgr.${uniq}@gmail.com`;
  const qaFleetPass = 'REDACTED_DISPOSABLE_TEST_PASSWORD';

  // Existing verified test accounts from project state
  const custAEmail = 'qa-deleted-customer-a@example.invalid';
  const custAPass = 'REDACTED_DELETED_QA_PASSWORD';
  const custBId = '00000000-0000-0000-0000-000000000002';
  const adminEmail = 'admin@rentride.in';
  const adminPass = 'REDACTED_ROTATED_ADMIN_PASSWORD';

  try {
    // ------------------------------------------------------------------
    // SECTION 1: ANONYMOUS VISITOR BOUNDARY & UI ROUTES
    // ------------------------------------------------------------------
    console.log('\n--- 1. Anonymous Visitor & Public/Protected Route Checks ---');
    const anonSim = createBrowserCookieSimulator();

    const anonSession = await anonSim.fetchWithCookies('/api/auth/session');
    assertTest(
      'AUTH-01',
      'Anonymous',
      'GET /api/auth/session returns authenticated: false, role: anonymous',
      anonSession.status === 200 &&
        anonSession.data?.authenticated === false &&
        anonSession.data?.role === 'anonymous',
      `status=${anonSession.status}`
    );

    const anonMe = await anonSim.fetchWithCookies('/api/customers/me');
    assertTest(
      'AUTH-02',
      'Anonymous',
      'GET /api/customers/me rejects anonymous caller (401 Unauthorized)',
      anonMe.status === 401,
      `status=${anonMe.status}`
    );

    const anonPatchMe = await anonSim.fetchWithCookies('/api/customers/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Hacker' }),
    });
    assertTest(
      'AUTH-03',
      'Anonymous',
      'PATCH /api/customers/me rejects anonymous caller (401 Unauthorized)',
      anonPatchMe.status === 401,
      `status=${anonPatchMe.status}`
    );

    const anonCustomers = await anonSim.fetchWithCookies('/api/customers');
    const anonBookings = await anonSim.fetchWithCookies('/api/bookings');
    const anonPayments = await anonSim.fetchWithCookies('/api/payments');
    const anonNotifs = await anonSim.fetchWithCookies('/api/notifications');
    assertTest(
      'AUTH-04',
      'Anonymous',
      'Protected customer/admin endpoints reject anonymous access with 401',
      anonCustomers.status === 401 &&
        anonBookings.status === 401 &&
        anonPayments.status === 401 &&
        anonNotifs.status === 401,
      `statuses=[${anonCustomers.status}, ${anonBookings.status}, ${anonPayments.status}, ${anonNotifs.status}]`
    );

    const homePage = await anonSim.fetchWithCookies('/');
    const adminPage = await anonSim.fetchWithCookies('/admin');
    const accountPage = await anonSim.fetchWithCookies('/account');
    const resetPage = await anonSim.fetchWithCookies('/auth/reset-password');
    assertTest(
      'AUTH-05',
      'Anonymous UI',
      'Public & Auth SSR routes render cleanly (200 OK) without crashing',
      homePage.status === 200 &&
        adminPage.status === 200 &&
        accountPage.status === 200 &&
        resetPage.status === 200,
      `pages=[/,/admin,/account,/auth/reset-password]`
    );

    // Verify invalid tampered JWT is rejected with 401
    const badJwtRes = await fetch(`${BASE_URL}/api/customers/me`, {
      headers: { Authorization: 'Bearer invalid.tampered.jwt.token' },
    });
    assertTest(
      'AUTH-06',
      'Token Integrity',
      'Invalid/tampered Bearer JWT rejected with 401 Unauthorized',
      badJwtRes.status === 401,
      `status=${badJwtRes.status}`
    );

    // ------------------------------------------------------------------
    // SECTION 2: REGISTRATION, ROLE ESCALATION PREVENTION & CALLBACKS
    // ------------------------------------------------------------------
    console.log('\n--- 2. Registration, Duplicate Email & Callback Error Handling ---');

    const anonPublic = createPublicAnonClient();

    // Weak/short password rejected by Supabase Auth
    const weakPwRes = await anonPublic.auth.signUp({
      email: `weak.${uniq}@example.com`,
      password: '123',
      options: { data: { full_name: 'Weak Pw', phone: '9840012345' } },
    });
    assertTest(
      'REG-01',
      'Registration',
      'Weak password (<6 chars) rejected at Supabase Auth boundary',
      Boolean(weakPwRes.error),
      weakPwRes.error?.message || ''
    );

    // Valid signup attempting metadata role spoofing ('admin') -> trigger must still force role='customer'
    const signupRes = await anonPublic.auth.signUp({
      email: qaCustomerEmail,
      password: qaCustomerPass,
      options: {
        emailRedirectTo: `${BASE_URL}/auth/callback?next=${encodeURIComponent('/?verified=true')}`,
        data: {
          full_name: 'QA Phase Five Customer',
          phone: '+91 98400 77889',
          role: 'admin', // Spoof attempt via signup metadata!
        },
      },
    });
    let qaUserIdCreated = signupRes.data?.user?.id || null;
    if (qaUserIdCreated) {
      qaUserIdsToCleanup.push(qaUserIdCreated);
    }

    const rateLimitedOnSignup =
      Boolean(signupRes.error) &&
      signupRes.error.message.toLowerCase().includes('rate limit');

    assertTest(
      'REG-02',
      'Registration',
      'Customer registration via public Supabase signUp()',
      !signupRes.error && Boolean(qaUserIdCreated),
      signupRes.error?.message || `userId=${qaUserIdCreated}`
    );

    // If public signUp hit Supabase's 2/hr built-in SMTP quota, provision the unconfirmed user record
    // directly in auth.users (unconfirmed) so the PostgreSQL handle_new_user() trigger & unconfirmed login check are still strictly verified.
    if (!qaUserIdCreated && rateLimitedOnSignup) {
      const { data: unconfirmedUser, error: createErr } = await adminSetupClient.auth.admin.createUser({
        email: qaCustomerEmail,
        password: qaCustomerPass,
        email_confirm: false,
        user_metadata: {
          full_name: 'QA Phase Five Customer',
          phone: '+91 98400 77889',
          role: 'admin',
        },
      });
      if (!createErr && unconfirmedUser?.user?.id) {
        qaUserIdCreated = unconfirmedUser.user.id;
        qaUserIdsToCleanup.push(qaUserIdCreated);
      }
    }

    // Verify PostgreSQL handle_new_user() trigger created profile & forced role='customer'
    const { data: createdProfile } = await adminSetupClient
      .from('profiles')
      .select('*')
      .eq('id', qaUserIdCreated)
      .maybeSingle();
    assertTest(
      'REG-03',
      'Profile Trigger',
      'Signup trigger auto-creates profiles row & blocks metadata role=admin spoofing',
      Boolean(createdProfile) &&
        createdProfile.role === 'customer' &&
        createdProfile.email === qaCustomerEmail &&
        createdProfile.full_name === 'QA Phase Five Customer',
      `role=${createdProfile?.role}`
    );

    // Unconfirmed customer sign-in must be rejected until email verified
    const unverifiedSignIn = await anonPublic.auth.signInWithPassword({
      email: qaCustomerEmail,
      password: qaCustomerPass,
    });
    assertTest(
      'REG-04',
      'Email Verification',
      'Unconfirmed user blocked from login when mailer_autoconfirm is false',
      Boolean(unverifiedSignIn.error) &&
        unverifiedSignIn.error.message.toLowerCase().includes('email not confirmed'),
      unverifiedSignIn.error?.message || ''
    );

    // Test resend signup verification email API
    const resendRes = await anonPublic.auth.resend({
      type: 'signup',
      email: qaCustomerEmail,
      options: {
        emailRedirectTo: `${BASE_URL}/auth/callback?next=${encodeURIComponent('/?verified=true')}`,
      },
    });
    // Wait: resend might hit rate limit if triggered immediately after signup in Supabase (429 / 60s cooldown), record clearly!
    const resendOkOrRateLimited =
      !resendRes.error ||
      resendRes.error.message.toLowerCase().includes('security purposes') ||
      resendRes.error.message.toLowerCase().includes('rate limit');
    assertTest(
      'REG-05',
      'Email Verification',
      'Resend verification endpoint responds appropriately (sent or cooldown rate-limit)',
      resendOkOrRateLimited,
      resendRes.error ? resendRes.error.message : 'Verification resend accepted'
    );

    // Duplicate registration check for existing verified customer
    const dupRes = await anonPublic.auth.signUp({
      email: custAEmail,
      password: custAPass,
      options: { data: { full_name: 'Duplicate Test', phone: '9999999999' } },
    });
    const duplicateBlocked =
      Boolean(dupRes.error) ||
      (dupRes.data?.user && (!dupRes.data.user.identities || dupRes.data.user.identities.length === 0));
    assertTest(
      'REG-06',
      'Registration',
      'Duplicate email registration does not create duplicate account',
      duplicateBlocked,
      dupRes.error?.message || `identities=${dupRes.data?.user?.identities?.length}`
    );

    // Callback error & open redirect handling
    const invalidCallback = await anonSim.fetchWithCookies('/auth/callback?code=expired_invalid_code_123');
    const callbackLoc = invalidCallback.headers.get('location') || '';
    assertTest(
      'CB-01',
      'Callback Error',
      '/auth/callback rejects invalid verification code & forwards error param',
      invalidCallback.status === 307 && callbackLoc.includes('/?auth_error=verification_failed'),
      `redirect=${callbackLoc}`
    );

    const openRedirectCb = await anonSim.fetchWithCookies(
      '/auth/callback?code=bad&next=https://evil-phishing.com'
    );
    const openRedirectLoc = openRedirectCb.headers.get('location') || '';
    assertTest(
      'CB-02',
      'Security',
      '/auth/callback prevents open redirects to external domains',
      openRedirectCb.status === 307 && !openRedirectLoc.includes('evil-phishing.com'),
      `redirect=${openRedirectLoc}`
    );

    const expiredResetCb = await anonSim.fetchWithCookies(
      '/auth/callback?next=/auth/reset-password&error=access_denied&error_description=Email+link+is+invalid+or+has+expired'
    );
    const expiredResetLoc = expiredResetCb.headers.get('location') || '';
    assertTest(
      'CB-03',
      'Recovery Callback',
      '/auth/callback forwards expired recovery errors to /auth/reset-password',
      expiredResetCb.status === 307 &&
        expiredResetLoc.includes('/auth/reset-password?error=link_expired'),
      `redirect=${expiredResetLoc}`
    );

    // Generate genuine single-use verification token for existing unconfirmed QA customer and confirm via public verifyOtp
    let tokenHashToVerify = null;
    let otpTypeToVerify = 'signup';

    const { data: linkData, error: linkErr } = await adminSetupClient.auth.admin.generateLink({
      type: 'signup',
      email: qaCustomerEmail,
      password: qaCustomerPass,
      options: { redirectTo: `${BASE_URL}/auth/callback?next=/?verified=true` },
    });

    if (linkData?.properties?.hashed_token) {
      tokenHashToVerify = linkData.properties.hashed_token;
      otpTypeToVerify = 'signup';
    } else if (linkErr) {
      // If user already exists from public signUp(), generate a magiclink confirmation token for the same user
      const { data: magicData, error: magicErr } = await adminSetupClient.auth.admin.generateLink({
        type: 'magiclink',
        email: qaCustomerEmail,
        options: { redirectTo: `${BASE_URL}/auth/callback?next=/?verified=true` },
      });
      if (magicErr || !magicData?.properties?.hashed_token) {
        throw new Error(`Failed to generate confirmation token: ${magicErr?.message || linkErr.message}`);
      }
      tokenHashToVerify = magicData.properties.hashed_token;
      otpTypeToVerify = 'magiclink';
    }

    const verifyRes = await anonPublic.auth.verifyOtp({
      token_hash: tokenHashToVerify,
      type: otpTypeToVerify,
    });
    if (verifyRes.data?.user?.id && !qaUserIdsToCleanup.includes(verifyRes.data.user.id)) {
      qaUserIdsToCleanup.push(verifyRes.data.user.id);
    }
    assertTest(
      'VER-01',
      'Email Verification',
      'Email confirmation token verifies QA account cleanly via verifyOtp',
      !verifyRes.error && Boolean(verifyRes.data?.user?.email_confirmed_at),
      `confirmed_at=${verifyRes.data?.user?.email_confirmed_at || verifyRes.error?.message}`
    );

    // ------------------------------------------------------------------
    // SECTION 3: CUSTOMER LOGIN, COOKIE SESSION, REFRESH & PROFILE UPDATE
    // ------------------------------------------------------------------
    console.log('\n--- 3. Customer Login, SSR Cookies, Refresh, Profile & Isolation ---');
    const custSim = createBrowserCookieSimulator();

    // Invalid password rejection
    const wrongPw = await custSim.ssrClient.auth.signInWithPassword({
      email: custAEmail,
      password: 'WrongPassword999!',
    });
    assertTest(
      'LOGIN-01',
      'Customer Login',
      'Invalid password rejected by Supabase Auth',
      Boolean(wrongPw.error),
      wrongPw.error?.message || ''
    );

    // Valid login for verified QA customer using SSR cookie simulator
    const qaLogin = await custSim.ssrClient.auth.signInWithPassword({
      email: qaCustomerEmail,
      password: qaCustomerPass,
    });
    assertTest(
      'LOGIN-02',
      'Customer Login',
      'Verified customer login sets SSR cookies cleanly',
      !qaLogin.error && Boolean(qaLogin.data?.session) && custSim.jar.size > 0,
      `cookiesInJar=${custSim.jar.size}`
    );

    // Server-side session check via Cookie header (simulates SSR / browser reload!)
    const sessionCheck = await custSim.fetchWithCookies('/api/auth/session');
    assertTest(
      'SESS-01',
      'SSR Cookie Auth',
      'GET /api/auth/session authenticates user via SSR cookie header (persist after refresh)',
      sessionCheck.status === 200 &&
        sessionCheck.data?.authenticated === true &&
        sessionCheck.data?.role === 'customer' &&
        sessionCheck.data?.user?.email === qaCustomerEmail,
      `email=${sessionCheck.data?.user?.email}, role=${sessionCheck.data?.role}`
    );

    // Middleware protected route hit & cookie refresh check
    const mwRefreshHit = await custSim.fetchWithCookies('/account');
    assertTest(
      'SESS-02',
      'SSR Middleware',
      'Middleware processes SSR cookie session cleanly on /account reload',
      mwRefreshHit.status === 200,
      `status=${mwRefreshHit.status}`
    );

    // Token refresh check
    const refreshRes = await custSim.ssrClient.auth.refreshSession();
    const afterRefreshMe = await custSim.fetchWithCookies('/api/customers/me');
    assertTest(
      'SESS-03',
      'Session Refresh',
      'refreshSession() rotates token and SSR cookies remain accepted on /api/customers/me',
      !refreshRes.error &&
        Boolean(refreshRes.data?.session?.access_token) &&
        afterRefreshMe.status === 200 &&
        afterRefreshMe.data?.profile?.email === qaCustomerEmail,
      `meStatus=${afterRefreshMe.status}`
    );

    // Update permitted profile fields (fullName & phone)
    const patchProfileRes = await custSim.fetchWithCookies('/api/customers/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'QA Phase Five Updated',
        phone: '+91 98400 99001',
      }),
    });
    assertTest(
      'PROF-01',
      'Customer Profile',
      'Customer updates permitted profile fields (fullName, phone) via PATCH /api/customers/me',
      patchProfileRes.status === 200 &&
        patchProfileRes.data?.profile?.name === 'QA Phase Five Updated' &&
        patchProfileRes.data?.profile?.phone === '+91 98400 99001',
      `name=${patchProfileRes.data?.profile?.name}`
    );

    // Attempt privilege escalation via PATCH /api/customers/me
    const apiEscalate = await custSim.fetchWithCookies('/api/customers/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Hacked Admin', role: 'admin' }),
    });
    assertTest(
      'RBAC-01',
      'Escalation Block',
      'PATCH /api/customers/me rejects role escalation attempt (403 Forbidden)',
      apiEscalate.status === 403,
      `status=${apiEscalate.status}`
    );

    // Attempt direct Supabase RLS privilege escalation with Customer's own JWT
    const qaUserId = qaUserIdCreated || qaLogin.data?.user?.id;
    const directRlsCust = createPublicAnonClient(refreshRes.data.session.access_token);
    const { error: rlsEscalateErr } = await directRlsCust
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', qaUserId);
    const { data: verifyRoleRow } = await adminSetupClient
      .from('profiles')
      .select('role')
      .eq('id', qaUserId)
      .single();
    assertTest(
      'RBAC-02',
      'PostgreSQL RLS',
      'Direct RLS update of role=admin fails and role remains customer',
      Boolean(rlsEscalateErr) && verifyRoleRow?.role === 'customer',
      `rlsError=${rlsEscalateErr?.message || 'rejected'}, persistedRole=${verifyRoleRow?.role}`
    );

    // Cross-customer data isolation
    const crossCustomerRes = await custSim.fetchWithCookies(`/api/customers/${custBId}`);
    assertTest(
      'RBAC-03',
      'Customer Isolation',
      'Customer cannot read another customer profile via /api/customers/[id] (403 Forbidden)',
      crossCustomerRes.status === 403,
      `status=${crossCustomerRes.status}`
    );

    // Customer blocked from Admin endpoints (including notifications GET/POST/PATCH)
    const custAdminEndpoints = await Promise.all([
      custSim.fetchWithCookies('/api/customers'),
      custSim.fetchWithCookies('/api/payments'),
      custSim.fetchWithCookies('/api/notifications'),
      custSim.fetchWithCookies('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: 'fleet-admin', title: 'Spoof', message: 'Spoof alert' }),
      }),
      custSim.fetchWithCookies('/api/notifications/00000000-0000-0000-0000-000000000000/read', {
        method: 'PATCH',
      }),
      custSim.fetchWithCookies('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hacked Car' }),
      }),
    ]);
    assertTest(
      'RBAC-04',
      'Admin Protection',
      'Authenticated customer blocked from all admin API routes (403 Forbidden)',
      custAdminEndpoints.every((r) => r.status === 403),
      `statuses=[${custAdminEndpoints.map((r) => r.status).join(', ')}]`
    );

    // ------------------------------------------------------------------
    // SECTION 4: PASSWORD RECOVERY & PASSWORD RESET FLOW
    // ------------------------------------------------------------------
    console.log('\n--- 4. Password Recovery Privacy & Reset Password Execution ---');

    // Privacy check: password recovery for nonexistent email must not expose whether email exists
    const nonExistentRecovery = await anonPublic.auth.resetPasswordForEmail(
      `definitely.not.registered.${uniq}@gmail.com`,
      { redirectTo: `${BASE_URL}/auth/callback?next=/auth/reset-password` }
    );
    const recPrivacySafe =
      !nonExistentRecovery.error ||
      nonExistentRecovery.error.message.toLowerCase().includes('rate limit');
    assertTest(
      'REC-01',
      'Recovery Privacy',
      'resetPasswordForEmail for unknown address does not leak account existence',
      recPrivacySafe,
      nonExistentRecovery.error?.message || 'Uniform non-leaking response'
    );

    // Generate genuine single-use recovery token and complete password reset via normal verifyOtp + updateUser
    const { data: recLink, error: recLinkErr } = await adminSetupClient.auth.admin.generateLink({
      type: 'recovery',
      email: qaCustomerEmail,
      options: { redirectTo: `${BASE_URL}/auth/callback?next=/auth/reset-password` },
    });
    if (recLinkErr) throw new Error(`Failed to generate recovery link: ${recLinkErr.message}`);

    const recClient = createPublicAnonClient();
    const recVerify = await recClient.auth.verifyOtp({
      token_hash: recLink.properties.hashed_token,
      type: 'recovery',
    });
    assertTest(
      'REC-02',
      'Recovery Session',
      'Recovery link token establishes verified recovery session',
      !recVerify.error && Boolean(recVerify.data?.session),
      recVerify.error?.message || 'Recovery OTP verified'
    );

    // Update password using authenticated recovery client
    const recAuthedClient = createPublicAnonClient(recVerify.data.session.access_token);
    await recAuthedClient.auth.setSession({
      access_token: recVerify.data.session.access_token,
      refresh_token: recVerify.data.session.refresh_token,
    });
    const updatePwRes = await recAuthedClient.auth.updateUser({
      password: qaCustomerNewPass,
    });
    assertTest(
      'REC-03',
      'Reset Password',
      'User sets new password successfully via updateUser()',
      !updatePwRes.error && Boolean(updatePwRes.data?.user),
      updatePwRes.error?.message || 'Password updated'
    );

    // Verify old password no longer works & new password succeeds
    const oldPwFail = await anonPublic.auth.signInWithPassword({
      email: qaCustomerEmail,
      password: qaCustomerPass,
    });
    const newPwPass = await anonPublic.auth.signInWithPassword({
      email: qaCustomerEmail,
      password: qaCustomerNewPass,
    });
    assertTest(
      'REC-04',
      'Reset Verification',
      'Old password rejected and new password logs in cleanly',
      Boolean(oldPwFail.error) && !newPwPass.error && Boolean(newPwPass.data?.session),
      `oldPwRejected=${Boolean(oldPwFail.error)}, newPwLogin=${!newPwPass.error}`
    );

    // ------------------------------------------------------------------
    // SECTION 5: LOGOUT & SESSION INVALIDATION
    // ------------------------------------------------------------------
    console.log('\n--- 5. Secure Logout & Session Revocation ---');
    const capturedTokenBeforeLogout = refreshRes.data.session.access_token;

    const logoutRes = await custSim.fetchWithCookies('/api/auth/session', { method: 'DELETE' });
    const postLogoutSession = await custSim.fetchWithCookies('/api/auth/session');
    const postLogoutMe = await custSim.fetchWithCookies('/api/customers/me');

    // Also verify whether old bearer JWT was revoked globally at Supabase Auth server
    const oldTokenAfterLogout = await fetch(`${BASE_URL}/api/customers/me`, {
      headers: { Authorization: `Bearer ${capturedTokenBeforeLogout}` },
    });

    assertTest(
      'LOGOUT-01',
      'Logout',
      'DELETE /api/auth/session clears SSR cookies and invalidates cookie session (401 on protected routes)',
      logoutRes.status === 200 &&
        custSim.jar.size === 0 &&
        postLogoutSession.data?.authenticated === false &&
        postLogoutMe.status === 401,
      `cookiesLeft=${custSim.jar.size}, postMe=${postLogoutMe.status}`
    );

    assertTest(
      'LOGOUT-02',
      'Token Revocation',
      'Global signOut invalidates previously issued JWT at Supabase Auth server (401)',
      oldTokenAfterLogout.status === 401,
      `oldJwtMeStatus=${oldTokenAfterLogout.status}`
    );

    // ------------------------------------------------------------------
    // SECTION 6: FLEET MANAGER & ADMINISTRATOR AUTHORIZATION
    // ------------------------------------------------------------------
    console.log('\n--- 6. Fleet Manager & Administrator Role Authorization ---');

    // Create temporary fleet_manager test account (setup only)
    const { data: fmCreated, error: fmErr } = await adminSetupClient.auth.admin.createUser({
      email: qaFleetEmail,
      password: qaFleetPass,
      email_confirm: true,
      user_metadata: { full_name: 'QA Fleet Manager', phone: '+91 94440 11223' },
    });
    if (fmErr) throw new Error(`Failed to setup fleet_manager test user: ${fmErr.message}`);
    qaUserIdsToCleanup.push(fmCreated.user.id);

    await adminSetupClient
      .from('profiles')
      .update({ role: 'fleet_manager' })
      .eq('id', fmCreated.user.id);

    const fmSim = createBrowserCookieSimulator();
    const fmLogin = await fmSim.ssrClient.auth.signInWithPassword({
      email: qaFleetEmail,
      password: qaFleetPass,
    });
    assertTest(
      'FM-01',
      'Fleet Manager',
      'Fleet Manager logs in via normal password auth',
      !fmLogin.error && Boolean(fmLogin.data?.session),
      fmLogin.error?.message || ''
    );

    const fmSession = await fmSim.fetchWithCookies('/api/auth/session');
    const fmCustomers = await fmSim.fetchWithCookies('/api/customers');
    const fmBookings = await fmSim.fetchWithCookies('/api/bookings');
    const fmPayments = await fmSim.fetchWithCookies('/api/payments');
    assertTest(
      'FM-02',
      'Fleet Manager',
      'Fleet Manager authorized across admin endpoints with role=fleet_manager',
      fmSession.data?.role === 'fleet_manager' &&
        fmSession.data?.isAdmin === true &&
        fmCustomers.status === 200 &&
        fmBookings.status === 200 &&
        fmPayments.status === 200,
      `role=${fmSession.data?.role}, endpoints=[${fmCustomers.status},${fmBookings.status},${fmPayments.status}]`
    );

    // Admin login & authorization verification
    const adminSim = createBrowserCookieSimulator();
    const adminLogin = await adminSim.ssrClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPass,
    });
    const adminSession = await adminSim.fetchWithCookies('/api/auth/session');
    const adminCustomers = await adminSim.fetchWithCookies('/api/customers');
    const adminNotifs = await adminSim.fetchWithCookies('/api/notifications');

    assertTest(
      'ADMIN-01',
      'Administrator',
      'Admin login succeeds and SSR session verifies role=admin',
      !adminLogin.error &&
        adminSession.data?.authenticated === true &&
        adminSession.data?.role === 'admin' &&
        adminSession.data?.isAdmin === true,
      `role=${adminSession.data?.role}`
    );

    assertTest(
      'ADMIN-02',
      'Administrator',
      'Admin accesses restricted customer & audit/notification APIs (200 OK)',
      adminCustomers.status === 200 && adminNotifs.status === 200,
      `statuses=[${adminCustomers.status}, ${adminNotifs.status}]`
    );

    const adminLogout = await adminSim.fetchWithCookies('/api/auth/session', { method: 'DELETE' });
    const adminPostLogout = await adminSim.fetchWithCookies('/api/customers');
    assertTest(
      'ADMIN-03',
      'Admin Logout',
      'Admin logout invalidates SSR session cleanly (401 post-logout)',
      adminLogout.status === 200 && adminPostLogout.status === 401,
      `postLogoutStatus=${adminPostLogout.status}`
    );
  } catch (err) {
    console.error('\nFATAL TEST ERROR:', err);
    results.push({
      id: 'FATAL',
      category: 'Runner',
      description: 'Unexpected exception during test execution',
      status: 'FAIL',
      details: err?.message || String(err),
    });
  } finally {
    // Cleanup ONLY temporary disposable QA accounts created by this suite
    console.log('\n--- Cleaning Up Disposable QA Accounts ---');
    const uniqueCleanupIds = Array.from(new Set(qaUserIdsToCleanup));
    for (const uid of uniqueCleanupIds) {
      await adminSetupClient.from('profiles').delete().eq('id', uid);
      await adminSetupClient.auth.admin.deleteUser(uid);
      console.log(`Cleaned up disposable QA user: ${uid}`);
    }
  }

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log('\n==================================================================');
  console.log('               PHASE 5 AUTH & SECURITY AUDIT REPORT               ');
  console.log('==================================================================');
  console.log(`TOTAL TESTED: ${results.length}`);
  console.log(`PASSED:       ${passed}`);
  console.log(`FAILED:       ${failed}`);
  console.log(`COMPLIANCE:   ${Math.round((passed / results.length) * 100)}%`);
  console.log('==================================================================');

  if (failed > 0) {
    console.log('\nFailed Test Details:');
    results.filter((r) => r.status === 'FAIL').forEach((f) => {
      console.log(`- [${f.id}] ${f.description}: ${f.details}`);
    });
    process.exit(1);
  }
}

runPhase5AuthTests();

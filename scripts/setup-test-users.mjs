import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env.local cleanly
function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return env;
}

const envConfig = loadEnv();
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = envConfig.SUPABASE_SECRET_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !secretKey) {
  console.error('Missing Supabase URL or secret key in .env.local');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const adminEmail = envConfig.QA_ADMIN_EMAIL;
  const adminPass = envConfig.QA_ADMIN_PASSWORD;

  if (!adminEmail || !adminPass) {
    console.error('Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD in .env.local before running setup.');
    process.exit(1);
  }

  const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list users:', listErr);
    process.exit(1);
  }

  let adminUser = users.find((u) => u.email === adminEmail);
  if (!adminUser) {
    const { data: newAdmin, error: createErr } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: adminPass,
      email_confirm: true,
      user_metadata: { full_name: 'Fleet Administrator', role: 'admin' },
    });
    if (createErr) {
      throw new Error(`Error creating admin: ${createErr.message}`);
    }
    adminUser = newAdmin.user;
    console.log('Admin account initialized:', adminUser.id);
  } else {
    await adminClient.auth.admin.updateUserById(adminUser.id, {
      password: adminPass,
      email_confirm: true,
      user_metadata: { full_name: 'Fleet Administrator', role: 'admin' },
    });
    console.log('Verified existing admin account:', adminUser.id);
  }

  const { error: profileErr } = await adminClient.from('profiles').upsert({
    id: adminUser.id,
    email: adminEmail,
    full_name: 'Fleet Administrator',
    role: 'admin',
    licence_verification_status: 'verified',
  });
  if (profileErr) {
    throw new Error(`Error verifying admin profile: ${profileErr.message}`);
  }

  console.log('Administrator profile verified. Note: customer test users are provisioned ephemerally per test run.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

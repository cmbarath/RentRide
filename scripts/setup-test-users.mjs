import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Simple .env.local parser
function loadEnv() {
  const content = fs.readFileSync('.env.local', 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const envConfig = loadEnv();
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = envConfig.SUPABASE_SECRET_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = envConfig.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase Admin at:', supabaseUrl);
const adminClient = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Verify or create admin user
  const adminEmail = 'admin@rentride.in';
  const adminPass = 'REDACTED_ROTATED_ADMIN_PASSWORD';

  const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list users:', listErr);
    process.exit(1);
  }

  console.log(`Found ${users.length} existing auth users.`);
  
  let adminUser = users.find(u => u.email === adminEmail);
  if (!adminUser) {
    console.log(`Creating admin user: ${adminEmail}...`);
    const { data: newAdmin, error: createErr } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: adminPass,
      email_confirm: true,
      user_metadata: { full_name: 'Fleet Administrator', role: 'admin' },
    });
    if (createErr) {
      console.error('Error creating admin:', createErr);
    } else {
      adminUser = newAdmin.user;
      console.log('Admin user created successfully, id:', adminUser.id);
    }
  } else {
    console.log('Admin user already exists, updating password and metadata...');
    await adminClient.auth.admin.updateUserById(adminUser.id, {
      password: adminPass,
      email_confirm: true,
      user_metadata: { full_name: 'Fleet Administrator', role: 'admin' },
    });
  }

  // Ensure role is 'admin' in public.profiles
  if (adminUser) {
    const { error: profileErr } = await adminClient
      .from('profiles')
      .upsert({
        id: adminUser.id,
        email: adminEmail,
        full_name: 'Fleet Administrator',
        role: 'admin',
        licence_verification_status: 'verified',
      });
    if (profileErr) {
      console.error('Error setting admin role in profiles:', profileErr);
    } else {
      console.log('Admin profile verified with role: admin');
    }
  }

  // 2. Set password for test customer qa-deleted-customer-a@example.invalid
  const custAUser = users.find(u => u.email === 'qa-deleted-customer-a@example.invalid');
  if (custAUser) {
    console.log('Setting password for Customer A (qa-deleted-customer-a@example.invalid)...');
    await adminClient.auth.admin.updateUserById(custAUser.id, {
      password: 'REDACTED_DELETED_QA_PASSWORD',
      email_confirm: true,
    });
    await adminClient
      .from('profiles')
      .update({ role: 'customer' })
      .eq('id', custAUser.id);
    console.log('Customer A configured.');
  }

  // 3. Set password for test customer qa-deleted-customer-b@example.invalid
  const custBUser = users.find(u => u.email === 'qa-deleted-customer-b@example.invalid');
  if (custBUser) {
    console.log('Setting password for Customer B (qa-deleted-customer-b@example.invalid)...');
    await adminClient.auth.admin.updateUserById(custBUser.id, {
      password: 'REDACTED_DELETED_QA_PASSWORD',
      email_confirm: true,
    });
    await adminClient
      .from('profiles')
      .update({ role: 'customer' })
      .eq('id', custBUser.id);
    console.log('Customer B configured.');
  }

  console.log('\n--- Test Users Setup Complete ---');
  console.log('Admin:', adminEmail, '/ REDACTED_ROTATED_ADMIN_PASSWORD');
  console.log('Customer A: qa-deleted-customer-a@example.invalid / REDACTED_DELETED_QA_PASSWORD');
  console.log('Customer B: qa-deleted-customer-b@example.invalid / REDACTED_DELETED_QA_PASSWORD');
}

main().catch(console.error);

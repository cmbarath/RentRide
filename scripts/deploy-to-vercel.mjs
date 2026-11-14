import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Read local .env.local securely
function getLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found');
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

// Check whoami
export function checkWhoami() {
  try {
    const res = execSync('npx vercel whoami', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('[Vercel CLI] Logged in as:', res.trim());
    return true;
  } catch (err) {
    console.error('[Vercel CLI] Not logged in:', err.stderr || err.message);
    return false;
  }
}

// Add env var securely
async function setVercelEnv(key, val, envTargets = ['production', 'preview', 'development']) {
  if (!val) {
    console.log(`[Env] Skipping empty key: ${key}`);
    return;
  }
  for (const target of envTargets) {
    try {
      // Remove first if already present
      try {
        execSync(`npx vercel env rm ${key} ${target} --yes`, { stdio: ['ignore', 'ignore', 'ignore'] });
      } catch (_) {}

      // Add securely using stdin
      const p = spawn('npx', ['vercel', 'env', 'add', key, target], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      p.stdin.write(val);
      p.stdin.end();

      let stdout = '';
      let stderr = '';
      p.stdout.on('data', d => stdout += d.toString());
      p.stderr.on('data', d => stderr += d.toString());

      const code = await new Promise(resolve => p.on('close', resolve));
      if (code === 0) {
        console.log(`[Env] Successfully set ${key} on ${target}`);
      } else {
        console.error(`[Env] Failed to set ${key} on ${target}: ${stderr || stdout}`);
      }
    } catch (e) {
      console.error(`[Env] Error setting ${key} on ${target}:`, e.message);
    }
  }
}

async function main() {
  console.log('=== RentRide Vercel Automated Deploy Orchestrator ===');
  if (!checkWhoami()) {
    console.log('Please complete Vercel CLI login before running deployment script.');
    process.exit(1);
  }

  const projectName = 'rent-ride-ywqx';
  const scope = 'cmbarath2005-1781';

  console.log(`\nLinking project ${projectName} (scope: ${scope})...`);
  try {
    execSync(`npx vercel link --project ${projectName} --scope ${scope} --yes`, {
      stdio: 'inherit'
    });
    console.log('Project link successful.');
  } catch (e) {
    console.error('Link failed:', e.message);
    process.exit(1);
  }

  const localEnv = getLocalEnv();
  const keysToSync = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_DEFAULT_GST_RATE',
    'NEXT_PUBLIC_COMPANY_GSTIN',
    'NEXT_PUBLIC_SUPPORT_PHONE'
  ];

  console.log('\nConfiguring Production & Preview environment variables...');
  for (const k of keysToSync) {
    if (localEnv[k]) {
      await setVercelEnv(k, localEnv[k], ['production', 'preview']);
    }
  }

  // Set initial NEXT_PUBLIC_APP_URL to expected domain
  const prodUrl = `https://${projectName}.vercel.app`;
  await setVercelEnv('NEXT_PUBLIC_APP_URL', prodUrl, ['production', 'preview']);

  console.log('\nTriggering production build & deployment...');
  try {
    execSync('npx vercel --prod --yes', { stdio: 'inherit' });
    console.log('\nDeployment completed successfully!');
  } catch (e) {
    console.error('Deployment execution failed:', e.message);
    process.exit(1);
  }
}

if (process.argv[1] === import.meta.filename) {
  main().catch(err => {
    console.error('Fatal error in deploy orchestrator:', err);
    process.exit(1);
  });
}

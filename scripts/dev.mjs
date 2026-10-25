/**
 * scripts/dev.mjs — Interactive monorepo guide.
 *
 * Run from the repository root:
 *   npm run guide
 *
 * Built with @inquirer/prompts (https://github.com/sboudrias/inquirer.js).
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { select, confirm, input } from '@inquirer/prompts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE_ENV = resolve(ROOT, 'apps', 'mobile', '.env');
const MOBILE_ENV_EXAMPLE = resolve(ROOT, 'apps', 'mobile', '.env.example');

// ── colours ──────────────────────────────────────────────────────────────────
const c = {
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};
const b = (s) => `${c.bold}${s}${c.reset}`;
const ok = (s) => `${c.green}✔ ${s}${c.reset}`;
const warn = (s) => `${c.yellow}⚠ ${s}${c.reset}`;
const err = (s) => `${c.red}✘ ${s}${c.reset}`;
const info = (s) => `${c.cyan}› ${s}${c.reset}`;

// ── banner ───────────────────────────────────────────────────────────────────
function banner() {
  console.log(`\n${c.bold}${c.blue}`);
  console.log('  ╔═══════════════════════════════════════╗');
  console.log('  ║        Recipe App  ·  Dev Guide       ║');
  console.log('  ╚═══════════════════════════════════════╝');
  console.log(c.reset);
}

// ── helpers ──────────────────────────────────────────────────────────────────
function run(cmd, args, opts = {}) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      cwd: ROOT,
      ...opts,
    });
    child.on('exit', (code) => (code === 0 ? resolveP() : rejectP(new Error(`exit code ${code}`))));
    child.on('error', rejectP);
  });
}

function shell(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

async function runChecks() {
  const steps = [
    { label: 'TypeScript', cmd: 'npm run typecheck --workspace=@recipe-app/mobile' },
    { label: 'ESLint', cmd: 'npm run lint --workspace=@recipe-app/mobile' },
    { label: 'Jest', cmd: 'npm run test:ci --workspace=@recipe-app/mobile' },
    { label: 'Prettier', cmd: 'npm run format:check' },
  ];

  console.log(`\n${b('Running project checks…')}\n`);

  let allPassed = true;
  for (const { label, cmd } of steps) {
    process.stdout.write(`${info(`Running ${b(label)}… `)}`);
    try {
      execSync(cmd, { cwd: ROOT, stdio: 'pipe' });
      console.log(ok(label));
    } catch {
      console.log(err(label));
      allPassed = false;
    }
  }

  console.log('');
  allPassed
    ? console.log(ok(b('All checks passed.')))
    : console.log(warn(b('Some checks failed — run the failing command manually for details.')));
}

// ── start mobile ─────────────────────────────────────────────────────────────
async function startMobile() {
  const connection = await select({
    message: 'How is your phone connected to the internet?',
    choices: [
      {
        name: 'Same Wi-Fi as this laptop',
        value: 'lan',
        description: 'LAN mode · port 8082 · firewall rule already applied',
      },
      {
        name: "Laptop is on my phone's hotspot",
        value: 'hotspot',
        description: 'LAN mode · port 8082 · check Windows Public firewall if blocked',
      },
      {
        name: 'Phone is on a different network (cellular / other Wi-Fi)',
        value: 'tunnel',
        description: 'Tunnel · port 8083 · requires npx expo login first',
      },
      {
        name: 'Not using a phone — Android emulator only',
        value: 'android',
        description: 'Launches directly into the running Android Virtual Device',
      },
    ],
  });

  // Show contextual tips
  const tips = {
    lan: [
      'Both devices are on the same Wi-Fi network.',
      'Scan the QR in the terminal with the iPhone/Android Camera app → open in Expo Go.',
      'If the phone cannot connect, open  http://<laptop-ip>:8082/status  in the phone browser.',
      'A running Metro server returns: packager-status:running',
    ],
    hotspot: [
      "The laptop is on the phone's own hotspot — they share the same subnet.",
      'Use npm run mobile:lan (port 8082).',
      'Windows may treat the hotspot as a Public network. The existing firewall rule',
      'only covers the Private profile. If the phone cannot connect, open an',
      'Administrator PowerShell and run:',
      '',
      '  New-NetFirewallRule -DisplayName "Metro 8082 (Public)" `',
      '    -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8082 `',
      '    -Program (Get-Command node).Source -Profile Public',
    ],
    tunnel: [
      "The tunnel routes through Expo's servers — no shared Wi-Fi needed.",
      'Both devices only need internet access.',
      'SDK 58 requires an Expo account. Check login status below.',
    ],
    android: [
      'Make sure Android Studio is open and an AVD is running before starting.',
      'Run  adb devices  in a separate terminal to verify the emulator is visible.',
    ],
  };

  console.log('');
  for (const line of tips[connection]) {
    console.log(`  ${c.dim}${line}${c.reset}`);
  }
  console.log('');

  // Tunnel: check Expo login
  if (connection === 'tunnel') {
    const loggedIn = shell('npx expo whoami 2>/dev/null') ?? '';
    if (!loggedIn) {
      console.log(warn('You are not signed in to Expo.'));
      const doLogin = await confirm({
        message: 'Run npx expo login now? (interactive — type your credentials in the browser)',
        default: true,
      });
      if (doLogin) {
        await run('npx', ['expo', 'login'], { cwd: resolve(ROOT, 'apps', 'mobile') });
      }
    } else {
      console.log(ok(`Signed in to Expo as: ${b(loggedIn)}`));
    }
  }

  const go = await confirm({
    message: 'Ready to start?',
    default: true,
  });
  if (!go) return;

  const scripts = {
    lan: ['mobile:lan'],
    hotspot: ['mobile:lan'],
    tunnel: ['mobile:tunnel'],
    android: ['android'],
  };

  console.log(`\n${info(`Starting: ${b(`npm run ${scripts[connection][0]}`)}`)}\n`);
  await run('npm', ['run', ...scripts[connection]]);
}

// ── env setup ─────────────────────────────────────────────────────────────────
async function setupEnv() {
  console.log(`\n${b('Mobile environment setup')}\n`);

  if (existsSync(MOBILE_ENV)) {
    const content = readFileSync(MOBILE_ENV, 'utf8');
    console.log(ok(`apps/mobile/.env ${c.dim}already exists.${c.reset}`));
    console.log(`\n${c.dim}Current contents:${c.reset}`);
    content.split('\n').forEach((line) => console.log(`  ${c.dim}${line}${c.reset}`));
    console.log('');
    const overwrite = await confirm({ message: 'Overwrite it from .env.example?' });
    if (!overwrite) return;
  } else {
    console.log(warn('apps/mobile/.env is missing.'));
    const create = await confirm({
      message: 'Create it now from .env.example?',
      default: true,
    });
    if (!create) return;
  }

  copyFileSync(MOBILE_ENV_EXAMPLE, MOBILE_ENV);
  console.log(ok('Created apps/mobile/.env from .env.example.'));

  const apiUrl = await input({
    message: 'EXPO_PUBLIC_API_URL',
    default: 'http://10.0.2.2:8080',
    validate: (v) => (v.startsWith('http') ? true : 'Must start with http:// or https://'),
  });

  const updated = readFileSync(MOBILE_ENV, 'utf8').replace(
    /^EXPO_PUBLIC_API_URL=.*/m,
    `EXPO_PUBLIC_API_URL=${apiUrl}`,
  );
  writeFileSync(MOBILE_ENV, updated, 'utf8');
  console.log(ok(`EXPO_PUBLIC_API_URL set to: ${b(apiUrl)}`));

  console.log(`\n${c.dim}Hint: Android emulator → http://10.0.2.2:8080`);
  console.log(`      Physical phone      → http://<your-LAN-IP>:8080${c.reset}\n`);
}

// ── about ─────────────────────────────────────────────────────────────────────
async function aboutRepo() {
  const workspaces = [
    {
      path: 'apps/mobile',
      label: '@recipe-app/mobile',
      desc: 'React Native · Expo SDK 58 · TypeScript · Android-first. The only active app.',
      status: '● active',
    },
    {
      path: 'apps/api',
      label: 'apps/api',
      desc: 'Kotlin · Ktor · Android-first backend (SETUP-02). Skeleton only — no code yet.',
      status: '○ placeholder',
    },
    {
      path: 'apps/admin',
      label: 'apps/admin',
      desc: 'Web admin panel (SETUP-06). Skeleton only — no code yet.',
      status: '○ placeholder',
    },
    {
      path: 'packages/api-contract',
      label: '@recipe-app/api-contract',
      desc: 'Shared OpenAPI spec + generated TypeScript types. Skeleton only — no code yet.',
      status: '○ placeholder',
    },
  ];

  console.log(`\n${b('Monorepo workspaces')}\n`);
  for (const w of workspaces) {
    const color = w.status.startsWith('●') ? c.green : c.dim;
    console.log(`  ${color}${w.status}${c.reset}  ${b(w.label)}`);
    console.log(`  ${c.dim}${w.desc}${c.reset}`);
    console.log(`  ${c.dim}${w.path}${c.reset}\n`);
  }

  console.log(`${b('Documentation')}`);
  const docs = [
    ['PRD.md', 'Product requirements'],
    ['ARCHITECTURE.md', 'System design & decisions'],
    ['DESIGN_SYSTEM.md', 'UI tokens & component rules'],
    ['BACKLOG.md', 'Open tickets'],
    ['apps/mobile/SETUP-01.md', 'Mobile setup handover'],
  ];
  for (const [path, desc] of docs) {
    const exists = existsSync(resolve(ROOT, path));
    console.log(`  ${exists ? ok('') : err('')} ${b(path)}  ${c.dim}${desc}${c.reset}`);
  }
  console.log('');
}

// ── main loop ─────────────────────────────────────────────────────────────────
async function main() {
  banner();

  while (true) {
    const choice = await select({
      message: 'What would you like to do?',
      choices: [
        { name: '🚀  Start mobile dev server', value: 'start' },
        { name: '✅  Run project checks', value: 'checks' },
        { name: '🔧  Set up mobile environment (.env)', value: 'env' },
        { name: '📖  About this monorepo', value: 'about' },
        { name: '🚪  Exit', value: 'exit' },
      ],
    });

    try {
      if (choice === 'start') await startMobile();
      else if (choice === 'checks') await runChecks();
      else if (choice === 'env') await setupEnv();
      else if (choice === 'about') await aboutRepo();
      else if (choice === 'exit') {
        console.log(`\n${c.dim}Goodbye!${c.reset}\n`);
        break;
      }
    } catch (e) {
      // User interrupted a prompt (Ctrl+C) — exit gracefully
      if (e?.name === 'ExitPromptError') {
        console.log(`\n${c.dim}Cancelled.${c.reset}\n`);
        break;
      }
      console.error(err(`\n${e.message}\n`));
    }

    // Don't loop back to menu after starting the dev server (it takes over the terminal)
    if (choice === 'start') break;
  }
}

main();

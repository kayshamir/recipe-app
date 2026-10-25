/**
 * scripts/dev.mjs — Interactive monorepo guide.
 *
 *   npm run start
 *
 * Opens with the guided mobile launch wizard (the primary daily flow), and
 * still covers every other workspace and local-infrastructure service defined
 * in ARCHITECTURE.md. Checks prerequisites, shows what is built vs planned,
 * and launches the correct commands for each stack component.
 *
 * Built with @inquirer/prompts.
 * https://github.com/sboudrias/inquirer.js
 */

import { checkbox, confirm, input, select } from '@inquirer/prompts';
import { execSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE = resolve(ROOT, 'apps', 'mobile');
const API = resolve(ROOT, 'apps', 'api');
const ADMIN = resolve(ROOT, 'apps', 'admin');
const CONTRACT = resolve(ROOT, 'packages', 'api-contract');
const MOBILE_ENV = resolve(MOBILE, '.env');
const MOBILE_ENV_EXAMPLE = resolve(MOBILE, '.env.example');
const API_ENV = resolve(API, '.env');
const DOCKER_COMPOSE = resolve(ROOT, 'infra', 'docker-compose.yml');

// ── ANSI helpers ─────────────────────────────────────────────────────────────
const c = {
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};
const b = (s) => `${c.bold}${s}${c.reset}`;
const dim = (s) => `${c.dim}${s}${c.reset}`;
const ok = (s) => `${c.green}✔ ${s}${c.reset}`;
const warn = (s) => `${c.yellow}⚠ ${s}${c.reset}`;
const fail = (s) => `${c.red}✘ ${s}${c.reset}`;
const info = (s) => `${c.cyan}› ${s}${c.reset}`;
const dot = (status) =>
  status === 'active' || status === true
    ? `${c.green}●${c.reset}`
    : status === 'planned'
      ? `${c.yellow}○${c.reset}`
      : `${c.dim}○${c.reset}`;

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

/** Draw a bordered panel with a title bar and content rows. */
function panel(title, rows = [], opts = {}) {
  const width = 62;
  const inner = width - 4; // border chars + leading space
  const rule = opts.accent ?? c.blue;
  const line = (s = '') => {
    const vis = stripAnsi(s).length;
    return `${rule}│${c.reset} ${s}${' '.repeat(Math.max(0, inner - vis))} ${rule}│${c.reset}`;
  };
  // Wrap long rows to the panel width, preserving a leading ANSI color per chunk.
  const wrap = (s) => {
    const raw = stripAnsi(s);
    const m = s.match(/^\x1b\[[0-9;]*m/);
    const color = m ? m[0] : '';
    if (raw.length <= inner) return [`${color}${raw}${color ? c.reset : ''}`];
    const out = [];
    let rest = raw;
    while (rest.length > inner) {
      let cut = rest.lastIndexOf(' ', inner);
      if (cut < inner * 0.5) cut = inner;
      out.push(`${color}${rest.slice(0, cut).trimEnd()}${color ? c.reset : ''}`);
      rest = rest.slice(cut).replace(/^ +/, '');
    }
    if (rest) out.push(`${color}${rest}${color ? c.reset : ''}`);
    return out;
  };
  const titleRaw = stripAnsi(title);
  console.log(
    `${rule}╭─ ${c.reset}${b(titleRaw)}${' '.repeat(Math.max(0, width - titleRaw.length - 6))}${rule}╮${c.reset}`,
  );
  for (const r of rows) for (const chunk of wrap(r)) console.log(line(chunk));
  console.log(`${rule}╰${'─'.repeat(width - 2)}╯${c.reset}`);
}

/** Weighted step header for wizards. */
function step(n, total, label) {
  const filled = '█'.repeat(n);
  const empty = '░'.repeat(Math.max(0, total - n));
  console.log(`\n${c.magenta}${filled}${c.dim}${empty} Step ${n}/${total}${c.reset}  ${b(label)}`);
}

function getLanIPs() {
  const ips = [];
  for (const nets of Object.values(networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

// ── shell helpers ─────────────────────────────────────────────────────────────
function tryShell(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

/**
 * Run a command in the user's shell.
 * Takes a single command string — avoids Node's DEP0190 warning that fires
 * when args are passed alongside `shell: true` (they are concatenated, not
 * escaped). All call sites use constant args, so no interpolation risk.
 */
function run(command, opts = {}) {
  return new Promise((res, rej) => {
    const child = spawn(command, { stdio: 'inherit', shell: true, cwd: ROOT, ...opts });
    child.on('exit', (code) =>
      code === 0 ? res() : rej(new Error(`exit ${code}`, { cause: { code } })),
    );
    child.on('error', rej);
  });
}

/** Expo account status: returns the signed-in identity, or null. */
function expoWhoami(cwd = MOBILE) {
  const out = tryShell('npx expo whoami', cwd) ?? '';
  if (!out || /not logged|must be logged|error|✘/i.test(out)) return null;
  return out.split('\n')[0].trim();
}

/**
 * Run a command and tee its output to the console line by line, so the caller
 * can react to specific lines (e.g. grab a login URL) while the user still sees
 * everything in real time.
 */
function runWatching(command, { cwd = ROOT, env = process.env, onLine = () => {} } = {}) {
  return new Promise((res, rej) => {
    const child = spawn(command, { stdio: ['inherit', 'pipe', 'pipe'], shell: true, cwd, env });
    const tee = (stream) => {
      if (!stream) return;
      let buf = '';
      stream.setEncoding('utf8');
      const flush = (tail) => {
        if (tail) {
          console.log(tail);
          onLine(tail);
        }
      };
      stream.on('data', (chunk) => {
        buf += chunk;
        const lines = buf.split(/\r?\n/);
        buf = lines.pop() ?? '';
        for (const line of lines) {
          console.log(line);
          onLine(line);
        }
      });
      stream.on('close', () => flush(buf));
    };
    tee(child.stdout);
    tee(child.stderr);
    child.on('exit', (code) =>
      code === 0 ? res() : rej(new Error(`exit ${code}`, { cause: { code } })),
    );
    child.on('error', rej);
  });
}

/**
 * Kill a spawned shell AND its whole child tree (java / node). On Windows a
 * plain child.kill() only stops cmd.exe, orphaning the Gradle-launched JVM and
 * Metro's node process — taskkill /T /F reaps them so ports free up cleanly.
 */
function killTree(child) {
  if (!child || child.pid == null) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
      return;
    } catch {
      /* already gone or not a tree root — fall through */
    }
  }
  try {
    child.kill('SIGTERM');
  } catch {
    /* ignore */
  }
}

/**
 * Run several long-lived commands at once, prefixing every output line with a
 * colored tag, and tear the whole group down on Ctrl+C. This is what lets the
 * Ktor API and Metro share a single terminal for full-stack development.
 */
function runConcurrent(tasks) {
  return new Promise((res) => {
    const children = [];
    let exited = 0;
    let down = false;
    const prefix = (color, name) => `${color}${name.padEnd(6)}${c.reset}│`;

    const teardown = (reason) => {
      if (down) return;
      down = true;
      if (reason === 'sigint') {
        console.log(`\n  ${info('Stopping full stack…')}`);
        children.forEach(killTree);
      }
      process.removeListener('SIGINT', onInt);
      res();
    };
    function onInt() {
      teardown('sigint');
    }
    process.on('SIGINT', onInt);

    const spawnOne = ({ name, command, cwd, color, delayMs = 0 }) => {
      const tag = prefix(color ?? c.blue, name);
      const start = () => {
        const child = spawn(command, {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true,
          cwd,
          env: process.env,
        });
        const pipe = (stream) => {
          if (!stream) return;
          let buf = '';
          stream.setEncoding('utf8');
          const emit = (line) => console.log(`${tag} ${line}`);
          stream.on('data', (chunk) => {
            buf += chunk;
            const lines = buf.split(/\r?\n/);
            buf = lines.pop() ?? '';
            lines.forEach(emit);
          });
          stream.on('close', () => {
            if (buf) emit(buf);
          });
        };
        pipe(child.stdout);
        pipe(child.stderr);
        child.on('exit', (code) => {
          console.log(`${tag} ${dim(`process exited (code ${code})`)}`);
          exited += 1;
          if (exited >= tasks.length) teardown('all-exited');
        });
        children.push(child);
      };
      // A delayed task (e.g. the file watcher) starts only after the primary
      // process is up, so two Gradle/Kotlin compilations never overlap.
      if (delayMs > 0) setTimeout(start, delayMs);
      else start();
    };

    tasks.forEach(spawnOne);
  });
}

/**
 * First real browser executable we can find. Needed because `cmd /c start <url>`
 * is unreliable here: Node leaves the URL unquoted (no spaces in it), so cmd.exe
 * splits it at every `&`, truncates the link and exits 1 — Expo then throws.
 */
function detectBrowserExe() {
  const dirs = [
    process.env['ProgramFiles(x86)'],
    process.env.PROGRAMFILES,
    process.env['ProgramW6432'],
    process.env.LOCALAPPDATA,
  ].filter(Boolean);
  // Preferred order: Chrome, Edge, Firefox, Brave, Chromium.
  const apps = [
    ['Google', 'Chrome', 'Application', 'chrome.exe'],
    ['Microsoft', 'Edge', 'Application', 'msedge.exe'],
    ['Mozilla Firefox', 'firefox.exe'],
    ['BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'],
    ['Chromium', 'Application', 'chrome.exe'],
  ];
  for (const parts of apps) {
    for (const dir of dirs) {
      const exe = resolve(dir, ...parts);
      if (existsSync(exe)) return exe;
    }
  }
  return null;
}

/** Open a URL ourselves, with argv quoting that `cmd /c start` cannot get wrong. */
function openUrl(url) {
  const exe = detectBrowserExe();
  try {
    if (exe) {
      spawn(exe, [url], { detached: true, stdio: 'ignore' }).unref();
      return exe.split('\\').pop();
    }
    // No known exe: hand cmd a quoted URL so the &s survive.
    spawn(process.env.ComSpec ?? 'cmd.exe', ['/c', 'start', '', `"${url}"`], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    return 'default browser';
  } catch {
    return null;
  }
}

function section(title) {
  console.log(
    `\n${c.bold}${c.blue}── ${title} ${'─'.repeat(Math.max(0, 44 - title.length))}${c.reset}\n`,
  );
}

// ── workspace status detection ───────────────────────────────────────────────
function workspaceStatus() {
  const mobileHasSrc = existsSync(resolve(MOBILE, 'src'));
  const apiHasBuild =
    existsSync(resolve(API, 'build.gradle.kts')) || existsSync(resolve(API, 'build.gradle'));
  const apiHasSrc = existsSync(resolve(API, 'src/main/kotlin'));
  const adminHasPkg = existsSync(resolve(ADMIN, 'package.json'));
  const contractHasYaml =
    existsSync(resolve(CONTRACT, 'openapi.yaml')) || existsSync(resolve(CONTRACT, 'openapi.json'));
  const hasDockerCompose = existsSync(resolve(ROOT, 'infra', 'docker-compose.yml'));
  const dockerInstalled = !!tryShell('docker --version');
  const javaInstalled = !!tryShell('java -version 2>&1');
  const gradleInstalled = !!tryShell('gradle --version 2>&1');

  return {
    mobileHasSrc,
    apiHasBuild,
    apiHasSrc,
    adminHasPkg,
    contractHasYaml,
    hasDockerCompose,
    dockerInstalled,
    javaInstalled,
    gradleInstalled,
  };
}

// ── ABOUT / architecture overview ────────────────────────────────────────────
async function aboutArch() {
  const s = workspaceStatus();
  section('Monorepo — Workspace status');

  const rows = [
    [
      'apps/mobile',
      'React Native · Expo SDK 58 · TypeScript',
      s.mobileHasSrc ? 'active' : 'planned',
      'SETUP-01',
    ],
    [
      'apps/api',
      'Kotlin · Ktor · Gradle',
      s.apiHasSrc ? 'active' : s.apiHasBuild ? 'active' : 'planned',
      'SETUP-02',
    ],
    [
      'packages/api-contract',
      'OpenAPI spec · generated TS types',
      s.contractHasYaml ? 'active' : 'planned',
      'SETUP-02',
    ],
    [
      'apps/admin',
      'Next.js or Ktor-served admin UI',
      s.adminHasPkg ? 'active' : 'future',
      'Phase 1',
    ],
    [
      'infra/docker-compose.yml',
      'Postgres+pgvector · Ollama · SearXNG · Caddy',
      s.hasDockerCompose ? 'active' : 'planned',
      'SETUP-03',
    ],
  ];

  console.log(
    `  ${b('Workspace')}                          ${b('Stack')}                                             ${b('Status')}  ${b('Ticket')}`,
  );
  console.log(`  ${dim('─'.repeat(90))}`);
  for (const [ws, stack, status, ticket] of rows) {
    console.log(
      `  ${dot(status)} ${ws.padEnd(30)} ${dim(stack.padEnd(48))} ${status.padEnd(10)} ${c.dim}${ticket}${c.reset}`,
    );
  }

  section('Tech stack (from ARCHITECTURE.md)');
  const stack = [
    ['Mobile', 'React Native + Expo SDK 58 + TypeScript'],
    ['API framework', 'Ktor (Kotlin) — JVM'],
    ['Database', 'PostgreSQL + pgvector'],
    ['ORM / Migration', 'Exposed (Kotlin SQL DSL) + Gradle plugin'],
    ['LLM (reasoning)', 'Ollama Cloud gemma3:27b (free tier)'],
    ['LLM (embeddings)', 'Ollama local nomic-embed-text (768-dim)'],
    ['Web search', 'SearXNG self-hosted'],
    ['Auth', 'Email + JWT (ktor-auth-jwt)'],
    ['Hosting', 'Oracle Cloud Always Free ARM VM — $0/mo'],
    ['Reverse proxy', "Caddy + auto-TLS (Let's Encrypt)"],
    ['Media storage', 'Cloudflare R2 (free tier, 10 GB)'],
    ['Background jobs', 'Kotlin coroutines + Postgres job table'],
    ['CI/CD', 'GitHub Actions (Gradle + Expo)'],
  ];
  for (const [layer, choice] of stack) {
    console.log(`  ${b(layer.padEnd(22))} ${dim(choice)}`);
  }

  section('Local infrastructure (Docker Compose)');
  const services = [
    ['postgres', 'PostgreSQL 17 + pgvector', 5432, s.dockerInstalled],
    ['ollama', 'Ollama — local embeddings only', 11434, s.dockerInstalled],
    ['searxng', 'SearXNG metasearch', 8888, s.dockerInstalled],
    ['ktor-api', 'Ktor backend (once built)', 8080, s.apiHasSrc],
  ];
  console.log(
    `  ${b('Service')}        ${b('Purpose')}                          ${b('Port')}   ${b('Status')}`,
  );
  for (const [name, purpose, port, ready] of services) {
    console.log(
      `  ${name.padEnd(15)} ${dim(purpose.padEnd(32))} ${String(port).padEnd(8)} ${ready ? ok('ready') : warn('not set up')}`,
    );
  }
  if (!s.dockerInstalled)
    console.log(
      `\n  ${warn('Docker is not installed or not on PATH. Required for local Postgres/Ollama/SearXNG.')}`,
    );
  console.log('');
}

// ── MOBILE GUIDED LAUNCH WIZARD ─────────────────────────────────────────────
const MOBILE_TOTAL_STEPS = 4;

/**
 * Browser sign-in, done in a way that survives Windows.
 *
 * Expo's own launcher builds `cmd /c start "" <url>` from an argv array, and the
 * authorize URL contains `&` but no spaces — Node leaves it unquoted, cmd splits
 * it at every `&`, and the command exits 1. Expo calls openBrowserAsync without
 * awaiting it, so that rejection kills the login process.
 *
 * Setting BROWSER=none makes openBrowserAsync return false before spawning
 * anything (see open.js), so Expo prints the URL and keeps its localhost
 * callback server alive. We grab the URL from its output and open a browser
 * ourselves with correct argv quoting.
 *
 * `--browser` is required, not cosmetic: without a flag Expo defaults browser
 * mode to `isInteractive()`, which checks `process.stdout.isTTY` — our stdout is
 * piped here so it would silently fall back to the password prompt.
 */
async function browserLogin() {
  const exe = detectBrowserExe();
  console.log(`\n  ${info(`Running: ${b('npx expo login --browser')}`)}  ${dim('(BROWSER=none)')}`);
  console.log(`  ${dim('The sign-in link is captured below and opened in a browser tab.')}`);
  console.log(
    `  ${dim('Finish in the tab — this terminal waits for Expo\u2019s callback (Ctrl+C cancels).')}`,
  );
  console.log('');

  let opened = false;
  try {
    await runWatching('npx expo login --browser', {
      cwd: MOBILE,
      env: { ...process.env, BROWSER: 'none' },
      onLine: (line) => {
        const url = line.match(/https:\/\/expo\.dev\/login\?\S+/)?.[0];
        if (!url || opened) return;
        opened = true;
        const which = openUrl(url);
        console.log('');
        console.log(
          `  ${which ? info(`Opened in ${b(which)}.`) : warn('Could not open a browser.')}`,
        );
        console.log(`  ${dim('No tab appeared? Paste this link into any browser on this PC:')}`);
        console.log(`  ${c.cyan}${url}${c.reset}`);
        console.log('');
      },
    });
  } catch (e) {
    console.log(`\n  ${fail(`Browser login did not complete (${e.message})`)}`);
    console.log(`  ${dim('Usual cause: the tab was never completed, or the callback timed out.')}`);
    console.log(`  ${dim('Fallback that needs no browser at all:')}`);
    console.log(`  ${b('npx expo login --no-browser')}`);
    return false;
  }
  return true;
}

/**
 * Make sure an Expo session exists, or create one. Tunnel mode on SDK 58 refuses
 * to start without it. Two routes: `--no-browser` (password typed in this
 * terminal) or the browser route above. Returns the identity, or null.
 */
async function ensureExpoLogin() {
  // Already signed in? Skip the whole flow.
  const existing = expoWhoami();
  if (existing) {
    console.log(`  ${ok(`Already signed in as ${b(existing)}`)}`);
    return existing;
  }

  const how = await select({
    message: 'Tunnel mode needs an Expo account. How do you want to sign in?',
    choices: [
      {
        name: `${c.green}▶${c.reset}  Email + password, right here in the terminal  ${c.dim}(recommended — no browser)${c.reset}`,
        value: 'terminal',
        description: 'npx expo login --no-browser  ·  password prompt appears in this window',
      },
      {
        name: '  🌐  Browser sign-in on expo.dev',
        value: 'browser',
        description: 'we open the link for you  ·  avoids the broken cmd /c start path',
      },
      {
        name: '  ⏭️   Skip — I already signed in from another terminal',
        value: 'skip',
        description: 'just re-check whether a session exists',
      },
    ],
  });

  if (how === 'skip') return expoWhoami();
  if (how === 'browser') {
    await browserLogin();
  } else {
    const email = await input({
      message: 'Expo email (the one you use on expo.dev)',
      validate: (v) =>
        /.+@.+\..+/.test(v) ? true : 'Enter the email you registered with expo.dev',
    });

    console.log(`\n  ${info(`Running: ${b('npx expo login --no-browser')}`)}`);
    console.log(`  ${dim(`Username: ${email}`)}`);
    console.log(
      `  ${dim('Next: type your password in this terminal when asked (it stays hidden).')}`,
    );
    console.log(`  ${dim('2FA enabled? Expo will then ask for a one-time code too.')}`);
    console.log('');

    // --no-browser prompts on stdin, which must be a real interactive TTY.
    if (!process.stdin.isTTY) {
      console.log(`  ${warn('stdin is not an interactive terminal — Expo cannot prompt here.')}`);
      console.log(`  ${dim('Open a regular PowerShell / Windows Terminal window and run:')}`);
      console.log(`  ${b('npx expo login --no-browser')}  ${dim('(inside apps/mobile)')}`);
      console.log(`  ${dim('…then come back and pick “Skip — already signed in”.')}`);
      return null;
    }

    try {
      await run(`npx expo login --no-browser -u ${email}`, { cwd: MOBILE });
    } catch (e) {
      console.log(`\n  ${fail(`Login did not complete (${e.message})`)}`);
      console.log(
        `  ${dim('If Expo printed a credential error, re-check the email and password.')}`,
      );
      console.log(
        `  ${dim('If it printed “non-interactive mode”, run it from a plain terminal:')}`,
      );
      console.log(`  ${b('npx expo login --no-browser')}`);
      return null;
    }
  }

  const who = expoWhoami();
  if (who) console.log(`  ${ok(`Signed in as ${b(who)}`)}`);
  else console.log(`  ${warn('Login command finished, but no Expo session was detected.')}`);
  return who;
}

async function startMobile() {
  panel(`${c.bold}${c.blue}📱  Mobile dev server — guided launch${c.reset}`, [
    dim('Expo SDK 58 · React Native · Android-first'),
    dim('Four quick steps: environment → connection → pre-flight → start.'),
  ]);

  // ── Step 1 · environment check ────────────────────────────────────────────
  step(1, MOBILE_TOTAL_STEPS, 'Environment check');
  const checks = [];

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  checks.push([
    nodeMajor === 24 ? ok('Node.js') : warn('Node.js'),
    `${process.version}${nodeMajor === 24 ? '' : c.yellow + '  (repo targets Node 24 — see .nvmrc)' + c.reset}`,
  ]);

  const expoBin =
    existsSync(resolve(ROOT, 'node_modules', '.bin', 'expo.cmd')) ||
    existsSync(resolve(ROOT, 'node_modules', '.bin', 'expo')) ||
    existsSync(resolve(MOBILE, 'node_modules', '.bin', 'expo.cmd')) ||
    existsSync(resolve(MOBILE, 'node_modules', '.bin', 'expo'));
  checks.push([
    expoBin ? ok('Dependencies') : fail('Dependencies'),
    expoBin ? 'expo CLI available' : 'run  npm ci  from the repository root first',
  ]);

  let envOk = existsSync(MOBILE_ENV);
  checks.push([
    envOk ? ok('apps/mobile/.env') : warn('apps/mobile/.env'),
    envOk ? 'present' : 'missing — can create from .env.example now',
  ]);

  for (const [icon, detail] of checks) console.log(`  ${icon}  ${detail}`);

  if (!expoBin) {
    console.log(
      `\n  ${fail('Expo CLI not found.')} Run ${b('npm ci')} from the repository root, then start this guide again.`,
    );
    return;
  }

  if (!envOk) {
    const create = await confirm({
      message: 'Create apps/mobile/.env from .env.example now?',
      default: true,
    });
    if (create) {
      copyFileSync(MOBILE_ENV_EXAMPLE, MOBILE_ENV);
      console.log(`  ${ok('Created apps/mobile/.env.')}`);
    } else {
      console.log(`  ${warn('Skipping .env — API calls will fail until it exists.')}`);
    }
  }

  // ── Step 2 · connection mode ──────────────────────────────────────────────
  step(2, MOBILE_TOTAL_STEPS, 'How will you open the app?');
  const tunnelHint = `${c.green}▶${c.reset} 🌐  Tunnel — works on any network  ${c.dim}(recommended · npm run mobile:tunnel)${c.reset}`;
  let connection = await select({
    message: 'Choose your device/connection setup',
    choices: [
      {
        name: tunnelHint,
        value: 'tunnel',
        description:
          'port 8083 · phone needs internet only · no Wi-Fi/firewall setup · requires Expo login once',
      },
      {
        name: '  📶  Phone on the same Wi-Fi as this laptop',
        value: 'lan',
        description: 'LAN mode · port 8082 · firewall rule already applied',
      },
      {
        name: '  🔥  Laptop connected to the phone\u2019s hotspot',
        value: 'hotspot',
        description: 'LAN mode · port 8082 · Windows may flag hotspot as Public network',
      },
      {
        name: '  🤖  Android emulator on this laptop',
        value: 'android',
        description: 'Opens directly on the running AVD · no phone needed',
      },
    ],
  });

  const tips = {
    lan: [
      'Both devices are on the same Wi-Fi. Scan the QR with the phone camera → open in Expo Go.',
      'If unreachable: open  http://<laptop-ip>:8082/status  on the phone.',
      'A healthy Metro server answers:  packager-status:running',
    ],
    hotspot: [
      "The laptop is on the phone's own hotspot — same subnet, so LAN mode works.",
      'Windows often classifies hotspots as a Public network; the existing 8082 rule covers Private only.',
      'If the phone cannot connect, run this in an Administrator PowerShell:',
      '  New-NetFirewallRule -DisplayName "Metro 8082 (Public)" -Direction Inbound `',
      '    -Action Allow -Protocol TCP -LocalPort 8082 -Program (Get-Command node).Source -Profile Public',
    ],
    tunnel: [
      "Tunnel routes through Expo's servers — both devices only need internet.",
      'No shared Wi-Fi, no firewall rules, no IP typing. Works anywhere.',
      'SDK 58 requires an Expo account; login is verified in the next step.',
      'Slightly higher latency than LAN — fine for development.',
      'Command:  npm run mobile:tunnel   (port 8083)',
    ],
    android: [
      'Start an AVD in Android Studio → Device Manager before launching.',
      'Verify visibility with  adb devices  in a separate terminal.',
    ],
  };
  console.log('');
  panel(
    'How this works',
    tips[connection].map((l) => dim(l)),
    { accent: c.cyan },
  );

  // ── Step 3 · pre-flight ───────────────────────────────────────────────────
  step(3, MOBILE_TOTAL_STEPS, 'Pre-flight checks');
  const preflight = [];

  if (connection === 'tunnel') {
    let who = expoWhoami();
    if (who) {
      preflight.push([ok('Expo account'), `signed in as ${who}`]);
    } else {
      preflight.push([warn('Expo account'), 'not signed in — tunnel mode requires one Expo login']);
      console.log('');
      who = await ensureExpoLogin();
      if (who) {
        preflight[preflight.length - 1] = [ok('Expo account'), `signed in as ${who}`];
      } else {
        preflight[preflight.length - 1] = [fail('Expo account'), 'still not signed in'];
        console.log(`\n  ${warn('Tunnel will not start without an Expo session.')}`);
        const fallback = await select({
          message: 'What now?',
          choices: [
            { name: 'Switch to LAN instead (no login needed)', value: 'lan' },
            { name: 'Continue anyway and sign in later', value: 'continue' },
            { name: 'Cancel launch', value: 'cancel' },
          ],
        });
        if (fallback === 'cancel') {
          console.log(`\n  ${dim('Launch cancelled.')}`);
          return;
        }
        if (fallback === 'lan') {
          connection = 'lan';
          console.log(`  ${info('Switched to LAN mode (port 8082).')}`);
        }
      }
    }
  }

  if (connection === 'android') {
    const devices = tryShell('adb devices');
    const hasAvd = devices && /\tdevice/.test(devices);
    preflight.push([
      hasAvd ? ok('Android emulator') : warn('Android emulator'),
      hasAvd ? 'device visible via adb' : 'no device from adb — start an AVD in Android Studio',
    ]);
  }

  if (connection === 'lan' || connection === 'hotspot') {
    const ips = getLanIPs();
    preflight.push([
      ips.length ? ok('Network interfaces') : warn('Network interfaces'),
      ips.length
        ? `this machine: ${ips.join(', ')}:8082`
        : 'no non-internal IPv4 found — check the connection',
    ]);
    if (connection === 'hotspot' && ips.length) {
      console.log(
        `\n  ${dim('Tip: the phone should reach the hotspot-side IP (usually 172.16–192.168.x.x).')}`,
      );
    }
  }

  const wantedPort = connection === 'tunnel' ? 8083 : 8082;
  const portBusy = tryShell(`netstat -ano | findstr ":${wantedPort}" | findstr "LISTENING"`);
  preflight.push([
    portBusy ? warn(`Port ${wantedPort}`) : ok(`Port ${wantedPort}`),
    portBusy
      ? 'already in use — stop the other Metro session first (a stale session can cause EBUSY/npm issues)'
      : 'free',
  ]);

  for (const [icon, detail] of preflight) console.log(`  ${icon}  ${detail}`);

  // ── Step 4 · summary + launch ─────────────────────────────────────────────
  step(4, MOBILE_TOTAL_STEPS, 'Ready');
  const script = {
    lan: 'mobile:lan',
    hotspot: 'mobile:lan',
    tunnel: 'mobile:tunnel',
    android: 'android',
  }[connection];
  const modeLabel = {
    lan: 'LAN (same Wi-Fi)',
    hotspot: 'LAN (phone hotspot)',
    tunnel: 'Tunnel (any network)',
    android: 'Android emulator',
  }[connection];

  const isTunnel = connection === 'tunnel';
  panel(
    `Session summary${isTunnel ? `  ${c.green}★ recommended: tunnel${c.reset}` : ''}`,
    [
      `  Mode     ${isTunnel ? c.green + b(modeLabel) + c.reset : b(modeLabel)}`,
      `  Command  ${isTunnel ? c.green + b(`npm run ${script}`) + c.reset : b(`npm run ${script}`)}`,
      `  Port     ${connection === 'android' ? dim('default (8081)') : b(String(wantedPort))}`,
      `  Next     ${dim('a QR code appears in the terminal — scan it with the phone camera')}`,
    ],
    { accent: isTunnel ? c.green : c.magenta },
  );

  if (!(await confirm({ message: 'Launch now?', default: true }))) {
    console.log(`\n  ${dim('Launch skipped. You can return via the menu.')}`);
    return;
  }

  console.log(`\n${info(`Running: npm run ${b(script)}`)}\n`);
  await run(`npm run ${script}`);
}

// ── ENSURE POSTGRES ──────────────────────────────────────────────────────────
// Reuse-or-start local Postgres (pgvector). Shared by the full-stack launcher
// and the backend-only path so a solo `./gradlew run` can be DB-ready in one
// step. Returns true when a database is reachable (already running or just
// started); false when the user declines or Docker is unavailable.
async function ensurePostgres(s) {
  if (tryShell('netstat -ano | findstr ":5432" | findstr "LISTENING"')) {
    console.log(`  ${ok('Postgres already listening on :5432 — reusing it.')}`);
    return true;
  }
  if (!s.dockerInstalled) {
    console.log(
      `  ${warn('Docker not installed — start Postgres yourself, else the API runs degraded.')}`,
    );
    return false;
  }
  const start = await confirm({
    message: 'Start Postgres (pgvector) via Docker now?',
    default: true,
  });
  if (!start) {
    console.log(`  ${warn('Skipping Postgres — the API starts but DB-backed routes return 503.')}`);
    return false;
  }
  const exists = (tryShell('docker ps -a --format "{{.Names}}"') ?? '').includes('recipe-pg');
  const cmd = exists
    ? 'docker start recipe-pg'
    : 'docker run -d --name recipe-pg -e POSTGRES_USER=recipe -e POSTGRES_PASSWORD=recipe -e POSTGRES_DB=recipe_dev -p 5432:5432 pgvector/pgvector:pg16';
  await run(cmd).catch(() => {});
  console.log(`  ${ok('Postgres up on localhost:5432 (db recipe_dev, user/pass recipe).')}`);
  return true;
}

// ── START BACKEND API ────────────────────────────────────────────────────────
async function startBackend() {
  const s = workspaceStatus();
  section('Backend API — Kotlin / Ktor');

  if (!s.apiHasSrc) {
    console.log(warn('apps/api has no Kotlin sources yet. Ticket SETUP-02 has not been started.'));
    console.log(dim('  The folder is a placeholder. Gradle build files and Kotlin source will'));
    console.log(dim('  be added when SETUP-02 is implemented.'));
    console.log('');

    const continueAnyway = await confirm({
      message: 'Show SETUP-02 setup checklist anyway?',
      default: false,
    });
    if (!continueAnyway) return;
  }

  // Only Java + the Gradle wrapper are truly required to run the API; the
  // wrapper is checked by file presence (a global `gradle` is never needed).
  // Docker / Postgres are OPTIONAL — without them the API boots and DB routes
  // return 503 (graceful degradation), so they must never block the run.
  const hasWrapper = existsSync(resolve(API, 'gradlew.bat')) || existsSync(resolve(API, 'gradlew'));

  const required = [
    {
      label: 'Java JDK 21 (Temurin recommended)',
      installed: s.javaInstalled,
      hint: 'winget install EclipseAdoptium.Temurin.21.JDK',
    },
    {
      label: 'Gradle wrapper (apps/api/gradlew)',
      installed: hasWrapper,
      hint: 'Missing — the wrapper files were not found in apps/api',
    },
  ];
  const optional = [
    {
      label: 'Docker Desktop (for local Postgres)',
      installed: s.dockerInstalled,
      hint: 'Optional — without a DB, /healthz and /api/v1/recipes return 503',
    },
    {
      label: 'Postgres running on :5432',
      installed: !!tryShell('netstat -ano | findstr ":5432" | findstr "LISTENING"'),
      hint: 'Optional — start it via "Local infrastructure (Docker)" or the full-stack launcher',
    },
  ];

  console.log(b('Required:') + '\n');
  for (const p of required) {
    console.log(`  ${p.installed ? ok(p.label) : fail(p.label)}`);
    if (!p.installed) console.log(`    ${dim(p.hint)}`);
  }
  console.log(`\n${b('Optional:')}`);
  for (const p of optional) {
    console.log(`  ${p.installed ? ok(p.label) : warn(p.label)}`);
  }

  if (!required.every((p) => p.installed)) {
    console.log(`\n${warn('Missing a required tool. Resolve the ✘ items above, then retry.')}`);
    return;
  }

  // A solo backend run can be DB-ready in one step: if nothing is listening on
  // :5432, offer to start Postgres — the same reuse-or-start logic the
  // full-stack launcher uses, so both paths behave identically.
  if (!tryShell('netstat -ano | findstr ":5432" | findstr "LISTENING"')) {
    console.log('');
    await ensurePostgres(s);
  }

  console.log('');
  const what = await select({
    message: 'What do you want to run?',
    choices: [
      {
        name: '🔥  Run with hot reload (server + continuous compile)',
        value: 'gradle-watch',
        description:
          './gradlew run  +  ./gradlew -t classes — edit a .kt file and it reloads (Ctrl+C stops both)',
      },
      {
        name: 'Gradle build + run Ktor server (no reload)',
        value: 'gradle-run',
        description: './gradlew run — start Ktor on http://localhost:8080',
      },
      { name: 'Gradle tests only', value: 'gradle-test', description: './gradlew test' },
      {
        name: 'Just show the startup commands',
        value: 'info',
        description: 'Copy-paste reference',
      },
    ],
  });

  if (what === 'info') {
    console.log(`\n${b('From apps/api:')}
  ${dim('./gradlew run')}            # start Ktor on http://localhost:8080
  ${dim('./gradlew -t classes')}     # in a 2nd terminal: recompile on change → autoreload
  ${dim('./gradlew test')}           # run unit tests
  ${dim('./gradlew build')}          # build a fat JAR

  ${dim('Hot reload = a one-shot build, then the server + a watcher; the "run with hot reload" option does it for you.')}
`);
    return;
  }

  if (what === 'gradle-watch') {
    console.log(`\n${info('Hot reload:  api = ./gradlew run   ·   watch = ./gradlew -t classes')}`);
    console.log(
      dim('  Building once first so the server and watcher never compile at the same time…\n'),
    );
    // One-shot, serialized build. Launching `run` and `-t classes` cold together
    // makes two Kotlin daemons grab the same incremental cache and crash
    // ("Storage … source-to-classes.tab is already registered"), which then
    // surfaces as bogus "unresolved reference" errors. Precompiling once means
    // both start up-to-date and only the watcher recompiles on later edits.
    await run('gradlew.bat classes', { cwd: API });
    console.log('');
    await runConcurrent([
      { name: 'api', command: 'gradlew.bat run', cwd: API, color: c.blue },
      {
        name: 'watch',
        command: 'gradlew.bat -t classes',
        cwd: API,
        color: c.cyan,
        delayMs: 8000,
      },
    ]);
    console.log(`\n  ${ok('Backend stopped.')}\n`);
    return;
  }

  const gradleCmd = what === 'gradle-run' ? ['run'] : ['test'];
  console.log(`\n${info(`Running: ./gradlew ${gradleCmd.join(' ')}`)}\n`);
  await run(`gradlew.bat ${gradleCmd.join(' ')}`, { cwd: API });
}

// ── FULL STACK: backend + mobile together ────────────────────────────────────
async function startFullStack() {
  const s = workspaceStatus();
  panel(`${c.bold}${c.green}🚀  Full stack — Ktor API + Expo mobile, one terminal${c.reset}`, [
    dim('Brings up Postgres (Docker) → Ktor (./gradlew run) → Metro together.'),
    dim('Output is tagged  api │ metro │  —  Ctrl+C stops everything at once.'),
  ]);

  if (!s.apiHasSrc) {
    console.log(`\n  ${fail('apps/api has no Kotlin sources yet — build the backend first.')}`);
    return;
  }

  // 1) Database — reuse a running Postgres if present, else start one.
  //    Shared with the backend-only launcher (ensurePostgres) so both behave
  //    identically: re-check :5432, offer to start recipe-pg, report honestly.
  const dbReady = await ensurePostgres(s);

  // 2) API env file — create from the example if missing.
  const apiExample = resolve(API, '.env.example');
  if (!existsSync(API_ENV) && existsSync(apiExample)) {
    copyFileSync(apiExample, API_ENV);
    console.log(`  ${ok('Created apps/api/.env from .env.example (local dev defaults).')}`);
  }

  // 3) How the device reaches this machine → the API base URL mobile will use.
  const mode = await select({
    message: 'How will the phone/emulator reach this PC?',
    choices: [
      { name: '🤖  Android emulator on this laptop   (API at 10.0.2.2)', value: 'android' },
      { name: '📶  Phone on the same Wi-Fi   (API at this PC\u2019s LAN IP)', value: 'lan' },
      { name: '🌐  Metro via tunnel   (API still reached over LAN IP)', value: 'tunnel' },
    ],
  });

  const ips = getLanIPs();
  let apiUrl =
    mode === 'android'
      ? 'http://10.0.2.2:8080'
      : ips.length
        ? `http://${ips[0]}:8080`
        : 'http://localhost:8080';
  apiUrl = await input({ message: 'EXPO_PUBLIC_API_URL for the mobile app', default: apiUrl });

  // Persist it so the app actually reads the right address.
  if (!existsSync(MOBILE_ENV) && existsSync(MOBILE_ENV_EXAMPLE))
    copyFileSync(MOBILE_ENV_EXAMPLE, MOBILE_ENV);
  if (existsSync(MOBILE_ENV)) {
    writeFileSync(
      MOBILE_ENV,
      readFileSync(MOBILE_ENV, 'utf8').replace(
        /^EXPO_PUBLIC_API_URL=.*/m,
        `EXPO_PUBLIC_API_URL=${apiUrl}`,
      ),
      'utf8',
    );
    console.log(`  ${ok(`mobile → ${b(apiUrl)}`)}`);
    if (mode === 'tunnel')
      console.log(
        `  ${dim('Note: tunnel carries Metro only — the phone still needs to reach this LAN IP for API calls.')}`,
      );
  }

  const mobileScript = { android: 'android', lan: 'mobile:lan', tunnel: 'mobile:tunnel' }[mode];

  console.log('');
  panel(
    'Launching',
    [
      `  ${c.blue}api${c.reset}   ${dim('./gradlew run  →  http://localhost:8080')}`,
      `  ${c.cyan}watch${c.reset} ${dim('./gradlew -t classes  →  hot reload on .kt edits')}`,
      `  ${c.magenta}metro${c.reset} ${dim(`npm run ${mobileScript}`)}`,
      dbReady
        ? `  ${c.green}db${c.reset}   ${dim('postgres :5432 (recipe_dev)')}`
        : `  ${dim('db     (not started)')}`,
      `  ${dim('Ctrl+C stops all of them.')}`,
    ],
    { accent: c.green },
  );

  if (!(await confirm({ message: 'Launch full stack now?', default: true }))) {
    console.log(`\n  ${dim('Cancelled.')}\n`);
    return;
  }

  // Serialized one-shot build first: prevents the API server and the hot-reload
  // watcher from running compileKotlin concurrently (two Kotlin daemons on one
  // incremental cache crash each other). After this both start up-to-date.
  console.log(`\n  ${info('Preparing backend build (one-shot)…')}`);
  await run('gradlew.bat classes', { cwd: API });

  console.log('');
  await runConcurrent([
    { name: 'api', command: 'gradlew.bat run', cwd: API, color: c.blue },
    { name: 'watch', command: 'gradlew.bat -t classes', cwd: API, color: c.cyan, delayMs: 8000 },
    { name: 'metro', command: `npm run ${mobileScript}`, cwd: ROOT, color: c.magenta },
  ]);
  console.log(`\n  ${ok('Full stack stopped.')}\n`);
}

// ── LOCAL INFRASTRUCTURE (Docker) ────────────────────────────────────────────
async function startInfra() {
  const s = workspaceStatus();
  section('Local infrastructure — Docker Compose');

  if (!s.dockerInstalled) {
    console.log(fail('Docker is not installed or not on PATH.'));
    console.log(dim('  Install Docker Desktop: https://www.docker.com/products/docker-desktop/'));
    console.log(dim('  After installing, restart your terminal and retry.'));
    return;
  }

  console.log(ok('Docker is installed: ' + dim(tryShell('docker --version'))));

  if (!s.hasDockerCompose) {
    console.log(`\n${warn('infra/docker-compose.yml does not exist yet (SETUP-03 not started).')}`);
    const scaffold = await confirm({
      message: 'Create a starter docker-compose.yml for Postgres + pgvector?',
      default: true,
    });
    if (scaffold) await scaffoldCompose();
    return;
  }

  console.log(ok('infra/docker-compose.yml exists.'));
  const services = await checkbox({
    message: 'Which services to start?',
    choices: [
      { name: 'PostgreSQL + pgvector (port 5432)', value: 'postgres', checked: true },
      { name: 'Ollama local — embeddings only (port 11434)', value: 'ollama', checked: true },
      { name: 'SearXNG metasearch (port 8888)', value: 'searxng', checked: false },
      { name: 'All services', value: 'all' },
    ],
  });

  const svcList = services.includes('all') ? [] : services;
  const args = ['compose', '-f', 'infra/docker-compose.yml', 'up', '-d', ...svcList];
  console.log(`\n${info(`Running: docker ${args.join(' ')}`)}\n`);
  await run(`docker ${args.join(' ')}`);
  console.log(
    `\n${ok('Services started.')} ${dim('Verify with: docker compose -f infra/docker-compose.yml ps')}`,
  );
}

async function scaffoldCompose() {
  const infraDir = resolve(ROOT, 'infra');
  if (!existsSync(infraDir)) {
    // Create dir — use fs
    execSync(`mkdir -p "${infraDir}"`, { shell: true });
  }

  const composeContent = `# recipe-app local development infrastructure
# Ticket SETUP-03 — PostgreSQL + pgvector
# Usage: docker compose -f infra/docker-compose.yml up -d

services:
  postgres:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    environment:
      POSTGRES_DB: recipe_dev
      POSTGRES_USER: recipe
      POSTGRES_PASSWORD: recipe
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U recipe -d recipe_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Uncomment when Ollama embeddings are needed (SETUP-03 / BL-xxx ingestion):
  # ollama:
  #   image: ollama/ollama:latest
  #   restart: unless-stopped
  #   ports:
  #     - "11434:11434"
  #   volumes:
  #     - ollama_data:/root/.ollama
  #   # Pull embedding model after first start:
  #   # docker exec <container> ollama pull nomic-embed-text

  # Uncomment when SearXNG search is needed (AI agent runner):
  # searxng:
  #   image: searxng/searxng:latest
  #   restart: unless-stopped
  #   ports:
  #     - "8888:8080"
  #   volumes:
  #     - ./searxng:/etc/searxng

volumes:
  postgres_data:
  # ollama_data:
`;

  writeFileSync(DOCKER_COMPOSE, composeContent, 'utf8');
  console.log(
    `\n${ok('Created: infra/docker-compose.yml')} ${dim('(PostgreSQL + pgvector; Ollama/SearXNG commented as placeholders)')}`,
  );
  const startNow = await confirm({ message: 'Start Postgres now?', default: true });
  if (startNow) {
    console.log('');
    await run('docker compose -f infra/docker-compose.yml up -d postgres');
    console.log(`\n${ok('Postgres started on port 5432.')}`);
    console.log(dim('  DB:  recipe_dev'));
    console.log(dim('  User: recipe'));
    console.log(dim('  Pass: recipe  (local dev only — never use in production)'));
  }
}

// ── API CONTRACT / types generation ─────────────────────────────────────────
async function apiContract() {
  const s = workspaceStatus();
  section('API Contract — packages/api-contract');

  if (!s.contractHasYaml) {
    console.log(warn('No openapi.yaml or openapi.json found in packages/api-contract.'));
    console.log(dim('  The contract is generated from the Ktor API once SETUP-02 is implemented.'));
    console.log('');
    console.log(b('Planned workflow (from ARCHITECTURE.md):'));
    console.log(
      dim('  1. Ktor auto-generates openapi.yaml at build time (via ktor-server-openapi plugin)'),
    );
    console.log(dim('  2. Spec is saved to packages/api-contract/openapi.yaml'));
    console.log(dim('  3. openapi-typescript generates TS types into apps/mobile/src/api-types/'));
    console.log('');
    const simulate = await confirm({
      message: 'Create a placeholder openapi.yaml now?',
      default: false,
    });
    if (simulate) {
      writeFileSync(
        resolve(CONTRACT, 'openapi.yaml'),
        'openapi: "3.1.0"\ninfo:\n  title: Recipe App API\n  version: "0.0.0"\npaths: {}\n',
        'utf8',
      );
      console.log(ok('Created packages/api-contract/openapi.yaml (empty scaffold).'));
    }
    return;
  }

  console.log(ok('openapi.yaml found in packages/api-contract.'));
  const action = await select({
    message: 'What do you want to do?',
    choices: [
      {
        name: 'Generate TypeScript types',
        value: 'gen',
        description: 'npx openapi-typescript → apps/mobile/src/api-types/',
      },
      { name: 'Validate the spec', value: 'validate', description: 'npx @redocly/cli lint' },
      { name: 'Show current spec summary', value: 'show', description: 'Print endpoints' },
    ],
  });

  if (action === 'gen') {
    console.log(`\n${info('Generating types…')}\n`);
    await run(
      'npx openapi-typescript packages/api-contract/openapi.yaml -o apps/mobile/src/api-types/generated.ts',
    );
    console.log(`\n${ok('Types written to apps/mobile/src/api-types/generated.ts')}`);
  } else if (action === 'validate') {
    await run('npx @redocly/cli lint packages/api-contract/openapi.yaml');
  } else {
    const spec = readFileSync(resolve(CONTRACT, 'openapi.yaml'), 'utf8');
    const paths = spec.match(/^\s{2}(\/\S*)/gm) ?? [];
    console.log(
      paths.length ? `\n  ${b('Endpoints:')} ${paths.join(', ')}` : '\n  (no paths defined yet)',
    );
  }
}

// ── ENVIRONMENT SETUP ─────────────────────────────────────────────────────────
async function setupEnvs() {
  section('Environment files');

  const envTargets = [
    { path: MOBILE_ENV, label: 'apps/mobile/.env', needed: true },
    { path: API_ENV, label: 'apps/api/.env', needed: existsSync(resolve(API, 'src/main/kotlin')) },
    {
      path: resolve(ROOT, 'infra', '.env'),
      label: 'infra/.env (Docker secrets)',
      needed: existsSync(DOCKER_COMPOSE),
    },
  ];

  for (const { path, label, needed } of envTargets) {
    const exists = existsSync(path);
    const icon = exists
      ? ok(label)
      : needed
        ? warn(`${label} — missing`)
        : dim(`${label} — not needed yet`);
    console.log(`  ${icon}`);
  }
  console.log('');

  const pick = await select({
    message: 'Set up which environment file?',
    choices: [
      { name: 'apps/mobile/.env', value: 'mobile' },
      {
        name: 'infra/.env (DB password, Ollama key)',
        value: 'docker',
        description: 'local dev secrets — never commit',
      },
      {
        name: 'apps/api/.env (Ktor)',
        value: 'api',
        description: 'DB URL, JWT secret, Ollama Cloud key',
      },
    ],
  });

  if (pick === 'mobile') {
    if (existsSync(MOBILE_ENV)) {
      console.log(ok('apps/mobile/.env already exists.'));
      if (!(await confirm({ message: 'Overwrite from .env.example?' }))) return;
    } else {
      copyFileSync(MOBILE_ENV_EXAMPLE, MOBILE_ENV);
      console.log(ok('Created apps/mobile/.env from .env.example.'));
    }
    const apiUrl = await input({
      message: 'EXPO_PUBLIC_API_URL',
      default: 'http://10.0.2.2:8080',
      validate: (v) => v.startsWith('http') || 'Must start with http:// or https://',
    });
    writeFileSync(
      MOBILE_ENV,
      readFileSync(MOBILE_ENV, 'utf8').replace(
        /^EXPO_PUBLIC_API_URL=.*/m,
        `EXPO_PUBLIC_API_URL=${apiUrl}`,
      ),
      'utf8',
    );
    console.log(ok(`EXPO_PUBLIC_API_URL → ${b(apiUrl)}`));
    console.log(dim('\n  Android emulator → http://10.0.2.2:8080  (host PC backend)'));
    console.log(dim('  Physical phone   → http://<LAN-IP>:8080\n'));
  }

  if (pick === 'docker') {
    const envPath = resolve(ROOT, 'infra', '.env');
    if (!existsSync(envPath)) {
      writeFileSync(
        envPath,
        [
          '# Local development secrets only — NEVER commit this file.',
          '# Add infra/.env to .gitignore before using.',
          'POSTGRES_DB=recipe_dev',
          'POSTGRES_USER=recipe',
          'POSTGRES_PASSWORD=recipe',
          '',
        ].join('\n'),
        'utf8',
      );
      console.log(ok('Created infra/.env with local dev defaults.'));
    } else {
      console.log(ok('infra/.env already exists.'));
    }
    console.log(dim('\n  ⚠  Add "infra/.env" to your .gitignore if you haven\'t already.\n'));
  }

  if (pick === 'api') {
    const apiExample = resolve(API, '.env.example');
    if (!existsSync(apiExample)) {
      console.log(warn('No apps/api/.env.example found yet.'));
      return;
    }
    if (
      existsSync(API_ENV) &&
      !(await confirm({ message: 'apps/api/.env exists — overwrite from .env.example?' }))
    )
      return;
    copyFileSync(apiExample, API_ENV);
    console.log(ok('Created apps/api/.env from .env.example.'));
    console.log(dim('  DATABASE_URL / DATABASE_USER / DATABASE_PASSWORD / JWT_SECRET'));
    console.log(dim('  Defaults target the local Postgres (recipe_dev / recipe / recipe).\n'));
  }
}

// ── RUN CHECKS ────────────────────────────────────────────────────────────────
async function runChecks() {
  section('Project checks');
  const steps = [
    { label: 'TypeScript  (mobile)', cmd: 'npm run typecheck --workspace=@recipe-app/mobile' },
    { label: 'ESLint      (mobile)', cmd: 'npm run lint --workspace=@recipe-app/mobile' },
    { label: 'Jest        (mobile)', cmd: 'npm run test:ci --workspace=@recipe-app/mobile' },
    { label: 'Prettier    (root)', cmd: 'npm run format:check' },
  ];

  let passed = 0;
  for (const { label, cmd } of steps) {
    process.stdout.write(`  ${info(label.padEnd(24))}`);
    try {
      execSync(cmd, { cwd: ROOT, stdio: 'pipe' });
      console.log(c.green + 'PASS' + c.reset);
      passed++;
    } catch {
      console.log(c.red + 'FAIL' + c.reset);
    }
  }
  console.log('');
  if (passed === steps.length) console.log(ok(b('All checks passed.')));
  else
    console.log(
      warn(
        `${b(`${passed}/${steps.length} passed`)} — run the failing commands manually for full output.`,
      ),
    );
}

// ── APP FLOW GUIDE (guest vs authenticated) ────────────────────────────────
async function appFlowGuide() {
  panel(`${c.bold}${c.blue}🧭  App flow guide — what to do in the app${c.reset}`, [
    dim('Route gating lives in apps/mobile/src/app/_layout.tsx (Stack.Protected).'),
    dim('Pick a flow to walk through step by step.'),
  ]);

  const pick = await select({
    message: 'Which flow do you want to explore?',
    choices: [
      { name: '🆙  First run — onboarding & welcome', value: 'first' },
      { name: '👻  Guest (not authenticated) — what works', value: 'guest' },
      { name: '🔐  Authenticated — what unlocks', value: 'auth' },
      { name: '🗺️   Full route map & guards', value: 'map' },
    ],
  });

  if (pick === 'first') {
    panel(
      'First run',
      [
        b('  1. Onboarding (3 slides)'),
        dim('     Route: /onboarding — shown until onboarding.completed is stored.'),
        dim('     Swipe through, then Continue. State persists in local storage.'),
        b('  2. Welcome'),
        dim('     Route: /welcome — shown once, until welcomeCompleted.'),
        b('  3. Tabs shell'),
        dim('     Discover · Saved · Shopping · Assistant · Profile.'),
        b('  Replay anytime'),
        dim('     Profile tab → “Replay onboarding” (resets local onboarding state).'),
      ],
      { accent: c.cyan },
    );
  }

  if (pick === 'guest') {
    panel(
      'Guest flow — no account needed',
      [
        dim('  Guard: onboarding completed. No token required. All local-first.'),
        b('  Try these as a guest:'),
        dim('     Discover (tabs/index) → open a recipe → /recipe/[id]'),
        dim('     Search (/search) · Report a gap (/report) · Downloads (/downloads)'),
        dim('     Saved / favorites  → SQLite repository, on-device only'),
        dim('     Shopping list      → SQLite, add & check items'),
        dim('     Cooking mode (/cooking/[id]) → keeps the screen awake'),
        b('  Profile tab shows “Welcome, guest” with a Sign in button.'),
        warn('  /account/* routes are NOT reachable — Stack.Protected requires a token.'),
      ],
      { accent: c.cyan },
    );
  }

  if (pick === 'auth') {
    panel(
      'Authenticated flow — current reality',
      [
        warn('  Sign-in is a PLACEHOLDER. No server auth exists yet (SETUP-02).'),
        dim('  /sign-in and /create-account are only visible while signed out'),
        dim('  (guard: onboarding.completed && !token). They render the form but'),
        dim('  cannot create a real session until the Ktor API ships /auth/*.'),
        b('  What a real token would unlock:'),
        dim('     (account)/history  — Stack.Protected guard={!!token}'),
        dim('     (account)/subscription'),
        dim('     Profile tab becomes “Your account” with a Sign out button'),
        b('  How the session works in code:'),
        dim('     establishSession(token) → expo-secure-store → useSession()'),
        dim('     signOut() clears SecureStore + query cache.'),
        dim('     On web preview, tokens stay in memory only.'),
        b('  To test gating before the API:'),
        dim('     1. Start the app (this guide → Launch the mobile app).'),
        dim('     2. Verify /account is blocked as guest (Profile → no account routes).'),
        dim('     3. After SETUP-02: sign in for real, then re-check /account/*.'),
      ],
      { accent: c.yellow },
    );
  }

  if (pick === 'map') {
    const map = [
      ['onboarding', 'completed == null', 'first-run slides', 'local storage'],
      ['welcome', 'completed && !welcomeCompleted', 'guest CTA / sign-in entry', 'local storage'],
      [
        '(tabs) *',
        'onboarding done',
        'Discover, Saved, Shopping, Assistant, Profile',
        'SQLite (local)',
      ],
      [
        'recipe/[id], cooking/[id]',
        'onboarding done',
        'detail + step-by-step cook mode',
        'API later',
      ],
      [
        'search / downloads / report',
        'onboarding done',
        'query, offline list, gap report',
        'API later',
      ],
      [
        'sign-in, create-account',
        'onboarding done && !token',
        'account access forms',
        'placeholder — needs SETUP-02',
      ],
      ['(account)/history', 'token present', 'AI usage history', 'server-side, future'],
      ['(account)/subscription', 'token present', 'plan & entitlements', 'server-side, future'],
    ];
    console.log('');
    console.log(`  ${b('Route'.padEnd(26))}${b('Guard'.padEnd(32))}${b('Purpose')}`);
    console.log(`  ${dim('─'.repeat(84))}`);
    for (const [route, guard, purpose, note] of map) {
      console.log(
        `  ${route.padEnd(26)} ${dim(guard.padEnd(32))}${purpose}${note ? ` ${c.dim}— ${note}${c.reset}` : ''}`,
      );
    }
    console.log(
      `\n  ${dim('* tabs index: src/app/(tabs); full source: apps/mobile/src/app/_layout.tsx')}\n`,
    );
  }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const s = workspaceStatus();
  console.log(`\n${c.bold}${c.blue}`);
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║        Recipe App  ·  Dev Guide  v1.0      ║');
  console.log('  ║   Philippine Food Discovery & Recipe AI    ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log(c.reset);
  console.log(
    `  ${dot(s.mobileHasSrc)} ${b('mobile')}  ${dot(s.apiHasSrc || s.apiHasBuild)} ${b('api')}  ` +
      `${dot(s.hasDockerCompose)} ${b('infra')}  ${dot(s.contractHasYaml)} ${b('contract')}  ` +
      `${dot(s.adminHasPkg)} ${b('admin')}${c.dim}   (● ready  ○ pending)${c.reset}\n`,
  );

  while (true) {
    const choice = await select({
      message: 'What would you like to do?',
      choices: [
        {
          name: `${c.green}▶${c.reset} 🚀  Run backend + mobile together  ${c.dim}(full stack — recommended)${c.reset}`,
          value: 'fullstack',
        },
        {
          name: `📱  Launch the mobile app only  ${c.dim}(guided wizard)${c.reset}`,
          value: 'mobile',
        },
        {
          name: `🧭  App flow guide — guest vs signed-in${c.dim}  (what to do in the app)${c.reset}`,
          value: 'flow',
        },
        {
          name: `⚙️   Backend API (Kotlin/Ktor)${s.apiHasSrc ? '' : c.dim + '  — SETUP-02 not started' + c.reset}`,
          value: 'backend',
        },
        {
          name: `🐳  Local infrastructure (Docker)${s.hasDockerCompose ? '' : c.dim + '  — SETUP-03 not started' + c.reset}`,
          value: 'infra',
        },
        {
          name: `📋  API contract / generate types${s.contractHasYaml ? '' : c.dim + '  — no openapi.yaml yet' + c.reset}`,
          value: 'contract',
        },
        { name: '✅  Run project checks', value: 'checks' },
        { name: '🔧  Set up environment files', value: 'env' },
        { name: '📖  About this monorepo & architecture', value: 'about' },
        { name: '🚪  Exit', value: 'exit' },
      ],
    });

    try {
      if (choice === 'fullstack') {
        await startFullStack();
        break;
      } // concurrent launcher takes over the terminal
      if (choice === 'mobile') {
        await startMobile();
        break;
      } // dev server takes over the terminal
      if (choice === 'flow') await appFlowGuide();
      if (choice === 'backend') await startBackend();
      if (choice === 'infra') await startInfra();
      if (choice === 'contract') await apiContract();
      if (choice === 'checks') await runChecks();
      if (choice === 'env') await setupEnvs();
      if (choice === 'about') await aboutArch();
      if (choice === 'exit') {
        console.log(`\n${dim('Goodbye!')}\n`);
        break;
      }
    } catch (e) {
      if (e?.name === 'ExitPromptError') {
        console.log(`\n${dim('Cancelled.')}\n`);
        break;
      }
      console.error(`\n${fail(e.message)}\n`);
    }
  }
}

main();

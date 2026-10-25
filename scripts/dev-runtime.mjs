import { spawnSync } from 'node:child_process';
import { Socket } from 'node:net';

export const POSTGRES_COMPOSE_SERVICE = 'db';
export const PGVECTOR_IMAGE = 'pgvector/pgvector:0.8.7-pg16';

export function gradleWrapperForPlatform(platform) {
  return platform === 'win32' ? 'gradlew.bat' : './gradlew';
}

export function isTcpPortOpen(
  port,
  { host = '127.0.0.1', timeoutMs = 500, createSocket = () => new Socket() } = {},
) {
  return new Promise((resolve) => {
    const socket = createSocket();
    let settled = false;

    const finish = (isOpen) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(isOpen);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

export function classifyPostgresProbe({ status, error, stdout = '', stderr = '' }) {
  if (error?.code === 'ENOENT') return 'client-missing';
  if (error) return 'unreachable';
  if (status === 0) return 'ready';

  const output = `${stdout}\n${stderr}`;
  if (/password authentication failed|no password supplied/i.test(output)) {
    return 'credentials-rejected';
  }
  if (/database ".+" does not exist|role ".+" does not exist/i.test(output)) {
    return 'configuration-rejected';
  }
  return 'unreachable';
}

export function probeLocalPostgres({
  host = '127.0.0.1',
  port = 5432,
  database = 'recipe_dev',
  user = 'recipe',
  password = 'recipe',
} = {}) {
  const result = spawnSync(
    'psql',
    [
      '--no-password',
      `--host=${host}`,
      `--port=${port}`,
      `--username=${user}`,
      `--dbname=${database}`,
      '--command=select 1;',
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, PGPASSWORD: password, PGCONNECT_TIMEOUT: '2' },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5_000,
    },
  );

  return classifyPostgresProbe(result);
}

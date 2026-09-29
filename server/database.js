import pg from 'pg';
import { DriveError, saveEnvKeys } from './driveClient.js';

const DATABASE_ENV_KEYS = ['DATABASE_URL'];
let cache = null;

function unwrap(value) {
  const text = String(value ?? '').trim();
  const quoted = text.length >= 2 && ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")));
  return quoted ? text.slice(1, -1) : text;
}

export function readDatabaseSettings(env) {
  return { DATABASE_URL: unwrap(env.DATABASE_URL) };
}

function publicStatus(status) {
  return {
    configured: status.configured,
    connected: status.connected,
    error: status.error,
  };
}

function safeMessage(error, url) {
  const message = String(error?.message || 'Não foi possível conectar no banco.');
  if (url && message.includes(url)) return 'Não foi possível conectar no banco.';
  return message.slice(0, 180);
}

function clientOptions(url) {
  const options = { connectionString: url, connectionTimeoutMillis: 5000 };
  const local = /@(localhost|127\.0\.0\.1)(:|\/)/i.test(url);
  if (!local && !/sslmode=disable/i.test(url)) options.ssl = { rejectUnauthorized: false };
  return options;
}

async function ping(url) {
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    return {
      configured: true,
      connected: false,
      error: 'A URL precisa começar com postgres:// ou postgresql://.',
    };
  }
  const client = new pg.Client(clientOptions(url));
  try {
    await client.connect();
    await client.query('select 1');
    return { configured: true, connected: true, error: '' };
  } catch (error) {
    return { configured: true, connected: false, error: safeMessage(error, url) };
  } finally {
    await client.end().catch(() => {});
  }
}

export async function databaseStatus(env, { force = false } = {}) {
  const url = readDatabaseSettings(env).DATABASE_URL;
  if (!url) return { configured: false, connected: false, error: '' };
  if (!force && cache && cache.url === url && Date.now() - cache.at < 15000) return cache.result;
  const result = await ping(url);
  cache = { url, at: Date.now(), result };
  return result;
}

export async function saveDatabaseSettings(root, env, updates) {
  await saveEnvKeys(root, env, { DATABASE_URL: unwrap(updates.DATABASE_URL) }, DATABASE_ENV_KEYS);
  cache = null;
  const status = await databaseStatus(env, { force: true });
  return { ...readDatabaseSettings(env), ...publicStatus(status) };
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (Buffer.isBuffer(req.body)) return Promise.resolve(JSON.parse(req.body.toString('utf8')));
  if (typeof req.body === 'string' && req.body) return Promise.resolve(JSON.parse(req.body));
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      if (!raw.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw.toString('utf8')));
      } catch {
        reject(new DriveError('O pedido não veio em JSON.'));
      }
    });
    req.on('error', reject);
  });
}

export async function handleDatabaseRequest(req, res, { root, env }) {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/api/database/status') {
    sendJson(res, 200, publicStatus(await databaseStatus(env)));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/database/settings') {
    const status = await databaseStatus(env);
    sendJson(res, 200, { ...readDatabaseSettings(env), ...publicStatus(status) });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/database/settings') {
    const body = await readBody(req);
    sendJson(res, 200, await saveDatabaseSettings(root, env, body));
    return;
  }

  sendJson(res, 404, { error: 'Rota do banco não encontrada.' });
}

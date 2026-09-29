import mysql from 'mysql2/promise';
import { DriveError, saveEnvKeys } from './driveClient.js';

const DATABASE_ENV_KEYS = ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME'];
const ITEM_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const COLOR = /^#[0-9A-Fa-f]{6}$/;

const CREATE_TERRITORIOS = `
  CREATE TABLE IF NOT EXISTS territorios (
    id VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    bg_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_TAGS = `
  CREATE TABLE IF NOT EXISTS tags (
    id VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    bg_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_CLASSIFICACAO = `
  CREATE TABLE IF NOT EXISTS arquivo_classificacao (
    file_id VARCHAR(128) NOT NULL,
    territorios LONGTEXT NOT NULL,
    tags LONGTEXT NOT NULL,
    PRIMARY KEY (file_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let cache = null;
let pool = null;
let poolKey = '';
let tablesKey = '';

function unwrap(value) {
  const text = String(value ?? '').trim();
  const quoted = text.length >= 2 && ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")));
  return quoted ? text.slice(1, -1) : text;
}

export function readDatabaseSettings(env) {
  const port = unwrap(env.DATABASE_PORT) || '3306';
  return {
    DATABASE_HOST: unwrap(env.DATABASE_HOST),
    DATABASE_PORT: port,
    DATABASE_USER: unwrap(env.DATABASE_USER),
    DATABASE_PASSWORD: unwrap(env.DATABASE_PASSWORD),
    DATABASE_NAME: unwrap(env.DATABASE_NAME),
  };
}

function connectionConfig(settings) {
  const port = Number(settings.DATABASE_PORT);
  return {
    host: settings.DATABASE_HOST,
    port: Number.isInteger(port) && port > 0 && port < 65536 ? port : 3306,
    user: settings.DATABASE_USER,
    password: settings.DATABASE_PASSWORD,
    database: settings.DATABASE_NAME,
  };
}

function isConfigured(settings) {
  return Boolean(settings.DATABASE_HOST && settings.DATABASE_USER && settings.DATABASE_NAME);
}

function publicStatus(status) {
  return {
    configured: status.configured,
    connected: status.connected,
    error: status.error,
    tables: status.tables || [],
  };
}

function safeMessage(error, settings) {
  let message = String(error?.message || 'Não foi possível conectar no MySQL.');
  for (const secret of [settings.DATABASE_PASSWORD, settings.DATABASE_USER]) {
    if (secret) message = message.split(secret).join('***');
  }
  return message.slice(0, 180);
}

function configKey(config) {
  return [config.host, config.port, config.user, config.password, config.database].join('\0');
}

async function openConnection(config) {
  const base = { ...config, connectTimeout: 10000, charset: 'utf8mb4' };
  try {
    const connection = await mysql.createConnection(base);
    await connection.query('SELECT 1');
    return { connection, ssl: undefined };
  } catch (error) {
    if (!/ssl|TLS|secure/i.test(String(error?.message))) throw error;
    const connection = await mysql.createConnection({ ...base, ssl: { rejectUnauthorized: false } });
    await connection.query('SELECT 1');
    return { connection, ssl: { rejectUnauthorized: false } };
  }
}

async function rememberPool(config, ssl) {
  const key = `${configKey(config)}\0${ssl ? 'ssl' : 'plain'}`;
  if (pool && poolKey === key) return pool;
  if (pool) await pool.end().catch(() => {});
  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 4,
    connectTimeout: 10000,
    charset: 'utf8mb4',
    ssl,
  });
  poolKey = key;
  tablesKey = '';
  return pool;
}

export async function ensureTables(env) {
  const settings = readDatabaseSettings(env);
  if (!isConfigured(settings)) throw new DriveError('Preencha o MySQL da Hostinger.', 503);
  const config = connectionConfig(settings);
  const key = configKey(config);
  if (tablesKey === key && pool) return ['territorios', 'tags', 'arquivo_classificacao'];
  const db = pool && poolKey.startsWith(key) ? pool : await rememberPool(config, undefined);
  await db.query(CREATE_TERRITORIOS);
  await db.query(CREATE_TAGS);
  await db.query(CREATE_CLASSIFICACAO);
  tablesKey = key;
  return ['territorios', 'tags', 'arquivo_classificacao'];
}

async function ping(settings) {
  if (!isConfigured(settings)) return { configured: false, connected: false, error: '', tables: [] };
  const config = connectionConfig(settings);
  let opened;
  try {
    opened = await openConnection(config);
    await rememberPool(config, opened.ssl);
    const tables = await ensureTables({ ...settings, DATABASE_PORT: String(config.port) });
    return { configured: true, connected: true, error: '', tables };
  } catch (error) {
    return { configured: true, connected: false, error: safeMessage(error, settings), tables: [] };
  } finally {
    await opened?.connection.end().catch(() => {});
  }
}

export async function databaseStatus(env, { force = false } = {}) {
  const settings = readDatabaseSettings(env);
  const key = configKey(connectionConfig(settings));
  if (!force && cache && cache.key === key && Date.now() - cache.at < 15000) return cache.result;
  const result = await ping(settings);
  cache = { key, at: Date.now(), result };
  return result;
}

export async function saveDatabaseSettings(root, env, updates) {
  const next = {};
  for (const key of DATABASE_ENV_KEYS) next[key] = unwrap(updates[key]);
  if (!next.DATABASE_PORT) next.DATABASE_PORT = '3306';
  await saveEnvKeys(root, env, next, DATABASE_ENV_KEYS);
  cache = null;
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
    poolKey = '';
    tablesKey = '';
  }
  const status = await databaseStatus(env, { force: true });
  return { ...readDatabaseSettings(env), ...publicStatus(status) };
}

async function withPool(env) {
  const status = await databaseStatus(env);
  if (!status.connected) throw new DriveError(status.error || 'O MySQL ainda não está conectado.', 409);
  if (!pool) throw new DriveError('O MySQL ainda não está conectado.', 409);
  return pool;
}

function mapItem(row) {
  return {
    id: row.id,
    name: row.name,
    bgColor: row.bg_color,
    textColor: row.text_color,
  };
}

function cleanItems(items) {
  if (!Array.isArray(items)) throw new DriveError('A lista não veio no formato esperado.');
  return items.map(item => {
    const id = String(item?.id || '').trim();
    const name = String(item?.name || '').trim();
    const bgColor = String(item?.bgColor || '').trim();
    const textColor = String(item?.textColor || '').trim();
    if (!ITEM_ID.test(id)) throw new DriveError('Identificador inválido.');
    if (!name || name.length > 160) throw new DriveError('O nome precisa ter até 160 caracteres.');
    if (!COLOR.test(bgColor) || !COLOR.test(textColor)) throw new DriveError('A cor precisa estar em hexadecimal.');
    return { id, name, bgColor, textColor };
  });
}

function cleanIdList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(id => String(id)).filter(id => ITEM_ID.test(id)).slice(0, 40);
}

function parseList(value) {
  if (Array.isArray(value)) return cleanIdList(value);
  try {
    return cleanIdList(JSON.parse(value || '[]'));
  } catch {
    return [];
  }
}

export async function loadIdentidade(env) {
  const status = await databaseStatus(env);
  if (!status.connected) return { territorios: [], tags: [] };
  const db = await withPool(env);
  const [territorios] = await db.query('SELECT id, name, bg_color, text_color FROM territorios ORDER BY name');
  const [tags] = await db.query('SELECT id, name, bg_color, text_color FROM tags ORDER BY name');
  return {
    territorios: territorios.map(mapItem),
    tags: tags.map(mapItem),
  };
}

async function replaceItems(env, table, items) {
  if (table !== 'territorios' && table !== 'tags') throw new DriveError('Tabela inválida.');
  const cleaned = cleanItems(items);
  const db = await withPool(env);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(`DELETE FROM ${table}`);
    for (const item of cleaned) {
      await connection.query(
        `INSERT INTO ${table} (id, name, bg_color, text_color) VALUES (?, ?, ?, ?)`,
        [item.id, item.name, item.bgColor, item.textColor],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
  return cleaned;
}

export function saveTerritorios(env, items) {
  return replaceItems(env, 'territorios', items);
}

export function saveTags(env, items) {
  return replaceItems(env, 'tags', items);
}

export async function loadFileLabels(env) {
  const status = await databaseStatus(env);
  if (!status.connected) return {};
  const db = await withPool(env);
  const [rows] = await db.query('SELECT file_id, territorios, tags FROM arquivo_classificacao');
  const labels = {};
  for (const row of rows) {
    labels[row.file_id] = { territorios: parseList(row.territorios), tags: parseList(row.tags) };
  }
  return labels;
}

export async function saveFileLabels(env, fileId, territorios, tags) {
  if (!ITEM_ID.test(String(fileId || ''))) throw new DriveError('arquivo inválido.');
  const next = { territorios: cleanIdList(territorios), tags: cleanIdList(tags) };
  const db = await withPool(env);
  const territoriosJson = JSON.stringify(next.territorios);
  const tagsJson = JSON.stringify(next.tags);
  await db.query(
    `INSERT INTO arquivo_classificacao (file_id, territorios, tags) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE territorios = ?, tags = ?`,
    [fileId, territoriosJson, tagsJson, territoriosJson, tagsJson],
  );
  return next;
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

  if (req.method === 'GET' && url.pathname === '/api/database/identidade') {
    sendJson(res, 200, await loadIdentidade(env));
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/database/territorios') {
    const body = await readBody(req);
    sendJson(res, 200, { territorios: await saveTerritorios(env, body.territorios) });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/database/tags') {
    const body = await readBody(req);
    sendJson(res, 200, { tags: await saveTags(env, body.tags) });
    return;
  }

  sendJson(res, 404, { error: 'Rota do banco não encontrada.' });
}

import mysql from 'mysql2/promise';
import { DriveError, saveEnvKeys } from './driveClient.js';

const DATABASE_ENV_KEYS = ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME'];
const ITEM_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const RECORD_ID = /^[a-zA-Z0-9_-]{1,128}$/;
const COLOR = /^#[0-9A-Fa-f]{6}$/;

const CREATE_TERRITORIOS = `
  CREATE TABLE territorios (
    id VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    bg_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_TAGS = `
  CREATE TABLE tags (
    id VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    bg_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_CLASSIFICACAO = `
  CREATE TABLE arquivo_classificacao (
    file_id VARCHAR(128) NOT NULL,
    territorios LONGTEXT NOT NULL,
    tags LONGTEXT NOT NULL,
    PRIMARY KEY (file_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_PASTAS = `
  CREATE TABLE pastas (
    id VARCHAR(128) NOT NULL,
    name VARCHAR(160) NOT NULL,
    parent_id VARCHAR(128) NULL,
    origem VARCHAR(8) NOT NULL,
    oculto TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_ARQUIVOS = `
  CREATE TABLE arquivos (
    file_id VARCHAR(128) NOT NULL,
    pasta_id VARCHAR(128) NULL,
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

const TABLE_SQL = [
  ['territorios', CREATE_TERRITORIOS],
  ['tags', CREATE_TAGS],
  ['arquivo_classificacao', CREATE_CLASSIFICACAO],
  ['pastas', CREATE_PASTAS],
  ['arquivos', CREATE_ARQUIVOS],
];

function tableNameOf(row) {
  const named = row.tableName || row.TABLE_NAME || row.table_name || row.tablename;
  if (named) return String(named).toLowerCase();
  const value = Object.values(row)[0];
  return String(value || '').toLowerCase();
}

async function existingTables(db) {
  const marks = TABLE_SQL.map(() => '?').join(', ');
  const [rows] = await db.query(
    `SELECT table_name AS tableName
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name IN (${marks})`,
    TABLE_SQL.map(([name]) => name),
  );
  return new Set(rows.map(tableNameOf));
}

export async function ensureTables(env) {
  const settings = readDatabaseSettings(env);
  if (!isConfigured(settings)) throw new DriveError('Preencha o MySQL da Hostinger.', 503);
  const config = connectionConfig(settings);
  const key = configKey(config);
  if (tablesKey === key && pool) return TABLE_SQL.map(([name]) => name);
  const db = pool && poolKey.startsWith(key) ? pool : await rememberPool(config, undefined);
  const present = await existingTables(db);
  for (const [name, sql] of TABLE_SQL) {
    if (present.has(name)) continue;
    await db.query(sql);
  }
  tablesKey = key;
  return TABLE_SQL.map(([name]) => name);
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

function assertRecordId(value, label) {
  const id = String(value || '');
  if (!RECORD_ID.test(id)) throw new DriveError(`${label} inválido.`);
  return id;
}

function flattenDriveFolders(nodes, parentId = '') {
  const list = [];
  for (const node of nodes || []) {
    list.push({ id: node.id, name: String(node.name || '').slice(0, 160), parentId });
    list.push(...flattenDriveFolders(node.children, node.id));
  }
  return list;
}

function toFolderTree(rows) {
  const byParent = new Map();
  for (const row of rows) {
    const parent = row.parent_id || '';
    const list = byParent.get(parent) || [];
    list.push(row);
    byParent.set(parent, list);
  }
  const walk = (parentId) => (byParent.get(parentId) || [])
    .sort((left, right) => String(left.name).localeCompare(String(right.name), 'pt'))
    .map(row => ({ id: row.id, name: row.name, children: walk(row.id) }));
  return walk('');
}

async function loadFolderTree(env) {
  const db = await withPool(env);
  const [rows] = await db.query('SELECT id, name, parent_id FROM pastas WHERE oculto = 0');
  return toFolderTree(rows);
}

async function loadPlacements(env) {
  const db = await withPool(env);
  const [rows] = await db.query('SELECT file_id, pasta_id FROM arquivos');
  return rows.map(row => ({ id: row.file_id, folderId: row.pasta_id || '' }));
}

export async function rememberDriveLayout(env, archive) {
  const db = await withPool(env);
  const [knownFolders] = await db.query('SELECT id FROM pastas');
  const folderIds = new Set(knownFolders.map(row => row.id));
  for (const folder of flattenDriveFolders(archive.folders)) {
    if (!RECORD_ID.test(folder.id) || folderIds.has(folder.id)) continue;
    await db.query(
      'INSERT INTO pastas (id, name, parent_id, origem, oculto) VALUES (?, ?, ?, ?, 0)',
      [folder.id, folder.name || 'Pasta', folder.parentId || null, 'drive'],
    );
    folderIds.add(folder.id);
  }

  const [knownFiles] = await db.query('SELECT file_id FROM arquivos');
  const fileIds = new Set(knownFiles.map(row => row.file_id));
  for (const file of archive.files || []) {
    if (!RECORD_ID.test(String(file.id)) || fileIds.has(file.id)) continue;
    const pastaId = file.folderId && folderIds.has(file.folderId) ? file.folderId : null;
    await db.query('INSERT INTO arquivos (file_id, pasta_id) VALUES (?, ?)', [file.id, pastaId]);
    fileIds.add(file.id);
  }

  const placements = new Map((await loadPlacements(env)).map(item => [item.id, item.folderId]));
  return {
    folders: await loadFolderTree(env),
    files: (archive.files || []).map(file => ({
      ...file,
      folderId: placements.has(file.id) ? placements.get(file.id) : (file.folderId || ''),
    })),
  };
}

export async function createPasta(env, { name, parentId }) {
  const cleanName = String(name || '').trim();
  if (!cleanName || cleanName.length > 160) throw new DriveError('Dê um nome para a pasta.');
  const parent = parentId ? assertRecordId(parentId, 'pasta') : null;
  const db = await withPool(env);
  if (parent) {
    const [found] = await db.query('SELECT id FROM pastas WHERE id = ? AND oculto = 0', [parent]);
    if (!found.length) throw new DriveError('A pasta de destino não existe.');
  }
  const id = `pasta_${Date.now()}`;
  await db.query(
    'INSERT INTO pastas (id, name, parent_id, origem, oculto) VALUES (?, ?, ?, ?, 0)',
    [id, cleanName, parent, 'app'],
  );
  return { folders: await loadFolderTree(env) };
}

export async function renamePasta(env, { id, name }) {
  const cleanName = String(name || '').trim();
  if (!cleanName || cleanName.length > 160) throw new DriveError('Dê um nome para a pasta.');
  const pastaId = assertRecordId(id, 'pasta');
  const db = await withPool(env);
  const [result] = await db.query('UPDATE pastas SET name = ? WHERE id = ? AND oculto = 0', [cleanName, pastaId]);
  if (!result.affectedRows) throw new DriveError('Pasta não encontrada.', 404);
  return { folders: await loadFolderTree(env) };
}

export async function deletePasta(env, id) {
  const pastaId = assertRecordId(id, 'pasta');
  const db = await withPool(env);
  const [rows] = await db.query('SELECT parent_id, origem FROM pastas WHERE id = ? AND oculto = 0', [pastaId]);
  if (!rows.length) throw new DriveError('Pasta não encontrada.', 404);
  const parentId = rows[0].parent_id;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('UPDATE pastas SET parent_id = ? WHERE parent_id = ?', [parentId, pastaId]);
    await connection.query('UPDATE arquivos SET pasta_id = ? WHERE pasta_id = ?', [parentId, pastaId]);
    if (rows[0].origem === 'drive') await connection.query('UPDATE pastas SET oculto = 1 WHERE id = ?', [pastaId]);
    else await connection.query('DELETE FROM pastas WHERE id = ?', [pastaId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
  return { folders: await loadFolderTree(env), files: await loadPlacements(env) };
}

export async function moveArquivo(env, fileId, pastaId) {
  const id = assertRecordId(fileId, 'arquivo');
  const pasta = pastaId ? assertRecordId(pastaId, 'pasta') : null;
  const db = await withPool(env);
  if (pasta) {
    const [found] = await db.query('SELECT id FROM pastas WHERE id = ? AND oculto = 0', [pasta]);
    if (!found.length) throw new DriveError('A pasta de destino não existe.');
  }
  await db.query(
    `INSERT INTO arquivos (file_id, pasta_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE pasta_id = ?`,
    [id, pasta, pasta],
  );
  return { fileId: id, folderId: pasta || '' };
}

export async function saveFileLabels(env, fileId, territorios, tags) {
  if (!RECORD_ID.test(String(fileId || ''))) throw new DriveError('arquivo inválido.');
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

  if (req.method === 'POST' && url.pathname === '/api/database/pastas') {
    const body = await readBody(req);
    sendJson(res, 201, await createPasta(env, body));
    return;
  }

  if (req.method === 'PATCH' && url.pathname === '/api/database/pastas') {
    const body = await readBody(req);
    sendJson(res, 200, await renamePasta(env, body));
    return;
  }

  if (req.method === 'DELETE' && url.pathname === '/api/database/pastas') {
    const body = await readBody(req);
    sendJson(res, 200, await deletePasta(env, body.id));
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/database/arquivos') {
    const body = await readBody(req);
    sendJson(res, 200, await moveArquivo(env, body.fileId, body.pastaId || ''));
    return;
  }

  sendJson(res, 404, { error: 'Rota do banco não encontrada.' });
}

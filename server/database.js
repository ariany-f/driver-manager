import mysql from 'mysql2/promise';
import { parseArchiveDate } from '../src/lib/archiveDate.js';
import { isMediaIcon } from '../src/lib/mediaIconIds.js';
import { DriveError, getAccount, readDriveConfig, saveEnvKeys } from './driveClient.js';

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
    icon VARCHAR(40) NOT NULL DEFAULT '',
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const TERRITORIOS_COLUMNS = [
  ['icon', "VARCHAR(40) NOT NULL DEFAULT ''"],
];

const CREATE_TAGS = `
  CREATE TABLE tags (
    id VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    bg_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_STATUS = `
  CREATE TABLE status_arquivo (
    id VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    bg_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    padrao TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const STATUS_COLUMNS = [
  ['padrao', 'TINYINT NOT NULL DEFAULT 0'],
];

const CREATE_FORMATOS = `
  CREATE TABLE formatos (
    id VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    bg_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    icon VARCHAR(40) NOT NULL DEFAULT '',
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const FORMATOS_COLUMNS = [
  ['icon', "VARCHAR(40) NOT NULL DEFAULT ''"],
];

const CREATE_CLASSIFICACAO = `
  CREATE TABLE arquivo_classificacao (
    file_id VARCHAR(128) NOT NULL,
    territorios LONGTEXT NOT NULL,
    tags LONGTEXT NOT NULL,
    formatos LONGTEXT NULL,
    origem VARCHAR(255) NULL,
    PRIMARY KEY (file_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CLASSIFICACAO_COLUMNS = [
  ['formatos', 'LONGTEXT NULL'],
  ['origem', 'VARCHAR(255) NULL'],
  ['status_id', 'VARCHAR(64) NULL'],
];

const JORNAL_FORMATO = ['formato_jornal', 'Jornal', '#1E3A5F', '#FDFBF7', 'newspaper'];

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
    nome VARCHAR(255) NULL,
    data_arquivo VARCHAR(10) NULL,
    oculto TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (file_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const ARQUIVOS_COLUMNS = [
  ['nome', 'VARCHAR(255) NULL'],
  ['data_arquivo', 'VARCHAR(10) NULL'],
  ['oculto', 'TINYINT NOT NULL DEFAULT 0'],
];

const CREATE_DRIVE = `
  CREATE TABLE drive_conexao (
    id TINYINT NOT NULL,
    refresh_token TEXT NOT NULL,
    access_token TEXT NULL,
    expires_at BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_APLICACAO = `
  CREATE TABLE aplicacao (
    id TINYINT NOT NULL,
    logo_mime VARCHAR(64) NOT NULL DEFAULT '',
    logo_largura INT NOT NULL DEFAULT 0,
    logo_altura INT NOT NULL DEFAULT 0,
    logo MEDIUMBLOB NULL,
    favicon_mime VARCHAR(64) NOT NULL DEFAULT '',
    favicon MEDIUMBLOB NULL,
    vlibras TINYINT NOT NULL DEFAULT 0,
    contato_email VARCHAR(255) NOT NULL DEFAULT '',
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const APLICACAO_COLUMNS = [
  ['favicon_mime', "VARCHAR(64) NOT NULL DEFAULT ''"],
  ['favicon', 'MEDIUMBLOB NULL'],
  ['vlibras', 'TINYINT NOT NULL DEFAULT 0'],
  ['contato_email', "VARCHAR(255) NOT NULL DEFAULT ''"],
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CREATE_DRIVE_CONFIG = `
  CREATE TABLE drive_config (
    id TINYINT NOT NULL,
    client_id VARCHAR(255) NOT NULL DEFAULT '',
    client_secret VARCHAR(255) NOT NULL DEFAULT '',
    folder_id VARCHAR(128) NOT NULL DEFAULT '',
    redirect_uri VARCHAR(255) NOT NULL DEFAULT '',
    PRIMARY KEY (id)
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

const CONNECTION_LIMIT = /max_connections_per_hour|max_user_connections|max_connections/i;

function safeMessage(error, settings) {
  if (/max_connections_per_hour/i.test(String(error?.message))) {
    return 'A hospedagem do MySQL bloqueou novas conexões por excesso nesta hora. Libera sozinho em até 1 hora.';
  }
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
    connectionLimit: 3,
    maxIdle: 3,
    idleTimeout: 10 * 60 * 1000,
    enableKeepAlive: true,
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
  ['status_arquivo', CREATE_STATUS],
  ['formatos', CREATE_FORMATOS],
  ['arquivo_classificacao', CREATE_CLASSIFICACAO],
  ['pastas', CREATE_PASTAS],
  ['arquivos', CREATE_ARQUIVOS],
  ['drive_conexao', CREATE_DRIVE],
  ['drive_config', CREATE_DRIVE_CONFIG],
  ['aplicacao', CREATE_APLICACAO],
];

function tableNameOf(row) {
  const named = row.tableName || row.TABLE_NAME || row.table_name || row.tablename;
  if (named) return String(named).toLowerCase();
  const value = Object.values(row)[0];
  return String(value || '').toLowerCase();
}

function columnNameOf(row) {
  const named = row.columnName || row.COLUMN_NAME || row.column_name;
  if (named) return String(named).toLowerCase();
  const value = Object.values(row)[0];
  return String(value || '').toLowerCase();
}

async function ensureArquivosColumns(db) {
  const [rows] = await db.query(
    `SELECT column_name AS columnName
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'arquivos'`,
  );
  const present = new Set(rows.map(columnNameOf));
  for (const [name, definition] of ARQUIVOS_COLUMNS) {
    if (present.has(name)) continue;
    await db.query(`ALTER TABLE arquivos ADD COLUMN ${name} ${definition}`);
  }
  const [typed] = await db.query(
    `SELECT data_type AS dataType
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'arquivos'
       AND column_name = 'data_arquivo'`,
  );
  const dataType = String(typed[0]?.dataType || typed[0]?.DATA_TYPE || typed[0]?.datatype || '').toLowerCase();
  if (dataType === 'date' || dataType === 'datetime') {
    await db.query('ALTER TABLE arquivos MODIFY data_arquivo VARCHAR(10) NULL');
  }
}

async function ensureClassificacaoColumns(db) {
  const [rows] = await db.query(
    `SELECT column_name AS columnName
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'arquivo_classificacao'`,
  );
  const present = new Set(rows.map(columnNameOf));
  for (const [name, definition] of CLASSIFICACAO_COLUMNS) {
    if (present.has(name)) continue;
    await db.query(`ALTER TABLE arquivo_classificacao ADD COLUMN ${name} ${definition}`);
  }
}

async function ensureTerritoriosColumns(db) {
  const [rows] = await db.query(
    `SELECT column_name AS columnName
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'territorios'`,
  );
  const present = new Set(rows.map(columnNameOf));
  for (const [name, definition] of TERRITORIOS_COLUMNS) {
    if (present.has(name)) continue;
    await db.query(`ALTER TABLE territorios ADD COLUMN ${name} ${definition}`);
  }
}

async function ensureFormatosColumns(db) {
  const [rows] = await db.query(
    `SELECT column_name AS columnName
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'formatos'`,
  );
  const present = new Set(rows.map(columnNameOf));
  for (const [name, definition] of FORMATOS_COLUMNS) {
    if (present.has(name)) continue;
    await db.query(`ALTER TABLE formatos ADD COLUMN ${name} ${definition}`);
  }
}

async function ensureStatusColumns(db) {
  const [rows] = await db.query(
    `SELECT column_name AS columnName
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'status_arquivo'`,
  );
  const present = new Set(rows.map(columnNameOf));
  for (const [name, definition] of STATUS_COLUMNS) {
    if (present.has(name)) continue;
    await db.query(`ALTER TABLE status_arquivo ADD COLUMN ${name} ${definition}`);
  }
}

async function ensureJornal(db) {
  const [rows] = await db.query('SELECT COUNT(*) AS total FROM formatos');
  if (Number(rows[0]?.total) === 0) {
    await db.query(
      'INSERT IGNORE INTO formatos (id, name, bg_color, text_color, icon) VALUES (?, ?, ?, ?, ?)',
      JORNAL_FORMATO,
    );
  }
  await db.query(
    `UPDATE formatos SET icon = 'newspaper' WHERE id = 'formato_jornal' AND (icon IS NULL OR icon = '')`,
  );
}

async function ensureAplicacaoColumns(db) {
  const [rows] = await db.query(
    `SELECT column_name AS columnName
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'aplicacao'`,
  );
  const present = new Set(rows.map(columnNameOf));
  for (const [name, definition] of APLICACAO_COLUMNS) {
    if (present.has(name)) continue;
    await db.query(`ALTER TABLE aplicacao ADD COLUMN ${name} ${definition}`);
  }
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
  await ensureAplicacaoColumns(db);
  await ensureArquivosColumns(db);
  await ensureClassificacaoColumns(db);
  await ensureTerritoriosColumns(db);
  await ensureFormatosColumns(db);
  await ensureStatusColumns(db);
  await ensureJornal(db);
  tablesKey = key;
  return TABLE_SQL.map(([name]) => name);
}

async function ping(settings) {
  if (!isConfigured(settings)) return { configured: false, connected: false, error: '', tables: [] };
  const config = connectionConfig(settings);
  const tableEnv = { ...settings, DATABASE_PORT: String(config.port) };
  if (pool && poolKey.startsWith(`${configKey(config)}\0`)) {
    try {
      await pool.query('SELECT 1');
      const tables = await ensureTables(tableEnv);
      return { configured: true, connected: true, error: '', tables };
    } catch (error) {
      if (CONNECTION_LIMIT.test(String(error?.message))) {
        return { configured: true, connected: false, error: safeMessage(error, settings), tables: [], limited: true };
      }
    }
  }
  let opened;
  try {
    opened = await openConnection(config);
    await rememberPool(config, opened.ssl);
    const tables = await ensureTables(tableEnv);
    return { configured: true, connected: true, error: '', tables };
  } catch (error) {
    const limited = CONNECTION_LIMIT.test(String(error?.message));
    return { configured: true, connected: false, error: safeMessage(error, settings), tables: [], limited };
  } finally {
    await opened?.connection.end().catch(() => {});
  }
}

function cacheTtl(result) {
  if (result.connected) return 60 * 1000;
  if (result.limited) return 5 * 60 * 1000;
  return 15 * 1000;
}

export async function databaseStatus(env, { force = false } = {}) {
  const settings = readDatabaseSettings(env);
  const key = configKey(connectionConfig(settings));
  const fresh = cache && cache.key === key && Date.now() - cache.at < cacheTtl(cache.result);
  if (fresh && (!force || cache.result.limited)) return cache.result;
  const result = await ping(settings);
  cache = { key, at: Date.now(), result };
  return result;
}

export async function saveDatabaseSettings(root, env, updates) {
  const next = {};
  for (const key of DATABASE_ENV_KEYS) next[key] = unwrap(updates[key]);
  if (!next.DATABASE_PORT) next.DATABASE_PORT = '3306';
  const wrote = await saveEnvKeys(root, env, next, DATABASE_ENV_KEYS);
  if (!wrote) {
    throw new DriveError('Nesta publicação as credenciais do banco ficam nas variáveis de ambiente do servidor. Não dá para alterá-las por esta tela.', 409);
  }
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

function configFromRow(row, redirectUri) {
  return {
    clientId: String(row.client_id || '').trim(),
    clientSecret: String(row.client_secret || '').trim(),
    folderId: String(row.folder_id || '').trim(),
    redirectUri,
    source: 'banco',
  };
}

export async function resolveDriveConfig(env) {
  const fromEnv = { ...readDriveConfig(env), source: 'env' };
  const status = await databaseStatus(env);
  if (!status.connected) return fromEnv;
  const db = await withPool(env);
  const [rows] = await db.query('SELECT client_id, client_secret, folder_id FROM drive_config WHERE id = 1');
  const row = rows[0];
  if (!row || !(row.client_id || row.client_secret || row.folder_id)) return fromEnv;
  return configFromRow(row, fromEnv.redirectUri);
}

export async function saveDriveConfig(env, config) {
  const status = await databaseStatus(env);
  if (!status.connected) return false;
  const db = await withPool(env);
  const values = [
    config.clientId || '',
    config.clientSecret || '',
    config.folderId || '',
  ];
  await db.query(
    `INSERT INTO drive_config (id, client_id, client_secret, folder_id) VALUES (1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE client_id = ?, client_secret = ?, folder_id = ?`,
    [...values, ...values],
  );
  return true;
}

export async function loadDriveConnection(env) {
  const db = await withPool(env);
  const [rows] = await db.query('SELECT refresh_token, access_token, expires_at FROM drive_conexao WHERE id = 1');
  if (!rows.length || !rows[0].refresh_token) return null;
  return {
    refresh_token: rows[0].refresh_token,
    access_token: rows[0].access_token || '',
    expires_at: Number(rows[0].expires_at) || 0,
  };
}

export async function saveDriveConnection(env, token) {
  const refreshToken = String(token?.refresh_token || '');
  if (!refreshToken) throw new DriveError('O Google não devolveu a autorização.');
  const accessToken = token.access_token || null;
  const expiresAt = Number(token.expires_at) || 0;
  const db = await withPool(env);
  await db.query(
    `INSERT INTO drive_conexao (id, refresh_token, access_token, expires_at) VALUES (1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE refresh_token = ?, access_token = ?, expires_at = ?`,
    [refreshToken, accessToken, expiresAt, refreshToken, accessToken, expiresAt],
  );
}

export async function clearDriveConnection(env) {
  const db = await withPool(env);
  await db.query('DELETE FROM drive_conexao WHERE id = 1');
}

export async function clearDriveFolderId(env) {
  const status = await databaseStatus(env);
  if (!status.connected) return false;
  const db = await withPool(env);
  await db.query("UPDATE drive_config SET folder_id = '' WHERE id = 1");
  return true;
}

const LOGO_LIMIT = 2 * 1024 * 1024;

function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5) };
    }
    if (marker === 0xd9 || marker === 0xda) return null;
    const size = buf.readUInt16BE(offset + 2);
    if (!size) return null;
    offset += 2 + size;
  }
  return null;
}

function webpSize(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X' && buf.length >= 30) {
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  }
  if (kind === 'VP8 ' && buf.length >= 30) {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (kind === 'VP8L' && buf.length >= 25) {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function imageSize(bytes) {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes.toString('ascii', 1, 4) === 'PNG') {
    return { mime: 'image/png', width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length >= 10 && bytes.toString('ascii', 0, 3) === 'GIF') {
    return { mime: 'image/gif', width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  }
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF') {
    const size = webpSize(bytes);
    return size ? { mime: 'image/webp', ...size } : null;
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const size = jpegSize(bytes);
    return size ? { mime: 'image/jpeg', ...size } : null;
  }
  return null;
}

function decodeLogo(value) {
  const match = String(value || '').match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw new DriveError('Envie uma imagem PNG, JPEG, WEBP ou GIF.');
  const bytes = Buffer.from(match[1].replace(/\s/g, ''), 'base64');
  if (!bytes.length || bytes.length > LOGO_LIMIT) throw new DriveError('A imagem precisa ter no máximo 2 MB.');
  const size = imageSize(bytes);
  if (!size?.width || !size?.height) throw new DriveError('Não foi possível ler esta imagem. Use PNG, JPEG, WEBP ou GIF.');
  if (size.width <= size.height) throw new DriveError('A logo precisa ser horizontal: mais larga do que alta.');
  return { ...size, bytes };
}

export async function loadLogo(env) {
  const status = await databaseStatus(env);
  if (!status.connected) return null;
  const db = await withPool(env);
  const [rows] = await db.query('SELECT logo_mime, logo FROM aplicacao WHERE id = 1');
  const row = rows[0];
  if (!row?.logo) return null;
  const bytes = Buffer.isBuffer(row.logo) ? row.logo : Buffer.from(row.logo);
  if (!bytes.length) return null;
  return { mime: row.logo_mime || 'image/png', bytes };
}

export async function saveLogo(env, image) {
  const logo = decodeLogo(image);
  const db = await withPool(env);
  await db.query(
    `INSERT INTO aplicacao (id, logo_mime, logo_largura, logo_altura, logo) VALUES (1, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE logo_mime = ?, logo_largura = ?, logo_altura = ?, logo = ?`,
    [logo.mime, logo.width, logo.height, logo.bytes, logo.mime, logo.width, logo.height, logo.bytes],
  );
  return { width: logo.width, height: logo.height };
}

export async function clearLogo(env) {
  const db = await withPool(env);
  await db.query("UPDATE aplicacao SET logo_mime = '', logo_largura = 0, logo_altura = 0, logo = NULL WHERE id = 1");
}

function isIco(bytes) {
  return bytes.length > 6 && bytes.readUInt16LE(0) === 0 && bytes.readUInt16LE(2) === 1;
}

function decodeFavicon(value) {
  const match = String(value || '').match(/^data:[^,]*,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw new DriveError('Envie um favicon PNG, JPEG, WEBP, GIF ou ICO.');
  const bytes = Buffer.from(match[1].replace(/\s/g, ''), 'base64');
  if (!bytes.length || bytes.length > LOGO_LIMIT) throw new DriveError('O favicon precisa ter no máximo 2 MB.');
  if (isIco(bytes)) return { mime: 'image/x-icon', bytes };
  const size = imageSize(bytes);
  if (!size?.width || !size?.height) throw new DriveError('Não foi possível ler este favicon. Use PNG, JPEG, WEBP, GIF ou ICO.');
  return { mime: size.mime, bytes };
}

export async function loadFavicon(env) {
  const status = await databaseStatus(env);
  if (!status.connected) return null;
  const db = await withPool(env);
  const [rows] = await db.query('SELECT favicon_mime, favicon FROM aplicacao WHERE id = 1');
  const row = rows[0];
  if (!row?.favicon) return null;
  const bytes = Buffer.isBuffer(row.favicon) ? row.favicon : Buffer.from(row.favicon);
  if (!bytes.length) return null;
  return { mime: row.favicon_mime || 'image/png', bytes };
}

export async function saveFavicon(env, image) {
  const favicon = decodeFavicon(image);
  const db = await withPool(env);
  await db.query(
    `INSERT INTO aplicacao (id, favicon_mime, favicon) VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE favicon_mime = ?, favicon = ?`,
    [favicon.mime, favicon.bytes, favicon.mime, favicon.bytes],
  );
  return { mime: favicon.mime };
}

export async function clearFavicon(env) {
  const db = await withPool(env);
  await db.query("UPDATE aplicacao SET favicon_mime = '', favicon = NULL WHERE id = 1");
}

export async function loadVlibras(env) {
  const db = await withPool(env);
  const [rows] = await db.query('SELECT vlibras FROM aplicacao WHERE id = 1');
  return Number(rows[0]?.vlibras) === 1;
}

export async function saveVlibras(env, enabled) {
  const value = enabled ? 1 : 0;
  const db = await withPool(env);
  await db.query(
    `INSERT INTO aplicacao (id, vlibras) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE vlibras = ?`,
    [value, value],
  );
  return value === 1;
}

export async function loadContato(env) {
  const db = await withPool(env);
  const [rows] = await db.query('SELECT contato_email FROM aplicacao WHERE id = 1');
  const configurado = String(rows[0]?.contato_email || '').trim();
  if (configurado) return { email: configurado, origem: 'configurado' };
  try {
    const config = await resolveDriveConfig(env);
    const token = await loadDriveConnection(env);
    if (token?.refresh_token) {
      const account = await getAccount(env, config);
      const email = String(account?.emailAddress || '').trim();
      if (email) return { email, origem: 'drive' };
    }
  } catch {
    return { email: '', origem: '' };
  }
  return { email: '', origem: '' };
}

export async function saveContato(env, value) {
  const email = String(value || '').trim();
  if (email.length > 255) throw new DriveError('O e-mail precisa ter até 255 caracteres.');
  if (email && !EMAIL.test(email)) throw new DriveError('Esse e-mail não parece válido.');
  const db = await withPool(env);
  await db.query(
    `INSERT INTO aplicacao (id, contato_email) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE contato_email = ?`,
    [email, email],
  );
  return loadContato(env);
}

export async function clearSyncedFiles(env) {
  const db = await withPool(env);
  await db.query('DELETE FROM arquivos');
  return { folders: await loadFolderTree(env) };
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

function mapFormato(row) {
  return { ...mapItem(row), icon: String(row.icon || '') };
}

function mapStatus(row) {
  return { ...mapItem(row), padrao: Boolean(Number(row.padrao)) };
}

function cleanStatusItems(items) {
  let defaultSeen = false;
  return cleanItems(items).map((item, index) => {
    const padrao = Boolean(items[index]?.padrao) && !defaultSeen;
    if (padrao) defaultSeen = true;
    return { ...item, padrao };
  });
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

function cleanFormatos(items) {
  return cleanItems(items).map((item, index) => {
    const icon = String(items[index]?.icon || '').trim();
    if (icon && !isMediaIcon(icon)) throw new DriveError('O ícone escolhido não está na lista.');
    return { ...item, icon };
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
  if (!status.connected) return { territorios: [], tags: [], formatos: [], status: [] };
  const db = await withPool(env);
  const [territorios] = await db.query('SELECT id, name, bg_color, text_color, icon FROM territorios ORDER BY name');
  const [tags] = await db.query('SELECT id, name, bg_color, text_color FROM tags ORDER BY name');
  const [formatos] = await db.query('SELECT id, name, bg_color, text_color, icon FROM formatos ORDER BY name');
  const [statusRows] = await db.query('SELECT id, name, bg_color, text_color, padrao FROM status_arquivo ORDER BY id');
  return {
    territorios: territorios.map(mapFormato),
    tags: tags.map(mapItem),
    formatos: formatos.map(mapFormato),
    status: statusRows.map(mapStatus),
  };
}

async function replaceItems(env, table, items) {
  if (!['territorios', 'tags', 'formatos', 'status_arquivo'].includes(table)) throw new DriveError('Tabela inválida.');
  const withIcon = table === 'formatos' || table === 'territorios';
  const isStatus = table === 'status_arquivo';
  const cleaned = withIcon ? cleanFormatos(items) : isStatus ? cleanStatusItems(items) : cleanItems(items);
  const db = await withPool(env);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(`DELETE FROM ${table}`);
    for (const item of cleaned) {
      if (withIcon) {
        await connection.query(
          `INSERT INTO ${table} (id, name, bg_color, text_color, icon) VALUES (?, ?, ?, ?, ?)`,
          [item.id, item.name, item.bgColor, item.textColor, item.icon || ''],
        );
      } else if (isStatus) {
        await connection.query(
          'INSERT INTO status_arquivo (id, name, bg_color, text_color, padrao) VALUES (?, ?, ?, ?, ?)',
          [item.id, item.name, item.bgColor, item.textColor, item.padrao ? 1 : 0],
        );
      } else {
        await connection.query(
          `INSERT INTO ${table} (id, name, bg_color, text_color) VALUES (?, ?, ?, ?)`,
          [item.id, item.name, item.bgColor, item.textColor],
        );
      }
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

export function saveFormatos(env, items) {
  return replaceItems(env, 'formatos', items);
}

export async function saveStatus(env, items) {
  const cleaned = await replaceItems(env, 'status_arquivo', items);
  const db = await withPool(env);
  const ids = cleaned.map(item => item.id);
  if (ids.length) {
    await db.query(`UPDATE arquivo_classificacao SET status_id = NULL WHERE status_id IS NOT NULL AND status_id NOT IN (${ids.map(() => '?').join(', ')})`, ids);
  } else {
    await db.query('UPDATE arquivo_classificacao SET status_id = NULL WHERE status_id IS NOT NULL');
  }
  return cleaned;
}

function cleanStatusId(value) {
  const id = String(value || '').trim();
  return ITEM_ID.test(id) ? id : '';
}

export async function loadFileLabels(env) {
  const status = await databaseStatus(env);
  if (!status.connected) return {};
  const db = await withPool(env);
  const [rows] = await db.query('SELECT file_id, territorios, tags, formatos, origem, status_id FROM arquivo_classificacao');
  const labels = {};
  for (const row of rows) {
    labels[row.file_id] = {
      territorios: parseList(row.territorios),
      tags: parseList(row.tags),
      formatos: parseList(row.formatos),
      origem: String(row.origem || '').trim(),
      status: cleanStatusId(row.status_id),
    };
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
  const [rows] = await db.query('SELECT file_id, pasta_id, nome, data_arquivo, oculto FROM arquivos');
  return rows.map(row => ({
    id: row.file_id,
    folderId: row.pasta_id || '',
    nome: String(row.nome || '').trim(),
    dataArquivo: readStoredDate(row.data_arquivo),
    oculto: Number(row.oculto) === 1,
  }));
}

function readStoredDate(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}$/.test(text)) return text;
  const full = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return full ? full[1] : '';
}

function applyStoredFile(file, stored) {
  if (!stored) return file;
  return {
    ...file,
    folderId: stored.folderId,
    name: stored.nome || file.name,
    dataArquivo: stored.dataArquivo || '',
  };
}

function cleanArchiveDate(value) {
  const parsed = parseArchiveDate(value);
  if (parsed.pending) throw new DriveError('A data está incompleta. Use 14/08/2025 ou 08/2025.');
  if (!parsed.ok) throw new DriveError(parsed.error || 'A data não é válida.');
  return parsed.iso || null;
}

export async function saveArquivoData(env, fileId, value) {
  const id = assertRecordId(fileId, 'arquivo');
  const dataArquivo = cleanArchiveDate(value);
  const db = await withPool(env);
  const [found] = await db.query('SELECT file_id FROM arquivos WHERE file_id = ?', [id]);
  if (!found.length) throw new DriveError('Arquivo não encontrado.', 404);
  await db.query('UPDATE arquivos SET data_arquivo = ? WHERE file_id = ?', [dataArquivo, id]);
  return { fileId: id, dataArquivo: dataArquivo || '' };
}

async function knownDriveIds(env) {
  const db = await withPool(env);
  const [knownFolders] = await db.query('SELECT id FROM pastas');
  const [knownFiles] = await db.query('SELECT file_id FROM arquivos');
  return {
    folderIds: new Set(knownFolders.map(row => row.id)),
    fileIds: new Set(knownFiles.map(row => row.file_id)),
  };
}

function describeNewFile(file) {
  return {
    id: file.id,
    name: file.name,
    folderId: file.folderId || '',
    type: file.type || 'document',
  };
}

function splitStoredFiles(archive, placements) {
  const files = [];
  const excluidos = [];
  for (const file of archive.files || []) {
    const stored = placements.get(file.id);
    if (!stored) continue;
    const placed = applyStoredFile(file, stored);
    if (stored.oculto) excluidos.push(describeNewFile(placed));
    else files.push(placed);
  }
  return { files, excluidos };
}

function cleanSelection(selection) {
  if (!selection) return null;
  const pick = (value) => new Set((Array.isArray(value) ? value : []).map(String).filter(id => RECORD_ID.test(id)));
  return { arquivos: pick(selection.arquivos), pastas: pick(selection.pastas), restaurar: pick(selection.restaurar) };
}

export async function previewDriveLayout(env, archive, { withExcluded = false } = {}) {
  const { folderIds, fileIds } = await knownDriveIds(env);
  const novasPastas = flattenDriveFolders(archive.folders)
    .filter(folder => RECORD_ID.test(folder.id) && !folderIds.has(folder.id))
    .map(folder => ({ id: folder.id, name: folder.name }));
  const novos = (archive.files || [])
    .filter(file => RECORD_ID.test(String(file.id)) && !fileIds.has(file.id))
    .map(describeNewFile);
  const placements = new Map((await loadPlacements(env)).map(item => [item.id, item]));
  const { files, excluidos } = splitStoredFiles(archive, placements);
  return {
    folders: await loadFolderTree(env),
    files,
    novos,
    novasPastas,
    excluidos: withExcluded ? excluidos : [],
  };
}

export async function rememberDriveLayout(env, archive, selection = null) {
  const db = await withPool(env);
  const chosen = cleanSelection(selection);
  const known = await knownDriveIds(env);
  const folderIds = known.folderIds;
  const driveFolders = flattenDriveFolders(archive.folders).filter(folder => RECORD_ID.test(folder.id));
  const parentOf = new Map(driveFolders.map(folder => [folder.id, folder.parentId || '']));

  const wantedFolders = new Set();
  if (chosen) {
    for (const id of chosen.pastas) wantedFolders.add(id);
    for (const file of archive.files || []) {
      if (!chosen.arquivos.has(String(file.id))) continue;
      let parent = file.folderId || '';
      while (parent && parentOf.has(parent) && !folderIds.has(parent)) {
        wantedFolders.add(parent);
        parent = parentOf.get(parent);
      }
    }
  }

  const novasPastas = [];
  for (const folder of driveFolders) {
    if (folderIds.has(folder.id)) continue;
    if (chosen && !wantedFolders.has(folder.id)) continue;
    let parentId = folder.parentId || '';
    while (parentId && !folderIds.has(parentId) && !(chosen ? wantedFolders.has(parentId) : parentOf.has(parentId))) {
      parentId = parentOf.get(parentId) || '';
    }
    await db.query(
      'INSERT INTO pastas (id, name, parent_id, origem, oculto) VALUES (?, ?, ?, ?, 0)',
      [folder.id, folder.name || 'Pasta', parentId || null, 'drive'],
    );
    folderIds.add(folder.id);
    novasPastas.push({ id: folder.id, name: folder.name });
  }

  const fileIds = known.fileIds;
  const novos = [];
  for (const file of archive.files || []) {
    if (!RECORD_ID.test(String(file.id)) || fileIds.has(file.id)) continue;
    if (chosen && !chosen.arquivos.has(String(file.id))) continue;
    let pastaId = file.folderId || '';
    while (pastaId && !folderIds.has(pastaId)) pastaId = parentOf.get(pastaId) || '';
    await db.query('INSERT INTO arquivos (file_id, pasta_id) VALUES (?, ?)', [file.id, pastaId || null]);
    fileIds.add(file.id);
    novos.push({ ...describeNewFile(file), folderId: pastaId || '' });
  }

  if (chosen?.restaurar.size) {
    const ids = [...chosen.restaurar];
    await db.query(`UPDATE arquivos SET oculto = 0 WHERE file_id IN (${ids.map(() => '?').join(', ')})`, ids);
  }

  const placements = new Map((await loadPlacements(env)).map(item => [item.id, item]));
  const { files, excluidos } = splitStoredFiles(archive, placements);
  return {
    folders: await loadFolderTree(env),
    files,
    novos,
    novasPastas,
    excluidos,
  };
}

export async function hideArquivo(env, fileId) {
  const id = assertRecordId(fileId, 'arquivo');
  const db = await withPool(env);
  const [result] = await db.query('UPDATE arquivos SET oculto = 1 WHERE file_id = ?', [id]);
  if (!result.affectedRows) throw new DriveError('Arquivo não encontrado.', 404);
  return { fileId: id };
}

export async function resolveUploadFolder(env, pastaId) {
  if (!pastaId) return { driveParentId: '', pastaId: '' };
  const id = assertRecordId(pastaId, 'pasta');
  const db = await withPool(env);
  const [rows] = await db.query('SELECT origem FROM pastas WHERE id = ? AND oculto = 0', [id]);
  if (!rows.length) throw new DriveError('A pasta de destino não existe.');
  if (rows[0].origem === 'drive') return { driveParentId: id, pastaId: id };
  return { driveParentId: '', pastaId: id };
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

export async function renameArquivo(env, fileId, name) {
  const id = assertRecordId(fileId, 'arquivo');
  const cleanName = String(name || '').trim();
  if (!cleanName || cleanName.length > 255) throw new DriveError('Dê um nome para o arquivo.');
  const db = await withPool(env);
  const [found] = await db.query('SELECT file_id FROM arquivos WHERE file_id = ?', [id]);
  if (!found.length) throw new DriveError('Arquivo não encontrado.', 404);
  await db.query('UPDATE arquivos SET nome = ? WHERE file_id = ?', [cleanName, id]);
  return { fileId: id, name: cleanName };
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

export async function saveFileLabels(env, fileId, territorios, tags, formatos, status) {
  if (!RECORD_ID.test(String(fileId || ''))) throw new DriveError('arquivo inválido.');
  const next = {
    territorios: cleanIdList(territorios),
    tags: cleanIdList(tags),
    formatos: cleanIdList(formatos),
  };
  const db = await withPool(env);
  const territoriosJson = JSON.stringify(next.territorios);
  const tagsJson = JSON.stringify(next.tags);
  const formatosJson = JSON.stringify(next.formatos);
  if (status === undefined) {
    await db.query(
      `INSERT INTO arquivo_classificacao (file_id, territorios, tags, formatos) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE territorios = ?, tags = ?, formatos = ?`,
      [fileId, territoriosJson, tagsJson, formatosJson, territoriosJson, tagsJson, formatosJson],
    );
    return next;
  }
  let statusId = cleanStatusId(status);
  if (statusId) {
    const [found] = await db.query('SELECT id FROM status_arquivo WHERE id = ?', [statusId]);
    if (!found.length) throw new DriveError('Esse status não existe mais. Atualize a página.');
  } else {
    statusId = null;
  }
  await db.query(
    `INSERT INTO arquivo_classificacao (file_id, territorios, tags, formatos, status_id) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE territorios = ?, tags = ?, formatos = ?, status_id = ?`,
    [fileId, territoriosJson, tagsJson, formatosJson, statusId, territoriosJson, tagsJson, formatosJson, statusId],
  );
  return { ...next, status: statusId || '' };
}

export async function saveArquivoOrigem(env, fileId, origem) {
  const id = assertRecordId(fileId, 'arquivo');
  const clean = String(origem || '').trim().slice(0, 255);
  const db = await withPool(env);
  await db.query(
    `INSERT INTO arquivo_classificacao (file_id, territorios, tags, origem)
     VALUES (?, '[]', '[]', ?)
     ON DUPLICATE KEY UPDATE origem = ?`,
    [id, clean || null, clean || null],
  );
  return { fileId: id, origem: clean };
}

export const BACKUP_KIND = 'driver-manager/classificacoes';
const BACKUP_VERSION = 1;

export async function exportClassificacoes(env, { conta = {}, archive = null } = {}) {
  const db = await withPool(env);
  const [territorios] = await db.query('SELECT id, name, bg_color, text_color, icon FROM territorios ORDER BY name');
  const [tags] = await db.query('SELECT id, name, bg_color, text_color FROM tags ORDER BY name');
  const [statusRows] = await db.query('SELECT id, name, bg_color, text_color, padrao FROM status_arquivo ORDER BY id');
  const [pastas] = await db.query('SELECT id, name, parent_id, origem, oculto FROM pastas');
  const [arquivos] = await db.query('SELECT file_id, pasta_id, nome, data_arquivo, oculto FROM arquivos');
  const [classificacoes] = await db.query('SELECT file_id, territorios, tags, formatos, origem, status_id FROM arquivo_classificacao');
  const driveNames = new Map((archive?.files || []).map(file => [file.id, String(file.name || '')]));

  const byId = new Map();
  const entry = (id) => {
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        nomeDrive: driveNames.get(id) || '',
        nome: '',
        pastaId: '',
        dataArquivo: '',
        oculto: false,
        territorios: [],
        tags: [],
        formatos: [],
        origem: '',
        status: '',
      });
    }
    return byId.get(id);
  };
  for (const row of arquivos) {
    const item = entry(row.file_id);
    item.nome = String(row.nome || '').trim();
    item.pastaId = row.pasta_id || '';
    item.dataArquivo = readStoredDate(row.data_arquivo);
    item.oculto = Number(row.oculto) === 1;
  }
  for (const row of classificacoes) {
    const item = entry(row.file_id);
    item.territorios = parseList(row.territorios);
    item.tags = parseList(row.tags);
    item.formatos = parseList(row.formatos);
    item.origem = String(row.origem || '').trim();
    item.status = cleanStatusId(row.status_id);
  }

  return {
    tipo: BACKUP_KIND,
    versao: BACKUP_VERSION,
    exportadoEm: new Date().toISOString(),
    conta: {
      email: String(conta.email || ''),
      pastaId: String(conta.pastaId || ''),
      pastaNome: String(conta.pastaNome || ''),
    },
    territorios: territorios.map(mapFormato),
    tags: tags.map(mapItem),
    status: statusRows.map(mapStatus),
    pastas: pastas.map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id || '',
      origem: row.origem,
      oculto: Number(row.oculto) === 1,
    })),
    arquivos: [...byId.values()],
  };
}

function readBackup(backup) {
  if (!backup || typeof backup !== 'object' || backup.tipo !== BACKUP_KIND) {
    throw new DriveError('Esse arquivo não é um backup de classificações do Driver Manager.');
  }
  if (Number(backup.versao) > BACKUP_VERSION) {
    throw new DriveError('Esse backup foi feito por uma versão mais nova da aplicação.');
  }
  if (!Array.isArray(backup.arquivos)) throw new DriveError('O backup não tem a lista de arquivos.');
  return backup;
}

function uniqueNames(list, nameOf) {
  const count = new Map();
  for (const item of list) {
    const name = nameOf(item);
    if (!name) continue;
    count.set(name, (count.get(name) || 0) + 1);
  }
  return count;
}

export async function importClassificacoes(env, rawBackup, archive) {
  const backup = readBackup(rawBackup);
  let territorios;
  let tags;
  let statusList;
  try {
    territorios = cleanFormatos(Array.isArray(backup.territorios) ? backup.territorios : []);
    tags = cleanItems(Array.isArray(backup.tags) ? backup.tags : []);
    statusList = cleanStatusItems(Array.isArray(backup.status) ? backup.status : []);
  } catch (error) {
    throw new DriveError(`Os formatos, as tags ou os status do backup estão com problema: ${error.message}`);
  }

  const driveFiles = (archive?.files || []).filter(file => RECORD_ID.test(String(file.id)));
  const driveById = new Map(driveFiles.map(file => [file.id, file]));
  const driveNameCount = uniqueNames(driveFiles, file => String(file.name || ''));
  const driveByName = new Map(driveFiles.filter(file => driveNameCount.get(String(file.name || '')) === 1).map(file => [String(file.name), file]));
  const backupNameCount = uniqueNames(backup.arquivos, item => String(item?.nomeDrive || ''));
  const driveFolderIds = new Set(flattenDriveFolders(archive?.folders).map(folder => folder.id));

  const db = await withPool(env);
  const connection = await db.getConnection();
  const resumo = { porId: 0, porNome: 0, naoEncontrados: 0, exemplos: [], formatosNovos: 0, tagsNovas: 0, statusNovos: 0, pastasNovas: 0 };
  try {
    await connection.beginTransaction();

    const [currentTerritorios] = await connection.query('SELECT id FROM territorios');
    const territorioIds = new Set(currentTerritorios.map(row => row.id));
    for (const item of territorios) {
      if (territorioIds.has(item.id)) continue;
      await connection.query(
        'INSERT INTO territorios (id, name, bg_color, text_color, icon) VALUES (?, ?, ?, ?, ?)',
        [item.id, item.name, item.bgColor, item.textColor, item.icon || ''],
      );
      territorioIds.add(item.id);
      resumo.formatosNovos += 1;
    }
    const [currentTags] = await connection.query('SELECT id FROM tags');
    const tagIds = new Set(currentTags.map(row => row.id));
    for (const item of tags) {
      if (tagIds.has(item.id)) continue;
      await connection.query(
        'INSERT INTO tags (id, name, bg_color, text_color) VALUES (?, ?, ?, ?)',
        [item.id, item.name, item.bgColor, item.textColor],
      );
      tagIds.add(item.id);
      resumo.tagsNovas += 1;
    }
    const [currentStatus] = await connection.query('SELECT id, padrao FROM status_arquivo');
    const statusIds = new Set(currentStatus.map(row => row.id));
    const hasDefault = currentStatus.some(row => Number(row.padrao) === 1);
    for (const item of statusList) {
      if (statusIds.has(item.id)) continue;
      await connection.query(
        'INSERT INTO status_arquivo (id, name, bg_color, text_color, padrao) VALUES (?, ?, ?, ?, 0)',
        [item.id, item.name, item.bgColor, item.textColor],
      );
      statusIds.add(item.id);
      resumo.statusNovos += 1;
    }
    const backupDefault = statusList.find(item => item.padrao);
    if (!hasDefault && backupDefault && statusIds.has(backupDefault.id)) {
      await connection.query('UPDATE status_arquivo SET padrao = 1 WHERE id = ?', [backupDefault.id]);
    }

    const [currentPastas] = await connection.query('SELECT id FROM pastas');
    const pastaIds = new Set(currentPastas.map(row => row.id));
    const backupPastas = (Array.isArray(backup.pastas) ? backup.pastas : [])
      .filter(pasta => RECORD_ID.test(String(pasta?.id || '')));
    const toInsert = backupPastas.filter(pasta => !pastaIds.has(pasta.id)
      && (pasta.origem === 'app' || driveFolderIds.has(pasta.id)));
    const willExist = new Set([...pastaIds, ...toInsert.map(pasta => pasta.id)]);
    for (const pasta of toInsert) {
      const name = String(pasta.name || 'Pasta').trim().slice(0, 160) || 'Pasta';
      const parent = pasta.parentId && willExist.has(pasta.parentId) ? pasta.parentId : null;
      await connection.query(
        'INSERT INTO pastas (id, name, parent_id, origem, oculto) VALUES (?, ?, ?, ?, ?)',
        [pasta.id, name, parent, pasta.origem === 'app' ? 'app' : 'drive', pasta.oculto ? 1 : 0],
      );
      pastaIds.add(pasta.id);
      resumo.pastasNovas += 1;
    }
    for (const pasta of backupPastas) {
      if (!pastaIds.has(pasta.id) || toInsert.includes(pasta)) continue;
      await connection.query('UPDATE pastas SET oculto = ? WHERE id = ?', [pasta.oculto ? 1 : 0, pasta.id]);
    }

    const claimed = new Set();
    for (const item of backup.arquivos) {
      const backupId = String(item?.id || '');
      const backupName = String(item?.nomeDrive || '');
      let target = driveById.get(backupId);
      let how = 'porId';
      if (!target && backupName && backupNameCount.get(backupName) === 1) {
        target = driveByName.get(backupName);
        how = 'porNome';
      }
      if (!target || claimed.has(target.id)) {
        resumo.naoEncontrados += 1;
        if (resumo.exemplos.length < 5) resumo.exemplos.push(item?.nome || backupName || backupId);
        continue;
      }
      claimed.add(target.id);
      resumo[how] += 1;

      const ownFolder = target.folderId && pastaIds.has(target.folderId) ? target.folderId : null;
      const pastaId = item.pastaId && pastaIds.has(item.pastaId) ? item.pastaId : ownFolder;
      const nome = String(item.nome || '').trim().slice(0, 255) || null;
      const parsedDate = parseArchiveDate(item.dataArquivo || '');
      const dataArquivo = parsedDate.ok && parsedDate.iso ? parsedDate.iso : null;
      const oculto = item.oculto ? 1 : 0;
      await connection.query(
        `INSERT INTO arquivos (file_id, pasta_id, nome, data_arquivo, oculto) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE pasta_id = ?, nome = ?, data_arquivo = ?, oculto = ?`,
        [target.id, pastaId, nome, dataArquivo, oculto, pastaId, nome, dataArquivo, oculto],
      );

      const fileTerritorios = cleanIdList(item.territorios).filter(id => territorioIds.has(id));
      const fileTags = cleanIdList(item.tags).filter(id => tagIds.has(id));
      const fileFormatos = cleanIdList(item.formatos);
      const origem = String(item.origem || '').trim().slice(0, 255) || null;
      const statusId = cleanStatusId(item.status);
      const fileStatus = statusId && statusIds.has(statusId) ? statusId : null;
      await connection.query(
        `INSERT INTO arquivo_classificacao (file_id, territorios, tags, formatos, origem, status_id) VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE territorios = ?, tags = ?, formatos = ?, origem = ?, status_id = ?`,
        [
          target.id, JSON.stringify(fileTerritorios), JSON.stringify(fileTags), JSON.stringify(fileFormatos), origem, fileStatus,
          JSON.stringify(fileTerritorios), JSON.stringify(fileTags), JSON.stringify(fileFormatos), origem, fileStatus,
        ],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
  return resumo;
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

  if (req.method === 'GET' && url.pathname === '/api/database/logo') {
    const logo = await loadLogo(env);
    if (!logo) {
      res.statusCode = 204;
      res.end();
      return;
    }
    res.statusCode = 200;
    res.setHeader('content-type', logo.mime);
    res.setHeader('cache-control', 'private, max-age=60');
    res.end(logo.bytes);
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/database/logo') {
    const body = await readBody(req);
    sendJson(res, 200, await saveLogo(env, body.image));
    return;
  }

  if (req.method === 'DELETE' && url.pathname === '/api/database/logo') {
    await clearLogo(env);
    sendJson(res, 200, { removed: true });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/database/favicon') {
    const favicon = await loadFavicon(env);
    if (!favicon) {
      res.statusCode = 204;
      res.end();
      return;
    }
    res.statusCode = 200;
    res.setHeader('content-type', favicon.mime);
    res.setHeader('cache-control', 'private, max-age=60');
    res.end(favicon.bytes);
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/database/favicon') {
    const body = await readBody(req);
    sendJson(res, 200, await saveFavicon(env, body.image));
    return;
  }

  if (req.method === 'DELETE' && url.pathname === '/api/database/favicon') {
    await clearFavicon(env);
    sendJson(res, 200, { removed: true });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/database/vlibras') {
    sendJson(res, 200, { enabled: await loadVlibras(env) });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/database/vlibras') {
    const body = await readBody(req);
    sendJson(res, 200, { enabled: await saveVlibras(env, Boolean(body.enabled)) });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/database/contato') {
    sendJson(res, 200, await loadContato(env));
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/database/contato') {
    const body = await readBody(req);
    sendJson(res, 200, await saveContato(env, body.email));
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

  if (req.method === 'PUT' && url.pathname === '/api/database/status') {
    const body = await readBody(req);
    sendJson(res, 200, { status: await saveStatus(env, body.status) });
    return;
  }

  if (req.method === 'PUT' && url.pathname === '/api/database/formatos') {
    const body = await readBody(req);
    sendJson(res, 200, { formatos: await saveFormatos(env, body.formatos) });
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

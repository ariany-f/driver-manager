import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';
import {
  DriveError,
  buildAuthUrl,
  clearToken,
  exchangeCode,
  getAccount,
  getFolderName,
  loadToken,
  missingDriveKeys,
  openDriveMedia,
  readDriveConfig,
  resolveRedirectUri,
  saveDriveEnv,
  saveToken,
  syncArchive,
} from './driveClient.js';
import { databaseStatus, handleDatabaseRequest, loadFileLabels, rememberDriveLayout, saveFileLabels } from './database.js';
import { cookieAttributes, handleAuthRequest, isAdminRequest, openSeal, readCookie, requiresAdmin, seal } from './session.js';

const OAUTH_COOKIE = 'acervo_oauth';

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader('location', location);
  res.end();
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new DriveError('O arquivo passa de 200 MB.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req, 1024 * 1024);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new DriveError('O pedido não veio em JSON.');
  }
}

function rememberState(req, res, env) {
  const state = crypto.randomBytes(16).toString('hex');
  const token = seal(env, { state, exp: Date.now() + 10 * 60 * 1000 });
  res.setHeader('Set-Cookie', `${OAUTH_COOKIE}=${token}; ${cookieAttributes(req)}; Max-Age=600`);
  return state;
}

function consumeState(req, env, state) {
  const data = openSeal(env, readCookie(req, OAUTH_COOKIE));
  return Boolean(data && data.exp > Date.now() && data.state === state);
}

function clearOauthCookie(res, req) {
  res.setHeader('Set-Cookie', `${OAUTH_COOKIE}=; ${cookieAttributes(req)}; Max-Age=0`);
}

async function archivePayload(root, config, env) {
  const archive = await syncArchive(root, config);
  const database = await databaseStatus(env);
  if (!database.connected) {
    return {
      ...archive,
      files: archive.files.map(file => ({ ...file, territorios: [], tags: [] })),
    };
  }
  const placed = await rememberDriveLayout(env, archive);
  const labels = await loadFileLabels(env);
  return {
    folders: placed.folders,
    files: placed.files.map(file => ({
      ...file,
      territorios: labels[file.id]?.territorios || [],
      tags: labels[file.id]?.tags || [],
    })),
  };
}

async function handleDriveRequest(req, res, { root, env }) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const config = readDriveConfig(env);
  const redirectUri = resolveRedirectUri(config, req.headers.host || 'localhost', req.headers['x-forwarded-proto']);

  if (req.method === 'GET' && pathname === '/api/drive/status') {
    const token = await loadToken(root);
    const missing = missingDriveKeys(config);
    const status = {
      configured: missing.length === 0,
      missing,
      connected: Boolean(token?.refresh_token),
      redirectUri,
      folderId: config.folderId,
      account: '',
      folderName: '',
    };
    if (status.connected) {
      try {
        const account = await getAccount(root, config);
        status.account = account?.emailAddress || account?.displayName || '';
        if (config.folderId) status.folderName = await getFolderName(root, config);
      } catch (error) {
        status.error = error.message;
        if (String(error.message).includes('Conecte o Google Drive de novo')) status.connected = false;
      }
    }
    sendJson(res, 200, status);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/settings') {
    sendJson(res, 200, {
      GOOGLE_CLIENT_ID: config.clientId,
      GOOGLE_CLIENT_SECRET: config.clientSecret,
      DRIVE_FOLDER_ID: config.folderId,
      GOOGLE_REDIRECT_URI: config.redirectUri,
    });
    return;
  }

  if (req.method === 'PUT' && pathname === '/api/drive/settings') {
    const body = await readJson(req);
    const saved = await saveDriveEnv(root, env, body);
    sendJson(res, 200, {
      GOOGLE_CLIENT_ID: saved.clientId,
      GOOGLE_CLIENT_SECRET: saved.clientSecret,
      DRIVE_FOLDER_ID: saved.folderId,
      GOOGLE_REDIRECT_URI: saved.redirectUri,
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/connect') {
    const state = rememberState(req, res, env);
    redirect(res, buildAuthUrl(config, redirectUri, state));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/callback') {
    const error = url.searchParams.get('error');
    clearOauthCookie(res, req);
    if (error) {
      redirect(res, `/?drive=error&message=${encodeURIComponent(error === 'access_denied' ? 'A autorização foi cancelada na tela do Google.' : error)}`);
      return;
    }
    if (!consumeState(req, env, url.searchParams.get('state'))) {
      redirect(res, `/?drive=error&message=${encodeURIComponent('A autorização expirou. Tente conectar de novo.')}`);
      return;
    }
    const token = await exchangeCode(config, redirectUri, url.searchParams.get('code'));
    await saveToken(root, token);
    redirect(res, '/?drive=connected');
    return;
  }

  if (req.method === 'POST' && pathname === '/api/drive/disconnect') {
    await clearToken(root);
    sendJson(res, 200, { connected: false });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/sync') {
    sendJson(res, 200, await archivePayload(root, config, env));
    return;
  }

  const media = pathname.match(/^\/api\/drive\/media\/([a-zA-Z0-9_-]+)$/);
  if (req.method === 'GET' && media) {
    const opened = await openDriveMedia(root, config, media[1], req.headers.range);
    res.statusCode = opened.response.status;
    res.setHeader('content-type', opened.contentType);
    res.setHeader('content-disposition', 'inline');
    res.setHeader('cache-control', 'private, max-age=300');
    for (const header of ['content-length', 'content-range', 'accept-ranges']) {
      const value = opened.response.headers.get(header);
      if (value) res.setHeader(header, value);
    }
    if (!opened.response.body) {
      res.end();
      return;
    }
    await pipeline(Readable.fromWeb(opened.response.body), res);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/drive/upload') {
    throw new DriveError('A pasta do cliente só é lida. Nada é enviado para o Drive.', 403);
  }

  if (req.method === 'POST' && pathname === '/api/drive/folders') {
    throw new DriveError('A pasta do cliente só é lida. Nenhuma pasta é criada no Drive.', 403);
  }

  const folder = pathname.match(/^\/api\/drive\/folders\/([a-zA-Z0-9_-]+)$/);
  if (folder && (req.method === 'PATCH' || req.method === 'DELETE')) {
    throw new DriveError('A pasta do cliente só é lida. Nenhuma pasta é renomeada ou apagada no Drive.', 403);
  }

  const file = pathname.match(/^\/api\/drive\/files\/([a-zA-Z0-9_-]+)$/);
  if (file && req.method === 'PATCH') {
    throw new DriveError('A pasta do cliente só é lida. Nenhum arquivo é movido no Drive.', 403);
  }

  const labels = pathname.match(/^\/api\/drive\/files\/([a-zA-Z0-9_-]+)\/classificacao$/);
  if (labels && req.method === 'PUT') {
    const database = await databaseStatus(env);
    if (!database.connected) {
      throw new DriveError('Territórios e tags ficam disponíveis quando o banco estiver conectado.', 409);
    }
    const body = await readJson(req);
    const saved = await saveFileLabels(env, labels[1], body.territorios, body.tags);
    sendJson(res, 200, saved);
    return;
  }

  sendJson(res, 404, { error: 'Rota do Drive não encontrada.' });
}

export async function handleApi(req, res, { root, env }) {
  const pathname = (req.url || '').split('?')[0];
  try {
    if (pathname.startsWith('/api/auth')) {
      await handleAuthRequest(req, res, env);
      return;
    }
    if (pathname.startsWith('/api/database')) {
      const databaseOpen = req.method === 'GET' && (pathname === '/api/database/status' || pathname === '/api/database/identidade');
      if (!databaseOpen && !isAdminRequest(req, env)) {
        sendJson(res, 401, { error: 'Entre como equipe para continuar.' });
        return;
      }
      await handleDatabaseRequest(req, res, { root, env });
      return;
    }
    if (!pathname.startsWith('/api/drive')) {
      sendJson(res, 404, { error: 'Rota não encontrada.' });
      return;
    }
    if (requiresAdmin(req.method, pathname) && !isAdminRequest(req, env)) {
      sendJson(res, 401, { error: 'Entre como equipe para continuar.' });
      return;
    }
    await handleDriveRequest(req, res, { root, env });
  } catch (error) {
    const status = error instanceof DriveError ? error.status : 500;
    if (!res.headersSent) sendJson(res, status, { error: error.message || 'Falha na conexão com o Google Drive.' });
    else res.end();
  }
}

export function driveApiPlugin(env) {
  const root = process.cwd();
  return {
    name: 'drive-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] || '';
        if (!pathname.startsWith('/api/drive') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/database')) return next();
        await handleApi(req, res, { root, env });
      });
    },
  };
}

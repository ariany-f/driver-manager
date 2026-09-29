import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';
import {
  DriveError,
  buildAuthUrl,
  clearToken,
  createDriveFolder,
  deleteDriveFolder,
  exchangeCode,
  getAccount,
  getFolderName,
  loadToken,
  missingDriveKeys,
  moveDriveFile,
  openDriveMedia,
  readDriveConfig,
  renameDriveFolder,
  resolveRedirectUri,
  saveDriveEnv,
  saveLabels,
  saveToken,
  syncArchive,
  uploadDriveFile,
} from './driveClient.js';
import { handleAuthRequest, isAdminRequest, requiresAdmin } from './session.js';

const states = new Map();
const UPLOAD_LIMIT = 200 * 1024 * 1024;

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

function rememberState() {
  const state = crypto.randomBytes(16).toString('hex');
  states.set(state, Date.now() + 10 * 60 * 1000);
  return state;
}

function consumeState(state) {
  const expires = states.get(state);
  states.delete(state);
  return Boolean(expires && expires > Date.now());
}

async function handleDriveRequest(req, res, { root, env }) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const config = readDriveConfig(env);
  const redirectUri = resolveRedirectUri(config, req.headers.host || 'localhost');

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
    const state = rememberState();
    redirect(res, buildAuthUrl(config, redirectUri, state));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/callback') {
    const error = url.searchParams.get('error');
    if (error) {
      redirect(res, `/?drive=error&message=${encodeURIComponent(error === 'access_denied' ? 'A autorização foi cancelada na tela do Google.' : error)}`);
      return;
    }
    if (!consumeState(url.searchParams.get('state'))) {
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
    sendJson(res, 200, await syncArchive(root, config));
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
    const bytes = await readBody(req, UPLOAD_LIMIT);
    await uploadDriveFile(root, config, {
      name: url.searchParams.get('name'),
      mimeType: req.headers['content-type'] || 'application/octet-stream',
      folderId: url.searchParams.get('folderId') || '',
      bytes,
    });
    sendJson(res, 201, await syncArchive(root, config));
    return;
  }

  if (req.method === 'POST' && pathname === '/api/drive/folders') {
    const body = await readJson(req);
    await createDriveFolder(root, config, body);
    sendJson(res, 201, await syncArchive(root, config));
    return;
  }

  const folder = pathname.match(/^\/api\/drive\/folders\/([a-zA-Z0-9_-]+)$/);
  if (folder && req.method === 'PATCH') {
    const body = await readJson(req);
    await renameDriveFolder(root, config, folder[1], body.name);
    sendJson(res, 200, await syncArchive(root, config));
    return;
  }
  if (folder && req.method === 'DELETE') {
    await deleteDriveFolder(root, config, folder[1]);
    sendJson(res, 200, await syncArchive(root, config));
    return;
  }

  const file = pathname.match(/^\/api\/drive\/files\/([a-zA-Z0-9_-]+)$/);
  if (file && req.method === 'PATCH') {
    const body = await readJson(req);
    await moveDriveFile(root, config, file[1], body.folderId || '');
    sendJson(res, 200, await syncArchive(root, config));
    return;
  }

  const labels = pathname.match(/^\/api\/drive\/files\/([a-zA-Z0-9_-]+)\/classificacao$/);
  if (labels && req.method === 'PUT') {
    const body = await readJson(req);
    const saved = await saveLabels(root, labels[1], body.territorios, body.tags);
    sendJson(res, 200, saved);
    return;
  }

  sendJson(res, 404, { error: 'Rota do Drive não encontrada.' });
}

export function driveApiPlugin(env) {
  const root = process.cwd();
  return {
    name: 'drive-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] || '';
        if (!pathname.startsWith('/api/drive') && !pathname.startsWith('/api/auth')) return next();
        try {
          if (pathname.startsWith('/api/auth')) {
            await handleAuthRequest(req, res, env);
            return;
          }
          if (requiresAdmin(req.method, pathname) && !isAdminRequest(req)) {
            sendJson(res, 401, { error: 'Entre como equipe para continuar.' });
            return;
          }
          await handleDriveRequest(req, res, { root, env });
        } catch (error) {
          const status = error instanceof DriveError ? error.status : 500;
          if (!res.headersSent) sendJson(res, status, { error: error.message || 'Falha na conexão com o Google Drive.' });
          else res.end();
        }
      });
    },
  };
}

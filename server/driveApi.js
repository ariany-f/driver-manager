import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';
import {
  DriveError,
  buildAuthUrl,
  exchangeCode,
  getAccount,
  getFolderName,
  listChoosableFolders,
  resolveChosenFolder,
  missingDriveKeys,
  openDriveMedia,
  renameDriveFile,
  uploadDriveFile,
  resolveRedirectUri,
  saveDriveEnv,
  syncArchive,
} from './driveClient.js';
import {
  clearDriveConnection,
  clearDriveFolderId,
  clearSyncedFiles,
  databaseStatus,
  exportClassificacoes,
  handleDatabaseRequest,
  hideArquivo,
  importClassificacoes,
  loadDriveConnection,
  loadFileLabels,
  moveArquivo,
  previewDriveLayout,
  renameArquivo,
  rememberDriveLayout,
  resolveDriveConfig,
  resolveUploadFolder,
  saveDriveConfig,
  saveDriveConnection,
  saveArquivoData,
  saveArquivoOrigem,
  saveFileLabels,
} from './database.js';
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

function readBody(req, limit, tooBig = 'O arquivo passa de 200 MB.') {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new DriveError(tooBig));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req, limit = 1024 * 1024) {
  const raw = await readBody(req, limit, 'O pedido passou do tamanho permitido.');
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

function withLabels(placed, labels) {
  return {
    folders: placed.folders,
    files: placed.files.map(file => ({
      ...file,
      territorios: labels[file.id]?.territorios || [],
      tags: labels[file.id]?.tags || [],
      formatos: labels[file.id]?.formatos || [],
      origem: labels[file.id]?.origem || '',
    })),
    novos: placed.novos || [],
    novasPastas: placed.novasPastas || [],
    excluidos: placed.excluidos || [],
  };
}

async function readDriveArchive(config, env) {
  const database = await databaseStatus(env);
  if (!database.connected) throw new DriveError('Conecte um banco MySQL para usar a aplicação.', 409);
  if (!config.folderId) throw new DriveError('Preencha o ID da pasta do Drive.', 503);
  return syncArchive(env, config);
}

async function archivePayload(config, env, selection = null) {
  const archive = await readDriveArchive(config, env);
  const placed = await rememberDriveLayout(env, archive, selection);
  return withLabels(placed, await loadFileLabels(env));
}

async function previewPayload(config, env, withExcluded) {
  const archive = await readDriveArchive(config, env);
  const placed = await previewDriveLayout(env, archive, { withExcluded });
  return withLabels(placed, await loadFileLabels(env));
}

async function handleDriveRequest(req, res, { root, env }) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const config = await resolveDriveConfig(env);
  const redirectUri = resolveRedirectUri(config, req.headers.host || 'localhost', req.headers['x-forwarded-proto']);

  if (req.method === 'GET' && pathname === '/api/drive/status') {
    const database = await databaseStatus(env);
    const token = database.connected ? await loadDriveConnection(env) : null;
    const missing = missingDriveKeys(config).filter(key => key !== 'DRIVE_FOLDER_ID');
    const status = {
      configured: missing.length === 0,
      missing,
      databaseConnected: database.connected,
      connected: Boolean(database.connected && token?.refresh_token),
      redirectUri,
      folderId: config.folderId,
      account: '',
      folderName: '',
    };
    if (status.connected) {
      try {
        const account = await getAccount(env, config);
        status.account = account?.emailAddress || account?.displayName || '';
        if (config.folderId) status.folderName = await getFolderName(env, config);
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
      GOOGLE_REDIRECT_URI: redirectUri,
      redirectFromApp: !config.redirectUri,
      source: config.source,
    });
    return;
  }

  if (req.method === 'PUT' && pathname === '/api/drive/settings') {
    const body = await readJson(req);
    const saved = await saveDriveEnv(root, env, body);
    const onlyRedirect = Object.keys(body).every(key => key === 'GOOGLE_REDIRECT_URI');
    if (onlyRedirect) {
      if (!saved.wroteFile) throw new DriveError('Nesta publicação a URL de retorno segue o endereço do site. Não dá para gravá-la num arquivo.', 409);
    } else {
      const stored = await saveDriveConfig(env, saved);
      if (!saved.wroteFile && !stored) throw new DriveError('Não foi possível guardar a configuração. O arquivo desta publicação é só leitura e o MySQL não está conectado.', 409);
    }
    const stored = await resolveDriveConfig(env);
    const effectiveRedirect = resolveRedirectUri(stored, req.headers.host || 'localhost', req.headers['x-forwarded-proto']);
    sendJson(res, 200, {
      GOOGLE_CLIENT_ID: stored.clientId,
      GOOGLE_CLIENT_SECRET: stored.clientSecret,
      DRIVE_FOLDER_ID: stored.folderId,
      GOOGLE_REDIRECT_URI: effectiveRedirect,
      redirectFromApp: !stored.redirectUri,
      source: stored.source,
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/connect') {
    const database = await databaseStatus(env);
    if (!database.connected) {
      redirect(res, `/?drive=error&message=${encodeURIComponent('Conecte um banco MySQL antes de autorizar o Google Drive.')}`);
      return;
    }
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
    const database = await databaseStatus(env);
    if (!database.connected) {
      redirect(res, `/?drive=error&message=${encodeURIComponent('Conecte um banco MySQL antes de autorizar o Google Drive.')}`);
      return;
    }
    const token = await exchangeCode(config, redirectUri, url.searchParams.get('code'));
    await saveDriveConnection(env, token);
    redirect(res, '/?drive=choose');
    return;
  }

  if (req.method === 'POST' && pathname === '/api/drive/disconnect') {
    await clearDriveConnection(env);
    const kept = await clearSyncedFiles(env);
    await saveDriveEnv(root, env, { DRIVE_FOLDER_ID: '' });
    await clearDriveFolderId(env);
    sendJson(res, 200, { connected: false, folders: kept.folders });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/pastas') {
    const parentId = url.searchParams.get('parent') || '';
    sendJson(res, 200, { folders: await listChoosableFolders(env, config, parentId) });
    return;
  }

  if (req.method === 'PUT' && pathname === '/api/drive/pasta') {
    const body = await readJson(req);
    const folderId = await resolveChosenFolder(env, config, body.folderId);
    const saved = await saveDriveEnv(root, env, {
      GOOGLE_CLIENT_ID: config.clientId,
      GOOGLE_CLIENT_SECRET: config.clientSecret,
      DRIVE_FOLDER_ID: folderId,
    });
    const stored = await saveDriveConfig(env, saved);
    if (!saved.wroteFile && !stored) throw new DriveError('Não foi possível guardar a pasta. O arquivo desta publicação é só leitura e o MySQL não está conectado.', 409);
    const folderName = await getFolderName(env, saved);
    sendJson(res, 200, { folderId: saved.folderId, folderName });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/novidades') {
    sendJson(res, 200, await previewPayload(config, env, isAdminRequest(req, env)));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/sync') {
    sendJson(res, 200, await archivePayload(config, env));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/drive/classificacoes') {
    const conta = { email: '', pastaId: config.folderId || '', pastaNome: '' };
    let archive = null;
    try {
      const account = await getAccount(env, config);
      conta.email = account?.emailAddress || '';
      if (config.folderId) conta.pastaNome = await getFolderName(env, config);
      if (config.folderId) archive = await syncArchive(env, config);
    } catch {
      archive = null;
    }
    sendJson(res, 200, await exportClassificacoes(env, { conta, archive }));
    return;
  }

  if (req.method === 'POST' && pathname === '/api/drive/classificacoes') {
    const backup = await readJson(req, 25 * 1024 * 1024);
    const archive = await readDriveArchive(config, env);
    const resumo = await importClassificacoes(env, backup, archive);
    const account = await getAccount(env, config).catch(() => null);
    const placed = await previewDriveLayout(env, archive, { withExcluded: true });
    sendJson(res, 200, {
      resumo: { ...resumo, contaAtual: account?.emailAddress || '', contaBackup: String(backup?.conta?.email || '') },
      ...withLabels(placed, await loadFileLabels(env)),
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/drive/sync') {
    const body = await readJson(req);
    sendJson(res, 200, await archivePayload(config, env, {
      arquivos: body.arquivos,
      pastas: body.pastas,
      restaurar: body.restaurar,
    }));
    return;
  }

  const media = pathname.match(/^\/api\/drive\/media\/([a-zA-Z0-9_-]+)$/);
  if (req.method === 'GET' && media) {
    const opened = await openDriveMedia(env, config, media[1], req.headers.range);
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
    const target = await resolveUploadFolder(env, url.searchParams.get('folderId') || '');
    const uploaded = await uploadDriveFile(env, config, {
      name: url.searchParams.get('name') || '',
      mimeType: req.headers['content-type'],
      folderId: target.driveParentId,
      bytes: await readBody(req, 200 * 1024 * 1024),
    });
    const archive = await archivePayload(config, env, { arquivos: [uploaded.id] });
    if (target.pastaId && target.pastaId !== target.driveParentId) {
      await moveArquivo(env, uploaded.id, target.pastaId);
      archive.files = archive.files.map(file => (file.id === uploaded.id ? { ...file, folderId: target.pastaId } : file));
    }
    sendJson(res, 201, archive);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/drive/folders') {
    throw new DriveError('A pasta do cliente só é lida. Nenhuma pasta é criada no Drive.', 403);
  }

  const folder = pathname.match(/^\/api\/drive\/folders\/([a-zA-Z0-9_-]+)$/);
  if (folder && (req.method === 'PATCH' || req.method === 'DELETE')) {
    throw new DriveError('A pasta do cliente só é lida. Nenhuma pasta é renomeada ou apagada no Drive.', 403);
  }

  const file = pathname.match(/^\/api\/drive\/files\/([a-zA-Z0-9_-]+)$/);
  if (file && req.method === 'DELETE') {
    sendJson(res, 200, await hideArquivo(env, file[1]));
    return;
  }
  if (file && req.method === 'PATCH') {
    const body = await readJson(req);
    const cleanName = String(body.name || '').trim();
    if (body.drive !== false) await renameDriveFile(env, config, file[1], cleanName);
    sendJson(res, 200, await renameArquivo(env, file[1], cleanName));
    return;
  }

  const dataArquivo = pathname.match(/^\/api\/drive\/files\/([a-zA-Z0-9_-]+)\/data$/);
  if (dataArquivo && req.method === 'PUT') {
    const body = await readJson(req);
    sendJson(res, 200, await saveArquivoData(env, dataArquivo[1], body.dataArquivo));
    return;
  }

  const origem = pathname.match(/^\/api\/drive\/files\/([a-zA-Z0-9_-]+)\/origem$/);
  if (origem && req.method === 'PUT') {
    const body = await readJson(req);
    sendJson(res, 200, await saveArquivoOrigem(env, origem[1], body.origem));
    return;
  }

  const labels = pathname.match(/^\/api\/drive\/files\/([a-zA-Z0-9_-]+)\/classificacao$/);
  if (labels && req.method === 'PUT') {
    const database = await databaseStatus(env);
    if (!database.connected) {
      throw new DriveError('Formatos e tags ficam disponíveis quando o banco estiver conectado.', 409);
    }
    const body = await readJson(req);
    const saved = await saveFileLabels(env, labels[1], body.territorios, body.tags, body.formatos);
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
      const databaseOpen = req.method === 'GET' && (pathname === '/api/database/status' || pathname === '/api/database/identidade' || pathname === '/api/database/logo' || pathname === '/api/database/favicon' || pathname === '/api/database/vlibras');
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
    const raw = String(error?.message || '');
    const message = error?.code === 'EROFS' || raw.includes('read-only file system')
      ? 'O servidor publicado não grava arquivo de configuração. A pasta fica salva no banco.'
      : (raw || 'Falha na conexão com o Google Drive.');
    if (!res.headersSent) sendJson(res, status, { error: message });
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

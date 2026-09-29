import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DRIVE_ENV_KEYS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'DRIVE_FOLDER_ID', 'GOOGLE_REDIRECT_URI'];

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const ITEM_LIMIT = 5000;

export class DriveError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function assertDriveId(value, label = 'id') {
  if (!value || !ID_PATTERN.test(value)) {
    throw new DriveError(`${label} inválido.`);
  }
  return value;
}

export function readDriveConfig(env) {
  return {
    clientId: String(env.GOOGLE_CLIENT_ID || '').trim(),
    clientSecret: String(env.GOOGLE_CLIENT_SECRET || '').trim(),
    redirectUri: String(env.GOOGLE_REDIRECT_URI || '').trim(),
    folderId: String(env.DRIVE_FOLDER_ID || '').trim(),
  };
}

function formatEnvValue(value) {
  const text = String(value ?? '');
  if (!text) return '';
  if (/[\s#"'`]/.test(text)) return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return text;
}

export async function saveEnvKeys(root, env, updates, keys) {
  const file = path.join(root, '.env');
  let text = '';
  try {
    text = await readFile(file, 'utf8');
  } catch {
    text = '';
  }
  if (text && !text.endsWith('\n')) text += '\n';

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;
    const value = String(updates[key] ?? '').trim();
    const line = `${key}=${formatEnvValue(value)}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    if (pattern.test(text)) text = text.replace(pattern, line);
    else text += `${line}\n`;
    env[key] = value;
  }

  await writeFile(file, text);
}

export async function saveDriveEnv(root, env, updates) {
  await saveEnvKeys(root, env, updates, DRIVE_ENV_KEYS);
  return readDriveConfig(env);
}

export function missingDriveKeys(config) {
  const missing = [];
  if (!config.clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!config.clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (!config.folderId) missing.push('DRIVE_FOLDER_ID');
  return missing;
}

export function resolveRedirectUri(config, requestHost, forwardedProto) {
  if (config.redirectUri) return config.redirectUri;
  const host = String(requestHost || 'localhost').split(',')[0].trim();
  const name = host.split(':')[0];
  const proto = String(forwardedProto || '').split(',')[0].trim();
  const secure = proto === 'https' || (name !== 'localhost' && name !== '127.0.0.1');
  return `${secure ? 'https' : 'http'}://${host}/api/drive/callback`;
}

function tokenPath(root) {
  return path.join(root, 'data', 'drive-token.json');
}

function labelsPath(root) {
  return path.join(root, 'data', 'classificacao.json');
}

async function readJsonFile(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJsonFile(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2));
}

export function loadToken(root) {
  return readJsonFile(tokenPath(root), null);
}

export async function saveToken(root, token) {
  await writeJsonFile(tokenPath(root), token);
}

export async function clearToken(root) {
  try {
    await unlink(tokenPath(root));
  } catch {
    // já desconectado
  }
}

async function loadLabels(root) {
  return readJsonFile(labelsPath(root), {});
}

export async function saveLabels(root, fileId, territorios, tags) {
  assertDriveId(fileId, 'arquivo');
  const labels = await loadLabels(root);
  labels[fileId] = {
    territorios: Array.isArray(territorios) ? territorios : [],
    tags: Array.isArray(tags) ? tags : [],
  };
  await writeJsonFile(labelsPath(root), labels);
  return labels[fileId];
}

function requireConfig(config) {
  const missing = missingDriveKeys(config).filter(key => key !== 'DRIVE_FOLDER_ID');
  if (missing.length) {
    throw new DriveError(`Preencha no .env: ${missing.join(', ')}.`, 503);
  }
}

async function requestToken(config, body) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = payload.error_description || payload.error || 'Falha ao falar com o Google.';
    throw new DriveError(translateGoogleError(reason), response.status === 401 ? 401 : 502);
  }
  return payload;
}

function translateGoogleError(reason) {
  const text = String(reason);
  if (text.includes('redirect_uri_mismatch')) {
    return 'A URL de retorno não está cadastrada no Google Cloud. Use exatamente o endereço mostrado na tela de conexão.';
  }
  if (text.includes('invalid_client')) {
    return 'Client ID ou Client Secret recusados. Confira os dois valores no .env.';
  }
  if (text.includes('invalid_grant')) {
    return 'A autorização expirou. Conecte o Google Drive de novo.';
  }
  if (text.includes('access_denied')) {
    return 'A autorização foi cancelada na tela do Google.';
  }
  return text;
}

export function buildAuthUrl(config, redirectUri, state) {
  requireConfig(config);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(config, redirectUri, code) {
  requireConfig(config);
  const payload = await requestToken(config, {
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  if (!payload.refresh_token) {
    throw new DriveError('O Google não devolveu um refresh token. Revogue o acesso do app em myaccount.google.com/permissions e conecte de novo.');
  }
  return {
    refresh_token: payload.refresh_token,
    access_token: payload.access_token,
    expires_at: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
  };
}

export async function getAccessToken(root, config) {
  requireConfig(config);
  const current = await loadToken(root);
  if (!current?.refresh_token) {
    throw new DriveError('O Google Drive ainda não foi conectado.', 401);
  }
  if (current.access_token && current.expires_at > Date.now() + 60_000) {
    return current.access_token;
  }
  try {
    const payload = await requestToken(config, {
      refresh_token: current.refresh_token,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    });
    const next = {
      ...current,
      access_token: payload.access_token,
      expires_at: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
    };
    await saveToken(root, next);
    return next.access_token;
  } catch (error) {
    if (String(error.message).includes('Conecte o Google Drive de novo')) {
      await clearToken(root);
    }
    throw error;
  }
}

async function driveJson(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = payload.error?.message || 'O Google Drive recusou a operação.';
    throw new DriveError(reason, response.status === 404 ? 404 : 502);
  }
  return payload;
}

export async function getAccount(root, config) {
  const token = await getAccessToken(root, config);
  const about = await driveJson(`${DRIVE_API}/about?fields=user(emailAddress,displayName)`, token);
  return about.user || null;
}

export async function getFolderName(root, config) {
  if (!config.folderId) return '';
  assertDriveId(config.folderId, 'DRIVE_FOLDER_ID');
  const token = await getAccessToken(root, config);
  const folder = await driveJson(`${DRIVE_API}/files/${config.folderId}?fields=id,name,mimeType&supportsAllDrives=true`, token);
  if (folder.mimeType !== FOLDER_MIME) {
    throw new DriveError('DRIVE_FOLDER_ID não é uma pasta.');
  }
  return folder.name;
}

function formatSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function mediaType(mime = '', name = '') {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'audio';
  return 'document';
}

async function listChildren(parentId, token) {
  const items = [];
  let pageToken = '';
  do {
    const url = new URL(`${DRIVE_API}/files`);
    url.searchParams.set('q', `'${parentId}' in parents and trashed = false`);
    url.searchParams.set('fields', 'nextPageToken, files(id, name, mimeType, size, modifiedTime)');
    url.searchParams.set('pageSize', '200');
    url.searchParams.set('orderBy', 'folder,name');
    url.searchParams.set('supportsAllDrives', 'true');
    url.searchParams.set('includeItemsFromAllDrives', 'true');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const page = await driveJson(url, token);
    items.push(...(page.files || []));
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  return items;
}

function toFolderTree(folders, rootId) {
  const byParent = new Map();
  folders.forEach(folder => {
    const list = byParent.get(folder.parentId) || [];
    list.push(folder);
    byParent.set(folder.parentId, list);
  });
  const walk = (parentId) => (byParent.get(parentId) || [])
    .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    .map(folder => ({ id: folder.id, name: folder.name, children: walk(folder.id) }));
  return walk(rootId);
}

export async function syncArchive(root, config) {
  if (!config.folderId) {
    throw new DriveError('Preencha DRIVE_FOLDER_ID no .env com o id da pasta do acervo.', 503);
  }
  const rootId = assertDriveId(config.folderId, 'DRIVE_FOLDER_ID');
  const token = await getAccessToken(root, config);
  const labels = await loadLabels(root);
  const folders = [];
  const files = [];
  const queue = [rootId];
  const seen = new Set([rootId]);

  while (queue.length) {
    const parentId = queue.shift();
    const children = await listChildren(parentId, token);
    for (const item of children) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      if (seen.size > ITEM_LIMIT) {
        throw new DriveError('A pasta passou de 5000 itens. Sincronize uma pasta menor.');
      }
      if (item.mimeType === FOLDER_MIME) {
        folders.push({ ...item, parentId });
        queue.push(item.id);
      } else {
        files.push({ ...item, parentId });
      }
    }
  }

  return {
    folders: toFolderTree(folders, rootId),
    files: files
      .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
      .map(file => {
        const label = labels[file.id] || {};
        return {
          id: file.id,
          name: file.name,
          folderId: file.parentId === rootId ? '' : file.parentId,
          territorios: label.territorios || [],
          tags: label.tags || [],
          date: String(file.modifiedTime || '').slice(0, 10),
          size: formatSize(file.size),
          type: mediaType(file.mimeType, file.name),
          mimeType: file.mimeType,
          url: `/api/drive/media/${file.id}`,
          drive: true,
        };
      }),
  };
}

function parentOf(config, folderId) {
  if (!folderId) return assertDriveId(config.folderId, 'DRIVE_FOLDER_ID');
  return assertDriveId(folderId, 'pasta');
}

export async function createDriveFolder(root, config, { name, parentId }) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new DriveError('Dê um nome para a pasta.');
  const token = await getAccessToken(root, config);
  return driveJson(`${DRIVE_API}/files?supportsAllDrives=true&fields=id,name`, token, {
    method: 'POST',
    body: JSON.stringify({
      name: cleanName,
      mimeType: FOLDER_MIME,
      parents: [parentOf(config, parentId)],
    }),
  });
}

export async function renameDriveFolder(root, config, folderId, name) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new DriveError('Dê um nome para a pasta.');
  const token = await getAccessToken(root, config);
  return driveJson(`${DRIVE_API}/files/${assertDriveId(folderId, 'pasta')}?supportsAllDrives=true&fields=id,name`, token, {
    method: 'PATCH',
    body: JSON.stringify({ name: cleanName }),
  });
}

async function moveItem(token, fileId, fromParent, toParent) {
  if (fromParent === toParent) return;
  const url = new URL(`${DRIVE_API}/files/${fileId}`);
  url.searchParams.set('addParents', toParent);
  url.searchParams.set('removeParents', fromParent);
  url.searchParams.set('supportsAllDrives', 'true');
  url.searchParams.set('fields', 'id,parents');
  await driveJson(url, token, { method: 'PATCH' });
}

export async function moveDriveFile(root, config, fileId, folderId) {
  const token = await getAccessToken(root, config);
  const id = assertDriveId(fileId, 'arquivo');
  const meta = await driveJson(`${DRIVE_API}/files/${id}?fields=parents&supportsAllDrives=true`, token);
  const fromParent = meta.parents?.[0];
  const toParent = parentOf(config, folderId);
  if (!fromParent) throw new DriveError('Não foi possível localizar a pasta atual do arquivo.');
  await moveItem(token, id, fromParent, toParent);
}

export async function deleteDriveFolder(root, config, folderId) {
  const rootId = assertDriveId(config.folderId, 'DRIVE_FOLDER_ID');
  const targetId = assertDriveId(folderId, 'pasta');
  if (targetId === rootId) throw new DriveError('A pasta raiz do acervo não pode ser excluída.');
  const token = await getAccessToken(root, config);
  const folderIds = [];
  const fileMoves = [];
  const queue = [targetId];
  const seen = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (seen.has(current)) continue;
    seen.add(current);
    folderIds.push(current);
    const children = await listChildren(current, token);
    for (const child of children) {
      if (child.mimeType === FOLDER_MIME) queue.push(child.id);
      else fileMoves.push({ id: child.id, from: current });
    }
  }

  for (const file of fileMoves) {
    await moveItem(token, file.id, file.from, rootId);
  }
  for (const id of folderIds.reverse()) {
    const response = await fetch(`${DRIVE_API}/files/${id}?supportsAllDrives=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok && response.status !== 404) {
      throw new DriveError('Não foi possível excluir a pasta no Drive.');
    }
  }
}

export async function uploadDriveFile(root, config, { name, mimeType, folderId, bytes }) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new DriveError('O arquivo precisa de um nome.');
  if (!bytes?.length) throw new DriveError('O arquivo está vazio.');
  const token = await getAccessToken(root, config);
  const boundary = `acervo_${Math.random().toString(16).slice(2)}`;
  const meta = JSON.stringify({
    name: cleanName,
    parents: [parentOf(config, folderId)],
  });
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([head, bytes, tail]);
  const response = await fetch(`${DRIVE_API.replace('/drive/v3', '/upload/drive/v3')}/files?uploadType=multipart&supportsAllDrives=true&fields=id,name`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new DriveError(payload.error?.message || 'Não foi possível enviar o arquivo.');
  }
  return payload;
}

export async function openDriveMedia(root, config, fileId, rangeHeader) {
  const token = await getAccessToken(root, config);
  const id = assertDriveId(fileId, 'arquivo');
  const meta = await driveJson(`${DRIVE_API}/files/${id}?fields=name,mimeType&supportsAllDrives=true`, token);
  const isDoc = String(meta.mimeType || '').startsWith('application/vnd.google-apps.');
  const headers = { Authorization: `Bearer ${token}` };
  let url = `${DRIVE_API}/files/${id}?alt=media&supportsAllDrives=true`;
  if (isDoc) {
    url = `${DRIVE_API}/files/${id}/export?mimeType=${encodeURIComponent('application/pdf')}&supportsAllDrives=true`;
  } else if (rangeHeader) {
    headers.Range = rangeHeader;
  }
  const response = await fetch(url, { headers });
  if (!response.ok && response.status !== 206) {
    throw new DriveError('Não foi possível abrir o arquivo no Drive.', response.status === 404 ? 404 : 502);
  }
  return {
    response,
    contentType: isDoc ? 'application/pdf' : (response.headers.get('content-type') || meta.mimeType || 'application/octet-stream'),
    name: meta.name,
  };
}

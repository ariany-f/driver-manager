import crypto from 'node:crypto';
import { DriveError } from './driveClient.js';

const COOKIE = 'acervo_session';
const sessions = new Map();
const SESSION_MS = 12 * 60 * 60 * 1000;

function unwrap(value) {
  const text = String(value ?? '').trim();
  const quoted = text.length >= 2 && ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")));
  return quoted ? text.slice(1, -1) : text;
}

function parseCookies(header) {
  const cookies = {};
  String(header || '').split(';').forEach(part => {
    const separator = part.indexOf('=');
    if (separator === -1) return;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function sessionToken(req) {
  return parseCookies(req.headers.cookie)[COOKIE] || '';
}

export function isAdminRequest(req) {
  const token = sessionToken(req);
  const session = token ? sessions.get(token) : null;
  if (!session) return false;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function cookieBase(req) {
  const host = String(req.headers.host || '').split(':')[0];
  const secure = host === 'localhost' || host === '127.0.0.1';
  return `HttpOnly; SameSite=Lax; Path=/${secure ? '; Secure' : ''}`;
}

function expectedAdmin(env) {
  return {
    email: unwrap(env.ADMIN_EMAIL || env.VITE_ADMIN_EMAIL).toLowerCase(),
    password: unwrap(env.ADMIN_PASSWORD || env.VITE_ADMIN_PASSWORD),
  };
}

function sameSecret(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new DriveError('O pedido não veio em JSON.');
  }
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export async function handleAuthRequest(req, res, env) {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/api/auth/session') {
    sendJson(res, 200, { admin: isAdminRequest(req) });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await readJson(req);
    const expected = expectedAdmin(env);
    const email = unwrap(body.email).toLowerCase();
    const password = unwrap(body.password);
    if (!expected.email || !expected.password || email !== expected.email || !sameSecret(password, expected.password)) {
      throw new DriveError('E-mail ou senha incorretos.', 401);
    }
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { expiresAt: Date.now() + SESSION_MS });
    res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieBase(req)}`);
    sendJson(res, 200, { admin: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = sessionToken(req);
    if (token) sessions.delete(token);
    res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieBase(req)}; Max-Age=0`);
    sendJson(res, 200, { admin: false });
    return;
  }

  sendJson(res, 404, { error: 'Rota de acesso não encontrada.' });
}

export function requiresAdmin(method, pathname) {
  if (pathname === '/api/drive/settings') return true;
  if (pathname === '/api/drive/connect' || pathname === '/api/drive/disconnect') return true;
  if (pathname === '/api/drive/upload' || pathname === '/api/drive/folders') return true;
  if (pathname.startsWith('/api/drive/folders/')) return true;
  if (pathname.startsWith('/api/drive/files/') && method !== 'GET') return true;
  return false;
}

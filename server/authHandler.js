import { DriveError } from './driveClient.js';
import { handleAuthRequest } from './session.js';

export function attachPath(req, pathname) {
  const raw = String(req.url || '');
  const search = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
  req.url = `${pathname}${search}`;
}

export async function runAuth(req, res) {
  try {
    await handleAuthRequest(req, res, process.env);
  } catch (error) {
    if (res.headersSent) return;
    const status = error instanceof DriveError ? error.status : 500;
    res.statusCode = status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error.message || 'Não foi possível entrar.' }));
  }
}

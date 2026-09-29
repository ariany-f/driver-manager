import { handleApi } from '../server/driveApi.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

function requestUrl(req) {
  const raw = req.url || '/';
  let path = raw;
  let query = '';
  try {
    const parsed = raw.startsWith('http') ? new URL(raw) : new URL(raw, 'http://localhost');
    path = parsed.pathname;
    query = parsed.search;
  } catch {
    path = raw.split('?')[0];
    query = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
  }
  if (path.startsWith('/api/')) return path + query;
  const parts = [].concat(req.query?.path || []).filter(Boolean);
  if (parts.length) return `/api/${parts.join('/')}${query}`;
  if (path.startsWith('/auth') || path.startsWith('/drive') || path.startsWith('/database')) return `/api${path}${query}`;
  return path + query;
}

export default async function handler(req, res) {
  req.url = requestUrl(req);
  await handleApi(req, res, { root: process.cwd(), env: process.env });
}

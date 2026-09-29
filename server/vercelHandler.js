import { handleApi } from './driveApi.js';

export function attachPath(req, pathname) {
  const raw = String(req.url || '');
  const search = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
  req.url = `${pathname}${search}`;
}

export function runApi(req, res) {
  return handleApi(req, res, { root: process.cwd(), env: process.env });
}

export function segment(req, name) {
  const value = req.query?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return value ? String(value) : '';
}

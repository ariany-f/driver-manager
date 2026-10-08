import { DriveError } from './driveClient.js';
import { getDbConnection } from './database.js';
import { createUser, updateUserPassword, deleteUser, listUsers } from './services/UserService.js';
import { isAdminRequest } from './session.js';

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body));
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = await readBody(req);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new DriveError('O pedido não veio em JSON.');
  }
}

export async function handleUserRequest(req, res, env) {
  if (!isAdminRequest(req, env)) {
    sendJson(res, 401, { error: 'Entre como equipe para continuar.' });
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  try {
    const db = await getDbConnection(env);

    if (req.method === 'GET' && pathname === '/api/users/list') {
      const users = await listUsers(db);
      sendJson(res, 200, users);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/users/create') {
      const body = await readJson(req);
      if (!body.email || !body.password) throw new DriveError('Email e senha são obrigatórios.', 400);
      const id = await createUser(db, body.email, body.password, body.role || 'user');
      sendJson(res, 200, { id });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/users/update_password') {
      const body = await readJson(req);
      if (!body.id || !body.password) throw new DriveError('ID do usuário e nova senha são obrigatórios.', 400);
      await updateUserPassword(db, body.id, body.password);
      sendJson(res, 200, { success: true });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/users/delete') {
      const body = await readJson(req);
      if (!body.id) throw new DriveError('ID do usuário é obrigatório.', 400);
      await deleteUser(db, body.id);
      sendJson(res, 200, { success: true });
      return;
    }

    sendJson(res, 404, { error: 'Rota não encontrada.' });
  } catch (error) {
    const status = error instanceof DriveError ? error.status : 500;
    sendJson(res, status, { error: error.message || 'Erro interno no servidor.' });
  }
}

import { Readable } from 'node:stream';
import { handleApi } from '../server/driveApi.js';

const env = {
  ADMIN_EMAIL: 'admin@acervo.com.br',
  ADMIN_PASSWORD: 'Mudar123@',
};

function mockReq({ method, url, headers = {}, body = '' }) {
  const req = Readable.from([Buffer.from(body)]);
  req.method = method;
  req.url = url;
  req.headers = headers;
  return req;
}

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    headersSent: false,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    end(data) {
      this.headersSent = true;
      this.body = data || '';
    },
  };
}

async function call(options) {
  const req = mockReq(options);
  const res = mockRes();
  await handleApi(req, res, { root: process.cwd(), env });
  return { status: res.statusCode, body: res.body, cookie: res.headers['set-cookie'] || '' };
}

const wrong = await call({
  method: 'POST',
  url: '/api/auth/login',
  headers: { host: 'localhost:5174', 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'admin@acervo.com.br', password: 'errada' }),
});

const login = await call({
  method: 'POST',
  url: '/api/auth/login',
  headers: { host: 'localhost:5174', 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'admin@acervo.com.br', password: 'Mudar123@' }),
});

const cookie = String(login.cookie).split(';')[0];
const session = await call({
  method: 'GET',
  url: '/api/auth/session',
  headers: { host: 'localhost:5174', cookie },
});

const missing = await call({
  method: 'POST',
  url: '/api/auth/login',
  headers: { host: 'app.vercel.app', 'x-forwarded-proto': 'https', 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'admin@acervo.com.br', password: 'Mudar123@' }),
});

console.log(JSON.stringify({
  wrong: wrong.status,
  login: login.status,
  session: JSON.parse(session.body || '{}'),
  secure: missing.cookie.includes('Secure'),
  httpOnly: missing.cookie.includes('HttpOnly'),
}, null, 2));

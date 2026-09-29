import { attachPath, runApi } from '../../server/vercelHandler.js';

export default function handler(req, res) {
  attachPath(req, '/api/auth/session');
  return runApi(req, res);
}

import { attachPath, runApi } from '../../server/vercelHandler.js';

export default function handler(req, res) {
  attachPath(req, '/api/auth/login');
  return runApi(req, res);
}

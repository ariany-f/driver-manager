import { attachPath, runApi } from '../../server/vercelHandler.js';

export default function handler(req, res) {
  attachPath(req, '/api/auth/logout');
  return runApi(req, res);
}

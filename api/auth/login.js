import { attachPath, runAuth } from '../../server/authHandler.js';

export default function handler(req, res) {
  attachPath(req, '/api/auth/login');
  return runAuth(req, res);
}

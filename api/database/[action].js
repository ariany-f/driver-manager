import { attachPath, runApi, segment } from '../../server/vercelHandler.js';

export default function handler(req, res) {
  attachPath(req, `/api/database/${segment(req, 'action')}`);
  return runApi(req, res);
}

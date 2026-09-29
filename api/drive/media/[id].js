import { attachPath, runApi, segment } from '../../../server/vercelHandler.js';

export default function handler(req, res) {
  attachPath(req, `/api/drive/media/${segment(req, 'id')}`);
  return runApi(req, res);
}

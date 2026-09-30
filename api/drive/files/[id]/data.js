import { attachPath, runApi, segment } from '../../../../server/vercelHandler.js';

export default function handler(req, res) {
  attachPath(req, `/api/drive/files/${segment(req, 'id')}/data`);
  return runApi(req, res);
}

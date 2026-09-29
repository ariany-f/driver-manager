async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Não foi possível falar com o Google Drive.');
  }
  return payload;
}

export function getDriveStatus() {
  return fetch('/api/drive/status').then(readJson);
}

export function getDriveSettings() {
  return fetch('/api/drive/settings').then(readJson);
}

export function saveDriveSettings(settings) {
  return fetch('/api/drive/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(settings),
  }).then(readJson);
}

export function syncDrive() {
  return fetch('/api/drive/sync').then(readJson);
}

export function disconnectDrive() {
  return fetch('/api/drive/disconnect', { method: 'POST' }).then(readJson);
}

export function uploadDriveFile(file, folderId) {
  const params = new URLSearchParams({
    name: file.name,
    folderId: folderId || '',
  });
  return fetch(`/api/drive/upload?${params.toString()}`, {
    method: 'POST',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    body: file,
  }).then(readJson);
}

export function createDriveFolder(name, parentId) {
  return fetch('/api/drive/folders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, parentId: parentId || '' }),
  }).then(readJson);
}

export function renameDriveFolder(folderId, name) {
  return fetch(`/api/drive/folders/${folderId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then(readJson);
}

export function deleteDriveFolder(folderId) {
  return fetch(`/api/drive/folders/${folderId}`, { method: 'DELETE' }).then(readJson);
}

export function moveDriveFile(fileId, folderId) {
  return fetch(`/api/drive/files/${fileId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ folderId: folderId || '' }),
  }).then(readJson);
}

export function saveDriveClassificacao(fileId, territorios, tags) {
  return fetch(`/api/drive/files/${fileId}/classificacao`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ territorios, tags }),
  }).then(readJson);
}

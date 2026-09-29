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

export function listDriveFolders(parentId) {
  const params = parentId ? `?parent=${encodeURIComponent(parentId)}` : '';
  return fetch(`/api/drive/pastas${params}`, { credentials: 'same-origin' }).then(readJson);
}

export function saveDriveFolder(folderId) {
  return fetch('/api/drive/pasta', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ folderId }),
  }).then(readJson);
}

export function previewDrive() {
  return fetch('/api/drive/novidades').then(readJson);
}

export function uploadDriveFile(file, folderId) {
  const params = new URLSearchParams({
    name: file.name,
    folderId: folderId || '',
  });
  return fetch(`/api/drive/upload?${params.toString()}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    body: file,
  }).then(readJson);
}

export function syncDrive() {
  return fetch('/api/drive/sync', { credentials: 'same-origin' }).then(readJson);
}

export function disconnectDrive() {
  return fetch('/api/drive/disconnect', { method: 'POST' }).then(readJson);
}

export function saveDriveClassificacao(fileId, territorios, tags) {
  return fetch(`/api/drive/files/${fileId}/classificacao`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ territorios, tags }),
  }).then(readJson);
}

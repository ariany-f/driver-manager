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
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(settings),
  }).then(readJson);
}

export function saveDriveField(key, value) {
  return saveDriveSettings({ [key]: value });
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

export function uploadDriveFile(file, folderId, onProgress) {
  const params = new URLSearchParams({
    name: file.name,
    folderId: folderId || '',
  });
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `/api/drive/upload?${params.toString()}`);
    request.withCredentials = true;
    request.setRequestHeader('content-type', file.type || 'application/octet-stream');
    request.upload.onprogress = (event) => {
      if (!onProgress) return;
      onProgress({
        loaded: event.loaded,
        total: event.lengthComputable ? event.total : file.size,
      });
    };
    request.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(request.responseText || '{}');
      } catch {
        payload = {};
      }
      if (request.status >= 200 && request.status < 300) resolve(payload);
      else reject(new Error(payload.error || 'Não foi possível enviar o arquivo.'));
    };
    request.onerror = () => reject(new Error('Não foi possível enviar o arquivo.'));
    request.send(file);
  });
}

export function syncDrive() {
  return fetch('/api/drive/sync', { credentials: 'same-origin' }).then(readJson);
}

export function disconnectDrive() {
  return fetch('/api/drive/disconnect', { method: 'POST' }).then(readJson);
}

export function renameDriveArquivo(fileId, name, drive) {
  return fetch(`/api/drive/files/${fileId}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, drive }),
  }).then(readJson);
}

export function saveArquivoData(fileId, dataArquivo) {
  return fetch(`/api/drive/files/${fileId}/data`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dataArquivo }),
  }).then(readJson);
}

export function saveArquivoOrigem(fileId, origem) {
  return fetch(`/api/drive/files/${fileId}/origem`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ origem }),
  }).then(readJson);
}

export function saveDriveClassificacao(fileId, territorios, tags, formatos) {
  return fetch(`/api/drive/files/${fileId}/classificacao`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ territorios, tags, formatos: formatos || [] }),
  }).then(readJson);
}

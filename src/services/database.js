async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Não foi possível falar com o banco.');
  }
  return payload;
}

export function getDatabaseStatus() {
  return fetch('/api/database/status', { credentials: 'same-origin' }).then(readJson);
}

export function getDatabaseSettings() {
  return fetch('/api/database/settings', { credentials: 'same-origin' }).then(readJson);
}

export function saveDatabaseSettings(settings) {
  return fetch('/api/database/settings', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(settings),
  }).then(readJson);
}

export function getIdentidade() {
  return fetch('/api/database/identidade', { credentials: 'same-origin' }).then(readJson);
}

export function saveTerritorios(territorios) {
  return fetch('/api/database/territorios', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ territorios }),
  }).then(readJson);
}

export function saveTags(tags) {
  return fetch('/api/database/tags', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tags }),
  }).then(readJson);
}

export function saveFormatos(formatos) {
  return fetch('/api/database/formatos', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ formatos }),
  }).then(readJson);
}

export function createPasta({ name, parentId }) {
  return fetch('/api/database/pastas', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, parentId: parentId || '' }),
  }).then(readJson);
}

export function renamePasta({ id, name }) {
  return fetch('/api/database/pastas', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, name }),
  }).then(readJson);
}

export function deletePasta(id) {
  return fetch('/api/database/pastas', {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  }).then(readJson);
}

export function getLogo() {
  return fetch('/api/database/logo', { credentials: 'same-origin' }).then(async response => {
    if (response.status === 204) return '';
    if (!response.ok) throw new Error('Não foi possível carregar a logo.');
    const blob = await response.blob();
    return blob.size ? URL.createObjectURL(blob) : '';
  });
}

export function saveLogo(image) {
  return fetch('/api/database/logo', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image }),
  }).then(readJson);
}

export function removeLogo() {
  return fetch('/api/database/logo', { method: 'DELETE', credentials: 'same-origin' }).then(readJson);
}

export function getFavicon() {
  return fetch('/api/database/favicon', { credentials: 'same-origin' }).then(async response => {
    if (response.status === 204) return '';
    if (!response.ok) throw new Error('Não foi possível carregar o favicon.');
    await response.arrayBuffer();
    return `/api/database/favicon?v=${Date.now()}`;
  });
}

export function saveFavicon(image) {
  return fetch('/api/database/favicon', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image }),
  }).then(readJson);
}

export function removeFavicon() {
  return fetch('/api/database/favicon', { method: 'DELETE', credentials: 'same-origin' }).then(readJson);
}

export function getVlibras() {
  return fetch('/api/database/vlibras', { credentials: 'same-origin' }).then(readJson);
}

export function saveVlibras(enabled) {
  return fetch('/api/database/vlibras', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ enabled: Boolean(enabled) }),
  }).then(readJson);
}

export function getContato() {
  return fetch('/api/database/contato', { credentials: 'same-origin' }).then(readJson);
}

export function saveContato(email) {
  return fetch('/api/database/contato', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(readJson);
}

export function moveArquivo(fileId, pastaId) {
  return fetch('/api/database/arquivos', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fileId, pastaId: pastaId || '' }),
  }).then(readJson);
}

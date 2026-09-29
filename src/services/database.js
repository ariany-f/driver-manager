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

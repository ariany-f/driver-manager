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

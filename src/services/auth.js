async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Não foi possível entrar.');
  }
  return payload;
}

export async function getSession() {
  const payload = await fetch('/api/auth/session', { credentials: 'same-origin' }).then(readJson);
  return Boolean(payload.admin);
}

export function login(email, password) {
  return fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(readJson);
}

export function logout() {
  return fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).then(readJson);
}

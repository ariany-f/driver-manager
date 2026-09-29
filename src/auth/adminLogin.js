function unwrap(value) {
  const text = String(value ?? '').trim();
  const quoted = text.length >= 2 && ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")));
  return quoted ? text.slice(1, -1) : text;
}

export function credentialsMatch(email, password) {
  const expectedEmail = unwrap(import.meta.env.VITE_ADMIN_EMAIL).toLowerCase();
  const expectedPassword = unwrap(import.meta.env.VITE_ADMIN_PASSWORD);
  if (!expectedEmail || !expectedPassword) return false;
  return unwrap(email).toLowerCase() === expectedEmail && unwrap(password) === expectedPassword;
}

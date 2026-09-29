export function credentialsMatch(email, password) {
  const expectedEmail = String(import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
  const expectedPassword = String(import.meta.env.VITE_ADMIN_PASSWORD || '');
  if (!expectedEmail || !expectedPassword) return false;
  return email.trim().toLowerCase() === expectedEmail && password === expectedPassword;
}

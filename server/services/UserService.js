import crypto from 'node:crypto';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
}

export async function ensureMasterUser(db) {
  const [rows] = await db.query("SELECT id FROM usuarios WHERE email = 'admin@acervo.com.br'");
  if (rows.length === 0) {
    const masterId = crypto.randomUUID();
    const hashedPassword = hashPassword('Mudar123@');
    await db.query(
      "INSERT INTO usuarios (id, email, password_hash, role) VALUES (?, ?, ?, 'master')",
      [masterId, 'admin@acervo.com.br', hashedPassword]
    );
  }
}

export async function authenticateUser(db, email, password) {
  const [rows] = await db.query("SELECT id, email, password_hash, role FROM usuarios WHERE email = ?", [email.toLowerCase()]);
  if (rows.length === 0) return null;
  
  const user = rows[0];
  if (verifyPassword(password, user.password_hash)) {
    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
  return null;
}

export async function createUser(db, email, password, role = 'user') {
  const id = crypto.randomUUID();
  const hashedPassword = hashPassword(password);
  await db.query(
    "INSERT INTO usuarios (id, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [id, email.toLowerCase(), hashedPassword, role]
  );
  return id;
}

export async function updateUserPassword(db, userId, newPassword) {
  const hashedPassword = hashPassword(newPassword);
  await db.query("UPDATE usuarios SET password_hash = ? WHERE id = ?", [hashedPassword, userId]);
}

export async function deleteUser(db, userId) {
  await db.query("DELETE FROM usuarios WHERE id = ?", [userId]);
}

export async function listUsers(db) {
  const [rows] = await db.query("SELECT id, email, role, created_at FROM usuarios ORDER BY created_at DESC");
  return rows;
}

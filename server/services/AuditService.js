import crypto from 'node:crypto';

export async function logAudit(db, userId, action, entity, entityId, details) {
  const id = crypto.randomUUID();
  await db.query(
    "INSERT INTO audit_logs (id, user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)",
    [id, userId || null, action, entity, entityId || null, JSON.stringify(details || {})]
  );
}

export async function getAuditLogs(db, limit = 100) {
  const [rows] = await db.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?", [limit]);
  return rows;
}

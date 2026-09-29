export function getDriveFolderId() {
  return String(import.meta.env.VITE_DRIVE_FOLDER_ID || '').trim();
}

export function isDriveConnected() {
  return Boolean(getDriveFolderId());
}

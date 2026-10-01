export const BACKUP_KIND = 'driver-manager/classificacoes';

function slug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function backupFileName(backup) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const who = slug(backup?.conta?.email?.split('@')[0]) || 'acervo';
  return `classificacoes-${who}-${day}.json`;
}

export function downloadBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName(backup);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function countClassified(backup) {
  return (backup?.arquivos || []).filter(item => (item.territorios || []).length
    || (item.tags || []).length
    || item.status
    || item.origem
    || item.dataArquivo
    || item.nome
    || item.oculto).length;
}

export async function readBackupFile(file) {
  if (!file) throw new Error('Escolha um arquivo.');
  if (file.size > 25 * 1024 * 1024) throw new Error('O arquivo passa de 25 MB. Não parece um backup de classificações.');
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('Esse arquivo não é um JSON válido.');
  }
  if (!data || data.tipo !== BACKUP_KIND || !Array.isArray(data.arquivos)) {
    throw new Error('Esse JSON não é um backup de classificações do Driver Manager.');
  }
  return data;
}

export function formatBackupDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function compareAccounts(backup, status) {
  const before = String(backup?.conta?.email || '').trim().toLowerCase();
  const now = String(status?.account || '').trim().toLowerCase();
  const sameAccount = Boolean(before && now && before === now);
  const sameFolder = Boolean(backup?.conta?.pastaId && status?.folderId && backup.conta.pastaId === status.folderId);
  return { before, now, sameAccount, sameFolder, unknown: !before || !now };
}

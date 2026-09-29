import PreviewThumb from './PreviewThumb.jsx';

const MAX_BYTES = 8 * 1024 * 1024;

export function isSpreadsheet(file) {
  const name = String(file?.name || '').toLowerCase();
  const mime = String(file?.mimeType || '');
  return /\.(xlsx|xls|xlsm)$/.test(name)
    || mime === 'application/vnd.ms-excel'
    || mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || mime === 'application/vnd.ms-excel.sheet.macroEnabled.12'
    || mime === 'application/vnd.google-apps.spreadsheet';
}

function drawSheet(rows) {
  const cols = 4;
  const shown = rows.slice(0, 8).map(row => (Array.isArray(row) ? row.slice(0, cols) : []));
  const canvas = document.createElement('canvas');
  const width = 144;
  const rowH = 18;
  const height = rowH * Math.max(shown.length, 4);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.font = '8px sans-serif';
  ctx.textBaseline = 'middle';
  const colW = width / cols;
  const count = Math.max(shown.length, 4);
  for (let rowIndex = 0; rowIndex < count; rowIndex += 1) {
    const top = rowIndex * rowH;
    ctx.fillStyle = rowIndex === 0 ? '#F4EFE6' : '#ffffff';
    ctx.fillRect(0, top, width, rowH);
    ctx.strokeStyle = '#2C1A14';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(0.5, top + 0.5, width - 1, rowH - 1);
    const row = shown[rowIndex] || [];
    ctx.fillStyle = '#2C1A14';
    for (let col = 0; col < cols; col += 1) {
      const left = col * colW;
      ctx.strokeRect(left + 0.5, top + 0.5, colW, rowH - 1);
      const text = String(row[col] ?? '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(left + 2, top, colW - 4, rowH);
      ctx.clip();
      ctx.fillText(text, left + 3, top + rowH / 2);
      ctx.restore();
    }
  }
  return canvas.toDataURL('image/jpeg', 0.8);
}

async function renderSheet(url) {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) throw new Error('planilha');
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_BYTES) throw new Error('grande');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) throw new Error('grande');
  const XLSX = await import('xlsx');
  const book = XLSX.read(buffer, { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) throw new Error('vazia');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  return drawSheet(rows.slice(0, 8));
}

export default function SheetThumb({ file, iconSize = 28, badge = false }) {
  return <PreviewThumb file={file} iconSize={iconSize} badge={badge} render={renderSheet} />;
}

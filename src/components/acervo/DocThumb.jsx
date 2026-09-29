import PreviewThumb from './PreviewThumb.jsx';

const MAX_BYTES = 8 * 1024 * 1024;

export function isDocx(file) {
  const name = String(file?.name || '').toLowerCase();
  const mime = String(file?.mimeType || '');
  return name.endsWith('.docx') || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

function readZipEntry(buffer, wanted) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const min = Math.max(0, bytes.length - 22 - 65535);
  let directory = null;
  for (let index = bytes.length - 22; index >= min; index -= 1) {
    if (view.getUint32(index, true) !== 0x06054b50) continue;
    directory = { count: view.getUint16(index + 10, true), offset: view.getUint32(index + 16, true) };
    break;
  }
  if (!directory) return null;
  let cursor = directory.offset;
  for (let index = 0; index < directory.count; index += 1) {
    if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== 0x02014b50) return null;
    const method = view.getUint16(cursor + 10, true);
    const size = view.getUint32(cursor + 20, true);
    const nameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLen));
    if (name === wanted) {
      const localName = view.getUint16(localOffset + 26, true);
      const localExtra = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localName + localExtra;
      return { method, data: bytes.subarray(dataStart, dataStart + size) };
    }
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

async function inflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function documentText(xml) {
  return xml
    .replace(/<w:p[ >]/g, '\n')
    .replace(/<w:tab\/>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function drawDoc(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 144;
  canvas.height = 188;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 144, 188);
  ctx.fillStyle = '#2C1A14';
  ctx.font = '9px sans-serif';
  ctx.textBaseline = 'top';
  const paragraphs = text.split('\n');
  let y = 10;
  paragraphs.some(paragraph => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    words.some(word => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > 124 && line) {
        ctx.fillText(line, 10, y);
        y += 13;
        line = word;
      } else {
        line = next;
      }
      return y > 170;
    });
    if (y > 170) return true;
    if (line) {
      ctx.fillText(line, 10, y);
      y += 16;
    }
    return y > 170;
  });
  return canvas.toDataURL('image/jpeg', 0.8);
}

async function renderDoc(url) {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) throw new Error('documento');
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_BYTES) throw new Error('grande');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) throw new Error('grande');
  const entry = readZipEntry(buffer, 'word/document.xml');
  if (!entry) throw new Error('docx');
  const xmlBytes = entry.method === 0 ? entry.data : await inflate(entry.data);
  const text = documentText(new TextDecoder().decode(xmlBytes));
  if (!text) throw new Error('vazio');
  return drawDoc(text);
}

export default function DocThumb({ file, iconSize = 28, badge = false }) {
  return <PreviewThumb file={file} iconSize={iconSize} badge={badge} render={renderDoc} />;
}

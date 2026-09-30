const KNOWN_EXTENSIONS = new Set(
  `pdf doc docx docm dot dotx odt rtf txt md tex
xls xlsx xlsm xlsb xlt xltx ods csv tsv
ppt pptx pptm pps ppsx potx odp
jpg jpeg png gif webp svg bmp tif tiff heic heif ico avif jfif
mp4 mov avi mkv webm wmv m4v mpeg mpg 3gp flv
mp3 wav ogg m4a aac flac wma opus aiff
zip rar 7z tar gz
json xml html htm kml kmz gpx geojson shp
epub gdoc`
    .trim()
    .split(/\s+/)
    .map(ext => ext.toUpperCase()),
);

const MIME_EXTENSIONS = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/rtf': 'RTF',
  'application/epub+zip': 'EPUB',
  'application/json': 'JSON',
  'application/xml': 'XML',
  'application/zip': 'ZIP',
  'application/gzip': 'GZ',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.ms-excel.sheet.macroEnabled.12': 'XLSM',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.google-apps.document': 'GDOC',
  'application/vnd.google-apps.spreadsheet': 'XLSX',
  'application/vnd.google-apps.presentation': 'PPTX',
  'application/vnd.oasis.opendocument.text': 'ODT',
  'application/vnd.oasis.opendocument.spreadsheet': 'ODS',
  'application/vnd.oasis.opendocument.presentation': 'ODP',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'text/html': 'HTML',
  'text/xml': 'XML',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'image/gif': 'GIF',
  'image/svg+xml': 'SVG',
  'image/bmp': 'BMP',
  'image/tiff': 'TIFF',
  'image/heic': 'HEIC',
  'image/avif': 'AVIF',
  'audio/mpeg': 'MP3',
  'audio/mp4': 'M4A',
  'audio/wav': 'WAV',
  'audio/x-wav': 'WAV',
  'audio/ogg': 'OGG',
  'audio/flac': 'FLAC',
  'audio/aac': 'AAC',
  'video/mp4': 'MP4',
  'video/quicktime': 'MOV',
  'video/webm': 'WEBM',
  'video/x-msvideo': 'AVI',
  'video/x-matroska': 'MKV',
  'video/mpeg': 'MPEG',
};

function knownExtension(value) {
  const ext = String(value || '').toUpperCase();
  return KNOWN_EXTENSIONS.has(ext) ? ext : '';
}

function extensionFromMime(mime) {
  const normalized = String(mime || '').toLowerCase().split(';')[0].trim();
  if (!normalized) return '';
  if (MIME_EXTENSIONS[normalized]) return MIME_EXTENSIONS[normalized];
  const slash = normalized.indexOf('/');
  if (slash < 0) return '';
  const token = normalized.slice(slash + 1).split(/[+.]/).pop();
  return knownExtension(token);
}

export function fileExtension(file) {
  const name = String(file?.name || '');
  const dot = name.lastIndexOf('.');
  if (dot > 0 && dot < name.length - 1) {
    const fromName = knownExtension(name.slice(dot + 1));
    if (fromName) return fromName;
  }
  return extensionFromMime(file?.mimeType);
}

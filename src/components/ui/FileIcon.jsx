import { FileSpreadsheet, FileText, FileType, Image as ImageIcon, Music, Video } from 'lucide-react';

function resolveKind(type, file) {
  const name = String(file?.name || '').toLowerCase();
  const mime = String(file?.mimeType || '');
  if (/\.(xlsx|xls|xlsm)$/.test(name) || mime === 'application/vnd.ms-excel' || mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mime === 'application/vnd.ms-excel.sheet.macroEnabled.12' || mime === 'application/vnd.google-apps.spreadsheet') return 'spreadsheet';
  if (/\.(docx|doc)$/.test(name) || mime === 'application/msword' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'word';
  return type || file?.type || 'document';
}

export default function FileIcon({ type, file, className = '', size = 24 }) {
  switch (resolveKind(type, file)) {
    case 'video': return <Video className={`text-[#C13B22] ${className}`} size={size} strokeWidth={2} />;
    case 'image': return <ImageIcon className={`text-[#EAB308] ${className}`} size={size} strokeWidth={2} />;
    case 'audio': return <Music className={`text-[#849B55] ${className}`} size={size} strokeWidth={2} />;
    case 'spreadsheet': return <FileSpreadsheet className={`text-[#849B55] ${className}`} size={size} strokeWidth={2} />;
    case 'word': return <FileType className={`text-[#C13B22] ${className}`} size={size} strokeWidth={2} />;
    default: return <FileText className={`text-[#1E3A5F] ${className}`} size={size} strokeWidth={2} />;
  }
}

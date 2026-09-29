import { FileText, Image as ImageIcon, Music, Video } from 'lucide-react';

export default function FileIcon({ type, className = '', size = 24 }) {
  switch (type) {
    case 'video': return <Video className={`text-[#C13B22] ${className}`} size={size} strokeWidth={2} />;
    case 'image': return <ImageIcon className={`text-[#EAB308] ${className}`} size={size} strokeWidth={2} />;
    case 'audio': return <Music className={`text-[#849B55] ${className}`} size={size} strokeWidth={2} />;
    default: return <FileText className={`text-[#1E3A5F] ${className}`} size={size} strokeWidth={2} />;
  }
}

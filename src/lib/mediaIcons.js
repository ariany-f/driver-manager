import { createElement } from 'react';
import {
  Archive,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  Clapperboard,
  FileText,
  Film,
  Flag,
  Globe,
  GraduationCap,
  Handshake,
  Headphones,
  Home,
  Image,
  Landmark,
  Leaf,
  Library,
  Map,
  MapPin,
  Megaphone,
  Mic,
  Music,
  Newspaper,
  NotebookPen,
  Palette,
  PenLine,
  Quote,
  Radio,
  ScrollText,
  Stamp,
  Users,
  Video,
} from 'lucide-react';
import { MEDIA_ICON_IDS } from './mediaIconIds.js';

const ICONS = {
  newspaper: { label: 'Jornal', Icon: Newspaper },
  'book-open': { label: 'Livro aberto', Icon: BookOpen },
  'book-marked': { label: 'Livro', Icon: BookMarked },
  'scroll-text': { label: 'Pergaminho', Icon: ScrollText },
  'file-text': { label: 'Documento', Icon: FileText },
  'notebook-pen': { label: 'Caderno', Icon: NotebookPen },
  image: { label: 'Imagem', Icon: Image },
  camera: { label: 'Câmera', Icon: Camera },
  film: { label: 'Filme', Icon: Film },
  clapperboard: { label: 'Claquete', Icon: Clapperboard },
  video: { label: 'Vídeo', Icon: Video },
  music: { label: 'Música', Icon: Music },
  mic: { label: 'Microfone', Icon: Mic },
  headphones: { label: 'Fone', Icon: Headphones },
  map: { label: 'Mapa', Icon: Map },
  'map-pin': { label: 'Local', Icon: MapPin },
  landmark: { label: 'Marco', Icon: Landmark },
  'building-2': { label: 'Prédio', Icon: Building2 },
  home: { label: 'Casa', Icon: Home },
  users: { label: 'Pessoas', Icon: Users },
  megaphone: { label: 'Megafone', Icon: Megaphone },
  radio: { label: 'Rádio', Icon: Radio },
  globe: { label: 'Globo', Icon: Globe },
  flag: { label: 'Bandeira', Icon: Flag },
  archive: { label: 'Arquivo', Icon: Archive },
  library: { label: 'Biblioteca', Icon: Library },
  'graduation-cap': { label: 'Estudo', Icon: GraduationCap },
  handshake: { label: 'Acordo', Icon: Handshake },
  quote: { label: 'Citação', Icon: Quote },
  'pen-line': { label: 'Texto', Icon: PenLine },
  palette: { label: 'Paleta', Icon: Palette },
  stamp: { label: 'Carimbo', Icon: Stamp },
  calendar: { label: 'Calendário', Icon: Calendar },
  leaf: { label: 'Folha', Icon: Leaf },
};

export const MEDIA_ICONS = MEDIA_ICON_IDS.map(id => ({ id, ...ICONS[id] }));

export function MediaGlyph({ icon, size = 14, strokeWidth = 2.5, className = '' }) {
  const found = ICONS[icon];
  if (!found) return null;
  const Icon = found.Icon;
  return createElement(Icon, {
    size,
    strokeWidth,
    className: `shrink-0 ${className}`,
    'aria-hidden': true,
  });
}

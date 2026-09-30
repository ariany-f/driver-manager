export const MEDIA_ICON_IDS = [
  'newspaper',
  'book-open',
  'book-marked',
  'scroll-text',
  'file-text',
  'notebook-pen',
  'image',
  'camera',
  'film',
  'clapperboard',
  'video',
  'music',
  'mic',
  'headphones',
  'map',
  'map-pin',
  'landmark',
  'building-2',
  'home',
  'users',
  'megaphone',
  'radio',
  'globe',
  'flag',
  'archive',
  'library',
  'graduation-cap',
  'handshake',
  'quote',
  'pen-line',
  'palette',
  'stamp',
  'calendar',
  'leaf',
];

const MEDIA_ICON_SET = new Set(MEDIA_ICON_IDS);

export function isMediaIcon(value) {
  return MEDIA_ICON_SET.has(value);
}

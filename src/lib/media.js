export const MEDIA_LABELS = {
  document: 'Documento',
  image: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
};

export function mediaLabel(type) {
  return MEDIA_LABELS[type] || 'Documento';
}

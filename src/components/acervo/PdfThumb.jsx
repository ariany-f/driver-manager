import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import PreviewThumb from './PreviewThumb.jsx';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export function isPdf(file) {
  const name = String(file?.name || '').toLowerCase();
  const mime = String(file?.mimeType || '');
  return name.endsWith('.pdf') || mime === 'application/pdf' || mime === 'application/vnd.google-apps.document';
}

async function renderFirstPage(url) {
  const pdf = await pdfjs.getDocument({
    url,
    withCredentials: true,
    disableRange: true,
    disableStream: true,
    isEvalSupported: false,
  }).promise;
  try {
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 144 / base.width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.72);
  } finally {
    await pdf.destroy();
  }
}

export default function PdfThumb({ file, iconSize = 28, badge = false }) {
  return <PreviewThumb file={file} iconSize={iconSize} badge={badge} render={renderFirstPage} />;
}

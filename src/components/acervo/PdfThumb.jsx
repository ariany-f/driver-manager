import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import FileIcon from '../ui/FileIcon.jsx';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const cache = new Map();
const pending = new Map();
let active = 0;
const queue = [];

function pump() {
  while (active < 2 && queue.length) {
    const job = queue.shift();
    active += 1;
    job.task()
      .then(job.resolve, job.reject)
      .finally(() => {
        active -= 1;
        pump();
      });
  }
}

function schedule(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    pump();
  });
}

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
    await page.render({ canvas, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.72);
  } finally {
    await pdf.destroy();
  }
}

function loadThumb(id, url) {
  if (cache.has(id)) return Promise.resolve(cache.get(id));
  if (pending.has(id)) return pending.get(id);
  const job = schedule(() => renderFirstPage(url)).then(image => {
    cache.set(id, image);
    pending.delete(id);
    return image;
  }).catch(error => {
    pending.delete(id);
    throw error;
  });
  pending.set(id, job);
  return job;
}

function Icon({ iconSize }) {
  return (
    <div className="w-full h-full bg-[#E4CFB2]/30 flex items-center justify-center">
      <FileIcon type="document" className="opacity-40" size={iconSize} />
    </div>
  );
}

export default function PdfThumb({ file, iconSize = 28 }) {
  const box = useRef(null);
  const [src, setSrc] = useState(() => cache.get(file.id) || '');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (src || failed) return undefined;
    const node = box.current;
    if (!node) return undefined;
    let alive = true;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      loadThumb(file.id, file.url)
        .then(image => {
          if (alive) setSrc(image);
        })
        .catch(() => {
          if (alive) setFailed(true);
        });
    }, { rootMargin: '160px' });
    observer.observe(node);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [failed, file.id, file.url, src]);

  if (failed) return <Icon iconSize={iconSize} />;
  if (src) return <img src={src} alt="" className="w-full h-full object-cover object-top bg-white" />;
  return (
    <div ref={box} className="w-full h-full">
      <Icon iconSize={iconSize} />
    </div>
  );
}

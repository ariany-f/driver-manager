import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

export default function PdfPreview({ file, onReady }) {
  const readyRef = useRef(onReady);
  const scrollerRef = useRef(null);
  const pagesRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [status, setStatus] = useState('loading');
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    let cancelled = false;
    let loaded = null;
    setPdf(null);
    setStatus('loading');
    setZoom(1);
    pdfjs.getDocument({
      url: file.url,
      withCredentials: true,
      disableRange: true,
      disableStream: true,
      isEvalSupported: false,
    }).promise.then(doc => {
      if (cancelled) {
        doc.destroy();
        return;
      }
      loaded = doc;
      setPdf({ doc, url: file.url });
      setStatus('ready');
    }).catch(() => {
      if (cancelled) return;
      setStatus('error');
      readyRef.current?.();
    });
    return () => {
      cancelled = true;
      loaded?.destroy();
    };
  }, [file.url]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = pagesRef.current;
    const doc = pdf?.doc;
    if (!doc || pdf.url !== file.url || !host || width < 32) return undefined;
    let cancelled = false;
    const tasks = [];
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const pageWidth = Math.max(32, width - 16);

    host.replaceChildren();
    (async () => {
      for (let number = 1; number <= doc.numPages; number += 1) {
        if (cancelled) return;
        const page = await doc.getPage(number);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const displayWidth = pageWidth * zoom;
        const viewport = page.getViewport({ scale: (displayWidth / base.width) * pixelRatio });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${Math.ceil(displayWidth)}px`;
        canvas.style.height = `${Math.ceil(viewport.height / pixelRatio)}px`;
        canvas.className = 'bg-white border-4 border-[#2C1A14] shadow-[4px_4px_0px_#2C1A14]';
        const frame = document.createElement('div');
        frame.className = 'flex justify-center';
        frame.appendChild(canvas);
        host.appendChild(frame);
        const task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
        tasks.push(task);
        await task.promise;
        if (number === 1 && !cancelled) readyRef.current?.();
      }
    })().catch(() => {
      if (!cancelled) readyRef.current?.();
    });

    return () => {
      cancelled = true;
      tasks.forEach(task => task.cancel());
    };
  }, [pdf, zoom, width, file.url]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center justify-center gap-2 border-b-4 border-[#2C1A14] bg-[#F4EFE6] p-2">
        <button
          type="button"
          aria-label="Diminuir zoom"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => setZoom(current => Math.max(MIN_ZOOM, Math.round((current - 0.25) * 100) / 100))}
          className="min-h-11 min-w-11 bg-white p-2 border-2 border-[#2C1A14] hover:bg-[#EAB308] disabled:opacity-40"
        >
          <ZoomOut size={22} />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="min-h-11 px-3 bg-white border-2 border-[#2C1A14] font-display font-black uppercase text-xs tracking-wider hover:bg-[#EAB308]"
        >
          Ajustar
        </button>
        <span className="min-w-12 text-center font-mono text-xs font-bold">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          aria-label="Aumentar zoom"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => setZoom(current => Math.min(MAX_ZOOM, Math.round((current + 0.25) * 100) / 100))}
          className="min-h-11 min-w-11 bg-white p-2 border-2 border-[#2C1A14] hover:bg-[#EAB308] disabled:opacity-40"
        >
          <ZoomIn size={22} />
        </button>
      </div>
      <div ref={scrollerRef} className="flex-1 min-h-0 overflow-auto p-2">
        {status === 'loading' && <p className="p-4 font-display font-black uppercase text-sm text-[#F4EFE6]">Abrindo PDF...</p>}
        {status === 'error' && <p className="p-4 font-sans font-bold text-sm text-[#F4EFE6]">Não foi possível abrir este PDF.</p>}
        <div ref={pagesRef} className="space-y-3" />
      </div>
    </div>
  );
}

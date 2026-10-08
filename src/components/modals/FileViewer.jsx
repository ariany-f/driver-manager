import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Music, X, ZoomIn, ZoomOut } from 'lucide-react';
import { isPdf } from '../acervo/PdfThumb.jsx';
import FileIcon from '../ui/FileIcon.jsx';
import PdfPreview from './PdfPreview.jsx';
import SpreadsheetPreview, { isSpreadsheet } from './SpreadsheetPreview.jsx';

function waitsForLoad(file) {
  return ['image', 'video', 'audio', 'document'].includes(file.type) || isSpreadsheet(file) || isPdf(file);
}

export default function FileViewer({ file, files = [], onClose, sheetElement, onShowFile, onReplaceFile, paused = false }) {
  const [scale, setScale] = useState(1);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [loadedId, setLoadedId] = useState('');
  const [replacing, setReplacing] = useState(false);
  const index = files.findIndex(item => item.id === file.id);
  const previous = index > 0 ? files[index - 1] : null;
  const next = index >= 0 && index < files.length - 1 ? files[index + 1] : null;
  const loading = waitsForLoad(file) && loadedId !== file.id;
  const markLoaded = useCallback(() => setLoadedId(file.id), [file.id]);

  const handleFileChange = async (event) => {
    const selected = event.target.files?.[0];
    if (!selected || !onReplaceFile) return;
    setReplacing(true);
    try {
      await onReplaceFile(file.id, selected);
      // Reload the image if it's an image
      if (file.type === 'image') {
        const url = new URL(file.url, window.location.origin);
        url.searchParams.set('t', Date.now());
        file.url = url.pathname + url.search;
        setLoadedId(''); // trigger reload
      }
    } finally {
      setReplacing(false);
      event.target.value = '';
    }
  };

  useEffect(() => {
    setScale(1);
    const fallback = window.setTimeout(markLoaded, 20000);
    return () => window.clearTimeout(fallback);
  }, [file.id, markLoaded]);

  useEffect(() => {
    if (paused) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'VIDEO' || tag === 'AUDIO' || target?.isContentEditable) return;
      if (event.key === 'ArrowLeft' && previous) {
        event.preventDefault();
        onShowFile(previous);
      }
      if (event.key === 'ArrowRight' && next) {
        event.preventDefault();
        onShowFile(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, previous, next, onShowFile, onClose]);

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/90 backdrop-blur-md flex items-center justify-center z-[200] p-4 md:p-8">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[6px_6px_0px_#EAB308] sm:shadow-[16px_16px_0px_#EAB308] w-full max-w-7xl h-full max-h-[92vh] flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-200">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-center p-3 sm:p-5 border-b-4 border-[#2C1A14] bg-[#F4EFE6] shrink-0 gap-3">
          <h3 className="text-sm sm:text-2xl font-display font-black text-[#2C1A14] uppercase truncate min-w-0 flex items-center gap-2 sm:gap-3">
            <FileIcon file={file} size={22} /> <span className="truncate">{file.name}</span>
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {sheetElement && (
              <button type="button" onClick={() => setShowSidePanel(!showSidePanel)} className={`bg-white text-[#2C1A14] hover:bg-[#EAB308] p-2 border-4 border-[#2C1A14] shadow-[4px_4px_0px_#2C1A14] hover:-translate-y-1 transition-all font-display font-black uppercase text-xs tracking-wide ${showSidePanel ? 'bg-[#EAB308]' : ''}`}>
                Ficha técnica
              </button>
            )}
            {onReplaceFile && (
              <label className="bg-white text-[#2C1A14] hover:bg-[#849B55] hover:text-white p-2 border-4 border-[#2C1A14] shadow-[4px_4px_0px_#2C1A14] hover:-translate-y-1 transition-all font-display font-black uppercase text-xs tracking-wide cursor-pointer flex items-center">
                {replacing ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
                {replacing ? 'Trocando...' : 'Substituir'}
                <input type="file" className="hidden" onChange={handleFileChange} disabled={replacing} />
              </label>
            )}
            <button onClick={onClose} className="bg-white text-[#2C1A14] hover:bg-[#C13B22] hover:text-white p-2 border-4 border-[#2C1A14] shadow-[4px_4px_0px_#2C1A14] hover:-translate-y-1 transition-all shrink-0" aria-label="Fechar visualização">
            <X size={24} strokeWidth={3} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-[#2C1A14]">
          {previous && (
            <button type="button" onClick={() => onShowFile(previous)} className="absolute left-3 top-1/2 z-20 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center border-4 border-[#2C1A14] bg-[#F4EFE6] text-[#2C1A14] shadow-[4px_4px_0px_#EAB308] hover:bg-[#EAB308]" aria-label="Arquivo anterior">
              <ChevronLeft size={28} strokeWidth={3} />
            </button>
          )}
          {next && (
            <button type="button" onClick={() => onShowFile(next)} className="absolute right-3 top-1/2 z-20 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center border-4 border-[#2C1A14] bg-[#F4EFE6] text-[#2C1A14] shadow-[4px_4px_0px_#EAB308] hover:bg-[#EAB308]" aria-label="Próximo arquivo">
              <ChevronRight size={28} strokeWidth={3} />
            </button>
          )}
          {loading && (
            <>
              <div className="absolute inset-x-0 top-0 z-30 h-1 bg-[#EAB308] animate-pulse" aria-hidden="true" />
              <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 inline-flex items-center gap-2 border-2 border-[#2C1A14] bg-[#F4EFE6] px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-widest text-[#2C1A14] shadow-[3px_3px_0px_#EAB308] animate-in fade-in duration-300" role="status">
                <Loader2 size={14} strokeWidth={3} className="animate-spin" /> Carregando
              </div>
            </>
          )}
          <div key={file.id} className={`w-full h-full transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>
          {file.type === 'image' && (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <div className="absolute bottom-6 right-6 z-10 flex gap-2 bg-[#F4EFE6] border-4 border-[#2C1A14] p-2 shadow-[6px_6px_0px_#C13B22]">
                <button onClick={() => setScale(s => Math.max(s - 0.5, 0.5))} className="bg-white p-2 border-2 border-[#2C1A14] hover:bg-[#EAB308]"><ZoomOut size={24} /></button>
                <button onClick={() => setScale(s => Math.min(s + 0.5, 3))} className="bg-white p-2 border-2 border-[#2C1A14] hover:bg-[#EAB308]"><ZoomIn size={24} /></button>
              </div>
              <div className="overflow-auto w-full h-full flex items-center justify-center" style={{ overflow: scale > 1 ? 'auto' : 'hidden' }}>
                <img src={file.url} alt={file.name} onLoad={markLoaded} onError={markLoaded} style={{ transform: `scale(${scale})` }} className="max-w-full max-h-full object-contain border-4 border-[#F4EFE6] shadow-2xl transition-transform" />
              </div>
            </div>
          )}
          {file.type === 'video' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <video controls onLoadedData={markLoaded} onError={markLoaded} className="w-full max-h-full border-4 border-[#F4EFE6] shadow-[12px_12px_0px_#C13B22] bg-black"><source src={file.url} type="video/mp4" /></video>
            </div>
          )}
          {file.type === 'audio' && (
            <div className="w-full h-full flex items-center justify-center bg-[#E4CFB2] relative">
              <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-10 shadow-[12px_12px_0px_#C13B22] flex flex-col items-center w-full max-w-md">
                <Music size={48} className="text-[#849B55] mb-6 animate-pulse" />
                <audio controls onLoadedMetadata={markLoaded} onError={markLoaded} className="w-full"><source src={file.url} type="audio/mpeg" /></audio>
              </div>
            </div>
          )}
          {isSpreadsheet(file) && <SpreadsheetPreview file={file} onReady={markLoaded} />}
          {isPdf(file) && <PdfPreview file={file} onReady={markLoaded} />}
          {file.type === 'document' && !isSpreadsheet(file) && !isPdf(file) && (
            <iframe src={file.url} onLoad={markLoaded} className="w-full h-full border-none bg-white" title="Documento" />
          )}
          </div>
        </div>
        </div>
        {showSidePanel && sheetElement && (
          <div className="w-full md:w-96 shrink-0 border-t-4 md:border-t-0 md:border-l-4 border-[#2C1A14] flex flex-col bg-[#F4EFE6] relative z-40 overflow-hidden">
            {sheetElement}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Music, X, ZoomIn, ZoomOut } from 'lucide-react';
import FileIcon from '../ui/FileIcon.jsx';
import SpreadsheetPreview, { isSpreadsheet } from './SpreadsheetPreview.jsx';

export default function FileViewer({ file, onClose }) {
  const [scale, setScale] = useState(1);
  return (
    <div className="fixed inset-0 bg-[#2C1A14]/90 backdrop-blur-md flex items-center justify-center z-[200] p-4 md:p-8">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[6px_6px_0px_#EAB308] sm:shadow-[16px_16px_0px_#EAB308] w-full max-w-6xl h-full max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-3 sm:p-5 border-b-4 border-[#2C1A14] bg-[#F4EFE6] shrink-0 gap-3">
          <h3 className="text-sm sm:text-2xl font-display font-black text-[#2C1A14] uppercase truncate min-w-0 flex items-center gap-2 sm:gap-3">
            <FileIcon type={file.type} size={22} /> <span className="truncate">{file.name}</span>
          </h3>
          <button onClick={onClose} className="bg-white text-[#2C1A14] hover:bg-[#C13B22] hover:text-white p-2 border-4 border-[#2C1A14] shadow-[4px_4px_0px_#2C1A14] hover:-translate-y-1 transition-all shrink-0" aria-label="Fechar visualização">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-[#2C1A14]">
          {file.type === 'image' && (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <div className="absolute bottom-6 right-6 z-10 flex gap-2 bg-[#F4EFE6] border-4 border-[#2C1A14] p-2 shadow-[6px_6px_0px_#C13B22]">
                <button onClick={() => setScale(s => Math.max(s - 0.5, 0.5))} className="bg-white p-2 border-2 border-[#2C1A14] hover:bg-[#EAB308]"><ZoomOut size={24} /></button>
                <button onClick={() => setScale(s => Math.min(s + 0.5, 3))} className="bg-white p-2 border-2 border-[#2C1A14] hover:bg-[#EAB308]"><ZoomIn size={24} /></button>
              </div>
              <div className="overflow-auto w-full h-full flex items-center justify-center" style={{ overflow: scale > 1 ? 'auto' : 'hidden' }}>
                <img src={file.url} alt={file.name} style={{ transform: `scale(${scale})` }} className="max-w-full max-h-full object-contain border-4 border-[#F4EFE6] shadow-2xl transition-transform" />
              </div>
            </div>
          )}
          {file.type === 'video' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <video controls className="w-full max-h-full border-4 border-[#F4EFE6] shadow-[12px_12px_0px_#C13B22] bg-black"><source src={file.url} type="video/mp4" /></video>
            </div>
          )}
          {file.type === 'audio' && (
            <div className="w-full h-full flex items-center justify-center bg-[#E4CFB2] relative">
              <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-10 shadow-[12px_12px_0px_#C13B22] flex flex-col items-center w-full max-w-md">
                <Music size={48} className="text-[#849B55] mb-6 animate-pulse" />
                <audio controls className="w-full"><source src={file.url} type="audio/mpeg" /></audio>
              </div>
            </div>
          )}
          {isSpreadsheet(file) && <SpreadsheetPreview file={file} />}
          {file.type === 'document' && !isSpreadsheet(file) && (
            <iframe src={file.url} className="w-full h-full border-none bg-white" title="Documento" />
          )}
        </div>
      </div>
    </div>
  );
}

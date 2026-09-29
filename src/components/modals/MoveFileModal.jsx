import { useEffect, useState } from 'react';
import { CornerDownRight } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';

export default function MoveFileModal({ isOpen, file, flatFolders, onClose, onSave }) {
  const [selectedFolderId, setSelectedFolderId] = useState(file?.folderId || '');

  useEffect(() => {
    if (file) setSelectedFolderId(file.folderId || '');
  }, [file]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#EAB308] w-full max-w-md relative p-6">
        <h3 className="text-2xl font-display font-black text-[#2C1A14] uppercase mb-2 flex items-center gap-2">
          <CornerDownRight size={28} className="text-[#C13B22]" /> Mover Arquivo
        </h3>
        <p className="font-sans font-medium text-[#2C1A14]/70 mb-6 border-b-2 border-[#2C1A14]/20 pb-4 truncate">{file.name}</p>

        <div className="space-y-4">
          <label className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Selecione o novo destino:</label>
          <div className="max-h-64 overflow-y-auto border-4 border-[#2C1A14] bg-white p-2 space-y-1">
            <button
              onClick={() => setSelectedFolderId('')}
              className={`w-full text-left px-3 py-2 font-mono text-sm transition-colors ${selectedFolderId === '' ? 'bg-[#2C1A14] text-[#F4EFE6]' : 'hover:bg-black/5'}`}
            >
              / (Raiz)
            </button>
            {flatFolders.map(folder => (
              <button
                key={folder.id} onClick={() => setSelectedFolderId(folder.id)}
                className={`w-full text-left px-3 py-2 font-mono text-sm truncate transition-colors ${selectedFolderId === folder.id ? 'bg-[#2C1A14] text-[#F4EFE6]' : 'hover:bg-black/5'}`}
              >
                {folder.path}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button onClick={onClose} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2 w-full sm:w-auto">Cancelar</button>
          <ButtonPrimary onClick={() => onSave(file.id, selectedFolderId)} color="bgMustard" className="w-full sm:w-auto">Confirmar</ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

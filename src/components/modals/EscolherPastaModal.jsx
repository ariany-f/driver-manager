import { useEffect, useState } from 'react';
import { Folder, FolderTree } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import { listDriveFolders, saveDriveFolder } from '../../services/drive.js';

export default function EscolherPastaModal({ isOpen, onClose, onChosen }) {
  const [stack, setStack] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parent = stack[stack.length - 1];

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    setError('');
    listDriveFolders(parent?.id || '')
      .then(data => {
        if (active) setFolders(data.folders || []);
      })
      .catch(loadError => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, parent?.id]);

  if (!isOpen) return null;

  const choose = async (folder) => {
    setSaving(true);
    setError('');
    try {
      const saved = await saveDriveFolder(folder.id);
      onChosen(saved);
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
      <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#1E3A5F] w-full max-w-lg relative flex flex-col max-h-[90vh]">
        <div className="p-5 border-b-4 border-[#2C1A14] shrink-0">
          <h3 className="text-2xl font-display font-black uppercase text-[#2C1A14] flex items-center gap-2">
            <FolderTree size={24} strokeWidth={2.5} /> Escolha a pasta
          </h3>
          <p className="font-sans font-bold text-sm text-[#2C1A14]/80 mt-2">
            Esta pasta do Google Drive vira o acervo. Use o Meu Drive inteiro, ou abra uma pasta e use só ela.
          </p>
          <p className="font-mono text-xs mt-3 break-all">{stack.length ? stack.map(item => item.name).join(' / ') : 'Meu Drive e pastas compartilhadas'}</p>
        </div>
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {!parent && (
            <div className="flex gap-2">
              <div className="min-h-11 flex-1 text-left px-3 border-2 border-[#2C1A14] bg-white font-sans font-bold text-sm inline-flex items-center gap-2">
                <Folder size={16} strokeWidth={2.5} />
                <span className="truncate">Meu Drive</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] uppercase">Raiz</span>
              </div>
              <ButtonPrimary onClick={() => choose({ id: 'root' })} disabled={saving} color="bgNavy" className="shrink-0">
                Usar
              </ButtonPrimary>
            </div>
          )}
          {stack.length > 0 && (
            <button type="button" onClick={() => setStack(current => current.slice(0, -1))} className="min-h-11 w-full text-left px-3 border-2 border-[#2C1A14] bg-white font-display font-bold uppercase text-xs">
              Voltar
            </button>
          )}
          {loading && <p className="font-display font-black uppercase text-sm">Carregando pastas...</p>}
          {!loading && folders.length === 0 && <p className="font-sans font-bold text-sm">Nenhuma pasta aqui.</p>}
          {folders.map(folder => (
            <div key={folder.id} className="flex gap-2">
              <button
                type="button"
                onClick={() => setStack(current => [...current, folder])}
                className="min-h-11 flex-1 text-left px-3 border-2 border-[#2C1A14] bg-white font-sans font-bold text-sm inline-flex items-center gap-2"
              >
                <Folder size={16} strokeWidth={2.5} />
                <span className="truncate">{folder.name}</span>
                {folder.onde && <span className="ml-auto shrink-0 font-mono text-[10px] uppercase">{folder.onde}</span>}
              </button>
              {folder.kind !== 'drive' && (
                <ButtonPrimary onClick={() => choose(folder)} disabled={saving} color="bgNavy" className="shrink-0">
                  Usar
                </ButtonPrimary>
              )}
            </div>
          ))}
          {error && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
        </div>
        <div className="p-4 border-t-4 border-[#2C1A14] shrink-0">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-2 disabled:opacity-50">
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

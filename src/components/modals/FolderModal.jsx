import { useEffect, useState } from 'react';
import { Edit, FolderPlus } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';

export default function FolderModal({ config, flatFolders, onClose, onSave }) {
  const [folderName, setFolderName] = useState('');
  const [parentId, setParentId] = useState('');
  const isEdit = config.mode === 'edit';

  useEffect(() => {
    if (config.isOpen) {
      setFolderName(isEdit ? config.folder.name : '');
      setParentId(config.parentId || '');
    }
  }, [config, isEdit]);

  if (!config.isOpen) return null;

  const handleSubmit = () => {
    if (folderName.trim()) {
      onSave(folderName.trim(), parentId, config.mode, config.folder?.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#849B55] w-full max-w-md relative p-6">
        <h3 className="text-2xl font-display font-black text-[#2C1A14] uppercase mb-6 flex items-center gap-2 border-b-4 border-[#2C1A14] pb-2">
          {isEdit ? <Edit size={28} className="text-[#849B55]" /> : <FolderPlus size={28} className="text-[#849B55]" />}
          {isEdit ? 'Editar Pasta' : 'Nova Pasta'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Nome da Pasta</label>
            <input
              type="text" value={folderName} onChange={(e) => setFolderName(e.target.value)}
              className="w-full border-4 border-[#2C1A14] p-3 font-sans font-medium text-lg outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all bg-white"
              placeholder="Ex: Entrevistas 2024" autoFocus
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Localização (Opcional)</label>
              <select
                value={parentId} onChange={(e) => setParentId(e.target.value)}
                className="w-full border-4 border-[#2C1A14] p-3 font-sans font-medium outline-none cursor-pointer bg-white"
              >
                <option value="">Na raiz (Diretório Principal)</option>
                {flatFolders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.path}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button onClick={onClose} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2 w-full sm:w-auto">Cancelar</button>
          <ButtonPrimary onClick={handleSubmit} color="bgOlive" disabled={!folderName.trim()} className="w-full sm:w-auto">
            {isEdit ? 'Salvar' : 'Criar Pasta'}
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

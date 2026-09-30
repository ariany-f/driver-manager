import { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';

export default function RenameFileModal({ file, busy, onClose, onSave }) {
  const [name, setName] = useState('');
  const [renameOnDrive, setRenameOnDrive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) return;
    setName(file.name || '');
    setRenameOnDrive(true);
    setError('');
  }, [file]);

  if (!file) return null;

  const submit = async () => {
    const next = name.trim();
    if (!next) return;
    setError('');
    try {
      await onSave(next, renameOnDrive);
    } catch (err) {
      setError(err.message || 'Não foi possível renomear o arquivo.');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#EAB308] w-full max-w-md relative p-6">
        <h3 className="text-2xl font-display font-black text-[#2C1A14] uppercase mb-6 flex items-center gap-2 border-b-4 border-[#2C1A14] pb-2">
          <Edit size={28} className="text-[#EAB308]" /> Renomear arquivo
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="rename-file-name" className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Nome</label>
            <input
              id="rename-file-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full border-4 border-[#2C1A14] p-3 font-sans font-medium text-lg outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all bg-white"
              autoFocus
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={renameOnDrive}
              onChange={(event) => setRenameOnDrive(event.target.checked)}
              className="w-5 h-5 accent-[#2C1A14]"
            />
            <span className="font-display font-bold text-sm uppercase tracking-wide">Renomear no Drive também</span>
          </label>
          {error && <p className="font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
        </div>
        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2 w-full sm:w-auto disabled:opacity-50">Cancelar</button>
          <ButtonPrimary onClick={submit} color="bgMustard" disabled={busy || !name.trim()} className="w-full sm:w-auto">
            {busy ? 'Salvando…' : 'Salvar'}
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

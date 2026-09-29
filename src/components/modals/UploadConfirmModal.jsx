import { Upload } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';

export default function UploadConfirmModal({ files, folderPath, busy, onCancel, onConfirm }) {
  if (!files?.length) return null;
  const nomes = files.map(file => file.name);

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#C13B22] w-full max-w-lg relative flex flex-col max-h-[90vh]">
        <div className="p-5 border-b-4 border-[#2C1A14] shrink-0">
          <h3 className="text-2xl font-display font-black uppercase text-[#2C1A14] flex items-center gap-2">
            <Upload size={24} strokeWidth={2.5} /> Enviar para o Drive?
          </h3>
          <p className="font-sans font-bold text-sm text-[#2C1A14] mt-3">
            {nomes.length === 1 ? 'Este arquivo será gravado' : 'Estes arquivos serão gravados'} no Google Drive da organização. No acervo, {nomes.length === 1 ? 'ele fica' : 'eles ficam'} em {folderPath}. Confirme só se quiser enviar para a pasta do cliente.
          </p>
        </div>
        <ul className="overflow-y-auto p-5 space-y-2 flex-1">
          {nomes.map((nome, index) => (
            <li key={`${nome}-${index}`} className="font-sans font-bold text-sm border-2 border-[#2C1A14] bg-white px-3 py-2 break-all">{nome}</li>
          ))}
        </ul>
        <div className="p-4 border-t-4 border-[#2C1A14] flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
          <button type="button" onClick={onCancel} disabled={busy} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 decoration-2 px-4 py-2 w-full sm:w-auto disabled:opacity-50">Cancelar</button>
          <ButtonPrimary onClick={onConfirm} disabled={busy} color="bgRust" className="w-full sm:w-auto">
            {busy ? 'Enviando' : 'Enviar para o Drive'}
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

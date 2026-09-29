import { RefreshCw } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';

export default function NovidadesModal({ arquivos, pastas, busy, error, onClose, onSync }) {
  const arquivosNovos = arquivos || [];
  const pastasNovas = pastas || [];
  const partes = [];
  if (pastasNovas.length) partes.push(`${pastasNovas.length} ${pastasNovas.length === 1 ? 'pasta nova' : 'pastas novas'}`);
  if (arquivosNovos.length) partes.push(`${arquivosNovos.length} ${arquivosNovos.length === 1 ? 'arquivo novo' : 'arquivos novos'}`);

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#1E3A5F] w-full max-w-lg relative flex flex-col max-h-[90vh]">
        <div className="p-5 border-b-4 border-[#2C1A14] shrink-0">
          <h3 className="text-2xl font-display font-black uppercase text-[#2C1A14]">Há novidade no Drive</h3>
          <p className="font-sans font-bold text-sm text-[#2C1A14]/80 mt-2">
            {partes.join(' e ')} ainda não {arquivosNovos.length + pastasNovas.length === 1 ? 'entrou' : 'entraram'} no acervo. Sincronizar grava só no MySQL.
          </p>
        </div>
        <ul className="overflow-y-auto p-5 space-y-2 flex-1">
          {pastasNovas.map(pasta => (
            <li key={pasta.id} className="font-sans font-bold text-sm border-2 border-[#2C1A14] bg-white px-3 py-2">Pasta · {pasta.name}</li>
          ))}
          {arquivosNovos.map(arquivo => (
            <li key={arquivo.id} className="font-sans font-bold text-sm border-2 border-[#2C1A14] bg-white px-3 py-2 truncate">{arquivo.name}</li>
          ))}
        </ul>
        {error && <p role="alert" className="px-5 pb-2 font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
        <div className="p-4 border-t-4 border-[#2C1A14] flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={busy} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 decoration-2 px-4 py-2 w-full sm:w-auto disabled:opacity-50">Agora não</button>
          <ButtonPrimary onClick={onSync} disabled={busy} color="bgNavy" icon={RefreshCw} className="w-full sm:w-auto">
            {busy ? 'Sincronizando' : 'Sincronizar'}
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

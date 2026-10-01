import { useState } from 'react';
import { Check, RefreshCw, RotateCcw } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';

function toggle(set, id) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function Section({ title, hint, items, chosen, onToggle, onAll, label }) {
  if (!items.length) return null;
  const allOn = items.every(item => chosen.has(item.id));
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-display font-black uppercase text-xs tracking-widest text-[#2C1A14]">{title} · {items.length}</h4>
        <button type="button" onClick={() => onAll(!allOn)} className="font-display font-bold uppercase text-[11px] text-[#1E3A5F] underline underline-offset-4 decoration-2">
          {allOn ? 'Desmarcar todos' : 'Marcar todos'}
        </button>
      </div>
      {hint && <p className="font-sans text-xs font-bold text-[#2C1A14]/70">{hint}</p>}
      <ul className="space-y-2">
        {items.map(item => {
          const on = chosen.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                aria-pressed={on}
                className={`w-full flex items-center gap-3 border-2 border-[#2C1A14] px-3 py-2 text-left font-sans font-bold text-sm transition-colors ${on ? 'bg-[#EAB308]' : 'bg-white'}`}
              >
                <span className={`w-5 h-5 shrink-0 border-2 border-[#2C1A14] flex items-center justify-center ${on ? 'bg-[#2C1A14] text-[#EAB308]' : 'bg-white'}`}>
                  {on && <Check size={14} strokeWidth={4} />}
                </span>
                <span className="min-w-0 truncate">{label ? `${label} · ${item.name}` : item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function NovidadesModal({ arquivos, pastas, excluidos, busy, error, onClose, onSync }) {
  const arquivosNovos = arquivos || [];
  const pastasNovas = pastas || [];
  const arquivosExcluidos = excluidos || [];
  const [chosenFiles, setChosenFiles] = useState(() => new Set(arquivosNovos.map(item => item.id)));
  const [chosenFolders, setChosenFolders] = useState(() => new Set(pastasNovas.map(item => item.id)));
  const [chosenRestore, setChosenRestore] = useState(() => new Set());

  const nothing = !arquivosNovos.length && !pastasNovas.length && !arquivosExcluidos.length;
  const total = chosenFiles.size + chosenFolders.size + chosenRestore.size;
  const partes = [];
  if (pastasNovas.length) partes.push(`${pastasNovas.length} ${pastasNovas.length === 1 ? 'pasta nova' : 'pastas novas'}`);
  if (arquivosNovos.length) partes.push(`${arquivosNovos.length} ${arquivosNovos.length === 1 ? 'arquivo novo' : 'arquivos novos'}`);

  const all = (items, setter) => (on) => setter(on ? new Set(items.map(item => item.id)) : new Set());

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#1E3A5F] w-full max-w-lg relative flex flex-col max-h-[90vh]">
        <div className="p-5 border-b-4 border-[#2C1A14] shrink-0">
          <h3 className="text-2xl font-display font-black uppercase text-[#2C1A14]">
            {partes.length ? 'Há novidade no Drive' : 'Sincronizar'}
          </h3>
          <p className="font-sans font-bold text-sm text-[#2C1A14]/80 mt-2">
            {nothing
              ? 'Nada de novo no Drive e nenhum arquivo excluído para trazer de volta.'
              : `${partes.length ? `${partes.join(' e ')} ainda fora do acervo. ` : ''}Marque só o que deve entrar. O que ficar desmarcado continua de fora e aparece aqui de novo depois. Sincronizar grava só no MySQL.`}
          </p>
        </div>
        <div className="overflow-y-auto p-5 space-y-6 flex-1">
          <Section
            title="Pastas novas"
            items={pastasNovas}
            chosen={chosenFolders}
            onToggle={id => setChosenFolders(current => toggle(current, id))}
            onAll={all(pastasNovas, setChosenFolders)}
            label="Pasta"
          />
          <Section
            title="Arquivos novos"
            hint="A pasta de um arquivo marcado entra junto."
            items={arquivosNovos}
            chosen={chosenFiles}
            onToggle={id => setChosenFiles(current => toggle(current, id))}
            onAll={all(arquivosNovos, setChosenFiles)}
          />
          <Section
            title="Excluídos do acervo"
            hint="Voltam com as tags, formatos, origem, data e nome que já tinham."
            items={arquivosExcluidos}
            chosen={chosenRestore}
            onToggle={id => setChosenRestore(current => toggle(current, id))}
            onAll={all(arquivosExcluidos, setChosenRestore)}
          />
        </div>
        {error && <p role="alert" className="px-5 pb-2 font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
        <div className="p-4 border-t-4 border-[#2C1A14] flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={busy} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 decoration-2 px-4 py-2 w-full sm:w-auto disabled:opacity-50">
            {nothing ? 'Fechar' : 'Agora não'}
          </button>
          {!nothing && (
            <ButtonPrimary
              onClick={() => onSync({ arquivos: [...chosenFiles], pastas: [...chosenFolders], restaurar: [...chosenRestore] })}
              disabled={busy || total === 0}
              color="bgNavy"
              icon={chosenRestore.size && !chosenFiles.size && !chosenFolders.size ? RotateCcw : RefreshCw}
              className="w-full sm:w-auto"
            >
              {busy ? 'Sincronizando' : `Sincronizar ${total}`}
            </ButtonPrimary>
          )}
        </div>
      </div>
    </div>
  );
}

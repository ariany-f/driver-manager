import { useState } from 'react';
import { Tags } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';

function toggle(list, id) {
  return list.includes(id) ? list.filter(item => item !== id) : [...list, id];
}

export default function ClassificarNovosModal({ files, territorios, tags, busy, error, onClose, onSave, onOpenIdentidade }) {
  const [choices, setChoices] = useState(() => Object.fromEntries(
    (files || []).map(file => [file.id, { territorios: [], tags: [] }]),
  ));
  const semIdentidade = territorios.length === 0 && tags.length === 0;

  const setChoice = (fileId, key, id) => {
    setChoices(current => ({
      ...current,
      [fileId]: { ...current[fileId], [key]: toggle(current[fileId][key], id) },
    }));
  };

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#EAB308] w-full max-w-3xl relative flex flex-col max-h-[90vh]">
        <div className="p-5 border-b-4 border-[#2C1A14] bg-[#F4EFE6] shrink-0">
          <h3 className="text-2xl font-display font-black uppercase text-[#2C1A14] flex items-center gap-2">
            <Tags size={24} className="text-[#C13B22]" strokeWidth={2.5} /> Classificar arquivos novos
          </h3>
          <p className="font-sans font-bold text-sm text-[#2C1A14]/80 mt-2">
            {files.length === 1 ? 'Este arquivo entrou no acervo.' : `Estes ${files.length} arquivos entraram no acervo.`} Escolha territórios e tags. Nada disso vai para o Drive.
          </p>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
          {semIdentidade && (
            <p className="font-sans font-bold text-sm border-4 border-[#2C1A14] bg-white p-4">
              Ainda não há territórios nem tags. Cadastre em Identidade e volte para classificar.
            </p>
          )}
          {files.map(file => (
            <article key={file.id} className="border-4 border-[#2C1A14] bg-[#F4EFE6] p-4 space-y-3">
              <h4 className="font-display font-black uppercase text-sm break-words">{file.name}</h4>
              {territorios.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {territorios.map(territorio => {
                    const active = choices[file.id]?.territorios.includes(territorio.id);
                    return (
                      <button
                        key={territorio.id}
                        type="button"
                        onClick={() => setChoice(file.id, 'territorios', territorio.id)}
                        className={`min-h-11 px-3 border-2 border-[#2C1A14] font-display font-bold uppercase text-[11px] ${active ? 'shadow-[3px_3px_0px_#2C1A14]' : 'opacity-70'}`}
                        style={{ backgroundColor: territorio.bgColor, color: territorio.textColor }}
                      >
                        {territorio.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const active = choices[file.id]?.tags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setChoice(file.id, 'tags', tag.id)}
                        className={`min-h-11 px-3 border-2 border-[#2C1A14] rounded-full font-display font-bold uppercase text-[11px] ${active ? 'shadow-[3px_3px_0px_#2C1A14]' : 'opacity-70'}`}
                        style={{ backgroundColor: tag.bgColor, color: tag.textColor }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
        {error && <p role="alert" className="px-4 pb-2 font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
        <div className="p-4 border-t-4 border-[#2C1A14] bg-[#F4EFE6] flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
          {semIdentidade && (
            <button type="button" onClick={onOpenIdentidade} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 decoration-2 px-4 py-2 w-full sm:w-auto">
              Ir para Identidade
            </button>
          )}
          <button type="button" onClick={onClose} disabled={busy} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 decoration-2 px-4 py-2 w-full sm:w-auto disabled:opacity-50">
            Deixar para depois
          </button>
          <ButtonPrimary onClick={() => onSave(choices)} disabled={busy || semIdentidade} color="bgMustard" className="w-full sm:w-auto">
            {busy ? 'Salvando' : 'Salvar classificação'}
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

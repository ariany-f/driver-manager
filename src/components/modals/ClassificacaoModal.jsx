import { useState } from 'react';
import { Tags, X } from 'lucide-react';
import { fileExtension } from '../../lib/fileExtension.js';
import { mediaLabel } from '../../lib/media.js';
import { MediaGlyph } from '../../lib/mediaIcons.js';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';

export default function ClassificacaoModal({ file, territorios, tags, formatos = [], onClose, onSave }) {
  const [selectedTerritorios, setSelectedTerritorios] = useState(file.territorios || []);
  const [selectedTags, setSelectedTags] = useState(file.tags || []);
  const [selectedFormatos, setSelectedFormatos] = useState(file.formatos || []);
  const identified = fileExtension(file);

  const toggleSelection = (id, setList) => {
    setList(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#2C1A14] w-full max-w-2xl relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b-4 border-[#2C1A14] bg-[#F4EFE6] shrink-0">
          <div>
            <h3 className="text-xl font-display font-black text-[#2C1A14] uppercase tracking-wide flex items-center gap-2">
              <Tags size={24} className="text-[#C13B22]" strokeWidth={2.5} /> Classificar
            </h3>
            <p className="text-sm font-sans font-medium text-[#2C1A14]/70 mt-1 truncate max-w-[11rem] sm:max-w-sm">{file.name}</p>
          </div>
          <button onClick={onClose} className="text-[#2C1A14] hover:bg-[#C13B22] hover:text-white p-2 border-2 border-transparent hover:border-[#2C1A14] transition-colors"><X size={24} strokeWidth={3} /></button>
        </div>
        <div className="p-6 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] overflow-y-auto space-y-8 flex-1">
          <div className="space-y-4">
            <h4 className="font-display font-black text-lg uppercase border-b-2 border-[#2C1A14]/20 pb-2">Territórios</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {territorios.map(territorio => (
                <label key={territorio.id} onClick={() => toggleSelection(territorio.id, setSelectedTerritorios)} className="flex items-center gap-3 p-3 border-2 border-[#2C1A14] bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#2C1A14] transition-all">
                  <div className="relative flex items-center justify-center w-6 h-6 border-2 border-[#2C1A14] bg-[#F4EFE6] shrink-0">
                    {selectedTerritorios.includes(territorio.id) && <div className="absolute w-3.5 h-3.5 bg-[#C13B22]"></div>}
                  </div>
                  <span className="px-2 py-1 text-xs font-display font-bold uppercase truncate border-2 border-[#2C1A14]" style={{ backgroundColor: territorio.bgColor, color: territorio.textColor }}>{territorio.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-display font-black text-lg uppercase border-b-2 border-[#2C1A14]/20 pb-2">Mídia</h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="border-2 border-[#2C1A14] bg-[#849B55] px-2 py-1 font-display text-xs font-black uppercase tracking-wider text-[#F4EFE6]">
                {mediaLabel(file.type)}
              </span>
              {identified && (
                <span className="border-2 border-[#2C1A14] bg-[#EAB308] px-2 py-1 font-mono text-xs font-black uppercase tracking-wider text-[#2C1A14]">
                  {identified}
                </span>
              )}
              <span className="font-sans text-xs font-bold text-[#2C1A14]/70">Essa mídia já vem do arquivo. Marque quantas outras quiser, além dela.</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formatos.map(formato => (
                <label key={formato.id} onClick={() => toggleSelection(formato.id, setSelectedFormatos)} className="flex items-center gap-3 p-3 border-2 border-[#2C1A14] bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#2C1A14] transition-all">
                  <div className="relative flex items-center justify-center w-6 h-6 border-2 border-[#2C1A14] bg-[#F4EFE6] shrink-0">
                    {selectedFormatos.includes(formato.id) && <div className="absolute w-3.5 h-3.5 bg-[#1E3A5F]"></div>}
                  </div>
                  <span className="px-2 py-1 text-xs font-display font-bold uppercase truncate border-2 border-[#2C1A14] inline-flex items-center gap-1" style={{ backgroundColor: formato.bgColor, color: formato.textColor }}>
                    <MediaGlyph icon={formato.icon} size={12} />
                    {formato.name}
                  </span>
                </label>
              ))}
            </div>
            {formatos.length === 0 && (
              <p className="font-sans text-sm font-bold text-[#2C1A14]/70">Cadastre outras mídias em Classificação para marcar além da que o sistema identificou.</p>
            )}
          </div>
          <div className="space-y-4">
            <h4 className="font-display font-black text-lg uppercase border-b-2 border-[#2C1A14]/20 pb-2">Tags Livres</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tags.map(tag => (
                <label key={tag.id} className="flex items-center gap-3 p-3 border-2 border-[#2C1A14] bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#2C1A14] transition-all">
                  <input type="checkbox" className="hidden" checked={selectedTags.includes(tag.id)} onChange={() => toggleSelection(tag.id, setSelectedTags)} />
                  <div className="relative flex items-center justify-center w-6 h-6 border-2 border-[#2C1A14] bg-[#F4EFE6] rounded-full shrink-0">
                    {selectedTags.includes(tag.id) && <div className="absolute w-3 h-3 bg-[#1E3A5F] rounded-full"></div>}
                  </div>
                  <span className="px-2 py-1 text-xs font-display font-bold uppercase truncate border-2 border-[#2C1A14] rounded-full" style={{ backgroundColor: tag.bgColor, color: tag.textColor }}>{tag.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t-4 border-[#2C1A14] bg-[#F4EFE6] flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
          <button onClick={onClose} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 decoration-2 px-4 py-2 w-full sm:w-auto">Cancelar</button>
          <ButtonPrimary onClick={() => onSave(file.id, selectedTerritorios, selectedTags, selectedFormatos)} color="bgMustard" className="w-full sm:w-auto">Salvar</ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

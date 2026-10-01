import { useState } from 'react';
import { Edit, Plus, Star, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import { getContrastTextColor, PREDEFINED_COLORS } from '../../lib/colors.js';
import { MEDIA_ICONS, MediaGlyph } from '../../lib/mediaIcons.js';

const TAB_LABEL = {
  territorios: { plural: 'Formatos', singular: 'Formato' },
  tags: { plural: 'Tags Livres', singular: 'Tag' },
  status: { plural: 'Status', singular: 'Status' },
};

const TABS = [
  { id: 'territorios', shadow: '#C13B22' },
  { id: 'tags', shadow: '#EAB308' },
  { id: 'status', shadow: '#849B55' },
];

const PLACEHOLDER = {
  territorios: 'Ex: Documento',
  tags: 'Ex: Zona Norte',
  status: 'Ex: Em revisão',
};

function PadraoMark({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border-2 border-dashed border-[#2C1A14] bg-white px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-widest text-[#2C1A14] shrink-0 ${className}`}
      title="Arquivos sem status aparecem com este"
    >
      <Star size={11} strokeWidth={3} className="fill-[#EAB308]" aria-hidden="true" />
      Padrão
    </span>
  );
}

export default function GerenciarIdentidade({ territorios, tags, statusList = [], onTerritorios, onTags, onStatus }) {
  const [activeTab, setActiveTab] = useState('territorios');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#1E3A5F');
  const [icon, setIcon] = useState('newspaper');
  const [padrao, setPadrao] = useState(false);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setColor(item.bgColor);
      setIcon(item.icon || 'newspaper');
      setPadrao(Boolean(item.padrao));
    } else {
      setEditingItem(null);
      setName('');
      setColor(PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)]);
      setIcon(MEDIA_ICONS[Math.floor(Math.random() * MEDIA_ICONS.length)].id);
      setPadrao(false);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const newItem = {
      id: editingItem ? editingItem.id : `${activeTab}_${Date.now()}`,
      name: name.trim(),
      bgColor: color,
      textColor: getContrastTextColor(color),
      ...(activeTab === 'territorios' ? { icon } : {}),
      ...(activeTab === 'status' ? { padrao } : {}),
    };

    const apply = (list) => (editingItem ? list.map(item => item.id === editingItem.id ? newItem : item) : [...list, newItem]);
    const next = apply(lists[activeTab]);
    save[activeTab](activeTab === 'status' && padrao
      ? next.map(item => (item.id === newItem.id ? item : { ...item, padrao: false }))
      : next);
    closeModal();
  };

  const lists = { territorios, tags, status: statusList };
  const save = { territorios: onTerritorios, tags: onTags, status: onStatus };

  const handleDelete = (id) => {
    save[activeTab](lists[activeTab].filter(item => item.id !== id));
  };

  const currentList = lists[activeTab];
  const tabLabel = TAB_LABEL[activeTab];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8 animate-in fade-in duration-300 relative">
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end border-b-4 border-[#2C1A14] pb-4 sm:pb-6 gap-4">
          <h1 className="text-[1.875rem] sm:text-[3rem] xl:text-[3.75rem] font-display font-black text-[#2C1A14] uppercase leading-[1.25] tracking-tighter">Classificação</h1>
          <ButtonPrimary onClick={() => openModal()} icon={Plus} color="bgOlive" className="w-full sm:w-auto">Criar {tabLabel.singular}</ButtonPrimary>
        </div>

        <div className="flex flex-wrap gap-3 border-b-2 border-[#2C1A14]/20 pb-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-display font-black uppercase text-sm sm:text-lg px-3 sm:px-4 py-2 border-4 transition-all ${activeTab === tab.id ? 'bg-[#2C1A14] border-[#2C1A14] text-[#F4EFE6]' : 'bg-transparent border-transparent text-[#2C1A14]/60 hover:text-[#2C1A14]'}`}
              style={activeTab === tab.id ? { boxShadow: `4px 4px 0px ${tab.shadow}` } : undefined}
            >
              {TAB_LABEL[tab.id].plural}
            </button>
          ))}
        </div>

        <div className="md:hidden space-y-3">
          {currentList.map(item => (
            <div key={item.id} className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[4px_4px_0px_rgba(44,26,20,0.15)] p-3 flex items-center justify-between gap-3">
              {activeTab === 'tags' ? (
                <span className="min-w-0 [&>span]:!mb-0"><Badge item={item} /></span>
              ) : activeTab === 'status' ? (
                <StatusBadge item={item} className="min-w-0" />
              ) : (
                <span
                  className="px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider shadow-[3px_3px_0px_#2C1A14] border-2 border-[#2C1A14] inline-flex items-center gap-2 min-w-0"
                  style={{ backgroundColor: item.bgColor, color: item.textColor }}
                >
                  {activeTab === 'territorios' && <MediaGlyph icon={item.icon} size={14} />}
                  <span className="truncate">{item.name}</span>
                </span>
              )}
              {activeTab === 'status' && item.padrao && <PadraoMark />}
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openModal(item)} className="bg-white border-2 border-[#2C1A14] p-2.5 shadow-[2px_2px_0px_#2C1A14]" title="Editar" aria-label="Editar">
                  <Edit size={16} strokeWidth={2.5} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="bg-white border-2 border-[#2C1A14] p-2.5 text-[#C13B22] shadow-[2px_2px_0px_#2C1A14]" title="Excluir" aria-label="Excluir">
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
          {currentList.length === 0 && (
            <p className="px-3 py-8 text-center font-mono text-[#2C1A14]/60 border-4 border-dashed border-[#2C1A14]/30">Nenhum registro encontrado.</p>
          )}
        </div>

        <div className="hidden md:block bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_rgba(44,26,20,0.15)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[#2C1A14] font-display uppercase tracking-widest text-[11px] border-b-4 border-[#2C1A14]">
                <th className="px-5 py-4 font-black w-2/3">Nome & Preview</th>
                <th className="px-5 py-4 font-black text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-dashed divide-[#2C1A14]/20">
              {currentList.map(item => (
                <tr key={item.id} className="hover:bg-white/60 transition-colors">
                  <td className="px-5 py-4">
                    {activeTab === 'tags' ? (
                      <span className="inline-flex [&>span]:!mb-0"><Badge item={item} /></span>
                    ) : activeTab === 'status' ? (
                      <StatusBadge item={item} />
                    ) : (
                      <span
                        className="px-3 py-1.5 text-sm font-display font-bold uppercase tracking-wider shadow-[3px_3px_0px_#2C1A14] border-2 border-[#2C1A14] inline-flex items-center gap-2"
                        style={{ backgroundColor: item.bgColor, color: item.textColor }}
                      >
                        {activeTab === 'territorios' && <MediaGlyph icon={item.icon} size={16} />}
                        {item.name}
                      </span>
                    )}
                    {activeTab === 'status' && item.padrao && <PadraoMark className="ml-4" />}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(item)} className="bg-white border-2 border-[#2C1A14] p-2 hover:bg-[#EAB308] hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14]" title="Editar">
                        <Edit size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="bg-white border-2 border-[#2C1A14] p-2 text-[#C13B22] hover:bg-[#C13B22] hover:text-white hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14]" title="Excluir">
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentList.length === 0 && (
                <tr>
                  <td colSpan="2" className="px-5 py-8 text-center font-mono text-[#2C1A14]/60">Nenhum registro encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[6px_6px_0px_#849B55] sm:shadow-[12px_12px_0px_#849B55] w-full max-w-lg relative p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
            <h3 className="text-2xl font-display font-black text-[#2C1A14] uppercase mb-6 flex items-center gap-2 border-b-4 border-[#2C1A14] pb-2">
              {editingItem ? 'Editar' : 'Criar'} {tabLabel.singular}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Nome</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border-4 border-[#2C1A14] p-3 font-sans font-medium text-lg outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all bg-white"
                  placeholder={PLACEHOLDER[activeTab]} autoFocus
                />
              </div>

              {activeTab === 'territorios' && (
                <div>
                  <label className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Ícone</label>
                  <div className="bg-white border-4 border-[#2C1A14] p-3 grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                    {MEDIA_ICONS.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        title={option.label}
                        aria-label={option.label}
                        aria-pressed={icon === option.id}
                        onClick={() => setIcon(option.id)}
                        className={`aspect-square inline-flex items-center justify-center border-2 text-[#2C1A14] transition-all ${icon === option.id ? 'border-[#2C1A14] bg-[#EAB308] shadow-[2px_2px_0px_#2C1A14] -translate-y-0.5' : 'border-transparent hover:border-[#2C1A14]/50 hover:bg-[#F4EFE6]'}`}
                      >
                        <MediaGlyph icon={option.id} size={18} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'status' && (
                <label className="flex items-start gap-3 bg-white border-4 border-[#2C1A14] p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={padrao}
                    onChange={(e) => setPadrao(e.target.checked)}
                    className="mt-0.5 w-5 h-5 shrink-0 accent-[#2C1A14] cursor-pointer"
                  />
                  <span>
                    <span className="block font-display font-black text-sm uppercase tracking-wider text-[#2C1A14]">Status padrão</span>
                    <span className="block font-sans text-sm text-[#2C1A14]/75 mt-0.5">
                      Todo arquivo sem status passa a aparecer com este. Só um status pode ser o padrão; marcar este desmarca o anterior.
                    </span>
                  </span>
                </label>
              )}

              <div>
                <label className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Cor de Fundo</label>
                <div className="bg-white border-4 border-[#2C1A14] p-3 space-y-4">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {PREDEFINED_COLORS.map(swatch => (
                      <button
                        key={swatch} onClick={() => setColor(swatch)}
                        className={`w-full aspect-square border-2 ${color === swatch ? 'border-[#2C1A14] scale-110 z-10 shadow-[2px_2px_0px_#2C1A14]' : 'border-transparent hover:scale-110 hover:border-[#2C1A14]/50 hover:z-10'} transition-all`}
                        style={{ backgroundColor: swatch }}
                        title={swatch}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 border-t-2 border-dashed border-[#2C1A14]/20 pt-4">
                    <span className="font-display font-bold text-xs uppercase">Cor Hex:</span>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 p-0 border-2 border-[#2C1A14] cursor-pointer bg-transparent" />
                    <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="w-24 border-2 border-[#2C1A14] p-1 font-mono text-sm uppercase outline-none" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <span className="block font-display font-bold text-sm uppercase tracking-wider mb-2 text-[#2C1A14]/60">Prévia</span>
                {activeTab === 'tags' ? (
                  <span className="inline-flex origin-left scale-150 [&>span]:!mb-0">
                    <Badge item={{ name: name || 'Exemplo', bgColor: color, textColor: getContrastTextColor(color) }} />
                  </span>
                ) : activeTab === 'status' ? (
                  <span className="inline-flex origin-left scale-150">
                    <StatusBadge item={{ name: name || 'Exemplo', bgColor: color, textColor: getContrastTextColor(color) }} />
                  </span>
                ) : (
                <span
                  className="px-4 py-2 text-lg font-display font-bold uppercase tracking-wider shadow-[4px_4px_0px_#2C1A14] border-4 border-[#2C1A14] inline-flex items-center gap-2"
                  style={{ backgroundColor: color, color: getContrastTextColor(color) }}
                >
                  {activeTab === 'territorios' && <MediaGlyph icon={icon} size={18} />}
                  {name || 'Exemplo'}
                </span>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button onClick={closeModal} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2 w-full sm:w-auto">Cancelar</button>
              <ButtonPrimary onClick={handleSave} color="bgMustard" disabled={!name.trim()} className="w-full sm:w-auto">Salvar</ButtonPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

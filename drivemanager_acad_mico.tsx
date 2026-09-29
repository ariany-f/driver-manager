import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Lock, Unlock, Plus, Edit, Download, 
  BarChart, Tags, Trash2, X, FileText, Folder, ChevronRight, ChevronDown,
  Image as ImageIcon, Video, Music, Archive, Eye, ZoomIn, ZoomOut,
  FolderPlus, CornerDownRight, FolderTree, AlertTriangle
} from 'lucide-react';

// --- Theme Configuration based on visual identity ---
const theme = {
  colors: {
    bgEarthy: '#E4CFB2',
    bgRust: '#C13B22',
    bgMustard: '#EAB308',
    bgOlive: '#849B55',
    bgNavy: '#1E3A5F',
    textDark: '#2C1A14',
    textLight: '#FDFBF7',
    paperWhite: '#F4EFE6',
  }
};

const initialTerritorios = [
  { id: 't1', name: 'Vila São Jorge', bgColor: '#1E3A5F', textColor: '#FDFBF7' },
  { id: 't2', name: 'Vila Nova', bgColor: '#C13B22', textColor: '#FDFBF7' },
  { id: 't3', name: 'Centro', bgColor: '#EAB308', textColor: '#2C1A14' },
  { id: 't4', name: 'Engenho', bgColor: '#849B55', textColor: '#FDFBF7' },
];

const initialTags = [
  { id: 'tg1', name: 'Moradia Digna', bgColor: '#2C1A14', textColor: '#FDFBF7' },
  { id: 'tg2', name: 'Entrevista', bgColor: '#624A44', textColor: '#FDFBF7' },
  { id: 'tg3', name: 'Documento Histórico', bgColor: '#D34D34', textColor: '#2C1A14' },
  { id: 'tg4', name: 'Aprovado', bgColor: '#627933', textColor: '#FDFBF7' },
  { id: 'tg5', name: 'Revisão', bgColor: '#D9A100', textColor: '#2C1A14' },
];

const initialFiles = [
  { id: 1, name: 'Documentário_Moradia.mp4', path: '/Projetos/Audiovisual', folderId: 'av', territorios: ['t1'], tags: ['tg1', 'tg4'], date: '2023-10-15', size: '245 MB', type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { id: 2, name: 'Anotacoes_Campo_VilaNova.pdf', path: '/Pesquisa/Cadernos', folderId: 'cad', territorios: ['t2'], tags: ['tg2', 'tg5'], date: '2023-10-16', size: '1.8 MB', type: 'document', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 3, name: 'Foto_Ruinas_Engenho_01.jpg', path: '/Acervo Fotográfico', folderId: 'acervo', territorios: ['t4'], tags: ['tg3'], date: '2023-10-18', size: '5.1 MB', type: 'image', url: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1000&q=80' },
  { id: 4, name: 'Entrevista_Dona_Maria.wav', path: '/Projetos/Audiovisual/Áudio', folderId: 'audio', territorios: ['t3'], tags: ['tg1', 'tg2'], date: '2023-10-20', size: '32.2 MB', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 5, name: 'Manifesto_Associacao.pdf', path: '/Documentos Oficiais', folderId: 'docs', territorios: ['t3'], tags: ['tg1', 'tg3', 'tg4'], date: '2023-10-22', size: '145 KB', type: 'document', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 6, name: 'Reunião_Conselho_Jan.mp4', path: '/Documentos Oficiais/Atas', folderId: 'atas', territorios: ['t1', 't3'], tags: ['tg3'], date: '2024-01-10', size: '120 MB', type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { id: 7, name: 'Mapa_Cartografico_1980.jpg', path: '/Pesquisa/Mapas', folderId: 'map', territorios: ['t1', 't2', 't4'], tags: ['tg3', 'tg4'], date: '2024-02-05', size: '12 MB', type: 'image', url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80' },
  { id: 8, name: 'Canto_Trabalho_Engenho.mp3', path: '/Acervo Fotográfico/Audio_Resgate', folderId: 'aresg', territorios: ['t4'], tags: ['tg3'], date: '2024-03-12', size: '4.5 MB', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 9, name: 'Relatório_Impacto_Ambiental.pdf', path: '/Projetos', folderId: 'proj', territorios: ['t1', 't4'], tags: ['tg1', 'tg5'], date: '2024-04-20', size: '3.4 MB', type: 'document', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 10, name: 'Festa_Padroeira_VilaNova.jpg', path: '/Acervo Fotográfico', folderId: 'acervo', territorios: ['t2'], tags: ['tg3'], date: '2024-05-15', size: '8.1 MB', type: 'image', url: 'https://images.unsplash.com/photo-1533174000253-1d59d20c5d58?auto=format&fit=crop&w=1000&q=80' },
];

const initialFolders = [
  { id: 'pesq', name: 'Pesquisa', children: [{ id: 'cad', name: 'Cadernos', children: [] }, { id: 'ref', name: 'Referências', children: [] }, { id: 'map', name: 'Mapas', children: [] }] },
  { id: 'proj', name: 'Projetos', children: [{ id: 'av', name: 'Audiovisual', children: [{ id: 'audio', name: 'Áudio', children: [] }] }] },
  { id: 'acervo', name: 'Acervo Fotográfico', children: [{ id: 'aresg', name: 'Audio_Resgate', children: [] }] },
  { id: 'docs', name: 'Documentos Oficiais', children: [{ id: 'atas', name: 'Atas', children: [] }] },
];

// Flatten folders for dropdowns and path generation
const flattenFolders = (folders, parentPath = '') => {
  let result = [];
  folders.forEach(f => {
    const currentPath = parentPath ? `${parentPath}/${f.name}` : `/${f.name}`;
    result.push({ id: f.id, name: f.name, path: currentPath });
    if (f.children && f.children.length > 0) {
      result = result.concat(flattenFolders(f.children, currentPath));
    }
  });
  return result;
};

const addFolderToTree = (folders, parentId, newFolder) => {
  if (!parentId) return [...folders, newFolder];
  return folders.map(folder => {
    if (folder.id === parentId) return { ...folder, children: [...(folder.children || []), newFolder] };
    if (folder.children) return { ...folder, children: addFolderToTree(folder.children, parentId, newFolder) };
    return folder;
  });
};

const renameFolderInTree = (folders, idToRename, newName) => {
  return folders.map(folder => {
    if (folder.id === idToRename) return { ...folder, name: newName };
    if (folder.children) return { ...folder, children: renameFolderInTree(folder.children, idToRename, newName) };
    return folder;
  });
};

const deleteFolderFromTree = (folders, idToRemove) => {
  return folders.filter(f => f.id !== idToRemove).map(folder => {
    if (folder.children) return { ...folder, children: deleteFolderFromTree(folder.children, idToRemove) };
    return folder;
  });
};

const getDescendantFolderIds = (folders, targetId) => {
  let targetNode = null;
  const findNode = (nodes) => {
    for (let n of nodes) {
      if (n.id === targetId) { targetNode = n; return; }
      if (n.children) findNode(n.children);
    }
  };
  findNode(folders);

  const ids = [];
  const collectIds = (node) => {
    if (!node) return;
    ids.push(node.id);
    if (node.children) node.children.forEach(collectIds);
  };
  collectIds(targetNode);
  return ids;
};

// UI Helpers
const ButtonPrimary = ({ children, onClick, className = '', icon: Icon, color = 'bgRust', disabled = false, title }) => {
  const bgColors = { bgRust: 'bg-[#C13B22]', bgMustard: 'bg-[#EAB308]', bgNavy: 'bg-[#1E3A5F]', bgOlive: 'bg-[#849B55]', bgDark: 'bg-[#2C1A14]' };
  const textColors = { bgRust: 'text-white', bgMustard: 'text-[#2C1A14]', bgNavy: 'text-white', bgOlive: 'text-[#2C1A14]', bgDark: 'text-[#F4EFE6]' };

  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`relative group font-display font-bold py-3 px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${textColors[color]} ${className}`}>
      <div className={`absolute inset-0 border-2 border-[#2C1A14] bg-[#2C1A14] translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform`}></div>
      <div className={`absolute inset-0 border-2 border-[#2C1A14] ${bgColors[color]} group-active:translate-x-1 group-active:translate-y-1 transition-transform`}></div>
      <div className="relative flex items-center justify-center gap-2 z-10">
        {Icon && <Icon size={20} strokeWidth={2.5} />}
        <span className="uppercase tracking-wider">{children}</span>
      </div>
    </button>
  );
};

const Badge = ({ item, isTerritory = false }) => {
  if (!item) return null;
  return (
    <span 
      className={`px-2.5 py-1 text-[10px] sm:text-xs font-display font-bold uppercase tracking-wider shadow-[2px_2px_0px_#2C1A14] border-2 border-[#2C1A14] mr-2 mb-2 inline-flex items-center gap-1 -rotate-1`}
      style={{ backgroundColor: item.bgColor, color: item.textColor }}
    >
      {isTerritory && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>}
      {item.name}
    </span>
  );
};

const FileIcon = ({ type, className = "", size = 24 }) => {
  switch(type) {
    case 'video': return <Video className={`text-[#C13B22] ${className}`} size={size} strokeWidth={2} />;
    case 'image': return <ImageIcon className={`text-[#EAB308] ${className}`} size={size} strokeWidth={2} />;
    case 'audio': return <Music className={`text-[#849B55] ${className}`} size={size} strokeWidth={2} />;
    default: return <FileText className={`text-[#1E3A5F] ${className}`} size={size} strokeWidth={2} />;
  }
};

const ConfirmModal = ({ isOpen, title, text, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#C13B22] w-full max-w-md relative p-6">
         <div className="flex items-center gap-3 mb-4 text-[#C13B22]">
           <AlertTriangle size={32} strokeWidth={2.5} />
           <h3 className="text-2xl font-display font-black uppercase tracking-wide">{title}</h3>
         </div>
         <p className="font-sans font-medium text-lg text-[#2C1A14] mb-8">{text}</p>
         <div className="flex justify-end gap-4">
            <button onClick={onCancel} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2">Cancelar</button>
            <ButtonPrimary onClick={onConfirm} color="bgRust">Sim, Excluir</ButtonPrimary>
         </div>
      </div>
    </div>
  );
};

const FolderModal = ({ config, flatFolders, onClose, onSave }) => {
  if (!config.isOpen) return null;
  const isEdit = config.mode === 'edit';
  
  const [folderName, setFolderName] = useState('');
  const [parentId, setParentId] = useState('');

  useEffect(() => {
    if (config.isOpen) {
      setFolderName(isEdit ? config.folder.name : '');
      setParentId(config.parentId || '');
    }
  }, [config, isEdit]);

  const handleSubmit = () => {
    if (folderName.trim()) {
      onSave(folderName.trim(), parentId, config.mode, config.folder?.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#849B55] w-full max-w-md relative p-6">
        <h3 className="text-2xl font-display font-black text-[#2C1A14] uppercase mb-6 flex items-center gap-2 border-b-4 border-[#2C1A14] pb-2">
          {isEdit ? <Edit size={28} className="text-[#849B55]"/> : <FolderPlus size={28} className="text-[#849B55]" />} 
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
                {flatFolders.map(f => (
                  <option key={f.id} value={f.id}>{f.path}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2">Cancelar</button>
          <ButtonPrimary onClick={handleSubmit} color="bgOlive" disabled={!folderName.trim()}>
             {isEdit ? 'Salvar' : 'Criar Pasta'}
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

const MoveFileModal = ({ isOpen, file, flatFolders, onClose, onSave }) => {
  if (!isOpen || !file) return null;
  const [selectedFolderId, setSelectedFolderId] = useState(file.folderId || '');

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
             {flatFolders.map(f => (
               <button 
                 key={f.id} onClick={() => setSelectedFolderId(f.id)}
                 className={`w-full text-left px-3 py-2 font-mono text-sm truncate transition-colors ${selectedFolderId === f.id ? 'bg-[#2C1A14] text-[#F4EFE6]' : 'hover:bg-black/5'}`}
               >
                 {f.path}
               </button>
             ))}
          </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2">Cancelar</button>
          <ButtonPrimary onClick={() => onSave(file.id, selectedFolderId)} color="bgMustard">Confirmar</ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

const ClassificacaoModal = ({ file, territorios, tags, onClose, onSave }) => {
  const [selectedTerritorios, setSelectedTerritorios] = useState(file.territorios || []);
  const [selectedTags, setSelectedTags] = useState(file.tags || []);

  const toggleSelection = (id, list, setList) => {
    setList(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#2C1A14] w-full max-w-2xl relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b-4 border-[#2C1A14] bg-[#F4EFE6] shrink-0">
          <div>
            <h3 className="text-xl font-display font-black text-[#2C1A14] uppercase tracking-wide flex items-center gap-2">
              <Tags size={24} className="text-[#C13B22]" strokeWidth={2.5} /> Classificar
            </h3>
            <p className="text-sm font-sans font-medium text-[#2C1A14]/70 mt-1 truncate max-w-sm">{file.name}</p>
          </div>
          <button onClick={onClose} className="text-[#2C1A14] hover:bg-[#C13B22] hover:text-white p-2 border-2 border-transparent hover:border-[#2C1A14] transition-colors"><X size={24} strokeWidth={3} /></button>
        </div>
        <div className="p-6 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] overflow-y-auto space-y-8 flex-1">
          <div className="space-y-4">
            <h4 className="font-display font-black text-lg uppercase border-b-2 border-[#2C1A14]/20 pb-2">Territórios</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {territorios.map(t => (
                <label key={t.id} className="flex items-center gap-3 p-3 border-2 border-[#2C1A14] bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#2C1A14] transition-all">
                  <div className="relative flex items-center justify-center w-6 h-6 border-2 border-[#2C1A14] bg-[#F4EFE6] shrink-0">
                    {selectedTerritorios.includes(t.id) && <div className="absolute w-3.5 h-3.5 bg-[#C13B22]"></div>}
                  </div>
                  <span className="px-2 py-1 text-xs font-display font-bold uppercase truncate border-2 border-[#2C1A14]" style={{ backgroundColor: t.bgColor, color: t.textColor }}>{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-display font-black text-lg uppercase border-b-2 border-[#2C1A14]/20 pb-2">Tags Livres</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tags.map(t => (
                <label key={t.id} className="flex items-center gap-3 p-3 border-2 border-[#2C1A14] bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#2C1A14] transition-all">
                  <input type="checkbox" className="hidden" checked={selectedTags.includes(t.id)} onChange={() => toggleSelection(t.id, selectedTags, setSelectedTags)} />
                  <div className="relative flex items-center justify-center w-6 h-6 border-2 border-[#2C1A14] bg-[#F4EFE6] rounded-full shrink-0">
                    {selectedTags.includes(t.id) && <div className="absolute w-3 h-3 bg-[#1E3A5F] rounded-full"></div>}
                  </div>
                  <span className="px-2 py-1 text-xs font-display font-bold uppercase truncate border-2 border-[#2C1A14] rounded-full" style={{ backgroundColor: t.bgColor, color: t.textColor }}>{t.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t-4 border-[#2C1A14] bg-[#F4EFE6] flex justify-end gap-4 shrink-0">
          <button onClick={onClose} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 decoration-2 px-4 py-2">Cancelar</button>
          <ButtonPrimary onClick={() => onSave(file.id, selectedTerritorios, selectedTags)} color="bgMustard">Salvar</ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

const FileViewer = ({ file, onClose }) => {
  const [scale, setScale] = useState(1);
  return (
    <div className="fixed inset-0 bg-[#2C1A14]/90 backdrop-blur-md flex items-center justify-center z-[200] p-4 md:p-8">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[16px_16px_0px_#EAB308] w-full max-w-6xl h-full max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b-4 border-[#2C1A14] bg-[#F4EFE6] shrink-0">
          <h3 className="text-2xl font-display font-black text-[#2C1A14] uppercase truncate pr-4 flex items-center gap-3">
             <FileIcon type={file.type} size={28} /> {file.name}
          </h3>
          <button onClick={onClose} className="bg-white text-[#2C1A14] hover:bg-[#C13B22] hover:text-white p-2 border-4 border-[#2C1A14] shadow-[4px_4px_0px_#2C1A14] hover:-translate-y-1 transition-all shrink-0">
            <X size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-[#2C1A14]">
          {file.type === 'image' && (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <div className="absolute bottom-6 right-6 z-10 flex gap-2 bg-[#F4EFE6] border-4 border-[#2C1A14] p-2 shadow-[6px_6px_0px_#C13B22]">
                <button onClick={() => setScale(s => Math.max(s - 0.5, 0.5))} className="bg-white p-2 border-2 border-[#2C1A14] hover:bg-[#EAB308]"><ZoomOut size={24} /></button>
                <button onClick={() => setScale(s => Math.min(s + 0.5, 3))} className="bg-white p-2 border-2 border-[#2C1A14] hover:bg-[#EAB308]"><ZoomIn size={24} /></button>
              </div>
              <div className="overflow-auto w-full h-full flex items-center justify-center" style={{ overflow: scale > 1 ? 'auto' : 'hidden' }}>
                  <img src={file.url} alt={file.name} style={{ transform: `scale(${scale})` }} className="max-w-full max-h-full object-contain border-4 border-[#F4EFE6] shadow-2xl transition-transform" />
              </div>
            </div>
          )}
          {file.type === 'video' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <video controls className="w-full max-h-full border-4 border-[#F4EFE6] shadow-[12px_12px_0px_#C13B22] bg-black"><source src={file.url} type="video/mp4" /></video>
            </div>
          )}
          {file.type === 'audio' && (
            <div className="w-full h-full flex items-center justify-center bg-[#E4CFB2] relative">
               <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-10 shadow-[12px_12px_0px_#C13B22] flex flex-col items-center w-full max-w-md">
                  <Music size={48} className="text-[#849B55] mb-6 animate-pulse" />
                  <audio controls className="w-full"><source src={file.url} type="audio/mpeg" /></audio>
               </div>
            </div>
          )}
          {file.type === 'document' && (
            <iframe src={file.url} className="w-full h-full border-none bg-white" title="Documento" />
          )}
        </div>
      </div>
    </div>
  );
};

const Acervo = ({ isAdmin, files, setFiles, folders, setFolders, territorios, tags }) => {
  const [editingFile, setEditingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [movingFile, setMovingFile] = useState(null);
  
  // Folder Management State
  const [activeFolderId, setActiveFolderId] = useState(''); // '' means root/all
  const [folderModalConfig, setFolderModalConfig] = useState({ isOpen: false, mode: 'create', parentId: '', folder: null });
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(['pesq', 'proj']);
  
  // Filtering & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerritorios, setSelectedTerritorios] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  const flatFolders = flattenFolders(folders);

  const getDisplayPath = (folderId) => {
    if (!folderId) return '/ (Raiz)';
    const found = flatFolders.find(f => f.id === folderId);
    return found ? found.path : '/ (Raiz)';
  };

  const handleFilterToggle = (id, list, setList) => {
    setList(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    setCurrentPage(1);
  };

  // The actual filter logic, including Folder navigation
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTerritorio = selectedTerritorios.length === 0 || selectedTerritorios.some(t => f.territorios.includes(t));
    const matchesTag = selectedTags.length === 0 || selectedTags.some(t => f.tags.includes(t));
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(f.type);
    
    // Strict Folder matching (acts like standard OS directory)
    const matchesFolder = activeFolderId === '' ? true : f.folderId === activeFolderId;

    return matchesSearch && matchesTerritorio && matchesTag && matchesType && matchesFolder;
  });

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage) || 1;
  const currentFiles = filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Folder Management Handlers ---
  const handleSaveFolder = (name, parentId, mode, folderId) => {
    if (mode === 'create') {
      setFolders(prev => addFolderToTree(prev, parentId, { id: `fd_${Date.now()}`, name, children: [] }));
    } else {
      setFolders(prev => renameFolderInTree(prev, folderId, name));
    }
    setFolderModalConfig({ isOpen: false, mode: 'create', parentId: '', folder: null });
  };

  const handleConfirmDeleteFolder = () => {
    if (!folderToDelete) return;
    
    // Find all subfolders to remap their files to root
    const idsToRemove = getDescendantFolderIds(folders, folderToDelete.id);
    
    // Move affected files to root
    setFiles(prev => prev.map(f => idsToRemove.includes(f.folderId) ? { ...f, folderId: '' } : f));
    
    // Delete from tree
    setFolders(prev => deleteFolderFromTree(prev, folderToDelete.id));
    
    // Reset selection if we were inside the deleted folder
    if (idsToRemove.includes(activeFolderId)) setActiveFolderId('');
    
    setFolderToDelete(null);
  };

  // Recursively renders folder tree with Admin Actions
  const FolderNode = ({ folder, depth = 0 }) => {
    const isExpanded = expandedFolders.includes(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isActive = activeFolderId === folder.id;
    
    return (
      <div className="select-none font-display font-bold uppercase text-sm tracking-wide">
        <div 
          className={`group flex items-center gap-3 py-2.5 px-3 cursor-pointer text-[#2C1A14] transition-colors border-b-2 ${isActive ? 'bg-[#2C1A14] text-[#F4EFE6] border-[#2C1A14]' : 'border-transparent hover:bg-black/5 hover:border-[#2C1A14]'}`}
          style={{ paddingLeft: `${(depth * 1) + 0.75}rem` }}
          onClick={(e) => { e.stopPropagation(); setActiveFolderId(folder.id); setCurrentPage(1); }}
        >
          <div 
             className="p-1 hover:bg-black/10 -ml-1 transition-colors rounded"
             onClick={(e) => { 
               e.stopPropagation(); 
               if(hasChildren) setExpandedFolders(p => p.includes(folder.id) ? p.filter(id => id !== folder.id) : [...p, folder.id]);
             }}
          >
             {hasChildren ? (isExpanded ? <ChevronDown size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />) : <span className="w-[18px] inline-block"></span>}
          </div>
          
          <Folder size={20} fill={isActive ? "currentColor" : (hasChildren ? "currentColor" : "none")} strokeWidth={2} className="shrink-0" />
          <span className="truncate flex-1" title={folder.name}>{folder.name}</span>

          {isAdmin && (
             <div className="hidden group-hover:flex items-center gap-1.5 shrink-0 bg-[#F4EFE6]/90 p-1 border-2 border-[#2C1A14] shadow-[2px_2px_0px_#2C1A14] ml-2">
               <button onClick={(e) => { e.stopPropagation(); setFolderModalConfig({ isOpen: true, mode: 'create', parentId: folder.id }); }} className="text-[#849B55] hover:scale-110" title="Subpasta"><Plus size={14} strokeWidth={3}/></button>
               <button onClick={(e) => { e.stopPropagation(); setFolderModalConfig({ isOpen: true, mode: 'edit', folder }); }} className="text-[#EAB308] hover:scale-110" title="Renomear"><Edit size={14} strokeWidth={3}/></button>
               <button onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder); }} className="text-[#C13B22] hover:scale-110" title="Excluir"><Trash2 size={14} strokeWidth={3}/></button>
             </div>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div className="relative bg-black/[0.02]">
            <div className="absolute left-[30px] top-0 bottom-0 w-0.5 bg-[#2C1A14]/10" style={{ marginLeft: `${depth * 1}rem`}}></div>
            {folder.children.map(child => <FolderNode key={child.id} folder={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full relative overflow-hidden animate-in fade-in duration-300">
      
      {/* Sidebar - GED Area */}
      <div className="w-80 border-r-4 border-[#2C1A14] bg-[#F4EFE6] flex-col hidden lg:flex shrink-0 relative z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)]">
        <div className="p-6 border-b-4 border-[#2C1A14] bg-[#EAB308] flex justify-between items-center">
          <div>
             <h2 className="text-xl font-display font-black text-[#2C1A14] uppercase tracking-tighter flex items-center gap-2">
               <FolderTree size={24} strokeWidth={3} /> Diretórios
             </h2>
          </div>
          {isAdmin && (
             <button onClick={() => setFolderModalConfig({ isOpen: true, mode: 'create', parentId: '' })} className="bg-white p-1.5 border-2 border-[#2C1A14] shadow-[2px_2px_0px_#2C1A14] hover:-translate-y-0.5 hover:bg-[#849B55] hover:text-white transition-all" title="Nova Pasta na Raiz">
               <Plus size={20} strokeWidth={3} />
             </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-2 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pb-20">
          
          <div 
             className={`flex items-center gap-3 py-3 px-6 cursor-pointer text-[#2C1A14] transition-colors border-b-2 ${activeFolderId === '' ? 'bg-[#2C1A14] text-[#F4EFE6] border-[#2C1A14]' : 'border-transparent hover:bg-black/5 hover:border-[#2C1A14]'}`}
             onClick={() => { setActiveFolderId(''); setCurrentPage(1); }}
          >
             <Archive size={22} strokeWidth={2} />
             <span className="font-display font-bold uppercase text-sm tracking-wide">Todos os Arquivos</span>
          </div>
          
          <div className="my-2 border-t-2 border-dashed border-[#2C1A14]/20 mx-4"></div>
          
          {folders.map(folder => <FolderNode key={folder.id} folder={folder} />)}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex justify-between items-end border-b-4 border-[#2C1A14] pb-6 mb-2 gap-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-display font-black text-[#2C1A14] uppercase leading-none tracking-tighter mb-2">
                Busca & <span className="text-[#1E3A5F]">Acervo</span>
              </h1>
              <p className="font-mono text-sm font-bold text-[#2C1A14]/70 tracking-tight bg-white border-2 border-[#2C1A14] inline-block px-3 py-1 shadow-[2px_2px_0px_#2C1A14]">
                Pasta Atual: {getDisplayPath(activeFolderId)}
              </p>
            </div>
            {isAdmin && <ButtonPrimary icon={Plus} color="bgRust" className="hidden sm:flex">Upload</ButtonPrimary>}
          </div>

          {/* Advanced Filtering Box */}
          <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-6 mb-8 shadow-[8px_8px_0px_rgba(44,26,20,0.1)] space-y-6">
             <div className="flex gap-4 items-center">
                <Search size={24} className="text-[#C13B22] hidden sm:block" strokeWidth={3}/>
                <input 
                  type="text" placeholder="Buscar por nome do arquivo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-4 border-[#2C1A14] p-3 font-sans font-medium text-lg outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all placeholder:text-[#2C1A14]/40"
                />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t-2 border-dashed border-[#2C1A14]/20">
                <div className="md:col-span-5">
                   <span className="block font-display font-black text-sm uppercase mb-3 tracking-widest text-[#1E3A5F]">Filtrar por Territórios</span>
                   <div className="flex flex-wrap gap-2">
                     {territorios.map(t => (
                       <button key={t.id} onClick={() => handleFilterToggle(t.id, selectedTerritorios, setSelectedTerritorios)}
                         className={`px-3 py-1.5 text-xs font-display font-bold uppercase border-2 border-[#2C1A14] transition-all ${selectedTerritorios.includes(t.id) ? 'shadow-[3px_3px_0px_#2C1A14] -translate-y-0.5' : 'bg-white text-[#2C1A14] opacity-60 hover:opacity-100 hover:-translate-y-0.5'}`}
                         style={selectedTerritorios.includes(t.id) ? { backgroundColor: t.bgColor, color: t.textColor } : {}}
                       >{t.name}</button>
                     ))}
                   </div>
                </div>
                
                <div className="md:col-span-5 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#2C1A14]/20 pt-4 md:pt-0 md:pl-6">
                   <span className="block font-display font-black text-sm uppercase mb-3 tracking-widest text-[#C13B22]">Filtrar por Tags</span>
                   <div className="flex flex-wrap gap-2">
                     {tags.map(t => (
                       <button key={t.id} onClick={() => handleFilterToggle(t.id, selectedTags, setSelectedTags)}
                         className={`px-3 py-1 text-xs font-display font-bold uppercase border-2 border-[#2C1A14] rounded-full transition-all ${selectedTags.includes(t.id) ? 'shadow-[3px_3px_0px_#2C1A14] -translate-y-0.5' : 'bg-white text-[#2C1A14] opacity-60 hover:opacity-100 hover:-translate-y-0.5'}`}
                         style={selectedTags.includes(t.id) ? { backgroundColor: t.bgColor, color: t.textColor } : {}}
                       >{t.name}</button>
                     ))}
                   </div>
                </div>

                <div className="md:col-span-2 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#2C1A14]/20 pt-4 md:pt-0 md:pl-6">
                   <span className="block font-display font-black text-sm uppercase mb-3 tracking-widest text-[#849B55]">Mídia</span>
                   <div className="flex flex-wrap gap-2">
                      {['document', 'image', 'video', 'audio'].map(type => (
                         <button key={type} onClick={() => handleFilterToggle(type, selectedTypes, setSelectedTypes)}
                          className={`p-2 border-2 border-[#2C1A14] transition-all ${selectedTypes.includes(type) ? 'bg-[#2C1A14] text-white shadow-[3px_3px_0px_#EAB308] -translate-y-0.5' : 'bg-white hover:bg-black/5 hover:-translate-y-0.5'}`}
                          title={`Filtrar ${type}`}
                         ><FileIcon type={type} size={20} /></button>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-[#2C1A14] text-[#F4EFE6] px-4 py-2 font-display font-bold uppercase text-xs shadow-[4px_4px_0px_#C13B22] inline-block">
             {filteredFiles.length} registros encontrados
          </div>

          {/* Results Table */}
          <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_rgba(44,26,20,0.15)] overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-white text-[#2C1A14] font-display uppercase tracking-widest text-[11px] border-b-4 border-[#2C1A14]">
                    <th className="px-5 py-4 font-black w-2/5">Arquivo</th>
                    <th className="px-5 py-4 font-black">Localização</th>
                    <th className="px-5 py-4 font-black w-1/3">Classificação</th>
                    <th className="px-5 py-4 font-black text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-dashed divide-[#2C1A14]/20 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
                   {currentFiles.map(file => (
                     <tr key={file.id} className="hover:bg-white/60 transition-colors group">
                       <td className="px-5 py-4">
                         <div className="flex items-center gap-4">
                           {/* Brutalist Thumbnail Preview */}
                           <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 border-4 border-[#2C1A14] bg-[#F4EFE6] shadow-[4px_4px_0px_#2C1A14] group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0px_#C13B22] transition-all overflow-hidden flex items-center justify-center p-0.5">
                              {file.type === 'image' ? (
                                <img src={file.url} alt="Preview" className="w-full h-full object-cover filter contrast-125" />
                              ) : (
                                <div className="w-full h-full bg-[#E4CFB2]/30 flex items-center justify-center">
                                  <FileIcon type={file.type} className="opacity-40" size={32} />
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 bg-white border-2 border-[#2C1A14] p-0.5">
                                 <FileIcon type={file.type} size={14} />
                              </div>
                           </div>
                           <div className="min-w-0">
                             <p className="font-display font-black text-[#2C1A14] text-sm sm:text-base uppercase truncate pr-4 group-hover:text-[#C13B22] transition-colors">{file.name}</p>
                             <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] font-mono font-bold text-[#2C1A14]/60 uppercase tracking-wider bg-[#2C1A14]/5 px-1">{file.size}</span>
                               <span className="text-[10px] font-sans font-bold text-[#2C1A14]/40 uppercase tracking-wider">{file.date}</span>
                             </div>
                           </div>
                         </div>
                       </td>
                       <td className="px-5 py-4">
                         <div className="inline-flex items-center gap-1.5 font-mono text-[10px] bg-[#2C1A14]/5 px-2 py-1.5 border border-[#2C1A14]/20 max-w-[180px] truncate" title={getDisplayPath(file.folderId)}>
                           <Folder size={12} className="shrink-0 text-[#EAB308]" /> {getDisplayPath(file.folderId)}
                         </div>
                       </td>
                       <td className="px-5 py-4">
                         <div className="flex flex-col gap-1.5">
                           <div className="flex flex-wrap gap-1">
                             {file.territorios.map(id => <Badge key={id} item={territorios.find(t=>t.id===id)} isTerritory />)}
                           </div>
                           <div className="flex flex-wrap gap-1">
                             {file.tags.map(id => <Badge key={id} item={tags.find(t=>t.id===id)} />)}
                           </div>
                         </div>
                       </td>
                       <td className="px-5 py-4">
                         <div className="flex items-center justify-end gap-2">
                           {isAdmin && (
                             <>
                               <button onClick={() => setMovingFile(file)} className="bg-white border-2 border-[#2C1A14] p-2 hover:bg-[#EAB308] hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14]" title="Mover">
                                 <CornerDownRight size={18} strokeWidth={2.5}/>
                               </button>
                               <button onClick={() => setEditingFile(file)} className="bg-white border-2 border-[#2C1A14] p-2 hover:bg-[#849B55] hover:text-white hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14]" title="Classificar">
                                 <Tags size={18} strokeWidth={2.5}/>
                               </button>
                             </>
                           )}
                           <button onClick={() => setViewingFile(file)} className="bg-[#1E3A5F] border-2 border-[#2C1A14] p-2 hover:bg-[#C13B22] hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14] text-white">
                             <Eye size={18} strokeWidth={2.5}/>
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                   {currentFiles.length === 0 && (
                     <tr><td colSpan="4" className="px-5 py-12 text-center font-display font-bold uppercase text-[#2C1A14]/50">Nenhum arquivo encontrado com estes filtros.</td></tr>
                   )}
                </tbody>
             </table>
             
             {/* Pagination Bar */}
             {totalPages > 1 && (
               <div className="bg-[#2C1A14] p-3 flex justify-between items-center text-white font-display text-xs uppercase border-t-4 border-[#2C1A14]">
                 <span>Página {currentPage} de {totalPages}</span>
                 <div className="flex gap-2">
                   <button onClick={() => setCurrentPage(p=>Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1 bg-white text-[#2C1A14] disabled:opacity-50 border-2 border-transparent hover:border-[#EAB308] transition-colors">Anterior</button>
                   <button onClick={() => setCurrentPage(p=>Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1 bg-white text-[#2C1A14] disabled:opacity-50 border-2 border-transparent hover:border-[#EAB308] transition-colors">Próxima</button>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      <FolderModal 
        config={folderModalConfig} flatFolders={flatFolders} onClose={() => setFolderModalConfig({ isOpen: false, mode: 'create' })}
        onSave={handleSaveFolder} 
      />
      
      <ConfirmModal 
        isOpen={!!folderToDelete} title="Excluir Pasta?" 
        text={`Tem certeza que deseja excluir a pasta "${folderToDelete?.name}"? Os arquivos dentro dela e de suas subpastas serão movidos para o diretório raiz.`}
        onCancel={() => setFolderToDelete(null)} onConfirm={handleConfirmDeleteFolder}
      />

      <MoveFileModal 
        isOpen={!!movingFile} file={movingFile} flatFolders={flatFolders} onClose={() => setMovingFile(null)}
        onSave={(fileId, newFolderId) => {
          setFiles(files.map(f => f.id === fileId ? { ...f, folderId: newFolderId } : f));
          setMovingFile(null);
        }}
      />

      {editingFile && (
        <ClassificacaoModal file={editingFile} territorios={territorios} tags={tags} onClose={() => setEditingFile(null)} 
          onSave={(id, ter, tgs) => { setFiles(files.map(f => f.id === id ? { ...f, territorios: ter, tags: tgs } : f)); setEditingFile(null); }} 
        />
      )}

      {viewingFile && <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
    </div>
  );
};

const getContrastTextColor = (hexColor) => {
  if (!hexColor) return '#2C1A14';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#2C1A14' : '#FDFBF7';
};

const PREDEFINED_COLORS = [
  '#1E3A5F', '#2A4D77', '#36608F', '#4A7AAB', '#6394C6',
  '#C13B22', '#D34D34', '#E55F46', '#F07A65', '#FA9584',
  '#EAB308', '#D9A100', '#B8860B', '#996B00', '#7A5200',
  '#849B55', '#738A44', '#627933', '#516822', '#405711',
  '#2C1A14', '#3E2A24', '#503A34', '#624A44', '#745A54',
  '#E4CFB2', '#D6C0A1', '#C8B190', '#BAA27F', '#AC936E' 
];

const Dashboard = ({ files, territorios }) => {
  const parseSize = (sizeStr) => {
    if (!sizeStr) return 0;
    const [val, unit] = sizeStr.split(' ');
    const num = parseFloat(val);
    if (unit === 'GB') return num * 1024;
    if (unit === 'MB') return num;
    if (unit === 'KB') return num / 1024;
    return 0;
  };

  const totalSizeMB = files.reduce((acc, f) => acc + parseSize(f.size), 0);
  const formattedSize = totalSizeMB > 1024 ? `${(totalSizeMB / 1024).toFixed(2)} GB` : `${totalSizeMB.toFixed(2)} MB`;

  const typeCounts = files.reduce((acc, f) => { acc[f.type] = (acc[f.type] || 0) + 1; return acc; }, {});
  const typeColors = { video: '#C13B22', image: '#EAB308', audio: '#849B55', document: '#1E3A5F' };

  const territoryCounts = files.reduce((acc, f) => {
    f.territorios.forEach(tId => { acc[tId] = (acc[tId] || 0) + 1; });
    return acc;
  }, {});

  const sortedTerritories = Object.entries(territoryCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([id, count]) => ({ ...territorios.find(t => t.id === id), count }))
    .filter(t => t.name);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="border-b-4 border-[#2C1A14] pb-6">
          <h1 className="text-4xl md:text-6xl font-display font-black text-[#2C1A14] uppercase leading-none tracking-tighter">Métricas do <span className="text-[#C13B22]">Acervo</span></h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#EAB308] border-4 border-[#2C1A14] p-6 shadow-[8px_8px_0px_#2C1A14] flex flex-col justify-center">
             <div className="flex items-center gap-4 mb-2">
               <Archive size={40} className="text-[#2C1A14]" strokeWidth={2.5}/>
               <h2 className="text-2xl font-display font-black uppercase">Total de Arquivos</h2>
             </div>
             <p className="text-6xl font-display font-black text-[#2C1A14]">{files.length}</p>
          </div>
          
          <div className="bg-[#849B55] border-4 border-[#2C1A14] p-6 shadow-[8px_8px_0px_#2C1A14] flex flex-col justify-center text-[#F4EFE6]">
             <div className="flex items-center gap-4 mb-2">
               <BarChart size={40} className="text-[#F4EFE6]" strokeWidth={2.5}/>
               <h2 className="text-2xl font-display font-black uppercase">Volume de Dados</h2>
             </div>
             <p className="text-6xl font-display font-black">{formattedSize}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-6 shadow-[8px_8px_0px_rgba(44,26,20,0.15)]">
            <h3 className="text-xl font-display font-black uppercase mb-6 border-b-2 border-[#2C1A14]/20 pb-2">Arquivos por Formato</h3>
            <div className="space-y-4">
              {Object.entries(typeCounts).map(([type, count]) => {
                const percentage = Math.round((count / files.length) * 100);
                return (
                  <div key={type} className="flex items-center gap-4">
                    <div className="w-10 flex justify-center shrink-0"><FileIcon type={type} size={24} /></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-display font-bold uppercase mb-1">
                        <span>{type === 'document' ? 'Documentos' : type === 'image' ? 'Imagens' : type === 'video' ? 'Vídeos' : 'Áudios'}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-[#E4CFB2] border-2 border-[#2C1A14] h-4">
                        <div className="h-full border-r-2 border-[#2C1A14]" style={{ width: `${percentage}%`, backgroundColor: typeColors[type] }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-6 shadow-[8px_8px_0px_rgba(44,26,20,0.15)]">
            <h3 className="text-xl font-display font-black uppercase mb-6 border-b-2 border-[#2C1A14]/20 pb-2">Territórios Mais Ativos</h3>
            <div className="space-y-3">
              {sortedTerritories.map((t, index) => {
                const maxCount = sortedTerritories[0]?.count || 1;
                const percentage = Math.round((t.count / maxCount) * 100);
                return (
                  <div key={t.id} className="flex items-center gap-3 group">
                     <span className="font-display font-black text-[#2C1A14]/30 w-6 text-right">{(index + 1).toString().padStart(2, '0')}</span>
                     <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-sm font-display font-bold uppercase truncate pr-2">{t.name}</span>
                          <span className="text-xs font-mono font-bold">{t.count} arq</span>
                        </div>
                        <div className="w-full bg-[#E4CFB2] h-2">
                           <div className="h-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: t.bgColor }}></div>
                        </div>
                     </div>
                  </div>
                );
              })}
              {sortedTerritories.length === 0 && <p className="text-sm font-mono text-[#2C1A14]/60">Nenhum arquivo classificado ainda.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GerenciarIdentidade = ({ territorios, setTerritorios, tags, setTags }) => {
  const [activeTab, setActiveTab] = useState('territorios');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  
  const [name, setName] = useState('');
  const [color, setColor] = useState('#1E3A5F');

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setColor(item.bgColor);
    } else {
      setEditingItem(null);
      setName('');
      setColor(PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)]);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const textColor = getContrastTextColor(color);
    
    const newItem = {
      id: editingItem ? editingItem.id : `${activeTab}_${Date.now()}`,
      name: name.trim(),
      bgColor: color,
      textColor: textColor
    };

    if (activeTab === 'territorios') {
      if (editingItem) setTerritorios(prev => prev.map(t => t.id === editingItem.id ? newItem : t));
      else setTerritorios(prev => [...prev, newItem]);
    } else {
      if (editingItem) setTags(prev => prev.map(t => t.id === editingItem.id ? newItem : t));
      else setTags(prev => [...prev, newItem]);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (activeTab === 'territorios') setTerritorios(prev => prev.filter(t => t.id !== id));
    else setTags(prev => prev.filter(t => t.id !== id));
  };

  const currentList = activeTab === 'territorios' ? territorios : tags;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 animate-in fade-in duration-300 relative">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-[#2C1A14] pb-6 gap-4">
          <h1 className="text-4xl md:text-6xl font-display font-black text-[#2C1A14] uppercase leading-none tracking-tighter">Identidade <span className="text-[#849B55]">Visual</span></h1>
          <ButtonPrimary onClick={() => openModal()} icon={Plus} color="bgOlive">Criar {activeTab === 'territorios' ? 'Território' : 'Tag'}</ButtonPrimary>
        </div>

        <div className="flex gap-4 border-b-2 border-[#2C1A14]/20 pb-4">
           <button onClick={() => setActiveTab('territorios')} className={`font-display font-black uppercase text-lg px-4 py-2 border-4 transition-all ${activeTab === 'territorios' ? 'bg-[#2C1A14] border-[#2C1A14] text-[#F4EFE6] shadow-[4px_4px_0px_#C13B22]' : 'bg-transparent border-transparent text-[#2C1A14]/60 hover:text-[#2C1A14]'}`}>
             Territórios
           </button>
           <button onClick={() => setActiveTab('tags')} className={`font-display font-black uppercase text-lg px-4 py-2 border-4 transition-all ${activeTab === 'tags' ? 'bg-[#2C1A14] border-[#2C1A14] text-[#F4EFE6] shadow-[4px_4px_0px_#EAB308]' : 'bg-transparent border-transparent text-[#2C1A14]/60 hover:text-[#2C1A14]'}`}>
             Tags Livres
           </button>
        </div>

        <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_rgba(44,26,20,0.15)]">
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
                       <span 
                         className={`px-3 py-1.5 text-sm font-display font-bold uppercase tracking-wider shadow-[3px_3px_0px_#2C1A14] border-2 border-[#2C1A14] inline-flex items-center gap-2`}
                         style={{ backgroundColor: item.bgColor, color: item.textColor }}
                       >
                         {activeTab === 'territorios' && <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>}
                         {item.name}
                       </span>
                     </td>
                     <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => openModal(item)} className="bg-white border-2 border-[#2C1A14] p-2 hover:bg-[#EAB308] hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14]" title="Editar">
                             <Edit size={16} strokeWidth={2.5}/>
                           </button>
                           <button onClick={() => handleDelete(item.id)} className="bg-white border-2 border-[#2C1A14] p-2 text-[#C13B22] hover:bg-[#C13B22] hover:text-white hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14]" title="Excluir">
                             <Trash2 size={16} strokeWidth={2.5}/>
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
          <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#849B55] w-full max-w-lg relative p-6">
            <h3 className="text-2xl font-display font-black text-[#2C1A14] uppercase mb-6 flex items-center gap-2 border-b-4 border-[#2C1A14] pb-2">
              {editingItem ? 'Editar' : 'Criar'} {activeTab === 'territorios' ? 'Território' : 'Tag'}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Nome</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border-4 border-[#2C1A14] p-3 font-sans font-medium text-lg outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all bg-white"
                  placeholder="Ex: Zona Norte" autoFocus
                />
              </div>
              
              <div>
                <label className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Cor de Fundo</label>
                <div className="bg-white border-4 border-[#2C1A14] p-3 space-y-4">
                  <div className="grid grid-cols-10 gap-1.5">
                    {PREDEFINED_COLORS.map(c => (
                      <button 
                        key={c} onClick={() => setColor(c)}
                        className={`w-full aspect-square border-2 ${color === c ? 'border-[#2C1A14] scale-110 z-10 shadow-[2px_2px_0px_#2C1A14]' : 'border-transparent hover:scale-110 hover:border-[#2C1A14]/50 hover:z-10'} transition-all`}
                        style={{ backgroundColor: c }}
                        title={c}
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
                <span 
                   className={`px-4 py-2 text-lg font-display font-bold uppercase tracking-wider shadow-[4px_4px_0px_#2C1A14] border-4 border-[#2C1A14] inline-flex items-center gap-2`}
                   style={{ backgroundColor: color, color: getContrastTextColor(color) }}
                 >
                   {activeTab === 'territorios' && <span className="w-2.5 h-2.5 rounded-full bg-current opacity-70"></span>}
                   {name || 'Exemplo'}
                 </span>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-4">
              <button onClick={closeModal} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2">Cancelar</button>
              <ButtonPrimary onClick={handleSave} color="bgMustard" disabled={!name.trim()}>Salvar</ButtonPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('acervo');

  const [territorios, setTerritorios] = useState(initialTerritorios);
  const [tags, setTags] = useState(initialTags);
  const [files, setFiles] = useState(initialFiles);
  const [folders, setFolders] = useState(initialFolders);

  const activeView = !isAdmin && currentView !== 'acervo' ? 'acervo' : currentView;

  return (
    <div className="h-screen w-full bg-[#E4CFB2] flex flex-col font-sans text-[#2C1A14] overflow-hidden selection:bg-[#EAB308] selection:text-[#2C1A14]">
      
      <header className="bg-[#2C1A14] text-[#F4EFE6] border-b-4 border-[#C13B22] flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 relative py-2">
        <div className="flex items-center gap-6">
          <div className="flex flex-col leading-none -rotate-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => setCurrentView('acervo')}>
             <span className="font-display font-black text-2xl tracking-tighter text-[#F4EFE6]">DIÁRIO</span>
             <span className="font-display font-black text-[0.65rem] tracking-[0.3em] text-[#EAB308]">DO TERRITÓRIO</span>
          </div>
          {isAdmin && (
            <div className="hidden md:flex gap-4 border-l-4 border-white/10 pl-6">
              {[ {id:'acervo', lbl:'Acervo'}, {id:'dashboard', lbl:'Métricas'}, {id:'categorias', lbl:'Identidade'} ].map(v => (
                <button key={v.id} onClick={() => setCurrentView(v.id)} className={`font-display font-bold uppercase text-xs tracking-widest px-2 py-1 border-b-4 ${activeView === v.id ? 'border-[#EAB308] text-[#EAB308]' : 'border-transparent text-white/50 hover:text-white'}`}>{v.lbl}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => { setIsAdmin(!isAdmin); if(isAdmin) setCurrentView('acervo'); }}
            className={`flex items-center gap-2 px-3 py-2 font-display font-bold uppercase text-xs border-2 transition-all ${isAdmin ? 'bg-[#C13B22] border-[#C13B22] text-white' : 'border-[#EAB308] text-[#EAB308] hover:bg-[#EAB308] hover:text-[#2C1A14]'}`}
          >
            {isAdmin ? <><Unlock size={14} strokeWidth={3}/> Admin</> : <><Lock size={14} strokeWidth={3}/> Acesso Público</>}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        {activeView === 'dashboard' && <Dashboard files={files} territorios={territorios} />}
        {activeView === 'acervo' && <Acervo isAdmin={isAdmin} files={files} setFiles={setFiles} folders={folders} setFolders={setFolders} territorios={territorios} tags={tags} />}
        {activeView === 'categorias' && <GerenciarIdentidade territorios={territorios} setTerritorios={setTerritorios} tags={tags} setTags={setTags} />}
      </main>
    </div>
  );
}
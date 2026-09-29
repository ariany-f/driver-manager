import { useRef, useState } from 'react';
import {
  Archive, ChevronDown, ChevronRight, CornerDownRight, Edit, Eye, Folder, FolderTree,
  Plus, Search, Tags, Trash2, X,
} from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import FileIcon from '../ui/FileIcon.jsx';
import ClassificacaoModal from '../modals/ClassificacaoModal.jsx';
import ConfirmModal from '../modals/ConfirmModal.jsx';
import FileViewer from '../modals/FileViewer.jsx';
import FolderModal from '../modals/FolderModal.jsx';
import MoveFileModal from '../modals/MoveFileModal.jsx';
import DriveBar from '../drive/DriveBar.jsx';
import { addFolderToTree, deleteFolderFromTree, flattenFolders, getDescendantFolderIds, renameFolderInTree } from '../../lib/folders.js';

export default function Acervo({ isAdmin, files, setFiles, folders, setFolders, territorios, tags, drive, labelsEnabled }) {
  const [editingFile, setEditingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [movingFile, setMovingFile] = useState(null);
  const [activeFolderId, setActiveFolderId] = useState('');
  const [folderModalConfig, setFolderModalConfig] = useState({ isOpen: false, mode: 'create', parentId: '', folder: null });
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(['pesq', 'proj']);
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerritorios, setSelectedTerritorios] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const uploadRef = useRef(null);
  const itemsPerPage = 8;

  const flatFolders = flattenFolders(folders);

  const getDisplayPath = (folderId) => {
    if (!folderId) return '/ (Raiz)';
    const found = flatFolders.find(folder => folder.id === folderId);
    return found ? found.path : '/ (Raiz)';
  };

  const selectFolder = (id) => {
    setActiveFolderId(id);
    setCurrentPage(1);
    setFoldersOpen(false);
  };

  const handleFilterToggle = (id, setList) => {
    setList(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    setCurrentPage(1);
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTerritorio = !labelsEnabled || selectedTerritorios.length === 0 || selectedTerritorios.some(id => (file.territorios || []).includes(id));
    const matchesTag = !labelsEnabled || selectedTags.length === 0 || selectedTags.some(id => (file.tags || []).includes(id));
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(file.type);
    const matchesFolder = activeFolderId === '' ? true : file.folderId === activeFolderId;
    return matchesSearch && matchesTerritorio && matchesTag && matchesType && matchesFolder;
  });

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage) || 1;
  const currentFiles = filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const closeFolderModal = () => setFolderModalConfig({ isOpen: false, mode: 'create', parentId: '', folder: null });

  const handleSaveFolder = (name, parentId, mode, folderId) => {
    if (drive.active) {
      drive.saveFolder({ mode, name, parentId, folderId });
      closeFolderModal();
      return;
    }
    if (mode === 'create') {
      setFolders(prev => addFolderToTree(prev, parentId, { id: `fd_${Date.now()}`, name, children: [] }));
    } else {
      setFolders(prev => renameFolderInTree(prev, folderId, name));
    }
    closeFolderModal();
  };

  const handleUpload = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (selected.length && drive.active) drive.upload(selected, activeFolderId);
  };

  const handleConfirmDeleteFolder = () => {
    if (!folderToDelete) return;
    if (drive.active) {
      drive.deleteFolder(folderToDelete.id);
      setActiveFolderId('');
      setFolderToDelete(null);
      return;
    }
    const idsToRemove = getDescendantFolderIds(folders, folderToDelete.id);
    setFiles(prev => prev.map(file => idsToRemove.includes(file.folderId) ? { ...file, folderId: '' } : file));
    setFolders(prev => deleteFolderFromTree(prev, folderToDelete.id));
    if (idsToRemove.includes(activeFolderId)) setActiveFolderId('');
    setFolderToDelete(null);
  };

  const FolderNode = ({ folder, depth = 0 }) => {
    const isExpanded = expandedFolders.includes(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isActive = activeFolderId === folder.id;

    return (
      <div className="select-none font-display font-bold uppercase text-sm tracking-wide">
        <div
          className={`group flex items-center gap-3 py-2.5 px-3 cursor-pointer text-[#2C1A14] transition-colors border-b-2 ${isActive ? 'bg-[#2C1A14] text-[#F4EFE6] border-[#2C1A14]' : 'border-transparent hover:bg-black/5 hover:border-[#2C1A14]'}`}
          style={{ paddingLeft: `${(depth * 1) + 0.75}rem` }}
          onClick={(e) => { e.stopPropagation(); selectFolder(folder.id); }}
        >
          <div
            className="p-1 hover:bg-black/10 -ml-1 transition-colors rounded"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) setExpandedFolders(prev => prev.includes(folder.id) ? prev.filter(id => id !== folder.id) : [...prev, folder.id]);
            }}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />) : <span className="w-[18px] inline-block"></span>}
          </div>

          <Folder size={20} fill={isActive ? 'currentColor' : (hasChildren ? 'currentColor' : 'none')} strokeWidth={2} className="shrink-0" />
          <span className="truncate flex-1" title={folder.name}>{folder.name}</span>

          {isAdmin && (
            <div className="flex lg:hidden lg:group-hover:flex items-center gap-1 shrink-0 bg-[#F4EFE6]/90 p-0.5 border-2 border-[#2C1A14] shadow-[2px_2px_0px_#2C1A14] ml-2">
              <button onClick={(e) => { e.stopPropagation(); setFolderModalConfig({ isOpen: true, mode: 'create', parentId: folder.id }); }} className="min-h-11 min-w-9 lg:min-h-0 lg:min-w-0 lg:p-0.5 text-[#849B55] inline-flex items-center justify-center" title="Subpasta" aria-label="Nova subpasta"><Plus size={16} strokeWidth={3} /></button>
              <button onClick={(e) => { e.stopPropagation(); setFolderModalConfig({ isOpen: true, mode: 'edit', folder }); }} className="min-h-11 min-w-9 lg:min-h-0 lg:min-w-0 lg:p-0.5 text-[#EAB308] inline-flex items-center justify-center" title="Renomear" aria-label="Renomear pasta"><Edit size={16} strokeWidth={3} /></button>
              <button onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder); }} className="min-h-11 min-w-9 lg:min-h-0 lg:min-w-0 lg:p-0.5 text-[#C13B22] inline-flex items-center justify-center" title="Excluir" aria-label="Excluir pasta"><Trash2 size={16} strokeWidth={3} /></button>
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="relative bg-black/[0.02]">
            <div className="absolute left-[30px] top-0 bottom-0 w-0.5 bg-[#2C1A14]/10" style={{ marginLeft: `${depth * 1}rem` }}></div>
            {folder.children.map(child => <FolderNode key={child.id} folder={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = (labelsEnabled ? selectedTerritorios.length + selectedTags.length : 0) + selectedTypes.length;

  const newFolderButton = isAdmin ? (
    <button onClick={() => setFolderModalConfig({ isOpen: true, mode: 'create', parentId: '' })} className="bg-white p-1.5 border-2 border-[#2C1A14] shadow-[2px_2px_0px_#2C1A14] hover:-translate-y-0.5 hover:bg-[#849B55] hover:text-white transition-all shrink-0" title="Nova Pasta na Raiz" aria-label="Nova pasta na raiz">
      <Plus size={20} strokeWidth={3} />
    </button>
  ) : null;

  const renderDirectoryList = () => (
    <div className="flex-1 overflow-y-auto py-2 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pb-20">
      <div
        className={`flex items-center gap-3 py-3 px-6 cursor-pointer text-[#2C1A14] transition-colors border-b-2 ${activeFolderId === '' ? 'bg-[#2C1A14] text-[#F4EFE6] border-[#2C1A14]' : 'border-transparent hover:bg-black/5 hover:border-[#2C1A14]'}`}
        onClick={() => selectFolder('')}
      >
        <Archive size={22} strokeWidth={2} />
        <span className="font-display font-bold uppercase text-sm tracking-wide">Todos os Arquivos</span>
      </div>
      <div className="my-2 border-t-2 border-dashed border-[#2C1A14]/20 mx-4"></div>
      {folders.map(folder => <FolderNode key={folder.id} folder={folder} />)}
    </div>
  );

  const renderFileActions = (file) => (
    <div className="flex items-center justify-end gap-2">
      {isAdmin && (
        <>
          <button onClick={() => setMovingFile(file)} className="bg-white border-2 border-[#2C1A14] p-2.5 hover:bg-[#EAB308] hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14]" title="Mover" aria-label="Mover">
            <CornerDownRight size={18} strokeWidth={2.5} />
          </button>
          {labelsEnabled && (
            <button onClick={() => setEditingFile(file)} className="bg-white border-2 border-[#2C1A14] p-2.5 hover:bg-[#849B55] hover:text-white hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14]" title="Classificar" aria-label="Classificar">
              <Tags size={18} strokeWidth={2.5} />
            </button>
          )}
        </>
      )}
      <button onClick={() => setViewingFile(file)} className="bg-[#1E3A5F] border-2 border-[#2C1A14] p-2.5 hover:bg-[#C13B22] hover:-translate-y-1 transition-all shadow-[2px_2px_0px_#2C1A14] text-white" title="Ver arquivo" aria-label="Ver arquivo">
        <Eye size={18} strokeWidth={2.5} />
      </button>
    </div>
  );

  const pagination = totalPages > 1 ? (
    <div className="bg-[#2C1A14] p-3 flex justify-between items-center gap-3 text-white font-display text-xs uppercase">
      <span>Página {currentPage} de {totalPages}</span>
      <div className="flex gap-2">
        <button onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} className="min-h-11 px-4 py-2 bg-white text-[#2C1A14] disabled:opacity-50 border-2 border-transparent hover:border-[#EAB308] transition-colors">Anterior</button>
        <button onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="min-h-11 px-4 py-2 bg-white text-[#2C1A14] disabled:opacity-50 border-2 border-transparent hover:border-[#EAB308] transition-colors">Próxima</button>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-full relative overflow-hidden animate-in fade-in duration-300">
      <div className="w-80 border-r-4 border-[#2C1A14] bg-[#F4EFE6] flex-col hidden lg:flex shrink-0 relative z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)]">
        <div className="p-6 border-b-4 border-[#2C1A14] bg-[#EAB308] flex justify-between items-center">
          <h2 className="text-xl font-display font-black text-[#2C1A14] uppercase tracking-tighter flex items-center gap-2">
            <FolderTree size={24} strokeWidth={3} /> Diretórios
          </h2>
          {newFolderButton}
        </div>
        {renderDirectoryList()}
      </div>

      {foldersOpen && (
        <div className="absolute inset-0 z-30 flex lg:hidden">
          <div className="w-[min(88%,20rem)] h-full bg-[#F4EFE6] border-r-4 border-[#2C1A14] flex flex-col shadow-[8px_0_0_#C13B22]">
            <div className="p-4 border-b-4 border-[#2C1A14] bg-[#EAB308] flex justify-between items-center gap-3">
              <h2 className="text-lg font-display font-black text-[#2C1A14] uppercase tracking-tighter flex items-center gap-2">
                <FolderTree size={22} strokeWidth={3} /> Diretórios
              </h2>
              <div className="flex items-center gap-2">
                {newFolderButton}
                <button onClick={() => setFoldersOpen(false)} className="bg-white p-1.5 border-2 border-[#2C1A14] shadow-[2px_2px_0px_#2C1A14]" aria-label="Fechar diretórios">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
            {renderDirectoryList()}
          </div>
          <button className="flex-1 bg-[#2C1A14]/60" onClick={() => setFoldersOpen(false)} aria-label="Fechar diretórios" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8 relative z-10">
        <div className="w-full space-y-6">
          <DriveBar isAdmin={isAdmin} drive={drive} />

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b-4 border-[#2C1A14] pb-4 sm:pb-6 mb-2 gap-4">
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="min-w-0 text-3xl sm:text-5xl lg:text-6xl font-display font-black text-[#2C1A14] uppercase leading-none tracking-tighter">
                  Busca & <span className="text-[#1E3A5F]">Acervo</span>
                </h1>
                <button
                  type="button"
                  onClick={() => setFoldersOpen(true)}
                  className="lg:hidden shrink-0 min-h-11 bg-[#EAB308] text-[#2C1A14] border-2 border-[#2C1A14] shadow-[3px_3px_0px_#2C1A14] px-3 py-2 font-display font-black uppercase text-xs tracking-wider inline-flex items-center gap-2"
                >
                  <FolderTree size={18} strokeWidth={3} /> Pastas
                </button>
              </div>
              <p className="font-mono text-xs sm:text-sm font-bold text-[#2C1A14]/70 tracking-tight bg-white border-2 border-[#2C1A14] inline-block max-w-full px-3 py-1 shadow-[2px_2px_0px_#2C1A14] break-all">
                Pasta Atual: {getDisplayPath(activeFolderId)}
              </p>
            </div>
            {isAdmin && (
              <>
                <input ref={uploadRef} type="file" multiple className="hidden" onChange={handleUpload} />
                <ButtonPrimary icon={Plus} color="bgRust" className="w-full sm:w-auto" disabled={!drive.active || drive.busy} title={drive.active ? 'Enviar para a pasta atual do Drive' : 'Conecte o Google Drive para enviar'} onClick={() => uploadRef.current?.click()}>Upload</ButtonPrimary>
              </>
            )}
          </div>

          <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-4 sm:p-6 mb-8 shadow-[4px_4px_0px_rgba(44,26,20,0.1)] md:shadow-[8px_8px_0px_rgba(44,26,20,0.1)] space-y-4 sm:space-y-6">
            <div className="flex gap-3 sm:gap-4 items-center">
              <Search size={24} className="text-[#C13B22] hidden sm:block shrink-0" strokeWidth={3} />
              <input
                type="text" placeholder="Buscar por nome do arquivo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 bg-white border-4 border-[#2C1A14] p-3 font-sans font-medium text-base sm:text-lg outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all placeholder:text-[#2C1A14]/40"
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen(open => !open)}
              className="md:hidden w-full min-h-11 bg-white border-2 border-[#2C1A14] px-3 py-2 font-display font-black uppercase text-xs tracking-widest shadow-[3px_3px_0px_#2C1A14]"
            >
              {filtersOpen ? 'Ocultar filtros' : 'Filtros'}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>

            <div className={`${filtersOpen ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t-2 border-dashed border-[#2C1A14]/20`}>
              {labelsEnabled && (
                <div className="md:col-span-5">
                  <span className="block font-display font-black text-sm uppercase mb-3 tracking-widest text-[#1E3A5F]">Filtrar por Territórios</span>
                  <div className="flex flex-wrap gap-2">
                    {territorios.map(territorio => (
                      <button key={territorio.id} onClick={() => handleFilterToggle(territorio.id, setSelectedTerritorios)}
                        className={`px-3 py-1.5 text-xs font-display font-bold uppercase border-2 border-[#2C1A14] transition-all ${selectedTerritorios.includes(territorio.id) ? 'shadow-[3px_3px_0px_#2C1A14] -translate-y-0.5' : 'bg-white text-[#2C1A14] opacity-60 hover:opacity-100 hover:-translate-y-0.5'}`}
                        style={selectedTerritorios.includes(territorio.id) ? { backgroundColor: territorio.bgColor, color: territorio.textColor } : {}}
                      >{territorio.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {labelsEnabled && (
                <div className="md:col-span-5 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#2C1A14]/20 pt-4 md:pt-0 md:pl-6">
                  <span className="block font-display font-black text-sm uppercase mb-3 tracking-widest text-[#C13B22]">Filtrar por Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button key={tag.id} onClick={() => handleFilterToggle(tag.id, setSelectedTags)}
                        className={`px-3 py-1 text-xs font-display font-bold uppercase border-2 border-[#2C1A14] rounded-full transition-all ${selectedTags.includes(tag.id) ? 'shadow-[3px_3px_0px_#2C1A14] -translate-y-0.5' : 'bg-white text-[#2C1A14] opacity-60 hover:opacity-100 hover:-translate-y-0.5'}`}
                        style={selectedTags.includes(tag.id) ? { backgroundColor: tag.bgColor, color: tag.textColor } : {}}
                      >{tag.name}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`${labelsEnabled ? 'md:col-span-2 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#2C1A14]/20 pt-4 md:pt-0 md:pl-6' : 'md:col-span-12'}`}>
                <span className="block font-display font-black text-sm uppercase mb-3 tracking-widest text-[#849B55]">Mídia</span>
                <div className="flex flex-wrap gap-2">
                  {['document', 'image', 'video', 'audio'].map(type => (
                    <button key={type} onClick={() => handleFilterToggle(type, setSelectedTypes)}
                      className={`min-h-11 min-w-11 inline-flex items-center justify-center border-2 border-[#2C1A14] transition-all ${selectedTypes.includes(type) ? 'bg-[#2C1A14] text-white shadow-[3px_3px_0px_#EAB308] -translate-y-0.5' : 'bg-white hover:bg-black/5 hover:-translate-y-0.5'}`}
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

          <div className="lg:hidden space-y-3">
            {currentFiles.map(file => (
              <article key={file.id} onClick={() => setViewingFile(file)} className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[4px_4px_0px_rgba(44,26,20,0.15)] p-3 cursor-pointer active:translate-x-0.5 active:translate-y-0.5">
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 shrink-0 border-4 border-[#2C1A14] bg-[#F4EFE6] shadow-[3px_3px_0px_#2C1A14] overflow-hidden flex items-center justify-center">
                    {file.type === 'image' ? (
                      <img src={file.url} alt="" className="w-full h-full object-cover filter contrast-125" />
                    ) : (
                      <div className="w-full h-full bg-[#E4CFB2]/30 flex items-center justify-center">
                        <FileIcon type={file.type} className="opacity-40" size={28} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-black text-[#2C1A14] text-sm uppercase leading-tight break-words">{file.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono font-bold text-[#2C1A14]/60 uppercase tracking-wider bg-[#2C1A14]/5 px-1">{file.size}</span>
                      <span className="text-[10px] font-sans font-bold text-[#2C1A14]/40 uppercase tracking-wider">{file.date}</span>
                    </div>
                    <div className="mt-2 inline-flex max-w-full items-center gap-1.5 font-mono text-[10px] bg-[#2C1A14]/5 px-2 py-1.5 border border-[#2C1A14]/20" title={getDisplayPath(file.folderId)}>
                      <Folder size={12} className="shrink-0 text-[#EAB308]" />
                      <span className="truncate">{getDisplayPath(file.folderId)}</span>
                    </div>
                  </div>
                </div>
                {labelsEnabled && (
                  <div className="mt-3 flex flex-wrap">
                    {(file.territorios || []).map(id => <Badge key={id} item={territorios.find(territorio => territorio.id === id)} isTerritory />)}
                    {(file.tags || []).map(id => <Badge key={id} item={tags.find(tag => tag.id === id)} />)}
                  </div>
                )}
                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {isAdmin && (
                    <>
                      <button onClick={() => setMovingFile(file)} className="flex-1 min-h-11 bg-white border-2 border-[#2C1A14] px-2 font-display font-black uppercase text-[10px] tracking-wide shadow-[2px_2px_0px_#2C1A14]" aria-label="Mover">Mover</button>
                      {labelsEnabled && (
                        <button onClick={() => setEditingFile(file)} className="flex-1 min-h-11 bg-white border-2 border-[#2C1A14] px-2 font-display font-black uppercase text-[10px] tracking-wide shadow-[2px_2px_0px_#2C1A14]" aria-label="Classificar">Classificar</button>
                      )}
                    </>
                  )}
                  <button onClick={() => setViewingFile(file)} className={`${isAdmin ? 'flex-1' : 'w-full'} min-h-11 bg-[#1E3A5F] text-white border-2 border-[#2C1A14] px-2 font-display font-black uppercase text-[10px] tracking-wide shadow-[2px_2px_0px_#2C1A14] inline-flex items-center justify-center gap-2`} aria-label="Abrir arquivo">
                    <Eye size={16} strokeWidth={2.5} /> Abrir
                  </button>
                </div>
              </article>
            ))}
            {currentFiles.length === 0 && (
              <p className="px-3 py-10 text-center font-display font-bold uppercase text-[#2C1A14]/50 border-4 border-dashed border-[#2C1A14]/30">Nenhum arquivo encontrado com estes filtros.</p>
            )}
            {pagination}
          </div>

          <div className="hidden lg:block bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_rgba(44,26,20,0.15)] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white text-[#2C1A14] font-display uppercase tracking-widest text-[11px] border-b-4 border-[#2C1A14]">
                  <th className="px-5 py-4 font-black w-2/5">Arquivo</th>
                  <th className="px-5 py-4 font-black">Localização</th>
                  {labelsEnabled && <th className="px-5 py-4 font-black w-1/3">Classificação</th>}
                  <th className="px-5 py-4 font-black text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-dashed divide-[#2C1A14]/20 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
                {currentFiles.map(file => (
                  <tr key={file.id} className="hover:bg-white/60 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
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
                    {labelsEnabled && (
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap gap-1">
                            {(file.territorios || []).map(id => <Badge key={id} item={territorios.find(territorio => territorio.id === id)} isTerritory />)}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(file.tags || []).map(id => <Badge key={id} item={tags.find(tag => tag.id === id)} />)}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      {renderFileActions(file)}
                    </td>
                  </tr>
                ))}
                {currentFiles.length === 0 && (
                  <tr><td colSpan={labelsEnabled ? 4 : 3} className="px-5 py-12 text-center font-display font-bold uppercase text-[#2C1A14]/50">Nenhum arquivo encontrado com estes filtros.</td></tr>
                )}
              </tbody>
            </table>
            <div className="border-t-4 border-[#2C1A14]">{pagination}</div>
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
          if (drive.active) drive.moveFile(fileId, newFolderId);
          else setFiles(files.map(file => file.id === fileId ? { ...file, folderId: newFolderId } : file));
          setMovingFile(null);
        }}
      />

      {labelsEnabled && editingFile && (
        <ClassificacaoModal file={editingFile} territorios={territorios} tags={tags} onClose={() => setEditingFile(null)}
          onSave={(id, nextTerritorios, nextTags) => {
            if (drive.active) drive.saveClassificacao(id, nextTerritorios, nextTags);
            else setFiles(files.map(file => file.id === id ? { ...file, territorios: nextTerritorios, tags: nextTags } : file));
            setEditingFile(null);
          }}
        />
      )}

      {viewingFile && <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
    </div>
  );
}

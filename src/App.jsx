import { useCallback, useEffect, useRef, useState } from 'react';
import EscolherPastaModal from './components/modals/EscolherPastaModal.jsx';
import Header from './components/layout/Header.jsx';
import VLibras from './components/layout/VLibras.jsx';
import LoginModal from './components/modals/LoginModal.jsx';
import NovidadesModal from './components/modals/NovidadesModal.jsx';
import ClassificarNovosModal from './components/modals/ClassificarNovosModal.jsx';
import Acervo from './components/acervo/Acervo.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import GerenciarIdentidade from './components/identidade/GerenciarIdentidade.jsx';
import Configuracoes from './components/configuracoes/Configuracoes.jsx';
import BancoNecessario from './components/banco/BancoNecessario.jsx';
import PoliticaPrivacidade from './components/legal/PoliticaPrivacidade.jsx';
import TermosServico from './components/legal/TermosServico.jsx';
import UploadProgress from './components/drive/UploadProgress.jsx';
import { getSession, logout as endSession } from './services/auth.js';
import { createPasta, deletePasta, getDatabaseStatus, getFavicon, getIdentidade, getLogo, getVlibras, moveArquivo, renamePasta, saveStatus, saveTags, saveTerritorios } from './services/database.js';
import {
  disconnectDrive,
  exportClassificacoes,
  getDriveStatus,
  hideDriveArquivo,
  importClassificacoes,
  previewDrive,
  renameDriveArquivo,
  saveArquivoData,
  saveArquivoOrigem,
  saveDriveClassificacao,
  syncDrive,
  syncDriveSelection,
  uploadDriveFile,
  replaceDriveFile,
} from './services/drive.js';
import { viewFromLocation, writeViewPath } from './lib/routes.js';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState(viewFromLocation);
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [vlibras, setVlibras] = useState(false);
  const [territorios, setTerritorios] = useState([]);
  const [tags, setTags] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [driveReady, setDriveReady] = useState(false);
  const [driveStatus, setDriveStatus] = useState(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [driveMessage, setDriveMessage] = useState('');
  const [driveError, setDriveError] = useState('');
  const [labelsEnabled, setLabelsEnabled] = useState(false);
  const [databaseProblem, setDatabaseProblem] = useState(null);
  const [novidades, setNovidades] = useState(null);
  const [classificarNovos, setClassificarNovos] = useState([]);
  const [classificando, setClassificando] = useState(false);
  const novidadesDispensadas = useRef(false);
  const escolherPasta = useRef(false);
  const vlibrasTouched = useRef(false);
  const [pickFolder, setPickFolder] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const goTo = useCallback((view) => {
    setCurrentView(view);
    writeViewPath(view);
  }, []);

  const applyArchive = (archive) => {
    setFiles(archive.files);
    setFolders(archive.folders);
  };

  const loadIdentidade = useCallback(() => {
    getIdentidade()
      .then(data => {
        setTerritorios(data.territorios || []);
        setTags(data.tags || []);
        setStatusList(data.status || []);
      })
      .catch(() => {});
  }, []);

  const refreshLogo = useCallback(() => {
    getLogo()
      .then(url => {
        setLogoUrl(current => {
          if (current.startsWith('blob:')) URL.revokeObjectURL(current);
          return url;
        });
      })
      .catch(() => setLogoUrl(''));
  }, []);

  const refreshFavicon = useCallback(() => {
    getFavicon().then(url => setFaviconUrl(url)).catch(() => setFaviconUrl(''));
  }, []);

  const persistTerritorios = async (next) => {
    setTerritorios(next);
    try {
      const saved = await saveTerritorios(next);
      setTerritorios(saved.territorios || next);
    } catch (error) {
      setDriveError(error.message);
    }
  };

  const persistTags = async (next) => {
    setTags(next);
    try {
      const saved = await saveTags(next);
      setTags(saved.tags || next);
    } catch (error) {
      setDriveError(error.message);
    }
  };

  const persistStatus = async (next) => {
    setStatusList(next);
    try {
      const saved = await saveStatus(next);
      const kept = saved.status || next;
      setStatusList(kept);
      const ids = new Set(kept.map(item => item.id));
      setFiles(current => current.map(file => (file.status && !ids.has(file.status) ? { ...file, status: '' } : file)));
    } catch (error) {
      setDriveError(error.message);
    }
  };

  const refreshDrive = useCallback(async ({ commit = false, announce = false, statusOnly = false } = {}) => {
    setDriveBusy(true);
    setDriveError('');
    try {
      const status = await getDriveStatus();
      if (statusOnly) {
        setDriveStatus(status);
        return status;
      }
      setDriveStatus(status);
      if (status.connected && status.folderId) {
        const preview = !commit;
        if (preview) {
          setScanning(true);
          setDriveReady(true);
        }
        const archive = preview ? await previewDrive() : await syncDrive();
        applyArchive(archive);
        const arquivos = archive.novos || [];
        const pastas = archive.novasPastas || [];
        if (commit) {
          setNovidades(null);
          if (arquivos.length) setClassificarNovos(arquivos);
          if (announce && !arquivos.length) {
            setDriveMessage(pastas.length ? 'Pastas novas gravadas no banco.' : 'Nada de novo no Drive.');
          }
        } else if ((arquivos.length || pastas.length) && !novidadesDispensadas.current) {
          setNovidades({ arquivos, pastas, excluidos: archive.excluidos || [] });
        } else {
          setNovidades(null);
        }
      }
      return status;
    } catch (error) {
      setDriveError(error.message);
      return null;
    } finally {
      setScanning(false);
      setDriveBusy(false);
      setDriveReady(true);
    }
  }, []);

  const handleDatabaseChange = useCallback((connected) => {
    const ready = Boolean(connected);
    setLabelsEnabled(ready);
    if (ready) {
      loadIdentidade();
      refreshDrive();
      return;
    }
    setTerritorios([]);
    setTags([]);
    setFiles([]);
    setFolders([]);
    setDriveStatus(null);
    setDriveMessage('');
  }, [loadIdentidade, refreshDrive]);

  useEffect(() => {
    if ((window.location.pathname.replace(/\/$/, '') || '/') === '/identidade') {
      writeViewPath('categorias', true);
    }
    const onPop = () => setCurrentView(viewFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('drive');
    if (result) {
      const message = params.get('message');
      params.delete('drive');
      params.delete('message');
      const next = params.toString();
      window.history.replaceState({}, '', next ? `?${next}` : window.location.pathname);
      if (result === 'choose') {
        escolherPasta.current = true;
        setPickFolder(true);
        setDriveMessage('Conta autorizada. Escolha a pasta do acervo.');
      }
      if (result === 'error') setDriveError(message || 'Não foi possível conectar o Google Drive.');
    }
    const timer = window.setTimeout(() => {
      getSession().then(admin => setIsAdmin(admin)).catch(() => setIsAdmin(false));
      getDatabaseStatus()
        .then(status => {
          const connected = Boolean(status.connected);
          setLabelsEnabled(connected);
          setDatabaseProblem(connected ? null : { error: status.error || '', limited: Boolean(status.limited), limit: Number(status.limit) || 0, at: Date.now() });
          if (!connected) {
            setDriveReady(true);
            setLogoUrl('');
            setFaviconUrl('');
            setVlibras(false);
            return;
          }
          loadIdentidade();
          refreshDrive();
          refreshLogo();
          refreshFavicon();
          getVlibras().then(saved => { if (!vlibrasTouched.current) setVlibras(Boolean(saved.enabled)); }).catch(() => { if (!vlibrasTouched.current) setVlibras(false); });
        })
        .catch(() => {
          setLabelsEnabled(false);
          setDriveReady(true);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshDrive, loadIdentidade, refreshLogo, refreshFavicon]);

  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]');
    if (!link) return;
    if (faviconUrl) {
      link.href = faviconUrl;
      link.removeAttribute('type');
    } else {
      link.type = 'image/svg+xml';
      link.href = '/favicon.svg';
    }
  }, [faviconUrl]);

  useEffect(() => {
    if (isAdmin && driveStatus?.connected && !driveStatus.folderId) setPickFolder(true);
  }, [isAdmin, driveStatus]);

  const drive = {
    status: driveStatus,
    busy: driveBusy,
    scanning,
    message: driveMessage,
    error: driveError,
    active: Boolean(driveStatus?.connected && driveStatus?.folderId),
    chooseFolder: () => setPickFolder(true),
    sync: () => refreshDrive({ commit: true, announce: true }),
    review: async () => {
      setDriveBusy(true);
      setDriveError('');
      setDriveMessage('');
      try {
        const archive = await previewDrive();
        applyArchive(archive);
        setNovidades({ arquivos: archive.novos || [], pastas: archive.novasPastas || [], excluidos: archive.excluidos || [] });
      } catch (error) {
        setDriveError(error.message);
      } finally {
        setDriveBusy(false);
      }
    },
    syncSelection: async (selection) => {
      setDriveBusy(true);
      setDriveError('');
      setDriveMessage('');
      try {
        const archive = await syncDriveSelection(selection);
        applyArchive(archive);
        setNovidades(null);
        const novos = archive.novos || [];
        if (novos.length) setClassificarNovos(novos);
        const restored = (selection.restaurar || []).length;
        if (restored) setDriveMessage(restored === 1 ? 'Arquivo de volta ao acervo, com a classificação que já tinha.' : `${restored} arquivos de volta ao acervo, com a classificação que já tinham.`);
        else if (!novos.length) setDriveMessage('Sincronização gravada no banco.');
      } catch (error) {
        setDriveError(error.message);
      } finally {
        setDriveBusy(false);
      }
    },
    exportBackup: () => exportClassificacoes(),
    importBackup: async (backup) => {
      const result = await importClassificacoes(backup);
      applyArchive(result);
      loadIdentidade();
      return result.resumo;
    },
    hideFile: async (fileId) => {
      setDriveError('');
      setDriveMessage('');
      try {
        await hideDriveArquivo(fileId);
        setFiles(current => current.filter(file => file.id !== fileId));
        setDriveMessage('Arquivo tirado do acervo. Para trazer de volta, use Sincronizar.');
      } catch (error) {
        setDriveError(error.message);
      }
    },
    upload: async (selected, folderId) => {
      setDriveBusy(true);
      setDriveError('');
      setDriveMessage('');
      try {
        const novos = [];
        let archive = null;
        for (let index = 0; index < selected.length; index += 1) {
          const file = selected[index];
          setUploadProgress({ name: file.name, index, count: selected.length, loaded: 0, total: file.size || 0, saving: false });
          archive = await uploadDriveFile(file, folderId, ({ loaded, total }) => {
            const size = total || file.size || 0;
            setUploadProgress({
              name: file.name,
              index,
              count: selected.length,
              loaded,
              total: size,
              saving: size > 0 && loaded >= size,
            });
          });
          novos.push(...(archive.novos || []));
        }
        if (archive) applyArchive(archive);
        if (novos.length) setClassificarNovos(novos);
        setDriveMessage(selected.length === 1 ? 'Arquivo enviado para o Google Drive.' : 'Arquivos enviados para o Google Drive.');
      } catch (error) {
        setDriveError(error.message);
      } finally {
        setUploadProgress(null);
        setDriveBusy(false);
      }
    },
    replace: async (fileId, file) => {
      setDriveBusy(true);
      setDriveError('');
      setDriveMessage('');
      try {
        setUploadProgress({ name: file.name, index: 0, count: 1, loaded: 0, total: file.size || 0, saving: false });
        const archive = await replaceDriveFile(fileId, file, ({ loaded, total }) => {
          const size = total || file.size || 0;
          setUploadProgress({
            name: file.name,
            index: 0,
            count: 1,
            loaded,
            total: size,
            saving: size > 0 && loaded >= size,
          });
        });
        applyArchive(archive);
        setDriveMessage('Arquivo substituído com sucesso.');
      } catch (error) {
        setDriveError(error.message);
        throw error;
      } finally {
        setUploadProgress(null);
        setDriveBusy(false);
      }
    },
    disconnect: async () => {
      setDriveBusy(true);
      setDriveError('');
      setDriveMessage('');
      try {
        const saved = await disconnectDrive();
        setFiles([]);
        setFolders(saved.folders || []);
        setNovidades(null);
        setClassificarNovos([]);
        setDriveStatus(await getDriveStatus());
        setDriveMessage('Drive desconectado. Os arquivos, os caminhos e o ID da pasta saíram. Pastas, tags e formatos continuam.');
      } catch (error) {
        setDriveError(error.message);
      } finally {
        setDriveBusy(false);
      }
    },
    saveFolder: async ({ mode, name, parentId, folderId }) => {
      setDriveError('');
      try {
        const saved = mode === 'create'
          ? await createPasta({ name, parentId })
          : await renamePasta({ id: folderId, name });
        setFolders(saved.folders || []);
      } catch (error) {
        setDriveError(error.message);
      }
    },
    deleteFolder: async (folderId) => {
      setDriveError('');
      try {
        const saved = await deletePasta(folderId);
        setFolders(saved.folders || []);
        const place = new Map((saved.files || []).map(file => [file.id, file.folderId]));
        setFiles(current => current.map(file => (place.has(file.id) ? { ...file, folderId: place.get(file.id) } : file)));
      } catch (error) {
        setDriveError(error.message);
      }
    },
    renameFile: async (fileId, name, driveToo) => {
      setDriveError('');
      try {
        const saved = await renameDriveArquivo(fileId, name, driveToo);
        setFiles(current => current.map(file => (file.id === saved.fileId ? { ...file, name: saved.name } : file)));
        return saved;
      } catch (error) {
        setDriveError(error.message);
        throw error;
      }
    },
    saveData: async (fileId, dataArquivo) => {
      setDriveError('');
      try {
        const saved = await saveArquivoData(fileId, dataArquivo);
        setFiles(current => current.map(file => (file.id === saved.fileId ? { ...file, dataArquivo: saved.dataArquivo } : file)));
        return saved;
      } catch (error) {
        setDriveError(error.message);
        throw error;
      }
    },
    saveOrigem: async (fileId, origem) => {
      setDriveError('');
      try {
        const saved = await saveArquivoOrigem(fileId, origem);
        setFiles(current => current.map(file => (file.id === saved.fileId ? { ...file, origem: saved.origem } : file)));
        return saved;
      } catch (error) {
        setDriveError(error.message);
        throw error;
      }
    },
    moveFile: async (fileId, folderId) => {
      setDriveError('');
      try {
        const saved = await moveArquivo(fileId, folderId);
        setFiles(current => current.map(file => (file.id === saved.fileId ? { ...file, folderId: saved.folderId } : file)));
      } catch (error) {
        setDriveError(error.message);
      }
    },
    saveClassificacao: async (fileId, territoriosNext, tagsNext, formatosNext = [], statusNext = '') => {
      setDriveError('');
      try {
        await saveDriveClassificacao(fileId, territoriosNext, tagsNext, formatosNext, statusNext);
        setFiles(current => current.map(file => file.id === fileId ? { ...file, territorios: territoriosNext, tags: tagsNext, formatos: formatosNext, status: statusNext } : file));
      } catch (error) {
        setDriveError(error.message);
      }
    },
  };

  const salvarClassificacaoNovos = async (choices) => {
    setClassificando(true);
    setDriveError('');
    try {
      const saved = [];
      for (const file of classificarNovos) {
        const choice = choices[file.id] || { territorios: [], tags: [], formatos: [] };
        if (!choice.territorios.length && !choice.tags.length && !(choice.formatos || []).length) continue;
        await saveDriveClassificacao(file.id, choice.territorios, choice.tags, choice.formatos || []);
        saved.push({ id: file.id, ...choice });
      }
      if (saved.length) {
        const byId = new Map(saved.map(item => [item.id, item]));
        setFiles(current => current.map(file => (byId.has(file.id) ? { ...file, territorios: byId.get(file.id).territorios, tags: byId.get(file.id).tags, formatos: byId.get(file.id).formatos || [] } : file)));
      }
      setClassificarNovos([]);
    } catch (error) {
      setDriveError(error.message);
    } finally {
      setClassificando(false);
    }
  };

  const logout = () => {
    endSession().catch(() => {}).finally(() => {
      setIsAdmin(false);
      goTo('acervo');
    });
  };

  const publicPage = currentView === 'privacidade' || currentView === 'termos';
  let activeView = currentView;
  if (!publicPage && !isAdmin && activeView !== 'acervo') activeView = 'acervo';
  if (!publicPage && !labelsEnabled && activeView !== 'configuracoes') activeView = 'acervo';
  const showGate = !publicPage && driveReady && !labelsEnabled && activeView !== 'configuracoes';

  return (
    <div className="h-dvh w-full bg-[#E4CFB2] flex flex-col font-sans text-[#2C1A14] overflow-hidden selection:bg-[#EAB308] selection:text-[#2C1A14]">
      <Header
        isAdmin={isAdmin}
        labelsEnabled={labelsEnabled}
        logoUrl={logoUrl}
        activeView={activeView}
        onNavigate={goTo}
        onLogin={() => setLoginOpen(true)}
        onLogout={logout}
      />

      <EscolherPastaModal
        isOpen={isAdmin && pickFolder}
        onClose={() => {
          escolherPasta.current = false;
          setPickFolder(false);
        }}
        onChosen={() => {
          escolherPasta.current = false;
          setPickFolder(false);
          setDriveMessage('Pasta escolhida. Os arquivos dela passam a ser o acervo.');
          refreshDrive({ commit: true, announce: true });
        }}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => { setIsAdmin(true); setLoginOpen(false); }}
      />

      {isAdmin && labelsEnabled && novidades && !classificarNovos.length && (
        <NovidadesModal
          arquivos={novidades.arquivos}
          pastas={novidades.pastas}
          excluidos={novidades.excluidos}
          busy={driveBusy}
          error={driveError}
          onClose={() => {
            novidadesDispensadas.current = true;
            setNovidades(null);
          }}
          onSync={drive.syncSelection}
        />
      )}
      {isAdmin && labelsEnabled && classificarNovos.length > 0 && (
        <ClassificarNovosModal
          files={classificarNovos}
          territorios={territorios}
          tags={tags}
          busy={classificando}
          error={driveError}
          onClose={() => setClassificarNovos([])}
          onOpenIdentidade={() => { setClassificarNovos([]); goTo('categorias'); }}
          onSave={salvarClassificacaoNovos}
        />
      )}

      <main className="flex-1 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        {activeView === 'privacidade' && <PoliticaPrivacidade />}
        {activeView === 'termos' && <TermosServico />}
        {!publicPage && !driveReady && (
          <p className="p-8 font-display font-black uppercase tracking-widest text-[#2C1A14]">Carregando acervo...</p>
        )}
        {showGate && (
          <BancoNecessario
            isAdmin={isAdmin}
            error={databaseProblem?.limited ? '' : driveError || databaseProblem?.error}
            limited={Boolean(databaseProblem?.limited)}
            limitedAt={databaseProblem?.at}
            limit={databaseProblem?.limit}
            onOpenSettings={() => goTo('configuracoes')}
            onLogin={() => setLoginOpen(true)}
          />
        )}
        {driveReady && labelsEnabled && activeView === 'dashboard' && <Dashboard files={files} territorios={territorios} tags={tags} statusList={statusList} labelsEnabled={labelsEnabled} />}
        {driveReady && labelsEnabled && activeView === 'acervo' && (
          <Acervo
            isAdmin={isAdmin}
            files={files}
            setFiles={setFiles}
            folders={folders}
            setFolders={setFolders}
            territorios={territorios}
            tags={tags}
            statusList={statusList}
            drive={drive}
            labelsEnabled={labelsEnabled}
          />
        )}
        {driveReady && labelsEnabled && activeView === 'categorias' && (
          <GerenciarIdentidade
            territorios={territorios}
            tags={tags}
            statusList={statusList}
            onTerritorios={persistTerritorios}
            onTags={persistTags}
            onStatus={persistStatus}
          />
        )}
        {driveReady && activeView === 'configuracoes' && (
          <Configuracoes
            isAdmin={isAdmin}
            drive={drive}
            onSaved={(options) => refreshDrive(options)}
            onDatabaseChange={handleDatabaseChange}
            logoUrl={logoUrl}
            onLogoChange={refreshLogo}
            faviconUrl={faviconUrl}
            onFaviconChange={refreshFavicon}
            vlibras={vlibras}
            onVlibrasChange={(enabled) => { vlibrasTouched.current = true; setVlibras(enabled); }}
          />
        )}
      </main>
      {uploadProgress && <UploadProgress progress={uploadProgress} />}
      <VLibras active={vlibras} />
    </div>
  );
}

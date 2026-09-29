import { useCallback, useEffect, useRef, useState } from 'react';
import EscolherPastaModal from './components/modals/EscolherPastaModal.jsx';
import Header from './components/layout/Header.jsx';
import LoginModal from './components/modals/LoginModal.jsx';
import NovidadesModal from './components/modals/NovidadesModal.jsx';
import ClassificarNovosModal from './components/modals/ClassificarNovosModal.jsx';
import Acervo from './components/acervo/Acervo.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import GerenciarIdentidade from './components/identidade/GerenciarIdentidade.jsx';
import Configuracoes from './components/configuracoes/Configuracoes.jsx';
import BancoNecessario from './components/banco/BancoNecessario.jsx';
import UploadProgress from './components/drive/UploadProgress.jsx';
import { getSession, logout as endSession } from './services/auth.js';
import { createPasta, deletePasta, getDatabaseStatus, getIdentidade, moveArquivo, renamePasta, saveTags, saveTerritorios } from './services/database.js';
import {
  disconnectDrive,
  getDriveStatus,
  previewDrive,
  saveDriveClassificacao,
  syncDrive,
  uploadDriveFile,
} from './services/drive.js';
import { viewFromLocation, writeViewPath } from './lib/routes.js';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState(viewFromLocation);
  const [territorios, setTerritorios] = useState([]);
  const [tags, setTags] = useState([]);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [driveReady, setDriveReady] = useState(false);
  const [driveStatus, setDriveStatus] = useState(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [driveMessage, setDriveMessage] = useState('');
  const [driveError, setDriveError] = useState('');
  const [labelsEnabled, setLabelsEnabled] = useState(false);
  const [novidades, setNovidades] = useState(null);
  const [classificarNovos, setClassificarNovos] = useState([]);
  const [classificando, setClassificando] = useState(false);
  const novidadesDispensadas = useRef(false);
  const escolherPasta = useRef(false);
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
      })
      .catch(() => {});
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

  const refreshDrive = useCallback(async ({ commit = false, announce = false } = {}) => {
    setDriveBusy(true);
    setDriveError('');
    try {
      const status = await getDriveStatus();
      setDriveStatus(status);
      if (status.connected && status.folderId) {
        const archive = commit ? await syncDrive() : await previewDrive();
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
          setNovidades({ arquivos, pastas });
        } else {
          setNovidades(null);
        }
      }
      return status;
    } catch (error) {
      setDriveError(error.message);
      return null;
    } finally {
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
          if (!connected) {
            setDriveReady(true);
            return;
          }
          loadIdentidade();
          refreshDrive();
        })
        .catch(() => {
          setLabelsEnabled(false);
          setDriveReady(true);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshDrive, loadIdentidade]);

  useEffect(() => {
    if (isAdmin && driveStatus?.connected && !driveStatus.folderId) setPickFolder(true);
  }, [isAdmin, driveStatus]);

  const drive = {
    status: driveStatus,
    busy: driveBusy,
    message: driveMessage,
    error: driveError,
    active: Boolean(driveStatus?.connected && driveStatus?.folderId),
    chooseFolder: () => setPickFolder(true),
    sync: () => refreshDrive({ commit: true, announce: true }),
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
        setDriveMessage('Drive desconectado. Os arquivos e os caminhos saíram do banco. Pastas, tags e territórios continuam.');
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
    moveFile: async (fileId, folderId) => {
      setDriveError('');
      try {
        const saved = await moveArquivo(fileId, folderId);
        setFiles(current => current.map(file => (file.id === saved.fileId ? { ...file, folderId: saved.folderId } : file)));
      } catch (error) {
        setDriveError(error.message);
      }
    },
    saveClassificacao: async (fileId, territoriosNext, tagsNext) => {
      setDriveError('');
      try {
        await saveDriveClassificacao(fileId, territoriosNext, tagsNext);
        setFiles(current => current.map(file => file.id === fileId ? { ...file, territorios: territoriosNext, tags: tagsNext } : file));
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
        const choice = choices[file.id] || { territorios: [], tags: [] };
        if (!choice.territorios.length && !choice.tags.length) continue;
        await saveDriveClassificacao(file.id, choice.territorios, choice.tags);
        saved.push({ id: file.id, ...choice });
      }
      if (saved.length) {
        const byId = new Map(saved.map(item => [item.id, item]));
        setFiles(current => current.map(file => (byId.has(file.id) ? { ...file, territorios: byId.get(file.id).territorios, tags: byId.get(file.id).tags } : file)));
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

  let activeView = currentView;
  if (!isAdmin && activeView !== 'acervo') activeView = 'acervo';
  if (!labelsEnabled && activeView !== 'configuracoes') activeView = 'acervo';
  const showGate = driveReady && !labelsEnabled && activeView !== 'configuracoes';

  return (
    <div className="h-dvh w-full bg-[#E4CFB2] flex flex-col font-sans text-[#2C1A14] overflow-hidden selection:bg-[#EAB308] selection:text-[#2C1A14]">
      <Header
        isAdmin={isAdmin}
        labelsEnabled={labelsEnabled}
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
          busy={driveBusy}
          error={driveError}
          onClose={() => {
            novidadesDispensadas.current = true;
            setNovidades(null);
          }}
          onSync={() => refreshDrive({ commit: true, announce: true })}
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
        {!driveReady && (
          <p className="p-8 font-display font-black uppercase tracking-widest text-[#2C1A14]">Carregando acervo...</p>
        )}
        {showGate && (
          <BancoNecessario
            isAdmin={isAdmin}
            error={driveError}
            onOpenSettings={() => goTo('configuracoes')}
            onLogin={() => setLoginOpen(true)}
          />
        )}
        {driveReady && labelsEnabled && activeView === 'dashboard' && <Dashboard files={files} territorios={territorios} labelsEnabled={labelsEnabled} />}
        {driveReady && labelsEnabled && activeView === 'acervo' && (
          <Acervo
            isAdmin={isAdmin}
            files={files}
            setFiles={setFiles}
            folders={folders}
            setFolders={setFolders}
            territorios={territorios}
            tags={tags}
            drive={drive}
            labelsEnabled={labelsEnabled}
          />
        )}
        {driveReady && labelsEnabled && activeView === 'categorias' && (
          <GerenciarIdentidade
            territorios={territorios}
            tags={tags}
            onTerritorios={persistTerritorios}
            onTags={persistTags}
          />
        )}
        {driveReady && activeView === 'configuracoes' && (
          <Configuracoes
            onSaved={() => refreshDrive()}
            onDatabaseChange={handleDatabaseChange}
          />
        )}
      </main>
      {uploadProgress && <UploadProgress progress={uploadProgress} />}
    </div>
  );
}

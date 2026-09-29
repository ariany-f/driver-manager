import { useCallback, useEffect, useState } from 'react';
import Header from './components/layout/Header.jsx';
import LoginModal from './components/modals/LoginModal.jsx';
import Acervo from './components/acervo/Acervo.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import GerenciarIdentidade from './components/identidade/GerenciarIdentidade.jsx';
import Configuracoes from './components/configuracoes/Configuracoes.jsx';
import { getSession, logout as endSession } from './services/auth.js';
import { createPasta, deletePasta, getDatabaseStatus, getIdentidade, moveArquivo, renamePasta, saveTags, saveTerritorios } from './services/database.js';
import {
  disconnectDrive,
  getDriveStatus,
  saveDriveClassificacao,
  syncDrive,
} from './services/drive.js';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState('acervo');
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

  const handleDatabaseChange = useCallback((connected) => {
    setLabelsEnabled(Boolean(connected));
    if (connected) loadIdentidade();
    else {
      setTerritorios([]);
      setTags([]);
    }
  }, [loadIdentidade]);

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

  const refreshDrive = useCallback(async ({ announce = false } = {}) => {
    setDriveBusy(true);
    setDriveError('');
    try {
      const status = await getDriveStatus();
      setDriveStatus(status);
      if (status.connected && status.folderId) {
        applyArchive(await syncDrive());
        if (announce) setDriveMessage('Arquivos atualizados a partir do Google Drive.');
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('drive');
    if (result) {
      const message = params.get('message');
      params.delete('drive');
      params.delete('message');
      const next = params.toString();
      window.history.replaceState({}, '', next ? `?${next}` : window.location.pathname);
      if (result === 'connected') setDriveMessage('Google Drive conectado. Os arquivos desta pasta passaram a ser o acervo.');
      if (result === 'error') setDriveError(message || 'Não foi possível conectar o Google Drive.');
    }
    const timer = window.setTimeout(() => {
      getSession().then(admin => setIsAdmin(admin)).catch(() => setIsAdmin(false));
      getDatabaseStatus()
        .then(status => {
          const connected = Boolean(status.connected);
          setLabelsEnabled(connected);
          if (connected) loadIdentidade();
        })
        .catch(() => setLabelsEnabled(false));
      refreshDrive();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshDrive, loadIdentidade]);

  const drive = {
    status: driveStatus,
    busy: driveBusy,
    message: driveMessage,
    error: driveError,
    active: Boolean(driveStatus?.connected && driveStatus?.folderId),
    sync: () => refreshDrive({ announce: true }),
    disconnect: async () => {
      setDriveBusy(true);
      setDriveError('');
      setDriveMessage('');
      try {
        await disconnectDrive();
        setFiles([]);
        setFolders([]);
        setDriveStatus(await getDriveStatus());
        setDriveMessage('Drive desconectado. Nenhum arquivo da pasta do cliente permanece na tela.');
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

  const logout = () => {
    endSession().catch(() => {}).finally(() => {
      setIsAdmin(false);
      setCurrentView('acervo');
    });
  };

  let activeView = currentView;
  if (!isAdmin && activeView !== 'acervo') activeView = 'acervo';
  if (!labelsEnabled && activeView === 'categorias') activeView = 'acervo';

  return (
    <div className="h-dvh w-full bg-[#E4CFB2] flex flex-col font-sans text-[#2C1A14] overflow-hidden selection:bg-[#EAB308] selection:text-[#2C1A14]">
      <Header
        isAdmin={isAdmin}
        labelsEnabled={labelsEnabled}
        activeView={activeView}
        onNavigate={setCurrentView}
        onLogin={() => setLoginOpen(true)}
        onLogout={logout}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => { setIsAdmin(true); setLoginOpen(false); }}
      />

      <main className="flex-1 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        {!driveReady && (
          <p className="p-8 font-display font-black uppercase tracking-widest text-[#2C1A14]">Carregando acervo...</p>
        )}
        {driveReady && activeView === 'dashboard' && <Dashboard files={files} territorios={territorios} labelsEnabled={labelsEnabled} />}
        {driveReady && activeView === 'acervo' && (
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
        {driveReady && activeView === 'categorias' && (
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
    </div>
  );
}

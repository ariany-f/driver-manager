import { useCallback, useEffect, useState } from 'react';
import Header from './components/layout/Header.jsx';
import LoginModal from './components/modals/LoginModal.jsx';
import Acervo from './components/acervo/Acervo.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import GerenciarIdentidade from './components/identidade/GerenciarIdentidade.jsx';
import Configuracoes from './components/configuracoes/Configuracoes.jsx';
import { initialFiles, initialFolders, initialTags, initialTerritorios } from './data/seed.js';
import { getSession, logout as endSession } from './services/auth.js';
import { getDatabaseStatus } from './services/database.js';
import {
  createDriveFolder,
  deleteDriveFolder,
  disconnectDrive,
  getDriveStatus,
  moveDriveFile,
  renameDriveFolder,
  saveDriveClassificacao,
  syncDrive,
  uploadDriveFile,
} from './services/drive.js';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState('acervo');
  const [territorios, setTerritorios] = useState(initialTerritorios);
  const [tags, setTags] = useState(initialTags);
  const [files, setFiles] = useState(initialFiles);
  const [folders, setFolders] = useState(initialFolders);
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
        .then(status => setLabelsEnabled(Boolean(status.connected)))
        .catch(() => setLabelsEnabled(false));
      refreshDrive();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshDrive]);

  const runDriveAction = async (action) => {
    setDriveBusy(true);
    setDriveError('');
    setDriveMessage('');
    try {
      applyArchive(await action());
    } catch (error) {
      setDriveError(error.message);
    } finally {
      setDriveBusy(false);
    }
  };

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
        setFiles(initialFiles);
        setFolders(initialFolders);
        setDriveStatus(await getDriveStatus());
        setDriveMessage('Drive desconectado. O acervo voltou aos arquivos de exemplo.');
      } catch (error) {
        setDriveError(error.message);
      } finally {
        setDriveBusy(false);
      }
    },
    upload: (selected, folderId) => runDriveAction(async () => {
      let archive = null;
      for (const file of selected) archive = await uploadDriveFile(file, folderId);
      return archive;
    }),
    saveFolder: ({ mode, name, parentId, folderId }) => runDriveAction(() => (
      mode === 'create' ? createDriveFolder(name, parentId) : renameDriveFolder(folderId, name)
    )),
    deleteFolder: (folderId) => runDriveAction(() => deleteDriveFolder(folderId)),
    moveFile: (fileId, folderId) => runDriveAction(() => moveDriveFile(fileId, folderId)),
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
        {driveReady && activeView === 'categorias' && <GerenciarIdentidade territorios={territorios} setTerritorios={setTerritorios} tags={tags} setTags={setTags} />}
        {driveReady && activeView === 'configuracoes' && (
          <Configuracoes
            onSaved={() => refreshDrive()}
            onDatabaseChange={connected => setLabelsEnabled(connected)}
          />
        )}
      </main>
    </div>
  );
}

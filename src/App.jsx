import { useState } from 'react';
import Header from './components/layout/Header.jsx';
import LoginModal from './components/modals/LoginModal.jsx';
import Acervo from './components/acervo/Acervo.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import GerenciarIdentidade from './components/identidade/GerenciarIdentidade.jsx';
import { initialFiles, initialFolders, initialTags, initialTerritorios } from './data/seed.js';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState('acervo');
  const [territorios, setTerritorios] = useState(initialTerritorios);
  const [tags, setTags] = useState(initialTags);
  const [files, setFiles] = useState(initialFiles);
  const [folders, setFolders] = useState(initialFolders);

  const activeView = !isAdmin && currentView !== 'acervo' ? 'acervo' : currentView;

  const logout = () => {
    setIsAdmin(false);
    setCurrentView('acervo');
  };

  return (
    <div className="h-dvh w-full bg-[#E4CFB2] flex flex-col font-sans text-[#2C1A14] overflow-hidden selection:bg-[#EAB308] selection:text-[#2C1A14]">
      <Header
        isAdmin={isAdmin}
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
        {activeView === 'dashboard' && <Dashboard files={files} territorios={territorios} />}
        {activeView === 'acervo' && <Acervo isAdmin={isAdmin} files={files} setFiles={setFiles} folders={folders} setFolders={setFolders} territorios={territorios} tags={tags} />}
        {activeView === 'categorias' && <GerenciarIdentidade territorios={territorios} setTerritorios={setTerritorios} tags={tags} setTags={setTags} />}
      </main>
    </div>
  );
}

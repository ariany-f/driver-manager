import { useEffect, useRef, useState } from 'react';
import { Database, Eye, EyeOff, Folder, Hand, Image as ImageIcon, Pencil, Settings } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import { getDatabaseSettings, removeFavicon, removeLogo, saveDatabaseSettings, saveFavicon, saveLogo, saveVlibras } from '../../services/database.js';
import ConfirmModal from '../modals/ConfirmModal.jsx';
import DriveBar from '../drive/DriveBar.jsx';
import EscolherPastaModal from '../modals/EscolherPastaModal.jsx';
import { getDriveSettings, saveDriveField, saveDriveFolder } from '../../services/drive.js';

const fields = [
  { key: 'GOOGLE_CLIENT_ID', label: 'Google Client ID', secret: false },
  { key: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', secret: true },
  { key: 'GOOGLE_REDIRECT_URI', label: 'URL de retorno', secret: false },
];

const emptyForm = () => ({
  ...Object.fromEntries(fields.map(field => [field.key, ''])),
  DRIVE_FOLDER_ID: '',
});

const databaseFields = [
  { key: 'DATABASE_HOST', label: 'Servidor', secret: false, placeholder: 'srv123.hstgr.io' },
  { key: 'DATABASE_PORT', label: 'Porta', secret: false, placeholder: '3306' },
  { key: 'DATABASE_NAME', label: 'Nome do banco', secret: false, placeholder: 'u123456789_acervo' },
  { key: 'DATABASE_USER', label: 'Usuário', secret: false, placeholder: 'u123456789_acervo' },
  { key: 'DATABASE_PASSWORD', label: 'Senha', secret: true, placeholder: '' },
];

const emptyDatabase = () => ({
  DATABASE_HOST: '',
  DATABASE_PORT: '3306',
  DATABASE_USER: '',
  DATABASE_PASSWORD: '',
  DATABASE_NAME: '',
});

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function measureImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(url);
      if (width <= height) reject(new Error('A logo precisa ser horizontal: mais larga do que alta.'));
      else resolve({ width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler esta imagem. Use PNG, JPEG, WEBP ou GIF.'));
    };
    image.src = url;
  });
}

const FAVICON_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon'];

export default function Configuracoes({ isAdmin, drive, onSaved, onDatabaseChange, logoUrl, onLogoChange, faviconUrl, onFaviconChange, vlibras, onVlibrasChange }) {
  const [form, setForm] = useState(emptyForm);
  const [databaseForm, setDatabaseForm] = useState(emptyDatabase);
  const [databaseState, setDatabaseState] = useState({ configured: false, connected: false, error: '', tables: [] });
  const [showSecret, setShowSecret] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [databaseOpen, setDatabaseOpen] = useState(false);
  const [pendingLogo, setPendingLogo] = useState('');
  const [logoError, setLogoError] = useState('');
  const [logoMessage, setLogoMessage] = useState('');
  const [savingLogo, setSavingLogo] = useState(false);
  const [pendingFavicon, setPendingFavicon] = useState('');
  const [faviconError, setFaviconError] = useState('');
  const [faviconMessage, setFaviconMessage] = useState('');
  const [savingFavicon, setSavingFavicon] = useState(false);
  const [savingVlibras, setSavingVlibras] = useState(false);
  const [vlibrasError, setVlibrasError] = useState('');
  const [databaseDraft, setDatabaseDraft] = useState(emptyDatabase);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [showDraft, setShowDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFolder, setSavingFolder] = useState(false);
  const [askSync, setAskSync] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingFolder, setPendingFolder] = useState(null);
  const savedFolderId = useRef('');
  const wasConnected = useRef(false);
  const [folderMessage, setFolderMessage] = useState('');
  const [folderError, setFolderError] = useState('');
  const [savingDatabase, setSavingDatabase] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [databaseMessage, setDatabaseMessage] = useState('');
  const [databaseError, setDatabaseError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      getDriveSettings(),
      getDatabaseSettings().catch(loadError => ({ error: loadError.message })),
    ])
      .then(([settings, database]) => {
        if (!active) return;
        setForm({ ...emptyForm(), ...settings });
        savedFolderId.current = String(settings.DRIVE_FOLDER_ID || '').trim();
        if (database.error && !database.DATABASE_HOST) {
          setDatabaseError(database.error);
          return;
        }
        setDatabaseForm({ ...emptyDatabase(), ...database, DATABASE_PORT: database.DATABASE_PORT || '3306' });
        setDatabaseState({
          configured: Boolean(database.configured),
          connected: Boolean(database.connected),
          error: database.error || '',
          tables: database.tables || [],
        });
        if (onDatabaseChange) onDatabaseChange(Boolean(database.connected));
      })
      .catch(loadError => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onDatabaseChange]);

  useEffect(() => {
    const connected = Boolean(drive?.status?.connected);
    if (wasConnected.current && !connected) {
      savedFolderId.current = '';
      setForm(current => ({ ...current, DRIVE_FOLDER_ID: '' }));
      setPendingFolder(null);
      setAskSync(false);
    }
    wasConnected.current = connected;
  }, [drive?.status?.connected]);

  const openEdit = (field) => {
    setEditing(field);
    setDraft(field.key === 'GOOGLE_REDIRECT_URI' && form.redirectFromApp ? '' : (form[field.key] || ''));
    setShowDraft(false);
    setError('');
    setMessage('');
  };

  const saveField = async (value) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const saved = await saveDriveField(editing.key, value);
      setForm({ ...emptyForm(), ...saved, redirectFromApp: Boolean(saved.redirectFromApp) });
      setEditing(null);
      setMessage(editing.key === 'GOOGLE_REDIRECT_URI'
        ? (value ? 'URL de retorno salva só no .env.' : 'A URL de retorno voltou a seguir o endereço desta aplicação.')
        : 'Chave salva.');
      if (onSaved) await onSaved();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmFolderChange = async () => {
    if (!pendingFolder || savingFolder) return;
    setSavingFolder(true);
    setFolderMessage('');
    setFolderError('');
    try {
      const saved = await saveDriveFolder(pendingFolder.id);
      const nextId = String(saved.folderId || '').trim();
      const changed = nextId !== savedFolderId.current;
      savedFolderId.current = nextId;
      setForm(current => ({ ...current, DRIVE_FOLDER_ID: nextId }));
      setPendingFolder(null);
      setFolderMessage('Pasta do acervo alterada.');
      if (changed && drive?.status?.connected) setAskSync(true);
      else if (onSaved) await onSaved({ statusOnly: true });
    } catch (saveError) {
      setFolderError(saveError.message);
      setPendingFolder(null);
    } finally {
      setSavingFolder(false);
    }
  };

  const handleLogoFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setLogoError('');
    setLogoMessage('');
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setLogoError('Use PNG, JPEG, WEBP ou GIF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('A imagem precisa ter no máximo 2 MB.');
      return;
    }
    try {
      await measureImage(file);
    } catch (error) {
      setPendingLogo('');
      setLogoError(error.message);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingLogo(String(reader.result || ''));
    reader.onerror = () => setLogoError('Não foi possível ler esta imagem.');
    reader.readAsDataURL(file);
  };

  const handleLogoSave = async () => {
    if (!pendingLogo) return;
    setSavingLogo(true);
    setLogoError('');
    setLogoMessage('');
    try {
      await saveLogo(pendingLogo);
      setPendingLogo('');
      setLogoMessage('Logo atualizada.');
      if (onLogoChange) await onLogoChange();
    } catch (saveError) {
      setLogoError(saveError.message);
    } finally {
      setSavingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    setSavingLogo(true);
    setLogoError('');
    setLogoMessage('');
    try {
      await removeLogo();
      setPendingLogo('');
      setLogoMessage('Logo removida. O cabeçalho voltou para Diário do Território.');
      if (onLogoChange) await onLogoChange();
    } catch (saveError) {
      setLogoError(saveError.message);
    } finally {
      setSavingLogo(false);
    }
  };

  const handleFaviconFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setFaviconError('');
    setFaviconMessage('');
    if (!file) return;
    const ico = /\.ico$/i.test(file.name);
    if (!FAVICON_TYPES.includes(file.type) && !ico) {
      setFaviconError('Use PNG, JPEG, WEBP, GIF ou ICO.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFaviconError('O favicon precisa ter no máximo 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingFavicon(String(reader.result || ''));
    reader.onerror = () => setFaviconError('Não foi possível ler este favicon.');
    reader.readAsDataURL(file);
  };

  const handleFaviconSave = async () => {
    if (!pendingFavicon) return;
    setSavingFavicon(true);
    setFaviconError('');
    setFaviconMessage('');
    try {
      await saveFavicon(pendingFavicon);
      setPendingFavicon('');
      setFaviconMessage('Favicon atualizado.');
      if (onFaviconChange) await onFaviconChange();
    } catch (saveError) {
      setFaviconError(saveError.message);
    } finally {
      setSavingFavicon(false);
    }
  };

  const handleFaviconRemove = async () => {
    setSavingFavicon(true);
    setFaviconError('');
    setFaviconMessage('');
    try {
      await removeFavicon();
      setPendingFavicon('');
      setFaviconMessage('Favicon removido. A aba voltou para o ícone atual.');
      if (onFaviconChange) await onFaviconChange();
    } catch (saveError) {
      setFaviconError(saveError.message);
    } finally {
      setSavingFavicon(false);
    }
  };

  const handleDatabaseSubmit = async (event) => {
    event.preventDefault();
    setSavingDatabase(true);
    setDatabaseMessage('');
    setDatabaseError('');
    try {
      const saved = await saveDatabaseSettings(databaseDraft);
      setDatabaseForm({ ...emptyDatabase(), ...saved, DATABASE_PORT: saved.DATABASE_PORT || '3306' });
      setDatabaseState({
        configured: Boolean(saved.configured),
        connected: Boolean(saved.connected),
        error: saved.error || '',
        tables: saved.tables || [],
      });
      if (onDatabaseChange) onDatabaseChange(Boolean(saved.connected));
      setDatabaseOpen(false);
      if (saved.connected) setDatabaseMessage('MySQL conectado. A aplicação já pode guardar a conexão do Drive, as pastas, os arquivos, as tags e os formatos.');
      else if (saved.DATABASE_HOST) setDatabaseError(saved.error || 'Os dados foram salvos no .env, mas o MySQL não conectou.');
      else setDatabaseMessage('Banco desconectado. O acervo mostra só os arquivos.');
    } catch (saveError) {
      setDatabaseError(saveError.message);
    } finally {
      setSavingDatabase(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4 md:p-8">
      <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-6 items-start [&>*]:min-w-0">
        <div className="border-b-4 border-[#2C1A14] pb-4 lg:col-span-2">
          <h1 className="text-3xl sm:text-5xl font-display font-black uppercase leading-none tracking-tighter text-[#2C1A14]">
            Configurações
          </h1>
          <p className="mt-3 font-sans font-bold text-sm text-[#2C1A14]/80">
            As chaves do Google ficam no MySQL quando o banco já tem essa conexão. Se não tiver, o servidor usa o .env. A URL de retorno segue o endereço desta aplicação e não entra no banco. Sem o MySQL, a aplicação não abre.
          </p>
        </div>

        {drive?.status?.connected && (
          <div className="lg:col-span-2">
            <DriveBar isAdmin={isAdmin} drive={drive} />
          </div>
        )}

        <section className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
            <ImageIcon size={18} strokeWidth={2.5} /> Logo
          </div>
          <p className="font-sans font-bold text-sm text-[#2C1A14]/80">
            Use uma imagem horizontal, mais larga do que alta. Sem logo, o cabeçalho continua com Diário do Território.
          </p>
          {(pendingLogo || logoUrl) && (
            <div className="inline-flex items-center bg-[#2C1A14] border-4 border-[#2C1A14] px-3 py-2">
              <img src={pendingLogo || logoUrl} alt="Prévia da logo" className="h-12 w-auto max-w-[14rem] object-contain" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <label className={`inline-flex items-center justify-center px-4 py-2 border-4 border-[#2C1A14] bg-[#EAB308] font-display font-black uppercase tracking-widest text-xs text-[#2C1A14] ${databaseState.connected ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
              Escolher imagem
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={!databaseState.connected || savingLogo} onChange={handleLogoFile} />
            </label>
            {pendingLogo && (
              <ButtonPrimary type="button" onClick={handleLogoSave} disabled={savingLogo}>
                {savingLogo ? 'Salvando…' : 'Salvar logo'}
              </ButtonPrimary>
            )}
            {logoUrl && !pendingLogo && (
              <button type="button" onClick={handleLogoRemove} disabled={savingLogo} className="px-4 py-2 border-4 border-[#2C1A14] bg-[#F4EFE6] font-display font-black uppercase tracking-widest text-xs text-[#2C1A14] disabled:opacity-50">
                Remover logo
              </button>
            )}
          </div>
          {!databaseState.connected && (
            <p className="font-sans font-bold text-sm text-[#2C1A14]/70">Conecte o MySQL para guardar a logo. Enquanto isso, o cabeçalho mostra Diário do Território.</p>
          )}
          {logoError && <p className="font-sans font-bold text-sm text-[#C13B22]">{logoError}</p>}
          {logoMessage && <p className="font-sans font-bold text-sm text-[#1E3A5F]">{logoMessage}</p>}
        </section>

        <section className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-4 lg:col-start-1">
          <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
            <ImageIcon size={18} strokeWidth={2.5} /> Favicon
          </div>
          <p className="font-sans font-bold text-sm text-[#2C1A14]/80">
            Esse ícone aparece na aba do navegador. Sem favicon, a aba continua com o ícone atual. PNG, JPEG, WEBP, GIF ou ICO.
          </p>
          {(pendingFavicon || faviconUrl) && (
            <div className="inline-flex items-center bg-[#2C1A14] border-4 border-[#2C1A14] p-2">
              <img src={pendingFavicon || faviconUrl} alt="Prévia do favicon" className="h-10 w-10 object-contain bg-white" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <label className={`inline-flex items-center justify-center px-4 py-2 border-4 border-[#2C1A14] bg-[#EAB308] font-display font-black uppercase tracking-widest text-xs text-[#2C1A14] ${databaseState.connected ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
              Escolher favicon
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,.ico,image/x-icon" className="hidden" disabled={!databaseState.connected || savingFavicon} onChange={handleFaviconFile} />
            </label>
            {pendingFavicon && (
              <ButtonPrimary type="button" onClick={handleFaviconSave} disabled={savingFavicon}>
                {savingFavicon ? 'Salvando…' : 'Salvar favicon'}
              </ButtonPrimary>
            )}
            {faviconUrl && !pendingFavicon && (
              <button type="button" onClick={handleFaviconRemove} disabled={savingFavicon} className="px-4 py-2 border-4 border-[#2C1A14] bg-[#F4EFE6] font-display font-black uppercase tracking-widest text-xs text-[#2C1A14] disabled:opacity-50">
                Remover favicon
              </button>
            )}
          </div>
          {!databaseState.connected && (
            <p className="font-sans font-bold text-sm text-[#2C1A14]/70">Conecte o MySQL para guardar o favicon. Enquanto isso, a aba mostra o ícone atual.</p>
          )}
          {faviconError && <p className="font-sans font-bold text-sm text-[#C13B22]">{faviconError}</p>}
          {faviconMessage && <p className="font-sans font-bold text-sm text-[#1E3A5F]">{faviconMessage}</p>}
        </section>

        <section className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-4 lg:col-start-1">
          <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
            <Hand size={18} strokeWidth={2.5} /> VLibras
          </div>
          <p className="font-sans font-bold text-sm text-[#2C1A14]/80">
            Traduz o conteúdo da tela para Libras. Com ele ativo, o botão aparece para quem abre o site.
          </p>
          <p className="font-sans font-bold text-sm text-[#2C1A14]">{vlibras ? 'VLibras ativo.' : 'VLibras desligado.'}</p>
          <button
            type="button"
            disabled={!databaseState.connected || savingVlibras}
            onClick={async () => {
              setSavingVlibras(true);
              setVlibrasError('');
              try {
                const saved = await saveVlibras(!vlibras);
                if (onVlibrasChange) onVlibrasChange(Boolean(saved.enabled));
              } catch (saveError) {
                setVlibrasError(saveError.message);
              } finally {
                setSavingVlibras(false);
              }
            }}
            className="min-h-11 px-4 py-2 border-4 border-[#2C1A14] bg-[#EAB308] font-display font-black uppercase tracking-widest text-xs text-[#2C1A14] disabled:opacity-50"
          >
            {savingVlibras ? 'Salvando…' : vlibras ? 'Desativar' : 'Ativar'}
          </button>
          {!databaseState.connected && (
            <p className="font-sans font-bold text-sm text-[#2C1A14]/70">Conecte o MySQL para guardar essa opção.</p>
          )}
          {vlibrasError && <p className="font-sans font-bold text-sm text-[#C13B22]">{vlibrasError}</p>}
        </section>

        <section className={`bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-5 lg:col-start-2 ${drive?.status?.connected ? 'lg:row-start-4' : 'lg:row-start-3'}`}>
          <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
            <Settings size={18} strokeWidth={2.5} /> Google Drive
          </div>

          {loading ? (
            <p className="font-display font-bold uppercase text-sm">Carregando chaves...</p>
          ) : (
            fields.map(field => (
              <div key={field.key}>
                <label htmlFor={field.key} className="block font-display font-bold text-sm uppercase tracking-wider mb-2">{field.label}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 min-w-0">
                    <input
                      id={field.key}
                      name={field.key}
                      readOnly
                      type={field.secret && !showSecret ? 'password' : 'text'}
                      autoComplete="off"
                      value={form[field.key]}
                      className="w-full border-4 border-[#2C1A14] p-3 pr-14 font-mono text-sm text-[#2C1A14] outline-none bg-[#E4CFB2] [color-scheme:light]"
                    />
                    {field.secret && (
                      <button
                        type="button"
                        onClick={() => setShowSecret(current => !current)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center text-[#2C1A14]"
                        aria-label={showSecret ? 'Ocultar segredo' : 'Mostrar segredo'}
                        aria-pressed={showSecret}
                      >
                        {showSecret ? <EyeOff size={22} strokeWidth={2.5} /> : <Eye size={22} strokeWidth={2.5} />}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(field)}
                    className="min-h-11 shrink-0 px-3 border-2 border-[#2C1A14] bg-white font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14] inline-flex items-center gap-2"
                  >
                    <Pencil size={16} strokeWidth={2.5} /> Editar
                  </button>
                </div>
                {field.key === 'GOOGLE_REDIRECT_URI' && (
                  <p className="mt-2 font-sans text-xs font-bold text-[#2C1A14]/70">
                    {form.redirectFromApp ? 'Segue o endereço desta aplicação. O banco não guarda essa URL.' : 'Há um valor próprio no .env. O banco não guarda essa URL.'}
                  </p>
                )}
              </div>
            ))
          )}

          {message && <p className="font-sans text-sm font-bold text-[#627933]">{message}</p>}
          {error && !editing && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
        </section>

        <section className={`bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-4 lg:col-start-2 ${drive?.status?.connected ? 'lg:row-start-3' : 'lg:row-start-2'}`}>
          <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
            <Folder size={18} strokeWidth={2.5} /> Pasta do acervo
          </div>
          <p className="font-sans text-sm font-bold text-[#2C1A14]/80">
            O ID vem da pasta escolhida no Drive. Para trocar, abra a lista e confirme a alteração.
          </p>
          <div>
            <label htmlFor="DRIVE_FOLDER_ID" className="block font-display font-bold text-sm uppercase tracking-wider mb-2">ID da pasta do Drive</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="DRIVE_FOLDER_ID"
                name="DRIVE_FOLDER_ID"
                readOnly
                value={form.DRIVE_FOLDER_ID}
                className="w-full min-w-0 border-4 border-[#2C1A14] p-3 font-mono text-sm text-[#2C1A14] outline-none bg-[#E4CFB2] [color-scheme:light]"
              />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={loading || savingFolder || !drive?.status?.connected}
                className="min-h-11 shrink-0 px-3 border-2 border-[#2C1A14] bg-white font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14] disabled:opacity-50"
              >
                Alterar
              </button>
            </div>
          </div>
          {!drive?.status?.connected && (
            <p className="font-sans font-bold text-sm text-[#2C1A14]/70">Conecte o Google Drive para escolher outra pasta.</p>
          )}
          {folderMessage && <p className="font-sans text-sm font-bold text-[#627933]">{folderMessage}</p>}
          {folderError && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{folderError}</p>}
        </section>

        {editing && (
          <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
            <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#1E3A5F] w-full max-w-lg p-5 space-y-4">
              <h3 className="text-2xl font-display font-black uppercase text-[#2C1A14]">Editar {editing.label}</h3>
              {editing.key === 'GOOGLE_REDIRECT_URI' && (
                <p className="font-sans text-sm font-bold text-[#2C1A14]/80">
                  Em branco, a URL volta a ser a deste endereço, com /api/drive/callback. Isso fica só no .env.
                </p>
              )}
              <div className="relative">
                <input
                  type={editing.secret && !showDraft ? 'password' : 'text'}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  autoFocus
                  className="w-full border-4 border-[#2C1A14] p-3 pr-14 font-mono text-sm text-[#2C1A14] outline-none bg-white [color-scheme:light]"
                />
                {editing.secret && (
                  <button
                    type="button"
                    onClick={() => setShowDraft(current => !current)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center text-[#2C1A14]"
                    aria-label={showDraft ? 'Ocultar segredo' : 'Mostrar segredo'}
                  >
                    {showDraft ? <EyeOff size={22} strokeWidth={2.5} /> : <Eye size={22} strokeWidth={2.5} />}
                  </button>
                )}
              </div>
              {error && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button type="button" onClick={() => setEditing(null)} disabled={saving} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] px-4 disabled:opacity-50">Cancelar</button>
                {editing.key === 'GOOGLE_REDIRECT_URI' && (
                  <button type="button" onClick={() => saveField('')} disabled={saving} className="min-h-11 px-3 border-2 border-[#2C1A14] bg-white font-display font-black uppercase text-xs disabled:opacity-50">
                    Usar o endereço da aplicação
                  </button>
                )}
                <ButtonPrimary onClick={() => saveField(draft.trim())} disabled={saving} color="bgNavy" className="w-full sm:w-auto">
                  {saving ? 'Salvando' : 'Salvar'}
                </ButtonPrimary>
              </div>
            </div>
          </div>
        )}

        <section className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-5 lg:col-start-2">
          <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
            <Database size={18} strokeWidth={2.5} /> Banco de dados
          </div>
          <p className="font-sans text-sm font-bold text-[#2C1A14]/80">
            MySQL da Hostinger. Sem este banco a aplicação não abre.
          </p>
          {databaseFields.map(field => (
            <div key={field.key}>
              <label htmlFor={`view-${field.key}`} className="block font-display font-bold text-sm uppercase tracking-wider mb-2">{field.label}</label>
              <input
                id={`view-${field.key}`}
                readOnly
                type={field.secret ? 'password' : 'text'}
                value={databaseForm[field.key]}
                className="w-full border-4 border-[#2C1A14] p-3 font-mono text-sm text-[#2C1A14] outline-none bg-[#E4CFB2] [color-scheme:light]"
              />
            </div>
          ))}
          <p className={`font-sans text-sm font-bold ${databaseState.connected ? 'text-[#627933]' : 'text-[#C13B22]'}`}>
            {databaseState.connected ? 'Banco conectado.' : 'Banco desconectado.'}
          </p>
          {databaseMessage && <p className="font-sans text-sm font-bold text-[#627933]">{databaseMessage}</p>}
          {(databaseError || databaseState.error) && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{databaseError || databaseState.error}</p>}
          <button
            type="button"
            onClick={() => {
              setDatabaseDraft(databaseForm);
              setShowDatabase(false);
              setDatabaseError('');
              setDatabaseOpen(true);
            }}
            className="font-sans text-[11px] text-[#2C1A14]/35 underline underline-offset-2 decoration-[#2C1A14]/20 hover:text-[#2C1A14]/70"
          >
            alterar conexão
          </button>
        </section>

        {databaseOpen && (
          <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
            <form onSubmit={handleDatabaseSubmit} className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#1E3A5F] w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-display font-black uppercase text-[#2C1A14]">Conexão do MySQL</h3>
              <p className="font-sans text-sm font-bold text-[#2C1A14]/80">
                Ao salvar, o servidor cria as tabelas que ainda não existem. No hPanel, libere este computador em MySQL remoto.
              </p>
              {databaseFields.map(field => (
                <div key={field.key}>
                  <label htmlFor={field.key} className="block font-display font-bold text-sm uppercase tracking-wider mb-2">{field.label}</label>
                  <div className="relative">
                    <input
                      id={field.key}
                      name={field.key}
                      type={field.secret && !showDatabase ? 'password' : 'text'}
                      autoComplete="off"
                      placeholder={field.placeholder}
                      value={databaseDraft[field.key]}
                      onChange={(event) => setDatabaseDraft(current => ({ ...current, [field.key]: event.target.value }))}
                      className="w-full border-4 border-[#2C1A14] p-3 pr-14 font-mono text-sm text-[#2C1A14] caret-[#2C1A14] outline-none bg-white [color-scheme:light]"
                    />
                    {field.secret && (
                      <button
                        type="button"
                        onClick={() => setShowDatabase(current => !current)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center text-[#2C1A14]"
                        aria-label={showDatabase ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={showDatabase}
                      >
                        {showDatabase ? <EyeOff size={22} strokeWidth={2.5} /> : <Eye size={22} strokeWidth={2.5} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {databaseError && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{databaseError}</p>}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button type="button" onClick={() => setDatabaseOpen(false)} disabled={savingDatabase} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] px-4 disabled:opacity-50">Cancelar</button>
                <ButtonPrimary type="submit" color="bgOlive" disabled={savingDatabase} className="w-full sm:w-auto">
                  {savingDatabase ? 'Conectando' : 'Salvar banco'}
                </ButtonPrimary>
              </div>
            </form>
          </div>
        )}
      </div>
      <EscolherPastaModal
        isOpen={pickerOpen}
        pickOnly
        onClose={() => setPickerOpen(false)}
        onChosen={(folder) => {
          setPickerOpen(false);
          if (folder.id !== 'root' && folder.id === savedFolderId.current) {
            setFolderMessage('Essa já é a pasta do acervo.');
            return;
          }
          setFolderMessage('');
          setFolderError('');
          setPendingFolder(folder);
          if (folder.id !== 'root') setForm(current => ({ ...current, DRIVE_FOLDER_ID: folder.id }));
        }}
      />
      <ConfirmModal
        isOpen={Boolean(pendingFolder)}
        title="Alterar a pasta?"
        text={`A pasta passa a ser ${pendingFolder?.id === 'root' ? 'Meu Drive' : pendingFolder?.name || 'a pasta escolhida'}. Vai ser preciso sincronizar de novo. A classificação de arquivos e pastas que não baterem entre o banco e os arquivos sincronizados do Drive é perdida.`}
        confirmLabel={savingFolder ? 'Alterando…' : 'Alterar pasta'}
        onCancel={() => {
          if (savingFolder) return;
          setPendingFolder(null);
          setForm(current => ({ ...current, DRIVE_FOLDER_ID: savedFolderId.current }));
        }}
        onConfirm={confirmFolderChange}
      />
      <ConfirmModal
        isOpen={askSync}
        title="Sincronizar de novo?"
        text="A pasta do acervo mudou. Sincronize para a lista passar a usar os arquivos dessa pasta."
        confirmLabel="Sincronizar"
        onCancel={() => {
          setAskSync(false);
          if (onSaved) onSaved({ statusOnly: true });
        }}
        onConfirm={() => {
          setAskSync(false);
          if (drive?.sync) drive.sync();
        }}
      />
    </div>
  );
}

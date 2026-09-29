import { useEffect, useState } from 'react';
import { Database, Eye, EyeOff, Settings } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import { getDatabaseSettings, saveDatabaseSettings } from '../../services/database.js';
import { getDriveSettings, saveDriveSettings } from '../../services/drive.js';

const fields = [
  { key: 'GOOGLE_CLIENT_ID', label: 'Google Client ID', secret: false },
  { key: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', secret: true },
  { key: 'DRIVE_FOLDER_ID', label: 'ID da pasta do Drive', secret: false },
  { key: 'GOOGLE_REDIRECT_URI', label: 'URL de retorno', secret: false },
];

const emptyForm = () => Object.fromEntries(fields.map(field => [field.key, '']));

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

export default function Configuracoes({ onSaved, onDatabaseChange }) {
  const [form, setForm] = useState(emptyForm);
  const [databaseForm, setDatabaseForm] = useState(emptyDatabase);
  const [databaseState, setDatabaseState] = useState({ configured: false, connected: false, error: '', tables: [] });
  const [showSecret, setShowSecret] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const saved = await saveDriveSettings(form);
      setForm({ ...emptyForm(), ...saved });
      setMessage('Configuração salva no .env. O Drive já usa estes valores.');
      if (onSaved) await onSaved();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDatabaseSubmit = async (event) => {
    event.preventDefault();
    setSavingDatabase(true);
    setDatabaseMessage('');
    setDatabaseError('');
    try {
      const saved = await saveDatabaseSettings(databaseForm);
      setDatabaseForm({ ...emptyDatabase(), ...saved, DATABASE_PORT: saved.DATABASE_PORT || '3306' });
      setDatabaseState({
        configured: Boolean(saved.configured),
        connected: Boolean(saved.connected),
        error: saved.error || '',
        tables: saved.tables || [],
      });
      if (onDatabaseChange) onDatabaseChange(Boolean(saved.connected));
      if (saved.connected) setDatabaseMessage('MySQL conectado. A aplicação já pode guardar a conexão do Drive, as pastas, os arquivos, as tags e os territórios.');
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
      <div className="w-full max-w-3xl space-y-6">
        <div className="border-b-4 border-[#2C1A14] pb-4">
          <h1 className="text-3xl sm:text-5xl font-display font-black uppercase leading-none tracking-tighter text-[#2C1A14]">
            Configurações
          </h1>
          <p className="mt-3 font-sans font-bold text-sm text-[#2C1A14]/80">
            As chaves do Google ficam no MySQL quando o banco já tem essa conexão. Se não tiver, o servidor usa o .env. Ao conectar, a pessoa escolhe a pasta do acervo. Sem o MySQL, a aplicação não abre.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
            <Settings size={18} strokeWidth={2.5} /> Google Drive
          </div>

          {loading ? (
            <p className="font-display font-bold uppercase text-sm">Carregando chaves...</p>
          ) : (
            fields.map(field => (
              <div key={field.key}>
                <label htmlFor={field.key} className="block font-display font-bold text-sm uppercase tracking-wider mb-2">{field.label}</label>
                <div className="relative">
                  <input
                    id={field.key}
                    name={field.key}
                    type={field.secret && !showSecret ? 'password' : 'text'}
                    autoComplete="off"
                    value={form[field.key]}
                    onChange={(event) => setForm(current => ({ ...current, [field.key]: event.target.value }))}
                    className="w-full border-4 border-[#2C1A14] p-3 pr-14 font-mono text-sm text-[#2C1A14] caret-[#2C1A14] outline-none bg-white [color-scheme:light]"
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
              </div>
            ))
          )}

          {message && <p className="font-sans text-sm font-bold text-[#627933]">{message}</p>}
          {error && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{error}</p>}

          <ButtonPrimary type="submit" color="bgNavy" disabled={loading || saving} className="w-full sm:w-auto">
            {saving ? 'Salvando' : 'Salvar'}
          </ButtonPrimary>
        </form>

        <form onSubmit={handleDatabaseSubmit} className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
            <Database size={18} strokeWidth={2.5} /> Banco de dados
          </div>
          <p className="font-sans text-sm font-bold text-[#2C1A14]/80">
            MySQL da Hostinger. Sem este banco a aplicação não abre. Ao salvar, o servidor cria as tabelas, inclusive a autorização do Google Drive. Pastas, arquivos, tags e territórios também ficam aqui. No hPanel, libere este computador em MySQL remoto.
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
                  value={databaseForm[field.key]}
                  onChange={(event) => setDatabaseForm(current => ({ ...current, [field.key]: event.target.value }))}
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
          <p className={`font-sans text-sm font-bold ${databaseState.connected ? 'text-[#627933]' : 'text-[#C13B22]'}`}>
            {databaseState.connected ? 'Banco conectado.' : 'Banco desconectado.'}
          </p>
          {databaseMessage && <p className="font-sans text-sm font-bold text-[#627933]">{databaseMessage}</p>}
          {(databaseError || databaseState.error) && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{databaseError || databaseState.error}</p>}
          <ButtonPrimary type="submit" color="bgOlive" disabled={loading || savingDatabase} className="w-full sm:w-auto">
            {savingDatabase ? 'Conectando' : 'Salvar banco'}
          </ButtonPrimary>
        </form>
      </div>
    </div>
  );
}

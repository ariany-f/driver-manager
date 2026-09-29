import { useEffect, useState } from 'react';
import { Eye, EyeOff, Settings } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import { getDriveSettings, saveDriveSettings } from '../../services/drive.js';

const fields = [
  { key: 'GOOGLE_CLIENT_ID', label: 'Google Client ID', secret: false },
  { key: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', secret: true },
  { key: 'DRIVE_FOLDER_ID', label: 'ID da pasta do Drive', secret: false },
  { key: 'GOOGLE_REDIRECT_URI', label: 'URL de retorno', secret: false },
];

const emptyForm = () => Object.fromEntries(fields.map(field => [field.key, '']));

export default function Configuracoes({ onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getDriveSettings()
      .then(settings => {
        if (!active) return;
        setForm({ ...emptyForm(), ...settings });
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
  }, []);

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

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4 md:p-8">
      <div className="w-full max-w-3xl space-y-6">
        <div className="border-b-4 border-[#2C1A14] pb-4">
          <h1 className="text-3xl sm:text-5xl font-display font-black uppercase leading-none tracking-tighter text-[#2C1A14]">
            Configurações
          </h1>
          <p className="mt-3 font-sans font-bold text-sm text-[#2C1A14]/80">
            As chaves do Google Drive ficam no arquivo .env deste computador, até existir um banco de dados.
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
      </div>
    </div>
  );
}

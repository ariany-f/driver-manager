import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { getContato, saveContato } from '../../services/database.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ContatoConfig({ enabled }) {
  const [current, setCurrent] = useState({ email: '', origem: '' });
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    getContato()
      .then(saved => {
        if (!alive) return;
        setCurrent(saved);
        setDraft(saved.origem === 'configurado' ? saved.email : '');
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [enabled]);

  const clean = draft.trim();
  const invalid = clean && !EMAIL.test(clean);
  const unchanged = clean === (current.origem === 'configurado' ? current.email : '');

  const save = async (value) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await saveContato(value);
      setCurrent(saved);
      setDraft(saved.origem === 'configurado' ? saved.email : '');
      setMessage(value ? 'E-mail de contato salvo.' : 'E-mail removido. As páginas passam a usar o da conta do Drive, se houver.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
        <Mail size={18} strokeWidth={2.5} /> E-mail de contato
      </div>
      <p className="font-sans font-bold text-sm text-[#2C1A14]/80">
        Aparece em Privacidade e Termos, em “Dúvidas sobre…”. Se ficar vazio, as páginas usam o e-mail da conta do Google Drive conectada.
      </p>
      <p className="font-sans font-bold text-sm text-[#2C1A14]">
        Mostrando agora: {current.email ? `${current.email}${current.origem === 'drive' ? ' (conta do Drive)' : ''}` : 'nenhum e-mail — as páginas pedem para falar com a equipe.'}
      </p>
      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid && !unchanged) save(clean);
        }}
      >
        <input
          type="email"
          value={draft}
          onChange={(event) => { setDraft(event.target.value); setMessage(''); setError(''); }}
          placeholder={current.origem === 'drive' ? current.email : 'contato@unifesp.br'}
          disabled={!enabled || saving}
          aria-label="E-mail de contato"
          className="flex-1 min-w-0 border-4 border-[#2C1A14] bg-white p-3 font-sans font-medium outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!enabled || saving || invalid || unchanged}
          className="min-h-11 px-4 py-2 border-4 border-[#2C1A14] bg-[#EAB308] font-display font-black uppercase tracking-widest text-xs text-[#2C1A14] disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
      {current.origem === 'configurado' && (
        <button type="button" onClick={() => save('')} disabled={saving} className="font-display font-bold uppercase text-xs text-[#2C1A14] underline underline-offset-4 decoration-2 disabled:opacity-50">
          Usar o e-mail da conta do Drive
        </button>
      )}
      {invalid && <p className="font-sans font-bold text-sm text-[#C13B22]">Esse e-mail não parece válido.</p>}
      {!enabled && <p className="font-sans font-bold text-sm text-[#2C1A14]/70">Conecte o MySQL para guardar o e-mail.</p>}
      {error && <p className="font-sans font-bold text-sm text-[#C13B22]">{error}</p>}
      {message && <p className="font-sans font-bold text-sm text-[#627933]">{message}</p>}
    </section>
  );
}

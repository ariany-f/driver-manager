import { useEffect, useState } from 'react';
import { Lock, X } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import { credentialsMatch } from '../../auth/adminLogin.js';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setEmail('');
    setPassword('');
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!credentialsMatch(email, password)) {
      setError('E-mail ou senha incorretos.');
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <form onSubmit={handleSubmit} className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_#1E3A5F] sm:shadow-[12px_12px_0px_#1E3A5F] w-full max-w-md relative p-4 sm:p-6">
        <div className="flex justify-between items-start gap-3 border-b-4 border-[#2C1A14] pb-3 mb-6">
          <h3 className="text-2xl font-display font-black text-[#2C1A14] uppercase flex items-center gap-2">
            <Lock size={26} className="text-[#1E3A5F]" strokeWidth={2.5} /> Entrar
          </h3>
          <button type="button" onClick={onClose} className="bg-white text-[#2C1A14] p-2 border-2 border-[#2C1A14] shadow-[2px_2px_0px_#2C1A14]" aria-label="Fechar login">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block font-display font-bold text-sm uppercase tracking-wider mb-2">E-mail</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-4 border-[#2C1A14] p-3 font-sans font-medium text-base outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all bg-white"
              placeholder="admin@acervo.com.br"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block font-display font-bold text-sm uppercase tracking-wider mb-2">Senha</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border-4 border-[#2C1A14] p-3 font-sans font-medium text-base outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all bg-white"
              required
            />
          </div>
          {error && <p role="alert" className="font-display font-bold uppercase text-sm text-[#C13B22]">{error}</p>}
        </div>
        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onClose} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2 w-full sm:w-auto">Cancelar</button>
          <ButtonPrimary type="submit" color="bgNavy" className="w-full sm:w-auto">Entrar</ButtonPrimary>
        </div>
      </form>
    </div>
  );
}

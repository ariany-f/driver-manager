import { Database } from 'lucide-react';

export default function BancoNecessario({ isAdmin, error, onOpenSettings, onLogin }) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
      <section className="w-full max-w-xl bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_#C13B22] p-6 sm:p-8 space-y-4">
        <p className="font-display font-black uppercase tracking-widest text-xs text-[#C13B22] inline-flex items-center gap-2">
          <Database size={18} strokeWidth={3} /> Banco MySQL
        </p>
        <h1 className="font-display font-black uppercase text-3xl sm:text-4xl leading-none">Conecte um banco para usar o acervo.</h1>
        <p className="font-sans font-bold text-[#2C1A14]">
          A aplicação só abre com o MySQL conectado. A autorização do Google Drive, as pastas, os arquivos, as tags e os formatos ficam nesse banco.
        </p>
        {error && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
        {isAdmin ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-11 px-4 border-2 border-[#2C1A14] bg-[#1E3A5F] text-white font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14]"
          >
            Abrir configurações
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="min-h-11 px-4 border-2 border-[#2C1A14] bg-[#EAB308] font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14]"
          >
            Entrar para conectar
          </button>
        )}
      </section>
    </div>
  );
}

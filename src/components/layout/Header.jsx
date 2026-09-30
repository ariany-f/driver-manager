import { Lock, Unlock } from 'lucide-react';

const views = [
  { id: 'acervo', lbl: 'Acervo' },
  { id: 'dashboard', lbl: 'Métricas' },
  { id: 'categorias', lbl: 'Classificação' },
  { id: 'configuracoes', lbl: 'Configurações' },
];

export default function Header({ isAdmin, labelsEnabled, logoUrl, activeView, onNavigate, onLogin, onLogout }) {
  return (
    <header className="bg-[#2C1A14] text-[#F4EFE6] border-b-4 border-[#C13B22] z-20 shrink-0 relative">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-2">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="cursor-pointer hover:scale-105 transition-transform shrink-0" onClick={() => onNavigate('acervo')}>
            {logoUrl ? (
              <img src={logoUrl} alt="Diário do Território" className="h-10 sm:h-12 w-auto max-w-[9.5rem] sm:max-w-[12rem] object-contain object-left" />
            ) : (
              <div className="flex flex-col leading-none -rotate-2">
                <span className="font-display font-black text-xl sm:text-2xl tracking-tighter text-[#F4EFE6]">DIÁRIO</span>
                <span className="font-display font-black text-[0.6rem] sm:text-[0.65rem] tracking-[0.2em] sm:tracking-[0.3em] text-[#EAB308]">DO TERRITÓRIO</span>
              </div>
            )}
          </div>
          {isAdmin && (
            <div className="hidden md:flex flex-wrap gap-3 border-l-4 border-white/10 pl-6">
              {views.map(view => {
                const disabled = !labelsEnabled && view.id !== 'configuracoes';
                return (
                  <button
                    key={view.id}
                    type="button"
                    disabled={disabled}
                    title={disabled ? 'Conecte o banco MySQL' : view.lbl}
                    onClick={() => { if (!disabled) onNavigate(view.id); }}
                    className={`font-display font-bold uppercase text-xs tracking-wide px-2 py-1 border-b-4 whitespace-nowrap ${disabled ? 'border-transparent text-white/25 cursor-not-allowed' : activeView === view.id ? 'border-[#EAB308] text-[#EAB308]' : 'border-transparent text-white/50 hover:text-white'}`}
                  >
                    {view.lbl}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 shrink min-w-0">
          <a
            href="/privacidade"
            onClick={(event) => { event.preventDefault(); onNavigate('privacidade'); }}
            className={`font-display font-bold uppercase text-[10px] sm:text-xs tracking-wide whitespace-nowrap ${activeView === 'privacidade' ? 'text-[#EAB308]' : 'text-white/70 hover:text-white'}`}
          >
            Privacidade
          </a>
          <a
            href="/termos"
            onClick={(event) => { event.preventDefault(); onNavigate('termos'); }}
            className={`font-display font-bold uppercase text-[10px] sm:text-xs tracking-wide whitespace-nowrap ${activeView === 'termos' ? 'text-[#EAB308]' : 'text-white/70 hover:text-white'}`}
          >
            Termos
          </a>
        <button
          onClick={isAdmin ? onLogout : onLogin}
          title={isAdmin ? 'Sair' : 'Entrar'}
          className={`flex items-center gap-2 min-h-11 px-3 py-2 font-display font-bold uppercase text-xs border-2 transition-all shrink-0 ${isAdmin ? 'bg-[#C13B22] border-[#C13B22] text-white' : 'border-[#EAB308] text-[#EAB308] hover:bg-[#EAB308] hover:text-[#2C1A14]'}`}
        >
          {isAdmin ? <Unlock size={16} strokeWidth={3} /> : <Lock size={16} strokeWidth={3} />}
          <span>{isAdmin ? 'Sair' : 'Entrar'}</span>
        </button>
        </div>
      </div>
      {isAdmin && (
        <nav className="md:hidden grid grid-cols-2 border-t-2 border-white/10">
          {views.map(view => {
            const disabled = !labelsEnabled && view.id !== 'configuracoes';
            return (
              <button
                key={view.id}
                type="button"
                disabled={disabled}
                title={disabled ? 'Conecte o banco MySQL' : view.lbl}
                onClick={() => { if (!disabled) onNavigate(view.id); }}
                className={`font-display font-bold uppercase text-[11px] tracking-widest px-2 py-3 border-b-4 ${disabled ? 'border-transparent text-white/25 cursor-not-allowed' : activeView === view.id ? 'border-[#EAB308] text-[#EAB308] bg-white/5' : 'border-transparent text-white/50'}`}
              >
                {view.lbl}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}

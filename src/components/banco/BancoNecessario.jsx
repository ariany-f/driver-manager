import { Database, Gauge, RefreshCw } from 'lucide-react';

function formatHour(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function Limited({ isAdmin, limit, limitedAt, onOpenSettings }) {
  const max = limit > 0 ? limit.toLocaleString('pt-BR') : '';
  return (
    <section className="w-full max-w-xl bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_#EAB308] p-6 sm:p-8 space-y-5">
      <p className="font-display font-black uppercase tracking-widest text-xs text-[#C13B22] inline-flex items-center gap-2">
        <Gauge size={18} strokeWidth={3} /> Banco MySQL · Muitos acessos
      </p>
      <h1 className="font-display font-black uppercase text-3xl sm:text-4xl leading-none">O banco atingiu o limite de acessos desta hora.</h1>
      <p className="font-sans font-bold text-[#2C1A14]">
        A hospedagem do MySQL permite no máximo {max ? `${max} conexões` : 'um número fixo de conexões'} por hora para o mesmo usuário. Esse limite foi ultrapassado, então ela está recusando novas conexões por enquanto.
      </p>

      <div className="bg-white border-4 border-[#2C1A14] shadow-[4px_4px_0px_#2C1A14]">
        <div className="flex items-baseline justify-between gap-3 border-b-2 border-dashed border-[#2C1A14]/30 px-4 py-3">
          <span className="font-display font-black uppercase text-xs tracking-widest text-[#2C1A14]/70">Conexões nesta hora</span>
          <span className="font-mono font-black text-lg text-[#C13B22]">{max ? `${max} / ${max}` : 'Limite atingido'}</span>
        </div>
        <div className="h-4 bg-[#C13B22] border-b-2 border-[#2C1A14]" role="img" aria-label={max ? `Limite de ${max} conexões por hora atingido` : 'Limite de conexões por hora atingido'} />
        <dl className="px-4 py-3 space-y-1.5 font-sans text-sm">
          <div className="flex gap-2">
            <dt className="font-bold text-[#2C1A14]/70 whitespace-nowrap">Bloqueado por:</dt>
            <dd className="font-bold">Excesso de acessos, não erro de senha nem banco fora do ar</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-bold text-[#2C1A14]/70">Libera:</dt>
            <dd className="font-bold">Sozinho, em até 1 hora</dd>
          </div>
          {limitedAt && (
            <div className="flex gap-2">
              <dt className="font-bold text-[#2C1A14]/70">Verificado às:</dt>
              <dd className="font-mono font-bold">{formatHour(limitedAt)}</dd>
            </div>
          )}
        </dl>
      </div>

      <p className="font-sans text-sm font-bold text-[#2C1A14]/80">
        Nada foi perdido. A autorização do Google Drive, as pastas, os arquivos, as tags, os formatos e os status continuam guardados no banco e voltam assim que a conexão for liberada.
      </p>
      {isAdmin && (
        <p className="font-sans text-sm text-[#2C1A14]/80 border-l-4 border-[#EAB308] pl-3">
          Precisa agora? Crie outro usuário para o mesmo banco no painel da hospedagem e troque usuário e senha nas configurações. O limite é por usuário, então ele começa com a cota zerada.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 px-4 border-2 border-[#2C1A14] bg-[#EAB308] font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14] inline-flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} strokeWidth={3} /> Tentar de novo
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-11 px-4 border-2 border-[#2C1A14] bg-[#1E3A5F] text-white font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14]"
          >
            Abrir configurações
          </button>
        )}
      </div>
    </section>
  );
}

export default function BancoNecessario({ isAdmin, error, limited = false, limit = 0, limitedAt, onOpenSettings, onLogin }) {
  if (limited) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
        <Limited isAdmin={isAdmin} limit={Number(limit) || 0} limitedAt={limitedAt} onOpenSettings={onOpenSettings} />
      </div>
    );
  }
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

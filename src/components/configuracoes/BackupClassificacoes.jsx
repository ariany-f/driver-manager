import { useRef, useState } from 'react';
import { AlertTriangle, Check, Download, FileUp, ShieldCheck } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import {
  compareAccounts,
  countClassified,
  downloadBackup,
  formatBackupDate,
  readBackupFile,
} from '../../lib/backupClassificacoes.js';

function AccountLine({ label, email, folder }) {
  return (
    <div className="min-w-0">
      <p className="font-display font-black uppercase text-[11px] tracking-widest text-[#2C1A14]/60">{label}</p>
      <p className="font-sans font-bold text-sm text-[#2C1A14] break-all">{email || 'Conta não identificada'}</p>
      <p className="font-sans text-xs font-bold text-[#2C1A14]/70 break-all">Pasta: {folder || 'não identificada'}</p>
    </div>
  );
}

function Verdict({ check }) {
  if (check.unknown) {
    return (
      <p className="flex items-start gap-2 border-2 border-[#2C1A14] bg-[#EAB308] p-3 font-sans text-sm font-bold text-[#2C1A14]">
        <AlertTriangle size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
        Não deu para confirmar qual conta fez o backup. Importe só se tiver certeza de que é o mesmo acervo.
      </p>
    );
  }
  if (check.sameAccount && check.sameFolder) {
    return (
      <p className="flex items-start gap-2 border-2 border-[#2C1A14] bg-[#849B55] p-3 font-sans text-sm font-bold text-[#2C1A14]">
        <ShieldCheck size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
        Mesma conta e mesma pasta. Pode importar.
      </p>
    );
  }
  return (
    <p className="flex items-start gap-2 border-2 border-[#2C1A14] bg-[#C13B22] p-3 font-sans text-sm font-bold text-white">
      <AlertTriangle size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
      {check.sameAccount
        ? 'É a mesma conta, mas outra pasta do acervo. Só recebem classificação os arquivos que existirem nas duas.'
        : 'A conta conectada agora é diferente da que fez o backup. Só recebem classificação os arquivos que essa conta também enxerga: mesmo arquivo no Drive ou mesmo nome, sem nomes repetidos.'}
    </p>
  );
}

export default function BackupClassificacoes({ drive }) {
  const inputRef = useRef(null);
  const [backup, setBackup] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resumo, setResumo] = useState(null);
  const status = drive?.status;
  const ready = Boolean(status?.connected && status?.folderId);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setError('');
    setResumo(null);
    try {
      setBackup(await readBackupFile(file));
    } catch (err) {
      setBackup(null);
      setError(err.message);
    }
  };

  const exportNow = async () => {
    setExporting(true);
    setError('');
    try {
      downloadBackup(await drive.exportBackup());
    } catch (err) {
      setError(err.message || 'Não foi possível gerar o backup.');
    } finally {
      setExporting(false);
    }
  };

  const runImport = async () => {
    setBusy(true);
    setError('');
    try {
      setResumo(await drive.importBackup(backup));
      setBackup(null);
    } catch (err) {
      setError(err.message || 'Não foi possível importar o backup.');
    } finally {
      setBusy(false);
    }
  };

  const check = backup ? compareAccounts(backup, status) : null;

  return (
    <section className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-4 sm:p-6 space-y-4 lg:col-span-2">
      <div className="flex items-center gap-2 font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">
        <FileUp size={18} strokeWidth={2.5} /> Backup de classificações
      </div>
      <p className="font-sans font-bold text-sm text-[#2C1A14]/80">
        O backup guarda formatos, tags, origem, datas do acervo, nomes ajustados, pastas e arquivos excluídos. Use para recuperar tudo depois de desconectar e conectar o Drive de novo.
      </p>
      <p className="flex items-start gap-2 font-sans text-sm font-bold text-[#2C1A14] border-l-4 border-[#EAB308] pl-3">
        A conta conectada precisa ser compatível com a que estava conectada quando o backup foi feito: a mesma conta, ou uma que enxergue os mesmos arquivos.
      </p>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <button
          type="button"
          onClick={exportNow}
          disabled={exporting}
          className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2 border-4 border-[#2C1A14] bg-white font-display font-black uppercase tracking-widest text-xs text-[#2C1A14] disabled:opacity-50"
        >
          <Download size={16} strokeWidth={3} /> {exporting ? 'Exportando…' : 'Exportar classificações (.json)'}
        </button>
        {ready && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2 border-4 border-[#2C1A14] bg-[#EAB308] font-display font-black uppercase tracking-widest text-xs text-[#2C1A14] disabled:opacity-50"
          >
            <FileUp size={16} strokeWidth={3} /> Importar backup (.json)
          </button>
        )}
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={pick} />
      </div>
      {!ready && (
        <p className="font-sans font-bold text-sm text-[#2C1A14]/70">Para importar, escolha antes a pasta do acervo.</p>
      )}

      {backup && check && (
        <div className="border-4 border-[#2C1A14] bg-white p-4 space-y-4">
          <p className="font-sans font-bold text-sm text-[#2C1A14]">
            Backup de {formatBackupDate(backup.exportadoEm) || 'data desconhecida'} · {backup.arquivos.length} arquivos, {countClassified(backup)} com algum ajuste.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AccountLine label="Conta do backup" email={backup.conta?.email} folder={backup.conta?.pastaNome} />
            <AccountLine label="Conectada agora" email={status?.account} folder={status?.folderName} />
          </div>
          <Verdict check={check} />
          <p className="font-sans text-xs font-bold text-[#2C1A14]/70">
            Os ajustes do backup substituem os destes arquivos. Formatos e tags que não existirem aqui são criados. Nada muda no Google Drive.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={() => setBackup(null)} disabled={busy} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2 disabled:opacity-50">Cancelar</button>
            <ButtonPrimary type="button" onClick={runImport} disabled={busy} color={check.sameAccount && check.sameFolder ? 'bgNavy' : 'bgRust'}>
              {busy ? 'Importando…' : check.sameAccount && check.sameFolder ? 'Importar classificações' : 'Importar mesmo assim'}
            </ButtonPrimary>
          </div>
        </div>
      )}

      {resumo && (
        <div className="border-4 border-[#2C1A14] bg-[#849B55]/30 p-4 space-y-2">
          <p className="flex items-center gap-2 font-display font-black uppercase text-sm text-[#2C1A14]">
            <Check size={18} strokeWidth={3} /> Backup importado
          </p>
          <p className="font-sans text-sm font-bold text-[#2C1A14]">
            {resumo.porId + resumo.porNome} {resumo.porId + resumo.porNome === 1 ? 'arquivo recebeu' : 'arquivos receberam'} os ajustes
            {resumo.porNome ? ` (${resumo.porNome} reconhecidos pelo nome)` : ''}.
            {resumo.formatosNovos ? ` ${resumo.formatosNovos} formatos criados.` : ''}
            {resumo.tagsNovas ? ` ${resumo.tagsNovas} tags criadas.` : ''}
            {resumo.pastasNovas ? ` ${resumo.pastasNovas} pastas recriadas.` : ''}
          </p>
          {resumo.naoEncontrados > 0 && (
            <p className="font-sans text-sm font-bold text-[#C13B22]">
              {resumo.naoEncontrados} {resumo.naoEncontrados === 1 ? 'arquivo do backup não foi encontrado' : 'arquivos do backup não foram encontrados'} nesta conta
              {resumo.exemplos?.length ? `: ${resumo.exemplos.join(', ')}${resumo.naoEncontrados > resumo.exemplos.length ? '…' : ''}` : ''}.
            </p>
          )}
          {resumo.contaBackup && resumo.contaAtual && resumo.contaBackup.toLowerCase() !== resumo.contaAtual.toLowerCase() && (
            <p className="font-sans text-xs font-bold text-[#2C1A14]/70">Backup de {resumo.contaBackup}, importado em {resumo.contaAtual}.</p>
          )}
        </div>
      )}

      {error && <p role="alert" className="font-sans font-bold text-sm text-[#C13B22]">{error}</p>}
    </section>
  );
}

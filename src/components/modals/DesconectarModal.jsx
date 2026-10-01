import { useState } from 'react';
import { AlertTriangle, Check, Download, Unplug } from 'lucide-react';
import { countClassified, downloadBackup } from '../../lib/backupClassificacoes.js';

export default function DesconectarModal({ isOpen, account, onExport, onCancel, onConfirm }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [skip, setSkip] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const close = () => {
    setSaved(null);
    setSkip(false);
    setError('');
    onCancel();
  };

  const download = async () => {
    setSaving(true);
    setError('');
    try {
      const backup = await onExport();
      downloadBackup(backup);
      setSaved({ total: backup.arquivos.length, classified: countClassified(backup) });
    } catch (err) {
      setError(err.message || 'Não foi possível gerar o backup.');
    } finally {
      setSaving(false);
    }
  };

  const ready = Boolean(saved) || skip;

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#C13B22] w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center gap-3 text-[#C13B22]">
          <AlertTriangle size={32} strokeWidth={2.5} className="shrink-0" />
          <h3 className="text-2xl font-display font-black uppercase tracking-wide">Desconectar o Drive?</h3>
        </div>

        <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-4 space-y-2">
          <p className="font-sans font-bold text-sm text-[#2C1A14]">
            Ao desconectar{account ? ` ${account}` : ''}, o acervo esquece onde cada arquivo estava, os nomes ajustados, as datas do acervo e os arquivos excluídos. Nada é apagado no Google Drive.
          </p>
          <p className="font-sans font-bold text-sm text-[#2C1A14]">
            Baixe o backup antes. Depois de conectar de novo, importe esse arquivo em <strong>Configurações › Backup de classificações</strong> para recuperar formatos, tags, status, origem, datas e pastas.
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-display font-black uppercase text-xs tracking-widest text-[#2C1A14]">1. Baixar o backup</p>
          <button
            type="button"
            onClick={download}
            disabled={saving}
            className={`w-full min-h-12 border-4 border-[#2C1A14] px-4 font-display font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_#2C1A14] inline-flex items-center justify-center gap-2 disabled:opacity-50 ${saved ? 'bg-[#849B55] text-[#2C1A14]' : 'bg-[#EAB308] text-[#2C1A14]'}`}
          >
            {saved ? <Check size={20} strokeWidth={3} /> : <Download size={20} strokeWidth={3} />}
            {saving ? 'Gerando backup…' : saved ? 'Backup baixado · baixar de novo' : 'Baixar backup (.json)'}
          </button>
          {saved && (
            <p className="font-sans text-sm font-bold text-[#2C1A14]">
              {saved.total} {saved.total === 1 ? 'arquivo' : 'arquivos'} no backup, {saved.classified} com algum ajuste. Guarde esse arquivo num lugar seguro.
            </p>
          )}
          {error && <p role="alert" className="font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
          {!saved && (
            <label className="flex items-start gap-2 font-sans text-sm font-bold text-[#2C1A14] cursor-pointer">
              <input type="checkbox" checked={skip} onChange={event => setSkip(event.target.checked)} className="mt-1 w-4 h-4 accent-[#C13B22]" />
              Quero desconectar sem backup. Sei que vou perder os ajustes deste acervo.
            </label>
          )}
        </div>

        <div className="space-y-3">
          <p className="font-display font-black uppercase text-xs tracking-widest text-[#2C1A14]">2. Desconectar</p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={close} className="min-h-11 font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2 w-full sm:w-auto">Cancelar</button>
            <button
              type="button"
              onClick={() => {
                setSaved(null);
                setSkip(false);
                onConfirm();
              }}
              disabled={!ready}
              title={ready ? '' : 'Baixe o backup ou marque que quer seguir sem ele.'}
              className="min-h-11 border-4 border-[#2C1A14] bg-[#C13B22] text-white px-4 font-display font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_#2C1A14] inline-flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
            >
              <Unplug size={18} strokeWidth={3} /> Desconectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ScrollText, X } from 'lucide-react';
import { formatArchiveDate } from '../../lib/archiveDate.js';
import { fileExtension } from '../../lib/fileExtension.js';
import { mediaLabel } from '../../lib/media.js';
import Badge from '../ui/Badge.jsx';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';
import Calendario from '../ui/Calendario.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';

function formatFileDate(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-');
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[9rem_minmax(0,1fr)] gap-1 sm:gap-4 border-b-2 border-dashed border-[#2C1A14]/20 py-3">
      <dt className="font-display font-black uppercase text-xs tracking-widest text-[#1E3A5F]">{label}</dt>
      <dd className="font-sans font-bold text-sm text-[#2C1A14] break-words">{children}</dd>
    </div>
  );
}

export default function FichaTecnica({ file, isAdmin, origens = [], territorios = [], tags = [], statusList = [], folderPath, onClose, onSaveOrigem, onSaveData }) {
  const [origem, setOrigem] = useState('');
  const [dataArquivo, setDataArquivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [error, setError] = useState('');
  const [dataError, setDataError] = useState('');
  const [dataReady, setDataReady] = useState(true);

  useEffect(() => {
    if (!file) return;
    setOrigem(file.origem || '');
    setDataArquivo(file.dataArquivo || '');
    setError('');
    setDataError('');
    setDataReady(true);
  }, [file]);

  if (!file) return null;

  const identified = fileExtension(file);
  const fileTerritorios = (file.territorios || []).map(id => territorios.find(item => item.id === id)).filter(Boolean);
  const fileTags = (file.tags || []).map(id => tags.find(item => item.id === id)).filter(Boolean);
  const date = formatArchiveDate(file.dataArquivo);
  const driveDate = formatFileDate(file.date);
  const suggestions = origens.filter(item => item !== origem);

  const saveData = async () => {
    if (!dataReady) return;
    setSavingData(true);
    setDataError('');
    try {
      await onSaveData(dataArquivo);
    } catch (err) {
      setDataError(err.message || 'Não foi possível gravar a data.');
    } finally {
      setSavingData(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSaveOrigem(origem.trim());
    } catch (err) {
      setError(err.message || 'Não foi possível gravar a origem.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[220] p-4">
      <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#1E3A5F] w-full max-w-xl max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-center gap-3 p-4 border-b-4 border-[#2C1A14] bg-[#EAB308] shrink-0">
          <h3 className="font-display font-black uppercase text-xl text-[#2C1A14] flex items-center gap-2 min-w-0">
            <ScrollText size={24} strokeWidth={2.5} /> <span className="truncate">Ficha técnica</span>
          </h3>
          <button type="button" onClick={onClose} className="bg-white p-2 border-2 border-[#2C1A14] shadow-[2px_2px_0px_#2C1A14]" aria-label="Fechar ficha técnica">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6">
          <dl>
            <Row label="Arquivo">{file.name}</Row>
            <Row label="Status">
              {statusList.find(item => item.id === file.status)
                ? <StatusBadge item={statusList.find(item => item.id === file.status)} />
                : 'Sem status'}
            </Row>
            <Row label="Mídia">
              <span>{mediaLabel(file.type)}</span>
            </Row>
            <Row label="Extensão">{identified || 'Sem extensão'}</Row>
            <Row label="Origem">{file.origem || 'Sem origem'}</Row>
            <Row label="Data">
              {isAdmin ? (
                <span className="flex flex-col gap-2">
                  <span className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <Calendario
                      id="ficha-data"
                      value={dataArquivo}
                      onChange={(next) => {
                        setDataArquivo(next);
                        setDataReady(true);
                        setDataError('');
                      }}
                      onReject={(message) => {
                        setDataReady(false);
                        setDataError(message);
                      }}
                      onPending={() => {
                        setDataReady(false);
                        setDataError('');
                      }}
                    />
                    <button
                      type="button"
                      onClick={saveData}
                      disabled={savingData || !dataReady}
                      className="min-h-11 border-2 border-[#2C1A14] bg-[#849B55] px-3 font-display font-black uppercase text-xs text-[#2C1A14] shadow-[2px_2px_0px_#2C1A14] disabled:opacity-50"
                    >
                      {savingData ? 'Salvando…' : 'Salvar data'}
                    </button>
                  </span>
                  <span className="font-sans text-xs font-bold text-[#2C1A14]/70">Dia, mês e ano, ou só mês e ano. A data do Drive fica na linha de baixo.</span>
                  {dataError && <span className="font-sans text-sm font-bold text-[#C13B22]">{dataError}</span>}
                </span>
              ) : (
                date || 'Sem data'
              )}
            </Row>
            {driveDate && <Row label="No Drive">{driveDate}</Row>}
            {file.size && <Row label="Tamanho">{file.size}</Row>}
            {folderPath && <Row label="Pasta">{folderPath}</Row>}
            {fileTerritorios.length > 0 && (
              <Row label="Formatos">
                <span className="flex flex-wrap">{fileTerritorios.map(item => <Badge key={item.id} item={item} isTerritory />)}</span>
              </Row>
            )}
            {fileTags.length > 0 && (
              <Row label="Tags">
                <span className="flex flex-wrap">{fileTags.map(item => <Badge key={item.id} item={item} />)}</span>
              </Row>
            )}
          </dl>

          {isAdmin && (
            <div className="mt-6 space-y-3 border-t-4 border-[#2C1A14] pt-4">
              <label htmlFor="ficha-origem" className="block font-display font-black uppercase text-xs tracking-widest">Origem</label>
              <input
                id="ficha-origem"
                type="text"
                value={origem}
                list="ficha-origens"
                onChange={(event) => setOrigem(event.target.value)}
                placeholder="Escreva ou escolha uma origem já usada"
                className="w-full border-4 border-[#2C1A14] bg-white p-3 font-sans font-medium outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0px_#2C1A14] transition-all"
              />
              <datalist id="ficha-origens">
                {origens.map(item => <option key={item} value={item} />)}
              </datalist>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setOrigem(item)}
                      className="border-2 border-[#2C1A14] bg-white px-3 py-1.5 font-display font-bold uppercase text-xs hover:-translate-y-0.5 hover:bg-[#EAB308]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
              {error && <p className="font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
              <ButtonPrimary onClick={save} color="bgMustard" disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Salvando…' : 'Salvar origem'}
              </ButtonPrimary>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

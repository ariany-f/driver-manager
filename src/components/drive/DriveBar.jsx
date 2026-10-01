import { useState } from 'react';
import { RefreshCw, Unplug } from 'lucide-react';
import ConfirmModal from '../modals/ConfirmModal.jsx';

export default function DriveBar({ isAdmin, drive }) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const status = drive.status;
  if (!status) return null;
  if (!isAdmin && !status.connected) return null;

  const account = status.account ? ` · ${status.account}` : '';
  const folder = status.folderName || 'pasta do acervo';

  return (
    <section className="bg-white border-4 border-[#2C1A14] shadow-[4px_4px_0px_#1E3A5F] p-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-black uppercase tracking-widest text-xs text-[#1E3A5F]">Google Drive</p>
          {status.connected && status.folderId ? (
            <p className="font-sans font-bold text-sm text-[#2C1A14] break-words">
              Sincronizado com {folder}{account}. Enviar grava no Drive, depois da confirmação. Pastas, tags e formatos ficam no MySQL.
            </p>
          ) : status.connected ? (
            <p className="font-sans font-bold text-sm text-[#2C1A14]">
              Conta autorizada{account}. Escolha a pasta do acervo.
            </p>
          ) : (
            <p className="font-sans font-bold text-sm text-[#2C1A14]">
              {status.configured
                ? 'A pasta da organização ainda não foi autorizada.'
                : 'Faltam chaves no arquivo .env para ligar o Drive.'}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex flex-col items-end gap-2 shrink-0">
            {status.connected && status.folderId ? (
              <>
                <button type="button" onClick={drive.review} disabled={drive.busy} className="min-h-11 px-3 border-2 border-[#2C1A14] bg-[#EAB308] font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14] inline-flex items-center gap-2 disabled:opacity-50">
                  <RefreshCw size={16} strokeWidth={3} /> {drive.busy ? 'Sincronizando' : 'Sincronizar'}
                </button>
                <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={drive.busy} className="min-h-11 px-3 border-2 border-[#2C1A14] bg-white font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14] inline-flex items-center gap-2 disabled:opacity-50">
                  <Unplug size={16} strokeWidth={3} /> Desconectar
                </button>
              </>
            ) : status.connected ? (
              <>
                <button type="button" onClick={drive.chooseFolder} disabled={drive.busy} className="min-h-11 px-3 border-2 border-[#2C1A14] bg-[#1E3A5F] text-white font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14] disabled:opacity-50">
                  Escolher pasta
                </button>
                <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={drive.busy} className="min-h-11 px-3 border-2 border-[#2C1A14] bg-white font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14] inline-flex items-center gap-2 disabled:opacity-50">
                  <Unplug size={16} strokeWidth={3} /> Desconectar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { window.location.href = '/api/drive/connect'; }}
                disabled={!status.configured || drive.busy}
                className="min-h-11 px-3 border-2 border-[#2C1A14] bg-[#1E3A5F] text-white font-display font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#2C1A14] disabled:opacity-50"
              >
                Conectar Google Drive
              </button>
            )}
          </div>
        )}
      </div>

      {isAdmin && !status.configured && status.missing?.length > 0 && (
        <p className="font-mono text-xs text-[#2C1A14]/80 break-all">
          Cadastre em Configurações: {status.missing.join(', ')}.
        </p>
      )}
      {/* {isAdmin && !status.connected && status.redirectUri && (
        <p className="font-mono text-[11px] text-[#2C1A14]/70 break-all">
          Cadastre esta URL de retorno no Google Cloud: {status.redirectUri}
        </p>
      )} */}
      {drive.message && <p className="font-sans text-sm font-bold text-[#627933]">{drive.message}</p>}
      {(drive.error || status.error) && <p className="font-sans text-sm font-bold text-[#C13B22]">{drive.error || status.error}</p>}
      <ConfirmModal
        isOpen={confirmDisconnect}
        title="Desconectar o Drive?"
        text="A autorização sai. No banco, os arquivos, o caminho de cada um e o ID da pasta do acervo são apagados. Pastas, tags e formatos ficam. Nada é apagado no Google Drive."
        confirmLabel="Desconectar"
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={() => {
          setConfirmDisconnect(false);
          drive.disconnect();
        }}
      />
    </section>
  );
}

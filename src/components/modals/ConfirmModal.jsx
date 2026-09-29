import { AlertTriangle } from 'lucide-react';
import ButtonPrimary from '../ui/ButtonPrimary.jsx';

export default function ConfirmModal({ isOpen, title, text, confirmLabel = 'Sim, Excluir', onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#2C1A14]/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-[#E4CFB2] border-4 border-[#2C1A14] shadow-[12px_12px_0px_#C13B22] w-full max-w-md relative p-6">
        <div className="flex items-center gap-3 mb-4 text-[#C13B22]">
          <AlertTriangle size={32} strokeWidth={2.5} />
          <h3 className="text-2xl font-display font-black uppercase tracking-wide">{title}</h3>
        </div>
        <p className="font-sans font-medium text-lg text-[#2C1A14] mb-8">{text}</p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button onClick={onCancel} className="font-display font-bold uppercase text-[#2C1A14] hover:underline underline-offset-4 px-4 py-2 w-full sm:w-auto">Cancelar</button>
          <ButtonPrimary onClick={onConfirm} color="bgRust" className="w-full sm:w-auto">{confirmLabel}</ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

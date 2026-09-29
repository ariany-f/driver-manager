export default function UploadProgress({ progress }) {
  const total = progress.total || 0;
  const percent = total ? Math.min(100, Math.round((progress.loaded / total) * 100)) : 0;
  const label = progress.saving ? 'Gravando no Drive…' : `${percent}%`;

  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-[160] w-[min(18rem,calc(100%-2rem))] bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[6px_6px_0px_#C13B22] p-3">
      <p className="font-display font-black uppercase text-xs tracking-widest text-[#C13B22]">Enviando</p>
      <p className="font-sans font-bold text-sm truncate mt-1" title={progress.name}>{progress.name}</p>
      <div className="mt-2 h-3 border-2 border-[#2C1A14] bg-white">
        <div className="h-full bg-[#C13B22] transition-[width] duration-150" style={{ width: `${progress.saving ? 100 : percent}%` }} />
      </div>
      <p className="font-mono text-[11px] mt-1 text-[#2C1A14]/80">
        {label}{progress.count > 1 ? ` · ${progress.index + 1} de ${progress.count}` : ''}
      </p>
    </div>
  );
}

export default function StatusBadge({ item, className = '' }) {
  if (!item) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 border-[#2C1A14] px-2 py-0.5 font-display text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#2C1A14] ${className}`}
      style={{ backgroundColor: item.bgColor, color: item.textColor }}
      title={`Status: ${item.name}`}
    >
      <span className="w-2 h-2 shrink-0 border border-current bg-current" aria-hidden="true" />
      {item.name}
    </span>
  );
}

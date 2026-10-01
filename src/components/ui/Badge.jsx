import { MediaGlyph } from '../../lib/mediaIcons.js';

export default function Badge({ item, isTerritory = false }) {
  if (!item) return null;
  if (!isTerritory) {
    return (
      <span
        className="pl-2 pr-2.5 py-0.5 text-[10px] sm:text-xs font-display font-bold uppercase tracking-wider bg-[#F4EFE6] text-[#2C1A14] border-2 border-l-[6px] border-[#2C1A14] mr-2 mb-2 inline-flex items-center gap-1"
        style={{ borderLeftColor: item.bgColor }}
        title={`Tag: ${item.name}`}
      >
        <span className="font-black opacity-50" aria-hidden="true">#</span>
        {item.icon && <MediaGlyph icon={item.icon} size={12} />}
        {item.name}
      </span>
    );
  }
  return (
    <span
      className="px-2.5 py-1 text-[10px] sm:text-xs font-display font-bold uppercase tracking-wider shadow-[2px_2px_0px_#2C1A14] border-2 border-[#2C1A14] mr-2 mb-2 inline-flex items-center gap-1 -rotate-1"
      style={{ backgroundColor: item.bgColor, color: item.textColor }}
      title={`Formato: ${item.name}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {item.icon && <MediaGlyph icon={item.icon} size={12} />}
      {item.name}
    </span>
  );
}

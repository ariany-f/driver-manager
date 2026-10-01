import { MediaGlyph } from '../../lib/mediaIcons.js';

const TAG_SHAPE = 'polygon(7px 0, 100% 0, 100% 100%, 7px 100%, 0 50%)';

export default function Badge({ item, isTerritory = false }) {
  if (!item) return null;
  if (!isTerritory) {
    return (
      <span className="inline-flex mr-2 mb-2 [filter:drop-shadow(2px_2px_0_#2C1A14)]" title={`Tag: ${item.name}`}>
        <span className="inline-flex p-[2px] bg-[#2C1A14]" style={{ clipPath: TAG_SHAPE }}>
          <span
            className="relative pl-5 pr-2.5 py-0.5 text-[10px] sm:text-xs font-display font-bold uppercase tracking-wider inline-flex items-center gap-1"
            style={{ clipPath: TAG_SHAPE, backgroundColor: item.bgColor, color: item.textColor }}
          >
            <span className="absolute left-[7px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F4EFE6] ring-2 ring-[#2C1A14]" aria-hidden="true" />
            <span className="font-black opacity-70" aria-hidden="true">#</span>
            {item.icon && <MediaGlyph icon={item.icon} size={12} />}
            {item.name}
          </span>
        </span>
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

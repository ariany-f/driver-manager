const bgColors = {
  bgRust: 'bg-[#C13B22]',
  bgMustard: 'bg-[#EAB308]',
  bgNavy: 'bg-[#1E3A5F]',
  bgOlive: 'bg-[#849B55]',
  bgDark: 'bg-[#2C1A14]',
};

const textColors = {
  bgRust: 'text-white',
  bgMustard: 'text-[#2C1A14]',
  bgNavy: 'text-white',
  bgOlive: 'text-[#2C1A14]',
  bgDark: 'text-[#F4EFE6]',
};

export default function ButtonPrimary({ children, onClick, className = '', icon: Icon, color = 'bgRust', disabled = false, title, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={`relative group font-display font-bold py-3 px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${textColors[color]} ${className}`}>
      <div className="absolute inset-0 border-2 border-[#2C1A14] bg-[#2C1A14] translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
      <div className={`absolute inset-0 border-2 border-[#2C1A14] ${bgColors[color]} group-active:translate-x-1 group-active:translate-y-1 transition-transform`}></div>
      <div className="relative flex items-center justify-center gap-2 z-10">
        {Icon && <Icon size={20} strokeWidth={2.5} />}
        <span className="uppercase tracking-wider whitespace-nowrap">{children}</span>
      </div>
    </button>
  );
}

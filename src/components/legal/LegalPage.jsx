export function LegalSection({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display font-black uppercase text-sm tracking-widest text-[#1E3A5F]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function LegalPage({ title, children }) {
  return (
    <article className="h-full overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-[#F4EFE6] border-4 border-[#2C1A14] shadow-[8px_8px_0px_rgba(44,26,20,0.15)] p-5 sm:p-8 space-y-6">
        <header className="border-b-4 border-[#2C1A14] pb-4">
          <p className="font-display font-black text-xs uppercase tracking-widest text-[#C13B22]">Diário do Território</p>
          <h1 className="font-display font-black text-[1.875rem] sm:text-[2.5rem] leading-[1.25] mt-2">{title}</h1>
          <p className="mt-3 font-mono text-xs font-bold text-[#2C1A14]/70">Atualizado em 30/09/2026 · Para estudantes da UNIFESP</p>
        </header>
        <div className="space-y-6 font-sans text-base leading-relaxed text-[#2C1A14]">
          {children}
        </div>
      </div>
    </article>
  );
}

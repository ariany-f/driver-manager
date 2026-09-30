import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MIN_YEAR = 1900;

function todayParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = parts.split('-').map(Number);
  return { year, month, day, iso: parts };
}

function parseIso(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day };
}

function toIso(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function shiftMonth(year, month, delta) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function buildCells(year, month) {
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    cells.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      outside: date.getMonth() !== month - 1,
    });
  }
  if (cells.slice(35).every(cell => cell.outside)) return cells.slice(0, 35);
  return cells;
}

function formatLabel(value) {
  const parsed = parseIso(value);
  if (!parsed) return '';
  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}/${parsed.year}`;
}

function NavButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="min-h-11 min-w-11 inline-flex items-center justify-center border-2 border-[#2C1A14] bg-white text-[#2C1A14] shadow-[2px_2px_0px_#2C1A14] hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
    >
      {children}
    </button>
  );
}

export default function Calendario({ value, onChange, id }) {
  const today = todayParts();
  const selected = parseIso(value);
  const maxYear = today.year + 1;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => ({
    year: selected?.year || today.year,
    month: selected?.month || today.month,
  }));

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const openCalendar = () => {
    const current = parseIso(value);
    setView({ year: current?.year || today.year, month: current?.month || today.month });
    setOpen(currentOpen => !currentOpen);
  };

  const moveMonth = (delta) => {
    setView(current => {
      const next = shiftMonth(current.year, current.month, delta);
      if (next.year < MIN_YEAR || next.year > maxYear) return current;
      return next;
    });
  };

  const moveYear = (delta) => {
    setView(current => {
      const year = current.year + delta;
      if (year < MIN_YEAR || year > maxYear) return current;
      return { ...current, year };
    });
  };

  const pick = (cell) => {
    if (cell.year < MIN_YEAR || cell.year > maxYear) return;
    onChange(toIso(cell.year, cell.month, cell.day));
    setView({ year: cell.year, month: cell.month });
    setOpen(false);
  };

  const cells = buildCells(view.year, view.month);
  const label = formatLabel(value);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openCalendar}
        className="min-h-11 w-full sm:w-auto inline-flex items-center gap-2 border-4 border-[#2C1A14] bg-white px-3 py-2 font-display font-black uppercase tracking-wide text-sm text-[#2C1A14] shadow-[3px_3px_0px_#2C1A14] hover:-translate-y-0.5"
      >
        <Calendar size={16} strokeWidth={2.5} />
        {label || 'Escolher data'}
      </button>

      {open && (
        <div role="dialog" aria-label="Calendário" className="mt-2 w-full max-w-sm border-4 border-[#2C1A14] bg-[#F4EFE6] shadow-[6px_6px_0px_#1E3A5F]">
          <div className="flex items-center justify-between gap-2 border-b-4 border-[#2C1A14] bg-[#EAB308] px-2 py-2">
            <NavButton label="Mês anterior" onClick={() => moveMonth(-1)} disabled={view.year === MIN_YEAR && view.month === 1}>
              <ChevronLeft size={18} strokeWidth={3} />
            </NavButton>
            <span className="font-display font-black uppercase tracking-wide text-[#2C1A14]">{MONTHS[view.month - 1]}</span>
            <NavButton label="Próximo mês" onClick={() => moveMonth(1)} disabled={view.year === maxYear && view.month === 12}>
              <ChevronRight size={18} strokeWidth={3} />
            </NavButton>
          </div>
          <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-[#2C1A14]/30 px-2 py-2">
            <NavButton label="Ano anterior" onClick={() => moveYear(-1)} disabled={view.year <= MIN_YEAR}>
              <ChevronLeft size={18} strokeWidth={3} />
            </NavButton>
            <span className="font-display font-black text-[#1E3A5F]">{view.year}</span>
            <NavButton label="Próximo ano" onClick={() => moveYear(1)} disabled={view.year >= maxYear}>
              <ChevronRight size={18} strokeWidth={3} />
            </NavButton>
          </div>
          <div className="grid grid-cols-7 gap-1 px-2 pt-2">
            {WEEKDAYS.map(day => (
              <span key={day} className="text-center font-display text-[10px] font-black uppercase tracking-wider text-[#2C1A14]/60">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 p-2">
            {cells.map(cell => {
              const iso = toIso(cell.year, cell.month, cell.day);
              const isSelected = value === iso;
              const isToday = today.iso === iso;
              const outOfRange = cell.year < MIN_YEAR || cell.year > maxYear;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pick(cell)}
                  disabled={outOfRange}
                  aria-pressed={isSelected}
                  aria-label={`${cell.day} de ${MONTHS[cell.month - 1]} de ${cell.year}`}
                  className={`min-h-10 border-2 border-[#2C1A14] font-display text-sm font-black disabled:opacity-30 ${isSelected ? 'bg-[#2C1A14] text-[#F4EFE6] shadow-[2px_2px_0px_#EAB308]' : isToday ? 'bg-white text-[#C13B22]' : 'bg-white text-[#2C1A14] hover:bg-[#EAB308] hover:-translate-y-0.5'} ${cell.outside ? 'opacity-40' : ''}`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 border-t-4 border-[#2C1A14] p-2">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="min-h-11 flex-1 border-2 border-[#2C1A14] bg-white font-display text-xs font-black uppercase text-[#2C1A14] shadow-[2px_2px_0px_#2C1A14] hover:-translate-y-0.5"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => pick(today)}
              className="min-h-11 flex-1 border-2 border-[#2C1A14] bg-[#849B55] font-display text-xs font-black uppercase text-[#2C1A14] shadow-[2px_2px_0px_#2C1A14] hover:-translate-y-0.5"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

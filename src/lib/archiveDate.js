export const ARCHIVE_MIN_YEAR = 1900;

export function archiveMaxYear(now = new Date()) {
  const year = Number(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).format(now));
  return year + 1;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function formatArchiveDate(value) {
  const text = String(value || '').trim();
  const full = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) return `${full[3]}/${full[2]}/${full[1]}`;
  const month = text.match(/^(\d{4})-(\d{2})$/);
  if (month) return `${month[2]}/${month[1]}`;
  return '';
}

function invalid(error) {
  return { ok: false, pending: false, iso: '', display: '', error };
}

export function parseArchiveDate(raw, now = new Date()) {
  const text = String(raw ?? '').trim();
  const maxYear = archiveMaxYear(now);
  if (!text) return { ok: true, pending: false, iso: '', display: '', error: '' };

  const isoFull = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const isoMonth = text.match(/^(\d{4})-(\d{2})$/);
  const typedFull = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  const typedMonth = text.match(/^(\d{1,2})[/\-.](\d{4})$/);

  let year;
  let month;
  let day = null;

  if (isoFull) {
    year = Number(isoFull[1]);
    month = Number(isoFull[2]);
    day = Number(isoFull[3]);
  } else if (isoMonth) {
    year = Number(isoMonth[1]);
    month = Number(isoMonth[2]);
  } else if (typedFull) {
    day = Number(typedFull[1]);
    month = Number(typedFull[2]);
    year = Number(typedFull[3]);
  } else if (typedMonth) {
    month = Number(typedMonth[1]);
    year = Number(typedMonth[2]);
  } else if (/^[\d/.\-\s]+$/.test(text) && text.length < 10) {
    return { ok: false, pending: true, iso: '', display: '', error: '' };
  } else {
    return invalid('Use dia/mês/ano ou só mês/ano. Ex.: 14/08/2025 ou 08/2025.');
  }

  if (!Number.isInteger(year) || year < ARCHIVE_MIN_YEAR || year > maxYear) {
    return invalid(`O ano precisa estar entre ${ARCHIVE_MIN_YEAR} e ${maxYear}.`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return invalid('Esse mês não existe.');
  }
  if (day != null && (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month))) {
    return invalid('Esse dia não existe nesse mês.');
  }

  const iso = day == null
    ? `${year}-${String(month).padStart(2, '0')}`
    : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { ok: true, pending: false, iso, display: formatArchiveDate(iso), error: '' };
}

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const MAX_ROWS = 500;
const MAX_COLS = 30;

export function isSpreadsheet(file) {
  const name = String(file?.name || '').toLowerCase();
  const mime = String(file?.mimeType || '');
  return /\.(xlsx|xls|xlsm)$/.test(name)
    || mime === 'application/vnd.ms-excel'
    || mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || mime === 'application/vnd.ms-excel.sheet.macroEnabled.12'
    || mime === 'application/vnd.google-apps.spreadsheet';
}

function readBook(buffer) {
  const book = XLSX.read(buffer, { type: 'array' });
  return book.SheetNames.map(name => {
    const sheet = book.Sheets[name];
    const all = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    const width = all.reduce((max, row) => Math.max(max, row.length), 0);
    return {
      name,
      rows: all.slice(0, MAX_ROWS).map(row => row.slice(0, MAX_COLS)),
      truncatedRows: all.length > MAX_ROWS,
      truncatedCols: width > MAX_COLS,
    };
  });
}

export default function SpreadsheetPreview({ file }) {
  const [sheets, setSheets] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activeRequest = true;
    setLoading(true);
    setError('');
    setActive(0);
    fetch(file.url)
      .then(response => {
        if (!response.ok) throw new Error('Não foi possível ler a planilha.');
        return response.arrayBuffer();
      })
      .then(buffer => {
        if (!activeRequest) return;
        const next = readBook(buffer);
        if (!next.length) throw new Error('A planilha não tem abas.');
        setSheets(next);
      })
      .catch(() => {
        if (activeRequest) setError('Não foi possível ler a planilha.');
      })
      .finally(() => {
        if (activeRequest) setLoading(false);
      });
    return () => {
      activeRequest = false;
    };
  }, [file.url]);

  const sheet = sheets[active];

  return (
    <div className="w-full h-full flex flex-col bg-[#F4EFE6]">
      {loading && <p className="p-6 font-display font-black uppercase text-sm">Lendo planilha...</p>}
      {error && <p role="alert" className="p-6 font-sans text-sm font-bold text-[#C13B22]">{error}</p>}
      {sheet && (
        <>
          {sheets.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3 border-b-4 border-[#2C1A14] shrink-0">
              {sheets.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`min-h-11 shrink-0 px-3 border-2 border-[#2C1A14] font-display font-bold uppercase text-xs ${index === active ? 'bg-[#EAB308]' : 'bg-white'}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
          {(sheet.truncatedRows || sheet.truncatedCols) && (
            <p className="px-4 pt-3 font-sans text-xs font-bold text-[#2C1A14]/70 shrink-0">
              Mostrando até {MAX_ROWS} linhas e {MAX_COLS} colunas.
            </p>
          )}
          <div className="flex-1 overflow-auto p-3">
            {sheet.rows.length === 0 ? (
              <p className="font-sans font-bold text-sm">Esta aba está vazia.</p>
            ) : (
              <table className="border-collapse text-sm bg-white min-w-full">
                <tbody>
                  {sheet.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className={`border border-[#2C1A14]/20 px-2 py-1 align-top whitespace-pre-wrap break-words max-w-xs ${rowIndex === 0 ? 'font-bold bg-[#E4CFB2]' : ''}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

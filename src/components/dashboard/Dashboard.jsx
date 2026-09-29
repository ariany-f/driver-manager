import { Archive, BarChart } from 'lucide-react';
import FileIcon from '../ui/FileIcon.jsx';

const parseSize = (sizeStr) => {
  if (!sizeStr) return 0;
  const [val, unit] = sizeStr.split(' ');
  const num = parseFloat(val);
  if (unit === 'GB') return num * 1024;
  if (unit === 'MB') return num;
  if (unit === 'KB') return num / 1024;
  return 0;
};

const typeLabels = {
  document: 'Documentos',
  image: 'Imagens',
  video: 'Vídeos',
  audio: 'Áudios',
};

export default function Dashboard({ files, territorios, labelsEnabled }) {
  const totalSizeMB = files.reduce((acc, file) => acc + parseSize(file.size), 0);
  const formattedSize = totalSizeMB > 1024 ? `${(totalSizeMB / 1024).toFixed(2)} GB` : `${totalSizeMB.toFixed(2)} MB`;

  const typeCounts = files.reduce((acc, file) => {
    acc[file.type] = (acc[file.type] || 0) + 1;
    return acc;
  }, {});
  const typeColors = { video: '#C13B22', image: '#EAB308', audio: '#849B55', document: '#1E3A5F' };

  const territoryCounts = files.reduce((acc, file) => {
    file.territorios.forEach(territorioId => { acc[territorioId] = (acc[territorioId] || 0) + 1; });
    return acc;
  }, {});

  const sortedTerritories = Object.entries(territoryCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([id, count]) => ({ ...territorios.find(territorio => territorio.id === id), count }))
    .filter(territorio => territorio.name);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8 animate-in fade-in duration-300">
      <div className="w-full space-y-6 sm:space-y-8">
        <div className="border-b-4 border-[#2C1A14] pb-4 sm:pb-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-[#2C1A14] uppercase leading-none tracking-tighter">Métricas do <span className="text-[#C13B22]">Acervo</span></h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#EAB308] border-4 border-[#2C1A14] p-4 sm:p-6 shadow-[4px_4px_0px_#2C1A14] sm:shadow-[8px_8px_0px_#2C1A14] flex flex-col justify-center">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <Archive size={32} className="text-[#2C1A14] shrink-0" strokeWidth={2.5} />
              <h2 className="text-xl sm:text-2xl font-display font-black uppercase">Total de Arquivos</h2>
            </div>
            <p className="text-4xl sm:text-6xl font-display font-black text-[#2C1A14]">{files.length}</p>
          </div>

          <div className="bg-[#849B55] border-4 border-[#2C1A14] p-4 sm:p-6 shadow-[4px_4px_0px_#2C1A14] sm:shadow-[8px_8px_0px_#2C1A14] flex flex-col justify-center text-[#F4EFE6]">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <BarChart size={32} className="text-[#F4EFE6] shrink-0" strokeWidth={2.5} />
              <h2 className="text-xl sm:text-2xl font-display font-black uppercase">Volume de Dados</h2>
            </div>
            <p className="text-4xl sm:text-6xl font-display font-black break-words">{formattedSize}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-6 shadow-[8px_8px_0px_rgba(44,26,20,0.15)]">
            <h3 className="text-xl font-display font-black uppercase mb-6 border-b-2 border-[#2C1A14]/20 pb-2">Arquivos por Formato</h3>
            <div className="space-y-4">
              {Object.entries(typeCounts).map(([type, count]) => {
                const percentage = Math.round((count / files.length) * 100);
                return (
                  <div key={type} className="flex items-center gap-4">
                    <div className="w-10 flex justify-center shrink-0"><FileIcon type={type} size={24} /></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-display font-bold uppercase mb-1">
                        <span>{typeLabels[type] || type}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-[#E4CFB2] border-2 border-[#2C1A14] h-4">
                        <div className="h-full border-r-2 border-[#2C1A14]" style={{ width: `${percentage}%`, backgroundColor: typeColors[type] }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#F4EFE6] border-4 border-[#2C1A14] p-6 shadow-[8px_8px_0px_rgba(44,26,20,0.15)]">
            <h3 className="text-xl font-display font-black uppercase mb-6 border-b-2 border-[#2C1A14]/20 pb-2">Territórios Mais Ativos</h3>
            {labelsEnabled ? (
              <div className="space-y-3">
                {sortedTerritories.map((territorio, index) => {
                  const maxCount = sortedTerritories[0]?.count || 1;
                  const percentage = Math.round((territorio.count / maxCount) * 100);
                  return (
                    <div key={territorio.id} className="flex items-center gap-3 group">
                      <span className="font-display font-black text-[#2C1A14]/30 w-6 text-right">{(index + 1).toString().padStart(2, '0')}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-sm font-display font-bold uppercase truncate pr-2">{territorio.name}</span>
                          <span className="text-xs font-mono font-bold">{territorio.count} arq</span>
                        </div>
                        <div className="w-full bg-[#E4CFB2] h-2">
                          <div className="h-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: territorio.bgColor }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sortedTerritories.length === 0 && <p className="text-sm font-mono text-[#2C1A14]/60">Nenhum arquivo classificado ainda.</p>}
              </div>
            ) : (
              <p className="text-sm font-mono text-[#2C1A14]/70">Desligado até o banco conectar. O acervo mostra só os arquivos.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

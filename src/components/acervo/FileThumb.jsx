import { useState } from 'react';
import FileIcon from '../ui/FileIcon.jsx';
import { Loader2 } from 'lucide-react';
import DocThumb, { isDocx } from './DocThumb.jsx';
import PdfThumb, { isPdf } from './PdfThumb.jsx';
import SheetThumb, { isSpreadsheet } from './SheetThumb.jsx';

function Badge({ file }) {
  return (
    <div className="absolute -bottom-1 -right-1 bg-white border-2 border-[#2C1A14] p-0.5">
      <FileIcon file={file} size={14} />
    </div>
  );
}

export default function FileThumb({ file, iconSize = 28, badge = false }) {
  const [loaded, setLoaded] = useState(false);

  if (file.type === 'image') {
    return (
      <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${loaded ? '' : 'bg-[#E4CFB2]/30 animate-pulse'}`}>
        {!loaded && <Loader2 className="absolute text-[#2C1A14]/10 animate-spin" size={iconSize * 1.5} />}
        {!loaded && <FileIcon file={file} className="opacity-40 relative z-0" size={iconSize} />}
        <img 
          src={file.url} 
          alt="" 
          className={`absolute inset-0 w-full h-full object-cover filter contrast-125 z-10 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} 
          onLoad={() => setLoaded(true)}
        />
        {badge && <div className="absolute -bottom-1 -right-1 z-20"><Badge file={file} /></div>}
      </div>
    );
  }
  if (isPdf(file)) return <PdfThumb file={file} iconSize={iconSize} badge={badge} />;
  if (isSpreadsheet(file)) return <SheetThumb file={file} iconSize={iconSize} badge={badge} />;
  if (isDocx(file)) return <DocThumb file={file} iconSize={iconSize} badge={badge} />;
  return (
    <div className="w-full h-full bg-[#E4CFB2]/30 flex items-center justify-center">
      <FileIcon file={file} className="opacity-40" size={iconSize} />
    </div>
  );
}

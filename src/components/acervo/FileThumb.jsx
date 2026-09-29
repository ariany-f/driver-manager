import FileIcon from '../ui/FileIcon.jsx';
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
  if (file.type === 'image') {
    return (
      <div className="relative w-full h-full">
        <img src={file.url} alt="" className="w-full h-full object-cover filter contrast-125" />
        {badge && <Badge file={file} />}
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

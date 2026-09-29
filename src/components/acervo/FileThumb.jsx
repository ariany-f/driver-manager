import FileIcon from '../ui/FileIcon.jsx';
import PdfThumb, { isPdf } from './PdfThumb.jsx';

export default function FileThumb({ file, iconSize = 28 }) {
  if (file.type === 'image') {
    return <img src={file.url} alt="" className="w-full h-full object-cover filter contrast-125" />;
  }
  if (isPdf(file)) return <PdfThumb file={file} iconSize={iconSize} />;
  return (
    <div className="w-full h-full bg-[#E4CFB2]/30 flex items-center justify-center">
      <FileIcon file={file} className="opacity-40" size={iconSize} />
    </div>
  );
}

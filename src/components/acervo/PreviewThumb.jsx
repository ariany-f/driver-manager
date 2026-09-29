import { useEffect, useRef, useState } from 'react';
import FileIcon from '../ui/FileIcon.jsx';
import { schedule } from './thumbQueue.js';

const cache = new Map();
const pending = new Map();

function loadThumb(id, render) {
  if (cache.has(id)) return Promise.resolve(cache.get(id));
  if (pending.has(id)) return pending.get(id);
  const job = schedule(render).then(image => {
    cache.set(id, image);
    pending.delete(id);
    return image;
  }).catch(error => {
    pending.delete(id);
    throw error;
  });
  pending.set(id, job);
  return job;
}

function Placeholder({ file, iconSize }) {
  return (
    <div className="w-full h-full bg-[#E4CFB2]/30 flex items-center justify-center">
      <FileIcon file={file} className="opacity-40" size={iconSize} />
    </div>
  );
}

function Badge({ file }) {
  return (
    <div className="absolute -bottom-1 -right-1 bg-white border-2 border-[#2C1A14] p-0.5">
      <FileIcon file={file} size={14} />
    </div>
  );
}

export default function PreviewThumb({ file, iconSize = 28, badge = false, render }) {
  const box = useRef(null);
  const [src, setSrc] = useState(() => cache.get(file.id) || '');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (src || failed) return undefined;
    const node = box.current;
    if (!node) return undefined;
    let alive = true;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      loadThumb(file.id, () => render(file.url))
        .then(image => {
          if (alive) setSrc(image);
        })
        .catch(() => {
          if (alive) setFailed(true);
        });
    }, { rootMargin: '160px' });
    observer.observe(node);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [failed, file.id, file.url, render, src]);

  if (failed) return <Placeholder file={file} iconSize={iconSize} />;
  if (src) {
    return (
      <div className="relative w-full h-full">
        <img src={src} alt="" className="w-full h-full object-cover object-top bg-white" />
        {badge && <Badge file={file} />}
      </div>
    );
  }
  return (
    <div ref={box} className="w-full h-full">
      <Placeholder file={file} iconSize={iconSize} />
    </div>
  );
}

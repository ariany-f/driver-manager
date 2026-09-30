import { useEffect } from 'react';

const SCRIPT = 'https://vlibras.gov.br/app/vlibras-plugin.js';

function loadScript() {
  if (window.VLibras) return Promise.resolve();
  const current = document.querySelector('script[data-vlibras]');
  if (current) {
    if (current.dataset.ready === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      current.addEventListener('load', () => resolve(), { once: true });
      current.addEventListener('error', () => reject(new Error('VLibras')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.dataset.vlibras = 'true';
    script.onload = () => {
      script.dataset.ready = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('VLibras'));
    document.body.appendChild(script);
  });
}

function setVisible(visible) {
  for (const id of ['vlibras-access-wrapper', 'vlibras-app-root']) {
    const node = document.getElementById(id);
    if (node) node.style.display = visible ? '' : 'none';
  }
}

export default function VLibras({ active }) {
  useEffect(() => {
    if (!active) {
      setVisible(false);
      const timer = window.setTimeout(() => setVisible(false), 200);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled) return;
        setVisible(true);
        window.setTimeout(() => { if (!cancelled) setVisible(true); }, 120);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [active]);

  return null;
}

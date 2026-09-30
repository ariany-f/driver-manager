import { useEffect } from 'react';

const SCRIPT = 'https://vlibras.gov.br/app/vlibras-plugin.js';
const ROOT = 'https://vlibras.gov.br/app';

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

function removeWidget() {
  document.querySelectorAll('[vw], [vw-plugin-wrapper], .vpw-box, .vp-pop-up, .vp-guide-arrow').forEach(node => node.remove());
}

export default function VLibras({ active }) {
  useEffect(() => {
    if (!active) {
      removeWidget();
      return undefined;
    }
    let cancelled = false;
    const box = document.createElement('div');
    box.setAttribute('vw', '');
    box.className = 'enabled';
    box.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(box);
    loadScript()
      .then(() => {
        if (cancelled || !window.VLibras) return;
        new window.VLibras.Widget(ROOT);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      removeWidget();
    };
  }, [active]);

  return null;
}

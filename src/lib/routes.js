const viewByPath = {
  '/': 'acervo',
  '/acervo': 'acervo',
  '/metricas': 'dashboard',
  '/identidade': 'categorias',
  '/classificacao': 'categorias',
  '/configuracoes': 'configuracoes',
};

const pathByView = {
  acervo: '/acervo',
  dashboard: '/metricas',
  categorias: '/classificacao',
  configuracoes: '/configuracoes',
};

export function viewFromLocation() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return viewByPath[path] || 'acervo';
}

export function pathForView(view) {
  return pathByView[view] || '/acervo';
}

export function writeViewPath(view, replace = false) {
  const path = pathForView(view);
  if (window.location.pathname === path) return;
  const next = `${path}${window.location.search}`;
  if (replace) window.history.replaceState({}, '', next);
  else window.history.pushState({}, '', next);
}

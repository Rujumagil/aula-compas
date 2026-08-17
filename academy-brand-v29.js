(() => {
  const VERSION = '29.0.0';
  const BRAND_NAVY = `brand/academy/logo.png?v=${VERSION}`;
  const BRAND_ICE = `brand/academy/logo-ice.png?v=${VERSION}`;
  const BRAND_FAVICON = `brand/academy/favicon.png?v=${VERSION}`;
  const BRAND_APPLE_TOUCH = `brand/academy/apple-touch.png?v=${VERSION}`;
  const MANIFEST = `manifest.json?v=${VERSION}`;

  const BRAND_IMAGE = /(?:^|\/)(?:brand\/academy\/(?:logo|logo-ice|favicon|apple-touch|icon-192|icon-512)\.png|brand\/academy\/icon\.svg|compas-academia\.svg|logo-completo-oficial\.png|logo-texto-oficial\.png|logo\.webp|icono-oficial\.png|icon-192\.png|icon-512\.png)(?:\?.*)?$/i;
  const DARK_PLACEMENT = '.sidebar,.academy-public-footer,.public-footer,.auth-story,.course-final-cta';
  const MEDIA = /(?:^|\/)(?:curso-(?:compas|historia|ia|legado|memoria|mes)|hero-lanzamiento|recurso-(?:cuentos|manual)|ruben)\.webp(?:\?.*)?$/i;
  const TEXT_REPLACEMENTS = [
    [/Proyecto Compás Evolution/g, 'Compás Evolution'],
    [/Proyecto Compás/g, 'Compás Evolution'],
    [/Academia Compás/g, 'Compás Academy'],
    [/Aula Compás/g, 'Compás Academy']
  ];

  function versionedLocalAsset(src = '') {
    const clean = String(src).replace(/^\.?\/?assets\//i, '').replace(/^\.\//, '');
    return `${clean.split('?')[0]}?v=${VERSION}`;
  }

  function normalizeText(value = '') {
    let output = String(value);
    for (const [pattern, replacement] of TEXT_REPLACEMENTS) output = output.replace(pattern, replacement);
    return output;
  }

  function isDark(img) {
    return Boolean(img.closest(DARK_PLACEMENT));
  }

  function updateImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    const src = img.getAttribute('src') || '';

    if (BRAND_IMAGE.test(src)) {
      const dark = isDark(img);
      const next = dark ? BRAND_ICE : BRAND_NAVY;
      if (src !== next) img.setAttribute('src', next);
      img.dataset.academyBrandV29 = 'official';
      img.dataset.academyOnDark = dark ? 'true' : 'false';
      img.alt = 'Compás Academy';
      return;
    }

    if (MEDIA.test(src)) {
      const next = versionedLocalAsset(src);
      if (src !== next) img.setAttribute('src', next);
      img.dataset.academyAssetV29 = VERSION;
    }
  }

  function updateTextNodes(root) {
    if (!root || !document.createTreeWalker) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest('script,style,textarea,code,pre')) return NodeFilter.FILTER_REJECT;
        return /Proyecto Compás|Academia Compás|Aula Compás/.test(node.nodeValue || '')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const next = normalizeText(node.nodeValue || '');
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function enforceWordmark(root = document) {
    const brands = root.querySelectorAll ? root.querySelectorAll('.sidebar .brand,.academy-wordmark,.course-brand-link') : [];
    brands.forEach(brand => {
      const strong = brand.querySelector('strong');
      const descriptor = brand.querySelector('small') || brand.querySelector(':scope > span > span');
      if (strong) strong.textContent = 'COMPÁS';
      if (descriptor) descriptor.textContent = 'ACADEMY';
      brand.dataset.academyWordmarkV29 = 'official';
    });
  }

  function applyAssets(root = document) {
    if (root instanceof HTMLImageElement) updateImage(root);
    const images = root.querySelectorAll ? root.querySelectorAll('img') : [];
    images.forEach(updateImage);
    updateTextNodes(root);
    enforceWordmark(root);
  }

  function applyHead() {
    document.documentElement.dataset.academyBrand = VERSION;
    const theme = document.querySelector('meta[name="theme-color"]');
    const favicon = document.querySelector('link[rel~="icon"]');
    const appleTouch = document.querySelector('link[rel="apple-touch-icon"]');
    const manifest = document.querySelector('link[rel="manifest"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');

    if (theme) theme.setAttribute('content', '#12355B');
    if (favicon) favicon.setAttribute('href', BRAND_FAVICON);
    if (appleTouch) appleTouch.setAttribute('href', BRAND_APPLE_TOUCH);
    if (manifest) manifest.setAttribute('href', MANIFEST);
    if (ogImage) ogImage.setAttribute('content', `https://aula.proyectocompas.com/brand/academy/logo.png?v=${VERSION}`);
    if (ogTitle) ogTitle.setAttribute('content', normalizeText(ogTitle.getAttribute('content') || 'Compás Academy'));
    document.title = normalizeText(document.title);
  }

  function refresh(root = document) {
    applyHead();
    applyAssets(root);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const next = normalizeText(mutation.target.nodeValue || '');
        if (next !== mutation.target.nodeValue) mutation.target.nodeValue = next;
        continue;
      }
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const next = normalizeText(node.nodeValue || '');
          if (next !== node.nodeValue) node.nodeValue = next;
          return;
        }
        if (node instanceof Element) applyAssets(node);
      });
    }
  });

  function start() {
    refresh();
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    window.addEventListener('hashchange', () => setTimeout(() => refresh(), 0));
    window.ACADEMY_BRAND_V29 = Object.freeze({
      navy: BRAND_NAVY,
      ice: BRAND_ICE,
      favicon: BRAND_FAVICON,
      appleTouch: BRAND_APPLE_TOUCH,
      manifest: MANIFEST,
      version: VERSION
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

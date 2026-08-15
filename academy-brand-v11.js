(() => {
  const ASSET_VERSION = '11.1.0';
  const BRAND_ICON = `brand/academy/logo.png?v=${ASSET_VERSION}`;
  const BRAND_FAVICON = `brand/academy/favicon.png?v=${ASSET_VERSION}`;
  const BRAND_APPLE_TOUCH = `brand/academy/apple-touch.png?v=${ASSET_VERSION}`;
  const MANIFEST = `manifest.json?v=${ASSET_VERSION}`;

  const LEGACY_BRAND = /(?:^|\/)(?:compas-academia\.svg|logo-completo-oficial\.png|logo-texto-oficial\.png|logo\.webp|icono-oficial\.png|icon-192\.png|icon-512\.png)(?:\?.*)?$/i;
  const PRIMARY_MEDIA = /(?:^|\/)(?:curso-(?:compas|historia|ia|legado|memoria|mes)|hero-lanzamiento|recurso-(?:cuentos|manual)|ruben)\.webp(?:\?.*)?$/i;

  function versionedLocalAsset(src = '') {
    const clean = String(src)
      .replace(/^\.?\/?assets\//i, '')
      .replace(/^\.\//, '');
    const path = clean.split('?')[0];
    return `${path}?v=${ASSET_VERSION}`;
  }

  function updateImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    const src = img.getAttribute('src') || '';

    if (LEGACY_BRAND.test(src)) {
      img.setAttribute('src', BRAND_ICON);
      img.dataset.academyBrandV11 = 'official';
      return;
    }

    if (PRIMARY_MEDIA.test(src)) {
      const next = versionedLocalAsset(src);
      if (src !== next) img.setAttribute('src', next);
      img.dataset.academyAssetV11 = ASSET_VERSION;
    }
  }

  function applyAssets(root = document) {
    if (root instanceof HTMLImageElement) updateImage(root);
    const images = root.querySelectorAll ? root.querySelectorAll('img') : [];
    images.forEach(updateImage);
  }

  function applyHeadAssets() {
    const favicon = document.querySelector('link[rel~="icon"]');
    const appleTouch = document.querySelector('link[rel="apple-touch-icon"]');
    const manifest = document.querySelector('link[rel="manifest"]');
    const ogImage = document.querySelector('meta[property="og:image"]');

    if (favicon) favicon.setAttribute('href', BRAND_FAVICON);
    if (appleTouch) appleTouch.setAttribute('href', BRAND_APPLE_TOUCH);
    if (manifest) manifest.setAttribute('href', MANIFEST);
    if (ogImage) ogImage.setAttribute('content', `https://aula.proyectocompas.com/brand/academy/logo.png?v=${ASSET_VERSION}`);
  }

  function refresh() {
    applyHeadAssets();
    applyAssets(document);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        applyAssets(node);
      });
    }
  });

  function start() {
    refresh();
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(refresh, 0));
    window.ACADEMY_BRAND_V11 = Object.freeze({
      icon: BRAND_ICON,
      favicon: BRAND_FAVICON,
      appleTouch: BRAND_APPLE_TOUCH,
      manifest: MANIFEST,
      version: ASSET_VERSION
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

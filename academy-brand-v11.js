(() => {
  const BRAND_ICON = 'brand/academy/logo.png?v=11.0.0';
  const LEGACY_ICON = /(?:^|\/)compas-academia\.svg(?:\?.*)?$/i;

  function applyBrand(root = document) {
    const images = root.querySelectorAll ? root.querySelectorAll('img') : [];
    images.forEach(img => {
      const src = img.getAttribute('src') || '';
      if (!LEGACY_ICON.test(src)) return;
      img.setAttribute('src', BRAND_ICON);
      img.dataset.academyBrandV11 = 'official';
    });
  }

  function refresh() {
    applyBrand(document);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.('img')) {
          const src = node.getAttribute('src') || '';
          if (LEGACY_ICON.test(src)) {
            node.setAttribute('src', BRAND_ICON);
            node.dataset.academyBrandV11 = 'official';
          }
        }
        applyBrand(node);
      });
    }
  });

  function start() {
    refresh();
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(refresh, 0));
    window.ACADEMY_BRAND_V11 = Object.freeze({ icon: BRAND_ICON });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

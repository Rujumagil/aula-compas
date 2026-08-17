(() => {
  const VERSION = '29.1.0';
  const SIDEBAR_LOGO = `brand/academy/icon-ice.svg?v=${VERSION}`;

  function fixSidebarBrand(root = document) {
    const brands = [];
    if (root instanceof Element && root.matches('.sidebar .brand')) brands.push(root);
    if (root?.querySelectorAll) brands.push(...root.querySelectorAll('.sidebar .brand'));

    brands.forEach(brand => {
      const image = brand.querySelector('img');
      const strong = brand.querySelector('strong');
      const descriptor = brand.querySelector(':scope > span > span') || brand.querySelector('small');

      if (image) {
        if (image.getAttribute('src') !== SIDEBAR_LOGO) image.setAttribute('src', SIDEBAR_LOGO);
        image.setAttribute('alt', 'Compás Academy');
        image.dataset.academyBrandV29 = 'official';
        image.dataset.academyOnDark = 'true';
        image.dataset.academyVisibilityFix = VERSION;
      }

      if (strong) strong.textContent = 'COMPÁS';
      if (descriptor) descriptor.textContent = 'ACADEMY';
      brand.dataset.academyVisibilityFix = VERSION;
    });
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node instanceof Element) fixSidebarBrand(node);
      });
    }
  });

  function start() {
    fixSidebarBrand();
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(() => fixSidebarBrand(), 0));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

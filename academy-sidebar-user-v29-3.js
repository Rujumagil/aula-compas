(() => {
  const VERSION = '29.3.0';
  const FALLBACK_ASSET = /(?:icono-oficial|brand\/academy\/(?:icon|icon-ice|logo)|logo-completo-oficial|logo-texto-oficial|compas-academia|icon-192|icon-512)/i;

  function initialsFromName(value = '') {
    const parts = String(value).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  function ensureFallback(card, image, name) {
    let fallback = card.querySelector('.user-mini-avatar-fallback');
    if (!fallback) {
      fallback = document.createElement('span');
      fallback.className = 'user-mini-avatar-fallback';
      fallback.setAttribute('aria-hidden', 'true');
      image?.insertAdjacentElement('afterend', fallback);
    }
    fallback.textContent = initialsFromName(name);
    fallback.hidden = false;
    if (image) image.dataset.academyAvatarFallback = 'true';
  }

  function useRealAvatar(card, image) {
    card.querySelector('.user-mini-avatar-fallback')?.setAttribute('hidden', '');
    if (image) delete image.dataset.academyAvatarFallback;
  }

  function fixUserCard(card) {
    if (!(card instanceof Element)) return;
    const image = card.querySelector(':scope > img');
    const nameNode = card.querySelector(':scope > span > strong');
    const roleNode = card.querySelector(':scope > span > span');
    const name = nameNode?.textContent?.trim() || 'Usuario';
    const role = roleNode?.textContent?.trim() || '';
    const src = image?.getAttribute('src') || '';

    card.dataset.academyUserCard = VERSION;
    if (role) card.dataset.role = role;
    card.setAttribute('aria-label', role ? `${name}, ${role}` : name);

    const isFallback = !src || FALLBACK_ASSET.test(src) || image?.dataset.fallbackApplied === 'true';
    if (isFallback) ensureFallback(card, image, name);
    else useRealAvatar(card, image);

    if (image && !image.dataset.academyAvatarListener) {
      image.dataset.academyAvatarListener = VERSION;
      image.addEventListener('error', () => ensureFallback(card, image, nameNode?.textContent || name));
      image.addEventListener('load', () => {
        const current = image.getAttribute('src') || '';
        if (!FALLBACK_ASSET.test(current) && image.naturalWidth > 0) useRealAvatar(card, image);
      });
    }
  }

  function scan(root = document) {
    if (root instanceof Element && root.matches('.sidebar .user-mini')) fixUserCard(root);
    root.querySelectorAll?.('.sidebar .user-mini').forEach(fixUserCard);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node instanceof Element) scan(node);
      });
      if (mutation.type === 'characterData') scan(mutation.target.parentElement?.closest('.sidebar .user-mini') || document);
    }
  });

  function start() {
    scan();
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    window.addEventListener('hashchange', () => setTimeout(scan, 0));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

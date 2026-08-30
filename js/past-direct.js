(() => {
  'use strict';

  function requestedPastId() {
    return (new URLSearchParams(location.search).get('id') || '').trim();
  }

  function openTarget(id) {
    const card = document.getElementById(id);
    if (!card) return false;
    const header = card.querySelector('[data-action="toggle"]');
    if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
    requestAnimationFrame(() => card.scrollIntoView({ behavior:'smooth', block:'start' }));
    return true;
  }

  function init() {
    const id = requestedPastId();
    if (!id) return;
    const list = document.getElementById('past-list');
    if (!list) return;
    if (openTarget(id)) return;
    const observer = new MutationObserver(() => {
      if (openTarget(id)) observer.disconnect();
    });
    observer.observe(list, { childList:true, subtree:true });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
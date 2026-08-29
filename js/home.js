(() => {
  'use strict';
  const DOMAIN_CONFIGS = [
    { id:'security', manifest:'security-terms-manifest.json', storage:'security-terms-checked' },
    { id:'network', manifest:'network-terms-manifest.json', storage:'network-terms-checked' },
    { id:'database', manifest:'database-terms-manifest.json', storage:'database-terms-checked' }
  ];

  function safeStoredCount(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? new Set(value).size : 0;
    } catch { return 0; }
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function manifestCount(data) {
    const direct = Number(data?.meta?.totalTerms);
    if (Number.isFinite(direct) && direct >= 0) return direct;
    return Array.isArray(data?.files) ? data.files.reduce((sum,item) => sum + Number(item.count || 0), 0) : 0;
  }

  async function updateDomain(domain) {
    const termEl = document.getElementById(`${domain.id}-terms`);
    const barEl = document.getElementById(`${domain.id}-bar`);
    try {
      const manifest = await fetchJson(domain.manifest);
      const total = manifestCount(manifest);
      const checked = Math.min(safeStoredCount(domain.storage), total);
      if (termEl) termEl.textContent = `${checked} / ${total} 語`;
      if (barEl) barEl.style.width = total ? `${Math.round(checked / total * 100)}%` : '0%';
      return checked;
    } catch (error) {
      console.warn('[home] manifest load failed', error);
      if (termEl) termEl.textContent = '件数を取得できません';
      return 0;
    }
  }

  async function updatePastCount() {
    const el = document.getElementById('security-past-count');
    try {
      const data = await fetchJson('security-past-index.json');
      const count = Array.isArray(data.files) ? data.files.reduce((sum,item) => sum + Number(item.count || 0), 0) : 0;
      if (el) el.textContent = `${count} 問`;
    } catch (error) {
      console.warn('[home] past index load failed', error);
      if (el) el.textContent = '件数を取得できません';
    }
  }

  async function init() {
    const unitCards = [...document.querySelectorAll('[data-study-unit]')];
    const readyCards = unitCards.filter(card => card.classList.contains('is-ready'));
    document.getElementById('total-units').textContent = unitCards.length;
    document.getElementById('ready-units').textContent = readyCards.length;
    const checked = await Promise.all(DOMAIN_CONFIGS.map(updateDomain));
    document.getElementById('total-checked').textContent = checked.reduce((sum,n) => sum + n, 0);
    await updatePastCount();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

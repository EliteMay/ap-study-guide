(() => {
  'use strict';

  const DOMAIN_CONFIGS = [
    { id:'security', label:'情報セキュリティ', shortLabel:'セキュリティ', manifest:'security-terms-manifest.json', storage:'security-terms-checked', href:'html/security.html' },
    { id:'network', label:'ネットワーク', shortLabel:'ネットワーク', manifest:'network-terms-manifest.json', storage:'network-terms-checked', href:'html/network.html' },
    { id:'database', label:'データベース', shortLabel:'DB', manifest:'database-terms-manifest.json', storage:'database-terms-checked', href:'html/database.html' }
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

  function getRecent() {
    if (window.APStudyUI?.getRecent) return window.APStudyUI.getRecent();
    try {
      const value = JSON.parse(localStorage.getItem('ap-study-recent-v1') || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  function getBookmarks() {
    if (window.APStudyUI?.getBookmarks) return window.APStudyUI.getBookmarks();
    try {
      const value = JSON.parse(localStorage.getItem('ap-study-bookmarks-v1') || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  function domainConfig(id) {
    return DOMAIN_CONFIGS.find(item => item.id === id) || null;
  }

  function renderRecentList(recent) {
    const root = document.getElementById('recent-terms');
    if (!root) return;
    root.replaceChildren();

    if (!recent.length) {
      const empty = document.createElement('span');
      empty.className = 'dashboard-empty';
      empty.textContent = 'まだ履歴がありません。';
      root.appendChild(empty);
      return;
    }

    recent.slice(0, 5).forEach(item => {
      if (!item?.term || !item?.href) return;
      const link = document.createElement('a');
      link.className = 'recent-term-link';
      link.href = item.href;

      const title = document.createElement('strong');
      title.textContent = item.term;
      const meta = document.createElement('span');
      meta.textContent = [item.subject, item.category].filter(Boolean).join(' / ');

      link.append(title, meta);
      root.appendChild(link);
    });
  }

  function renderBookmarkSummary(bookmarks) {
    const total = bookmarks.length;
    const heroCount = document.getElementById('review-count');
    const cardCount = document.getElementById('bookmark-count');
    const breakdown = document.getElementById('bookmark-breakdown');
    if (heroCount) heroCount.textContent = String(total);
    if (cardCount) cardCount.textContent = String(total);

    if (!breakdown) return;
    if (!total) {
      breakdown.textContent = '用語カードの「☆ 復習」から追加できます。';
      return;
    }

    const counts = new Map(DOMAIN_CONFIGS.map(item => [item.id, 0]));
    bookmarks.forEach(item => {
      if (counts.has(item?.domain)) counts.set(item.domain, counts.get(item.domain) + 1);
    });
    breakdown.textContent = DOMAIN_CONFIGS
      .map(item => `${item.shortLabel} ${counts.get(item.id) || 0}`)
      .join(' / ');
  }

  function renderContinue(recent) {
    const latest = recent.find(item => item?.term && item?.href);
    const title = document.getElementById('continue-title');
    const meta = document.getElementById('continue-meta');
    const link = document.getElementById('continue-link');
    const hero = document.getElementById('continue-hero');

    if (!latest) {
      if (title) title.textContent = '最初の単元を選ぶ';
      if (meta) meta.textContent = 'まだ学習履歴がありません。';
      if (link) {
        link.href = 'html/security.html';
        link.textContent = '情報セキュリティから始める →';
      }
      if (hero) {
        hero.href = 'html/security.html';
        hero.textContent = '学習を始める';
      }
      return;
    }

    const config = domainConfig(latest.domain);
    if (title) title.textContent = latest.term;
    if (meta) meta.textContent = `${latest.subject || config?.label || '学習'}${latest.category ? ` / ${latest.category}` : ''}`;
    if (link) {
      link.href = latest.href;
      link.textContent = 'この用語の続きから →';
    }
    if (hero) {
      hero.href = latest.href;
      hero.textContent = '続きから学ぶ';
    }
  }

  function renderPersonalDashboard() {
    const recent = getRecent();
    const bookmarks = getBookmarks();
    renderContinue(recent);
    renderRecentList(recent);
    renderBookmarkSummary(bookmarks);
  }

  async function init() {
    const unitCards = [...document.querySelectorAll('[data-study-unit]')];
    const readyCards = unitCards.filter(card => card.classList.contains('is-ready'));
    const totalUnits = document.getElementById('total-units');
    const readyUnits = document.getElementById('ready-units');
    if (totalUnits) totalUnits.textContent = String(unitCards.length);
    if (readyUnits) readyUnits.textContent = String(readyCards.length);

    renderPersonalDashboard();

    const checked = await Promise.all(DOMAIN_CONFIGS.map(updateDomain));
    const checkedEl = document.getElementById('total-checked');
    if (checkedEl) checkedEl.textContent = String(checked.reduce((sum,n) => sum + n, 0));
    await updatePastCount();
  }

  window.addEventListener('ap-bookmarks-changed', renderPersonalDashboard);
  window.addEventListener('storage', event => {
    if (event.key === 'ap-study-bookmarks-v1' || event.key === 'ap-study-recent-v1') renderPersonalDashboard();
  });
  document.addEventListener('DOMContentLoaded', init);
})();

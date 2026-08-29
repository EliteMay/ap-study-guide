(() => {
  'use strict';

  const DOMAIN_CONFIGS = [
    { id:'security', label:'情報セキュリティ', shortLabel:'セキュリティ', manifest:'security-terms-manifest.json', storage:'security-terms-checked', href:'html/security.html' },
    { id:'network', label:'ネットワーク', shortLabel:'ネットワーク', manifest:'network-terms-manifest.json', storage:'network-terms-checked', href:'html/network.html' },
    { id:'database', label:'データベース', shortLabel:'DB', manifest:'database-terms-manifest.json', storage:'database-terms-checked', href:'html/database.html' },
    { id:'algorithm', label:'アルゴリズム', shortLabel:'アルゴリズム', manifest:'algorithm-terms-manifest.json', storage:'algorithm-terms-checked', href:'html/algorithm.html' },
    { id:'system', label:'システム開発', shortLabel:'システム', manifest:'system-terms-manifest.json', storage:'system-terms-checked', href:'html/system.html' },
    { id:'management', label:'プロジェクト管理', shortLabel:'管理', manifest:'management-terms-manifest.json', storage:'management-terms-checked', href:'html/management.html' }
  ];
  const TEST_HISTORY_KEY = 'ap-study-test-history-v1';

  function readArray(key) {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }

  function safeStoredCount(key) { return new Set(readArray(key)).size; }

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
      return { checked, total };
    } catch (error) {
      console.warn('[home] manifest load failed', domain.id, error);
      if (termEl) termEl.textContent = '件数を取得できません';
      return { checked:0, total:0 };
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
    return readArray('ap-study-recent-v1');
  }

  function getBookmarks() {
    if (window.APStudyUI?.getBookmarks) return window.APStudyUI.getBookmarks();
    return readArray('ap-study-bookmarks-v1');
  }

  function domainConfig(id) { return DOMAIN_CONFIGS.find(item => item.id === id) || null; }

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
    document.getElementById('review-count')?.replaceChildren(document.createTextNode(String(total)));
    document.getElementById('bookmark-count')?.replaceChildren(document.createTextNode(String(total)));
    const breakdown = document.getElementById('bookmark-breakdown');
    if (!breakdown) return;
    if (!total) {
      breakdown.textContent = '用語カードの「☆ 復習」から追加できます。';
      return;
    }
    const counts = new Map(DOMAIN_CONFIGS.map(item => [item.id, 0]));
    bookmarks.forEach(item => { if (counts.has(item?.domain)) counts.set(item.domain, counts.get(item.domain) + 1); });
    breakdown.textContent = DOMAIN_CONFIGS.filter(item => counts.get(item.id)).map(item => `${item.shortLabel} ${counts.get(item.id)}`).join(' / ');
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
      if (link) { link.href = 'html/security.html'; link.textContent = '情報セキュリティから始める →'; }
      if (hero) { hero.href = 'html/security.html'; hero.textContent = '学習を始める'; }
      return;
    }
    const config = domainConfig(latest.domain);
    if (title) title.textContent = latest.term;
    if (meta) meta.textContent = `${latest.subject || config?.label || '学習'}${latest.category ? ` / ${latest.category}` : ''}`;
    if (link) { link.href = latest.href; link.textContent = 'この用語の続きから →'; }
    if (hero) { hero.href = latest.href; hero.textContent = '続きから学ぶ'; }
  }

  function renderTestHistory() {
    const root = document.getElementById('recent-test-result');
    if (!root) return;
    const latest = readArray(TEST_HISTORY_KEY)[0];
    if (!latest) {
      root.innerHTML = '<strong>まだテスト履歴がありません</strong><span>ランダムテストを1回終えると、ここに直近結果が表示されます。</span>';
      return;
    }
    const date = new Date(latest.at || Date.now());
    const source = latest.sourceLabel || 'ランダム';
    root.innerHTML = `<strong>${Number(latest.percent || 0)}% · ${Number(latest.score || 0)} / ${Number(latest.total || 0)} 問</strong><span>${source} · ${date.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>`;
  }

  function renderPersonalDashboard() {
    const recent = getRecent();
    renderContinue(recent);
    renderRecentList(recent);
    renderBookmarkSummary(getBookmarks());
    renderTestHistory();
  }

  async function init() {
    const unitCards = [...document.querySelectorAll('[data-study-unit]')];
    const readyCards = unitCards.filter(card => card.classList.contains('is-ready'));
    if (document.getElementById('total-units')) document.getElementById('total-units').textContent = String(unitCards.length);
    if (document.getElementById('ready-units')) document.getElementById('ready-units').textContent = String(readyCards.length);
    renderPersonalDashboard();
    const progress = await Promise.all(DOMAIN_CONFIGS.map(updateDomain));
    const checked = progress.reduce((sum,item) => sum + item.checked, 0);
    const totalTerms = progress.reduce((sum,item) => sum + item.total, 0);
    if (document.getElementById('total-checked')) document.getElementById('total-checked').textContent = String(checked);
    if (document.getElementById('total-terms')) document.getElementById('total-terms').textContent = String(totalTerms);
    await updatePastCount();
  }

  window.addEventListener('ap-bookmarks-changed', renderPersonalDashboard);
  window.addEventListener('storage', event => {
    if (['ap-study-bookmarks-v1','ap-study-recent-v1',TEST_HISTORY_KEY].includes(event.key)) renderPersonalDashboard();
  });
  document.addEventListener('DOMContentLoaded', init);
})();
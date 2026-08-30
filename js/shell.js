(() => {
  'use strict';

  const BUILD = '2026.08.30-r16';
  const THEME_KEY = 'ap-study-theme';
  const RECENT_KEY = 'ap-study-recent-v1';
  const BOOKMARK_KEY = 'ap-study-bookmarks-v1';
  const DOMAIN_ALIASES = { sec:'security', net:'network', db:'database', alg:'algorithm', sys:'system', pm:'management' };

  const NAV_GROUPS = [
    { label:'学習', items:[
      ['home','🏠 ホーム','index.html'],
      ['roadmap','🧭 13ユニット','roadmap.html'],
      ['progress','📈 学習進捗','progress.html']
    ]},
    { label:'演習', items:[
      ['practice','🧪 短問演習','practice.html'],
      ['cases','📚 長文Case','cases.html'],
      ['mock','⏱️ 150分模試','mock.html']
    ]},
    { label:'本番・管理', items:[
      ['official-past','🎯 公式問題対応','official-past.html'],
      ['past','📘 Security過去問','security-past.html'],
      ['data','💾 学習データ','data.html'],
      ['test','📝 旧用語テスト','test.html']
    ]}
  ];

  function readJson(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
    catch { return fallback; }
  }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function canonicalDomain(domain) { return DOMAIN_ALIASES[domain] || domain || 'unknown'; }

  function migrateStudyItems(key) {
    const raw = readJson(key, []);
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    const next = [];
    for (const item of raw) {
      if (!item || !item.id) continue;
      const domain = canonicalDomain(item.domain);
      const entryKey = `${domain}:${item.id}`;
      if (seen.has(entryKey)) continue;
      seen.add(entryKey);
      next.push({ ...item, domain, key:key === RECENT_KEY ? entryKey : item.key });
    }
    if (JSON.stringify(next) !== JSON.stringify(raw)) writeJson(key, next);
    return next;
  }

  function applyTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    document.querySelectorAll('[data-ap-theme-toggle]').forEach(button => {
      button.textContent = next === 'dark' ? '☀' : '☾';
      button.title = next === 'dark' ? 'ライトモード' : 'ダークモード';
      button.setAttribute('aria-label', button.title);
    });
    return next;
  }

  function initialTheme() {
    try { const stored = localStorage.getItem(THEME_KEY); if (stored === 'dark' || stored === 'light') return stored; } catch {}
    return matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function toast(message) {
    if (!message) return;
    let region = document.querySelector('.ap-toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'ap-toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    const node = document.createElement('div');
    node.className = 'ap-toast';
    node.textContent = message;
    region.appendChild(node);
    setTimeout(() => node.remove(), 2200);
  }

  function recordRecent(item) {
    if (!item?.id || !item?.term || !item?.href) return;
    const list = migrateStudyItems(RECENT_KEY);
    const domain = canonicalDomain(item.domain);
    const key = `${domain}:${item.id}`;
    writeJson(RECENT_KEY, [{ ...item, domain, key, viewedAt:Date.now() }, ...list.filter(entry => entry?.key !== key)].slice(0, 12));
  }

  function getRecent() { return migrateStudyItems(RECENT_KEY); }
  function getBookmarks() { return migrateStudyItems(BOOKMARK_KEY); }
  function saveBookmarks(items) {
    const normalized = (Array.isArray(items) ? items : []).map(item => ({ ...item, domain:canonicalDomain(item?.domain) }));
    writeJson(BOOKMARK_KEY, normalized);
    window.dispatchEvent(new CustomEvent('ap-bookmarks-changed'));
  }

  function isHtmlPage() { return /\/html\//.test(location.pathname); }
  function hrefFor(target) {
    if (target === 'index.html') return isHtmlPage() ? '../index.html' : 'index.html';
    return isHtmlPage() ? target : `html/${target}`;
  }

  function activeNavKey() {
    const page = location.pathname.split('/').pop() || 'index.html';
    if (page === 'index.html' || !page) return 'home';
    if (page === 'progress.html') return 'progress';
    if (page === 'practice.html') return 'practice';
    if (page === 'cases.html') return 'cases';
    if (page === 'mock.html') return 'mock';
    if (page === 'official-past.html') return 'official-past';
    if (page === 'security-past.html') return 'past';
    if (page === 'data.html') return 'data';
    if (page === 'test.html') return 'test';
    if (['roadmap.html','unit.html','lesson.html','algorithm.html','computer.html','database.html','network.html','security.html','system.html','management.html'].includes(page)) return 'roadmap';
    return '';
  }

  function rebuildNavigation(nav) {
    const list = nav.querySelector('.unit-nav-list');
    if (!list) return;
    const active = activeNavKey();
    list.replaceChildren();
    for (const group of NAV_GROUPS) {
      const heading = document.createElement('li');
      heading.className = 'ap-nav-section';
      heading.textContent = group.label;
      list.appendChild(heading);
      for (const [key,label,target] of group.items) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = hrefFor(target);
        link.className = 'unit-nav-link';
        link.textContent = label;
        link.dataset.navKey = key;
        if (key === active) { link.classList.add('is-current'); link.setAttribute('aria-current','page'); }
        li.appendChild(link);
        list.appendChild(li);
      }
    }
  }

  function buildShell() {
    const nav = document.querySelector('.unit-nav');
    if (!nav) return;
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
    if (main && !document.querySelector('.ap-skip-link')) {
      const skip = document.createElement('a');
      skip.href = '#main-content';
      skip.className = 'ap-skip-link';
      skip.textContent = '本文へスキップ';
      document.body.prepend(skip);
    }

    rebuildNavigation(nav);
    const label = nav.querySelector('.unit-nav-label');
    if (label) label.textContent = 'AP STUDY NOTES';

    const footer = document.createElement('div');
    footer.className = 'ap-shell-footer';
    footer.innerHTML = `<div class="ap-shell-actions"><a class="ap-shell-btn" href="${hrefFor('practice.html')}" style="display:grid;place-items:center;text-decoration:none">短問演習</a><button class="ap-shell-btn" type="button" data-ap-theme-toggle aria-label="テーマ変更">☾</button></div><p class="ap-shell-version">BUILD ${BUILD}</p>`;
    nav.querySelector('.container')?.appendChild(footer);

    const current = nav.querySelector('.unit-nav-link.is-current')?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim() || 'AP Study Notes';
    const mobile = document.createElement('div');
    mobile.className = 'ap-mobile-bar';
    mobile.innerHTML = `<button class="ap-mobile-menu" type="button" aria-label="メニューを開く" aria-expanded="false">☰</button><span class="ap-mobile-title">${current}</span><span class="ap-mobile-version">${BUILD}</span>`;
    document.body.prepend(mobile);

    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'ap-nav-backdrop';
    backdrop.setAttribute('aria-label', 'メニューを閉じる');
    document.body.appendChild(backdrop);
    const menuButton = mobile.querySelector('.ap-mobile-menu');
    const mobileQuery = matchMedia('(max-width: 920px)');

    const setOpen = open => {
      const mobileMode = mobileQuery.matches;
      const next = mobileMode && open;
      document.body.classList.toggle('ap-nav-open', next);
      menuButton?.setAttribute('aria-expanded', String(next));
      menuButton?.setAttribute('aria-label', next ? 'メニューを閉じる' : 'メニューを開く');
      nav.toggleAttribute('inert', mobileMode && !next);
      nav.setAttribute('aria-hidden', String(mobileMode && !next));
      if (next) nav.querySelector('a')?.focus();
    };

    const syncMode = () => setOpen(false);
    mobileQuery.addEventListener?.('change', syncMode);
    menuButton?.addEventListener('click', () => setOpen(!document.body.classList.contains('ap-nav-open')));
    backdrop.addEventListener('click', () => { setOpen(false); menuButton?.focus(); });
    nav.addEventListener('click', event => { if (event.target.closest('a') && mobileQuery.matches) setOpen(false); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.body.classList.contains('ap-nav-open')) { setOpen(false); menuButton?.focus(); }
      if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
        const input = document.querySelector('input[type="search"]');
        if (input) { event.preventDefault(); input.focus(); }
      }
    });

    document.querySelectorAll('[data-ap-theme-toggle]').forEach(button => button.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')));
    applyTheme(document.documentElement.dataset.theme || initialTheme());
    syncMode();
  }

  migrateStudyItems(RECENT_KEY);
  migrateStudyItems(BOOKMARK_KEY);
  window.APStudyUI = { build:BUILD, toast, recordRecent, getRecent, getBookmarks, saveBookmarks, theme:{ get:() => document.documentElement.dataset.theme || initialTheme(), set:applyTheme } };
  applyTheme(initialTheme());
  document.addEventListener('DOMContentLoaded', buildShell);
})();
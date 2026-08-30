(() => {
  'use strict';

  const BUILD = '2026.08.30-r10';
  const THEME_KEY = 'ap-study-theme';
  const RECENT_KEY = 'ap-study-recent-v1';
  const BOOKMARK_KEY = 'ap-study-bookmarks-v1';
  const DOMAIN_ALIASES = { sec:'security', net:'network', db:'database', alg:'algorithm', sys:'system', pm:'management' };

  const NAV_ITEMS = [
    ['home','🏠 ホーム','index.html'],
    ['roadmap','🧭 学習マップ','roadmap.html'],
    ['foundation-theory','∑ 基礎理論','unit.html?unit=foundation-theory'],
    ['algorithm-programming','⚙️ アルゴリズム・プログラミング','algorithm.html'],
    ['computer-systems','🧩 コンピュータシステム','computer.html'],
    ['ui-media','🖱️ UI・情報メディア','unit.html?unit=ui-media'],
    ['database','🗄️ データベース','database.html'],
    ['network','🌐 ネットワーク','network.html'],
    ['security','🔐 セキュリティ','security.html'],
    ['system-development','🖥️ システム開発','system.html'],
    ['project-management','📋 プロジェクト管理','management.html'],
    ['service-audit','🛠️ サービス管理・監査','unit.html?unit=service-audit'],
    ['strategy-planning','🧭 システム戦略・企画','unit.html?unit=strategy-planning'],
    ['business-accounting','📊 経営・会計・ビジネス','unit.html?unit=business-accounting'],
    ['law-standards','⚖️ 法務・標準化','unit.html?unit=law-standards'],
    ['practice','🧪 総合演習','practice.html'],
    ['past','📘 過去問解説','security-past.html'],
    ['test','📝 用語テスト','test.html']
  ];

  const LESSON_UNIT_PREFIX = [
    [/^(FND)-/,'foundation-theory'],
    [/^(ALG|PROG)-/,'algorithm-programming'],
    [/^CMP-/,'computer-systems'],
    [/^(UIM|MED)-/,'ui-media'],
    [/^DB-/,'database'],
    [/^NET-/,'network'],
    [/^SEC-/,'security'],
    [/^(SYS|DEV)-/,'system-development'],
    [/^PM-/,'project-management'],
    [/^(SVC|AUD)-/,'service-audit'],
    [/^STR-/,'strategy-planning'],
    [/^BUS-/,'business-accounting'],
    [/^LAW-/,'law-standards']
  ];

  function readJson(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function canonicalDomain(domain) {
    return DOMAIN_ALIASES[domain] || domain || 'unknown';
  }

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
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
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
    const next = [
      { ...item, domain, key, viewedAt:Date.now() },
      ...list.filter(entry => entry?.key !== key)
    ].slice(0, 12);
    writeJson(RECENT_KEY, next);
  }

  function getRecent() { return migrateStudyItems(RECENT_KEY); }
  function getBookmarks() { return migrateStudyItems(BOOKMARK_KEY); }

  function saveBookmarks(items) {
    const normalized = (Array.isArray(items) ? items : []).map(item => ({ ...item, domain:canonicalDomain(item?.domain) }));
    writeJson(BOOKMARK_KEY, normalized);
    window.dispatchEvent(new CustomEvent('ap-bookmarks-changed'));
  }

  function isHtmlPage() {
    return /\/html\//.test(location.pathname);
  }

  function hrefFor(target) {
    if (target === 'index.html') return isHtmlPage() ? '../index.html' : 'index.html';
    return isHtmlPage() ? target : `html/${target}`;
  }

  function activeNavKey() {
    const page = location.pathname.split('/').pop() || 'index.html';
    if (page === 'index.html' || !page) return 'home';
    if (page === 'roadmap.html') return 'roadmap';
    if (page === 'practice.html') return 'practice';
    if (page === 'security-past.html') return 'past';
    if (page === 'test.html') return 'test';
    if (page === 'algorithm.html') return 'algorithm-programming';
    if (page === 'computer.html') return 'computer-systems';
    if (page === 'database.html') return 'database';
    if (page === 'network.html') return 'network';
    if (page === 'security.html') return 'security';
    if (page === 'system.html') return 'system-development';
    if (page === 'management.html') return 'project-management';
    if (page === 'unit.html') return new URLSearchParams(location.search).get('unit') || '';
    if (page === 'lesson.html') {
      const id = (new URLSearchParams(location.search).get('id') || '').toUpperCase();
      return LESSON_UNIT_PREFIX.find(([pattern]) => pattern.test(id))?.[1] || '';
    }
    return '';
  }

  function rebuildNavigation(nav) {
    const list = nav.querySelector('.unit-nav-list');
    if (!list) return;
    const active = activeNavKey();
    list.replaceChildren();
    for (const [key,label,target] of NAV_ITEMS) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = hrefFor(target);
      link.className = 'unit-nav-link';
      link.textContent = label;
      link.dataset.navKey = key;
      if (key === 'roadmap') link.dataset.apRoadmapLink = 'true';
      if (key === active) {
        link.classList.add('is-current');
        link.setAttribute('aria-current','page');
      }
      li.appendChild(link);
      list.appendChild(li);
    }
  }

  function buildShell() {
    const nav = document.querySelector('.unit-nav');
    if (!nav) return;

    rebuildNavigation(nav);

    const label = nav.querySelector('.unit-nav-label');
    if (label) label.textContent = 'AP STUDY NOTES';

    const footer = document.createElement('div');
    footer.className = 'ap-shell-footer';
    footer.innerHTML = `
      <div class="ap-shell-actions">
        <a class="ap-shell-btn" href="${hrefFor('practice.html')}" style="display:grid;place-items:center;text-decoration:none">総合演習</a>
        <button class="ap-shell-btn" type="button" data-ap-theme-toggle aria-label="テーマ変更">☾</button>
      </div>
      <p class="ap-shell-version">BUILD ${BUILD}</p>`;
    nav.querySelector('.container')?.appendChild(footer);

    const current = nav.querySelector('.unit-nav-link.is-current')?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim() || 'AP Study Notes';
    const mobile = document.createElement('div');
    mobile.className = 'ap-mobile-bar';
    mobile.innerHTML = `
      <button class="ap-mobile-menu" type="button" aria-label="メニューを開く" aria-expanded="false">☰</button>
      <span class="ap-mobile-title">${current}</span>
      <span class="ap-mobile-version">${BUILD}</span>`;
    document.body.prepend(mobile);

    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'ap-nav-backdrop';
    backdrop.setAttribute('aria-label', 'メニューを閉じる');
    document.body.appendChild(backdrop);

    const menuButton = mobile.querySelector('.ap-mobile-menu');
    const setOpen = open => {
      document.body.classList.toggle('ap-nav-open', open);
      menuButton?.setAttribute('aria-expanded', String(open));
      menuButton?.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    };
    menuButton?.addEventListener('click', () => setOpen(!document.body.classList.contains('ap-nav-open')));
    backdrop.addEventListener('click', () => setOpen(false));
    nav.addEventListener('click', event => {
      if (event.target.closest('a') && matchMedia('(max-width: 920px)').matches) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
        const input = document.querySelector('input[type="search"]');
        if (input) { event.preventDefault(); input.focus(); }
      }
    });

    document.querySelectorAll('[data-ap-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    });
    applyTheme(document.documentElement.dataset.theme || initialTheme());
  }

  migrateStudyItems(RECENT_KEY);
  migrateStudyItems(BOOKMARK_KEY);

  window.APStudyUI = {
    build:BUILD, toast, recordRecent, getRecent, getBookmarks, saveBookmarks,
    theme:{ get:() => document.documentElement.dataset.theme || initialTheme(), set:applyTheme }
  };

  applyTheme(initialTheme());
  document.addEventListener('DOMContentLoaded', buildShell);
})();
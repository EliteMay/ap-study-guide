(() => {
  'use strict';

  const DIAGNOSTICS_KEY = 'ap-study-diagnostics-v1';
  const DIAGNOSTICS_SESSION_KEY = 'ap-study-diagnostics-session-v1';
  const DIAGNOSTICS_SCHEMA_VERSION = 1;
  const DIAGNOSTICS_LIMITS = { breadcrumbs:100, errors:40, networkFailures:40, initialization:30 };
  const THEME_KEY = 'ap-study-theme';
  const RECENT_KEY = 'ap-study-recent-v1';
  const BOOKMARK_KEY = 'ap-study-bookmarks-v1';
  const DOMAIN_ALIASES = { sec:'security', net:'network', db:'database', alg:'algorithm', sys:'system', pm:'management' };
  let metaPromise = null;
  let diagnosticsStorageAvailable = true;

  function safeText(value, max = 240) {
    const text = String(value ?? '')
      .replace(/https?:\/\/[^\s?#]+\?[^\s#]*/gi, match => match.split('?')[0])
      .replace(/#[^\s]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, max);
  }

  function safePath(value = location.href) {
    try { return new URL(String(value), location.href).pathname; }
    catch { return location.pathname || '/'; }
  }

  function newSession() {
    const fallbackId = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    const fresh = { id:crypto?.randomUUID?.() || fallbackId, startedAt:new Date().toISOString() };
    try {
      const raw = sessionStorage.getItem(DIAGNOSTICS_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id && parsed?.startedAt) return parsed;
      }
      sessionStorage.setItem(DIAGNOSTICS_SESSION_KEY, JSON.stringify(fresh));
    } catch {}
    return fresh;
  }

  const diagnosticSession = newSession();
  let diagnosticState = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(DIAGNOSTICS_KEY) || 'null');
      if (parsed?.schemaVersion === DIAGNOSTICS_SCHEMA_VERSION) {
        return {
          schemaVersion:DIAGNOSTICS_SCHEMA_VERSION,
          breadcrumbs:Array.isArray(parsed.breadcrumbs) ? parsed.breadcrumbs : [],
          errors:Array.isArray(parsed.errors) ? parsed.errors : [],
          networkFailures:Array.isArray(parsed.networkFailures) ? parsed.networkFailures : [],
          initialization:Array.isArray(parsed.initialization) ? parsed.initialization : []
        };
      }
    } catch {
      diagnosticsStorageAvailable = false;
    }
    return { schemaVersion:DIAGNOSTICS_SCHEMA_VERSION, breadcrumbs:[], errors:[], networkFailures:[], initialization:[] };
  })();

  function persistDiagnostics() {
    try {
      localStorage.setItem(DIAGNOSTICS_KEY, JSON.stringify(diagnosticState));
      diagnosticsStorageAvailable = true;
      return true;
    } catch {
      diagnosticsStorageAvailable = false;
      return false;
    }
  }

  function pushDiagnostic(bucket, entry) {
    const limit = Number(DIAGNOSTICS_LIMITS[bucket] || 50);
    diagnosticState[bucket] = [...(diagnosticState[bucket] || []), entry].slice(-limit);
    persistDiagnostics();
  }

  function diagnosticEntry(extra = {}) {
    return { at:new Date().toISOString(), sessionId:diagnosticSession.id, route:safePath(), ...extra };
  }

  function breadcrumb(action, detail = {}) {
    const clean = {};
    for (const [key,value] of Object.entries(detail || {})) {
      if (value === null || value === undefined || value === '') continue;
      clean[key] = typeof value === 'number' || typeof value === 'boolean' ? value : safeText(value, 120);
    }
    pushDiagnostic('breadcrumbs', diagnosticEntry({ action:safeText(action, 80), detail:clean }));
  }

  function diagnosticError(code, error, source = 'runtime') {
    const message = error instanceof Error ? error.message : error;
    pushDiagnostic('errors', diagnosticEntry({
      code:safeText(code || 'RUNTIME-ERROR', 80),
      source:safeText(source, 120),
      message:safeText(message || 'Unknown error', 300)
    }));
  }

  function networkFailure({ method = 'GET', path = '', status = 0, error = '' } = {}) {
    pushDiagnostic('networkFailures', diagnosticEntry({
      method:safeText(method, 16),
      path:safePath(path || location.href),
      status:Number(status || 0),
      error:safeText(error, 220)
    }));
  }

  function storageFailure(operation, key, error) {
    diagnosticError('STORAGE-FAILURE', error, `storage:${safeText(operation,40)}:${safeText(key,100)}`);
  }

  function initialization(step, status, detail = '') {
    pushDiagnostic('initialization', diagnosticEntry({ step:safeText(step,100), status:status === 'success' ? 'success' : 'failure', detail:safeText(detail,180) }));
  }

  function clearDiagnostics() {
    diagnosticState = { schemaVersion:DIAGNOSTICS_SCHEMA_VERSION, breadcrumbs:[], errors:[], networkFailures:[], initialization:[] };
    try { localStorage.removeItem(DIAGNOSTICS_KEY); diagnosticsStorageAvailable = true; }
    catch { diagnosticsStorageAvailable = false; }
  }

  function featureSupport() {
    let localStorageOk = false;
    try {
      const key = '__ap_diag_probe__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      localStorageOk = true;
    } catch {}
    return {
      fetch:typeof fetch === 'function',
      localStorage:localStorageOk,
      matchMedia:typeof matchMedia === 'function',
      inert:'inert' in HTMLElement.prototype,
      clipboard:Boolean(navigator.clipboard?.writeText)
    };
  }

  function storageSummary() {
    const recognized = window.APStudyState?.recognizedKeys?.() || [];
    let existing = 0;
    let estimatedBytes = 0;
    for (const key of recognized) {
      try {
        const value = localStorage.getItem(key);
        if (value === null) continue;
        existing += 1;
        estimatedBytes += new Blob([key,value]).size;
      } catch (error) {
        storageFailure('diagnostic-summary-read', key, error);
        break;
      }
    }
    let diagnosticBytes = 0;
    try { diagnosticBytes = new Blob([JSON.stringify(diagnosticState)]).size; } catch {}
    return { recognizedKeyCount:recognized.length, existingRecognizedKeys:existing, recognizedDataBytes:estimatedBytes, diagnosticBytes };
  }

  async function snapshotDiagnostics(reason = 'manual') {
    let estimate = {};
    try { estimate = await navigator.storage?.estimate?.() || {}; } catch {}
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    const meta = window.APStudyUI?.meta || null;
    return {
      schemaVersion:DIAGNOSTICS_SCHEMA_VERSION,
      project:{
        name:'AP Study Notes',
        appVersion:window.APStudyUI?.build || 'unknown',
        build:window.APStudyUI?.build || 'unknown',
        dataSchemaVersion:Number(meta?.storage?.backupSchemaVersion || 1)
      },
      capture:{ capturedAt:new Date().toISOString(), sessionId:diagnosticSession.id, sessionStartedAt:diagnosticSession.startedAt, route:safePath(), reason:safeText(reason,60) },
      environment:{
        viewport:{ width:innerWidth, height:innerHeight, devicePixelRatio:Number(devicePixelRatio || 1) },
        language:navigator.language || '',
        online:navigator.onLine,
        platformSummary:safeText(navigator.userAgentData?.platform || navigator.platform || 'unknown',80),
        features:featureSupport()
      },
      runtime:{ initialization:[...(diagnosticState.initialization || [])], featureFlags:{}, serviceWorker:navigator.serviceWorker ? (navigator.serviceWorker.controller ? 'controlled' : 'available-not-controlling') : 'unsupported' },
      breadcrumbs:[...(diagnosticState.breadcrumbs || [])],
      errors:[...(diagnosticState.errors || [])],
      networkFailures:[...(diagnosticState.networkFailures || [])],
      storage:{ available:diagnosticsStorageAvailable, types:['localStorage'], estimatedUsageBytes:Number(estimate.usage || 0), estimatedQuotaBytes:Number(estimate.quota || 0), summary:storageSummary() },
      performance:{ summary:{ navigationMs:Number.isFinite(nav?.duration) ? Math.round(nav.duration) : null } },
      notes:['Local-first diagnostics. Saved learning data bodies and user input text are not included.']
    };
  }

  function installDiagnostics() {
    window.addEventListener('error', event => diagnosticError('JS-ERROR', event.error || event.message, safePath(event.filename || location.href)));
    window.addEventListener('unhandledrejection', event => diagnosticError('PROMISE-UNHANDLED', event.reason, 'unhandledrejection'));

    const nativeFetch = window.fetch?.bind(window);
    if (nativeFetch) {
      window.fetch = async (...args) => {
        const input = args[0];
        const init = args[1] || {};
        const method = safeText(init.method || input?.method || 'GET', 16).toUpperCase();
        const path = safePath(input?.url || input || location.href);
        try {
          const response = await nativeFetch(...args);
          if (!response.ok) networkFailure({ method, path, status:response.status });
          return response;
        } catch (error) {
          networkFailure({ method, path, status:0, error:error?.message || error });
          throw error;
        }
      };
    }

    document.addEventListener('click', event => {
      const control = event.target.closest?.('a,button');
      if (!control) return;
      const id = control.id || control.dataset.navKey || control.dataset.action || control.tagName.toLowerCase();
      const detail = { control:id };
      if (control.tagName === 'A' && control.href) detail.href = safePath(control.href);
      breadcrumb('ui.activate', detail);
    });
    window.addEventListener('online', () => breadcrumb('network.online'));
    window.addEventListener('offline', () => breadcrumb('network.offline'));
    breadcrumb('page.open', { path:safePath() });
    initialization('diagnostics.install', 'success');
  }

  window.APDiagnostics = {
    schemaVersion:DIAGNOSTICS_SCHEMA_VERSION,
    storageKey:DIAGNOSTICS_KEY,
    breadcrumb,
    error:diagnosticError,
    networkFailure,
    storageFailure,
    initialization,
    snapshot:snapshotDiagnostics,
    clear:clearDiagnostics
  };
  installDiagnostics();

  const NAV_GROUPS = [
    { label:'学習', items:[
      ['home','🏠 ホーム','index.html'],
      ['roadmap','🧭 13ユニット','roadmap.html'],
      ['progress','📈 学習進捗','progress.html']
    ]},
    { label:'調べる', items:[
      ['glossary','🔎 単語辞書','glossary.html'],
      ['official-past','🎯 公式問題対応','official-past.html']
    ]},
    { label:'演習', items:[
      ['practice','🧪 短問演習','practice.html'],
      ['cases','📚 長文Case','cases.html'],
      ['mock','⏱️ 150分模試','mock.html']
    ]},
    { label:'管理・互換', items:[
      ['past','📘 Security過去問','security-past.html'],
      ['data','💾 学習データ','data.html'],
      ['diagnostics','🩺 診断情報','diagnostics.html'],
      ['test','📝 旧用語テスト','test.html']
    ]}
  ];

  function readJson(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
    catch (error) { storageFailure('read-json', key, error); return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { storageFailure('write-json', key, error); return false; }
  }
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
    try { localStorage.setItem(THEME_KEY, next); }
    catch (error) { storageFailure('theme-write', THEME_KEY, error); }
    document.querySelectorAll('[data-ap-theme-toggle]').forEach(button => {
      button.textContent = next === 'dark' ? '☀' : '☾';
      button.title = next === 'dark' ? 'ライトモード' : 'ダークモード';
      button.setAttribute('aria-label', button.title);
    });
    return next;
  }

  function initialTheme() {
    try { const stored = localStorage.getItem(THEME_KEY); if (stored === 'dark' || stored === 'light') return stored; }
    catch (error) { storageFailure('theme-read', THEME_KEY, error); }
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

  function projectMetaPath() { return isHtmlPage() ? '../json/project-meta.json' : 'json/project-meta.json'; }
  function shortBuild(build) {
    if (!build || build === 'unknown') return '…';
    return String(build).split('-').pop() || String(build);
  }
  function syncBuildLabels() {
    const build = window.APStudyUI?.build || 'unknown';
    document.querySelectorAll('[data-ap-build]').forEach(node => { node.textContent = build === 'unknown' ? 'BUILD ?' : `BUILD ${build}`; });
    document.querySelectorAll('[data-ap-build-short]').forEach(node => { node.textContent = shortBuild(build); });
  }
  function loadProjectMeta() {
    if (metaPromise) return metaPromise;
    metaPromise = (async () => {
      try {
        const response = await fetch(projectMetaPath());
        if (!response.ok) throw new Error(`project-meta.json: HTTP ${response.status}`);
        const meta = await response.json();
        if (!meta || meta.app !== 'AP Study Notes' || !String(meta.build || '').trim()) throw new Error('project-meta.json の形式が正しくありません。');
        window.APStudyUI.meta = meta;
        window.APStudyUI.build = String(meta.build);
        syncBuildLabels();
        initialization('project-meta.load', 'success', meta.build);
        return meta;
      } catch (error) {
        diagnosticError('META-LOAD-001', error, 'shell:project-meta');
        initialization('project-meta.load', 'failure', error?.message || error);
        console.error('[shell] project meta load failed', error);
        syncBuildLabels();
        return null;
      }
    })();
    return metaPromise;
  }

  function activeNavKey() {
    const page = location.pathname.split('/').pop() || 'index.html';
    if (page === 'index.html' || !page) return 'home';
    if (page === 'progress.html') return 'progress';
    if (page === 'practice.html') return 'practice';
    if (page === 'cases.html') return 'cases';
    if (page === 'mock.html') return 'mock';
    if (page === 'glossary.html') return 'glossary';
    if (page === 'official-past.html') return 'official-past';
    if (page === 'security-past.html') return 'past';
    if (page === 'data.html') return 'data';
    if (page === 'diagnostics.html') return 'diagnostics';
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
      skip.style.pointerEvents = 'none';
      skip.addEventListener('focus', () => { skip.style.pointerEvents = 'auto'; });
      skip.addEventListener('blur', () => { skip.style.pointerEvents = 'none'; });
      document.body.prepend(skip);
    }

    rebuildNavigation(nav);
    const label = nav.querySelector('.unit-nav-label');
    if (label) label.textContent = 'AP STUDY NOTES';

    const footer = document.createElement('div');
    footer.className = 'ap-shell-footer';
    footer.innerHTML = `<div class="ap-shell-actions"><a class="ap-shell-btn" href="${hrefFor('practice.html')}" style="display:grid;place-items:center;text-decoration:none">短問演習</a><button class="ap-shell-btn" type="button" data-ap-theme-toggle aria-label="テーマ変更">☾</button></div><p class="ap-shell-version" data-ap-build>BUILD ?</p>`;
    nav.querySelector('.container')?.appendChild(footer);

    const current = nav.querySelector('.unit-nav-link.is-current')?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim() || 'AP Study Notes';
    const mobile = document.createElement('div');
    mobile.className = 'ap-mobile-bar';
    mobile.innerHTML = `<button class="ap-mobile-menu" type="button" aria-label="メニューを開く" aria-expanded="false">☰</button><span class="ap-mobile-title">${current}</span><span class="ap-mobile-version" data-ap-build-short>…</span>`;
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
    syncBuildLabels();
    syncMode();
    initialization('shell.build', 'success');
  }

  migrateStudyItems(RECENT_KEY);
  migrateStudyItems(BOOKMARK_KEY);
  window.APStudyUI = { build:'unknown', meta:null, ready:null, toast, recordRecent, getRecent, getBookmarks, saveBookmarks, diagnostics:window.APDiagnostics, theme:{ get:() => document.documentElement.dataset.theme || initialTheme(), set:applyTheme } };
  window.APStudyUI.ready = loadProjectMeta();
  applyTheme(initialTheme());
  document.addEventListener('DOMContentLoaded', buildShell);
})();
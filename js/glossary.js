(() => {
  'use strict';

  const PAGE_SIZE = 60;
  const BOOKMARK_KEY = 'ap-study-bookmarks-v1';
  const DOMAINS = [
    { id:'algorithm', label:'アルゴリズム', short:'ALG', manifest:'algorithm-terms-manifest.json', storageKey:'algorithm-terms-checked', legacyPage:'algorithm.html' },
    { id:'database', label:'データベース', short:'DB', manifest:'database-terms-manifest.json', detailsManifest:'database-details-manifest.json', storageKey:'database-terms-checked', legacyPage:'database.html' },
    { id:'network', label:'ネットワーク', short:'NET', manifest:'network-terms-manifest.json', detailsManifest:'network-details-manifest.json', storageKey:'network-terms-checked', legacyPage:'network.html' },
    { id:'security', label:'セキュリティ', short:'SEC', manifest:'security-terms-manifest.json', detailsManifest:'security-details-manifest.json', storageKey:'security-terms-checked', legacyPage:'security.html' },
    { id:'system', label:'システム開発', short:'SYS', manifest:'system-terms-manifest.json', storageKey:'system-terms-checked', legacyPage:'system.html' },
    { id:'management', label:'プロジェクト管理', short:'PM', manifest:'management-terms-manifest.json', storageKey:'management-terms-checked', legacyPage:'management.html' }
  ];
  const DOMAIN_BY_ID = new Map(DOMAINS.map(item => [item.id,item]));
  const params = new URLSearchParams(location.search);
  const detailFileCache = new Map();
  const detailIndex = new Map();
  const checkedByDomain = new Map();
  const state = { terms:[], query:'', domain:'', category:'', status:'', visible:PAGE_SIZE, filtered:[], openingId:'' };
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function fetchJson(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function readArray(key) {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }

  function saveChecked(domainId) {
    const domain = DOMAIN_BY_ID.get(domainId);
    if (!domain) return;
    try { localStorage.setItem(domain.storageKey, JSON.stringify([...checkedByDomain.get(domainId)])); } catch {}
  }

  function bookmarkSet() {
    const list = window.APStudyUI?.getBookmarks?.() || readArray(BOOKMARK_KEY);
    return new Set((Array.isArray(list) ? list : []).map(item => `${item?.domain}:${item?.id}`));
  }

  function toggleBookmark(term) {
    const list = window.APStudyUI?.getBookmarks?.() || readArray(BOOKMARK_KEY);
    const key = `${term.domain}:${term.id}`;
    const exists = list.some(item => `${item?.domain}:${item?.id}` === key);
    const next = list.filter(item => `${item?.domain}:${item?.id}` !== key);
    if (!exists) next.unshift({ id:term.id, term:term.term, category:term.category, domain:term.domain, subject:term.domainLabel, href:`html/glossary.html?term=${encodeURIComponent(term.id)}`, updatedAt:Date.now() });
    if (window.APStudyUI?.saveBookmarks) window.APStudyUI.saveBookmarks(next);
    else try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next)); } catch {}
    renderResults();
  }

  function toggleChecked(term) {
    const set = checkedByDomain.get(term.domain);
    if (!set) return;
    if (set.has(term.id)) set.delete(term.id); else set.add(term.id);
    saveChecked(term.domain);
    renderResults();
  }

  function normalizeTerm(raw, domain, order) {
    const aliases = Array.isArray(raw.aliases) ? raw.aliases : [];
    const term = String(raw.term || '無題');
    const category = String(raw.category || '未分類');
    const definition = String(raw.definition || '');
    return {
      id:String(raw.id || `${domain.id}-${order}`), term, aliases, category, definition,
      domain:domain.id, domainLabel:domain.label, domainShort:domain.short, legacyPage:domain.legacyPage,
      searchable:[term,...aliases,category,definition,domain.label,domain.short].join(' ').toLocaleLowerCase('ja-JP')
    };
  }

  async function loadDomain(domain) {
    const manifest = await fetchJson(domain.manifest);
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    if (!files.length) throw new Error(`${domain.manifest}: terms files missing`);
    if (domain.detailsManifest) {
      const detailsManifest = await fetchJson(domain.detailsManifest);
      const map = new Map();
      for (const file of detailsManifest.files || []) {
        const key = String(file.category || file.title || '');
        if (key && file.file) map.set(key,file.file);
      }
      detailIndex.set(domain.id,map);
    }
    const termFiles = await Promise.all(files.map(item => fetchJson(item.file)));
    let order = 0;
    const terms = [];
    for (const data of termFiles) for (const raw of data.terms || []) terms.push(normalizeTerm(raw,domain,++order));
    checkedByDomain.set(domain.id,new Set(readArray(domain.storageKey)));
    return terms;
  }

  function updateCategoryOptions() {
    const select = $('glossary-category');
    const current = state.category;
    const terms = state.domain ? state.terms.filter(item => item.domain === state.domain) : state.terms;
    const values = [...new Map(terms.map(item => [`${item.domain}::${item.category}`,item])).values()]
      .sort((a,b) => a.domain === b.domain ? a.category.localeCompare(b.category,'ja') : DOMAINS.findIndex(x => x.id === a.domain)-DOMAINS.findIndex(x => x.id === b.domain));
    select.innerHTML = '<option value="">すべて</option>' + values.map(item => `<option value="${escapeHtml(`${item.domain}::${item.category}`)}">${state.domain ? '' : `${escapeHtml(item.domainLabel)} / `}${escapeHtml(item.category)}</option>`).join('');
    state.category = values.some(item => `${item.domain}::${item.category}` === current) ? current : '';
    select.value = state.category;
  }

  function matchesStatus(term, bookmarks) {
    const checked = checkedByDomain.get(term.domain)?.has(term.id) || false;
    if (state.status === 'bookmarked') return bookmarks.has(`${term.domain}:${term.id}`);
    if (state.status === 'checked') return checked;
    if (state.status === 'unchecked') return !checked;
    return true;
  }

  function applyFilters() {
    const query = state.query.trim().toLocaleLowerCase('ja-JP');
    const bookmarks = bookmarkSet();
    state.filtered = state.terms.filter(term => {
      if (state.domain && term.domain !== state.domain) return false;
      if (state.category && `${term.domain}::${term.category}` !== state.category) return false;
      if (query && !term.searchable.includes(query)) return false;
      return matchesStatus(term,bookmarks);
    });
  }

  function detailFallback(term) {
    return {
      beginner:`${term.term}は「${term.definition}」を表す用語です。まず、何を対象にして何をする概念かを一文で説明できる状態を目指します。`,
      examPoint:`用語名だけではなく、問題文のどの条件が「${term.definition}」に対応しているかを確認します。`,
      trap:`同じカテゴリ「${term.category}」の似た用語と、目的・対象・結果の違いを比較してください。`,
      deepDive:[], commonMistakes:[]
    };
  }

  async function loadDetailFor(term) {
    const file = detailIndex.get(term.domain)?.get(term.category);
    if (!file) return detailFallback(term);
    if (!detailFileCache.has(file)) detailFileCache.set(file,fetchJson(file));
    const data = await detailFileCache.get(file);
    return (data.details || []).find(item => item.id === term.id) || detailFallback(term);
  }

  function renderDetailContent(term, detail) {
    const deep = (detail.deepDive || []).slice(0,4).map(section => `<section><h4>${escapeHtml(section.heading)}</h4>${(section.body || []).map(text => `<p>${escapeHtml(text)}</p>`).join('')}</section>`).join('');
    const mistakes = (detail.commonMistakes || []).slice(0,4);
    return `<div class="glossary-detail-inner">
      <p class="glossary-detail-note">${escapeHtml(detail.beginner || term.definition)}</p>
      ${detail.example ? `<h4>具体例</h4><p>${escapeHtml(detail.example)}</p>` : ''}
      ${detail.examPoint ? `<h4>試験で見るポイント</h4><p>${escapeHtml(detail.examPoint)}</p>` : ''}
      ${detail.trap ? `<h4>ひっかけ・注意</h4><p>${escapeHtml(detail.trap)}</p>` : ''}
      ${deep}
      ${mistakes.length ? `<h4>よくあるミス</h4><ul>${mistakes.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
      <div class="glossary-actions"><a href="${escapeHtml(term.legacyPage)}#${encodeURIComponent(term.id)}">旧ページで開く</a></div>
    </div>`;
  }

  async function openDetail(termId) {
    const term = state.terms.find(item => item.id === termId);
    const host = document.querySelector(`[data-detail-host="${CSS.escape(termId)}"]`);
    const button = document.querySelector(`[data-detail-button="${CSS.escape(termId)}"]`);
    if (!term || !host || !button) return;
    if (!host.hidden) { host.hidden = true; button.textContent = '詳しい解説'; return; }
    document.querySelectorAll('.glossary-detail').forEach(node => { node.hidden = true; });
    document.querySelectorAll('[data-detail-button]').forEach(node => { node.textContent = '詳しい解説'; });
    host.hidden = false;
    host.innerHTML = '<div class="glossary-detail-inner"><p>詳細解説を読み込み中...</p></div>';
    button.textContent = '解説を閉じる';
    window.APStudyUI?.recordRecent?.({ id:term.id, term:term.term, category:term.category, domain:term.domain, subject:term.domainLabel, href:`html/glossary.html?term=${encodeURIComponent(term.id)}` });
    try { host.innerHTML = renderDetailContent(term,await loadDetailFor(term)); }
    catch (error) { host.innerHTML = `<div class="glossary-detail-inner"><p>詳細解説を読み込めませんでした。${escapeHtml(error.message)}</p></div>`; }
    history.replaceState(null,'',`glossary.html?term=${encodeURIComponent(term.id)}`);
  }

  function renderCard(term, bookmarks) {
    const checked = checkedByDomain.get(term.domain)?.has(term.id) || false;
    const bookmarked = bookmarks.has(`${term.domain}:${term.id}`);
    return `<article class="glossary-card" id="term-${escapeHtml(term.id)}">
      <div class="glossary-card-main"><div class="glossary-card-head"><div><h3 class="glossary-card-title">${escapeHtml(term.term)} <span class="glossary-card-id">${escapeHtml(term.id)}</span></h3><div class="glossary-tags"><span class="glossary-tag">${escapeHtml(term.domainLabel)}</span><span class="glossary-tag">${escapeHtml(term.category)}</span></div></div></div>
      <p class="glossary-definition">${escapeHtml(term.definition)}</p>${term.aliases.length ? `<p class="glossary-alias">別名: ${term.aliases.map(escapeHtml).join(' / ')}</p>` : ''}
      <div class="glossary-actions"><button type="button" data-detail-button="${escapeHtml(term.id)}">詳しい解説</button><button type="button" data-bookmark="${escapeHtml(term.id)}" class="${bookmarked ? 'is-active' : ''}">${bookmarked ? '★ 復習' : '☆ 復習'}</button><button type="button" data-checked="${escapeHtml(term.id)}" class="${checked ? 'is-active' : ''}">${checked ? '✓ チェック済み' : '○ 未チェック'}</button></div></div>
      <div class="glossary-detail" data-detail-host="${escapeHtml(term.id)}" hidden></div>
    </article>`;
  }

  function syncUrl() {
    if (state.openingId) return;
    const next = new URLSearchParams();
    if (state.query) next.set('q',state.query);
    if (state.domain) next.set('domain',state.domain);
    if (state.status) next.set('status',state.status);
    const query = next.toString();
    history.replaceState(null,'',`glossary.html${query ? `?${query}` : ''}`);
  }

  function renderResults() {
    applyFilters();
    const root = $('glossary-results');
    const bookmarks = bookmarkSet();
    const shown = state.filtered.slice(0,state.visible);
    root.innerHTML = shown.length ? shown.map(term => renderCard(term,bookmarks)).join('') : '<div class="glossary-empty">条件に一致する用語がありません。検索語や分野を変えてください。</div>';
    $('glossary-result-count').textContent = `${state.filtered.length.toLocaleString()}語が一致`;
    $('glossary-loaded-note').textContent = `全${state.terms.length.toLocaleString()}語中 ${shown.length.toLocaleString()}語を表示`;
    $('glossary-more').hidden = shown.length >= state.filtered.length;
    syncUrl();
  }

  function renderStats() {
    $('glossary-domain-stats').innerHTML = DOMAINS.map(domain => `<div class="glossary-domain-stat"><strong>${state.terms.filter(term => term.domain === domain.id).length}</strong>${escapeHtml(domain.label)}</div>`).join('');
  }

  function bind() {
    $('glossary-search').addEventListener('input',event => { state.query = event.target.value; state.visible = PAGE_SIZE; renderResults(); });
    $('glossary-domain').addEventListener('change',event => { state.domain = event.target.value; state.category=''; state.visible=PAGE_SIZE; updateCategoryOptions(); renderResults(); });
    $('glossary-category').addEventListener('change',event => { state.category=event.target.value; state.visible=PAGE_SIZE; renderResults(); });
    $('glossary-status').addEventListener('change',event => { state.status=event.target.value; state.visible=PAGE_SIZE; renderResults(); });
    $('glossary-clear').addEventListener('click',() => { state.query='';state.domain='';state.category='';state.status='';state.visible=PAGE_SIZE;$('glossary-search').value='';$('glossary-domain').value='';$('glossary-status').value='';updateCategoryOptions();renderResults();$('glossary-search').focus(); });
    $('glossary-more').addEventListener('click',() => { state.visible += PAGE_SIZE; renderResults(); });
    $('glossary-results').addEventListener('click',event => {
      const detail = event.target.closest('[data-detail-button]');
      const bookmark = event.target.closest('[data-bookmark]');
      const checked = event.target.closest('[data-checked]');
      if (detail) openDetail(detail.dataset.detailButton);
      if (bookmark) { const term=state.terms.find(item=>item.id===bookmark.dataset.bookmark); if(term) toggleBookmark(term); }
      if (checked) { const term=state.terms.find(item=>item.id===checked.dataset.checked); if(term) toggleChecked(term); }
    });
  }

  async function init() {
    const domainSelect = $('glossary-domain');
    domainSelect.innerHTML = '<option value="">6分野すべて</option>' + DOMAINS.map(domain => `<option value="${domain.id}">${escapeHtml(domain.label)}</option>`).join('');
    state.query = params.get('q') || '';
    state.domain = DOMAIN_BY_ID.has(params.get('domain')) ? params.get('domain') : '';
    state.status = ['bookmarked','checked','unchecked'].includes(params.get('status')) ? params.get('status') : '';
    state.openingId = params.get('term') || '';
    $('glossary-search').value = state.query;
    $('glossary-domain').value = state.domain;
    $('glossary-status').value = state.status;
    bind();
    const loaded = await Promise.all(DOMAINS.map(loadDomain));
    state.terms = loaded.flat().sort((a,b) => DOMAINS.findIndex(x=>x.id===a.domain)-DOMAINS.findIndex(x=>x.id===b.domain) || a.term.localeCompare(b.term,'ja'));
    renderStats();
    if (state.openingId) {
      const target = state.terms.find(item => item.id === state.openingId);
      if (target) { state.domain=target.domain; state.query=target.term; $('glossary-domain').value=target.domain; $('glossary-search').value=target.term; }
    }
    updateCategoryOptions();
    renderResults();
    if (state.openingId) {
      const id = state.openingId; state.openingId='';
      requestAnimationFrame(() => { document.getElementById(`term-${id}`)?.scrollIntoView({block:'center'}); openDetail(id); });
    }
  }

  document.addEventListener('DOMContentLoaded',() => init().catch(error => { console.error('[glossary] init failed',error); $('glossary-results').innerHTML=`<div class="glossary-empty">単語辞書を読み込めませんでした。${escapeHtml(error.message)}</div>`; }));
})();
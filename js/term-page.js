(() => {
  'use strict';

  const config = window.TERM_PAGE_CONFIG || {};
  const root = config.rootPath || '../';
  const subject = config.subject || '用語';
  const domain = config.pageKey || config.fallbackIdPrefix || 'term';
  const pagePath = config.pagePath || `html/${location.pathname.split('/').pop()}`;
  const fallbackPrefix = config.fallbackIdPrefix || 'term';
  const BOOKMARK_KEY = 'ap-study-bookmarks-v1';

  const state = {
    terms: [], categories: [], detailsById: new Map(), checked: new Set(), bookmarks: new Set(),
    bookmarkOnly: false, observer: null, linkRegex: null, linkByLabel: new Map(), filterFrame: 0
  };

  const $ = id => document.getElementById(id);
  const els = {
    searchInput: $('search-input'), searchCount: $('search-count'), categoryFilter: $('category-filter'), searchClear: $('search-clear'),
    filterStatus: $('filter-status'), progressNum: $('progress-num'), progressTotal: $('progress-total'), progressBar: $('progress-bar'),
    progressReset: $('progress-reset'), tocList: $('toc-list'), indexGroups: $('term-index-groups'), termSections: $('term-sections'),
    loadingArea: $('loading-area'), jsonTermCount: $('json-term-count'), jsonDetailCount: $('json-detail-count'), bookmarkFilter: null
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[ch]));
  const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const slugify = value => String(value || 'category').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').toLowerCase();
  const notify = message => window.APStudyUI?.toast?.(message);

  function readJson(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
    catch { return fallback; }
  }

  function termHref(term) { return `${pagePath}#${encodeURIComponent(term.id)}`; }
  function recordTerm(term) {
    if (!term) return;
    window.APStudyUI?.recordRecent?.({ id:term.id, term:term.term, category:term.category, domain, subject, href:termHref(term) });
  }

  async function loadJson(path) {
    const resolved = /^(https?:)?\//.test(path) || path.startsWith(root) ? path : `${root}${path}`;
    const response = await fetch(resolved, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`);
    return response.json();
  }

  function normalizeTerm(raw, index) {
    const term = raw.term || '無題';
    const aliases = Array.isArray(raw.aliases) ? raw.aliases : [];
    const category = raw.category || '未分類';
    const definition = raw.definition || '';
    return {
      id: raw.id || `${fallbackPrefix}-${String(index + 1).padStart(3, '0')}`,
      term, aliases, category, definition,
      searchable: [term, ...aliases, category, definition].join(' ').toLocaleLowerCase('ja-JP')
    };
  }

  function normalizeDetail(raw) {
    return {
      id:raw.id, term:raw.term || '', category:raw.category || '', level:raw.level || '基礎',
      beginner:raw.beginner || '', example:raw.example || '', examPoint:raw.examPoint || '', trap:raw.trap || '',
      afternoonUse:raw.afternoonUse || '', howToRemember:raw.howToRemember || '', tags:Array.isArray(raw.tags) ? raw.tags : [],
      deepDive:Array.isArray(raw.deepDive) ? raw.deepDive : [], relatedConcepts:Array.isArray(raw.relatedConcepts) ? raw.relatedConcepts : [],
      commonMistakes:Array.isArray(raw.commonMistakes) ? raw.commonMistakes : []
    };
  }

  function buildCategories(manifest) {
    const source = Array.isArray(manifest.categories) ? manifest.categories : [];
    if (source.length) {
      return source.map((cat, index) => ({
        id:cat.id || `cat-${String(index + 1).padStart(2, '0')}-${slugify(cat.title)}`,
        title:cat.title || cat.name || `カテゴリ${index + 1}`,
        description:cat.description || ''
      })).filter(cat => state.terms.some(term => term.category === cat.title));
    }
    return [...new Set(state.terms.map(term => term.category))].map((title, index) => ({
      id:`cat-${String(index + 1).padStart(2, '0')}-${slugify(title)}`, title, description:''
    }));
  }

  function generatedDetail(term) {
    const category = state.categories.find(item => item.title === term.category);
    const tip = category?.description || `${term.category}の中で役割と違いを整理する。`;
    const same = state.terms.filter(item => item.category === term.category && item.id !== term.id).slice(0, 4).map(item => item.term);
    const calculation = /O\(|計算量|EVM|PV|EV|AC|CV|SV|CPI|SPI|PERT|フロート|最早|最遅/.test(term.term);
    return normalizeDetail({
      id:term.id, term:term.term, category:term.category, level:calculation ? '標準' : '基礎',
      beginner:`${term.term}は、${term.definition} まず「何を対象に、何をする仕組みか」を一文で言えるようにする。${tip}`,
      example:`問題文で「${term.term}」が出たら、名称だけで判断せず、本文中の処理・図・数値・役割のどこが「${term.definition}」に当たるかを対応させる。`,
      examPoint:`午前では定義・特徴・似た用語との違い、午後では本文や図表への適用が中心。${tip}`,
      trap:`用語名の印象だけで選ばず、前提条件と結果を確認する。同じ「${term.category}」の用語は、目的・処理順序・対象の違いで区別する。`,
      afternoonUse:`設問を先に読み、本文中の対象へ「${term.definition}」を当てはめる。記述では用語名だけでなく、何をどうするためかまで本文の語を使って書く。`,
      howToRemember:`${term.term} = ${term.definition} この短い定義に、同カテゴリの比較対象を1つ加えて覚える。`,
      deepDive:[
        { heading:'仕組みを分解する', body:[
          `定義の中心は「${term.definition}」。主語・対象・処理・結果に分けると暗記だけになりにくい。`,
          tip,
          `迷った場合は${same.length ? same.join(' / ') : '周辺用語'}と比較し、適用条件と結果を整理する。`
        ]},
        { heading:'試験で追うポイント', body:[
          calculation ? '数値や添字は頭の中だけで処理せず、途中値を書いて1ステップずつ追う。' : '問題文の工程・役割・入力と出力を先に整理する。',
          '選択肢は「一部だけ正しい説明」に注意し、定義の条件が全部一致するかを見る。'
        ]}
      ],
      relatedConcepts:same,
      commonMistakes:[`「${term.term}」の名前だけを覚え、適用条件や結果を確認しない。`, '同じカテゴリの用語を比較せず、似た説明を感覚で選ぶ。']
    });
  }

  function validateData() {
    const ids = new Set(), names = new Set();
    for (const term of state.terms) {
      if (ids.has(term.id)) console.error(`[${subject}] duplicate term id`, term.id);
      ids.add(term.id);
      const key = term.term.toLocaleLowerCase('ja-JP');
      if (names.has(key)) console.warn(`[${subject}] duplicate term`, term.term);
      names.add(key);
      const detail = state.detailsById.get(term.id);
      if (!detail) console.warn(`[${subject}] missing detail`, term.id, term.term);
      else {
        if (detail.term && detail.term !== term.term) console.warn(`[${subject}] term mismatch`, term.id, term.term, detail.term);
        if (detail.category && detail.category !== term.category) console.warn(`[${subject}] category mismatch`, term.id, term.category, detail.category);
      }
    }
    for (const id of state.detailsById.keys()) if (!ids.has(id)) console.warn(`[${subject}] detail without term`, id);
  }

  function buildLinkIndex() {
    const labels = [];
    state.linkByLabel.clear();
    for (const term of state.terms) {
      for (const raw of [term.term, ...term.aliases]) {
        const label = String(raw || '').trim();
        if (label.length < 2) continue;
        const key = label.toLocaleLowerCase('ja-JP');
        if (state.linkByLabel.has(key)) continue;
        state.linkByLabel.set(key, { label, id:term.id });
        labels.push(label);
      }
    }
    labels.sort((a, b) => b.length - a.length);
    state.linkRegex = labels.length ? new RegExp(labels.map(escapeRegExp).join('|'), 'gi') : null;
  }

  function linkifyTerms(text) {
    const escaped = escapeHtml(text);
    if (!state.linkRegex) return escaped;
    return escaped.replace(state.linkRegex, match => {
      const hit = state.linkByLabel.get(match.toLocaleLowerCase('ja-JP'));
      return hit ? `<a class="auto-term-link" href="#${escapeHtml(hit.id)}">${escapeHtml(match)}</a>` : match;
    });
  }

  function loadChecked() {
    const stored = readJson(config.storageKey, []);
    state.checked = new Set(Array.isArray(stored) ? stored : []);
    const valid = new Set(state.terms.map(term => term.id));
    const pruned = [...state.checked].filter(id => valid.has(id));
    if (pruned.length !== state.checked.size) {
      state.checked = new Set(pruned);
      saveChecked();
    }
  }

  function saveChecked() {
    try { localStorage.setItem(config.storageKey, JSON.stringify([...state.checked])); } catch {}
  }

  function getAllBookmarks() {
    const value = window.APStudyUI?.getBookmarks?.() ?? readJson(BOOKMARK_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function loadBookmarks() {
    state.bookmarks = new Set(getAllBookmarks().filter(item => item?.domain === domain).map(item => item.id));
  }

  function saveBookmarkState(term, active) {
    const without = getAllBookmarks().filter(item => !(item?.domain === domain && item?.id === term.id));
    if (active) without.unshift({ id:term.id, term:term.term, category:term.category, domain, subject, href:termHref(term), updatedAt:Date.now() });
    if (window.APStudyUI?.saveBookmarks) window.APStudyUI.saveBookmarks(without);
    else try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(without)); } catch {}
    loadBookmarks();
    updateBookmarkUI();
  }

  function injectBookmarkFilter() {
    const row = document.querySelector('.filter-row');
    if (!row || $('bookmark-filter')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'bookmark-filter';
    button.className = 'bookmark-filter-btn';
    button.setAttribute('aria-pressed', 'false');
    row.insertBefore(button, els.filterStatus || null);
    els.bookmarkFilter = button;
  }

  function updateBookmarkUI() {
    if (els.bookmarkFilter) {
      els.bookmarkFilter.textContent = `☆ 復習リスト ${state.bookmarks.size}`;
      els.bookmarkFilter.classList.toggle('active', state.bookmarkOnly);
      els.bookmarkFilter.setAttribute('aria-pressed', String(state.bookmarkOnly));
    }
    document.querySelectorAll('.bookmark-btn').forEach(button => {
      const active = state.bookmarks.has(button.dataset.id);
      button.classList.toggle('active', active);
      button.textContent = active ? '★ 復習' : '☆ 復習';
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function renderCategoryFilter() {
    els.categoryFilter.innerHTML = '<option value="">すべてのカテゴリ</option>' + state.categories
      .map(cat => `<option value="${escapeHtml(cat.title)}">${escapeHtml(cat.title)}</option>`).join('');
  }

  function renderToc() {
    els.tocList.innerHTML = [
      '<li><a href="#word-list">単語一覧</a></li>',
      ...state.categories.map(cat => `<li><a href="#${escapeHtml(cat.id)}">${escapeHtml(cat.title)}</a></li>`)
    ].join('');
  }

  function renderIndex() {
    els.indexGroups.innerHTML = state.categories.map(cat => {
      const terms = state.terms.filter(term => term.category === cat.title);
      if (!terms.length) return '';
      return `<div class="term-group" data-category="${escapeHtml(cat.title)}"><h3>${escapeHtml(cat.title)}</h3><div class="term-grid">${terms.map(term => `<a class="term-link" href="#${escapeHtml(term.id)}" data-term-id="${escapeHtml(term.id)}" data-category="${escapeHtml(term.category)}" data-search="${escapeHtml(term.searchable)}">${escapeHtml(term.term)}</a>`).join('')}</div></div>`;
    }).join('');
  }

  function renderCard(term) {
    const detail = state.detailsById.get(term.id);
    const aliases = term.aliases.length ? `<div class="alias-list">別名・略称: ${term.aliases.map(escapeHtml).join(' / ')}</div>` : '';
    const bookmarked = state.bookmarks.has(term.id);
    return `<article class="card term-card" id="${escapeHtml(term.id)}" data-term-id="${escapeHtml(term.id)}" data-category="${escapeHtml(term.category)}" data-search="${escapeHtml(term.searchable)}">
      <div class="card-header"><h3>${escapeHtml(term.term)}</h3><div class="card-actions">
        <button class="bookmark-btn${bookmarked ? ' active' : ''}" type="button" data-action="toggle-bookmark" data-id="${escapeHtml(term.id)}" aria-pressed="${bookmarked}">${bookmarked ? '★ 復習' : '☆ 復習'}</button>
        <button class="quiz-btn" type="button" data-action="toggle-quiz">隠して確認</button>
        <button class="check-btn" type="button" data-action="toggle-check" data-id="${escapeHtml(term.id)}">✓ 習得済み</button>
      </div></div>
      <div class="term-meta"><span class="term-badge">${escapeHtml(term.category)}</span><span class="term-badge level-badge">${escapeHtml(detail?.level || '基礎')}</span></div>
      ${aliases}<div class="card-body"><p class="definition">${escapeHtml(term.definition)}</p>
      <button class="quiz-btn" type="button" data-action="toggle-detail" data-id="${escapeHtml(term.id)}">詳細解説を見る</button>
      <div class="term-detail-panel" id="detail-${escapeHtml(term.id)}" hidden data-rendered="false"></div></div>
      <a class="back-to-word-list" href="#word-list">単語一覧へ戻る</a></article>`;
  }

  function renderSections() {
    els.termSections.innerHTML = state.categories.map(cat => {
      const terms = state.terms.filter(term => term.category === cat.title);
      if (!terms.length) return '';
      return `<section class="section term-section" id="${escapeHtml(cat.id)}" data-category="${escapeHtml(cat.title)}"><div class="container"><h2>${escapeHtml(cat.title)}</h2>${cat.description ? `<p class="term-index-lead">${escapeHtml(cat.description)}</p>` : ''}${terms.map(renderCard).join('')}</div></section>`;
    }).join('');
  }

  function renderDetail(id) {
    const panel = $(`detail-${id}`);
    if (!panel || panel.dataset.rendered === 'true') return;
    const detail = state.detailsById.get(id);
    if (!detail) {
      panel.innerHTML = '<p>詳細解説はまだ登録されていません。</p>';
      panel.dataset.rendered = 'true';
      return;
    }
    const rows = [
      ['まずここから', detail.beginner], ['具体例', detail.example], ['試験での見方', detail.examPoint],
      ['ひっかけ', detail.trap], ['午後問題での使い方', detail.afternoonUse], ['覚え方', detail.howToRemember]
    ].filter(([, value]) => value);
    const base = rows.map(([label, value]) => `<p><strong>${escapeHtml(label)}：</strong>${linkifyTerms(value)}</p>`).join('');
    const deep = detail.deepDive.map(block => `<div class="explain-block"><h4>${escapeHtml(block.heading || '深掘り')}</h4>${(block.body || []).map(p => `<p>${linkifyTerms(p)}</p>`).join('')}</div>`).join('');
    const mistakes = detail.commonMistakes.length ? `<div class="checklist"><strong>よくあるミス</strong><ul>${detail.commonMistakes.map(x => `<li>${linkifyTerms(x)}</li>`).join('')}</ul></div>` : '';
    const related = detail.relatedConcepts.length ? `<div class="related-concepts"><strong>関連：</strong>${detail.relatedConcepts.map(x => linkifyTerms(x)).join(' / ')}</div>` : '';
    panel.innerHTML = base + deep + mistakes + related;
    panel.dataset.rendered = 'true';
  }

  function renderAll() {
    renderCategoryFilter(); renderToc(); renderIndex(); renderSections(); injectBookmarkFilter(); updateBookmarkUI();
    els.loadingArea.hidden = true;
    els.jsonTermCount.textContent = state.terms.length;
    els.jsonDetailCount.textContent = state.detailsById.size;
  }

  function updateProgress() {
    els.progressTotal.textContent = state.terms.length;
    els.progressNum.textContent = state.checked.size;
    els.progressBar.style.width = state.terms.length ? `${Math.round(state.checked.size / state.terms.length * 100)}%` : '0%';
  }

  function restoreProgress() {
    loadChecked();
    document.querySelectorAll('.term-card').forEach(card => {
      const active = state.checked.has(card.dataset.termId);
      card.classList.toggle('is-checked', active);
      card.querySelector('.check-btn')?.classList.toggle('active', active);
    });
    updateProgress();
  }

  function applyFiltersNow() {
    const query = els.searchInput.value.trim().toLocaleLowerCase('ja-JP');
    const category = els.categoryFilter.value;
    let visible = 0;
    document.querySelectorAll('.term-card').forEach(card => {
      const show = (!query || (card.dataset.search || '').includes(query)) && (!category || card.dataset.category === category) && (!state.bookmarkOnly || state.bookmarks.has(card.dataset.termId));
      card.hidden = !show;
      if (show) visible += 1;
    });
    document.querySelectorAll('.term-link').forEach(link => {
      link.hidden = !((!query || (link.dataset.search || '').includes(query)) && (!category || link.dataset.category === category) && (!state.bookmarkOnly || state.bookmarks.has(link.dataset.termId)));
    });
    document.querySelectorAll('.term-section').forEach(section => { section.hidden = !section.querySelector('.term-card:not([hidden])'); });
    document.querySelectorAll('.term-group').forEach(group => { group.hidden = !group.querySelector('.term-link:not([hidden])'); });
    const filtered = Boolean(query || category || state.bookmarkOnly);
    els.searchCount.hidden = !filtered;
    els.searchCount.textContent = `${visible} / ${state.terms.length} 語`;
    els.filterStatus.textContent = state.bookmarkOnly ? `復習リスト ${visible}件表示中` : filtered ? `${visible}件表示中` : `${state.terms.length}語を表示中`;
  }

  function scheduleFilters() {
    cancelAnimationFrame(state.filterFrame);
    state.filterFrame = requestAnimationFrame(applyFiltersNow);
  }

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1) || '');
    if (!id || id === 'word-list' || id === 'exam-guide') return;
    const card = $(id);
    if (!card?.classList.contains('term-card')) return;
    if (card.hidden || card.closest('.term-section')?.hidden) {
      els.searchInput.value = ''; els.categoryFilter.value = ''; state.bookmarkOnly = false; updateBookmarkUI(); applyFiltersNow();
    }
    renderDetail(id);
    const panel = $(`detail-${id}`);
    if (panel) panel.hidden = false;
    const button = card.querySelector('[data-action="toggle-detail"]');
    if (button) button.textContent = '詳細解説を隠す';
    document.querySelectorAll('.term-card.is-linked-target').forEach(el => el.classList.remove('is-linked-target'));
    card.classList.add('is-linked-target');
    recordTerm(state.terms.find(item => item.id === id));
    requestAnimationFrame(() => card.scrollIntoView({ behavior:'smooth', block:'start' }));
  }

  function bindEvents() {
    els.searchInput.addEventListener('input', scheduleFilters);
    els.categoryFilter.addEventListener('change', applyFiltersNow);
    els.searchClear.addEventListener('click', () => {
      els.searchInput.value = ''; els.categoryFilter.value = ''; state.bookmarkOnly = false; updateBookmarkUI(); applyFiltersNow(); els.searchInput.focus();
    });
    els.progressReset.addEventListener('click', () => {
      if (!confirm(`${subject}の習得済みチェックをリセットしますか？`)) return;
      state.checked.clear(); saveChecked(); restoreProgress(); notify('習得済みチェックをリセットしました');
    });
    window.addEventListener('hashchange', openFromHash);
    document.addEventListener('click', event => {
      if (event.target.closest('#bookmark-filter')) {
        state.bookmarkOnly = !state.bookmarkOnly; updateBookmarkUI(); applyFiltersNow(); return;
      }
      const bookmark = event.target.closest('[data-action="toggle-bookmark"]');
      if (bookmark) {
        const term = state.terms.find(item => item.id === bookmark.dataset.id);
        if (!term) return;
        const active = !state.bookmarks.has(term.id);
        saveBookmarkState(term, active); recordTerm(term); notify(active ? '復習リストに追加しました' : '復習リストから外しました');
        if (state.bookmarkOnly) applyFiltersNow();
        return;
      }
      const quiz = event.target.closest('[data-action="toggle-quiz"]');
      if (quiz) {
        const card = quiz.closest('.term-card'), body = card?.querySelector('.card-body');
        if (body) { body.classList.toggle('quiz-hidden'); quiz.textContent = body.classList.contains('quiz-hidden') ? '答えを見る' : '隠して確認'; recordTerm(state.terms.find(item => item.id === card.dataset.termId)); }
        return;
      }
      const detailButton = event.target.closest('[data-action="toggle-detail"]');
      if (detailButton) {
        const id = detailButton.dataset.id, panel = $(`detail-${id}`);
        if (!panel) return;
        const show = panel.hidden;
        if (show) renderDetail(id);
        panel.hidden = !show;
        detailButton.textContent = show ? '詳細解説を隠す' : '詳細解説を見る';
        if (show) recordTerm(state.terms.find(item => item.id === id));
        return;
      }
      const check = event.target.closest('[data-action="toggle-check"]');
      if (check) {
        const id = check.dataset.id;
        if (state.checked.has(id)) state.checked.delete(id); else state.checked.add(id);
        saveChecked();
        const active = state.checked.has(id), card = check.closest('.term-card');
        card?.classList.toggle('is-checked', active); check.classList.toggle('active', active); updateProgress();
        recordTerm(state.terms.find(item => item.id === id)); notify(active ? '習得済みにしました' : '習得済みを解除しました');
      }
    });
  }

  function setupObserver() {
    state.observer?.disconnect();
    const links = [...document.querySelectorAll('#toc-list a[href^="#"]')];
    const byId = new Map(links.map(link => [link.getAttribute('href').slice(1), link]));
    state.observer = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (!visible) return;
      links.forEach(link => link.classList.remove('is-active'));
      byId.get(visible.target.id)?.classList.add('is-active');
    }, { rootMargin:'-32% 0px -60% 0px', threshold:.01 });
    document.querySelectorAll('.term-section, #word-list, #exam-guide').forEach(section => state.observer.observe(section));
  }

  async function loadData() {
    const termManifest = await loadJson(config.termsManifest);
    const termPayloads = await Promise.all((termManifest.files || []).map(item => loadJson(item.file)));
    state.terms = termPayloads.flatMap(payload => payload.terms || []).map(normalizeTerm);
    state.categories = buildCategories(termManifest);

    let details = [];
    if (config.detailsManifest) {
      const detailManifest = await loadJson(config.detailsManifest);
      const detailPayloads = await Promise.all((detailManifest.files || []).map(item => loadJson(item.file)));
      details = detailPayloads.flatMap(payload => payload.details || []).map(normalizeDetail).filter(item => item.id);
    }
    state.detailsById = new Map(details.map(item => [item.id, item]));
    if (config.generateDetails || !config.detailsManifest) {
      for (const term of state.terms) if (!state.detailsById.has(term.id)) state.detailsById.set(term.id, generatedDetail(term));
    }

    loadBookmarks(); buildLinkIndex(); validateData();
  }

  async function init() {
    if (!config.termsManifest || !config.storageKey) {
      console.error('TERM_PAGE_CONFIG is incomplete', config);
      return;
    }
    bindEvents();
    try {
      await loadData(); renderAll(); restoreProgress(); applyFiltersNow(); setupObserver();
      if (new URLSearchParams(location.search).get('bookmarks') === '1') { state.bookmarkOnly = true; updateBookmarkUI(); applyFiltersNow(); }
      openFromHash();
    } catch (error) {
      console.error(error);
      els.loadingArea.hidden = false;
      els.loadingArea.innerHTML = `<div class="container"><div class="term-error"><strong>学習データの読み込みに失敗しました。</strong><br>GitHub PagesまたはLive Server経由で開いてください。<br>詳細: ${escapeHtml(error.message)}</div></div>`;
      els.filterStatus.textContent = '読み込み失敗'; els.jsonTermCount.textContent = '失敗'; els.jsonDetailCount.textContent = '失敗';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
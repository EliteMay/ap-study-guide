(() => {
  'use strict';

  const config = window.TERM_PAGE_CONFIG || {};
  const root = config.rootPath || '../';
  const subject = config.subject || '用語';
  const fallbackPrefix = config.fallbackIdPrefix || 'term';

  const state = {
    terms: [],
    categories: [],
    detailsById: new Map(),
    checked: new Set(),
    observer: null,
    linkRegex: null,
    linkByLabel: new Map(),
    filterFrame: 0
  };

  const els = {
    searchInput: document.getElementById('search-input'),
    searchCount: document.getElementById('search-count'),
    categoryFilter: document.getElementById('category-filter'),
    searchClear: document.getElementById('search-clear'),
    filterStatus: document.getElementById('filter-status'),
    progressNum: document.getElementById('progress-num'),
    progressTotal: document.getElementById('progress-total'),
    progressBar: document.getElementById('progress-bar'),
    progressReset: document.getElementById('progress-reset'),
    tocList: document.getElementById('toc-list'),
    indexGroups: document.getElementById('term-index-groups'),
    termSections: document.getElementById('term-sections'),
    loadingArea: document.getElementById('loading-area'),
    jsonTermCount: document.getElementById('json-term-count'),
    jsonDetailCount: document.getElementById('json-detail-count')
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function slugify(value) {
    return String(value || 'category').trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  async function loadJson(path) {
    const resolved = /^(https?:)?\//.test(path) || path.startsWith(root) ? path : `${root}${path}`;
    const response = await fetch(resolved, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`);
    return response.json();
  }

  function normalizeTerm(raw, index) {
    const id = raw.id || `${fallbackPrefix}-${String(index + 1).padStart(3, '0')}`;
    const aliases = Array.isArray(raw.aliases) ? raw.aliases : [];
    const category = raw.category || '未分類';
    const term = raw.term || '無題';
    const definition = raw.definition || '';
    return {
      id, term, aliases, category, definition,
      searchable: [term, ...aliases, category, definition].join(' ').toLocaleLowerCase('ja-JP')
    };
  }

  function normalizeDetail(raw) {
    return {
      id: raw.id,
      term: raw.term || '',
      category: raw.category || '',
      beginner: raw.beginner || '',
      example: raw.example || '',
      examPoint: raw.examPoint || '',
      trap: raw.trap || '',
      level: raw.level || '基礎',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      deepDive: Array.isArray(raw.deepDive) ? raw.deepDive : [],
      relatedConcepts: Array.isArray(raw.relatedConcepts) ? raw.relatedConcepts : [],
      commonMistakes: Array.isArray(raw.commonMistakes) ? raw.commonMistakes : [],
      afternoonUse: raw.afternoonUse || '',
      howToRemember: raw.howToRemember || ''
    };
  }

  function buildCategories(manifest) {
    const source = Array.isArray(manifest.categories) ? manifest.categories : [];
    if (source.length) {
      return source.map((cat, index) => ({
        id: cat.id || `cat-${String(index + 1).padStart(2, '0')}-${slugify(cat.title)}`,
        title: cat.title || cat.name || `カテゴリ${index + 1}`,
        description: cat.description || ''
      })).filter(cat => state.terms.some(term => term.category === cat.title));
    }
    return [...new Set(state.terms.map(term => term.category))].map((title, index) => ({
      id: `cat-${String(index + 1).padStart(2, '0')}-${slugify(title)}`,
      title,
      description: ''
    }));
  }

  function validateData() {
    const ids = new Set();
    const names = new Set();
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
    for (const id of state.detailsById.keys()) {
      if (!ids.has(id)) console.warn(`[${subject}] detail without term`, id);
    }
  }

  function buildLinkIndex() {
    const labels = [];
    state.linkByLabel.clear();
    for (const term of state.terms) {
      for (const raw of [term.term, ...term.aliases]) {
        const label = String(raw || '').trim();
        if (label.length < 2) continue;
        const key = label.toLocaleLowerCase('ja-JP');
        if (!state.linkByLabel.has(key)) {
          state.linkByLabel.set(key, { label, id: term.id });
          labels.push(label);
        }
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
    try {
      const parsed = JSON.parse(localStorage.getItem(config.storageKey) || '[]');
      state.checked = new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      state.checked = new Set();
    }
    const valid = new Set(state.terms.map(term => term.id));
    const pruned = [...state.checked].filter(id => valid.has(id));
    if (pruned.length !== state.checked.size) {
      state.checked = new Set(pruned);
      saveChecked();
    }
  }

  function saveChecked() {
    localStorage.setItem(config.storageKey, JSON.stringify([...state.checked]));
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
      return `<div class="term-group" data-category="${escapeHtml(cat.title)}">
        <h3>${escapeHtml(cat.title)}</h3>
        <div class="term-grid">${terms.map(term => `<a class="term-link" href="#${escapeHtml(term.id)}" data-category="${escapeHtml(term.category)}" data-search="${escapeHtml(term.searchable)}">${escapeHtml(term.term)}</a>`).join('')}</div>
      </div>`;
    }).join('');
  }

  function renderCard(term) {
    const detail = state.detailsById.get(term.id);
    const aliases = term.aliases.length ? `<div class="alias-list">別名・略称: ${term.aliases.map(escapeHtml).join(' / ')}</div>` : '';
    return `<article class="card term-card" id="${escapeHtml(term.id)}" data-term-id="${escapeHtml(term.id)}" data-category="${escapeHtml(term.category)}" data-search="${escapeHtml(term.searchable)}">
      <div class="card-header">
        <h3>${escapeHtml(term.term)}</h3>
        <div class="card-actions">
          <button class="quiz-btn" type="button" data-action="toggle-quiz">隠して確認</button>
          <button class="check-btn" type="button" data-action="toggle-check" data-id="${escapeHtml(term.id)}">✓ 習得済み</button>
        </div>
      </div>
      <div class="term-meta"><span class="term-badge">${escapeHtml(term.category)}</span><span class="term-badge level-badge">${escapeHtml(detail?.level || '基礎')}</span></div>
      ${aliases}
      <div class="card-body">
        <p class="definition">${escapeHtml(term.definition)}</p>
        <button class="quiz-btn" type="button" data-action="toggle-detail" data-id="${escapeHtml(term.id)}">詳細解説を見る</button>
        <div class="term-detail-panel" id="detail-${escapeHtml(term.id)}" hidden data-rendered="false"></div>
      </div>
      <a class="back-to-word-list" href="#word-list">単語一覧へ戻る</a>
    </article>`;
  }

  function renderSections() {
    els.termSections.innerHTML = state.categories.map(cat => {
      const terms = state.terms.filter(term => term.category === cat.title);
      if (!terms.length) return '';
      return `<section class="section term-section" id="${escapeHtml(cat.id)}" data-category="${escapeHtml(cat.title)}">
        <div class="container"><h2>${escapeHtml(cat.title)}</h2>${cat.description ? `<p class="term-index-lead">${escapeHtml(cat.description)}</p>` : ''}${terms.map(renderCard).join('')}</div>
      </section>`;
    }).join('');
  }

  function renderDetail(id) {
    const panel = document.getElementById(`detail-${CSS.escape(id)}`);
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
    panel.innerHTML = base + deep + mistakes + related || '<p>詳細解説はまだ登録されていません。</p>';
    panel.dataset.rendered = 'true';
  }

  function renderAll() {
    renderCategoryFilter();
    renderToc();
    renderIndex();
    renderSections();
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
      const show = (!query || (card.dataset.search || '').includes(query)) && (!category || card.dataset.category === category);
      card.hidden = !show;
      if (show) visible += 1;
    });
    document.querySelectorAll('.term-link').forEach(link => {
      link.hidden = !((!query || (link.dataset.search || '').includes(query)) && (!category || link.dataset.category === category));
    });
    document.querySelectorAll('.term-section').forEach(section => { section.hidden = !section.querySelector('.term-card:not([hidden])'); });
    document.querySelectorAll('.term-group').forEach(group => { group.hidden = !group.querySelector('.term-link:not([hidden])'); });
    const filtered = Boolean(query || category);
    els.searchCount.hidden = !filtered;
    els.searchCount.textContent = `${visible} / ${state.terms.length} 語`;
    els.filterStatus.textContent = filtered ? `${visible}件表示中` : `${state.terms.length}語を表示中`;
  }

  function scheduleFilters() {
    cancelAnimationFrame(state.filterFrame);
    state.filterFrame = requestAnimationFrame(applyFiltersNow);
  }

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1) || '');
    if (!id || id === 'word-list' || id === 'exam-guide') return;
    const card = document.getElementById(id);
    if (!card?.classList.contains('term-card')) return;
    if (card.hidden || card.closest('.term-section')?.hidden) {
      els.searchInput.value = '';
      els.categoryFilter.value = '';
      applyFiltersNow();
    }
    renderDetail(id);
    const panel = document.getElementById(`detail-${CSS.escape(id)}`);
    if (panel) panel.hidden = false;
    const button = card.querySelector('[data-action="toggle-detail"]');
    if (button) button.textContent = '詳細解説を隠す';
    document.querySelectorAll('.term-card.is-linked-target').forEach(el => el.classList.remove('is-linked-target'));
    card.classList.add('is-linked-target');
    requestAnimationFrame(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function bindEvents() {
    els.searchInput.addEventListener('input', scheduleFilters);
    els.categoryFilter.addEventListener('change', applyFiltersNow);
    els.searchClear.addEventListener('click', () => {
      els.searchInput.value = '';
      els.categoryFilter.value = '';
      applyFiltersNow();
      els.searchInput.focus();
    });
    els.progressReset.addEventListener('click', () => {
      if (!confirm(`${subject}の習得済みチェックをリセットしますか？`)) return;
      state.checked.clear();
      saveChecked();
      restoreProgress();
    });
    window.addEventListener('hashchange', openFromHash);
    document.addEventListener('click', event => {
      const quiz = event.target.closest('[data-action="toggle-quiz"]');
      if (quiz) {
        const body = quiz.closest('.term-card')?.querySelector('.card-body');
        if (body) {
          body.classList.toggle('quiz-hidden');
          quiz.textContent = body.classList.contains('quiz-hidden') ? '答えを見る' : '隠して確認';
        }
        return;
      }
      const detailButton = event.target.closest('[data-action="toggle-detail"]');
      if (detailButton) {
        const id = detailButton.dataset.id;
        const panel = document.getElementById(`detail-${CSS.escape(id)}`);
        if (!panel) return;
        const show = panel.hidden;
        if (show) renderDetail(id);
        panel.hidden = !show;
        detailButton.textContent = show ? '詳細解説を隠す' : '詳細解説を見る';
        return;
      }
      const check = event.target.closest('[data-action="toggle-check"]');
      if (check) {
        const id = check.dataset.id;
        if (state.checked.has(id)) state.checked.delete(id); else state.checked.add(id);
        saveChecked();
        const card = check.closest('.term-card');
        card?.classList.toggle('is-checked', state.checked.has(id));
        check.classList.toggle('active', state.checked.has(id));
        updateProgress();
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
    }, { rootMargin: '-32% 0px -60% 0px', threshold: 0.01 });
    document.querySelectorAll('.term-section, #word-list, #exam-guide').forEach(section => state.observer.observe(section));
  }

  async function loadData() {
    const [termManifest, detailManifest] = await Promise.all([
      loadJson(config.termsManifest),
      loadJson(config.detailsManifest)
    ]);
    const [termPayloads, detailPayloads] = await Promise.all([
      Promise.all((termManifest.files || []).map(item => loadJson(item.file))),
      Promise.all((detailManifest.files || []).map(item => loadJson(item.file)))
    ]);
    state.terms = termPayloads.flatMap(payload => payload.terms || []).map(normalizeTerm);
    state.detailsById = new Map(detailPayloads.flatMap(payload => payload.details || []).map(normalizeDetail).filter(x => x.id).map(x => [x.id, x]));
    state.categories = buildCategories(termManifest);
    buildLinkIndex();
    validateData();
  }

  async function init() {
    if (!config.termsManifest || !config.detailsManifest || !config.storageKey) {
      console.error('TERM_PAGE_CONFIG is incomplete', config);
      return;
    }
    bindEvents();
    try {
      await loadData();
      renderAll();
      restoreProgress();
      applyFiltersNow();
      setupObserver();
      openFromHash();
    } catch (error) {
      console.error(error);
      els.loadingArea.hidden = false;
      els.loadingArea.innerHTML = `<div class="container"><div class="term-error"><strong>学習データの読み込みに失敗しました。</strong><br>GitHub PagesまたはLive Server経由で開いてください。<br>詳細: ${escapeHtml(error.message)}</div></div>`;
      els.filterStatus.textContent = '読み込み失敗';
      els.jsonTermCount.textContent = '失敗';
      els.jsonDetailCount.textContent = '失敗';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

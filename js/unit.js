(() => {
  'use strict';

  const LESSON_PROGRESS_KEY = 'ap-study-lesson-progress-v1';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const params = new URLSearchParams(location.search);
  const unitId = params.get('unit') || '';
  const displayText = value => window.APLearningLanguage?.localizeText?.(value) ?? String(value ?? '');
  const GLOSSARY_DOMAINS = {
    'algorithm-programming':'algorithm', database:'database', network:'network', security:'security',
    'system-development':'system', 'project-management':'management'
  };
  const detailCache = new Map();

  async function loadJson(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadLessonDetail(entry) {
    if (detailCache.has(entry.file)) return detailCache.get(entry.file);
    const promise = loadJson(entry.file).catch(error => {
      console.warn('[unit] lesson detail unavailable', entry.id, error);
      return null;
    });
    detailCache.set(entry.file,promise);
    return promise;
  }

  function readProgress() { return window.APStudyState?.readObject?.(LESSON_PROGRESS_KEY) || {}; }
  function applyCoverage(curriculum, coverage) {
    const overrides = coverage?.overrides || {};
    return { ...curriculum, studyUnits:(curriculum.studyUnits || []).map(unit => ({ ...unit, ...(overrides[unit.id] || {}) })) };
  }
  function middleMap(curriculum) { return new Map((curriculum.middleCategories || []).map(item => [Number(item.code), item])); }
  function stateFor(progress, lessonId) {
    return window.APStudyState?.lessonState?.(progress[lessonId]) || { state:progress[lessonId]?.completed ? 'mastered' : 'unattempted', label:progress[lessonId]?.completed ? '理解確認済み' : '未着手', mastered:Boolean(progress[lessonId]?.completed) };
  }
  function stateClass(state) {
    if (state.mastered) return 'is-mastered';
    if (state.state === 'due') return 'is-due';
    return state.state === 'retry' ? 'is-retry' : 'is-unattempted';
  }
  function excerpt(value, max = 118) {
    const text = displayText(value).replace(/\s+/g,' ').trim();
    if (!text) return 'このレッスンの解説・例題・確認問題を順番に進めます。';
    return text.length > max ? `${text.slice(0,max)}…` : text;
  }

  function renderHero(unit, lessons, progress) {
    const mastered = lessons.filter(lesson => stateFor(progress, lesson.id).mastered).length;
    const due = lessons.filter(lesson => stateFor(progress, lesson.id).state === 'due').length;
    const next = lessons.find(lesson => {
      const state = stateFor(progress, lesson.id);
      return state.state === 'due' || !state.mastered;
    }) || lessons[0];
    document.title = `${displayText(unit.title)} | AP Study Notes`;
    const glossaryDomain = GLOSSARY_DOMAINS[unit.id];
    const middleLabel = (unit.officialMiddleCodes || []).map(code => `IPA中分類 ${code}`).join('・');
    document.getElementById('unit-hero').innerHTML = `
      <p class="unit-breadcrumb"><a href="roadmap.html">13ユニット</a><span>/</span><span>${escapeHtml(displayText(unit.title))}</span></p>
      <p class="eyebrow">学習ユニット${middleLabel ? ` / ${escapeHtml(middleLabel)}` : ''}</p>
      <h1>${escapeHtml(displayText(unit.title))}</h1>
      <p class="lead">この分野は${lessons.length}本のレッスンで、基礎から順に学びます。タイトルだけを暗記せず、各レッスンの説明と具体例を読んでから問題へ進んでください。</p>
      <div class="unit-hero-status"><span><strong>${mastered}</strong> / ${lessons.length} レッスン理解確認</span>${due ? `<span class="is-due">復習期限 ${due}</span>` : '<span>復習期限なし</span>'}</div>
      <div class="unit-hero-actions">
        ${next ? `<a class="unit-action is-primary" href="lesson.html?id=${encodeURIComponent(next.id)}">${due ? '復習から続ける' : mastered ? '次のレッスンへ' : '最初のレッスンから始める'} <span>→</span></a>` : ''}
        <a class="unit-action" href="practice.html?unit=${encodeURIComponent(unit.id)}">短問演習</a>
        <a class="unit-action" href="cases.html?unit=${encodeURIComponent(unit.id)}">長文問題</a>
        ${glossaryDomain ? `<a class="unit-action" href="glossary.html?domain=${encodeURIComponent(glossaryDomain)}">単語辞書</a>` : '<a class="unit-action" href="glossary.html">単語辞書</a>'}
      </div>`;
  }

  function renderLessonCard(lesson, detail, state, position) {
    const intro = excerpt(detail?.intro);
    const minutes = Number(detail?.meta?.estimatedMinutes || 0);
    const beginner = detail?.beginner ? '<span>初心者向け解説あり</span>' : '<span>解説・例題・確認問題</span>';
    return `<a class="unit-lesson-card ${stateClass(state)}" href="lesson.html?id=${encodeURIComponent(lesson.id)}">
      <span class="unit-lesson-order" aria-hidden="true">${String(position).padStart(2,'0')}</span>
      <span class="unit-lesson-copy">
        <span class="unit-lesson-title-row"><strong>${escapeHtml(lesson.id)} ${escapeHtml(displayText(lesson.title))}</strong><span class="unit-lesson-state">${escapeHtml(state.label)}</span></span>
        <span class="unit-lesson-description">${escapeHtml(intro)}</span>
        <span class="unit-lesson-meta">${beginner}${minutes ? `<span>目安 ${minutes}分</span>` : ''}</span>
      </span>
      <span class="unit-lesson-arrow" aria-hidden="true">→</span>
    </a>`;
  }

  async function render(curriculum, lessons) {
    const unit = (curriculum.studyUnits || []).find(item => item.id === unitId);
    if (!unit) throw new Error(`学習ユニット ${unitId || '(未指定)'} が見つかりません。`);
    const middleByCode = middleMap(curriculum);
    const unitLessons = lessons.filter(item => item.unitId === unit.id).sort((a,b) => Number(a.order) - Number(b.order));
    const details = new Map();
    await Promise.all(unitLessons.map(async lesson => details.set(lesson.id, await loadLessonDetail(lesson))));
    const lessonPosition = new Map(unitLessons.map((lesson,index) => [lesson.id,index + 1]));
    const progress = readProgress();
    const mastered = unitLessons.filter(lesson => stateFor(progress, lesson.id).mastered).length;
    const due = unitLessons.filter(lesson => stateFor(progress, lesson.id).state === 'due').length;
    const pct = unitLessons.length ? Math.round(mastered / unitLessons.length * 100) : 0;

    renderHero(unit, unitLessons, progress);
    document.getElementById('unit-summary').innerHTML = `
      <div class="unit-summary-metric"><strong>${unitLessons.length}</strong><span>レッスン</span></div>
      <div class="unit-summary-metric"><strong>${mastered}</strong><span>理解確認済み</span></div>
      <div class="unit-summary-metric"><strong>${due}</strong><span>復習期限</span></div>
      <div class="unit-summary-metric"><strong>${(unit.officialMiddleCodes || []).length}</strong><span>IPA中分類</span></div>
      <div class="unit-overall-progress"><div><strong>ユニット進捗</strong><span>${mastered} / ${unitLessons.length} レッスン · ${pct}%</span></div><div class="unit-progress-track" aria-label="ユニット進捗 ${pct}%"><span style="width:${pct}%"></span></div></div>`;

    document.getElementById('unit-groups').innerHTML = (unit.officialMiddleCodes || []).map(code => {
      const middle = middleByCode.get(Number(code));
      const middleLessons = unitLessons.filter(lesson => (lesson.officialMiddleCodes || []).map(Number).includes(Number(code)));
      const middleMastered = middleLessons.filter(lesson => stateFor(progress, lesson.id).mastered).length;
      const description = (middle?.small || []).map(item => escapeHtml(displayText(item))).join(' / ');
      return `<section class="unit-hub-group">
        <div class="unit-hub-heading">
          <div><p class="unit-hub-kicker">IPA中分類 ${escapeHtml(code)}</p><h2>${escapeHtml(displayText(middle?.title || `中分類${code}`))}</h2>${description ? `<p class="unit-hub-description">${description}</p>` : ''}</div>
          <span class="unit-hub-progress">${middleMastered} / ${middleLessons.length} 理解確認</span>
        </div>
        ${middleLessons.length ? `<div class="unit-lesson-list">${middleLessons.map(lesson => renderLessonCard(lesson, details.get(lesson.id), stateFor(progress, lesson.id), lessonPosition.get(lesson.id))).join('')}</div>` : '<div class="unit-hub-empty">この中分類のレッスンはまだありません。</div>'}
      </section>`;
    }).join('');
  }

  async function init() {
    try {
      if (!window.APLessonData?.load) throw new Error('教材一覧を読み込めませんでした。');
      const [curriculum, coverage, lessonBank] = await Promise.all([
        loadJson('json/curriculum/ap-2026-map.json'),
        loadJson('json/curriculum/ap-2026-coverage.json'),
        window.APLessonData.load('../')
      ]);
      await render(applyCoverage(curriculum, coverage), lessonBank.lessons || []);
    } catch (error) {
      console.error(error);
      document.getElementById('unit-hero').innerHTML = `<p class="eyebrow">学習ユニット</p><h1>読み込みエラー</h1><p class="lead">${escapeHtml(error.message)}</p><div class="unit-hero-actions"><a class="unit-action is-primary" href="roadmap.html">13ユニットへ戻る</a></div>`;
      document.getElementById('unit-summary').replaceChildren();
      document.getElementById('unit-groups').innerHTML = '<div class="unit-load-error"><strong>学習ユニットを表示できませんでした。</strong><p>通信状態を確認して再読み込みするか、13ユニット一覧へ戻ってください。</p><a href="roadmap.html">13ユニットへ戻る →</a></div>';
    }
  }

  window.addEventListener('storage', event => { if (event.key === LESSON_PROGRESS_KEY) init(); });
  document.addEventListener('ap-lesson-progress-changed', init);
  document.addEventListener('DOMContentLoaded', init);
})();
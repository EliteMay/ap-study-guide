(() => {
  'use strict';

  const LESSON_PROGRESS_KEY = 'ap-study-lesson-progress-v1';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const params = new URLSearchParams(location.search);
  const unitId = params.get('unit') || '';
  const GLOSSARY_DOMAINS = {
    'algorithm-programming':'algorithm',
    database:'database',
    network:'network',
    security:'security',
    'system-development':'system',
    'project-management':'management'
  };
  const CONTENT_TYPE_LABELS = {
    concept:'概念',
    text:'解説',
    calculation:'計算',
    diagram:'図解',
    comparison:'比較',
    'code-trace':'コード追跡',
    exercise:'演習',
    'worked-example':'例題',
    steps:'手順',
    mistakes:'つまずき対策',
    reference:'参照'
  };

  async function loadJson(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
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
  function contentTypeLabel(type) {
    const normalized = String(type || '').trim();
    return CONTENT_TYPE_LABELS[normalized] || normalized.replace(/-/g, ' ');
  }
  function stateClass(state) {
    if (state.mastered) return 'is-mastered';
    if (state.state === 'due') return 'is-due';
    return state.state === 'retry' ? 'is-retry' : 'is-unattempted';
  }

  function renderHero(unit, lessons, progress) {
    const mastered = lessons.filter(lesson => stateFor(progress, lesson.id).mastered).length;
    const due = lessons.filter(lesson => stateFor(progress, lesson.id).state === 'due').length;
    const next = lessons.find(lesson => {
      const state = stateFor(progress, lesson.id);
      return state.state === 'due' || !state.mastered;
    }) || lessons[0];
    document.title = `${unit.title} | AP Study Notes`;
    const glossaryDomain = GLOSSARY_DOMAINS[unit.id];
    const middleLabel = (unit.officialMiddleCodes || []).map(code => `IPA 中分類 ${code}`).join('・');
    document.getElementById('unit-hero').innerHTML = `
      <p class="unit-breadcrumb"><a href="roadmap.html">13ユニット</a><span>/</span><span>${escapeHtml(unit.title)}</span></p>
      <p class="eyebrow">学習ユニット${middleLabel ? ` / ${escapeHtml(middleLabel)}` : ''}</p>
      <h1>${escapeHtml(unit.title)}</h1>
      <p class="lead">この分野は${lessons.length}本のLessonで学びます。上から順に理解し、短問と長文Caseで知識を使えるか確認していきます。</p>
      <div class="unit-hero-status"><span><strong>${mastered}</strong> / ${lessons.length} Lesson理解確認</span>${due ? `<span class="is-due">復習期限 ${due}</span>` : '<span>復習期限なし</span>'}</div>
      <div class="unit-hero-actions">
        ${next ? `<a class="unit-action is-primary" href="lesson.html?id=${encodeURIComponent(next.id)}">${due ? '復習から続ける' : mastered ? '次のLessonへ' : '最初のLessonから始める'} <span>→</span></a>` : ''}
        <a class="unit-action" href="practice.html?unit=${encodeURIComponent(unit.id)}">短問</a>
        <a class="unit-action" href="cases.html?unit=${encodeURIComponent(unit.id)}">長文Case</a>
        ${glossaryDomain ? `<a class="unit-action" href="glossary.html?domain=${encodeURIComponent(glossaryDomain)}">単語辞書</a>` : '<a class="unit-action" href="glossary.html">単語辞書</a>'}
      </div>`;
  }

  function renderLessonCard(lesson, state, position) {
    const types = (lesson.contentTypes || []).map(type => `<span>${escapeHtml(contentTypeLabel(type))}</span>`).join('');
    return `<a class="unit-lesson-card ${stateClass(state)}" href="lesson.html?id=${encodeURIComponent(lesson.id)}">
      <span class="unit-lesson-order" aria-hidden="true">${String(position).padStart(2,'0')}</span>
      <span class="unit-lesson-copy">
        <span class="unit-lesson-title-row"><strong>${escapeHtml(lesson.id)} ${escapeHtml(lesson.title)}</strong><span class="unit-lesson-state">${escapeHtml(state.label)}</span></span>
        <span class="unit-lesson-types">${types || '<span>解説</span>'}</span>
      </span>
      <span class="unit-lesson-arrow" aria-hidden="true">→</span>
    </a>`;
  }

  function render(curriculum, lessons) {
    const unit = (curriculum.studyUnits || []).find(item => item.id === unitId);
    if (!unit) throw new Error(`学習ユニット ${unitId || '(未指定)'} が見つかりません。`);
    const middleByCode = middleMap(curriculum);
    const unitLessons = lessons.filter(item => item.unitId === unit.id).sort((a,b) => Number(a.order) - Number(b.order));
    const lessonPosition = new Map(unitLessons.map((lesson,index) => [lesson.id,index + 1]));
    const progress = readProgress();
    const mastered = unitLessons.filter(lesson => stateFor(progress, lesson.id).mastered).length;
    const due = unitLessons.filter(lesson => stateFor(progress, lesson.id).state === 'due').length;
    const pct = unitLessons.length ? Math.round(mastered / unitLessons.length * 100) : 0;

    renderHero(unit, unitLessons, progress);
    document.getElementById('unit-summary').innerHTML = `
      <div class="unit-summary-metric"><strong>${unitLessons.length}</strong><span>構造化Lesson</span></div>
      <div class="unit-summary-metric"><strong>${mastered}</strong><span>理解確認済み</span></div>
      <div class="unit-summary-metric"><strong>${due}</strong><span>復習期限</span></div>
      <div class="unit-summary-metric"><strong>${(unit.officialMiddleCodes || []).length}</strong><span>IPA中分類</span></div>
      <div class="unit-overall-progress"><div><strong>ユニット進捗</strong><span>${mastered} / ${unitLessons.length} Lesson · ${pct}%</span></div><div class="unit-progress-track" aria-label="ユニット進捗 ${pct}%"><span style="width:${pct}%"></span></div></div>`;

    document.getElementById('unit-groups').innerHTML = (unit.officialMiddleCodes || []).map(code => {
      const middle = middleByCode.get(Number(code));
      const middleLessons = unitLessons.filter(lesson => (lesson.officialMiddleCodes || []).map(Number).includes(Number(code)));
      const middleMastered = middleLessons.filter(lesson => stateFor(progress, lesson.id).mastered).length;
      const description = (middle?.small || []).map(escapeHtml).join(' / ');
      return `<section class="unit-hub-group">
        <div class="unit-hub-heading">
          <div><p class="unit-hub-kicker">IPA 中分類 ${escapeHtml(code)}</p><h2>${escapeHtml(middle?.title || `中分類${code}`)}</h2>${description ? `<p class="unit-hub-description">${description}</p>` : ''}</div>
          <span class="unit-hub-progress">${middleMastered} / ${middleLessons.length} 理解確認</span>
        </div>
        ${middleLessons.length ? `<div class="unit-lesson-list">${middleLessons.map(lesson => renderLessonCard(lesson, stateFor(progress, lesson.id), lessonPosition.get(lesson.id))).join('')}</div>` : '<div class="unit-hub-empty">この中分類の構造化Lessonはまだありません。</div>'}
      </section>`;
    }).join('');
  }

  async function init() {
    try {
      if (!window.APLessonData?.load) throw new Error('lesson-data.js が読み込まれていません。');
      const [curriculum, coverage, lessonBank] = await Promise.all([
        loadJson('json/curriculum/ap-2026-map.json'),
        loadJson('json/curriculum/ap-2026-coverage.json'),
        window.APLessonData.load('../')
      ]);
      render(applyCoverage(curriculum, coverage), lessonBank.lessons || []);
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
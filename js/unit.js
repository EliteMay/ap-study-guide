(() => {
  'use strict';

  const LESSON_PROGRESS_KEY = 'ap-study-lesson-progress-v1';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const params = new URLSearchParams(location.search);
  const unitId = params.get('unit') || '';
  const LEGACY_GLOSSARIES = {
    'algorithm-programming':'algorithm.html',
    database:'database.html',
    network:'network.html',
    security:'security.html',
    'system-development':'system.html',
    'project-management':'management.html'
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

  function renderHero(unit, lessons, progress) {
    const mastered = lessons.filter(lesson => stateFor(progress, lesson.id).mastered).length;
    const next = lessons.find(lesson => !stateFor(progress, lesson.id).mastered) || lessons[0];
    document.title = `${unit.title} | AP Study Notes`;
    const glossary = LEGACY_GLOSSARIES[unit.id];
    document.getElementById('unit-hero').innerHTML = `
      <p class="eyebrow">CURRICULUM UNIT / ${(unit.officialMiddleCodes || []).map(code => `IPA ${code}`).join(' · ')}</p>
      <h1>${escapeHtml(unit.title)}</h1>
      <p class="lead">${escapeHtml(unit.auditNote || '')}</p>
      <div class="home-actions">
        ${next ? `<a class="home-action-btn" href="lesson.html?id=${encodeURIComponent(next.id)}">${mastered ? '次のLessonへ' : '最初のLessonから始める'}</a>` : ''}
        <a class="home-action-btn secondary" href="practice.html?unit=${encodeURIComponent(unit.id)}">短問</a>
        <a class="home-action-btn secondary" href="cases.html?unit=${encodeURIComponent(unit.id)}">長文Case</a>
        ${glossary ? `<a class="home-action-btn secondary" href="${glossary}">旧用語辞書</a>` : ''}
      </div>`;
  }

  function render(curriculum, lessons) {
    const unit = (curriculum.studyUnits || []).find(item => item.id === unitId);
    if (!unit) throw new Error(`学習ユニット ${unitId || '(未指定)'} が見つかりません。`);
    const middleByCode = middleMap(curriculum);
    const unitLessons = lessons.filter(item => item.unitId === unit.id).sort((a,b) => Number(a.order) - Number(b.order));
    const progress = readProgress();
    const mastered = unitLessons.filter(lesson => stateFor(progress, lesson.id).mastered).length;
    const due = unitLessons.filter(lesson => stateFor(progress, lesson.id).state === 'due').length;

    renderHero(unit, unitLessons, progress);
    document.getElementById('unit-summary').innerHTML = `
      <div><strong>${unitLessons.length}</strong><span>構造化Lesson</span></div>
      <div><strong>${mastered}</strong><span>理解確認済み</span></div>
      <div><strong>${due}</strong><span>復習期限</span></div>
      <div><strong>${(unit.officialMiddleCodes || []).length}</strong><span>IPA中分類</span></div>`;

    document.getElementById('unit-groups').innerHTML = (unit.officialMiddleCodes || []).map(code => {
      const middle = middleByCode.get(Number(code));
      const middleLessons = unitLessons.filter(lesson => (lesson.officialMiddleCodes || []).map(Number).includes(Number(code)));
      return `<section class="unit-hub-group"><div class="unit-hub-heading"><div><p class="dashboard-eyebrow">IPA MIDDLE ${escapeHtml(code)}</p><h2>${escapeHtml(middle?.title || `中分類${code}`)}</h2></div><p>${(middle?.small || []).map(escapeHtml).join(' / ')}</p></div>${middleLessons.length ? `<div class="units-grid">${middleLessons.map(lesson => {
        const state = stateFor(progress, lesson.id);
        return `<a class="unit-card is-ready ${state.mastered ? 'is-lesson-complete' : ''}" href="lesson.html?id=${encodeURIComponent(lesson.id)}"><div class="unit-card-title">${escapeHtml(lesson.id)} ${escapeHtml(lesson.title)}</div><p class="unit-card-desc">${(lesson.contentTypes || []).map(escapeHtml).join('・')}</p><div class="unit-card-meta"><span class="unit-badge ${state.mastered ? 'ready' : ''}">${escapeHtml(state.label)}</span><span>中分類${(lesson.officialMiddleCodes || []).join('・')}</span></div></a>`;
      }).join('')}</div>` : '<div class="unit-hub-empty">この中分類の構造化Lessonはまだありません。</div>'}</section>`;
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
      document.getElementById('unit-hero').innerHTML = `<p class="eyebrow">CURRICULUM UNIT</p><h1>読み込みエラー</h1><p class="lead">${escapeHtml(error.message)}</p>`;
      document.getElementById('unit-groups').innerHTML = '<p><a href="roadmap.html">学習マップへ戻る</a></p>';
    }
  }

  window.addEventListener('storage', event => { if (event.key === LESSON_PROGRESS_KEY) init(); });
  document.addEventListener('ap-lesson-progress-changed', init);
  document.addEventListener('DOMContentLoaded', init);
})();
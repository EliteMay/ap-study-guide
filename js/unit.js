(() => {
  'use strict';

  const LESSON_PROGRESS_KEY = 'ap-study-lesson-progress-v1';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const params = new URLSearchParams(location.search);
  const unitId = params.get('unit') || '';

  async function loadJson(path) {
    const response = await fetch(`../${path}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(LESSON_PROGRESS_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }

  async function loadLessonIndex() {
    const [base, expansion] = await Promise.all([
      loadJson('json/lessons/lesson-index.json'),
      loadJson('json/lessons/lesson-index-expansion.json')
    ]);
    return { lessons:[...(base.lessons || []), ...(expansion.lessons || [])] };
  }

  function applyCoverage(curriculum, coverage) {
    const overrides = coverage?.overrides || {};
    return {
      ...curriculum,
      studyUnits:(curriculum.studyUnits || []).map(unit => ({ ...unit, ...(overrides[unit.id] || {}) }))
    };
  }

  function middleMap(curriculum) {
    return new Map((curriculum.middleCategories || []).map(item => [Number(item.code), item]));
  }

  function renderHero(unit, lessons, progress) {
    const completed = lessons.filter(lesson => progress[lesson.id]?.completed).length;
    const firstIncomplete = lessons.find(lesson => !progress[lesson.id]?.completed) || lessons[0];
    document.title = `${unit.title} | AP Study Notes`;
    document.getElementById('unit-hero').innerHTML = `
      <p class="eyebrow">CURRICULUM UNIT / ${(unit.officialMiddleCodes || []).map(code => `IPA ${code}`).join(' · ')}</p>
      <h1>${escapeHtml(unit.title)}</h1>
      <p class="lead">${escapeHtml(unit.auditNote || '')}</p>
      <div class="home-actions">
        ${firstIncomplete ? `<a class="home-action-btn" href="lesson.html?id=${encodeURIComponent(firstIncomplete.id)}">${completed ? '未完了のLessonを続ける' : '最初のLessonから始める'}</a>` : ''}
        <a class="home-action-btn secondary" href="roadmap.html">学習マップ</a>
      </div>`;
  }

  function lessonProgressText(lesson, progress) {
    const saved = progress[lesson.id] || {};
    if (!saved.completed) return saved.latestAnswered ? `途中 ${saved.latestCorrect || 0}/${saved.latestAnswered}` : '未着手';
    return `完了 · Best ${Number(saved.bestCorrect || 0)}/${Number(saved.total || 0)}`;
  }

  function render(curriculum, index) {
    const unit = (curriculum.studyUnits || []).find(item => item.id === unitId);
    if (!unit) throw new Error(`学習ユニット ${unitId || '(未指定)'} が見つかりません。`);
    const middleByCode = middleMap(curriculum);
    const lessons = (index.lessons || [])
      .filter(item => item.unitId === unit.id)
      .sort((a,b) => Number(a.order) - Number(b.order));
    const progress = readProgress();
    const completed = lessons.filter(lesson => progress[lesson.id]?.completed).length;

    renderHero(unit, lessons, progress);
    document.getElementById('unit-summary').innerHTML = `
      <div><strong>${lessons.length}</strong><span>構造化Lesson</span></div>
      <div><strong>${completed}</strong><span>完了Lesson</span></div>
      <div><strong>${(unit.officialMiddleCodes || []).length}</strong><span>IPA中分類</span></div>
      <div><strong>${escapeHtml(unit.coverage || '')}</strong><span>Coverage状態</span></div>`;

    document.getElementById('unit-groups').innerHTML = (unit.officialMiddleCodes || []).map(code => {
      const middle = middleByCode.get(Number(code));
      const middleLessons = lessons.filter(lesson => (lesson.officialMiddleCodes || []).map(Number).includes(Number(code)));
      return `<section class="unit-hub-group">
        <div class="unit-hub-heading">
          <div><p class="dashboard-eyebrow">IPA MIDDLE ${escapeHtml(code)}</p><h2>${escapeHtml(middle?.title || `中分類${code}`)}</h2></div>
          <p>${(middle?.small || []).map(escapeHtml).join(' / ')}</p>
        </div>
        ${middleLessons.length ? `<div class="units-grid">${middleLessons.map(lesson => {
          const done = Boolean(progress[lesson.id]?.completed);
          return `<a class="unit-card is-ready ${done ? 'is-lesson-complete' : ''}" href="lesson.html?id=${encodeURIComponent(lesson.id)}"><div class="unit-card-title">${escapeHtml(lesson.id)} ${escapeHtml(lesson.title)}</div><p class="unit-card-desc">${(lesson.contentTypes || []).map(escapeHtml).join('・')}</p><div class="unit-card-meta"><span class="unit-badge ${done ? 'ready' : ''}">${escapeHtml(lessonProgressText(lesson, progress))}</span><span>中分類${(lesson.officialMiddleCodes || []).join('・')}</span></div></a>`;
        }).join('')}</div>` : '<div class="unit-hub-empty">この中分類の構造化Lessonはまだありません。</div>'}
      </section>`;
    }).join('');
  }

  async function init() {
    try {
      const [curriculum, coverage, index] = await Promise.all([
        loadJson('json/curriculum/ap-2026-map.json'),
        loadJson('json/curriculum/ap-2026-coverage.json'),
        loadLessonIndex()
      ]);
      render(applyCoverage(curriculum, coverage), index);
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
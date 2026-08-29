(() => {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const params = new URLSearchParams(location.search);
  const unitId = params.get('unit') || '';

  async function loadJson(path) {
    const response = await fetch(`../${path}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadLessonIndex() {
    const [base, expansion] = await Promise.all([
      loadJson('json/lessons/lesson-index.json'),
      loadJson('json/lessons/lesson-index-expansion.json')
    ]);
    return { lessons:[...(base.lessons || []), ...(expansion.lessons || [])] };
  }

  function middleMap(curriculum) {
    return new Map((curriculum.middleCategories || []).map(item => [Number(item.code), item]));
  }

  function renderHero(unit, lessons) {
    document.title = `${unit.title} | AP Study Notes`;
    document.getElementById('unit-hero').innerHTML = `
      <p class="eyebrow">CURRICULUM UNIT / ${(unit.officialMiddleCodes || []).map(code => `IPA ${code}`).join(' · ')}</p>
      <h1>${escapeHtml(unit.title)}</h1>
      <p class="lead">${escapeHtml(unit.auditNote || '')}</p>
      <div class="home-actions">
        ${lessons[0] ? `<a class="home-action-btn" href="lesson.html?id=${encodeURIComponent(lessons[0].id)}">最初のLessonから始める</a>` : ''}
        <a class="home-action-btn secondary" href="roadmap.html">学習マップ</a>
      </div>`;
  }

  function render(curriculum, index) {
    const unit = (curriculum.studyUnits || []).find(item => item.id === unitId);
    if (!unit) throw new Error(`学習ユニット ${unitId || '(未指定)'} が見つかりません。`);
    const middleByCode = middleMap(curriculum);
    const lessons = (index.lessons || [])
      .filter(item => item.unitId === unit.id)
      .sort((a,b) => Number(a.order) - Number(b.order));

    renderHero(unit, lessons);
    document.getElementById('unit-summary').innerHTML = `
      <div><strong>${lessons.length}</strong><span>構造化Lesson</span></div>
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
        ${middleLessons.length ? `<div class="units-grid">${middleLessons.map(lesson => `<a class="unit-card is-ready" href="lesson.html?id=${encodeURIComponent(lesson.id)}"><div class="unit-card-title">${escapeHtml(lesson.id)} ${escapeHtml(lesson.title)}</div><p class="unit-card-desc">${(lesson.contentTypes || []).map(escapeHtml).join('・')}</p><div class="unit-card-meta"><span class="unit-badge ready">中分類${(lesson.officialMiddleCodes || []).join('・')}</span><span>${escapeHtml(lesson.status || '')}</span></div></a>`).join('')}</div>` : '<div class="unit-hub-empty">この中分類の構造化Lessonはまだありません。</div>'}
      </section>`;
    }).join('');
  }

  async function init() {
    try {
      const [curriculum, index] = await Promise.all([
        loadJson('json/curriculum/ap-2026-map.json'),
        loadLessonIndex()
      ]);
      render(curriculum, index);
    } catch (error) {
      console.error(error);
      document.getElementById('unit-hero').innerHTML = `<p class="eyebrow">CURRICULUM UNIT</p><h1>読み込みエラー</h1><p class="lead">${escapeHtml(error.message)}</p>`;
      document.getElementById('unit-groups').innerHTML = '<p><a href="roadmap.html">学習マップへ戻る</a></p>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
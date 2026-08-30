(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let data = null;
  let curriculum = null;

  async function fetchJson(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function unitLabel(id) { return (curriculum.studyUnits || []).find(unit => unit.id === id)?.title || id; }
  function allQuestions() { return (data.exams || []).flatMap(exam => (exam.questions || []).map(question => ({ ...question, exam }))); }

  function renderSummary(filtered) {
    const lessons = new Set(filtered.flatMap(item => item.lessonRefs || []));
    const units = new Set(filtered.map(item => item.primaryUnitId));
    const required = filtered.filter(item => item.selection === 'required').length;
    $('official-summary').innerHTML = `<div><strong>${filtered.length}</strong><span>表示中の大問</span></div><div><strong>${units.size}</strong><span>主学習ユニット</span></div><div><strong>${lessons.size}</strong><span>関連Lesson</span></div><div><strong>${required}</strong><span>必須問題</span></div>`;
  }

  function questionCard(item) {
    const required = item.selection === 'required';
    return `<article class="official-question-card"><div class="official-question-head"><span class="official-qno">問${item.number}</span><span class="official-domain">${escapeHtml(item.domain)}</span><span class="official-selection ${required ? 'required' : ''}">${required ? '必須' : '選択'}</span></div><h3>${escapeHtml(item.topic)}</h3><p class="official-unit-label">主学習ユニット：${escapeHtml(unitLabel(item.primaryUnitId))}</p><div class="official-lessons">${(item.lessonRefs || []).map(id => `<a href="lesson.html?id=${encodeURIComponent(id)}">${escapeHtml(id)}</a>`).join('')}</div></article>`;
  }

  function renderExams(filtered) {
    const groups = (data.exams || []).map(exam => {
      const items = filtered.filter(item => item.exam.id === exam.id);
      if (!items.length) return '';
      return `<section class="official-exam-block"><div class="official-exam-heading"><div><p>${escapeHtml(exam.id)}</p><h2>${escapeHtml(exam.seasonLabel)} AP ${escapeHtml(exam.legacySubjectName)}</h2><span>現在の名称では ${escapeHtml(exam.currentSubjectName)} · ${escapeHtml(exam.selectionRule)}</span></div><div class="official-source-actions"><a href="${escapeHtml(exam.officialQuestionPdfUrl)}" target="_blank" rel="noopener noreferrer">公式問題PDF</a><a href="${escapeHtml(exam.officialPageUrl)}" target="_blank" rel="noopener noreferrer">IPA掲載ページ</a></div></div><div class="official-question-grid">${items.map(questionCard).join('')}</div></section>`;
    }).filter(Boolean);
    $('official-exams').innerHTML = groups.length ? groups.join('') : '<div class="official-empty">条件に一致する公開問題がありません。</div>';
  }

  function applyFilters() {
    const season = $('official-season').value;
    const unit = $('official-unit').value;
    const selection = $('official-selection').value;
    const filtered = allQuestions().filter(item => (season === 'all' || item.exam.season === season) && (unit === 'all' || item.primaryUnitId === unit) && (selection === 'all' || item.selection === selection));
    renderSummary(filtered); renderExams(filtered);
  }

  async function init() {
    [data,curriculum] = await Promise.all([fetchJson('json/past/ap-public-exams.json'),fetchJson('json/curriculum/ap-2026-map.json')]);
    const usedUnits = new Set(allQuestions().map(item => item.primaryUnitId));
    const options = [...(curriculum.studyUnits || [])].filter(unit => usedUnits.has(unit.id)).sort((a,b) => Number(a.order)-Number(b.order)).map(unit => `<option value="${escapeHtml(unit.id)}">${escapeHtml(unit.title)}</option>`).join('');
    $('official-unit').insertAdjacentHTML('beforeend',options);
    ['official-season','official-unit','official-selection'].forEach(id => $(id).addEventListener('change',applyFilters));
    applyFilters();
  }

  document.addEventListener('DOMContentLoaded', () => init().catch(error => { console.error(error); $('official-exams').innerHTML = `<div class="official-empty">公式問題対応表の読み込みに失敗しました: ${escapeHtml(error.message)}</div>`; }));
})();
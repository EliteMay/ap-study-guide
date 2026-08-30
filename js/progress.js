(() => {
  'use strict';

  const LESSON_KEY = 'ap-study-lesson-progress-v1';
  const PRACTICE_KEY = 'ap-study-practice-history-v1';
  const CASE_KEY = 'ap-study-case-history-v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const HUBS = {
    'foundation-theory':'unit.html?unit=foundation-theory',
    'algorithm-programming':'algorithm.html',
    'computer-systems':'computer.html',
    'ui-media':'unit.html?unit=ui-media',
    database:'database.html', network:'network.html', security:'security.html',
    'system-development':'system.html', 'project-management':'management.html',
    'service-audit':'unit.html?unit=service-audit',
    'strategy-planning':'unit.html?unit=strategy-planning',
    'business-accounting':'unit.html?unit=business-accounting',
    'law-standards':'unit.html?unit=law-standards'
  };

  async function fetchJson(path) {
    const response = await fetch(`../${path}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function readObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }

  function isPracticeMastered(question, record) {
    if (!record) return false;
    return question.type === 'choice' ? Number(record.bestScore) >= 1 : Number(record.bestScore) >= 2;
  }

  function isCaseMastered(item, record) {
    return item.questions.every(question => Number(record?.questions?.[question.id]?.bestScore || 0) >= 2);
  }

  function isCaseAttempted(record) {
    return Object.keys(record?.questions || {}).length > 0;
  }

  function percent(done, total) {
    return total ? Math.round(done / total * 100) : 0;
  }

  function statusLabel(lessonDone, lessonTotal, practiceDone, practiceTotal, caseDone = 0, caseTotal = 0) {
    if (lessonTotal && lessonDone === lessonTotal && (!practiceTotal || practiceDone === practiceTotal) && (!caseTotal || caseDone === caseTotal)) return ['完了','complete'];
    if (lessonDone || practiceDone || caseDone) return ['進行中','active'];
    return ['未着手','idle'];
  }

  function renderSummary(lessons, questions, cases, lessonProgress, practiceHistory, caseHistory) {
    const lessonDone = lessons.filter(item => lessonProgress[item.id]?.completed).length;
    const attempted = questions.filter(q => practiceHistory[q.id]).length;
    const mastered = questions.filter(q => isPracticeMastered(q, practiceHistory[q.id])).length;
    const retry = questions.filter(q => practiceHistory[q.id] && !isPracticeMastered(q, practiceHistory[q.id])).length;
    const caseDone = cases.filter(item => isCaseMastered(item, caseHistory[item.id])).length;
    $('progress-summary').innerHTML = `
      <div><strong>${lessonDone}/${lessons.length}</strong><span>Lesson完了</span></div>
      <div><strong>${percent(lessonDone, lessons.length)}%</strong><span>Lesson進捗</span></div>
      <div><strong>${attempted}/${questions.length}</strong><span>短問挑戦</span></div>
      <div><strong>${mastered}</strong><span>短問理解済み</span></div>
      <div><strong>${retry}</strong><span>短問要復習</span></div>
      <div><strong>${caseDone}/${cases.length}</strong><span>長文Case理解済み</span></div>`;
  }

  function renderUnits(curriculum, lessons, questions, cases, lessonProgress, practiceHistory, caseHistory) {
    const units = [...(curriculum.studyUnits || [])].sort((a,b) => Number(a.order) - Number(b.order));
    $('progress-unit-grid').innerHTML = units.map(unit => {
      const unitLessons = lessons.filter(item => item.unitId === unit.id);
      const unitQuestions = questions.filter(item => item.unitId === unit.id);
      const unitCases = cases.filter(item => item.unitId === unit.id);
      const lessonDone = unitLessons.filter(item => lessonProgress[item.id]?.completed).length;
      const practiceDone = unitQuestions.filter(q => isPracticeMastered(q, practiceHistory[q.id])).length;
      const caseDone = unitCases.filter(item => isCaseMastered(item, caseHistory[item.id])).length;
      const retry = unitQuestions.filter(q => practiceHistory[q.id] && !isPracticeMastered(q, practiceHistory[q.id])).length;
      const nextLesson = unitLessons.find(item => !lessonProgress[item.id]?.completed) || null;
      const [label, state] = statusLabel(lessonDone, unitLessons.length, practiceDone, unitQuestions.length, caseDone, unitCases.length);
      const lessonPct = percent(lessonDone, unitLessons.length);
      const practicePct = percent(practiceDone, unitQuestions.length);
      const casePct = percent(caseDone, unitCases.length);
      return `<article class="progress-unit-card" data-state="${state}">
        <div class="progress-unit-top"><span>${String(unit.order).padStart(2,'0')}</span><strong>${escapeHtml(label)}</strong></div>
        <h3>${escapeHtml(unit.title)}</h3>
        <div class="progress-meter-row"><span>Lesson ${lessonDone}/${unitLessons.length}</span><b>${lessonPct}%</b></div>
        <div class="progress-meter"><i style="width:${lessonPct}%"></i></div>
        <div class="progress-meter-row"><span>短問理解 ${practiceDone}/${unitQuestions.length}</span><b>${practicePct}%</b></div>
        <div class="progress-meter practice"><i style="width:${practicePct}%"></i></div>
        <div class="progress-meter-row"><span>長文Case ${caseDone}/${unitCases.length}</span><b>${casePct}%</b></div>
        <div class="progress-meter cases"><i style="width:${casePct}%"></i></div>
        <p>${retry ? `短問要復習 ${retry}問` : '短問要復習なし'}${nextLesson ? ` · 次 ${escapeHtml(nextLesson.id)}` : ' · Lesson完了'}</p>
        <div class="progress-unit-actions"><a href="${escapeHtml(HUBS[unit.id] || `unit.html?unit=${encodeURIComponent(unit.id)}`)}">教材</a><a href="practice.html?unit=${encodeURIComponent(unit.id)}">短問</a><a href="cases.html?unit=${encodeURIComponent(unit.id)}">長文Case</a>${nextLesson ? `<a href="lesson.html?id=${encodeURIComponent(nextLesson.id)}">続き</a>` : ''}</div>
      </article>`;
    }).join('');
  }

  function renderMiddle(curriculum, lessons, questions, cases, lessonProgress, practiceHistory, caseHistory) {
    const rows = [...(curriculum.middleCategories || [])].sort((a,b) => Number(a.code) - Number(b.code)).map(middle => {
      const code = Number(middle.code);
      const middleLessons = lessons.filter(item => (item.officialMiddleCodes || []).map(Number).includes(code));
      const middleQuestions = questions.filter(item => (item.middleCodes || []).map(Number).includes(code));
      const middleCases = cases.filter(item => (item.middleCodes || []).map(Number).includes(code));
      const lessonDone = middleLessons.filter(item => lessonProgress[item.id]?.completed).length;
      const practiceDone = middleQuestions.filter(q => isPracticeMastered(q, practiceHistory[q.id])).length;
      const caseDone = middleCases.filter(item => isCaseMastered(item, caseHistory[item.id])).length;
      const [label, state] = statusLabel(lessonDone, middleLessons.length, practiceDone, middleQuestions.length, caseDone, middleCases.length);
      return `<tr><td><strong>${code}</strong> ${escapeHtml(middle.title)}</td><td>${middleLessons.length}</td><td>${lessonDone}</td><td>${middleQuestions.length}</td><td>${practiceDone}</td><td>${middleCases.length}</td><td>${caseDone}</td><td><span class="progress-table-status ${state}">${label}</span></td></tr>`;
    });
    $('progress-middle-body').innerHTML = rows.join('');
  }

  function renderNext(lessons, questions, cases, lessonProgress, practiceHistory, caseHistory) {
    const caseRetry = cases.filter(item => isCaseAttempted(caseHistory[item.id]) && !isCaseMastered(item, caseHistory[item.id]));
    const retry = questions
      .filter(q => practiceHistory[q.id] && !isPracticeMastered(q, practiceHistory[q.id]))
      .sort((a,b) => Number(practiceHistory[a.id]?.updatedAt || 0) - Number(practiceHistory[b.id]?.updatedAt || 0));
    const incomplete = lessons
      .filter(item => !lessonProgress[item.id]?.completed)
      .sort((a,b) => Number(a.order) - Number(b.order));
    const cards = [];
    caseRetry.slice(0,2).forEach(item => cards.push(`<a class="progress-next-card retry" href="cases.html?unit=${encodeURIComponent(item.unitId)}&case=${encodeURIComponent(item.id)}"><small>CASE RETRY</small><strong>${escapeHtml(item.id)} ${escapeHtml(item.title)}</strong><span>途中または要復習の長文Case</span></a>`));
    retry.slice(0,Math.max(0,3 - cards.length)).forEach(q => cards.push(`<a class="progress-next-card retry" href="practice.html?unit=${encodeURIComponent(q.unitId)}&question=${encodeURIComponent(q.id)}"><small>SHORT RETRY</small><strong>${escapeHtml(q.id)} ${escapeHtml(q.title)}</strong><span>前回の要復習問題を再挑戦</span></a>`));
    incomplete.slice(0,Math.max(0,5 - cards.length)).forEach(item => cards.push(`<a class="progress-next-card" href="lesson.html?id=${encodeURIComponent(item.id)}"><small>NEXT LESSON</small><strong>${escapeHtml(item.id)} ${escapeHtml(item.title)}</strong><span>未完了Lessonを進める</span></a>`));
    $('progress-next').innerHTML = cards.length ? cards.join('') : '<div class="progress-complete-message">登録済みLesson・短問・長文Caseはすべて完了しています。</div>';
  }

  async function init() {
    if (!window.APPracticeData?.load) throw new Error('practice-data.js が読み込まれていません。');
    if (!window.APCaseData?.load) throw new Error('case-data.js が読み込まれていません。');
    const [curriculum, base, expansion, practiceBank, caseBank] = await Promise.all([
      fetchJson('json/curriculum/ap-2026-map.json'),
      fetchJson('json/lessons/lesson-index.json'),
      fetchJson('json/lessons/lesson-index-expansion.json'),
      window.APPracticeData.load('../'),
      window.APCaseData.load('../')
    ]);
    const lessons = [...(base.lessons || []), ...(expansion.lessons || [])].sort((a,b) => Number(a.order) - Number(b.order));
    const questions = Array.isArray(practiceBank.questions) ? practiceBank.questions : [];
    const cases = Array.isArray(caseBank.cases) ? caseBank.cases : [];
    const lessonProgress = readObject(LESSON_KEY);
    const practiceHistory = readObject(PRACTICE_KEY);
    const caseHistory = readObject(CASE_KEY);
    renderSummary(lessons, questions, cases, lessonProgress, practiceHistory, caseHistory);
    renderUnits(curriculum, lessons, questions, cases, lessonProgress, practiceHistory, caseHistory);
    renderMiddle(curriculum, lessons, questions, cases, lessonProgress, practiceHistory, caseHistory);
    renderNext(lessons, questions, cases, lessonProgress, practiceHistory, caseHistory);
  }

  window.addEventListener('storage', event => {
    if ([LESSON_KEY, PRACTICE_KEY, CASE_KEY].includes(event.key)) init().catch(console.error);
  });
  document.addEventListener('DOMContentLoaded', () => init().catch(error => {
    console.error(error);
    $('progress-summary').innerHTML = `<div class="progress-error">進捗の読み込みに失敗しました: ${escapeHtml(error.message)}</div>`;
  }));
})();
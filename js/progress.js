(() => {
  'use strict';

  const LESSON_KEY = 'ap-study-lesson-progress-v1';
  const PRACTICE_KEY = 'ap-study-practice-history-v1';
  const CASE_KEY = 'ap-study-case-history-v1';
  const MOCK_KEY = 'ap-study-mock-history-v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function fetchJson(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  const readObject = key => window.APStudyState?.readObject?.(key) || {};
  const readArray = key => window.APStudyState?.readArray?.(key) || [];
  const lessonState = record => window.APStudyState.lessonState(record);
  const practiceState = (question, record) => window.APStudyState.practiceState(question, record);
  const caseState = (item, record) => window.APStudyState.caseState(item, record);
  const percent = (done,total) => total ? Math.round(done / total * 100) : 0;
  const hub = unitId => `unit.html?unit=${encodeURIComponent(unitId)}`;

  function aggregateState(lessonDone, lessonTotal, practiceDone, practiceTotal, caseDone, caseTotal, dueCount) {
    if (dueCount) return ['復習期限','due'];
    if (lessonTotal && lessonDone === lessonTotal && (!practiceTotal || practiceDone === practiceTotal) && (!caseTotal || caseDone === caseTotal)) return ['理解確認済み','complete'];
    if (lessonDone || practiceDone || caseDone) return ['進行中','active'];
    return ['未着手','idle'];
  }

  function renderSummary(lessons, questions, cases, lessonProgress, practiceHistory, caseHistory, mockHistory) {
    const lessonDone = lessons.filter(item => lessonState(lessonProgress[item.id]).mastered).length;
    const lessonDue = lessons.filter(item => lessonState(lessonProgress[item.id]).state === 'due').length;
    const attempted = questions.filter(q => practiceHistory[q.id]).length;
    const mastered = questions.filter(q => practiceState(q, practiceHistory[q.id]).mastered).length;
    const retry = questions.filter(q => practiceHistory[q.id] && !practiceState(q, practiceHistory[q.id]).mastered).length;
    const due = questions.filter(q => practiceState(q, practiceHistory[q.id]).state === 'due').length;
    const caseDone = cases.filter(item => caseState(item, caseHistory[item.id]).mastered).length;
    const caseDue = cases.filter(item => caseState(item, caseHistory[item.id]).state === 'due').length;
    $('progress-summary').innerHTML = `
      <div><strong>${lessonDone}/${lessons.length}</strong><span>Lesson理解確認</span></div>
      <div><strong>${lessonDue}</strong><span>Lesson復習期限</span></div>
      <div><strong>${attempted}/${questions.length}</strong><span>短問挑戦</span></div>
      <div><strong>${mastered}</strong><span>短問理解済み</span></div>
      <div><strong>${retry}</strong><span>短問要復習${due ? ` · 期限${due}` : ''}</span></div>
      <div><strong>${caseDone}/${cases.length}</strong><span>長文Case理解済み${caseDue ? ` · 期限${caseDue}` : ''}</span></div>
      <div><strong>${mockHistory.length}</strong><span>150分模試実施</span></div>`;
  }

  function renderUnits(curriculum, lessons, questions, cases, lessonProgress, practiceHistory, caseHistory) {
    const units = [...(curriculum.studyUnits || [])].sort((a,b) => Number(a.order) - Number(b.order));
    $('progress-unit-grid').innerHTML = units.map(unit => {
      const unitLessons = lessons.filter(item => item.unitId === unit.id);
      const unitQuestions = questions.filter(item => item.unitId === unit.id);
      const unitCases = cases.filter(item => item.unitId === unit.id);
      const lessonDone = unitLessons.filter(item => lessonState(lessonProgress[item.id]).mastered).length;
      const practiceDone = unitQuestions.filter(q => practiceState(q, practiceHistory[q.id]).mastered).length;
      const caseDone = unitCases.filter(item => caseState(item, caseHistory[item.id]).mastered).length;
      const retry = unitQuestions.filter(q => practiceHistory[q.id] && !practiceState(q, practiceHistory[q.id]).mastered).length;
      const dueCount = unitLessons.filter(item => lessonState(lessonProgress[item.id]).state === 'due').length + unitQuestions.filter(q => practiceState(q, practiceHistory[q.id]).state === 'due').length + unitCases.filter(item => caseState(item, caseHistory[item.id]).state === 'due').length;
      const nextLesson = unitLessons.find(item => !lessonState(lessonProgress[item.id]).mastered) || null;
      const [label,state] = aggregateState(lessonDone,unitLessons.length,practiceDone,unitQuestions.length,caseDone,unitCases.length,dueCount);
      const lessonPct = percent(lessonDone, unitLessons.length);
      const practicePct = percent(practiceDone, unitQuestions.length);
      const casePct = percent(caseDone, unitCases.length);
      return `<article class="progress-unit-card" data-state="${state}"><div class="progress-unit-top"><span>${String(unit.order).padStart(2,'0')}</span><strong>${escapeHtml(label)}</strong></div><h3>${escapeHtml(unit.title)}</h3><div class="progress-meter-row"><span>Lesson ${lessonDone}/${unitLessons.length}</span><b>${lessonPct}%</b></div><div class="progress-meter"><i style="width:${lessonPct}%"></i></div><div class="progress-meter-row"><span>短問理解 ${practiceDone}/${unitQuestions.length}</span><b>${practicePct}%</b></div><div class="progress-meter practice"><i style="width:${practicePct}%"></i></div><div class="progress-meter-row"><span>長文Case ${caseDone}/${unitCases.length}</span><b>${casePct}%</b></div><div class="progress-meter cases"><i style="width:${casePct}%"></i></div><p>${retry ? `短問要復習 ${retry}問` : '短問要復習なし'}${dueCount ? ` · 復習期限 ${dueCount}件` : ''}${nextLesson ? ` · 次 ${escapeHtml(nextLesson.id)}` : ' · Lesson理解確認済み'}</p><div class="progress-unit-actions"><a href="${hub(unit.id)}">教材</a><a href="practice.html?unit=${encodeURIComponent(unit.id)}">短問</a><a href="cases.html?unit=${encodeURIComponent(unit.id)}">長文Case</a>${nextLesson ? `<a href="lesson.html?id=${encodeURIComponent(nextLesson.id)}">続き</a>` : ''}</div></article>`;
    }).join('');
  }

  function renderMiddle(curriculum, lessons, questions, cases, lessonProgress, practiceHistory, caseHistory) {
    const rows = [...(curriculum.middleCategories || [])].sort((a,b) => Number(a.code) - Number(b.code)).map(middle => {
      const code = Number(middle.code);
      const middleLessons = lessons.filter(item => (item.officialMiddleCodes || []).map(Number).includes(code));
      const middleQuestions = questions.filter(item => (item.middleCodes || []).map(Number).includes(code));
      const middleCases = cases.filter(item => (item.middleCodes || []).map(Number).includes(code));
      const lessonDone = middleLessons.filter(item => lessonState(lessonProgress[item.id]).mastered).length;
      const practiceDone = middleQuestions.filter(q => practiceState(q, practiceHistory[q.id]).mastered).length;
      const caseDone = middleCases.filter(item => caseState(item, caseHistory[item.id]).mastered).length;
      const dueCount = middleLessons.filter(item => lessonState(lessonProgress[item.id]).state === 'due').length + middleQuestions.filter(q => practiceState(q, practiceHistory[q.id]).state === 'due').length + middleCases.filter(item => caseState(item, caseHistory[item.id]).state === 'due').length;
      const [label,state] = aggregateState(lessonDone,middleLessons.length,practiceDone,middleQuestions.length,caseDone,middleCases.length,dueCount);
      return `<tr><td><strong>${code}</strong> ${escapeHtml(middle.title)}</td><td>${middleLessons.length}</td><td>${lessonDone}</td><td>${middleQuestions.length}</td><td>${practiceDone}</td><td>${middleCases.length}</td><td>${caseDone}</td><td><span class="progress-table-status ${state}">${label}</span></td></tr>`;
    });
    $('progress-middle-body').innerHTML = rows.join('');
  }

  function renderNext(lessons, questions, cases, lessonProgress, practiceHistory, caseHistory, mockHistory) {
    const dueCases = cases.filter(item => caseState(item, caseHistory[item.id]).state === 'due');
    const retryCases = cases.filter(item => caseHistory[item.id] && !caseState(item, caseHistory[item.id]).mastered && !dueCases.includes(item));
    const dueQuestions = questions.filter(q => practiceState(q, practiceHistory[q.id]).state === 'due');
    const retryQuestions = questions.filter(q => practiceHistory[q.id] && !practiceState(q, practiceHistory[q.id]).mastered && !dueQuestions.includes(q));
    const dueLessons = lessons.filter(item => lessonState(lessonProgress[item.id]).state === 'due');
    const incomplete = lessons.filter(item => !lessonState(lessonProgress[item.id]).mastered && !dueLessons.includes(item)).sort((a,b) => Number(a.order) - Number(b.order));
    const cards = [];
    [...dueCases,...retryCases].slice(0,2).forEach(item => cards.push(`<a class="progress-next-card retry" href="cases.html?unit=${encodeURIComponent(item.unitId)}&case=${encodeURIComponent(item.id)}"><small>${caseState(item,caseHistory[item.id]).state === 'due' ? 'CASE REVIEW DUE' : 'CASE RETRY'}</small><strong>${escapeHtml(item.id)} ${escapeHtml(item.title)}</strong><span>長文Caseを再確認</span></a>`));
    [...dueQuestions,...retryQuestions].slice(0,Math.max(0,3-cards.length)).forEach(q => cards.push(`<a class="progress-next-card retry" href="practice.html?unit=${encodeURIComponent(q.unitId)}&question=${encodeURIComponent(q.id)}"><small>${practiceState(q,practiceHistory[q.id]).state === 'due' ? 'SHORT REVIEW DUE' : 'SHORT RETRY'}</small><strong>${escapeHtml(q.id)} ${escapeHtml(q.title)}</strong><span>短問を再確認</span></a>`));
    [...dueLessons,...incomplete].slice(0,Math.max(0,5-cards.length)).forEach(item => cards.push(`<a class="progress-next-card" href="lesson.html?id=${encodeURIComponent(item.id)}"><small>${lessonState(lessonProgress[item.id]).state === 'due' ? 'LESSON REVIEW DUE' : 'NEXT LESSON'}</small><strong>${escapeHtml(item.id)} ${escapeHtml(item.title)}</strong><span>${lessonState(lessonProgress[item.id]).label}</span></a>`));
    const latestA = mockHistory.find(item => item.subject === 'A');
    const latestB = mockHistory.find(item => item.subject === 'B');
    cards.push(`<a class="progress-next-card" href="mock.html"><small>FULL MOCK</small><strong>150分模試で時間配分を確認</strong><span>${latestA ? `科目A 最新 ${Number(latestA.score || 0)}/${Number(latestA.maxScore || latestA.total || 80)}` : '科目A 未実施'} · ${latestB ? `科目B 最新 ${Number(latestB.score || 0)}/${Number(latestB.maxScore || 30)}` : '科目B 未実施'}</span></a>`);
    $('progress-next').innerHTML = cards.join('');
  }

  async function init() {
    if (!window.APPracticeData?.load || !window.APCaseData?.load || !window.APLessonData?.load || !window.APStudyState) throw new Error('共通Data Loaderの読み込みに失敗しました。');
    const [curriculum,lessonBank,practiceBank,caseBank] = await Promise.all([
      fetchJson('json/curriculum/ap-2026-map.json'),
      window.APLessonData.load('../'),
      window.APPracticeData.load('../'),
      window.APCaseData.load('../')
    ]);
    const lessons = lessonBank.lessons || [];
    const questions = practiceBank.questions || [];
    const cases = caseBank.cases || [];
    const lessonProgress = readObject(LESSON_KEY);
    const practiceHistory = readObject(PRACTICE_KEY);
    const caseHistory = readObject(CASE_KEY);
    const mockHistory = readArray(MOCK_KEY);
    renderSummary(lessons,questions,cases,lessonProgress,practiceHistory,caseHistory,mockHistory);
    renderUnits(curriculum,lessons,questions,cases,lessonProgress,practiceHistory,caseHistory);
    renderMiddle(curriculum,lessons,questions,cases,lessonProgress,practiceHistory,caseHistory);
    renderNext(lessons,questions,cases,lessonProgress,practiceHistory,caseHistory,mockHistory);
  }

  window.addEventListener('storage', event => { if ([LESSON_KEY,PRACTICE_KEY,CASE_KEY,MOCK_KEY].includes(event.key)) init().catch(console.error); });
  document.addEventListener('DOMContentLoaded', () => init().catch(error => { console.error(error); $('progress-summary').innerHTML = `<div class="progress-error">進捗の読み込みに失敗しました: ${escapeHtml(error.message)}</div>`; }));
})();
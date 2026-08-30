(() => {
  'use strict';

  const LESSON_KEY = 'ap-study-lesson-progress-v1';
  const PRACTICE_KEY = 'ap-study-practice-history-v1';
  const CASE_KEY = 'ap-study-case-history-v1';
  const MOCK_KEY = 'ap-study-mock-history-v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  const readObject = key => window.APStudyState?.readObject?.(key) || {};
  const readArray = key => window.APStudyState?.readArray?.(key) || [];
  const lessonState = record => window.APStudyState.lessonState(record);
  const practiceState = (question,record) => window.APStudyState.practiceState(question,record);
  const caseState = (item,record) => window.APStudyState.caseState(item,record);

  function renderUnits(curriculum, lessons, progress) {
    const root = $('home-unit-grid');
    if (!root) return;
    root.innerHTML = [...(curriculum.studyUnits || [])].sort((a,b) => Number(a.order)-Number(b.order)).map(unit => {
      const items = lessons.filter(item => item.unitId === unit.id);
      const mastered = items.filter(item => lessonState(progress[item.id]).mastered).length;
      const due = items.filter(item => lessonState(progress[item.id]).state === 'due').length;
      const pct = items.length ? Math.round(mastered / items.length * 100) : 0;
      return `<a href="html/unit.html?unit=${encodeURIComponent(unit.id)}" class="unit-card is-ready ${mastered === items.length && items.length ? 'is-lesson-complete' : ''}"><div class="unit-card-title">${String(unit.order).padStart(2,'0')} ${escapeHtml(unit.title)}</div><p class="unit-card-desc">IPA中分類 ${(unit.officialMiddleCodes || []).join('・')}</p><div class="unit-card-meta"><span class="unit-badge ${mastered === items.length && items.length ? 'ready' : ''}">${mastered}/${items.length} 理解確認</span><span>${due ? `復習期限 ${due}` : `${pct}%`}</span></div><div class="unit-card-progress"><div class="unit-card-progress-bar" style="width:${pct}%"></div></div></a>`;
    }).join('');
  }

  function buildPriority(lessons, questions, cases, lessonProgress, practiceHistory, caseHistory) {
    const dueCase = cases.find(item => caseState(item,caseHistory[item.id]).state === 'due');
    if (dueCase) return { kind:'長文Case 復習期限', title:`${dueCase.id} ${dueCase.title}`, meta:'以前理解確認したCaseが再確認時期です。', href:`html/cases.html?unit=${encodeURIComponent(dueCase.unitId)}&case=${encodeURIComponent(dueCase.id)}` };
    const dueQuestion = questions.find(item => practiceState(item,practiceHistory[item.id]).state === 'due');
    if (dueQuestion) return { kind:'短問 復習期限', title:`${dueQuestion.id} ${dueQuestion.title}`, meta:'一度できた問題を時間を空けて再確認します。', href:`html/practice.html?unit=${encodeURIComponent(dueQuestion.unitId)}&question=${encodeURIComponent(dueQuestion.id)}` };
    const dueLesson = lessons.find(item => lessonState(lessonProgress[item.id]).state === 'due');
    if (dueLesson) return { kind:'Lesson 復習期限', title:`${dueLesson.id} ${dueLesson.title}`, meta:'理解確認から14日以上経過しています。', href:`html/lesson.html?id=${encodeURIComponent(dueLesson.id)}` };
    const retryCase = cases.find(item => caseHistory[item.id] && !caseState(item,caseHistory[item.id]).mastered);
    if (retryCase) return { kind:'長文Case 要復習', title:`${retryCase.id} ${retryCase.title}`, meta:'途中または自己評価が十分でないCaseです。', href:`html/cases.html?unit=${encodeURIComponent(retryCase.unitId)}&case=${encodeURIComponent(retryCase.id)}` };
    const retryQuestion = questions.find(item => practiceHistory[item.id] && !practiceState(item,practiceHistory[item.id]).mastered);
    if (retryQuestion) return { kind:'短問 要復習', title:`${retryQuestion.id} ${retryQuestion.title}`, meta:'直近成績では理解済み判定になっていません。', href:`html/practice.html?unit=${encodeURIComponent(retryQuestion.unitId)}&question=${encodeURIComponent(retryQuestion.id)}` };
    const nextLesson = lessons.find(item => !lessonState(lessonProgress[item.id]).mastered);
    if (nextLesson) return { kind:'次のLesson', title:`${nextLesson.id} ${nextLesson.title}`, meta:'未理解の構造化Lessonを進めます。', href:`html/lesson.html?id=${encodeURIComponent(nextLesson.id)}` };
    return { kind:'全教材確認済み', title:'150分模試で総合確認', meta:'登録済みLesson・短問・Caseは現在すべて理解確認済みです。', href:'html/mock.html' };
  }

  function renderDashboard(lessons, questions, cases, lessonProgress, practiceHistory, caseHistory, mockHistory) {
    const lessonMastered = lessons.filter(item => lessonState(lessonProgress[item.id]).mastered).length;
    const practiceMastered = questions.filter(item => practiceState(item,practiceHistory[item.id]).mastered).length;
    const practiceRetry = questions.filter(item => practiceHistory[item.id] && !practiceState(item,practiceHistory[item.id]).mastered).length;
    const caseMastered = cases.filter(item => caseState(item,caseHistory[item.id]).mastered).length;
    const caseRetry = cases.filter(item => caseHistory[item.id] && !caseState(item,caseHistory[item.id]).mastered).length;
    if ($('lesson-progress-number')) $('lesson-progress-number').textContent = `${lessonMastered} / ${lessons.length}`;
    if ($('practice-progress-number')) $('practice-progress-number').textContent = `${practiceMastered} / ${questions.length}`;
    if ($('practice-progress-meta')) $('practice-progress-meta').textContent = `${practiceRetry}問が要復習・確認中。4択は1回正解だけでは理解済みになりません。`;
    if ($('case-progress-number')) $('case-progress-number').textContent = `${caseMastered} / ${cases.length}`;
    if ($('case-progress-meta')) $('case-progress-meta').textContent = `${caseRetry}Caseが途中・要復習。記述回答を書いてから自己採点します。`;
    if ($('mock-progress-number')) $('mock-progress-number').textContent = `${mockHistory.length} 回`;

    const priority = buildPriority(lessons,questions,cases,lessonProgress,practiceHistory,caseHistory);
    if ($('continue-kicker')) $('continue-kicker').textContent = priority.kind;
    if ($('continue-title')) $('continue-title').textContent = priority.title;
    if ($('continue-meta')) $('continue-meta').textContent = priority.meta;
    if ($('continue-link')) $('continue-link').href = priority.href;
    if ($('continue-hero')) $('continue-hero').href = priority.href;
    if ($('continue-hero')) $('continue-hero').textContent = '今日の優先項目を続ける';

    if ($('hero-lesson')) $('hero-lesson').textContent = `${lessonMastered}/${lessons.length}`;
    if ($('hero-practice')) $('hero-practice').textContent = `${practiceMastered}/${questions.length}`;
    if ($('hero-case')) $('hero-case').textContent = `${caseMastered}/${cases.length}`;
  }

  async function init() {
    if (!window.APStudyState || !window.APLessonData?.load || !window.APPracticeData?.load || !window.APCaseData?.load) throw new Error('共通Data Loaderが不足しています。');
    const [curriculum,lessonBank,practiceBank,caseBank] = await Promise.all([
      fetchJson('json/curriculum/ap-2026-map.json'),
      window.APLessonData.load(''),
      window.APPracticeData.load(''),
      window.APCaseData.load('')
    ]);
    const lessonProgress = readObject(LESSON_KEY);
    const practiceHistory = readObject(PRACTICE_KEY);
    const caseHistory = readObject(CASE_KEY);
    const mockHistory = readArray(MOCK_KEY);
    renderDashboard(lessonBank.lessons || [],practiceBank.questions || [],caseBank.cases || [],lessonProgress,practiceHistory,caseHistory,mockHistory);
    renderUnits(curriculum,lessonBank.lessons || [],lessonProgress);
  }

  window.addEventListener('storage', event => { if ([LESSON_KEY,PRACTICE_KEY,CASE_KEY,MOCK_KEY].includes(event.key)) init().catch(console.error); });
  window.addEventListener('ap-lesson-progress-changed', () => init().catch(console.error));
  document.addEventListener('DOMContentLoaded', () => init().catch(error => console.error('[home] init failed', error)));
})();
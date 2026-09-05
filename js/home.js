(() => {
  'use strict';

  const LESSON_KEY = 'ap-study-lesson-progress-v1';
  const PRACTICE_KEY = 'ap-study-practice-history-v1';
  const CASE_KEY = 'ap-study-case-history-v1';
  const MOCK_KEY = 'ap-study-mock-history-v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/\s+/g,' ').trim();
  let finderCatalog = [];
  let finderBound = false;

  function buildQuickActions(stats = {}) {
    const lessonText = Number.isFinite(stats.lessonCount) ? `${stats.lessonCount}本の構造化Lesson` : '構造化Lessonから体系的に学ぶ';
    const practiceText = Number.isFinite(stats.practiceCount) ? `${stats.practiceCount}問の選択・記述問題` : '選択・記述の短問演習';
    const caseText = Number.isFinite(stats.caseCount) ? `${stats.caseCount}Caseの長文記述` : '長文Caseの記述演習';
    return [
      { title:'Lessonで学ぶ', description:lessonText, href:'html/roadmap.html', keywords:'lesson レッスン 教材 勉強 学ぶ ユニット カリキュラム' },
      { title:'まとめて検索', description:'Lesson・用語・短問・分野・公式問題を横断検索', href:'html/search.html', keywords:'検索 横断 search lesson 用語 問題 公式 分野' },
      { title:'単語辞書', description:'用語だけを統合辞書から検索', href:'html/glossary.html', keywords:'単語 用語 辞書 検索 意味 調べる glossary' },
      { title:'短問演習', description:practiceText, href:'html/practice.html', keywords:'短問 問題 練習 演習 選択 記述 practice' },
      { title:'長文Case', description:caseText, href:'html/cases.html', keywords:'長文 case ケース 科目b 記述' },
      { title:'150分模試', description:'科目A / 科目Bの時間配分練習', href:'html/mock.html', keywords:'模試 本番 科目a 科目b 150分 mock' },
      { title:'公式公開問題', description:'IPA公開問題とLessonを往復', href:'html/official-past.html', keywords:'公式 過去問 ipa 春 秋 午後 科目b' },
      { title:'学習進捗', description:'弱点・復習期限・理解状態', href:'html/progress.html', keywords:'進捗 弱点 復習 成績 理解 progress' },
      { title:'学習データ', description:'Backup / 復元', href:'html/data.html', keywords:'backup バックアップ 復元 データ 保存 import export' }
    ];
  }

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
    const units = [...(curriculum.studyUnits || [])].sort((a,b) => Number(a.order)-Number(b.order));
    if (!units.length) {
      root.replaceChildren();
      const empty = document.createElement('div');
      empty.className = 'dashboard-card';
      empty.textContent = '学習ユニットがありません。教材データを確認してください。';
      root.appendChild(empty);
      return;
    }
    root.innerHTML = units.map(unit => {
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
    if ($('practice-progress-meta')) $('practice-progress-meta').textContent = practiceRetry ? `短問 要復習 ${practiceRetry}問` : '短問の要復習なし';
    if ($('case-progress-number')) $('case-progress-number').textContent = `${caseMastered} / ${cases.length}`;
    if ($('case-progress-meta')) $('case-progress-meta').textContent = caseRetry ? `長文Case 要復習 ${caseRetry}本` : 'Caseの要復習なし';
    if ($('mock-progress-number')) $('mock-progress-number').textContent = `${mockHistory.length} 回`;

    const priority = buildPriority(lessons,questions,cases,lessonProgress,practiceHistory,caseHistory);
    if ($('continue-kicker')) $('continue-kicker').textContent = priority.kind;
    if ($('continue-title')) $('continue-title').textContent = priority.title;
    if ($('continue-meta')) $('continue-meta').textContent = priority.meta;
    if ($('continue-link')) $('continue-link').href = priority.href;
    if ($('continue-hero')) { $('continue-hero').href = priority.href; $('continue-hero').textContent = '▶ 今日の優先項目を続ける'; }
    if ($('hero-lesson')) $('hero-lesson').textContent = `${lessonMastered}/${lessons.length}`;
    if ($('hero-practice')) $('hero-practice').textContent = `${practiceMastered}/${questions.length}`;
    if ($('hero-case')) $('hero-case').textContent = `${caseMastered}/${cases.length}`;
  }

  function renderLoadError(error) {
    console.error('[home] init failed', error);
    if ($('continue-kicker')) $('continue-kicker').textContent = 'LOAD ERROR';
    if ($('continue-title')) $('continue-title').textContent = '教材データを読み込めませんでした';
    if ($('continue-meta')) $('continue-meta').textContent = '通信状態を確認してページを再読み込みしてください。主要機能のカードはそのまま利用できます。';
    for (const id of ['continue-link','continue-hero']) {
      const link = $(id);
      if (!link) continue;
      link.href = 'index.html';
      link.textContent = '再読み込み →';
    }
    if ($('practice-progress-meta')) $('practice-progress-meta').textContent = '短問の集計に失敗';
    if ($('case-progress-meta')) $('case-progress-meta').textContent = 'Caseの集計に失敗';
    const root = $('home-unit-grid');
    if (root) {
      root.replaceChildren();
      const box = document.createElement('div');
      box.className = 'dashboard-card';
      const text = document.createElement('p');
      text.textContent = '学習ユニットを読み込めませんでした。';
      const retry = document.createElement('a');
      retry.href = 'index.html';
      retry.textContent = 'ページを再読み込み';
      box.append(text,retry);
      root.appendChild(box);
    }
    setupFinder({ studyUnits:[] }, {});
  }

  function setupFinder(curriculum, stats = {}) {
    const input = $('home-quick-search');
    const output = $('home-quick-results');
    if (!input || !output) return;
    const unitActions = (curriculum.studyUnits || []).map(unit => ({ title:unit.title, description:`学習ユニット / IPA中分類 ${(unit.officialMiddleCodes || []).join('・')}`, href:`html/unit.html?unit=${encodeURIComponent(unit.id)}`, keywords:`${unit.id} ${unit.title} ${(unit.officialMiddleCodes || []).join(' ')}` }));
    finderCatalog = [...buildQuickActions(stats),...unitActions].map(item => ({...item,searchable:normalize(`${item.title} ${item.description} ${item.keywords}`)}));
    if (finderBound) return;
    finderBound = true;

    const render = () => {
      const raw = input.value.trim();
      if (!raw) { output.hidden = true; output.innerHTML=''; return; }
      const query = normalize(raw);
      const hits = finderCatalog.filter(item => item.searchable.includes(query)).slice(0,6);
      output.innerHTML = hits.map(item => `<a href="${item.href}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></a>`).join('') + `<a class="home-quick-glossary" href="html/search.html?q=${encodeURIComponent(raw)}"><strong>🔎 「${escapeHtml(raw)}」をすべてから検索</strong><span>Lesson・用語・短問・分野・公式問題を横断検索</span></a>`;
      output.hidden = false;
    };
    input.addEventListener('input',render);
    input.addEventListener('keydown',event => {
      if (event.key !== 'Enter' || !input.value.trim()) return;
      event.preventDefault();
      const first = output.querySelector('a');
      if (first) location.href = first.href;
      else location.href = `html/search.html?q=${encodeURIComponent(input.value.trim())}`;
    });
    document.addEventListener('click',event => { if (!event.target.closest('.home-finder')) output.hidden=true; });
  }

  async function init() {
    if (!window.APStudyState || !window.APLessonData?.load || !window.APPracticeData?.load || !window.APCaseData?.load) throw new Error('共通Data Loaderが不足しています。');
    const [curriculum,lessonBank,practiceBank,caseBank] = await Promise.all([
      fetchJson('json/curriculum/ap-2026-map.json'),
      window.APLessonData.load(''),
      window.APPracticeData.load(''),
      window.APCaseData.load('')
    ]);
    const lessons = lessonBank.lessons || [];
    const questions = practiceBank.questions || [];
    const cases = caseBank.cases || [];
    const lessonProgress = readObject(LESSON_KEY);
    const practiceHistory = readObject(PRACTICE_KEY);
    const caseHistory = readObject(CASE_KEY);
    const mockHistory = readArray(MOCK_KEY);
    renderDashboard(lessons,questions,cases,lessonProgress,practiceHistory,caseHistory,mockHistory);
    renderUnits(curriculum,lessons,lessonProgress);
    setupFinder(curriculum,{ lessonCount:lessons.length, practiceCount:questions.length, caseCount:cases.length });
  }

  window.addEventListener('storage', event => { if ([LESSON_KEY,PRACTICE_KEY,CASE_KEY,MOCK_KEY].includes(event.key)) init().catch(renderLoadError); });
  window.addEventListener('ap-lesson-progress-changed', () => init().catch(renderLoadError));
  document.addEventListener('DOMContentLoaded', () => init().catch(renderLoadError));
})();
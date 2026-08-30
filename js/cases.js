(() => {
  'use strict';

  const HISTORY_KEY = 'ap-study-case-history-v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const minCaseChars = () => Number(window.APStudyState?.config?.CASE_MIN_CHARS || 20);
  let cases = [];
  let filteredCases = [];
  let units = [];
  let currentId = '';

  async function fetchJson(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function readHistory() { return window.APStudyState?.readObject?.(HISTORY_KEY) || {}; }
  function writeHistory(value) { window.APStudyState?.writeJson?.(HISTORY_KEY, value); }
  function caseRecord(caseId) { return readHistory()[caseId] || { questions:{} }; }
  function caseState(item, record) { return window.APStudyState?.caseState?.(item, record) || { state:Object.keys(record?.questions || {}).length ? 'retry' : 'unattempted', label:Object.keys(record?.questions || {}).length ? '途中・要復習' : '未挑戦', mastered:false }; }

  function caseStatus(item, record) {
    const state = caseState(item, record);
    if (state.mastered || state.state === 'due') return state.label;
    const graded = Object.keys(record?.questions || {}).length;
    return graded ? `${graded}/${item.questions.length}回答 · ${state.label}` : '未挑戦';
  }

  function unitLabel(unitId) { return units.find(unit => unit.id === unitId)?.title || unitId; }

  function saveGrade(item, question, score, answer) {
    const history = readHistory();
    const previousCase = history[item.id] || { questions:{}, attempts:0 };
    const previousQuestion = previousCase.questions?.[question.id] || {};
    const nextQuestions = {
      ...(previousCase.questions || {}),
      [question.id]: {
        ...previousQuestion,
        attempts:Number(previousQuestion.attempts || 0) + 1,
        bestScore:Math.max(Number(previousQuestion.bestScore || 0), Number(score)),
        recentScores:window.APStudyState?.appendRecentScore?.(previousQuestion, score) || [Number(score)],
        latestScore:Number(score),
        latestAnswer:answer,
        updatedAt:Date.now()
      }
    };
    const complete = item.questions.every(q => nextQuestions[q.id]);
    history[item.id] = {
      ...previousCase,
      questions:nextQuestions,
      attempts:Number(previousCase.attempts || 0) + (complete ? 1 : 0),
      completed:complete,
      updatedAt:Date.now()
    };
    writeHistory(history);
    renderSummary();
    renderList();
  }

  function renderSummary() {
    const history = readHistory();
    const attempted = cases.filter(item => Object.keys(history[item.id]?.questions || {}).length).length;
    const completed = cases.filter(item => item.questions.every(q => history[item.id]?.questions?.[q.id])).length;
    const mastered = cases.filter(item => caseState(item, history[item.id] || {}).mastered).length;
    const due = cases.filter(item => caseState(item, history[item.id] || {}).state === 'due').length;
    const totalQuestions = cases.reduce((sum,item) => sum + item.questions.length, 0);
    $('cases-summary').innerHTML = `<div><strong>${cases.length}</strong><span>Case</span></div><div><strong>${totalQuestions}</strong><span>設問</span></div><div><strong>${attempted}</strong><span>挑戦済みCase</span></div><div><strong>${completed}</strong><span>全設問回答済み</span></div><div><strong>${mastered}</strong><span>理解済み${due ? ` · 復習期限${due}` : ''}</span></div>`;
  }

  function updateUrl() {
    const params = new URLSearchParams();
    const unit = $('cases-unit')?.value || 'all';
    const status = $('cases-status')?.value || 'all';
    if (unit !== 'all') params.set('unit', unit);
    if (status !== 'all') params.set('status', status);
    if (currentId) params.set('case', currentId);
    history.replaceState(null,'',`${location.pathname}${params.toString() ? `?${params}` : ''}`);
  }

  function renderList() {
    const history = readHistory();
    if (!filteredCases.length) {
      $('cases-list').innerHTML = '<p class="cases-empty">条件に一致するCaseがありません。</p>';
      $('case-main').innerHTML = '<p class="cases-empty">絞り込み条件を変更してください。</p>';
      return;
    }
    if (!filteredCases.some(item => item.id === currentId)) currentId = filteredCases[0].id;
    $('cases-list').innerHTML = filteredCases.map(item => {
      const record = history[item.id] || {};
      return `<button type="button" class="cases-list-item ${item.id === currentId ? 'is-current' : ''}" data-case-id="${escapeHtml(item.id)}"><span>${escapeHtml(item.id)} · ${escapeHtml(unitLabel(item.unitId))}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(caseStatus(item, record))} · ${item.estimatedMinutes}分目安</small></button>`;
    }).join('');
    $('cases-list').querySelectorAll('[data-case-id]').forEach(button => button.addEventListener('click', () => { currentId = button.dataset.caseId; updateUrl(); renderList(); renderCase(); }));
  }

  function lessonLinks(item) {
    return `<div class="case-lessons"><strong>関連Lesson</strong>${(item.lessonRefs || []).map(id => `<a href="lesson.html?id=${encodeURIComponent(id)}">${escapeHtml(id)}</a>`).join('')}</div>`;
  }

  function renderCase() {
    const item = cases.find(c => c.id === currentId);
    if (!item) return;
    const record = caseRecord(item.id);
    const min = minCaseChars();
    $('case-main').innerHTML = `<div class="case-meta"><span>${escapeHtml(item.id)}</span><span>${escapeHtml(unitLabel(item.unitId))}</span><span>中分類 ${(item.middleCodes || []).join('・')}</span><span>難易度 ${item.difficulty}</span><span>${item.estimatedMinutes}分</span></div><h2>${escapeHtml(item.title)}</h2><section class="case-scenario"><h3>状況</h3>${item.scenario.map(p => `<p>${escapeHtml(p)}</p>`).join('')}</section><div class="case-questions">${item.questions.map((q,index) => {
      const saved = record.questions?.[q.id];
      const qState = window.APStudyState?.caseQuestionState?.(saved) || { label:saved ? '要復習' : '未挑戦' };
      return `<section class="case-question" data-question-id="${escapeHtml(q.id)}"><div class="case-question-heading"><span>設問 ${index + 1}</span>${saved ? `<strong>${escapeHtml(qState.label)} · Best ${Number(saved.bestScore || 0)}/2</strong>` : ''}</div><h3>${escapeHtml(q.prompt)}</h3><textarea rows="6" placeholder="本文の根拠と自分の判断を${min}文字以上で書いてください。">${escapeHtml(saved?.latestAnswer || '')}</textarea><button type="button" class="case-reveal" disabled>模範解答・採点観点</button><p class="case-answer-help">${min}文字以上の回答が必要です。</p><div class="case-model" hidden><h4>モデル解答</h4><p>${escapeHtml(q.modelAnswer)}</p><h4>採点観点</h4><ul>${q.points.map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul><div class="case-grade"><strong>自己評価</strong><button data-score="2">できた</button><button data-score="1">一部</button><button data-score="0">できなかった</button></div></div></section>`;
    }).join('')}</div>${lessonLinks(item)}`;

    $('case-main').querySelectorAll('.case-question').forEach(node => {
      const question = item.questions.find(q => q.id === node.dataset.questionId);
      const model = node.querySelector('.case-model');
      const textarea = node.querySelector('textarea');
      const reveal = node.querySelector('.case-reveal');
      const help = node.querySelector('.case-answer-help');
      const sync = () => {
        const length = textarea.value.trim().length;
        reveal.disabled = length < min;
        help.textContent = length < min ? `あと ${min - length}文字必要です。` : '回答済み。模範解答を開いて自己採点できます。';
      };
      textarea.addEventListener('input', sync); sync();
      reveal.addEventListener('click', () => { model.hidden = false; reveal.disabled = true; textarea.readOnly = true; });
      node.querySelectorAll('[data-score]').forEach(button => button.addEventListener('click', () => {
        if (model.dataset.graded === 'true') return;
        const answer = textarea.value.trim();
        if (answer.length < min) return;
        model.dataset.graded = 'true';
        const score = Number(button.dataset.score);
        saveGrade(item, question, score, answer);
        node.querySelectorAll('[data-score]').forEach(b => b.disabled = true);
        button.classList.add('selected');
      }));
    });
  }

  function applyFilters() {
    const history = readHistory();
    const unit = $('cases-unit')?.value || 'all';
    const status = $('cases-status')?.value || 'all';
    filteredCases = cases.filter(item => {
      const state = caseState(item, history[item.id] || {});
      return (unit === 'all' || item.unitId === unit) && (status === 'all' || (status === 'mastered' && state.mastered) || (status === 'retry' && state.state !== 'unattempted' && !state.mastered) || (status === 'unattempted' && state.state === 'unattempted'));
    });
    if (!filteredCases.some(item => item.id === currentId)) currentId = filteredCases[0]?.id || '';
    updateUrl(); renderList(); renderCase();
  }

  function applyInitialParams() {
    const params = new URLSearchParams(location.search);
    const requestedUnit = params.get('unit');
    const requestedStatus = params.get('status');
    if (requestedUnit && [...$('cases-unit').options].some(option => option.value === requestedUnit)) $('cases-unit').value = requestedUnit;
    if (requestedStatus && [...$('cases-status').options].some(option => option.value === requestedStatus)) $('cases-status').value = requestedStatus;
    const requestedCase = params.get('case');
    if (requestedCase && cases.some(item => item.id === requestedCase)) currentId = requestedCase;
  }

  async function init() {
    if (!window.APCaseData?.load) throw new Error('case-data.js が読み込まれていません。');
    if (!window.APStudyState) throw new Error('study-state.js が読み込まれていません。');
    const [bank, curriculum] = await Promise.all([window.APCaseData.load('../'), fetchJson('json/curriculum/ap-2026-map.json')]);
    cases = Array.isArray(bank.cases) ? bank.cases : [];
    units = [...(curriculum.studyUnits || [])].sort((a,b) => Number(a.order) - Number(b.order));
    $('cases-unit').insertAdjacentHTML('beforeend', units.map(unit => `<option value="${escapeHtml(unit.id)}">${escapeHtml(unit.title)}</option>`).join(''));
    currentId = cases[0]?.id || '';
    applyInitialParams();
    $('cases-unit').addEventListener('change', applyFilters);
    $('cases-status').addEventListener('change', applyFilters);
    $('cases-random').addEventListener('click', () => { if (!filteredCases.length) return; currentId = filteredCases[Math.floor(Math.random() * filteredCases.length)].id; updateUrl(); renderList(); renderCase(); });
    filteredCases = [...cases]; renderSummary(); applyFilters();
  }

  window.addEventListener('storage', event => { if (event.key === HISTORY_KEY) { renderSummary(); applyFilters(); } });
  document.addEventListener('DOMContentLoaded', () => init().catch(error => { console.error(error); $('case-main').innerHTML = `<p>長文Caseの読み込みに失敗しました: ${escapeHtml(error.message)}</p>`; }));
})();
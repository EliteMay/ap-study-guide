(() => {
  'use strict';

  const HISTORY_KEY = 'ap-study-case-history-v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let cases = [];
  let currentId = '';

  async function fetchJson(path) {
    const response = await fetch(`../${path}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function readHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }

  function writeHistory(value) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(value)); } catch {}
  }

  function caseRecord(caseId) {
    return readHistory()[caseId] || { questions:{} };
  }

  function caseStatus(item, record) {
    const total = item.questions.length;
    const graded = Object.keys(record?.questions || {}).length;
    const mastered = Object.values(record?.questions || {}).filter(q => Number(q.bestScore) >= 2).length;
    if (graded === total && mastered === total) return '理解済み';
    if (graded) return `${graded}/${total}回答`;
    return '未挑戦';
  }

  function saveGrade(item, question, score, answer) {
    const history = readHistory();
    const previousCase = history[item.id] || { questions:{}, attempts:0 };
    const previousQuestion = previousCase.questions?.[question.id] || {};
    const nextQuestions = {
      ...(previousCase.questions || {}),
      [question.id]: {
        attempts:Number(previousQuestion.attempts || 0) + 1,
        bestScore:Math.max(Number(previousQuestion.bestScore || 0), Number(score)),
        latestScore:Number(score),
        latestAnswer:answer,
        updatedAt:Date.now()
      }
    };
    const complete = item.questions.every(q => nextQuestions[q.id]);
    history[item.id] = {
      questions:nextQuestions,
      attempts:Number(previousCase.attempts || 0) + (complete && !previousCase.completed ? 1 : 0),
      completed:Boolean(previousCase.completed || complete),
      updatedAt:Date.now()
    };
    writeHistory(history);
    renderSummary();
    renderList();
  }

  function renderSummary() {
    const history = readHistory();
    const attempted = cases.filter(item => Object.keys(history[item.id]?.questions || {}).length).length;
    const completed = cases.filter(item => history[item.id]?.completed).length;
    const mastered = cases.filter(item => item.questions.every(q => Number(history[item.id]?.questions?.[q.id]?.bestScore || 0) >= 2)).length;
    const totalQuestions = cases.reduce((sum,item) => sum + item.questions.length, 0);
    $('cases-summary').innerHTML = `
      <div><strong>${cases.length}</strong><span>Case</span></div>
      <div><strong>${totalQuestions}</strong><span>設問</span></div>
      <div><strong>${attempted}</strong><span>挑戦済みCase</span></div>
      <div><strong>${completed}</strong><span>全設問回答済み</span></div>
      <div><strong>${mastered}</strong><span>全設問理解済み</span></div>`;
  }

  function renderList() {
    const history = readHistory();
    $('cases-list').innerHTML = cases.map(item => {
      const record = history[item.id] || {};
      return `<button type="button" class="cases-list-item ${item.id === currentId ? 'is-current' : ''}" data-case-id="${escapeHtml(item.id)}"><span>${escapeHtml(item.id)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(caseStatus(item, record))} · ${item.estimatedMinutes}分目安</small></button>`;
    }).join('');
    $('cases-list').querySelectorAll('[data-case-id]').forEach(button => button.addEventListener('click', () => {
      currentId = button.dataset.caseId;
      history.replaceState(null,'',`${location.pathname}?case=${encodeURIComponent(currentId)}`);
      renderList();
      renderCase();
    }));
  }

  function lessonLinks(item) {
    return `<div class="case-lessons"><strong>関連Lesson</strong>${(item.lessonRefs || []).map(id => `<a href="lesson.html?id=${encodeURIComponent(id)}">${escapeHtml(id)}</a>`).join('')}</div>`;
  }

  function renderCase() {
    const item = cases.find(c => c.id === currentId);
    if (!item) return;
    const record = caseRecord(item.id);
    $('case-main').innerHTML = `
      <div class="case-meta"><span>${escapeHtml(item.id)}</span><span>中分類 ${(item.middleCodes || []).join('・')}</span><span>難易度 ${item.difficulty}</span><span>${item.estimatedMinutes}分</span></div>
      <h2>${escapeHtml(item.title)}</h2>
      <section class="case-scenario"><h3>状況</h3>${item.scenario.map(p => `<p>${escapeHtml(p)}</p>`).join('')}</section>
      <div class="case-questions">${item.questions.map((q,index) => {
        const saved = record.questions?.[q.id];
        return `<section class="case-question" data-question-id="${escapeHtml(q.id)}"><div class="case-question-heading"><span>設問 ${index + 1}</span>${saved ? `<strong>Best ${Number(saved.bestScore || 0)}/2</strong>` : ''}</div><h3>${escapeHtml(q.prompt)}</h3><textarea rows="6" placeholder="本文の根拠と自分の判断を書いてください。">${escapeHtml(saved?.latestAnswer || '')}</textarea><button type="button" class="case-reveal">模範解答・採点観点</button><div class="case-model" hidden><h4>モデル解答</h4><p>${escapeHtml(q.modelAnswer)}</p><h4>採点観点</h4><ul>${q.points.map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul><div class="case-grade"><strong>自己評価</strong><button data-score="2">できた</button><button data-score="1">一部</button><button data-score="0">できなかった</button></div></div></section>`;
      }).join('')}</div>
      ${lessonLinks(item)}`;

    $('case-main').querySelectorAll('.case-question').forEach(node => {
      const question = item.questions.find(q => q.id === node.dataset.questionId);
      const model = node.querySelector('.case-model');
      node.querySelector('.case-reveal').addEventListener('click', event => {
        model.hidden = false;
        event.currentTarget.disabled = true;
      });
      node.querySelectorAll('[data-score]').forEach(button => button.addEventListener('click', () => {
        if (model.dataset.graded === 'true') return;
        model.dataset.graded = 'true';
        const score = Number(button.dataset.score);
        const answer = node.querySelector('textarea').value.trim();
        saveGrade(item, question, score, answer);
        node.querySelectorAll('[data-score]').forEach(b => b.disabled = true);
        button.classList.add('selected');
      }));
    });
  }

  async function init() {
    const data = await fetchJson('json/cases/ap-subject-b-cases-v1.json');
    cases = Array.isArray(data.cases) ? data.cases : [];
    const requested = new URLSearchParams(location.search).get('case');
    currentId = cases.some(item => item.id === requested) ? requested : (cases[0]?.id || '');
    renderSummary();
    renderList();
    renderCase();
  }

  window.addEventListener('storage', event => { if (event.key === HISTORY_KEY) { renderSummary(); renderList(); renderCase(); } });
  document.addEventListener('DOMContentLoaded', () => init().catch(error => {
    console.error(error);
    $('case-main').innerHTML = `<p>長文Caseの読み込みに失敗しました: ${escapeHtml(error.message)}</p>`;
  }));
})();
(() => {
  'use strict';

  const HISTORY_KEY = 'ap-study-practice-history-v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let questions = [];
  let units = [];
  let filtered = [];
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

  function writeHistory(history) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
  }

  function saveResult(question, result) {
    const history = readHistory();
    const previous = history[question.id] || {};
    history[question.id] = {
      attempts:Number(previous.attempts || 0) + 1,
      bestScore:Math.max(Number(previous.bestScore || 0), Number(result.score || 0)),
      latestScore:Number(result.score || 0),
      latestCorrect:result.correct === true,
      latestAnswer:result.answer || '',
      updatedAt:Date.now()
    };
    writeHistory(history);
    renderSummary();
    renderList();
  }

  function unitLabel(id) {
    return units.find(unit => unit.id === id)?.title || id;
  }

  function difficultyLabel(value) {
    return Number(value) >= 4 ? 'やや難' : Number(value) === 3 ? '応用' : '標準';
  }

  function lessonLinks(question) {
    const refs = question.lessonRefs || [];
    if (!refs.length) return '';
    return `<div class="practice-lesson-links"><strong>関連Lesson</strong>${refs.map(id => `<a href="lesson.html?id=${encodeURIComponent(id)}">${escapeHtml(id)}</a>`).join('')}</div>`;
  }

  function resultLabel(question, record) {
    if (!record) return '未挑戦';
    if (question.type === 'choice') return record.bestScore >= 1 ? '正解済み' : '再挑戦';
    return record.bestScore >= 2 ? '自己評価◎' : record.bestScore >= 1 ? '自己評価△' : '再挑戦';
  }

  function renderSummary() {
    const history = readHistory();
    const attempted = questions.filter(q => history[q.id]).length;
    const mastered = questions.filter(q => {
      const h = history[q.id];
      if (!h) return false;
      return q.type === 'choice' ? Number(h.bestScore) >= 1 : Number(h.bestScore) >= 2;
    }).length;
    $('practice-summary').innerHTML = `
      <div><strong>${questions.length}</strong><span>全問題</span></div>
      <div><strong>${attempted}</strong><span>挑戦済み</span></div>
      <div><strong>${mastered}</strong><span>理解できた</span></div>
      <div><strong>${filtered.length}</strong><span>現在の絞込</span></div>`;
  }

  function renderList() {
    const history = readHistory();
    if (!filtered.length) {
      $('practice-list').innerHTML = '<p class="practice-empty">条件に一致する問題がありません。</p>';
      $('practice-question').innerHTML = '<p class="practice-empty">Filterを変更してください。</p>';
      return;
    }
    if (!filtered.some(q => q.id === currentId)) currentId = filtered[0].id;
    $('practice-list').innerHTML = filtered.map(q => {
      const record = history[q.id];
      return `<button type="button" class="practice-list-item ${q.id === currentId ? 'is-current' : ''} ${record ? 'is-attempted' : ''}" data-question-id="${escapeHtml(q.id)}"><span>${escapeHtml(q.id)} · ${escapeHtml(q.type === 'choice' ? '選択' : '記述')}</span><strong>${escapeHtml(q.title)}</strong><small>${escapeHtml(unitLabel(q.unitId))} · ${escapeHtml(difficultyLabel(q.difficulty))} · ${escapeHtml(resultLabel(q, record))}</small></button>`;
    }).join('');
    $('practice-list').querySelectorAll('[data-question-id]').forEach(button => button.addEventListener('click', () => {
      currentId = button.dataset.questionId;
      renderList();
      renderQuestion();
    }));
  }

  function renderChoice(question) {
    $('practice-question').innerHTML = `
      <div class="practice-question-meta"><span>${escapeHtml(question.id)}</span><span>${escapeHtml(unitLabel(question.unitId))}</span><span>${escapeHtml(difficultyLabel(question.difficulty))}</span></div>
      <h2>${escapeHtml(question.title)}</h2>
      <p class="practice-prompt">${escapeHtml(question.prompt)}</p>
      <div class="practice-options">${question.options.map((option,index) => `<button type="button" data-choice="${index}">${escapeHtml(option)}</button>`).join('')}</div>
      <div id="practice-feedback" class="practice-feedback" hidden></div>
      ${lessonLinks(question)}`;
    const buttons = [...$('practice-question').querySelectorAll('[data-choice]')];
    buttons.forEach(button => button.addEventListener('click', () => {
      if (buttons.some(item => item.disabled)) return;
      const selected = Number(button.dataset.choice);
      const correct = selected === Number(question.answerIndex);
      buttons.forEach(item => {
        item.disabled = true;
        if (Number(item.dataset.choice) === Number(question.answerIndex)) item.classList.add('correct');
      });
      if (!correct) button.classList.add('wrong');
      const feedback = $('practice-feedback');
      feedback.hidden = false;
      feedback.className = `practice-feedback ${correct ? 'correct' : 'wrong'}`;
      feedback.innerHTML = `<strong>${correct ? '正解' : '不正解'}</strong><p>${escapeHtml(question.explanation || '')}</p>`;
      saveResult(question, { score:correct ? 1 : 0, correct, answer:String(selected) });
    }));
  }

  function renderWritten(question) {
    $('practice-question').innerHTML = `
      <div class="practice-question-meta"><span>${escapeHtml(question.id)}</span><span>${escapeHtml(unitLabel(question.unitId))}</span><span>${escapeHtml(difficultyLabel(question.difficulty))}</span></div>
      <h2>${escapeHtml(question.title)}</h2>
      <p class="practice-prompt">${escapeHtml(question.prompt)}</p>
      <label class="practice-written-label">自分の回答<textarea id="practice-written-answer" rows="7" placeholder="先に自分の言葉で書いてから模範観点を開いてください。"></textarea></label>
      <button type="button" class="practice-reveal" id="practice-reveal">模範解答と採点観点を表示</button>
      <div id="practice-model" class="practice-model" hidden>
        <h3>モデル解答</h3><p>${escapeHtml(question.modelAnswer || '')}</p>
        <h3>採点観点</h3><ul>${(question.points || []).map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul>
        <div class="practice-self-grade"><strong>自分で評価</strong><button type="button" data-grade="2">できた</button><button type="button" data-grade="1">一部できた</button><button type="button" data-grade="0">できなかった</button></div>
      </div>
      ${lessonLinks(question)}`;
    $('practice-reveal').addEventListener('click', () => {
      $('practice-model').hidden = false;
      $('practice-reveal').disabled = true;
    });
    $('practice-question').querySelectorAll('[data-grade]').forEach(button => button.addEventListener('click', () => {
      if ($('practice-model').dataset.graded === 'true') return;
      $('practice-model').dataset.graded = 'true';
      const score = Number(button.dataset.grade);
      const answer = $('practice-written-answer').value.trim();
      saveResult(question, { score, correct:score === 2, answer });
      $('practice-question').querySelectorAll('[data-grade]').forEach(item => item.disabled = true);
      button.classList.add('selected');
    }));
  }

  function renderQuestion() {
    const question = questions.find(q => q.id === currentId);
    if (!question) return;
    if (question.type === 'written') renderWritten(question);
    else renderChoice(question);
  }

  function applyFilters() {
    const unit = $('practice-unit').value;
    const type = $('practice-type').value;
    const difficulty = $('practice-difficulty').value;
    filtered = questions.filter(q =>
      (unit === 'all' || q.unitId === unit) &&
      (type === 'all' || q.type === type) &&
      (difficulty === 'all' || String(q.difficulty) === difficulty)
    );
    if (!filtered.some(q => q.id === currentId)) currentId = filtered[0]?.id || '';
    renderSummary();
    renderList();
    renderQuestion();
  }

  async function init() {
    const [bank, curriculum] = await Promise.all([
      fetchJson('json/practice/ap-original-practice-v1.json'),
      fetchJson('json/curriculum/ap-2026-map.json')
    ]);
    questions = Array.isArray(bank.questions) ? bank.questions : [];
    units = [...(curriculum.studyUnits || [])].sort((a,b) => Number(a.order) - Number(b.order));
    $('practice-unit').insertAdjacentHTML('beforeend', units.map(unit => `<option value="${escapeHtml(unit.id)}">${escapeHtml(unit.title)}</option>`).join(''));
    ['practice-unit','practice-type','practice-difficulty'].forEach(id => $(id).addEventListener('change', applyFilters));
    $('practice-random').addEventListener('click', () => {
      if (!filtered.length) return;
      currentId = filtered[Math.floor(Math.random() * filtered.length)].id;
      renderList();
      renderQuestion();
    });
    filtered = [...questions];
    currentId = filtered[0]?.id || '';
    renderSummary();
    renderList();
    renderQuestion();
  }

  window.addEventListener('storage', event => { if (event.key === HISTORY_KEY) { renderSummary(); renderList(); } });
  document.addEventListener('DOMContentLoaded', () => init().catch(error => {
    console.error(error);
    $('practice-question').innerHTML = `<p class="practice-empty">総合演習の読み込みに失敗しました: ${escapeHtml(error.message)}</p>`;
  }));
})();
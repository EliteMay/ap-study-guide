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

  function isMastered(question, record) {
    if (!record) return false;
    return question.type === 'choice' ? Number(record.bestScore) >= 1 : Number(record.bestScore) >= 2;
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

  function unitLabel(id) { return units.find(unit => unit.id === id)?.title || id; }
  function difficultyLabel(value) { return Number(value) >= 4 ? 'やや難' : Number(value) === 3 ? '応用' : '標準'; }
  function resultLabel(question, record) { return !record ? '未挑戦' : isMastered(question, record) ? '理解済み' : '要復習'; }

  function lessonLinks(question) {
    return (question.lessonRefs || []).length
      ? `<div class="practice-lesson-links"><strong>関連Lesson</strong>${question.lessonRefs.map(id => `<a href="lesson.html?id=${encodeURIComponent(id)}">${escapeHtml(id)}</a>`).join('')}</div>`
      : '';
  }

  function renderSummary() {
    const history = readHistory();
    const attempted = questions.filter(q => history[q.id]).length;
    const mastered = questions.filter(q => isMastered(q, history[q.id])).length;
    const retry = questions.filter(q => history[q.id] && !isMastered(q, history[q.id])).length;
    $('practice-summary').innerHTML = `<div><strong>${questions.length}</strong><span>全問題</span></div><div><strong>${attempted}</strong><span>挑戦済み</span></div><div><strong>${mastered}</strong><span>理解済み</span></div><div><strong>${retry}</strong><span>要復習</span></div>`;
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
      return `<button type="button" class="practice-list-item ${q.id === currentId ? 'is-current' : ''} ${record ? 'is-attempted' : ''}" data-question-id="${escapeHtml(q.id)}"><span>${escapeHtml(q.id)} · ${q.type === 'choice' ? '選択' : '記述'}</span><strong>${escapeHtml(q.title)}</strong><small>${escapeHtml(unitLabel(q.unitId))} · ${escapeHtml(difficultyLabel(q.difficulty))} · ${escapeHtml(resultLabel(q, record))}</small></button>`;
    }).join('');
    $('practice-list').querySelectorAll('[data-question-id]').forEach(button => button.addEventListener('click', () => {
      currentId = button.dataset.questionId;
      updateUrl();
      renderList();
      renderQuestion();
    }));
  }

  function updateUrl() {
    const params = new URLSearchParams();
    for (const [key,value] of [['unit',$('practice-unit').value],['type',$('practice-type').value],['difficulty',$('practice-difficulty').value],['status',$('practice-status').value]]) {
      if (value && value !== 'all') params.set(key,value);
    }
    if (currentId) params.set('question', currentId);
    history.replaceState(null, '', `${location.pathname}${params.toString() ? `?${params}` : ''}`);
  }

  function nextQuestion() {
    if (!filtered.length) return;
    const index = filtered.findIndex(q => q.id === currentId);
    currentId = filtered[(index + 1 + filtered.length) % filtered.length].id;
    updateUrl();
    renderList();
    renderQuestion();
    $('practice-question')?.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function attachNext(root) { root.querySelector('[data-practice-next]')?.addEventListener('click', nextQuestion); }

  function renderChoice(question) {
    const record = readHistory()[question.id];
    $('practice-question').innerHTML = `<div class="practice-question-meta"><span>${escapeHtml(question.id)}</span><span>${escapeHtml(unitLabel(question.unitId))}</span><span>${escapeHtml(difficultyLabel(question.difficulty))}</span>${record ? `<span>${escapeHtml(resultLabel(question, record))} · ${Number(record.attempts || 0)}回</span>` : ''}</div><h2>${escapeHtml(question.title)}</h2><p class="practice-prompt">${escapeHtml(question.prompt)}</p><div class="practice-options">${question.options.map((option,index) => `<button type="button" data-choice="${index}">${escapeHtml(option)}</button>`).join('')}</div><div id="practice-feedback" class="practice-feedback" hidden></div>${lessonLinks(question)}`;
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
      feedback.innerHTML = `<strong>${correct ? '正解' : '不正解'}</strong><p>${escapeHtml(question.explanation || '')}</p><button type="button" class="practice-next" data-practice-next>次の問題 →</button>`;
      saveResult(question, { score:correct ? 1 : 0, correct, answer:String(selected) });
      attachNext(feedback);
    }));
  }

  function renderWritten(question) {
    const record = readHistory()[question.id];
    $('practice-question').innerHTML = `<div class="practice-question-meta"><span>${escapeHtml(question.id)}</span><span>${escapeHtml(unitLabel(question.unitId))}</span><span>${escapeHtml(difficultyLabel(question.difficulty))}</span>${record ? `<span>${escapeHtml(resultLabel(question, record))} · ${Number(record.attempts || 0)}回</span>` : ''}</div><h2>${escapeHtml(question.title)}</h2><p class="practice-prompt">${escapeHtml(question.prompt)}</p><label class="practice-written-label">自分の回答<textarea id="practice-written-answer" rows="7" placeholder="先に自分の言葉で書いてから模範観点を開いてください。"></textarea></label><button type="button" class="practice-reveal" id="practice-reveal">模範解答と採点観点を表示</button><div id="practice-model" class="practice-model" hidden><h3>モデル解答</h3><p>${escapeHtml(question.modelAnswer || '')}</p><h3>採点観点</h3><ul>${(question.points || []).map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul><div class="practice-self-grade"><strong>自分で評価</strong><button type="button" data-grade="2">できた</button><button type="button" data-grade="1">一部できた</button><button type="button" data-grade="0">できなかった</button><button type="button" class="practice-next" data-practice-next hidden>次の問題 →</button></div></div>${lessonLinks(question)}`;
    $('practice-reveal').addEventListener('click', () => { $('practice-model').hidden = false; $('practice-reveal').disabled = true; });
    $('practice-question').querySelectorAll('[data-grade]').forEach(button => button.addEventListener('click', () => {
      if ($('practice-model').dataset.graded === 'true') return;
      $('practice-model').dataset.graded = 'true';
      const score = Number(button.dataset.grade);
      saveResult(question, { score, correct:score === 2, answer:$('practice-written-answer').value.trim() });
      $('practice-question').querySelectorAll('[data-grade]').forEach(item => item.disabled = true);
      button.classList.add('selected');
      const next = $('practice-question').querySelector('[data-practice-next]');
      if (next) next.hidden = false;
      attachNext($('practice-question'));
    }));
  }

  function renderQuestion() {
    const question = questions.find(q => q.id === currentId);
    if (question) question.type === 'written' ? renderWritten(question) : renderChoice(question);
  }

  function applyFilters() {
    const savedHistory = readHistory();
    const unit = $('practice-unit').value;
    const type = $('practice-type').value;
    const difficulty = $('practice-difficulty').value;
    const status = $('practice-status').value;
    filtered = questions.filter(q => {
      const record = savedHistory[q.id];
      const statusMatch = status === 'all' || (status === 'unattempted' && !record) || (status === 'retry' && record && !isMastered(q, record)) || (status === 'mastered' && isMastered(q, record));
      return (unit === 'all' || q.unitId === unit) && (type === 'all' || q.type === type) && (difficulty === 'all' || String(q.difficulty) === difficulty) && statusMatch;
    });
    if (!filtered.some(q => q.id === currentId)) currentId = filtered[0]?.id || '';
    updateUrl();
    renderSummary();
    renderList();
    renderQuestion();
  }

  function applyInitialParams() {
    const params = new URLSearchParams(location.search);
    for (const [param,id] of [['unit','practice-unit'],['type','practice-type'],['difficulty','practice-difficulty'],['status','practice-status']]) {
      const value = params.get(param);
      const select = $(id);
      if (value && [...select.options].some(option => option.value === value)) select.value = value;
    }
    const requested = params.get('question');
    if (requested && questions.some(question => question.id === requested)) currentId = requested;
  }

  async function init() {
    if (!window.APPracticeData?.load) throw new Error('practice-data.js が読み込まれていません。');
    const [bank, curriculum] = await Promise.all([window.APPracticeData.load('../'), fetchJson('json/curriculum/ap-2026-map.json')]);
    questions = bank.questions || [];
    units = [...(curriculum.studyUnits || [])].sort((a,b) => Number(a.order) - Number(b.order));
    $('practice-unit').insertAdjacentHTML('beforeend', units.map(unit => `<option value="${escapeHtml(unit.id)}">${escapeHtml(unit.title)}</option>`).join(''));
    currentId = questions[0]?.id || '';
    applyInitialParams();
    for (const id of ['practice-unit','practice-type','practice-difficulty','practice-status']) $(id).addEventListener('change', applyFilters);
    $('practice-random').addEventListener('click', () => {
      if (!filtered.length) return;
      currentId = filtered[Math.floor(Math.random() * filtered.length)].id;
      updateUrl();
      renderList();
      renderQuestion();
    });
    filtered = [...questions];
    applyFilters();
  }

  window.addEventListener('storage', event => { if (event.key === HISTORY_KEY) applyFilters(); });
  document.addEventListener('DOMContentLoaded', () => init().catch(error => {
    console.error(error);
    $('practice-question').innerHTML = `<p class="practice-empty">総合演習の読み込みに失敗しました: ${escapeHtml(error.message)}</p>`;
  }));
})();
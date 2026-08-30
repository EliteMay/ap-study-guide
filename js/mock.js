(() => {
  'use strict';

  const HISTORY_KEY = 'ap-study-mock-history-v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const root = () => $('mock-root');
  let bundle = null;
  let timerHandle = null;
  let currentView = 'home';

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  function removeKey(key) {
    try { localStorage.removeItem(key); } catch {}
  }

  function histories() {
    const value = readJson(HISTORY_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function pushHistory(entry) {
    const next = [entry, ...histories().filter(item => item?.id !== entry.id)].slice(0, 30);
    writeJson(HISTORY_KEY, next);
  }

  function setStatus(message, error = false) {
    const node = $('mock-status');
    if (!node) return;
    node.textContent = message;
    node.classList.toggle('is-error', error);
  }

  function shuffle(values) {
    const list = [...values];
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function makeId(subject) {
    return `MOCK-${subject}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  }

  function formatSeconds(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function formatElapsed(seconds) {
    const safe = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${minutes}分${String(secs).padStart(2,'0')}秒`;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '-';
    try { return new Date(timestamp).toLocaleString('ja-JP', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }); }
    catch { return '-'; }
  }

  function remainingSeconds(state) {
    return Math.max(0, Number(state.durationSeconds || 0) - Math.floor((Date.now() - Number(state.startedAt || Date.now())) / 1000));
  }

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  function startTimer(state, onExpire) {
    stopTimer();
    let expired = false;
    const tick = () => {
      const remaining = remainingSeconds(state);
      const node = $('mock-timer');
      if (node) {
        node.textContent = formatSeconds(remaining);
        node.classList.toggle('is-warning', remaining <= 30 * 60 && remaining > 10 * 60);
        node.classList.toggle('is-danger', remaining <= 10 * 60);
      }
      if (!remaining && !expired) {
        expired = true;
        stopTimer();
        onExpire();
      }
    };
    tick();
    timerHandle = setInterval(tick, 1000);
  }

  function percent(value, total) {
    return total ? Math.round(Number(value || 0) / Number(total) * 100) : 0;
  }

  function lessonLinks(refs) {
    return (refs || []).map(id => `<a href="lesson.html?id=${encodeURIComponent(id)}">${escapeHtml(id)}</a>`).join(' ');
  }

  function historyMarkup() {
    const list = histories().slice(0, 10);
    if (!list.length) return '<div class="mock-empty">まだ模試履歴はありません。</div>';
    return `<div class="mock-history-list">${list.map(item => {
      const score = `${Number(item.score || 0)}/${Number(item.maxScore || item.total || 0)}`;
      return `<div class="mock-history-item"><strong>科目${escapeHtml(item.subject)}</strong><span>${score} · ${percent(item.score, item.maxScore || item.total)}% · ${formatElapsed(item.elapsedSeconds)}</span><small>${formatDate(item.completedAt)}</small></div>`;
    }).join('')}</div>`;
  }

  function activeState(key) {
    const value = readJson(key, null);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  }

  function renderHome() {
    stopTimer();
    currentView = 'home';
    const configA = bundle.config.subjectA;
    const configB = bundle.config.subjectB;
    const activeA = activeState(configA.activeKey);
    const activeB = activeState(configB.activeKey);
    setStatus(`科目A ${configA.questionCount}問 / ${configA.durationMinutes}分 · 科目B ${configB.offeredMainQuestions}問提示→${configB.answeredMainQuestions}問解答 / ${configB.durationMinutes}分。回答は自動保存されます。`);

    root().innerHTML = `
      <div class="mock-start-grid">
        <article class="mock-start-card">
          <span class="mock-card-kicker">SUBJECT A</span><h2>科目A 模試</h2>
          <p>既存総合演習の4択57問と、模試専用4択23問を結合して80問にしています。問題順は開始時にRandom化し、そのSessionでは固定されます。</p>
          <div class="mock-card-stats"><div><strong>80問</strong><span>全問解答</span></div><div><strong>150分</strong><span>Timer</span></div><div><strong>4択</strong><span>自動採点</span></div></div>
          <ul><li>回答済み・未回答を80問Navigatorで確認</li><li>Flagを付けて後で見直し</li><li>残り時間はReloadしても継続</li></ul>
          ${activeA ? `<div class="mock-resume">進行中Sessionあり · 残り ${formatSeconds(remainingSeconds(activeA))} · 回答 ${Object.keys(activeA.answers || {}).length}/80</div>` : ''}
          <div class="mock-actions">${activeA ? '<button class="mock-btn primary" data-action="resume-a">再開</button><button class="mock-btn danger" data-action="new-a">破棄して新規</button>' : '<button class="mock-btn primary" data-action="new-a">科目Aを開始</button>'}</div>
        </article>
        <article class="mock-start-card">
          <span class="mock-card-kicker">SUBJECT B</span><h2>科目B 模試</h2>
          <p>長文Case Bankから11Caseを提示します。Security 1Caseは必須、残り10Caseから4Caseを選び、計5Caseを150分で解答します。</p>
          <div class="mock-card-stats"><div><strong>11Case</strong><span>提示</span></div><div><strong>5Case</strong><span>解答</span></div><div><strong>150分</strong><span>Timer</span></div></div>
          <ul><li>試験中は模範解答を非表示</li><li>提出後にModel Answerと採点観点で自己採点</li><li>5Case×3設問 = 15記述設問</li></ul>
          ${activeB ? `<div class="mock-resume">進行中Sessionあり · ${activeB.phase === 'grading' ? '自己採点中' : `残り ${formatSeconds(remainingSeconds(activeB))}`} · 選択 ${(activeB.selectedCaseIds || []).length}/5</div>` : ''}
          <div class="mock-actions">${activeB ? '<button class="mock-btn primary" data-action="resume-b">再開</button><button class="mock-btn danger" data-action="new-b">破棄して新規</button>' : '<button class="mock-btn primary" data-action="new-b">科目Bを開始</button>'}</div>
        </article>
      </div>
      <section class="mock-history-panel"><h2>最近の模試履歴</h2>${historyMarkup()}<p class="mock-submit-box">表示する正答率・自己評価率はこのサイト内の学習指標です。IPA公式の得点への換算や合否判定ではありません。</p></section>`;

    root().querySelector('[data-action="resume-a"]')?.addEventListener('click', () => resumeA());
    root().querySelector('[data-action="resume-b"]')?.addEventListener('click', () => resumeB());
    root().querySelector('[data-action="new-a"]')?.addEventListener('click', () => {
      if (activeA && !confirm('進行中の科目A Sessionを破棄して新しく開始しますか？')) return;
      removeKey(configA.activeKey); startA();
    });
    root().querySelector('[data-action="new-b"]')?.addEventListener('click', () => {
      if (activeB && !confirm('進行中の科目B Sessionを破棄して新しく開始しますか？')) return;
      removeKey(configB.activeKey); startB();
    });
  }

  function questionMapA() {
    return new Map(bundle.subjectAQuestions.map(question => [question.id, question]));
  }

  function startA() {
    const config = bundle.config.subjectA;
    const state = {
      id:makeId('A'), subject:'A', startedAt:Date.now(), durationSeconds:Number(config.durationMinutes) * 60,
      order:shuffle(bundle.subjectAQuestions.map(question => question.id)), answers:{}, flags:{}, currentIndex:0
    };
    writeJson(config.activeKey, state);
    renderA(state);
  }

  function resumeA() {
    const state = activeState(bundle.config.subjectA.activeKey);
    if (!state) return startA();
    if (!remainingSeconds(state)) return submitA(state, true);
    renderA(state);
  }

  function saveA(state) {
    writeJson(bundle.config.subjectA.activeKey, state);
  }

  function renderA(state) {
    currentView = 'A';
    const map = questionMapA();
    const questions = state.order.map(id => map.get(id)).filter(Boolean);
    if (questions.length !== 80) {
      setStatus(`科目A問題数が80問ではありません: ${questions.length}`, true);
      return;
    }
    state.currentIndex = Math.min(Math.max(0, Number(state.currentIndex || 0)), questions.length - 1);
    const question = questions[state.currentIndex];
    const answered = Object.keys(state.answers || {}).length;
    const flagged = Object.values(state.flags || {}).filter(Boolean).length;
    setStatus('科目A 模試進行中。回答・Flag・現在位置は自動保存されます。');

    root().innerHTML = `
      <div class="mock-exam-top"><div class="mock-exam-title"><strong>科目A オリジナル模試</strong><span>80問 / 150分 · 問題 ${state.currentIndex + 1}/80</span></div><div id="mock-timer" class="mock-timer">--:--:--</div><button class="mock-btn danger" data-submit-a>提出</button></div>
      <div class="mock-exam-shell">
        <aside class="mock-exam-nav"><div class="mock-nav-summary"><span>回答 ${answered}/80</span><span>Flag ${flagged}</span></div><div class="mock-nav-grid">${questions.map((item,index) => `<button class="mock-nav-btn ${Object.prototype.hasOwnProperty.call(state.answers || {}, item.id) ? 'is-answered' : ''} ${state.flags?.[item.id] ? 'is-flagged' : ''} ${index === state.currentIndex ? 'is-current' : ''}" data-index="${index}">${index + 1}</button>`).join('')}</div><div class="mock-nav-legend"><span>緑=回答済み</span><span>★=Flag</span><span>青枠=現在</span></div><div class="mock-actions"><button class="mock-btn" data-home>模試Topへ戻る</button></div></aside>
        <article class="mock-exam-main">
          <div class="mock-question-meta"><span>問 ${state.currentIndex + 1}</span><span>${escapeHtml(question.unitId)}</span><span>中分類 ${(question.middleCodes || []).join('・')}</span><span>難易度 ${question.difficulty}</span></div>
          <h2 class="mock-question-title">${escapeHtml(question.title)}</h2><div class="mock-question-prompt">${escapeHtml(question.prompt)}</div>
          <div class="mock-options">${(question.options || []).map((option,index) => `<label class="mock-option"><input type="radio" name="mock-a-answer" value="${index}" ${Number(state.answers?.[question.id]) === index ? 'checked' : ''}><span>${String.fromCharCode(65 + index)}. ${escapeHtml(option)}</span></label>`).join('')}</div>
          <div class="mock-question-actions"><div><button class="mock-btn" data-prev ${state.currentIndex === 0 ? 'disabled' : ''}>← 前へ</button><button class="mock-btn" data-next ${state.currentIndex === 79 ? 'disabled' : ''}>次へ →</button></div><div><button class="mock-btn mock-flag ${state.flags?.[question.id] ? 'is-active' : ''}" data-flag>${state.flags?.[question.id] ? '★ Flag済み' : '☆ Flag'}</button></div></div>
          <div class="mock-submit-box">模試中は正解・解説を表示しません。提出後に誤答と関連Lessonを確認できます。</div>
        </article>
      </div>`;

    root().querySelectorAll('[data-index]').forEach(button => button.addEventListener('click', () => { state.currentIndex = Number(button.dataset.index); saveA(state); renderA(state); }));
    root().querySelectorAll('input[name="mock-a-answer"]').forEach(input => input.addEventListener('change', () => { state.answers[question.id] = Number(input.value); saveA(state); renderA(state); }));
    root().querySelector('[data-prev]')?.addEventListener('click', () => { state.currentIndex -= 1; saveA(state); renderA(state); });
    root().querySelector('[data-next]')?.addEventListener('click', () => { state.currentIndex += 1; saveA(state); renderA(state); });
    root().querySelector('[data-flag]')?.addEventListener('click', () => { state.flags[question.id] = !state.flags?.[question.id]; saveA(state); renderA(state); });
    root().querySelector('[data-home]')?.addEventListener('click', renderHome);
    root().querySelector('[data-submit-a]')?.addEventListener('click', () => {
      const missing = 80 - Object.keys(state.answers || {}).length;
      if (!confirm(missing ? `未回答が${missing}問あります。提出しますか？` : '科目Aを提出しますか？')) return;
      submitA(state, false);
    });
    startTimer(state, () => submitA(state, true));
  }

  function submitA(state, autoSubmitted) {
    stopTimer();
    const map = questionMapA();
    const ordered = state.order.map(id => map.get(id)).filter(Boolean);
    let score = 0;
    const incorrect = [];
    const breakdown = {};
    for (const question of ordered) {
      const chosen = state.answers?.[question.id];
      const correct = Number(chosen) === Number(question.answerIndex);
      if (correct) score += 1;
      else incorrect.push(question.id);
      const unit = question.unitId || 'unknown';
      breakdown[unit] ||= { correct:0, total:0 };
      breakdown[unit].total += 1;
      if (correct) breakdown[unit].correct += 1;
    }
    const completedAt = Date.now();
    const entry = {
      id:state.id, subject:'A', startedAt:state.startedAt, completedAt,
      elapsedSeconds:Math.min(Number(state.durationSeconds), Math.floor((completedAt - state.startedAt) / 1000)),
      score, total:ordered.length, maxScore:ordered.length, answered:Object.keys(state.answers || {}).length,
      flagged:Object.values(state.flags || {}).filter(Boolean).length, incorrect, breakdown, autoSubmitted:Boolean(autoSubmitted)
    };
    pushHistory(entry);
    removeKey(bundle.config.subjectA.activeKey);
    renderAResult(entry);
  }

  function renderAResult(entry) {
    currentView = 'A-result';
    const map = questionMapA();
    setStatus(`科目A提出済み · ${entry.score}/${entry.total}正解。`);
    root().innerHTML = `<div class="mock-result"><div class="mock-result-hero"><h2>科目A 結果</h2><div class="mock-result-score">${entry.score} / ${entry.total} · ${percent(entry.score,entry.total)}%</div><p>${entry.autoSubmitted ? '時間切れで自動提出しました。' : '提出完了。'} この正答率はサイト内学習指標で、IPA公式得点への換算ではありません。</p></div>
      <div class="mock-result-grid"><div><strong>${entry.answered}/80</strong><span>回答</span></div><div><strong>${entry.flagged}</strong><span>Flag</span></div><div><strong>${formatElapsed(entry.elapsedSeconds)}</strong><span>使用時間</span></div><div><strong>${entry.incorrect.length}</strong><span>誤答/未回答</span></div></div>
      <section><h2>分野別</h2><div class="mock-review-list">${Object.entries(entry.breakdown || {}).map(([unit,value]) => `<div class="mock-review-item"><strong>${escapeHtml(unit)}</strong><p>${value.correct}/${value.total} · ${percent(value.correct,value.total)}%</p></div>`).join('')}</div></section>
      <section><h2>誤答を確認</h2>${entry.incorrect.length ? `<div class="mock-review-list">${entry.incorrect.map(id => { const q=map.get(id); if(!q)return ''; return `<div class="mock-review-item"><strong>${escapeHtml(q.id)} ${escapeHtml(q.title)}</strong><p>${escapeHtml(q.explanation || '')}</p><p>正解: ${String.fromCharCode(65 + Number(q.answerIndex))}. ${escapeHtml(q.options?.[q.answerIndex] || '')}</p>${lessonLinks(q.lessonRefs)}</div>`; }).join('')}</div>` : '<div class="mock-empty">全問正解です。</div>'}</section>
      <div class="mock-actions"><button class="mock-btn primary" data-new-a>もう一度科目A</button><button class="mock-btn" data-home>模試Top</button><a class="mock-btn" href="progress.html">学習進捗</a></div></div>`;
    root().querySelector('[data-new-a]')?.addEventListener('click', startA);
    root().querySelector('[data-home]')?.addEventListener('click', renderHome);
  }

  function buildBOffer() {
    const config = bundle.config.subjectB;
    const mandatoryCandidates = bundle.subjectBCases.filter(item => item.unitId === config.mandatoryUnitId);
    if (!mandatoryCandidates.length) throw new Error('Security必須Caseがありません。');
    const mandatory = shuffle(mandatoryCandidates)[0];
    const groups = new Map();
    bundle.subjectBCases.filter(item => item.id !== mandatory.id && item.unitId !== config.mandatoryUnitId).forEach(item => {
      if (!groups.has(item.unitId)) groups.set(item.unitId, []);
      groups.get(item.unitId).push(item);
    });
    const distinct = shuffle([...groups.values()].map(items => shuffle(items)[0]));
    if (distinct.length < Number(config.optionalOfferedCount)) throw new Error('科目Bの選択Case候補が不足しています。');
    return [mandatory, ...distinct.slice(0, Number(config.optionalOfferedCount))];
  }

  function caseMapB() {
    return new Map(bundle.subjectBCases.map(item => [item.id, item]));
  }

  function startB() {
    const config = bundle.config.subjectB;
    const offered = buildBOffer();
    const mandatory = offered.find(item => item.unitId === config.mandatoryUnitId);
    const state = {
      id:makeId('B'), subject:'B', phase:'exam', startedAt:Date.now(), durationSeconds:Number(config.durationMinutes) * 60,
      offeredCaseIds:offered.map(item => item.id), selectedCaseIds:[mandatory.id], currentCaseId:mandatory.id,
      answers:{}, flags:{}, grades:{}, autoSelectedCaseIds:[]
    };
    writeJson(config.activeKey, state);
    renderB(state);
  }

  function resumeB() {
    const state = activeState(bundle.config.subjectB.activeKey);
    if (!state) return startB();
    if (state.phase === 'grading') return renderBGrading(state);
    if (!remainingSeconds(state)) return submitB(state, true);
    renderB(state);
  }

  function saveB(state) {
    writeJson(bundle.config.subjectB.activeKey, state);
  }

  function selectedB(state, id) {
    return (state.selectedCaseIds || []).includes(id);
  }

  function renderB(state) {
    currentView = 'B';
    const config = bundle.config.subjectB;
    const map = caseMapB();
    const offered = state.offeredCaseIds.map(id => map.get(id)).filter(Boolean);
    const current = map.get(state.currentCaseId) || offered[0];
    state.currentCaseId = current.id;
    const selectedCount = state.selectedCaseIds.length;
    const answeredSelected = state.selectedCaseIds.reduce((sum,id) => sum + (map.get(id)?.questions || []).filter(q => String(state.answers?.[q.id] || '').trim()).length, 0);
    setStatus(`科目B 模試進行中 · 解答対象 ${selectedCount}/5Case · 記述済み ${answeredSelected}/${selectedCount * 3}設問。`);

    root().innerHTML = `
      <div class="mock-exam-top"><div class="mock-exam-title"><strong>科目B オリジナル模試</strong><span>11Case提示 / 5Case解答 / 150分</span></div><div id="mock-timer" class="mock-timer">--:--:--</div><button class="mock-btn danger" data-submit-b ${selectedCount !== 5 ? 'disabled' : ''}>提出</button></div>
      <div class="mock-exam-shell">
        <aside class="mock-exam-nav"><div class="mock-nav-summary"><span>選択 ${selectedCount}/5</span><span>記述 ${answeredSelected}/${selectedCount * 3}</span></div><div class="mock-b-selection-note">Securityは必須。残り10Caseから4Caseを選択してください。Case本文は選択前でも確認できます。</div><div class="mock-b-offered">${offered.map((item,index) => {
          const mandatory = item.unitId === config.mandatoryUnitId;
          const selected = selectedB(state,item.id);
          return `<div class="mock-b-case-row ${mandatory ? 'is-mandatory' : ''} ${selected ? 'is-selected' : ''}"><input class="mock-b-select" type="checkbox" data-select-case="${escapeHtml(item.id)}" ${selected ? 'checked' : ''} ${mandatory ? 'disabled' : ''}><button type="button" data-open-case="${escapeHtml(item.id)}">問${index + 1} ${escapeHtml(item.title)}</button><small>${mandatory ? '必須' : escapeHtml(item.unitId)}</small></div>`;
        }).join('')}</div><div class="mock-actions"><button class="mock-btn" data-home>模試Topへ戻る</button></div></aside>
        <article class="mock-exam-main">
          <div class="mock-question-meta"><span>${escapeHtml(current.id)}</span><span>${escapeHtml(current.unitId)}</span><span>中分類 ${(current.middleCodes || []).join('・')}</span><span>${current.estimatedMinutes}分目安</span></div>
          <h2 class="mock-question-title">${escapeHtml(current.title)}</h2>
          <div class="mock-case-scenario">${(current.scenario || []).map(p => `<p>${escapeHtml(p)}</p>`).join('')}</div>
          ${!selectedB(state,current.id) ? '<div class="mock-submit-box">このCaseはまだ解答対象に選択していません。左のCheckboxで選択できます。</div>' : ''}
          ${(current.questions || []).map((q,index) => `<section class="mock-case-question"><h3>設問 ${index + 1}　${escapeHtml(q.prompt)}</h3><textarea data-b-answer="${escapeHtml(q.id)}" placeholder="本文の根拠と判断を書いてください。">${escapeHtml(state.answers?.[q.id] || '')}</textarea></section>`).join('')}
          <div class="mock-question-actions"><div><button class="mock-btn mock-flag ${state.flags?.[current.id] ? 'is-active' : ''}" data-b-flag>${state.flags?.[current.id] ? '★ Flag済み' : '☆ CaseをFlag'}</button></div><div><span class="mock-submit-box">試験中は模範解答を表示しません。</span></div></div>
        </article>
      </div>`;

    root().querySelectorAll('[data-open-case]').forEach(button => button.addEventListener('click', () => { state.currentCaseId = button.dataset.openCase; saveB(state); renderB(state); }));
    root().querySelectorAll('[data-select-case]').forEach(input => input.addEventListener('change', () => {
      const id = input.dataset.selectCase;
      const set = new Set(state.selectedCaseIds || []);
      if (input.checked) {
        if (set.size >= 5) { input.checked = false; alert('選択できるのはSecurityを含めて5Caseです。'); return; }
        set.add(id);
      } else set.delete(id);
      state.selectedCaseIds = [...set]; saveB(state); renderB(state);
    }));
    root().querySelectorAll('[data-b-answer]').forEach(textarea => textarea.addEventListener('input', () => { state.answers[textarea.dataset.bAnswer] = textarea.value; saveB(state); }));
    root().querySelector('[data-b-flag]')?.addEventListener('click', () => { state.flags[current.id] = !state.flags?.[current.id]; saveB(state); renderB(state); });
    root().querySelector('[data-home]')?.addEventListener('click', renderHome);
    root().querySelector('[data-submit-b]')?.addEventListener('click', () => {
      const selectedCases = state.selectedCaseIds.map(id => map.get(id)).filter(Boolean);
      const total = selectedCases.reduce((sum,item) => sum + item.questions.length,0);
      const answered = selectedCases.reduce((sum,item) => sum + item.questions.filter(q => String(state.answers?.[q.id] || '').trim()).length,0);
      if (!confirm(answered < total ? `未回答が${total - answered}設問あります。提出して自己採点へ進みますか？` : '科目Bを提出して自己採点へ進みますか？')) return;
      submitB(state,false);
    });
    startTimer(state, () => submitB(state,true));
  }

  function submitB(state, autoSubmitted) {
    stopTimer();
    const config = bundle.config.subjectB;
    const map = caseMapB();
    if (state.selectedCaseIds.length < Number(config.answeredMainQuestions)) {
      const needed = Number(config.answeredMainQuestions) - state.selectedCaseIds.length;
      const extras = state.offeredCaseIds.filter(id => !state.selectedCaseIds.includes(id)).slice(0, needed);
      state.selectedCaseIds.push(...extras);
      state.autoSelectedCaseIds = extras;
    }
    state.phase = 'grading';
    state.submittedAt = Date.now();
    state.elapsedSeconds = Math.min(Number(state.durationSeconds), Math.floor((state.submittedAt - state.startedAt) / 1000));
    state.autoSubmitted = Boolean(autoSubmitted);
    state.grades ||= {};
    for (const id of state.selectedCaseIds) {
      const item = map.get(id);
      for (const question of item?.questions || []) {
        if (!String(state.answers?.[question.id] || '').trim()) state.grades[question.id] = 0;
      }
    }
    saveB(state);
    renderBGrading(state);
  }

  function renderBGrading(state) {
    stopTimer();
    currentView = 'B-grading';
    const map = caseMapB();
    const selected = state.selectedCaseIds.map(id => map.get(id)).filter(Boolean);
    const questions = selected.flatMap(item => item.questions.map(q => ({...q, caseId:item.id, caseTitle:item.title})));
    const graded = questions.filter(q => Object.prototype.hasOwnProperty.call(state.grades || {}, q.id)).length;
    setStatus(`科目B 提出済み · 自己採点 ${graded}/${questions.length}設問。試験Timerは停止しています。`);
    root().innerHTML = `<div class="mock-result"><div class="mock-result-hero"><h2>科目B 自己採点</h2><p>自分の記述とModel Answer・採点観点を比較し、各設問を2点=できた / 1点=一部 / 0点=できなかったで評価してください。</p><p>${state.autoSelectedCaseIds?.length ? `時間切れ時に選択不足だったため ${state.autoSelectedCaseIds.length}Caseを自動で解答対象へ補完しています。未回答は0点固定です。` : ''}</p></div>
      ${selected.map(item => `<section class="mock-exam-main"><div class="mock-question-meta"><span>${escapeHtml(item.id)}</span><span>${escapeHtml(item.unitId)}</span></div><h2 class="mock-question-title">${escapeHtml(item.title)}</h2>${item.questions.map((q,index) => { const answer=String(state.answers?.[q.id] || '').trim(); const saved=state.grades?.[q.id]; return `<div class="mock-case-question"><h3>設問 ${index + 1}　${escapeHtml(q.prompt)}</h3><p><strong>自分の回答</strong></p><div class="mock-case-scenario"><p>${answer ? escapeHtml(answer) : '未回答'}</p></div><div class="mock-grade-block"><h4>Model Answer</h4><p>${escapeHtml(q.modelAnswer)}</p><h4>採点観点</h4><ul>${(q.points || []).map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul><div class="mock-grade-buttons">${[2,1,0].map(score => `<button type="button" data-grade="${score}" data-question="${escapeHtml(q.id)}" class="${Number(saved) === score ? 'is-selected' : ''}" ${!answer && score !== 0 ? 'disabled' : ''}>${score === 2 ? '2 できた' : score === 1 ? '1 一部' : '0 できなかった'}</button>`).join('')}</div></div></div>`; }).join('')}</section>`).join('')}
      <div class="mock-actions"><button class="mock-btn primary" data-finish-b ${graded !== questions.length ? 'disabled' : ''}>自己採点を完了</button><button class="mock-btn" data-home>模試Topへ戻る</button></div></div>`;

    root().querySelectorAll('[data-grade]').forEach(button => button.addEventListener('click', () => { state.grades[button.dataset.question] = Number(button.dataset.grade); saveB(state); renderBGrading(state); }));
    root().querySelector('[data-finish-b]')?.addEventListener('click', () => finalizeB(state));
    root().querySelector('[data-home]')?.addEventListener('click', renderHome);
  }

  function finalizeB(state) {
    const map = caseMapB();
    const selected = state.selectedCaseIds.map(id => map.get(id)).filter(Boolean);
    const questions = selected.flatMap(item => item.questions || []);
    if (questions.some(q => !Object.prototype.hasOwnProperty.call(state.grades || {}, q.id))) return;
    const score = questions.reduce((sum,q) => sum + Number(state.grades[q.id] || 0), 0);
    const maxScore = questions.length * 2;
    const caseScores = {};
    for (const item of selected) {
      caseScores[item.id] = item.questions.reduce((sum,q) => sum + Number(state.grades[q.id] || 0), 0);
    }
    const entry = {
      id:state.id, subject:'B', startedAt:state.startedAt, completedAt:Date.now(), elapsedSeconds:Number(state.elapsedSeconds || 0),
      score, maxScore, total:questions.length, selectedCaseIds:[...state.selectedCaseIds], caseScores,
      autoSubmitted:Boolean(state.autoSubmitted), autoSelectedCaseIds:[...(state.autoSelectedCaseIds || [])]
    };
    pushHistory(entry);
    removeKey(bundle.config.subjectB.activeKey);
    renderBResult(entry);
  }

  function renderBResult(entry) {
    currentView = 'B-result';
    const map = caseMapB();
    setStatus(`科目B自己採点完了 · ${entry.score}/${entry.maxScore}点。`);
    root().innerHTML = `<div class="mock-result"><div class="mock-result-hero"><h2>科目B 結果</h2><div class="mock-result-score">${entry.score} / ${entry.maxScore} · ${percent(entry.score,entry.maxScore)}%</div><p>記述式の自己評価率です。IPA公式得点への換算ではありません。</p></div>
      <div class="mock-result-grid"><div><strong>5Case</strong><span>解答対象</span></div><div><strong>15設問</strong><span>記述</span></div><div><strong>${formatElapsed(entry.elapsedSeconds)}</strong><span>使用時間</span></div><div><strong>${entry.autoSubmitted ? '時間切れ' : '手動提出'}</strong><span>提出</span></div></div>
      <section><h2>Case別</h2><div class="mock-review-list">${entry.selectedCaseIds.map(id => { const item=map.get(id); return `<div class="mock-review-item"><strong>${escapeHtml(id)} ${escapeHtml(item?.title || '')}</strong><p>${Number(entry.caseScores?.[id] || 0)}/6 · ${percent(entry.caseScores?.[id],6)}%</p>${lessonLinks(item?.lessonRefs)}</div>`; }).join('')}</div></section>
      <div class="mock-actions"><button class="mock-btn primary" data-new-b>もう一度科目B</button><button class="mock-btn" data-home>模試Top</button><a class="mock-btn" href="cases.html">長文Caseで復習</a></div></div>`;
    root().querySelector('[data-new-b]')?.addEventListener('click', startB);
    root().querySelector('[data-home]')?.addEventListener('click', renderHome);
  }

  async function init() {
    if (!window.APMockData?.load) throw new Error('mock-data.js が読み込まれていません。');
    bundle = await window.APMockData.load('../');
    const requested = (new URLSearchParams(location.search).get('subject') || '').toUpperCase();
    if (requested === 'A') {
      const active = activeState(bundle.config.subjectA.activeKey);
      if (active) return resumeA();
    }
    if (requested === 'B') {
      const active = activeState(bundle.config.subjectB.activeKey);
      if (active) return resumeB();
    }
    renderHome();
  }

  window.addEventListener('storage', event => {
    if (currentView === 'home' && [HISTORY_KEY, bundle?.config?.subjectA?.activeKey, bundle?.config?.subjectB?.activeKey].includes(event.key)) renderHome();
  });
  document.addEventListener('DOMContentLoaded', () => init().catch(error => {
    console.error(error);
    setStatus(`模試の読み込みに失敗しました: ${error.message}`, true);
    root().innerHTML = '<div class="mock-empty">DataまたはScriptの読み込みを確認してください。</div>';
  }));
})();

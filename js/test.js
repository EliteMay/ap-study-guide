(() => {
  'use strict';

  const DOMAINS = [
    { id:'security', label:'情報セキュリティ', manifest:'security-terms-manifest.json', page:'security.html' },
    { id:'network', label:'ネットワーク', manifest:'network-terms-manifest.json', page:'network.html' },
    { id:'database', label:'データベース', manifest:'database-terms-manifest.json', page:'database.html' }
  ];

  const els = {
    count: document.getElementById('question-count'),
    domain: document.getElementById('domain-mode'),
    mode: document.getElementById('question-mode'),
    difficulty: document.getElementById('difficulty-mode'),
    start: document.getElementById('start-test'),
    retry: document.getElementById('retry-wrongs'),
    restart: document.getElementById('restart-test'),
    testArea: document.getElementById('test-area'),
    questionBox: document.getElementById('question-box'),
    resultArea: document.getElementById('result-area'),
    dataStatus: document.getElementById('data-status')
  };

  let terms = [];
  let questions = [];
  let index = 0;
  let score = 0;
  let answered = false;
  let review = [];
  let wrongTerms = [];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function shuffle(source) {
    const array = [...source];
    for (let i=array.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [array[i],array[j]]=[array[j],array[i]];
    }
    return array;
  }

  async function fetchJson(path) {
    const response = await fetch('../'+path, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadDomain(domain) {
    const manifest = await fetchJson(domain.manifest);
    const payloads = await Promise.all((manifest.files || []).map(item => fetchJson(item.file)));
    return payloads.flatMap(payload => payload.terms || []).map(raw => ({
      ...raw,
      domain: domain.id,
      domainLabel: domain.label,
      page: domain.page,
      aliases: Array.isArray(raw.aliases) ? raw.aliases : []
    })).filter(term => term.id && term.term && term.definition);
  }

  function domainTerms() {
    return els.domain.value === 'all' ? terms : terms.filter(term => term.domain === els.domain.value);
  }

  function updateCountLimit() {
    const available = domainTerms().length || 1;
    els.count.max = Math.min(100, available);
    if (Number(els.count.value) > Number(els.count.max)) els.count.value = els.count.max;
    els.dataStatus.textContent = `${available}語から出題可能 / 全体 ${terms.length}語`;
  }

  function uniqueBy(items, getLabel) {
    const seen = new Set();
    return items.filter(item => {
      const label = getLabel(item);
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    });
  }

  function distractors(correct, pool, labelKey) {
    const sameCategory = pool.filter(term => term.id !== correct.id && term.domain === correct.domain && term.category === correct.category);
    const sameDomain = pool.filter(term => term.id !== correct.id && term.domain === correct.domain);
    const allOther = pool.filter(term => term.id !== correct.id);
    const strict = els.difficulty.value === 'similar';
    const ordered = strict ? [...shuffle(sameCategory), ...shuffle(sameDomain), ...shuffle(allOther)] : [...shuffle(sameDomain), ...shuffle(allOther)];
    return uniqueBy(ordered, labelKey).slice(0, 3);
  }

  function makeQuestion(term, pool) {
    let mode = els.mode.value;
    if (mode === 'mixed') mode = Math.random() < 0.5 ? 'definition-to-term' : 'term-to-definition';

    if (mode === 'term-to-definition') {
      const others = distractors(term, pool, item => item.definition);
      const options = shuffle([term, ...others]).map(item => ({ label:item.definition, correct:item.id===term.id }));
      return {
        term,
        prompt:`「${term.term}」の説明として最も適切なものはどれか。`,
        detail:'',
        answer:term.definition,
        options
      };
    }

    const others = distractors(term, pool, item => item.term);
    const options = shuffle([term, ...others]).map(item => ({ label:item.term, correct:item.id===term.id }));
    return {
      term,
      prompt:'次の説明に該当する用語として最も適切なものはどれか。',
      detail:term.definition,
      answer:term.term,
      options
    };
  }

  function buildQuestionSet(sourceTerms, count) {
    const pool = domainTerms();
    return shuffle(sourceTerms).slice(0, Math.min(count, sourceTerms.length)).map(term => makeQuestion(term, pool));
  }

  function start(sourceTerms = null) {
    const pool = sourceTerms || domainTerms();
    const requested = Math.max(1, Number(els.count.value || 10));
    questions = buildQuestionSet(pool, requested);
    if (!questions.length) return;
    index = 0;
    score = 0;
    review = [];
    wrongTerms = [];
    els.resultArea.hidden = true;
    els.testArea.hidden = false;
    els.restart.hidden = false;
    els.retry.hidden = true;
    renderQuestion();
    els.testArea.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function renderQuestion() {
    answered = false;
    const q = questions[index];
    els.questionBox.innerHTML = `
      <div class="question-meta">
        <span>${index+1} / ${questions.length} 問</span>
        <span class="question-tag">${escapeHtml(q.term.domainLabel)} / ${escapeHtml(q.term.category || '未分類')}</span>
      </div>
      <div class="question-title">${escapeHtml(q.prompt)}${q.detail ? `<div class="question-detail">${escapeHtml(q.detail)}</div>` : ''}</div>
      <div class="option-grid">
        ${q.options.map((option,i)=>`<button type="button" class="option-btn" data-index="${i}" data-correct="${option.correct}"><strong>${i+1}.</strong> ${escapeHtml(option.label)}</button>`).join('')}
      </div>
      <div id="test-feedback" class="test-feedback" hidden></div>
      <div class="test-actions"><button id="next-question" class="primary-link-btn" type="button" hidden>次へ</button></div>
      <p class="kbd-note">キーボード: 1〜4で回答 / 回答後Enterで次へ</p>`;
    els.questionBox.querySelectorAll('.option-btn').forEach(button => button.addEventListener('click', () => choose(button)));
    document.getElementById('next-question').addEventListener('click', next);
  }

  function choose(button) {
    if (answered) return;
    answered = true;
    const q = questions[index];
    const correct = button.dataset.correct === 'true';
    const feedback = document.getElementById('test-feedback');
    const nextButton = document.getElementById('next-question');
    els.questionBox.querySelectorAll('.option-btn').forEach(option => {
      option.disabled = true;
      if (option.dataset.correct === 'true') option.classList.add('correct');
    });
    if (correct) {
      score += 1;
      feedback.innerHTML = `<strong>正解。</strong><br>${escapeHtml(q.term.term)}：${escapeHtml(q.term.definition)}`;
    } else {
      button.classList.add('wrong');
      wrongTerms.push(q.term);
      feedback.innerHTML = `<strong>不正解。</strong> 正解は「${escapeHtml(q.answer)}」。<br>${escapeHtml(q.term.term)}：${escapeHtml(q.term.definition)}`;
    }
    review.push({ term:q.term, correct, answer:q.answer });
    feedback.innerHTML += `<br><a href="${escapeHtml(q.term.page)}#${escapeHtml(q.term.id)}">辞書カードで確認 →</a>`;
    feedback.hidden = false;
    nextButton.hidden = false;
    nextButton.textContent = index + 1 >= questions.length ? '結果を見る' : '次へ';
  }

  function next() {
    index += 1;
    if (index >= questions.length) finish(); else renderQuestion();
  }

  function finish() {
    els.testArea.hidden = true;
    const percent = Math.round(score / questions.length * 100);
    const wrongs = review.filter(item => !item.correct);
    els.resultArea.hidden = false;
    els.resultArea.innerHTML = `
      <h2>結果：${score} / ${questions.length} 問（${percent}%）</h2>
      <p>${wrongs.length ? `間違えた ${wrongs.length} 問を下にまとめました。` : '全問正解です。'}</p>
      <div class="review-list">${wrongs.map(item => `<div class="review-item"><strong>${escapeHtml(item.term.term)}</strong><br>${escapeHtml(item.term.definition)}<br><a href="${escapeHtml(item.term.page)}#${escapeHtml(item.term.id)}">辞書で復習 →</a></div>`).join('')}</div>`;
    els.retry.hidden = wrongTerms.length === 0;
    els.resultArea.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function init() {
    els.start.disabled = true;
    try {
      const loaded = await Promise.all(DOMAINS.map(loadDomain));
      terms = loaded.flat();
      const counts = DOMAINS.map(domain => `${domain.label} ${terms.filter(term=>term.domain===domain.id).length}語`).join(' / ');
      els.dataStatus.textContent = `読み込み完了: ${counts}`;
      els.start.disabled = false;
      updateCountLimit();
    } catch (error) {
      console.error(error);
      els.dataStatus.textContent = `データ読み込み失敗: ${error.message}`;
    }
  }

  els.domain.addEventListener('change', updateCountLimit);
  els.start.addEventListener('click', () => start());
  els.restart.addEventListener('click', () => start());
  els.retry.addEventListener('click', () => {
    const retryPool = [...new Map(wrongTerms.map(term => [term.id, term])).values()];
    els.count.value = retryPool.length;
    start(retryPool);
  });
  document.addEventListener('keydown', event => {
    if (els.testArea.hidden) return;
    if (!answered && /^[1-4]$/.test(event.key)) {
      const button = els.questionBox.querySelector(`.option-btn[data-index="${Number(event.key)-1}"]`);
      button?.click();
    } else if (answered && event.key === 'Enter') {
      document.getElementById('next-question')?.click();
    }
  });
  document.addEventListener('DOMContentLoaded', init);
})();

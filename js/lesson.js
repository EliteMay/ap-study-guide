(() => {
  'use strict';

  const LESSON_KEY = 'ap-study-lesson-progress-v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const displayText = value => window.APLearningLanguage?.localizeText?.(value) ?? String(value ?? '');

  async function json(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function readProgress() { return window.APStudyState?.readObject?.(LESSON_KEY) || {}; }
  function writeProgress(value) {
    if (window.APStudyState?.writeJson?.(LESSON_KEY, value)) window.dispatchEvent(new CustomEvent('ap-lesson-progress-changed'));
  }

  function saveAttempt(lessonId, total, answered, correct) {
    const all = readProgress();
    const previous = all[lessonId] || {};
    const finished = total > 0 && answered === total;
    const ratio = finished ? correct / total : 0;
    const passed = finished && ratio >= (window.APStudyState?.config?.LESSON_PASS_RATIO || 0.75);
    all[lessonId] = {
      ...previous,
      total,
      latestAnswered:answered,
      latestCorrect:correct,
      latestRatio:ratio,
      bestCorrect:finished ? Math.max(Number(previous.bestCorrect || 0), correct) : Number(previous.bestCorrect || 0),
      completed:passed,
      everCompleted:Boolean(previous.everCompleted || previous.completed || passed),
      completionCount:Number(previous.completionCount || 0) + (passed ? 1 : 0),
      updatedAt:Date.now()
    };
    writeProgress(all);
    return all[lessonId];
  }

  function renderProgressSummary(lessonId, total, currentAnswered = 0, currentCorrect = 0) {
    const root = $('lesson-progress-summary');
    if (!root) return;
    const saved = readProgress()[lessonId] || {};
    const best = Math.min(Number(saved.bestCorrect || 0), total);
    const state = window.APStudyState?.lessonState?.(saved) || { label:saved.completed ? '理解確認済み' : '未完了', state:saved.completed ? 'mastered' : 'retry' };
    const current = currentAnswered > 0 ? `<span>今回 ${currentCorrect} / ${currentAnswered} 正解</span>` : '<span>今回 0問</span>';
    root.innerHTML = `${current}<span>最高 ${best} / ${total}</span><span class="${state.state === 'mastered' ? 'is-complete' : ''}">${escapeHtml(state.label)}</span>`;
  }

  function requestedLessonId() { return (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase(); }

  async function loadLesson() {
    const id = requestedLessonId();
    if (!id) throw new Error('レッスンIDが指定されていません。');
    if (!window.APLessonData?.load) throw new Error('教材一覧を読み込めませんでした。');
    const { lessons } = await window.APLessonData.load('../');
    const entry = lessons.find(item => String(item.id).toUpperCase() === id);
    if (!entry) throw new Error(`教材 ${id} は見つかりません。`);
    const [lesson, termHelp] = await Promise.all([
      json(entry.file),
      json('json/lessons/term-help.json').catch(() => ({ terms:[] }))
    ]);
    if (lesson.meta?.id !== entry.id) throw new Error(`${entry.id}: 教材データのIDが一致しません。`);
    return { entry, lesson, lessons, termHelp };
  }

  function renderHero(entry, lesson) {
    document.title = `${displayText(lesson.meta.title)} | AP Study Notes`;
    const middleCodes = (lesson.meta.officialMiddleCodes || []).map(escapeHtml).join('・');
    $('lesson-hero').innerHTML = `
      <p class="eyebrow">${escapeHtml(lesson.meta.id)} / レッスン</p>
      <h1>${escapeHtml(displayText(lesson.meta.title))}</h1>
      <p class="lead">${escapeHtml(displayText(lesson.intro || ''))}</p>
      <div class="lesson-meta-row">
        ${middleCodes ? `<span>IPA中分類 ${middleCodes}</span>` : ''}
        ${lesson.meta.estimatedMinutes ? `<span>学習目安 ${escapeHtml(lesson.meta.estimatedMinutes)}分</span>` : ''}
        <span>初心者向け解説</span>
      </div>`;
  }

  function renderObjectives(lesson) {
    const objectives = lesson.objectives || [];
    $('lesson-objectives').innerHTML = objectives.length
      ? `<ol>${objectives.map(item => `<li>${escapeHtml(displayText(item))}</li>`).join('')}</ol>`
      : '<p>このレッスンの学習目標を準備中です。</p>';
  }

  function renderBeginnerStart(lesson) {
    const beginner = lesson.beginner || {};
    const keyPoints = Array.isArray(beginner.keyPoints) && beginner.keyPoints.length ? beginner.keyPoints : (lesson.objectives || []).slice(0,4);
    const why = beginner.why || `このレッスンでは「${lesson.meta?.title || 'このテーマ'}」を、用語暗記ではなく仕組みから理解します。`;
    const startHere = beginner.startHere || '分からない言葉が出ても、最初から全部暗記する必要はありません。まず太字の要点と具体例を読み、最後の確認問題で理解できたか確かめてください。';
    return `<section class="lesson-beginner-start" aria-labelledby="beginner-start-title">
      <div class="lesson-beginner-heading"><span>最初に読む</span><h2 id="beginner-start-title">まずここだけ分かればOK</h2></div>
      <p class="lesson-beginner-why">${escapeHtml(displayText(why))}</p>
      <div class="lesson-beginner-grid">
        <div><strong>初めて学ぶなら</strong><p>${escapeHtml(displayText(startHere))}</p></div>
        <div><strong>このページの重要ポイント</strong><ul>${keyPoints.map(item => `<li>${escapeHtml(displayText(item))}</li>`).join('')}</ul></div>
      </div>
    </section>`;
  }

  function renderTermHelp(lesson, termHelp) {
    const terms = window.APLearningLanguage?.collectTermHelp?.(lesson, termHelp, 8) || [];
    if (!terms.length) return '';
    return `<section class="lesson-term-help" aria-labelledby="lesson-term-help-title">
      <div class="lesson-term-help-heading"><span>英字・略語の補助</span><h2 id="lesson-term-help-title">分からない英語はここで確認</h2><p>英字をそのまま覚えるより、まず日本語で何をするものか理解してください。</p></div>
      <div class="lesson-term-help-grid">${terms.map(item => `<article><div><strong>${escapeHtml(item.term)}</strong><span>${escapeHtml(item.reading || '')}</span></div><p>${escapeHtml(displayText(item.description || ''))}</p></article>`).join('')}</div>
    </section>`;
  }

  function table(columns, rows, className = '') {
    return `<div class="lesson-table-wrap"><table class="lesson-table ${className}"><thead><tr>${(columns || []).map(col => `<th>${escapeHtml(displayText(col))}</th>`).join('')}</tr></thead><tbody>${(rows || []).map(row => `<tr>${row.map(cell => `<td>${escapeHtml(displayText(cell))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderDiagram(section) {
    return (section.diagrams || []).map(diagram => {
      const nodes = Array.isArray(diagram.nodes) ? diagram.nodes : [];
      const connector = String(diagram.connector ?? '→');
      const nodeHtml = nodes.map((node, index) => `<div class="structure-item" role="listitem"><div class="structure-node"><span class="structure-node-title">${escapeHtml(displayText(node.title || ''))}</span><strong>${escapeHtml(displayText(node.value || ''))}</strong>${node.meta ? `<small>${escapeHtml(displayText(node.meta))}</small>` : ''}</div>${connector && index < nodes.length - 1 ? `<span class="structure-connector" aria-hidden="true">${escapeHtml(connector)}</span>` : ''}</div>`).join('');
      return `<div class="structure-diagram"><h3>${escapeHtml(displayText(diagram.label || ''))}</h3><div class="structure-scroll"><div class="structure-flow" role="list">${nodeHtml}</div></div>${diagram.note ? `<p class="structure-note">${escapeHtml(displayText(diagram.note))}</p>` : ''}</div>`;
    }).join('');
  }

  function sectionGuide(type) {
    const guides = {
      comparison:'表は丸暗記せず、左の項目が「何とどう違うか」を1行ずつ比べてください。',
      'code-trace':'答えを先に見ず、処理を1行ずつ進めて途中の値がどう変わるか確認してください。',
      diagram:'矢印の向きと、各要素が何を受け取り何を渡すかに注目してください。',
      steps:'順番だけでなく「なぜその手順が必要か」を本文と一緒に確認してください。',
      mistakes:'自分が同じ勘違いをしそうかを確認すると、問題での失点を減らせます。'
    };
    return guides[type] ? `<p class="lesson-section-guide">${guides[type]}</p>` : '';
  }

  function renderSection(section, index) {
    const title = escapeHtml(displayText(section.title || `${index + 1}. セクション`));
    const guide = sectionGuide(section.type);
    if (section.type === 'text') return `<section class="lesson-block lesson-text-block"><h2>${title}</h2>${(section.paragraphs || []).map(p => `<p>${escapeHtml(displayText(p))}</p>`).join('')}</section>`;
    if (section.type === 'comparison') return `<section class="lesson-block"><h2>${title}</h2>${guide}${table(section.columns, section.rows, 'comparison-table')}${section.note ? `<div class="lesson-note"><strong>ここがポイント</strong><p>${escapeHtml(displayText(section.note))}</p></div>` : ''}</section>`;
    if (section.type === 'diagram') return `<section class="lesson-block diagram-block"><h2>${title}</h2>${guide}${renderDiagram(section)}</section>`;
    if (section.type === 'code-trace') return `<section class="lesson-block code-trace-block"><h2>${title}</h2>${guide}${section.question ? `<p class="lesson-question-lead">${escapeHtml(displayText(section.question))}</p>` : ''}<pre class="lesson-code"><code>${escapeHtml((section.code || []).join('\n'))}</code></pre><h3>処理を1行ずつ追う</h3>${table(section.traceColumns, section.traceRows, 'trace-table')}<div class="lesson-answer"><strong>答え</strong><p>${escapeHtml(displayText(section.answer || ''))}</p></div>${section.explanation ? `<p>${escapeHtml(displayText(section.explanation))}</p>` : ''}</section>`;
    if (section.type === 'worked-example') {
      const code = Array.isArray(section.code) && section.code.length ? `<pre class="lesson-code"><code>${escapeHtml(section.code.join('\n'))}</code></pre>` : '';
      const result = Array.isArray(section.resultColumns) && Array.isArray(section.resultRows) ? `<h3>${escapeHtml(displayText(section.resultTitle || '結果'))}</h3>${table(section.resultColumns, section.resultRows, 'worked-result-table')}` : '';
      const answer = section.answer ? `<div class="lesson-answer"><strong>答え</strong><p>${escapeHtml(displayText(section.answer))}</p></div>` : '';
      return `<section class="lesson-block worked-example-block"><h2>${title}</h2>${section.problem ? `<p class="lesson-question-lead">${escapeHtml(displayText(section.problem))}</p>` : ''}${code}${result}${answer}${section.explanation ? `<p>${escapeHtml(displayText(section.explanation))}</p>` : ''}</section>`;
    }
    if (section.type === 'steps') return `<section class="lesson-block"><h2>${title}</h2>${guide}<div class="lesson-step-list">${(section.items || []).map(item => `<article><strong>${escapeHtml(displayText(item.label))}</strong><p>${escapeHtml(displayText(item.body))}</p></article>`).join('')}</div></section>`;
    if (section.type === 'mistakes') return `<section class="lesson-block mistake-block"><h2>${title}</h2>${guide}<ul class="mistake-list">${(section.items || []).map(item => `<li>${escapeHtml(displayText(item))}</li>`).join('')}</ul></section>`;
    return `<section class="lesson-block"><h2>${title}</h2><p>この教材形式は表示準備中です。</p></section>`;
  }

  function renderChecks(lesson) {
    const checks = lesson.checks || [];
    if (!checks.length) return;
    const lessonId = lesson.meta.id;
    let currentAnswered = 0;
    let currentCorrect = 0;
    $('lesson-check').hidden = false;
    renderProgressSummary(lessonId, checks.length);
    $('lesson-questions').innerHTML = checks.map((q, qi) => `<article class="check-question" data-question="${qi}"><h3>Q${qi + 1}. ${escapeHtml(displayText(q.prompt))}</h3><div class="check-options">${(q.options || []).map((option, oi) => `<button type="button" data-option="${oi}">${escapeHtml(displayText(option))}</button>`).join('')}</div><div class="check-feedback" hidden></div></article>`).join('');
    $('lesson-questions').querySelectorAll('.check-question').forEach(node => {
      const qi = Number(node.dataset.question);
      const q = checks[qi];
      node.querySelectorAll('[data-option]').forEach(button => button.addEventListener('click', () => {
        if (node.dataset.answered === 'true') return;
        node.dataset.answered = 'true';
        const selected = Number(button.dataset.option);
        const isCorrect = selected === Number(q.answerIndex);
        currentAnswered += 1;
        if (isCorrect) currentCorrect += 1;
        node.querySelectorAll('[data-option]').forEach(option => { option.disabled = true; if (Number(option.dataset.option) === Number(q.answerIndex)) option.classList.add('correct'); });
        if (!isCorrect) button.classList.add('wrong');
        const feedback = node.querySelector('.check-feedback');
        feedback.className = `check-feedback ${isCorrect ? 'correct' : 'wrong'}`;
        feedback.innerHTML = `<strong>${isCorrect ? '正解' : '不正解'}</strong><p>${escapeHtml(displayText(q.explanation || ''))}</p>`;
        feedback.hidden = false;
        const saved = saveAttempt(lessonId, checks.length, currentAnswered, currentCorrect);
        renderProgressSummary(lessonId, checks.length, currentAnswered, currentCorrect);
        if (currentAnswered === checks.length && !window.APStudyState.lessonState(saved).mastered) window.APStudyUI?.toast?.(`理解確認は75%以上が目安です。今回は ${currentCorrect}/${checks.length}。`);
      }));
    });
  }

  function renderLessonNav(entry, lesson, lessons) {
    const indexedById = new Map(lessons.map(item => [item.id, item]));
    const sameUnit = lessons.filter(item => item.unitId === entry.unitId).sort((a,b) => Number(a.order || 9999) - Number(b.order || 9999));
    const currentIndex = sameUnit.findIndex(item => item.id === entry.id);
    const previous = currentIndex > 0 ? sameUnit[currentIndex - 1] : null;
    const indexNext = currentIndex >= 0 && currentIndex + 1 < sameUnit.length ? sameUnit[currentIndex + 1] : null;
    const explicitNext = Array.isArray(lesson.next) ? lesson.next : [];
    const rows = [];
    if (previous) rows.push({ id:previous.id, label:previous.title, available:true, direction:'前のレッスン' });
    if (explicitNext.length) {
      for (const item of explicitNext) {
        const resolved = indexedById.get(item.lessonId);
        rows.push({ id:item.lessonId, label:resolved?.title || item.label || '', available:Boolean(resolved), direction:'次のレッスン' });
      }
    } else if (indexNext) rows.push({ id:indexNext.id, label:indexNext.title, available:true, direction:'次のレッスン' });
    if (!rows.length) return '';
    return `<section class="lesson-block next-lesson-block"><h2>前後のレッスン</h2>${rows.map(item => {
      const inner = `<div><small>${escapeHtml(item.direction)}</small><strong>${escapeHtml(item.id)} ${escapeHtml(displayText(item.label))}</strong></div><span>${item.available ? '開く' : '準備中'}</span>`;
      return item.available ? `<a class="next-lesson-row is-link" href="lesson.html?id=${encodeURIComponent(item.id)}">${inner}</a>` : `<div class="next-lesson-row">${inner}</div>`;
    }).join('')}</section>`;
  }

  async function init() {
    try {
      const { entry, lesson, lessons, termHelp } = await loadLesson();
      renderHero(entry, lesson);
      renderObjectives(lesson);
      $('lesson-status').innerHTML = `<strong>${escapeHtml(lesson.meta.id)}</strong>　まず解説と例を読んでから確認問題へ進んでください。確認問題は75%以上で「理解確認済み」になります。`;
      $('lesson-sections').innerHTML = renderBeginnerStart(lesson) + renderTermHelp(lesson,termHelp) + (lesson.sections || []).map(renderSection).join('') + renderLessonNav(entry, lesson, lessons);
      renderChecks(lesson);
    } catch (error) {
      console.error(error);
      $('lesson-status').classList.add('error');
      $('lesson-status').textContent = `教材の読み込みに失敗しました: ${error.message}`;
      $('lesson-sections').innerHTML = '<p><a href="roadmap.html">学習マップへ戻る</a></p>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
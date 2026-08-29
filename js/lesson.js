(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const LESSON_PROGRESS_KEY = 'ap-study-lesson-progress-v1';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function json(path) {
    const response = await fetch(`../${path}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(LESSON_PROGRESS_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }

  function writeProgress(value) {
    try {
      localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('ap-lesson-progress-changed'));
    } catch {}
  }

  function saveAttempt(lessonId, total, answered, correct) {
    const all = readProgress();
    const previous = all[lessonId] || {};
    const finished = total > 0 && answered === total;
    const bestCorrect = finished ? Math.max(Number(previous.bestCorrect || 0), correct) : Number(previous.bestCorrect || 0);
    const completionCount = Number(previous.completionCount || 0) + (finished ? 1 : 0);
    all[lessonId] = {
      total,
      latestAnswered:answered,
      latestCorrect:correct,
      bestCorrect,
      completed:Boolean(previous.completed || finished),
      completionCount,
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
    const completed = Boolean(saved.completed);
    const count = Number(saved.completionCount || 0);
    const current = currentAnswered > 0
      ? `<span>今回 ${currentCorrect} / ${currentAnswered} 正解</span>`
      : '<span>今回 0問</span>';
    root.innerHTML = `${current}<span>Best ${best} / ${total}</span><span class="${completed ? 'is-complete' : ''}">${completed ? `完了 ${count}回` : '未完了'}</span>`;
  }

  function requestedLessonId() {
    return (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
  }

  async function loadLesson() {
    const id = requestedLessonId();
    if (!id) throw new Error('lesson id が指定されていません。');
    const [baseIndex, expansionIndex] = await Promise.all([
      json('json/lessons/lesson-index.json'),
      json('json/lessons/lesson-index-expansion.json')
    ]);
    const lessons = [
      ...(Array.isArray(baseIndex.lessons) ? baseIndex.lessons : []),
      ...(Array.isArray(expansionIndex.lessons) ? expansionIndex.lessons : [])
    ];
    const entry = lessons.find(item => String(item.id).toUpperCase() === id);
    if (!entry) throw new Error(`教材 ${id} は見つかりません。`);
    const lesson = await json(entry.file);
    if (lesson.meta?.id !== entry.id) throw new Error(`${entry.id}: index と教材JSONのIDが一致しません。`);
    return { entry, lesson, lessons };
  }

  function renderHero(entry, lesson) {
    document.title = `${lesson.meta.title} | AP Study Notes`;
    $('lesson-hero').innerHTML = `
      <p class="eyebrow">${escapeHtml(lesson.meta.id)} / STRUCTURED LESSON</p>
      <h1>${escapeHtml(lesson.meta.title)}</h1>
      <p class="lead">${escapeHtml(lesson.intro || '')}</p>
      <div class="lesson-meta-row">
        <span>IPA中分類 ${(lesson.meta.officialMiddleCodes || []).map(escapeHtml).join(', ')}</span>
        <span>${escapeHtml(entry.status || lesson.meta.qualityStatus || '')}</span>
        ${lesson.meta.estimatedMinutes ? `<span>目安 ${escapeHtml(lesson.meta.estimatedMinutes)}分</span>` : ''}
      </div>`;
  }

  function renderObjectives(lesson) {
    const objectives = lesson.objectives || [];
    $('lesson-objectives').innerHTML = objectives.length
      ? `<ol>${objectives.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`
      : '<p>学習目標は未設定です。</p>';
  }

  function table(columns, rows, className = '') {
    return `<div class="lesson-table-wrap"><table class="lesson-table ${className}"><thead><tr>${(columns || []).map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr></thead><tbody>${(rows || []).map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderDiagram(section) {
    return (section.diagrams || []).map(diagram => {
      const nodes = Array.isArray(diagram.nodes) ? diagram.nodes : [];
      const connector = String(diagram.connector ?? '→');
      const nodeHtml = nodes.map((node, index) => {
        const connectorHtml = connector && index < nodes.length - 1
          ? `<span class="structure-connector" aria-hidden="true">${escapeHtml(connector)}</span>`
          : '';
        return `<div class="structure-item" role="listitem"><div class="structure-node"><span class="structure-node-title">${escapeHtml(node.title || '')}</span><strong>${escapeHtml(node.value || '')}</strong>${node.meta ? `<small>${escapeHtml(node.meta)}</small>` : ''}</div>${connectorHtml}</div>`;
      }).join('');
      return `<div class="structure-diagram"><h3>${escapeHtml(diagram.label || '')}</h3><div class="structure-scroll"><div class="structure-flow" role="list">${nodeHtml}</div></div>${diagram.note ? `<p class="structure-note">${escapeHtml(diagram.note)}</p>` : ''}</div>`;
    }).join('');
  }

  function renderSection(section, index) {
    const title = escapeHtml(section.title || `${index + 1}. セクション`);
    if (section.type === 'text') {
      return `<section class="lesson-block"><h2>${title}</h2>${(section.paragraphs || []).map(p => `<p>${escapeHtml(p)}</p>`).join('')}</section>`;
    }
    if (section.type === 'comparison') {
      return `<section class="lesson-block"><h2>${title}</h2>${table(section.columns, section.rows, 'comparison-table')}${section.note ? `<div class="lesson-note"><strong>ポイント</strong><p>${escapeHtml(section.note)}</p></div>` : ''}</section>`;
    }
    if (section.type === 'diagram') {
      return `<section class="lesson-block diagram-block"><h2>${title}</h2>${renderDiagram(section)}</section>`;
    }
    if (section.type === 'code-trace') {
      return `<section class="lesson-block code-trace-block"><h2>${title}</h2>${section.question ? `<p class="lesson-question-lead">${escapeHtml(section.question)}</p>` : ''}<pre class="lesson-code"><code>${escapeHtml((section.code || []).join('\n'))}</code></pre><h3>実行トレース</h3>${table(section.traceColumns, section.traceRows, 'trace-table')}<div class="lesson-answer"><strong>答え</strong><p>${escapeHtml(section.answer || '')}</p></div>${section.explanation ? `<p>${escapeHtml(section.explanation)}</p>` : ''}</section>`;
    }
    if (section.type === 'worked-example') {
      const code = Array.isArray(section.code) && section.code.length
        ? `<pre class="lesson-code"><code>${escapeHtml(section.code.join('\n'))}</code></pre>` : '';
      const result = Array.isArray(section.resultColumns) && Array.isArray(section.resultRows)
        ? `<h3>${escapeHtml(section.resultTitle || '結果')}</h3>${table(section.resultColumns, section.resultRows, 'worked-result-table')}` : '';
      const answer = section.answer ? `<div class="lesson-answer"><strong>答え</strong><p>${escapeHtml(section.answer)}</p></div>` : '';
      return `<section class="lesson-block worked-example-block"><h2>${title}</h2>${section.problem ? `<p class="lesson-question-lead">${escapeHtml(section.problem)}</p>` : ''}${code}${result}${answer}${section.explanation ? `<p>${escapeHtml(section.explanation)}</p>` : ''}</section>`;
    }
    if (section.type === 'steps') {
      return `<section class="lesson-block"><h2>${title}</h2><div class="lesson-step-list">${(section.items || []).map(item => `<article><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.body)}</p></article>`).join('')}</div></section>`;
    }
    if (section.type === 'mistakes') {
      return `<section class="lesson-block mistake-block"><h2>${title}</h2><ul class="mistake-list">${(section.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
    }
    return `<section class="lesson-block"><h2>${title}</h2><p>この教材形式はまだ表示に対応していません。</p></section>`;
  }

  function renderChecks(lesson) {
    const checks = lesson.checks || [];
    if (!checks.length) return;
    const lessonId = lesson.meta.id;
    let currentAnswered = 0;
    let currentCorrect = 0;
    $('lesson-check').hidden = false;
    renderProgressSummary(lessonId, checks.length);
    $('lesson-questions').innerHTML = checks.map((q, qi) => `
      <article class="check-question" data-question="${qi}">
        <h3>Q${qi + 1}. ${escapeHtml(q.prompt)}</h3>
        <div class="check-options">${(q.options || []).map((option, oi) => `<button type="button" data-option="${oi}">${escapeHtml(option)}</button>`).join('')}</div>
        <div class="check-feedback" hidden></div>
      </article>`).join('');

    $('lesson-questions').querySelectorAll('.check-question').forEach(node => {
      const qi = Number(node.dataset.question);
      const q = checks[qi];
      node.querySelectorAll('[data-option]').forEach(button => {
        button.addEventListener('click', () => {
          if (node.dataset.answered === 'true') return;
          node.dataset.answered = 'true';
          const selected = Number(button.dataset.option);
          const isCorrect = selected === Number(q.answerIndex);
          currentAnswered += 1;
          if (isCorrect) currentCorrect += 1;
          node.querySelectorAll('[data-option]').forEach(option => {
            option.disabled = true;
            if (Number(option.dataset.option) === Number(q.answerIndex)) option.classList.add('correct');
          });
          if (!isCorrect) button.classList.add('wrong');
          const feedback = node.querySelector('.check-feedback');
          feedback.className = `check-feedback ${isCorrect ? 'correct' : 'wrong'}`;
          feedback.innerHTML = `<strong>${isCorrect ? '正解' : '不正解'}</strong><p>${escapeHtml(q.explanation || '')}</p>`;
          feedback.hidden = false;
          saveAttempt(lessonId, checks.length, currentAnswered, currentCorrect);
          renderProgressSummary(lessonId, checks.length, currentAnswered, currentCorrect);
        });
      });
    });
  }

  function renderLessonNav(entry, lesson, lessons) {
    const indexedById = new Map(lessons.map(item => [item.id, item]));
    const sameUnit = lessons
      .filter(item => item.unitId === entry.unitId)
      .sort((a, b) => Number(a.order || 9999) - Number(b.order || 9999));
    const currentIndex = sameUnit.findIndex(item => item.id === entry.id);
    const previous = currentIndex > 0 ? sameUnit[currentIndex - 1] : null;
    const indexNext = currentIndex >= 0 && currentIndex + 1 < sameUnit.length ? sameUnit[currentIndex + 1] : null;
    const explicitNext = Array.isArray(lesson.next) ? lesson.next : [];
    const rows = [];

    if (previous) {
      rows.push({ id:previous.id, label:`前の教材：${previous.title}`, available:true, direction:'PREV' });
    }

    if (explicitNext.length) {
      for (const item of explicitNext) {
        const resolved = indexedById.get(item.lessonId);
        rows.push({
          id:item.lessonId,
          label:resolved?.title || item.label || '',
          available:Boolean(resolved),
          direction:'NEXT',
          status:item.status || (resolved ? '公開中' : 'planned')
        });
      }
    } else if (indexNext) {
      rows.push({ id:indexNext.id, label:indexNext.title, available:true, direction:'NEXT', status:'公開中' });
    }

    if (!rows.length) return '';
    return `<section class="lesson-block next-lesson-block"><h2>教材ナビ</h2>${rows.map(item => {
      const inner = `<div><small>${escapeHtml(item.direction)}</small><strong>${escapeHtml(item.id)} ${escapeHtml(item.label)}</strong></div><span>${item.available ? '開く' : '準備中'}</span>`;
      return item.available
        ? `<a class="next-lesson-row is-link" href="lesson.html?id=${encodeURIComponent(item.id)}">${inner}</a>`
        : `<div class="next-lesson-row">${inner}</div>`;
    }).join('')}</section>`;
  }

  async function init() {
    try {
      const { entry, lesson, lessons } = await loadLesson();
      renderHero(entry, lesson);
      renderObjectives(lesson);
      $('lesson-status').innerHTML = `<strong>${escapeHtml(lesson.meta.id)}</strong> は、共通生成の長文ではなく、この学習内容専用に作った構造化教材です。`;
      $('lesson-sections').innerHTML = (lesson.sections || []).map(renderSection).join('') + renderLessonNav(entry, lesson, lessons);
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

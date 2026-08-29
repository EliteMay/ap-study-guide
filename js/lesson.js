(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function json(path) {
    const response = await fetch(`../${path}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function requestedLessonId() {
    return (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
  }

  async function loadLesson() {
    const id = requestedLessonId();
    if (!id) throw new Error('lesson id が指定されていません。');
    const index = await json('json/lessons/lesson-index.json');
    const entry = (index.lessons || []).find(item => String(item.id).toUpperCase() === id);
    if (!entry) throw new Error(`教材 ${id} は見つかりません。`);
    const lesson = await json(entry.file);
    if (lesson.meta?.id !== entry.id) throw new Error(`${entry.id}: index と教材JSONのIDが一致しません。`);
    return { entry, lesson };
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

  function renderSection(section, index) {
    const title = escapeHtml(section.title || `${index + 1}. セクション`);
    if (section.type === 'text') {
      return `<section class="lesson-block"><h2>${title}</h2>${(section.paragraphs || []).map(p => `<p>${escapeHtml(p)}</p>`).join('')}</section>`;
    }
    if (section.type === 'comparison') {
      return `<section class="lesson-block"><h2>${title}</h2>${table(section.columns, section.rows, 'comparison-table')}${section.note ? `<div class="lesson-note"><strong>ポイント</strong><p>${escapeHtml(section.note)}</p></div>` : ''}</section>`;
    }
    if (section.type === 'code-trace') {
      return `<section class="lesson-block code-trace-block"><h2>${title}</h2>${section.question ? `<p class="lesson-question-lead">${escapeHtml(section.question)}</p>` : ''}<pre class="lesson-code"><code>${escapeHtml((section.code || []).join('\n'))}</code></pre><h3>実行トレース</h3>${table(section.traceColumns, section.traceRows, 'trace-table')}<div class="lesson-answer"><strong>答え</strong><p>${escapeHtml(section.answer || '')}</p></div>${section.explanation ? `<p>${escapeHtml(section.explanation)}</p>` : ''}</section>`;
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
    $('lesson-check').hidden = false;
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
          node.querySelectorAll('[data-option]').forEach(option => {
            option.disabled = true;
            if (Number(option.dataset.option) === Number(q.answerIndex)) option.classList.add('correct');
          });
          if (selected !== Number(q.answerIndex)) button.classList.add('wrong');
          const feedback = node.querySelector('.check-feedback');
          feedback.className = `check-feedback ${selected === Number(q.answerIndex) ? 'correct' : 'wrong'}`;
          feedback.innerHTML = `<strong>${selected === Number(q.answerIndex) ? '正解' : '不正解'}</strong><p>${escapeHtml(q.explanation || '')}</p>`;
          feedback.hidden = false;
        });
      });
    });
  }

  function renderNext(lesson) {
    const next = lesson.next || [];
    if (!next.length) return '';
    return `<section class="lesson-block next-lesson-block"><h2>次に進む</h2>${next.map(item => `<div class="next-lesson-row"><div><strong>${escapeHtml(item.lessonId)}</strong><p>${escapeHtml(item.label || '')}</p></div><span>${item.status === 'planned' ? '準備中' : escapeHtml(item.status || '')}</span></div>`).join('')}</section>`;
  }

  async function init() {
    try {
      const { entry, lesson } = await loadLesson();
      renderHero(entry, lesson);
      renderObjectives(lesson);
      $('lesson-status').innerHTML = `<strong>${escapeHtml(lesson.meta.id)}</strong> は、共通生成の長文ではなく、この学習内容専用に作った構造化教材です。`;
      $('lesson-sections').innerHTML = (lesson.sections || []).map(renderSection).join('') + renderNext(lesson);
      renderChecks(lesson);
    } catch (error) {
      console.error(error);
      $('lesson-status').classList.add('error');
      $('lesson-status').textContent = `教材の読み込みに失敗しました: ${error.message}`;
      $('lesson-sections').innerHTML = '<p><a href="algorithm.html">アルゴリズムページへ戻る</a></p>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

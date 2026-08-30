(() => {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function lessonId() {
    return (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
  }

  async function fetchJson(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function buildBlock(items) {
    const section = document.createElement('section');
    section.className = 'lesson-block lesson-official-past-block';
    section.innerHTML = `<h2>最新の公開公式問題で確認</h2><p>2026年度CBTの実問題は非公開のため、最新の公開済みフル問題である2025春・秋から、このLessonに関連する午後問題を表示します。問題文は転載せずIPA公式PDFで確認します。</p>${items.map(item => `<article class="next-lesson-row"><div><small>OFFICIAL PUBLIC · ${escapeHtml(item.exam.seasonLabel)} 午後 問${item.question.number}</small><strong>${escapeHtml(item.question.domain)}：${escapeHtml(item.question.topic)}</strong></div><span><a href="${escapeHtml(item.exam.officialQuestionPdfUrl)}" target="_blank" rel="noopener noreferrer">公式PDF</a></span></article>`).join('')}<p><a href="official-past.html">2025春・秋22大問の対応表を見る →</a></p>`;
    return section;
  }

  async function init() {
    const id = lessonId();
    if (!id) return;
    try {
      const data = await fetchJson('json/past/ap-public-exams.json');
      const items = (data.exams || []).flatMap(exam => (exam.questions || []).filter(question => (question.lessonRefs || []).includes(id)).map(question => ({ exam, question })));
      if (!items.length) return;
      const root = document.getElementById('lesson-sections');
      if (!root) return;
      const block = buildBlock(items);
      const inject = () => {
        if (!root.children.length) return false;
        root.querySelector('.lesson-official-past-block')?.remove();
        const nav = root.querySelector('.next-lesson-block');
        if (nav) root.insertBefore(block, nav); else root.appendChild(block);
        return true;
      };
      if (inject()) return;
      const observer = new MutationObserver(() => { if (inject()) observer.disconnect(); });
      observer.observe(root, { childList:true });
    } catch (error) {
      console.warn('[lesson-official-past] load failed', error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
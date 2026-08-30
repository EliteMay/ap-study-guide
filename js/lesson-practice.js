(() => {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function lessonId() {
    return (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
  }

  function buildBlock(questions) {
    const section = document.createElement('section');
    section.className = 'lesson-block lesson-practice-block';
    section.dataset.modularPractice = 'true';
    section.innerHTML = `<h2>このLessonを総合演習で使う</h2><p>Lesson内確認より一段離れた状況で、知識を選択・説明できるか確認します。</p>${questions.map(question => {
      const type = question.type === 'written' ? '記述' : '選択';
      const href = `practice.html?unit=${encodeURIComponent(question.unitId)}&question=${encodeURIComponent(question.id)}`;
      return `<a class="next-lesson-row is-link" href="${href}"><div><small>PRACTICE · ${escapeHtml(type)}</small><strong>${escapeHtml(question.id)} ${escapeHtml(question.title)}</strong></div><span>解く</span></a>`;
    }).join('')}`;
    return section;
  }

  function inject(block) {
    const root = document.getElementById('lesson-sections');
    if (!root) return false;
    if (!root.children.length) return false;
    root.querySelectorAll('.lesson-practice-block').forEach(node => node.remove());
    const nav = root.querySelector('.next-lesson-block');
    if (nav) root.insertBefore(block, nav);
    else root.appendChild(block);
    return true;
  }

  async function init() {
    const id = lessonId();
    if (!id || !window.APPracticeData?.load) return;
    try {
      const bank = await window.APPracticeData.load('../');
      const questions = (bank.questions || []).filter(question => (question.lessonRefs || []).includes(id));
      if (!questions.length) return;
      const block = buildBlock(questions);
      if (inject(block)) return;
      const root = document.getElementById('lesson-sections');
      if (!root) return;
      const observer = new MutationObserver(() => {
        if (inject(block)) observer.disconnect();
      });
      observer.observe(root, { childList:true });
    } catch (error) {
      console.warn('[lesson-practice] load failed', error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
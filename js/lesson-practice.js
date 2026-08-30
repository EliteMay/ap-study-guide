(() => {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function lessonId() {
    return (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
  }

  function buildBlock(lesson, questions) {
    const section = document.createElement('section');
    section.className = 'lesson-block lesson-practice-block';
    section.dataset.modularPractice = 'true';
    if (questions.length) {
      section.innerHTML = `<h2>このLessonを総合演習で使う</h2><p>Lesson内確認より一段離れた状況で、知識を選択・説明できるか確認します。</p>${questions.map(question => {
        const type = question.type === 'written' ? '記述' : '選択';
        const href = `practice.html?unit=${encodeURIComponent(question.unitId)}&question=${encodeURIComponent(question.id)}`;
        return `<a class="next-lesson-row is-link" href="${href}"><div><small>PRACTICE · ${escapeHtml(type)}</small><strong>${escapeHtml(question.id)} ${escapeHtml(question.title)}</strong></div><span>解く</span></a>`;
      }).join('')}`;
      return section;
    }

    const unitId = lesson?.unitId || '';
    section.dataset.practiceFallback = 'true';
    section.innerHTML = `<h2>このLessonの次の演習</h2><p>このLessonを直接参照する短問はまだありません。関連ユニットの演習で近い内容を確認できます。</p>${unitId ? `<a class="next-lesson-row is-link" href="practice.html?unit=${encodeURIComponent(unitId)}"><div><small>PRACTICE · UNIT</small><strong>関連ユニットの短問へ進む</strong></div><span>解く</span></a><a class="next-lesson-row is-link" href="cases.html?unit=${encodeURIComponent(unitId)}"><div><small>CASE · UNIT</small><strong>関連ユニットの長文Caseへ進む</strong></div><span>解く</span></a>` : '<a class="next-lesson-row is-link" href="practice.html"><div><small>PRACTICE</small><strong>短問総合演習へ進む</strong></div><span>解く</span></a>'}`;
    return section;
  }

  function inject(block) {
    const root = document.getElementById('lesson-sections');
    if (!root || !root.children.length) return false;
    root.querySelectorAll('.lesson-practice-block').forEach(node => node.remove());
    const nav = root.querySelector('.next-lesson-block');
    if (nav) root.insertBefore(block, nav);
    else root.appendChild(block);
    return true;
  }

  async function init() {
    const id = lessonId();
    if (!id || !window.APPracticeData?.load || !window.APLessonData?.load) return;
    try {
      const [practiceBank, lessonBank] = await Promise.all([
        window.APPracticeData.load('../'),
        window.APLessonData.load('../')
      ]);
      const lesson = (lessonBank.lessons || []).find(item => item.id === id) || null;
      const questions = (practiceBank.questions || []).filter(question => (question.lessonRefs || []).includes(id));
      const block = buildBlock(lesson, questions);
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

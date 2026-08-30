(() => {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function syncPracticeLinks() {
    if (!window.APPracticeData?.load) return;
    const lessonId = (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
    if (!lessonId) return;
    const bank = await window.APPracticeData.load('../');
    const questions = (bank.questions || []).filter(question => (question.lessonRefs || []).includes(lessonId));
    const main = document.getElementById('lesson-sections');
    if (!main) return;

    main.querySelector('.lesson-practice-block')?.remove();
    if (!questions.length) return;

    const entryUnit = questions[0]?.unitId || '';
    const section = document.createElement('section');
    section.className = 'lesson-block lesson-practice-block';
    section.innerHTML = `<h2>このLessonを総合演習で使う</h2><p>Lesson内の確認問題より一段離れた状況で、知識を選択・説明できるか確認します。現在の91問BankからこのLessonへ直接紐付く問題を表示しています。</p>${questions.map(question => {
      const type = question.type === 'written' ? '記述' : '選択';
      const href = `practice.html?unit=${encodeURIComponent(question.unitId || entryUnit)}&question=${encodeURIComponent(question.id)}`;
      return `<a class="next-lesson-row is-link" href="${href}"><div><small>PRACTICE · ${escapeHtml(type)}</small><strong>${escapeHtml(question.id)} ${escapeHtml(question.title)}</strong></div><span>解く</span></a>`;
    }).join('')}`;

    const nav = main.querySelector('.next-lesson-block');
    if (nav) main.insertBefore(section, nav);
    else main.appendChild(section);
  }

  window.addEventListener('load', () => syncPracticeLinks().catch(console.error));
})();
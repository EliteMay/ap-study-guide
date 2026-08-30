(() => {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function fetchJson(path) {
    const response = await fetch(`../${path}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function currentLessonId() {
    return (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
  }

  function buildBlock(mappings) {
    const section = document.createElement('section');
    section.className = 'lesson-block lesson-past-block';
    section.id = 'lesson-past-links';
    section.innerHTML = `<h2>関連する公式過去問解説</h2>
      <p>既存の過去問データから、このLessonと直接関係する問題へ進めます。問題文をこの教材へ複製せず、元の過去問解説を参照します。</p>
      ${mappings.map(item => `<a class="next-lesson-row is-link" href="security-past.html?id=${encodeURIComponent(item.pastId)}"><div><small>PAST QUESTION</small><strong>${escapeHtml(item.label)} · ${escapeHtml(item.theme)}</strong></div><span>開く</span></a>`).join('')}`;
    return section;
  }

  function appendWhenLessonReady(block) {
    const root = document.getElementById('lesson-sections');
    if (!root) return;
    const append = () => {
      if (document.getElementById('lesson-past-links')) return true;
      if (!root.children.length) return false;
      root.appendChild(block);
      return true;
    };
    if (append()) return;
    const observer = new MutationObserver(() => {
      if (append()) observer.disconnect();
    });
    observer.observe(root, { childList:true });
  }

  async function init() {
    const lessonId = currentLessonId();
    if (!lessonId) return;
    try {
      const data = await fetchJson('json/past/lesson-past-map.json');
      const mappings = (data.mappings || []).filter(item => (item.lessonRefs || []).includes(lessonId));
      if (!mappings.length) return;
      appendWhenLessonReady(buildBlock(mappings));
    } catch (error) {
      console.warn('[lesson-past] mapping load failed', error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
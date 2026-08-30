(() => {
  'use strict';

  const MANIFESTS = ['json/lessons/lesson-index.json','json/lessons/lesson-index-expansion.json'];
  const cache = new Map();

  function join(prefix, path) { return `${String(prefix || '')}${path}`; }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function load(prefix = '') {
    const key = String(prefix || '');
    if (cache.has(key)) return cache.get(key);
    const promise = Promise.all(MANIFESTS.map(path => fetchJson(join(prefix, path))))
      .then(([base, expansion]) => {
        const lessons = [...(base.lessons || []), ...(expansion.lessons || [])]
          .sort((a,b) => Number(a.order || 0) - Number(b.order || 0));
        return { lessons, base, expansion };
      })
      .catch(error => { cache.delete(key); throw error; });
    cache.set(key, promise);
    return promise;
  }

  window.APLessonData = { load, manifests:[...MANIFESTS] };
})();
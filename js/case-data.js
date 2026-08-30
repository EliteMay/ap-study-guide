(() => {
  'use strict';

  const MANIFEST = 'json/cases/case-index.json';
  const cache = new Map();

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function load(prefix = '') {
    const key = String(prefix || '');
    if (cache.has(key)) return cache.get(key);
    const promise = (async () => {
      const manifest = await fetchJson(`${prefix}${MANIFEST}`);
      const files = Array.isArray(manifest.files) ? manifest.files : [];
      if (!files.length) throw new Error('case manifest has no files');
      const payloads = await Promise.all(files.map(item => fetchJson(`${prefix}${item.file}`)));
      const cases = payloads.flatMap(payload => Array.isArray(payload.cases) ? payload.cases : []);
      return { meta:manifest.meta || {}, files, payloads, cases };
    })().catch(error => { cache.delete(key); throw error; });
    cache.set(key, promise);
    return promise;
  }

  window.APCaseData = { load, manifestPath:MANIFEST };
})();
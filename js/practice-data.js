(() => {
  'use strict';

  const DEFAULT_MANIFEST = 'json/practice/ap-original-practice-v1.json';

  async function fetchJson(path) {
    const response = await fetch(path, { cache:'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function joinPrefix(prefix, path) {
    const base = String(prefix || '');
    return `${base}${path}`;
  }

  async function load(prefix = '') {
    const manifest = await fetchJson(joinPrefix(prefix, DEFAULT_MANIFEST));
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    if (!files.length) {
      return {
        meta:manifest.meta || {},
        files:[],
        questions:Array.isArray(manifest.questions) ? manifest.questions : []
      };
    }

    const payloads = await Promise.all(files.map(item => fetchJson(joinPrefix(prefix, item.file))));
    const questions = payloads.flatMap(payload => Array.isArray(payload.questions) ? payload.questions : []);
    return { meta:manifest.meta || {}, files, questions, payloads };
  }

  window.APPracticeData = { load, manifestPath:DEFAULT_MANIFEST };
})();
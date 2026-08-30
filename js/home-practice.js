(() => {
  'use strict';

  const HISTORY_KEY = 'ap-study-practice-history-v1';

  function readHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }

  function mastered(question, record) {
    if (!record) return false;
    return question.type === 'choice' ? Number(record.bestScore) >= 1 : Number(record.bestScore) >= 2;
  }

  function render(questions) {
    const history = readHistory();
    const attempted = questions.filter(q => history[q.id]).length;
    const done = questions.filter(q => mastered(q, history[q.id])).length;
    const retry = questions.filter(q => history[q.id] && !mastered(q, history[q.id])).length;
    const number = document.getElementById('practice-progress-number');
    const meta = document.getElementById('practice-progress-meta');
    if (number) number.textContent = `${done} / ${questions.length}`;
    if (meta) meta.textContent = `${attempted}問挑戦 · ${done}問理解済み · ${retry}問要復習。13ユニット各5問以上、全23中分類をCoverage。`;
  }

  async function refresh() {
    if (!window.APPracticeData?.load) return;
    try {
      const bank = await window.APPracticeData.load('');
      render(bank.questions || []);
    } catch (error) {
      console.warn('[home-practice] load failed', error);
    }
  }

  window.addEventListener('storage', event => { if (event.key === HISTORY_KEY) refresh(); });
  document.addEventListener('DOMContentLoaded', refresh);
})();
(() => {
  'use strict';

  const HISTORY_KEY = 'ap-study-case-history-v1';

  function readHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }

  function mastered(item, record) {
    return item.questions.every(question => Number(record?.questions?.[question.id]?.bestScore || 0) >= 2);
  }

  function attempted(record) {
    return Object.keys(record?.questions || {}).length > 0;
  }

  async function render() {
    if (!window.APCaseData?.load) return;
    const bank = await window.APCaseData.load('');
    const cases = Array.isArray(bank.cases) ? bank.cases : [];
    const history = readHistory();
    const attemptedCount = cases.filter(item => attempted(history[item.id])).length;
    const masteredCount = cases.filter(item => mastered(item, history[item.id])).length;
    const retryCount = cases.filter(item => attempted(history[item.id]) && !mastered(item, history[item.id])).length;
    const number = document.getElementById('case-progress-number');
    const meta = document.getElementById('case-progress-meta');
    if (number) number.textContent = `${masteredCount} / ${cases.length}`;
    if (meta) meta.textContent = `${attemptedCount}Case挑戦 · ${masteredCount}Case理解済み · ${retryCount}Case途中/要復習。13ユニット・23中分類を横断します。`;
  }

  window.addEventListener('storage', event => { if (event.key === HISTORY_KEY) render().catch(console.error); });
  document.addEventListener('DOMContentLoaded', () => render().catch(error => console.warn('[home-cases] load failed', error)));
})();
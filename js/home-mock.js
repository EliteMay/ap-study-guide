(() => {
  'use strict';

  const HISTORY_KEY = 'ap-study-mock-history-v1';

  function readHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  function render() {
    const history = readHistory();
    const latestA = history.find(item => item?.subject === 'A');
    const latestB = history.find(item => item?.subject === 'B');
    const number = document.getElementById('mock-progress-number');
    const meta = document.getElementById('mock-progress-meta');
    if (number) number.textContent = `${history.length} 回`;
    if (meta) {
      const parts = [];
      parts.push(latestA ? `科目A ${Number(latestA.score || 0)}/${Number(latestA.maxScore || latestA.total || 80)}` : '科目A 未実施');
      parts.push(latestB ? `科目B ${Number(latestB.score || 0)}/${Number(latestB.maxScore || 30)}` : '科目B 未実施');
      meta.textContent = `${parts.join(' · ')}。150分の時間配分と見直しを練習します。`;
    }
  }

  window.addEventListener('storage', event => { if (event.key === HISTORY_KEY) render(); });
  document.addEventListener('DOMContentLoaded', render);
})();

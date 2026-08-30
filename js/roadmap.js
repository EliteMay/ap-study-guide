(() => {
  'use strict';

  const STATUS_LABELS = { 'existing-needs-audit':'既存教材あり・要監査', partial:'構造化教材あり・拡張中', missing:'未整備' };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadMap() {
    const [base, coverage] = await Promise.all([
      fetchJson('../json/curriculum/ap-2026-map.json'),
      fetchJson('../json/curriculum/ap-2026-coverage.json')
    ]);
    const overrides = coverage?.overrides || {};
    return { ...base, effectiveCoverageMeta:coverage?.meta || {}, studyUnits:(base.studyUnits || []).map(unit => ({ ...unit, ...(overrides[unit.id] || {}) })) };
  }

  function renderSummary(data) {
    const units = data.studyUnits || [];
    const official = data.middleCategories || [];
    const counts = units.reduce((acc, unit) => { acc[unit.coverage] = (acc[unit.coverage] || 0) + 1; return acc; }, {});
    document.getElementById('roadmap-summary').innerHTML = `<div class="summary-item"><strong>${official.length}</strong><span>IPA中分類</span></div><div class="summary-item"><strong>${units.length}</strong><span>学習ユニット</span></div><div class="summary-item status-audit"><strong>${data.effectiveCoverageMeta?.structuredLessons || '-'}</strong><span>構造化Lesson</span></div><div class="summary-item status-partial"><strong>${counts.partial || 0}</strong><span>教材あり・拡張中</span></div><div class="summary-item status-missing"><strong>${counts.missing || 0}</strong><span>完全未整備</span></div>`;
  }

  function renderUnits(data) {
    const middleByCode = new Map((data.middleCategories || []).map(item => [item.code,item]));
    document.getElementById('study-unit-grid').innerHTML = [...(data.studyUnits || [])].sort((a,b) => a.order-b.order).map(unit => {
      const official = (unit.officialMiddleCodes || []).map(code => middleByCode.get(code)).filter(Boolean);
      const hub = unit.hubHref || `unit.html?unit=${encodeURIComponent(unit.id)}`;
      return `<article class="study-unit-card" data-status="${escapeHtml(unit.coverage)}"><div class="study-unit-top"><span class="study-unit-order">${String(unit.order).padStart(2,'0')}</span><span class="coverage-badge ${escapeHtml(unit.coverage)}">${escapeHtml(STATUS_LABELS[unit.coverage] || unit.coverage)}</span></div><h3>${escapeHtml(unit.title)}</h3><ul class="official-links">${official.map(item => `<li>中分類${item.code}：${escapeHtml(item.title)}</li>`).join('')}</ul><div class="content-type-list">${(unit.contentTypes || []).map(type => `<span>${escapeHtml(type)}</span>`).join('')}</div><p>${escapeHtml(unit.auditNote || '')}</p><a class="study-unit-link" href="${escapeHtml(hub)}">教材を開く →</a></article>`;
    }).join('');
  }

  function renderOfficial(data) {
    const middleByMajor = new Map();
    for (const item of data.middleCategories || []) { if (!middleByMajor.has(item.majorCode)) middleByMajor.set(item.majorCode,[]); middleByMajor.get(item.majorCode).push(item); }
    document.getElementById('official-map').innerHTML = (data.majorCategories || []).map(major => `<section class="official-major"><div class="official-major-heading"><span>${escapeHtml(major.group)}</span><h3>大分類${major.code}：${escapeHtml(major.title)}</h3></div><div class="official-middle-list">${(middleByMajor.get(major.code) || []).map(middle => `<article class="official-middle"><strong>中分類${middle.code}：${escapeHtml(middle.title)}</strong><p>${(middle.small || []).map(escapeHtml).join(' / ')}</p></article>`).join('')}</div></section>`).join('');
  }

  document.addEventListener('DOMContentLoaded', () => loadMap().then(data => { renderSummary(data); renderUnits(data); renderOfficial(data); }).catch(error => {
    console.error(error);
    document.getElementById('roadmap-summary').innerHTML = `<div class="roadmap-error">学習マップの読み込みに失敗しました: ${escapeHtml(error.message)}</div>`;
  }));
})();
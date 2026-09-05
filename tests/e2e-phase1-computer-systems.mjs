import { chromium } from 'playwright';

const base = process.env.AP_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

async function goto(path) {
  await page.goto(`${base}/${path}`, { waitUntil:'networkidle' });
}
async function noOverflow(label) {
  const report = await page.evaluate(() => {
    const client = document.documentElement.clientWidth;
    const scroll = document.documentElement.scrollWidth;
    const offenders = [...document.querySelectorAll('body *')]
      .map(node => {
        const rect = node.getBoundingClientRect();
        return {
          tag:node.tagName.toLowerCase(),
          className:typeof node.className === 'string' ? node.className : '',
          text:(node.textContent || '').trim().replace(/\s+/g,' ').slice(0,90),
          left:Math.round(rect.left),
          right:Math.round(rect.right),
          width:Math.round(rect.width),
          scrollWidth:node.scrollWidth,
          clientWidth:node.clientWidth
        };
      })
      .filter(item => item.right > client + 1 || item.left < -1)
      .sort((a,b) => (b.right - client) - (a.right - client))
      .slice(0,10);
    return { client, scroll, offenders };
  });
  if (report.scroll > report.client + 1) throw new Error(`${label}: horizontal overflow ${report.scroll} > ${report.client}; offenders=${JSON.stringify(report.offenders)}`);
}

try {
  const phaseIndex = await (await fetch(`${base}/json/phase1/index.json`)).json();
  const computerRef = (phaseIndex.units || []).find(item => item.unitId === 'computer-systems');
  if (!computerRef || computerRef.status !== 'pilot') throw new Error('Computer Systems Phase 1 manifest missing');
  const phaseData = await (await fetch(`${base}/${computerRef.file}`)).json();
  if ((phaseData.lessons || []).length !== 12) throw new Error(`Computer Systems overlay count mismatch: ${(phaseData.lessons || []).length}`);
  const cmp03 = (phaseData.lessons || []).find(item => item.id === 'CMP-03');
  if (!cmp03 || cmp03.inlineChecks?.length !== 2) throw new Error('CMP-03 Phase 1 data missing');

  await goto('html/lesson.html?id=CMP-03');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  const metaText = await page.locator('.lesson-meta-row').textContent();
  for (const expected of ['重要度 高','頻出度 高','Phase 1 再編中']) {
    if (!metaText?.includes(expected)) throw new Error(`CMP-03 metadata chip missing: ${expected}`);
  }
  const mapText = await page.locator('.lesson-connections').textContent();
  for (const expected of ['APでの見られ方','FND-01','PC-CMP-03','このLessonの位置づけ']) {
    if (!mapText?.includes(expected)) throw new Error(`CMP-03 learning map missing: ${expected}`);
  }
  const firstInline = page.locator('.lesson-inline-check').first();
  await firstInline.locator(`[data-inline-option="${cmp03.inlineChecks[0].answerIndex}"]`).click();
  if (!await firstInline.locator('.lesson-inline-feedback:not([hidden])').isVisible()) throw new Error('CMP-03 inline feedback did not render');
  const mapPractice = page.locator('.lesson-connections a[href="practice.html?question=PC-CMP-03&unit=computer-systems"]');
  if (!await mapPractice.isVisible()) throw new Error('CMP-03 learning-map direct practice link missing');

  await goto('html/lesson.html?id=CMP-07');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  const cmp07Map = await page.locator('.lesson-connections').textContent();
  if (!cmp07Map?.includes('2025春 午後 問4') || !cmp07Map?.includes('2025秋 午後 問4')) throw new Error('CMP-07 published-official mappings missing');

  await goto('html/lesson.html?id=CMP-12');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  const cmp12Meta = await page.locator('.lesson-meta-row').textContent();
  if (!cmp12Meta?.includes('重要度 中') || !cmp12Meta?.includes('頻出度 中')) throw new Error('CMP-12 Phase 1 metadata missing');
  const cmp12Map = await page.locator('.lesson-connections').textContent();
  for (const expected of ['FND-07','P-CMP-05','2025春 午後 問7','2025秋 午後 問7']) {
    if (!cmp12Map?.includes(expected)) throw new Error(`CMP-12 learning map missing: ${expected}`);
  }

  await goto('html/search.html?q=CMP-08');
  await page.waitForFunction(() => [...document.querySelectorAll('.search-result code')].some(node => node.textContent === 'CMP-08'));
  if (!await page.locator('.search-result').filter({ hasText:'CPU・システム性能を式で読む' }).first().isVisible()) throw new Error('cross-search cannot reach CMP-08');

  await goto('html/unit.html?unit=computer-systems');
  await page.waitForFunction(() => document.querySelectorAll('.unit-lesson-card').length >= 12);
  if (!(await page.locator('#unit-hero').textContent())?.includes('コンピュータシステム')) throw new Error('Computer Systems Unit Hub failed');
  const unitHubLessonIds = await page.locator('.unit-lesson-card').evaluateAll(nodes => [...new Set(nodes.map(node => new URL(node.href).searchParams.get('id')).filter(Boolean))].sort());
  const expectedUnitHubLessonIds = Array.from({ length:12 }, (_, index) => `CMP-${String(index + 1).padStart(2, '0')}`);
  if (JSON.stringify(unitHubLessonIds) !== JSON.stringify(expectedUnitHubLessonIds)) throw new Error(`Computer Systems Unit Hub unique Lesson set mismatch: ${unitHubLessonIds.join(', ')}`);
  if ((await page.title()) !== 'コンピュータシステム | AP Study Guide') throw new Error(`Computer Systems Unit Hub title is stale: ${await page.title()}`);

  await page.setViewportSize({ width:320, height:700 });
  await goto('html/lesson.html?id=CMP-04');
  await page.waitForSelector('.lesson-inline-check');
  await noOverflow('CMP-04 320px');
  await goto('html/lesson.html?id=CMP-12');
  await page.waitForSelector('.lesson-inline-check');
  await page.screenshot({ path:'artifacts/debug-cmp12-320.png', fullPage:true });
  await noOverflow('CMP-12 320px');
  await goto('html/unit.html?unit=computer-systems');
  await page.waitForSelector('.unit-lesson-card');
  await noOverflow('computer-systems unit 320px');

  if (errors.length) throw new Error(`browser console errors:\n${errors.join('\n')}`);
  console.log(`[e2e-phase1-computer-systems] OK: ${phaseData.lessons.length} Computer Systems Phase 1 overlays, unique Unit Hub Lesson set, learning map, inline checks, official/practice links, search reachability and 320px layout.`);
} finally {
  await browser.close();
}

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
  const width = await page.evaluate(() => ({ client:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth }));
  if (width.scroll > width.client + 1) throw new Error(`${label}: horizontal overflow ${width.scroll} > ${width.client}`);
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
  if (!(await page.locator('#unit-hero').textContent())?.includes('コンピュータシステム')) throw new Error('Computer Systems Unit Hub failed');
  if (await page.locator('.unit-lesson-card').count() !== 12) throw new Error('Computer Systems Unit Hub must show 12 current Lessons');

  await page.setViewportSize({ width:320, height:700 });
  await goto('html/lesson.html?id=CMP-04');
  await page.waitForSelector('.lesson-inline-check');
  await noOverflow('CMP-04 320px');
  await goto('html/lesson.html?id=CMP-12');
  await page.waitForSelector('.lesson-inline-check');
  await noOverflow('CMP-12 320px');
  await goto('html/unit.html?unit=computer-systems');
  await page.waitForSelector('.unit-lesson-card');
  await noOverflow('computer-systems unit 320px');

  if (errors.length) throw new Error(`browser console errors:\n${errors.join('\n')}`);
  console.log(`[e2e-phase1-computer-systems] OK: ${phaseData.lessons.length} Computer Systems Phase 1 overlays, learning map, inline checks, official/practice links, search/unit reachability and 320px layout.`);
} finally {
  await browser.close();
}

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
    return { client, scroll };
  });
  if (report.scroll > report.client + 1) throw new Error(`${label}: horizontal overflow ${report.scroll} > ${report.client}`);
}

try {
  const phaseIndex = await (await fetch(`${base}/json/phase1/index.json`)).json();
  const unitRef = (phaseIndex.units || []).find(item => item.unitId === 'database');
  if (!unitRef || unitRef.status !== 'pilot' || unitRef.file !== 'json/phase1/database-r30.json') throw new Error('Database Phase 1 manifest missing');
  const phaseData = await (await fetch(`${base}/${unitRef.file}`)).json();
  if ((phaseData.lessons || []).length !== 14) throw new Error(`Database overlay count mismatch: ${(phaseData.lessons || []).length}`);

  const db03 = (phaseData.lessons || []).find(item => item.id === 'DB-03');
  await goto('html/lesson.html?id=DB-03');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  const db03Meta = await page.locator('.lesson-meta-row').textContent();
  for (const expected of ['重要度 高','頻出度 高','Phase 1 再編中']) if (!db03Meta?.includes(expected)) throw new Error(`DB-03 metadata missing: ${expected}`);
  const db03Map = await page.locator('.lesson-connections').textContent();
  for (const expected of ['DB-01','DB-02','P-DB-01','2025春 午後 問6','2025秋 午後 問6']) if (!db03Map?.includes(expected)) throw new Error(`DB-03 learning map missing: ${expected}`);
  const firstInline = page.locator('.lesson-inline-check').first();
  await firstInline.locator(`[data-inline-option="${db03.inlineChecks[0].answerIndex}"]`).click();
  if (!await firstInline.locator('.lesson-inline-feedback:not([hidden])').isVisible()) throw new Error('DB-03 inline feedback did not render');
  if (!await page.locator('.lesson-connections a[href="practice.html?question=P-DB-01&unit=database"]').isVisible()) throw new Error('DB-03 direct Practice link missing');

  await goto('html/lesson.html?id=DB-05');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  const db05Map = await page.locator('.lesson-connections').textContent();
  for (const expected of ['P-DB-02','2025春 午後 問6','2025秋 午後 問6']) if (!db05Map?.includes(expected)) throw new Error(`DB-05 learning map missing: ${expected}`);
  if (!(await page.locator('h1').textContent())?.includes('SELECT・条件式・NULL')) throw new Error('DB-05 title missing');

  await goto('html/lesson.html?id=DB-09');
  await page.waitForSelector('.lesson-connections');
  const db09Meta = await page.locator('.lesson-meta-row').textContent();
  for (const expected of ['重要度 高','頻出度 高']) if (!db09Meta?.includes(expected)) throw new Error(`DB-09 metadata missing: ${expected}`);
  const db09Map = await page.locator('.lesson-connections').textContent();
  if (!db09Map?.includes('P-DB-04')) throw new Error('DB-09 Practice link missing');
  if (db09Map?.includes('2025春 午後 問6') || db09Map?.includes('2025秋 午後 問6')) throw new Error('DB-09 must not invent unrelated official mapping');

  await goto('html/lesson.html?id=DB-14');
  await page.waitForSelector('.lesson-connections');
  const db14Meta = await page.locator('.lesson-meta-row').textContent();
  for (const expected of ['重要度 中','頻出度 中']) if (!db14Meta?.includes(expected)) throw new Error(`DB-14 metadata missing: ${expected}`);
  if (!(await page.locator('.lesson-connections').textContent())?.includes('PC-DB-14')) throw new Error('DB-14 Practice link missing');

  await goto('html/search.html?q=DB-11');
  await page.waitForFunction(() => [...document.querySelectorAll('.search-result code')].some(node => node.textContent === 'DB-11'));
  if (!await page.locator('.search-result').filter({ hasText:'索引・実行計画・性能' }).first().isVisible()) throw new Error('cross-search cannot reach DB-11');

  await goto('html/unit.html?unit=database');
  await page.waitForFunction(() => document.querySelectorAll('.unit-lesson-card').length >= 14);
  if (!(await page.locator('#unit-hero').textContent())?.includes('データベース')) throw new Error('Database Unit Hub failed');
  if ((await page.title()) !== 'データベース | AP Study Guide') throw new Error(`Database Unit Hub title is stale: ${await page.title()}`);
  const unitOrder = await page.locator('.unit-lesson-card').evaluateAll(nodes => nodes.map(node => new URL(node.href).searchParams.get('id')).filter(Boolean));
  const expectedOrder = Array.from({ length:14 }, (_, index) => `DB-${String(index + 1).padStart(2, '0')}`);
  if (JSON.stringify(unitOrder) !== JSON.stringify(expectedOrder)) throw new Error(`Database Unit Hub order mismatch: ${unitOrder.join(' -> ')}`);
  const displayedNumbers = await page.locator('.unit-lesson-card .unit-lesson-order').allTextContents();
  const expectedNumbers = Array.from({ length:14 }, (_, index) => String(index + 1).padStart(2, '0'));
  if (JSON.stringify(displayedNumbers.map(text => text.trim())) !== JSON.stringify(expectedNumbers)) throw new Error(`Database Unit Hub display numbers mismatch: ${displayedNumbers.join(', ')}`);

  await page.setViewportSize({ width:320, height:700 });
  for (const [path,label] of [
    ['html/lesson.html?id=DB-05','DB-05 320px'],
    ['html/lesson.html?id=DB-09','DB-09 320px'],
    ['html/lesson.html?id=DB-14','DB-14 320px'],
    ['html/unit.html?unit=database','database unit 320px']
  ]) {
    await goto(path);
    await page.waitForSelector(path.includes('unit.html') ? '.unit-lesson-card' : '.lesson-inline-check');
    await noOverflow(label);
  }

  if (errors.length) throw new Error(`browser console errors:\n${errors.join('\n')}`);
  console.log(`[e2e-phase1-database] OK: ${phaseData.lessons.length} Database Phase 1 overlays, learning maps, direct Practice, published-official links, search reachability, ordered Unit Hub and 320px layout.`);
} finally {
  await browser.close();
}

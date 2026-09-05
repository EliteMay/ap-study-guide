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
    const isContainedByScroller = node => {
      let parent = node.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();
        if (['auto','scroll','hidden','clip'].includes(style.overflowX) && rect.left >= -1 && rect.right <= client + 1) return true;
        parent = parent.parentElement;
      }
      return false;
    };
    const describe = node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        tag:node.tagName.toLowerCase(),
        className:typeof node.className === 'string' ? node.className : '',
        text:(node.textContent || '').trim().replace(/\s+/g,' ').slice(0,90),
        left:Math.round(rect.left),
        right:Math.round(rect.right),
        width:Math.round(rect.width),
        scrollWidth:node.scrollWidth,
        clientWidth:node.clientWidth,
        overflowX:style.overflowX,
        minWidth:style.minWidth
      };
    };
    const offenders = [...document.querySelectorAll('body *')]
      .filter(node => {
        const rect = node.getBoundingClientRect();
        return (rect.right > client + 1 || rect.left < -1) && !isContainedByScroller(node);
      })
      .map(describe)
      .slice(0,15);
    return { client, scroll, offenders };
  });
  if (report.scroll > report.client + 1) throw new Error(`${label}: horizontal overflow ${report.scroll} > ${report.client}; offenders=${JSON.stringify(report.offenders)}`);
}

try {
  const phaseIndex = await (await fetch(`${base}/json/phase1/index.json`)).json();
  const unitRef = (phaseIndex.units || []).find(item => item.unitId === 'ui-media');
  if (!unitRef || unitRef.status !== 'pilot') throw new Error('UI/Media Phase 1 manifest missing');
  const phaseData = await (await fetch(`${base}/${unitRef.file}`)).json();
  if ((phaseData.lessons || []).length !== 8) throw new Error(`UI/Media overlay count mismatch: ${(phaseData.lessons || []).length}`);

  const uim01 = (phaseData.lessons || []).find(item => item.id === 'UIM-01');
  await goto('html/lesson.html?id=UIM-01');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  const uim01Meta = await page.locator('.lesson-meta-row').textContent();
  for (const expected of ['重要度 高','頻出度 高','Phase 1 再編中']) if (!uim01Meta?.includes(expected)) throw new Error(`UIM-01 metadata missing: ${expected}`);
  const uim01Map = await page.locator('.lesson-connections').textContent();
  for (const expected of ['UIM-02','UIM-03','UIM-04','P-UIM-03','2025秋 午後 問8']) if (!uim01Map?.includes(expected)) throw new Error(`UIM-01 learning map missing: ${expected}`);
  const firstInline = page.locator('.lesson-inline-check').first();
  await firstInline.locator(`[data-inline-option="${uim01.inlineChecks[0].answerIndex}"]`).click();
  if (!await firstInline.locator('.lesson-inline-feedback:not([hidden])').isVisible()) throw new Error('UIM-01 inline feedback did not render');

  await goto('html/lesson.html?id=UIM-04');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  if (!(await page.locator('h1').textContent())?.includes('画面・帳票・コード・Web設計')) throw new Error('UIM-04 new lesson title missing');
  const uim04Map = await page.locator('.lesson-connections').textContent();
  for (const expected of ['UIM-01','UIM-03','P-UIM-06','2025秋 午後 問8']) if (!uim04Map?.includes(expected)) throw new Error(`UIM-04 learning map missing: ${expected}`);
  if (!await page.locator('.lesson-connections a[href="practice.html?question=P-UIM-06&unit=ui-media"]').isVisible()) throw new Error('UIM-04 direct Practice link missing');

  await goto('html/lesson.html?id=MED-04');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  if (!(await page.locator('h1').textContent())?.includes('マルチメディア統合')) throw new Error('MED-04 new lesson title missing');
  const med04Map = await page.locator('.lesson-connections').textContent();
  for (const expected of ['FND-05','MED-01','MED-03','P-UIM-07']) if (!med04Map?.includes(expected)) throw new Error(`MED-04 learning map missing: ${expected}`);
  if (med04Map?.includes('2025秋 午後 問8')) throw new Error('MED-04 must not invent unrelated official mapping');

  await goto('html/search.html?q=UIM-04');
  await page.waitForFunction(() => [...document.querySelectorAll('.search-result code')].some(node => node.textContent === 'UIM-04'));
  if (!await page.locator('.search-result').filter({ hasText:'画面・帳票・コード・Web設計' }).first().isVisible()) throw new Error('cross-search cannot reach UIM-04');
  await goto('html/search.html?q=MED-04');
  await page.waitForFunction(() => [...document.querySelectorAll('.search-result code')].some(node => node.textContent === 'MED-04'));
  if (!await page.locator('.search-result').filter({ hasText:'マルチメディア統合' }).first().isVisible()) throw new Error('cross-search cannot reach MED-04');

  await goto('html/unit.html?unit=ui-media');
  await page.waitForFunction(() => document.querySelectorAll('.unit-lesson-card').length >= 8);
  if (!(await page.locator('#unit-hero').textContent())?.includes('UI・情報メディア')) throw new Error('UI/Media Unit Hub failed');
  const unitIds = await page.locator('.unit-lesson-card').evaluateAll(nodes => [...new Set(nodes.map(node => new URL(node.href).searchParams.get('id')).filter(Boolean))].sort());
  const expectedIds = ['MED-01','MED-02','MED-03','MED-04','UIM-01','UIM-02','UIM-03','UIM-04'];
  if (JSON.stringify(unitIds) !== JSON.stringify(expectedIds)) throw new Error(`UI/Media Unit Hub unique Lesson set mismatch: ${unitIds.join(', ')}`);
  if ((await page.title()) !== 'UI・情報メディア | AP Study Guide') throw new Error(`UI/Media Unit Hub title is stale: ${await page.title()}`);

  await page.setViewportSize({ width:320, height:700 });
  await goto('html/lesson.html?id=UIM-04');
  await page.waitForSelector('.lesson-inline-check');
  await noOverflow('UIM-04 320px');
  await goto('html/lesson.html?id=MED-04');
  await page.waitForSelector('.lesson-inline-check');
  await noOverflow('MED-04 320px');
  await goto('html/unit.html?unit=ui-media');
  await page.waitForSelector('.unit-lesson-card');
  await noOverflow('ui-media unit 320px');

  if (errors.length) throw new Error(`browser console errors:\n${errors.join('\n')}`);
  console.log(`[e2e-phase1-ui-media] OK: ${phaseData.lessons.length} UI/Media Phase 1 overlays, 2 new Lessons, learning maps, official/practice links, search reachability, unique Unit Hub set and 320px layout.`);
} finally {
  await browser.close();
}

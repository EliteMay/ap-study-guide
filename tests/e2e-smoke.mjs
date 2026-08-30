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

try {
  await goto('index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil:'networkidle' });
  if (!await page.getByRole('heading', { name:'何をするか選ぶだけ。' }).isVisible()) throw new Error('action-first homepage heading missing');
  if (await page.locator('#home-unit-grid .unit-card').count() !== 13) throw new Error('homepage must render 13 unit cards');
  if (await page.locator('.home-launch-card').count() !== 8) throw new Error('homepage must expose 8 main actions');
  await page.locator('#home-quick-search').fill('OAuth');
  if (!await page.locator('#home-quick-results').isVisible()) throw new Error('homepage quick finder did not open');
  if (!(await page.locator('#home-quick-results').textContent())?.includes('単語辞書')) throw new Error('homepage quick finder does not route unknown term to glossary');

  await goto('html/glossary.html?q=OAuth');
  await page.waitForFunction(() => document.querySelectorAll('.glossary-card').length > 0);
  if (!(await page.locator('#glossary-result-count').textContent())?.includes('語が一致')) throw new Error('glossary result count missing');
  if (!(await page.locator('#glossary-results').textContent())?.toLowerCase().includes('oauth')) throw new Error('glossary search failed for OAuth');
  const firstDetail = page.locator('[data-detail-button]').first();
  await firstDetail.click();
  if (await page.locator('.glossary-detail:not([hidden])').count() !== 1) throw new Error('glossary lazy detail did not open');

  await goto('html/unit.html?unit=security');
  if (!(await page.locator('#unit-hero h1').textContent())?.includes('セキュリティ')) throw new Error('generic security hub failed');
  const unitGlossary = page.getByRole('link', { name:'単語辞書', exact:true });
  if (!await unitGlossary.isVisible()) throw new Error('unified glossary link missing from generic hub');
  if ((await unitGlossary.getAttribute('href')) !== 'glossary.html?domain=security') throw new Error('security hub glossary filter mismatch');

  await goto('html/lesson.html?id=FND-02');
  await page.waitForSelector('.check-question');
  const lesson = await (await fetch(`${base}/json/lessons/foundation/fnd-02-number-representation.json`)).json();
  const cards = page.locator('.check-question');
  for (let i = 0; i < lesson.checks.length; i += 1) {
    const correct = Number(lesson.checks[i].answerIndex);
    const wrong = correct === 0 ? 1 : 0;
    await cards.nth(i).locator(`[data-option="${wrong}"]`).click();
  }
  const lessonState = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('ap-study-lesson-progress-v1') || '{}');
    return window.APStudyState.lessonState(raw['FND-02']);
  });
  if (lessonState.mastered) throw new Error('failed lesson was incorrectly mastered');

  await goto('html/practice.html?unit=database&type=written&question=P-DB-03');
  await page.waitForSelector('#practice-written-answer');
  if (!(await page.locator('#practice-reveal').isDisabled())) throw new Error('written model answer should be locked when blank');
  await page.locator('#practice-written-answer').fill('インデックスは選択率や条件式によって利用効率が変わるため、常に高速化するとは限らない。');
  if (await page.locator('#practice-reveal').isDisabled()) throw new Error('written model answer did not unlock after real answer');

  await goto('html/cases.html?unit=database&case=CASE-DB-01');
  await page.waitForSelector('.case-question textarea');
  const firstCase = page.locator('.case-question').first();
  if (!(await firstCase.locator('.case-reveal').isDisabled())) throw new Error('case model answer should be locked when blank');
  await firstCase.locator('textarea').fill('在庫更新が同時実行されると競合が起きるため、トランザクションとロックで整合性を守る必要がある。');
  if (await firstCase.locator('.case-reveal').isDisabled()) throw new Error('case model answer did not unlock');

  await page.setViewportSize({ width:390, height:844 });
  await goto('index.html');
  const menu = page.locator('.ap-mobile-menu');
  const nav = page.locator('.unit-nav');
  if ((await nav.getAttribute('inert')) === null) throw new Error('closed mobile nav must be inert');
  await menu.click();
  if ((await nav.getAttribute('inert')) !== null) throw new Error('open mobile nav must not be inert');
  await page.keyboard.press('Escape');
  if ((await nav.getAttribute('inert')) === null) throw new Error('Escape must close and inert mobile nav');

  await goto('html/data.html');
  if (!await page.getByRole('button', { name:'JSONを書き出す' }).isVisible()) throw new Error('backup export button missing');
  if (!await page.locator('#data-import-file').isVisible()) throw new Error('backup import input missing');

  if (errors.length) throw new Error(`browser console errors:\n${errors.join('\n')}`);
  console.log('[e2e] OK: action home, unified glossary, unit hub, lesson threshold, written gates, mobile drawer, backup page');
} finally {
  await browser.close();
}
import { chromium } from 'playwright';

const base = process.env.AP_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

try {
  await page.goto(`${base}/index.html`, { waitUntil:'networkidle' });
  const search = page.locator('#home-quick-search');
  const results = page.locator('#home-quick-results');

  await search.fill('FND-02');
  await results.waitFor({ state:'visible' });
  const directLesson = results.locator('a[href="html/lesson.html?id=FND-02"]');
  if (!await directLesson.isVisible()) throw new Error('home finder must expose a direct Lesson result for an exact Lesson ID');
  if ((await results.locator('a').first().getAttribute('href')) !== 'html/lesson.html?id=FND-02') throw new Error('exact Lesson ID must rank the direct Lesson result first');
  if ((await search.getAttribute('aria-expanded')) !== 'true') throw new Error('home finder must expose expanded state to assistive technology');

  await search.fill('Lesson');
  await results.waitFor({ state:'visible' });
  if ((await results.locator('a').first().getAttribute('href')) !== 'html/roadmap.html') throw new Error('generic Lesson query should rank the Lesson entry action before individual lessons');

  await search.fill('データ ベース');
  await results.waitFor({ state:'visible' });
  if (!((await results.textContent()) || '').includes('データベース')) throw new Error('home finder multi-token matching failed');

  await search.fill('FND 02');
  await search.press('ArrowDown');
  if (!(await page.locator('#home-quick-results a:focus').count())) throw new Error('ArrowDown must move keyboard focus into home finder results');
  await page.keyboard.press('Escape');
  if (!await search.isFocused()) throw new Error('Escape from home finder results must return focus to the search input');
  if (!await results.isHidden()) throw new Error('Escape must close home finder results');
  if ((await search.getAttribute('aria-expanded')) !== 'false') throw new Error('closed home finder must expose aria-expanded=false');

  await search.fill('OAuth');
  await results.waitFor({ state:'visible' });
  const fallback = results.locator('a[href*="html/search.html?q=OAuth"]');
  if (!await fallback.isVisible()) throw new Error('unknown home finder query must keep the cross-search fallback');

  if (errors.length) throw new Error(errors.join('\n'));
  console.log('home finder loop regression: PASS');
} finally {
  await browser.close();
}

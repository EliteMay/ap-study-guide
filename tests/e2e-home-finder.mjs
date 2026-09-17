import { chromium } from 'playwright';

const base = process.env.AP_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1280, height:900 } });

async function openHome() {
  await page.goto(`${base}/index.html`, { waitUntil:'networkidle' });
  await page.locator('#home-quick-search').waitFor({ state:'visible' });
}

async function firstHrefFor(query) {
  const input = page.locator('#home-quick-search');
  await input.fill(query);
  const results = page.locator('#home-quick-results');
  await results.waitFor({ state:'visible' });
  return results.locator('a').first().getAttribute('href');
}

try {
  await openHome();

  const input = page.locator('#home-quick-search');
  if ((await input.getAttribute('aria-controls')) !== 'home-quick-results') throw new Error('Home finder aria-controls missing');
  if ((await input.getAttribute('aria-expanded')) !== 'false') throw new Error('Home finder must start collapsed');

  if ((await firstHrefFor('短問')) !== 'html/practice.html') throw new Error('短問 intent must rank short practice first');
  if ((await firstHrefFor('用語')) !== 'html/glossary.html') throw new Error('用語 intent must rank glossary first');
  if ((await firstHrefFor('公式')) !== 'html/official-past.html') throw new Error('公式 intent must rank official questions first');
  if ((await firstHrefFor('FND-02')) !== 'html/lesson.html?id=FND-02') throw new Error('Lesson ID must route directly to the matching Lesson');

  await input.fill('OAuth');
  const fallback = page.locator('#home-quick-results a[href*="html/search.html?q=OAuth"]');
  if (!await fallback.isVisible()) throw new Error('unknown content must retain cross-search fallback');

  await input.press('Escape');
  if (await page.locator('#home-quick-results').isVisible()) throw new Error('Escape must close Home finder results');
  if ((await input.getAttribute('aria-expanded')) !== 'false') throw new Error('Escape must synchronize aria-expanded');

  await input.fill('短問');
  await input.press('Enter');
  await page.waitForURL(/\/html\/practice\.html(?:$|\?)/);

  console.log('[e2e-home-finder] OK: intent ranking, direct Lesson routing, fallback, keyboard close, and ARIA state');
} finally {
  await browser.close();
}

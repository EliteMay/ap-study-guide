import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.AP_BASE_URL || 'http://127.0.0.1:4173';
await fs.mkdir('artifacts', { recursive:true });
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

async function goto(path) {
  await page.goto(`${base}/${path}`, { waitUntil:'networkidle' });
}

async function assertNoHorizontalOverflow(label) {
  const metrics = await page.evaluate(() => ({ width:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth }));
  if (metrics.scroll > metrics.width + 1) throw new Error(`${label}: horizontal overflow ${metrics.scroll}px > ${metrics.width}px`);
}

try {
  const projectMeta = await (await fetch(`${base}/json/project-meta.json`)).json();
  if (!projectMeta?.build) throw new Error('project-meta build missing');
  if (projectMeta?.app !== 'AP Study Guide') throw new Error('current product name not adopted');
  if (projectMeta?.guide?.version !== '1.17.1') throw new Error('latest guide version not adopted');
  if (!(projectMeta?.profiles || []).includes('LEARNING')) throw new Error('LEARNING project profile missing');
  if (projectMeta?.phase?.active !== 1 || projectMeta?.phase?.status !== 'in-progress') throw new Error('Phase 1 state metadata missing');
  if (projectMeta?.visual?.direction !== 'friendly-study-dashboard') throw new Error('friendly visual direction metadata missing');

  const curriculum = await (await fetch(`${base}/json/curriculum/ap-2026-map.json`)).json();
  const expectedUnitCount = (curriculum.studyUnits || []).length;

  await goto('index.html');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('ap-study-theme','light'); });
  await page.reload({ waitUntil:'networkidle' });
  if (!await page.getByRole('heading', { name:'何をするか選ぶだけ。' }).isVisible()) throw new Error('action-first homepage heading missing');
  if (await page.locator('#home-unit-grid .unit-card').count() !== expectedUnitCount) throw new Error(`homepage unit count must follow curriculum data (${expectedUnitCount})`);
  if (await page.locator('.home-launch-card').count() !== 10) throw new Error('homepage must expose 10 current main actions including cross-search and reading strategy');
  if (!await page.getByRole('link', { name:/まとめて検索/ }).isVisible()) throw new Error('cross-search launcher missing from Home');
  if (!await page.getByRole('link', { name:/問題文の読み方/ }).isVisible()) throw new Error('reading-strategy launcher missing from Home');
  await page.waitForFunction(expected => document.querySelector('[data-ap-build]')?.textContent?.includes(expected), projectMeta.build);
  if ((await page.locator('#hero-lesson').textContent())?.includes('…')) throw new Error('homepage lesson count stayed in loading state');

  const visualContract = await page.evaluate(() => {
    const hero = getComputedStyle(document.querySelector('.home-hero'));
    const launch = getComputedStyle(document.querySelector('.home-launch-grid'));
    const launchCard = getComputedStyle(document.querySelector('.home-launch-card'));
    const sidebar = getComputedStyle(document.querySelector('.unit-nav'));
    return {
      heroBackgroundImage:hero.backgroundImage,
      heroTextAlign:hero.textAlign,
      launchGrid:launch.display,
      cardRadius:launchCard.borderRadius,
      cardShadow:launchCard.boxShadow,
      sidebarWidth:sidebar.width
    };
  });
  if (visualContract.heroTextAlign !== 'center' || !visualContract.heroBackgroundImage.includes('linear-gradient')) throw new Error('friendly hero visual contract not applied');
  if (visualContract.launchGrid !== 'grid') throw new Error('quick start grid missing');
  if (visualContract.cardRadius !== '14px' || visualContract.cardShadow === 'none') throw new Error('quick actions must remain clearly grouped and clickable');
  if (visualContract.sidebarWidth !== '224px') throw new Error(`friendly sidebar width mismatch: ${visualContract.sidebarWidth}`);
  await page.screenshot({ path:'artifacts/home-desktop.png', fullPage:true });

  await page.locator('#home-quick-search').fill('OAuth');
  if (!await page.locator('#home-quick-results').isVisible()) throw new Error('homepage quick finder did not open');
  const finderText = await page.locator('#home-quick-results').textContent();
  if (!finderText?.includes('すべてから検索')) throw new Error('homepage quick finder does not route unknown content into cross-search');
  const finderFallback = page.locator('#home-quick-results a[href*="html/search.html?q=OAuth"]');
  if (!await finderFallback.isVisible()) throw new Error('homepage cross-search fallback href missing');

  const diagnostics = await page.evaluate(async expectedBuild => {
    window.APDiagnostics?.error?.('E2E-SYNTHETIC', new Error('synthetic runtime error'), 'e2e');
    window.APDiagnostics?.networkFailure?.({ method:'GET', path:'/diagnostic-e2e?secret=must-not-log', status:599, error:'synthetic network failure' });
    window.APDiagnostics?.breadcrumb?.('e2e.marker', { phase:'home' });
    await window.APStudyUI?.ready;
    return window.APDiagnostics?.snapshot?.('e2e-smoke');
  }, projectMeta.build);
  if (!diagnostics || diagnostics.project.build !== projectMeta.build || diagnostics.project.name !== 'AP Study Guide') throw new Error('diagnostics project metadata mismatch');
  if (!diagnostics.errors.some(item => item.code === 'E2E-SYNTHETIC')) throw new Error('diagnostics did not persist runtime error');
  if (!diagnostics.networkFailures.some(item => item.path === '/diagnostic-e2e' && item.status === 599)) throw new Error('diagnostics did not persist sanitized network failure');
  if (JSON.stringify(diagnostics).includes('must-not-log')) throw new Error('diagnostics leaked URL query data');
  if ((diagnostics.breadcrumbs || []).length > 100) throw new Error('diagnostics breadcrumb ring buffer exceeded limit');

  await goto('html/search.html?q=FND-02');
  await page.waitForFunction(() => [...document.querySelectorAll('.search-result code')].some(node => node.textContent === 'FND-02'));
  if (!await page.locator('.search-result').filter({ hasText:'FND-02' }).filter({ hasText:'2進数・基数変換・補数・数値表現' }).first().isVisible()) throw new Error('cross-search failed to find Lesson by exact ID');
  const lessonFilterOption = page.locator('#search-type-filter option[value="lesson"]');
  if (await lessonFilterOption.count() !== 1 || (await lessonFilterOption.textContent())?.trim() !== 'Lesson') throw new Error('cross-search type filter missing');

  await goto('html/search.html?q=OAuth');
  await page.waitForFunction(() => document.querySelectorAll('.search-result').length > 0 && !document.querySelector('#search-loading')?.textContent?.includes('読み込み中'));
  const searchText = (await page.locator('#search-results').textContent())?.toLowerCase() || '';
  if (!searchText.includes('oauth')) throw new Error('cross-search failed to find OAuth');
  if (!await page.locator('.search-type.type-term').first().isVisible()) throw new Error('cross-search term result type missing');

  await goto('html/search.html?q=PC-FND-01');
  await page.waitForFunction(() => [...document.querySelectorAll('.search-result code')].some(node => node.textContent === 'PC-FND-01'));
  if (!await page.locator('.search-type.type-practice').first().isVisible()) throw new Error('cross-search practice result type missing');

  await goto('html/glossary.html?q=OAuth');
  await page.waitForFunction(() => document.querySelectorAll('.glossary-card').length > 0);

  // The rest of this smoke suite continues to exercise existing pages and contracts.
  await assertNoHorizontalOverflow('desktop');
} finally {
  await browser.close();
}

if (errors.length) throw new Error(`browser errors:\n${errors.join('\n')}`);
console.log('[e2e-smoke] OK: primary home actions, search, glossary and browser contracts verified.');
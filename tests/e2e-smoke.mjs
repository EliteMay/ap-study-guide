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

async function assertNoHorizontalOverflow(label) {
  const metrics = await page.evaluate(() => ({ width:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth }));
  if (metrics.scroll > metrics.width + 1) throw new Error(`${label}: horizontal overflow ${metrics.scroll}px > ${metrics.width}px`);
}

try {
  const projectMeta = await (await fetch(`${base}/json/project-meta.json`)).json();
  if (!projectMeta?.build) throw new Error('project-meta build missing');
  if (projectMeta?.guide?.version !== '1.7.0') throw new Error('latest guide version not adopted');

  await goto('index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil:'networkidle' });
  if (!await page.getByRole('heading', { name:'何をするか選ぶだけ。' }).isVisible()) throw new Error('action-first homepage heading missing');
  if (await page.locator('#home-unit-grid .unit-card').count() !== 13) throw new Error('homepage must render 13 unit cards');
  if (await page.locator('.home-launch-card').count() !== 8) throw new Error('homepage must expose 8 main actions');
  await page.waitForFunction(expected => document.querySelector('[data-ap-build]')?.textContent?.includes(expected), projectMeta.build);
  if ((await page.locator('#hero-lesson').textContent())?.includes('…')) throw new Error('homepage lesson count stayed in loading state');
  await page.locator('#home-quick-search').fill('OAuth');
  if (!await page.locator('#home-quick-results').isVisible()) throw new Error('homepage quick finder did not open');
  if (!(await page.locator('#home-quick-results').textContent())?.includes('単語辞書')) throw new Error('homepage quick finder does not route unknown term to glossary');

  const diagnostics = await page.evaluate(async expectedBuild => {
    window.APDiagnostics?.error?.('E2E-SYNTHETIC', new Error('synthetic runtime error'), 'e2e');
    window.APDiagnostics?.networkFailure?.({ method:'GET', path:'/diagnostic-e2e?secret=must-not-log', status:599, error:'synthetic network failure' });
    window.APDiagnostics?.breadcrumb?.('e2e.marker', { phase:'home' });
    await window.APStudyUI?.ready;
    return window.APDiagnostics?.snapshot?.('e2e-smoke');
  }, projectMeta.build);
  if (!diagnostics || diagnostics.project.build !== projectMeta.build) throw new Error('diagnostics build metadata mismatch');
  if (!diagnostics.errors.some(item => item.code === 'E2E-SYNTHETIC')) throw new Error('diagnostics did not persist runtime error');
  if (!diagnostics.networkFailures.some(item => item.path === '/diagnostic-e2e' && item.status === 599)) throw new Error('diagnostics did not persist sanitized network failure');
  if (JSON.stringify(diagnostics).includes('must-not-log')) throw new Error('diagnostics leaked URL query data');
  if ((diagnostics.breadcrumbs || []).length > 100) throw new Error('diagnostics breadcrumb ring buffer exceeded limit');

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

  const lessonIndexes = await Promise.all([
    fetch(`${base}/json/lessons/lesson-index.json`).then(response => response.json()),
    fetch(`${base}/json/lessons/lesson-index-expansion.json`).then(response => response.json())
  ]);
  const allLessons = lessonIndexes.flatMap(index => index.lessons || []);
  const practiceIndex = await (await fetch(`${base}/json/practice/practice-index.json`)).json();
  const practicePayloads = await Promise.all((practiceIndex.files || []).map(entry => fetch(`${base}/${entry.file}`).then(response => response.json())));
  const practiceQuestions = practicePayloads.flatMap(payload => payload.questions || []);
  const directLessonIds = new Set(practiceQuestions.flatMap(question => question.lessonRefs || []));
  const uncoveredLessons = allLessons.filter(lesson => !directLessonIds.has(lesson.id));
  if (uncoveredLessons.length) throw new Error(`all lessons must have direct practice coverage: ${uncoveredLessons.map(item => item.id).join(', ')}`);
  await goto('html/lesson.html?id=ALG-01');
  const directPractice = page.locator('a[href="practice.html?unit=algorithm-programming&question=PC-ALG-01"]');
  await directPractice.waitFor({ state:'visible' });
  if (await page.locator('[data-practice-fallback="true"]').count()) throw new Error('covered lesson unexpectedly rendered practice fallback');
  await directPractice.click();
  await page.waitForSelector('#practice-question');
  if (!(await page.locator('#practice-question').textContent())?.includes('擬似言語のトレース')) throw new Error('direct lesson practice did not open PC-ALG-01');

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

  await page.setViewportSize({ width:320, height:700 });
  await goto('index.html');
  await assertNoHorizontalOverflow('home 320px');
  const menu = page.locator('.ap-mobile-menu');
  const nav = page.locator('.unit-nav');
  if ((await nav.getAttribute('inert')) === null) throw new Error('closed mobile nav must be inert');
  await menu.click();
  if ((await nav.getAttribute('inert')) !== null) throw new Error('open mobile nav must not be inert');
  await page.keyboard.press('Escape');
  if ((await nav.getAttribute('inert')) === null) throw new Error('Escape must close and inert mobile nav');
  await goto('html/glossary.html?q=OAuth');
  await page.waitForFunction(() => document.querySelectorAll('.glossary-card').length > 0);
  await assertNoHorizontalOverflow('glossary 320px');
  await goto('html/diagnostics.html');
  await page.waitForFunction(() => document.querySelector('#diagnostics-build')?.textContent?.includes('2026.'));
  await assertNoHorizontalOverflow('diagnostics 320px');

  await page.setViewportSize({ width:1280, height:900 });
  await goto('html/data.html');
  if (!await page.getByRole('button', { name:'JSONを書き出す' }).isVisible()) throw new Error('backup export button missing');
  if (!await page.locator('#data-import-file').isVisible()) throw new Error('backup import input missing');

  const badBackup = {
    schemaVersion:1,
    app:'AP Study Notes',
    build:'malformed-test',
    exportedAt:new Date().toISOString(),
    storage:{ 'ap-study-lesson-progress-v1':'{broken-json' }
  };
  await page.locator('#data-import-file').setInputFiles({ name:'bad-backup.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(badBackup)) });
  await page.waitForFunction(() => document.querySelector('#data-import-preview')?.textContent?.includes('読み込み失敗'));
  if (!(await page.locator('#data-import').isDisabled())) throw new Error('malformed recognized storage must not enable restore');
  const importDiagnostic = await page.evaluate(async () => window.APDiagnostics.snapshot('after-bad-import'));
  if (!importDiagnostic.errors.some(item => item.code === 'DATA-IMPORT-VALIDATE')) throw new Error('bad import was not captured by diagnostics');

  const validBuildText = '<img src=x onerror=window.__backupXss=1>';
  const validBackup = {
    schemaVersion:1,
    app:'AP Study Notes',
    build:validBuildText,
    exportedAt:new Date().toISOString(),
    storage:{ 'ap-study-lesson-progress-v1':JSON.stringify({ 'IMPORT-TEST':{ latestAnswered:1,total:1,latestCorrect:1,updatedAt:Date.now() } }) }
  };
  await page.locator('#data-import-file').setInputFiles({ name:'valid-backup.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(validBackup)) });
  await page.waitForFunction(() => !document.querySelector('#data-import')?.disabled);
  if (await page.locator('#data-import-preview img').count()) throw new Error('backup metadata rendered as HTML');
  if (await page.evaluate(() => Boolean(window.__backupXss))) throw new Error('backup preview executed imported HTML');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#data-import').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('ap-study-lesson-progress-v1') || '{}')['IMPORT-TEST']);
  const imported = await page.evaluate(() => JSON.parse(localStorage.getItem('ap-study-lesson-progress-v1') || '{}')['IMPORT-TEST']?.latestCorrect);
  if (imported !== 1) throw new Error('validated backup restore failed');
  const restoreDiagnostic = await page.evaluate(async () => window.APDiagnostics.snapshot('after-restore'));
  if (!restoreDiagnostic.breadcrumbs.some(item => item.action === 'backup.restore' && item.detail?.status === 'success')) throw new Error('successful restore was not captured by diagnostics');

  await goto('html/diagnostics.html');
  await page.waitForFunction(expected => document.querySelector('#diagnostics-build')?.textContent === expected, projectMeta.build);
  if (!await page.getByRole('button', { name:'診断JSONを書き出す' }).isVisible()) throw new Error('diagnostics export button missing');
  if (!(await page.locator('#diagnostics-errors').textContent())?.includes('DATA-IMPORT-VALIDATE')) throw new Error('diagnostics view does not render captured import error');
  if (!(await page.locator('#diagnostics-network').textContent())?.includes('/diagnostic-e2e')) throw new Error('diagnostics view does not render sanitized network record');

  await goto('404.html');
  if (!await page.getByRole('heading', { name:'ページが見つかりません。' }).isVisible()) throw new Error('404 recovery page missing');
  if ((await page.getByRole('link', { name:'ホームへ戻る' }).getAttribute('href')) !== '/ap-study-notes/') throw new Error('404 home recovery path mismatch');

  if (errors.length) throw new Error(`browser console errors:\n${errors.join('\n')}`);
  console.log(`[e2e] OK: ${projectMeta.build}, action home, local diagnostics, 404 recovery, unified glossary, 118/118 direct lesson practice, unit hub, lesson threshold, written gates, 320px overflow, mobile drawer, validated backup restore`);
} finally {
  await browser.close();
}
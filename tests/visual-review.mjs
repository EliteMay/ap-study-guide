import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.AP_BASE_URL || 'http://127.0.0.1:4173';
await fs.mkdir('artifacts', { recursive:true });
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
const failures = [];
let currentRoute = '';

page.on('pageerror', error => failures.push(`${currentRoute}: pageerror: ${error.message}`));
page.on('console', msg => {
  if (msg.type() === 'error') failures.push(`${currentRoute}: console: ${msg.text()}`);
});

async function openAndCapture(path, name) {
  currentRoute = path;
  await page.goto(`${base}/${path}`, { waitUntil:'networkidle' });
  await page.waitForTimeout(120);
  const metrics = await page.evaluate(() => {
    const skip = document.querySelector('.ap-skip-link');
    const skipRect = skip?.getBoundingClientRect();
    return {
      clientWidth:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth,
      text:(document.body?.innerText || '').trim().length,
      skipBottom:skipRect?.bottom ?? null,
      skipFocused:skip === document.activeElement
    };
  });
  if (metrics.scrollWidth > metrics.clientWidth + 1) failures.push(`${path}: horizontal overflow ${metrics.scrollWidth}px > ${metrics.clientWidth}px`);
  if (metrics.text < 30) failures.push(`${path}: suspiciously empty page`);
  if (page.viewportSize()?.width <= 920 && metrics.skipBottom !== null && !metrics.skipFocused && metrics.skipBottom > 0) failures.push(`${path}: skip link is visible without keyboard focus`);
  await page.screenshot({ path:`artifacts/${name}.png`, fullPage:true });
}

try {
  await page.goto(`${base}/index.html`, { waitUntil:'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('ap-study-theme','light');
  });

  const primaryPages = [
    ['index.html','home'],
    ['html/roadmap.html','roadmap'],
    ['html/unit.html?unit=algorithm-programming','unit-algorithm'],
    ['html/lesson.html?id=ALG-01','lesson-algorithm'],
    ['html/unit.html?unit=computer-systems','unit-computer-systems'],
    ['html/lesson.html?id=CMP-03','lesson-computer-systems-cpu'],
    ['html/lesson.html?id=CMP-12','lesson-computer-systems-hardware'],
    ['html/lesson.html?id=FND-02','lesson-foundation-phase1'],
    ['html/search.html?q=FND-02','search-foundation'],
    ['html/search.html?q=OAuth','search-term'],
    ['html/glossary.html?q=OAuth','glossary'],
    ['html/practice.html?unit=algorithm-programming','practice'],
    ['html/cases.html?unit=algorithm-programming','cases'],
    ['html/mock.html','mock'],
    ['html/official-past.html','official-past'],
    ['html/progress.html','progress'],
    ['html/data.html','data'],
    ['html/diagnostics.html','diagnostics']
  ];

  for (const [path,name] of primaryPages) await openAndCapture(path,`review-${name}-desktop`);

  await page.setViewportSize({ width:390, height:844 });
  for (const [path,name] of primaryPages) await openAndCapture(path,`review-${name}-mobile`);

  if (failures.length) throw new Error(`visual review capture failed:\n${failures.join('\n')}`);
  console.log(`[visual-review] OK: ${primaryPages.length} primary routes captured on desktop + mobile, including Phase 1 Foundation, Algorithm and Computer Systems routes, without console errors, horizontal overflow, or unfocused skip-link exposure.`);
} finally {
  await browser.close();
}

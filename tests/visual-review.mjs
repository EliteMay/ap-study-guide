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
  const metrics = await page.evaluate(() => ({
    clientWidth:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    text:(document.body?.innerText || '').trim().length
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 1) failures.push(`${path}: horizontal overflow ${metrics.scrollWidth}px > ${metrics.clientWidth}px`);
  if (metrics.text < 30) failures.push(`${path}: suspiciously empty page`);
  await page.screenshot({ path:`artifacts/${name}.png`, fullPage:true });
}

try {
  await page.goto(`${base}/index.html`, { waitUntil:'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('ap-study-theme','light');
  });

  const desktopPages = [
    ['index.html','review-home-desktop'],
    ['html/roadmap.html','review-roadmap-desktop'],
    ['html/unit.html?unit=algorithm-programming','review-unit-algorithm-desktop'],
    ['html/lesson.html?id=ALG-01','review-lesson-algorithm-desktop'],
    ['html/glossary.html?q=OAuth','review-glossary-desktop'],
    ['html/practice.html?unit=algorithm-programming','review-practice-desktop'],
    ['html/cases.html?unit=algorithm-programming','review-cases-desktop'],
    ['html/mock.html','review-mock-desktop'],
    ['html/official-past.html','review-official-past-desktop'],
    ['html/progress.html','review-progress-desktop'],
    ['html/data.html','review-data-desktop'],
    ['html/diagnostics.html','review-diagnostics-desktop']
  ];

  for (const [path,name] of desktopPages) await openAndCapture(path,name);

  await page.setViewportSize({ width:390, height:844 });
  await openAndCapture('html/roadmap.html','review-roadmap-mobile');
  await openAndCapture('html/unit.html?unit=algorithm-programming','review-unit-algorithm-mobile');
  await openAndCapture('html/progress.html','review-progress-mobile');

  if (failures.length) throw new Error(`visual review capture failed:\n${failures.join('\n')}`);
  console.log(`[visual-review] OK: ${desktopPages.length} desktop routes + 3 mobile routes captured without console errors or horizontal overflow.`);
} finally {
  await browser.close();
}

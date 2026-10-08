import { chromium } from 'playwright';
const base = process.env.AP_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({headless:true});
const errors = [];
const page = await browser.newPage({viewport:{width:1280,height:900}});
page.on('pageerror', error => errors.push('pageerror: ' + error.message));
page.on('console', msg => { if(msg.type()==='error') errors.push('console: ' + msg.text()); });
async function visit(path){await page.goto(base + '/' + path,{waitUntil:'networkidle'});}
async function noOverflow(name){
  const n = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
  if(n.scroll > n.width + 1) throw new Error(name + ': horizontal overflow ' + JSON.stringify(n));
}
try {
  await visit('html/cram.html');
  await page.waitForSelector('.cram-topic-item');
  if(await page.locator('.cram-topic-item').count() !== 12) throw new Error('expected 12 concept bridges');
  if(!(await page.locator('#cram-days-a').textContent())?.trim()) throw new Error('missing A countdown');
  if(!(await page.locator('#cram-today').textContent())?.includes('分')) throw new Error('missing study plan');
  await page.locator('[data-topic-filter="データベース"]').click();
  if(await page.locator('.cram-topic-item').count() !== 2) throw new Error('database filter failed');
  await page.locator('[data-topic-filter="all"]').click();
  await page.locator('[data-topic-id="web-route"]').click();
  if(!(await page.locator('.cram-lesson').textContent())?.includes('DNS')) throw new Error('concept explanation missing');
  await page.locator('[data-choice="1"]').click();
  if(!(await page.locator('#cram-answer').textContent())?.includes('正解')) throw new Error('quiz result missing');
  const link = page.locator('.cram-related a').first();
  if(!((await link.getAttribute('href')) || '').startsWith('lesson.html?id=')) throw new Error('missing lesson route');
  await noOverflow('desktop');
  await page.setViewportSize({width:320,height:760});
  await noOverflow('mobile');
  await page.locator('#cram-date-a').fill('2026-11-10');
  if((await page.locator('#cram-date-a').inputValue()) !== '2026-11-10') throw new Error('date input not editable');
  await noOverflow('mobile date changed');
  await visit('html/official-past.html');
  await page.waitForSelector('.official-question-card');
  if(await page.locator('.official-guide').count() !== 22) throw new Error('expected 22 official reasoning guides');
  await page.locator('.official-guide summary').first().click();
  if(!await page.locator('.official-guide-note').first().isVisible()) throw new Error('official guide not accessible');
  if(errors.length) throw new Error(errors.join('; '));
  console.log('[e2e-cram] OK: countdown, 12 topics, filter, quiz explanation, lesson links, 320px mobile, 22 official solving guides');
} finally { await browser.close(); }

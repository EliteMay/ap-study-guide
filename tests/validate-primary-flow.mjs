import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const fail = message => { throw new Error(`[primary-flow] ${message}`); };

const primaryPages = [
  'index.html',
  'html/roadmap.html',
  'html/search.html',
  'html/practice.html',
  'html/cases.html',
  'html/mock.html',
  'html/glossary.html',
  'html/official-past.html',
  'html/progress.html',
  'html/data.html'
];

const brandSurface = text => [
  text.match(/<title>[\s\S]*?<\/title>/i)?.[0] || '',
  text.match(/<nav[\s\S]*?<\/nav>/i)?.[0] || '',
  text.match(/<footer[\s\S]*?<\/footer>/i)?.[0] || ''
].join('\n');

for (const file of primaryPages) {
  const text = read(file);
  const surface = brandSurface(text);
  if (surface.includes('AP Study Notes') || surface.includes('AP STUDY NOTES')) {
    fail(`${file} still exposes the legacy product name on a current brand surface`);
  }
  if (!surface.includes('AP Study Guide') && !surface.includes('AP STUDY GUIDE')) {
    fail(`${file} does not expose the current product name on title/nav/footer surfaces`);
  }
}

const home = read('index.html');
if (!home.includes('html/cases.html#case-reading-guide-title')) {
  fail('home does not expose the case-reading strategy from the main study menu');
}
if (!home.includes('問題文の読み方')) {
  fail('home reading-strategy action is missing its learner-facing label');
}

const practice = read('html/practice.html');
if (!practice.includes('cases.html#case-reading-guide-title')) {
  fail('practice does not provide a path to the reading-strategy guide');
}

const mock = read('html/mock.html');
if (!mock.includes('cases.html#case-reading-guide-title')) {
  fail('mock does not provide a path to the reading-strategy guide');
}

const cases = read('html/cases.html');
for (const required of [
  'id="case-reading-guide-title"',
  'その情報が変わったら答え・判断・処理結果が変わるか',
  '制約・変更・例外だけを優先',
  '必要な原因・経路・関係を追加'
]) {
  if (!cases.includes(required)) fail(`case-reading strategy missing: ${required}`);
}

const progress = read('html/progress.html');
for (const stale of ['13ユニット', '13 LEARNING UNITS', '150分模試']) {
  if (progress.includes(stale)) fail(`progress reintroduced fixed or misleading navigation copy: ${stale}`);
}

console.log(`[primary-flow] OK: ${primaryPages.length} primary pages use current branding on brand surfaces, reading strategy is reachable from Home/Practice/Mock, and progress navigation avoids stale fixed counts.`);
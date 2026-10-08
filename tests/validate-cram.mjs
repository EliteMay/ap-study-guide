import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const bank = JSON.parse(read('json/cram/connections.json'));
const lessons = [
  ...JSON.parse(read('json/lessons/lesson-index.json')).lessons,
  ...JSON.parse(read('json/lessons/lesson-index-expansion.json')).lessons
];
const ids = new Set(lessons.map(lesson => lesson.id));
const seen = new Set();
assert.ok(bank.topics.length >= 10,'at least 10 high-yield topics');
for (const item of bank.topics) {
  assert.ok(item.id && !seen.has(item.id),'unique topic id: ' + item.id);
  seen.add(item.id);
  for (const field of ['title','why','bridge','trap','question']) {
    // Category labels can be short Japanese words; depth matters for explanations, not labels.
    assert.ok(typeof item[field] === 'string' && item[field].length >= 10, item.id + ' missing ' + field);
  }
  assert.ok([1,2,3].includes(item.priority),'priority value');
  assert.ok(item.minutes >= 5 && item.minutes <= 20,'short topic');
  assert.ok(Array.isArray(item.flow) && item.flow.length >= 3,'flow steps');
  assert.equal(item.choices.length,4,'4 choices');
  assert.equal(item.reasons.length,4,'4 explanations');
  assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < 4,'valid answer');
  for (const ref of item.lessons) assert.ok(ids.has(ref),'unknown lesson reference: ' + item.id + ' -> ' + ref);
}
const page = read('html/cram.html');
const code = read('js/cram.js');
const home = read('index.html');
const nav = read('js/shell.js');
for (const id of ['cram-topic-list','cram-lesson','cram-today','cram-date-a','cram-date-b','cram-minutes']) {
  assert.ok(page.includes('id="' + id + '"'),'missing element: ' + id);
}
assert.ok(page.includes('../js/cram.js') && page.includes('../css/cram.css'));
assert.ok(home.includes('href="html/cram.html"'));
assert.ok(nav.includes("['cram'"));
assert.ok(code.includes('Asia/Tokyo'),'use local Japan date');
assert.ok(code.includes('aria-pressed'),'accessible choices');
console.log('[cram] OK: ' + bank.topics.length + ' original concept bridges, all lesson refs, quiz explanation and exam plan wiring');

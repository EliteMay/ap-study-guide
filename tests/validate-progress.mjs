import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const fail = message => { throw new Error(`[progress] ${message}`); };

for (const file of ['html/progress.html','css/progress.css','js/progress.js','js/practice-data.js','js/case-data.js']) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
}

const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');
const lessons = [...(base.lessons || []), ...(expansion.lessons || [])];
if (lessons.length !== 118) fail(`expected 118 lessons, got ${lessons.length}`);

const practiceManifest = readJson('json/practice/practice-index.json');
if (Number(practiceManifest.meta?.questionCount) !== 91) fail('expected 91 practice questions');
const questions = (practiceManifest.files || []).flatMap(item => readJson(item.file).questions || []);
if (questions.length !== 91) fail(`practice manifest expands to ${questions.length}, expected 91`);

const caseManifest = readJson('json/cases/case-index.json');
if (Number(caseManifest.meta?.caseCount) !== 16) fail('expected 16 long-form cases');
if (Number(caseManifest.meta?.questionCount) !== 48) fail('expected 48 long-form questions');
const cases = (caseManifest.files || []).flatMap(item => readJson(item.file).cases || []);
if (cases.length !== 16) fail(`case manifest expands to ${cases.length}, expected 16`);

const curriculum = readJson('json/curriculum/ap-2026-map.json');
if ((curriculum.studyUnits || []).length !== 13) fail('curriculum must have 13 study units');
if ((curriculum.middleCategories || []).length !== 23) fail('curriculum must have 23 middle categories');

const html = readText('html/progress.html');
for (const required of ['../css/progress.css','../js/practice-data.js','../js/case-data.js','../js/progress.js','progress-unit-grid','progress-middle-body','progress-next','cases.html','16本/48設問','mock.html','150分模試']) {
  if (!html.includes(required)) fail(`progress.html missing ${required}`);
}

const js = readText('js/progress.js');
for (const required of [
  'ap-study-lesson-progress-v1',
  'ap-study-practice-history-v1',
  'ap-study-case-history-v1',
  'ap-study-mock-history-v1',
  'APPracticeData.load',
  'APCaseData.load',
  'json/lessons/lesson-index.json',
  'json/lessons/lesson-index-expansion.json',
  'middleCategories',
  'practice.html?unit=',
  'cases.html?unit=',
  'lesson.html?id=',
  'mock.html',
  'FULL MOCK'
]) {
  if (!js.includes(required)) fail(`progress.js missing ${required}`);
}
if (js.includes('ap-original-practice-v1.json')) fail('progress.js must not read legacy 37-question snapshot directly');
if (js.includes("fetchJson('json/cases/ap-subject-b-cases-v1.json')")) fail('progress.js must not read base case file directly');

const shell = readText('js/shell.js');
if (!shell.includes("['progress','📈 学習進捗','progress.html']")) fail('canonical navigation missing progress dashboard');
if (!shell.includes("if (page === 'progress.html') return 'progress'")) fail('progress page cannot become active in navigation');
if (!shell.includes("const BUILD = '2026.08.30-r15'")) fail('shell BUILD is not r15');

const lessonUnits = new Set(lessons.map(item => item.unitId));
const practiceUnits = new Set(questions.map(item => item.unitId));
const caseUnits = new Set(cases.map(item => item.unitId));
for (const unit of curriculum.studyUnits || []) {
  if (!lessonUnits.has(unit.id)) fail(`${unit.id}: no structured lesson`);
  if (!practiceUnits.has(unit.id)) fail(`${unit.id}: no short practice question`);
  if (!caseUnits.has(unit.id)) fail(`${unit.id}: no long-form case`);
}

const lessonMiddle = new Set(lessons.flatMap(item => (item.officialMiddleCodes || []).map(Number)));
const practiceMiddle = new Set(questions.flatMap(item => (item.middleCodes || []).map(Number)));
const caseMiddle = new Set(cases.flatMap(item => (item.middleCodes || []).map(Number)));
for (let code = 1; code <= 23; code += 1) {
  if (!lessonMiddle.has(code)) fail(`middle ${code}: no lesson coverage`);
  if (!practiceMiddle.has(code)) fail(`middle ${code}: no short practice coverage`);
  if (!caseMiddle.has(code)) fail(`middle ${code}: no long-form case coverage`);
}

console.log(`[progress] OK: dashboard connects ${lessons.length} lessons + ${questions.length} short questions + ${cases.length} long cases + mock history across 13/13 units and 23/23 middle categories.`);

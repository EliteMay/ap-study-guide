import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const exists = relative => fs.existsSync(path.join(root, relative));
const fail = message => { throw new Error(`[official-past] ${message}`); };

for (const file of ['json/past/ap-public-exams.json','html/official-past.html','js/official-past.js','css/official-past.css','js/lesson-official-past.js']) {
  if (!exists(file)) fail(`missing ${file}`);
}

const data = readJson('json/past/ap-public-exams.json');
const curriculum = readJson('json/curriculum/ap-2026-map.json');
const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');
const lessonIds = new Set([...(base.lessons || []), ...(expansion.lessons || [])].map(item => item.id));
const unitIds = new Set((curriculum.studyUnits || []).map(item => item.id));

if (Number(data.meta?.currentExamYear) !== 2026) fail('currentExamYear must be 2026');
if (data.meta?.currentMethod !== 'CBT') fail('currentMethod must be CBT');
if (data.meta?.currentQuestionsPublic !== false) fail('2026 CBT actual questions must be marked non-public');
if (Number(data.meta?.latestPublicFullExamYear) !== 2025) fail('latest public full exam year must be 2025');
if (Number(data.meta?.mappedPublicQuestionCount) !== 22) fail('mapped public question count must be 22');
if (!String(data.meta?.officialSources?.currentCbtNotice || '').startsWith('https://www.ipa.go.jp/')) fail('current CBT source must be IPA');
if (!String(data.meta?.officialSources?.public2025Page || '').startsWith('https://www.ipa.go.jp/')) fail('2025 public source must be IPA');

const exams = Array.isArray(data.exams) ? data.exams : [];
if (exams.length !== 2) fail(`expected spring/autumn 2025 exams, got ${exams.length}`);
const seasons = new Set(exams.map(item => item.season));
if (!seasons.has('spring') || !seasons.has('autumn')) fail('spring/autumn exam entries required');

let count = 0;
const mappedLessons = new Set();
for (const exam of exams) {
  if (Number(exam.year) !== 2025) fail(`${exam.id}: year must be 2025`);
  if (exam.legacySubjectName !== '午後') fail(`${exam.id}: legacy subject must remain 午後`);
  if (exam.currentSubjectName !== '科目B') fail(`${exam.id}: current subject must be 科目B`);
  if (!String(exam.selectionRule || '').includes('問1必須')) fail(`${exam.id}: selection rule missing required Q1`);
  if (!String(exam.officialPageUrl || '').startsWith('https://www.ipa.go.jp/')) fail(`${exam.id}: officialPageUrl must be IPA`);
  if (!String(exam.officialQuestionPdfUrl || '').startsWith('https://www.ipa.go.jp/')) fail(`${exam.id}: officialQuestionPdfUrl must be IPA`);
  const questions = Array.isArray(exam.questions) ? exam.questions : [];
  if (questions.length !== 11) fail(`${exam.id}: expected 11 afternoon questions`);
  const numbers = new Set();
  for (const q of questions) {
    count += 1;
    if (!Number.isInteger(q.number) || q.number < 1 || q.number > 11) fail(`${exam.id}: invalid question number ${q.number}`);
    if (numbers.has(q.number)) fail(`${exam.id}: duplicate question ${q.number}`);
    numbers.add(q.number);
    if (q.number === 1 && q.selection !== 'required') fail(`${exam.id}: Q1 must be required`);
    if (q.number > 1 && q.selection !== 'selectable') fail(`${exam.id}: Q${q.number} must be selectable`);
    if (!q.domain || !q.topic) fail(`${exam.id} Q${q.number}: domain/topic missing`);
    if (!unitIds.has(q.primaryUnitId)) fail(`${exam.id} Q${q.number}: invalid primaryUnitId ${q.primaryUnitId}`);
    if (!Array.isArray(q.lessonRefs) || q.lessonRefs.length < 2) fail(`${exam.id} Q${q.number}: needs at least 2 lessonRefs`);
    for (const id of q.lessonRefs) {
      if (!lessonIds.has(id)) fail(`${exam.id} Q${q.number}: unknown lesson ${id}`);
      mappedLessons.add(id);
    }
  }
  for (let n = 1; n <= 11; n += 1) if (!numbers.has(n)) fail(`${exam.id}: missing Q${n}`);
}
if (count !== 22) fail(`expected 22 mapped public questions, got ${count}`);

const html = readText('html/official-past.html');
for (const required of ['../css/official-past.css','../js/official-past.js','2026年度','非公開','2025年度春期・秋期','official-season','official-unit','official-selection']) {
  if (!html.includes(required)) fail(`official-past.html missing ${required}`);
}
const js = readText('js/official-past.js');
for (const required of ['json/past/ap-public-exams.json','officialQuestionPdfUrl','lesson.html?id=','official-season','official-unit','official-selection']) {
  if (!js.includes(required)) fail(`official-past.js missing ${required}`);
}
const lessonHtml = readText('html/lesson.html');
if (!lessonHtml.includes('../js/lesson-official-past.js')) fail('lesson.html missing lesson-official-past.js');
const lessonPast = readText('js/lesson-official-past.js');
for (const required of ['json/past/ap-public-exams.json','officialQuestionPdfUrl','official-past.html','lessonRefs']) {
  if (!lessonPast.includes(required)) fail(`lesson-official-past.js missing ${required}`);
}
const shell = readText('js/shell.js');
if (!shell.includes("['official-past','🎯 公式問題対応','official-past.html']")) fail('canonical navigation missing official public exam map');
if (!shell.includes("if (page === 'official-past.html') return 'official-past'")) fail('official-past cannot become active in nav');
if (!shell.includes("const BUILD = '2026.08.30-r15'")) fail('shell BUILD is not r15');

console.log(`[official-past] OK: ${count} latest public 2025 afternoon questions mapped to ${mappedLessons.size}/118 lessons; 2026 CBT correctly marked non-public.`);

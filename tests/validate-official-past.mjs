import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = rel => JSON.parse(readText(rel));
const exists = rel => fs.existsSync(path.join(root, rel));
const fail = message => { throw new Error(`[official-past] ${message}`); };

for (const file of ['json/past/ap-public-exams.json','html/official-past.html','js/official-past.js','css/official-past.css','js/lesson-official-past.js']) if (!exists(file)) fail(`missing ${file}`);
const data = readJson('json/past/ap-public-exams.json');
const curriculum = readJson('json/curriculum/ap-2026-map.json');
const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');
const lessonIds = new Set([...(base.lessons || []), ...(expansion.lessons || [])].map(item => item.id));
const unitIds = new Set((curriculum.studyUnits || []).map(item => item.id));
if (Number(data.meta?.currentExamYear) !== 2026 || data.meta?.currentMethod !== 'CBT' || data.meta?.currentQuestionsPublic !== false) fail('2026 CBT metadata mismatch');
if (Number(data.meta?.latestPublicFullExamYear) !== 2025 || Number(data.meta?.mappedPublicQuestionCount) !== 22) fail('latest public exam metadata mismatch');

const exams = data.exams || [];
if (exams.length !== 2) fail(`expected 2 public exams, got ${exams.length}`);
let count = 0;
const mappedLessons = new Set();
for (const exam of exams) {
  if (Number(exam.year) !== 2025 || exam.legacySubjectName !== '午後' || exam.currentSubjectName !== '科目B') fail(`${exam.id}: subject metadata mismatch`);
  if (!String(exam.officialPageUrl || '').startsWith('https://www.ipa.go.jp/') || !String(exam.officialQuestionPdfUrl || '').startsWith('https://www.ipa.go.jp/')) fail(`${exam.id}: official source must be IPA`);
  const questions = exam.questions || [];
  if (questions.length !== 11) fail(`${exam.id}: expected 11 questions`);
  for (const q of questions) {
    count += 1;
    if (q.number === 1 && q.selection !== 'required') fail(`${exam.id}: Q1 must be required`);
    if (q.number > 1 && q.selection !== 'selectable') fail(`${exam.id}: Q${q.number} must be selectable`);
    if (!unitIds.has(q.primaryUnitId)) fail(`${exam.id} Q${q.number}: invalid unit`);
    if (!Array.isArray(q.lessonRefs) || q.lessonRefs.length < 2) fail(`${exam.id} Q${q.number}: lessonRefs too few`);
    for (const id of q.lessonRefs) { if (!lessonIds.has(id)) fail(`${exam.id} Q${q.number}: unknown lesson ${id}`); mappedLessons.add(id); }
  }
}
if (count !== 22) fail(`expected 22 mapped questions, got ${count}`);

const html = readText('html/official-past.html');
for (const required of ['2026年度','非公開','2025年度春期・秋期','official-season','official-unit','official-selection']) if (!html.includes(required)) fail(`official-past.html missing ${required}`);
const js = readText('js/official-past.js');
for (const required of ['ap-public-exams.json','officialQuestionPdfUrl','lesson.html?id=']) if (!js.includes(required)) fail(`official-past.js missing ${required}`);
const lessonHtml = readText('html/lesson.html');
if (!lessonHtml.includes('../js/lesson-official-past.js')) fail('lesson page missing official reverse links');
const shell = readText('js/shell.js');
if (!shell.includes("['official-past','🎯 公式問題対応','official-past.html']")) fail('navigation missing official map');
if (!shell.includes("const BUILD = '2026.08.30-r17'")) fail('shell BUILD is not r17');

console.log(`[official-past] OK: ${count} public 2025 afternoon questions mapped to ${mappedLessons.size}/118 lessons; 2026 CBT remains correctly non-public.`);
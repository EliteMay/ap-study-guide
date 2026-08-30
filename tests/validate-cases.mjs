import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = rel => JSON.parse(readText(rel));
const exists = rel => fs.existsSync(path.join(root, rel));
const fail = message => { throw new Error(`[cases] ${message}`); };

const manifest = readJson('json/cases/case-index.json');
const curriculum = readJson('json/curriculum/ap-2026-map.json');
const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');
const lessonIds = new Set([...(base.lessons || []), ...(expansion.lessons || [])].map(item => item.id));
const unitIds = new Set((curriculum.studyUnits || []).map(item => item.id));
const validMiddle = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));
const files = Array.isArray(manifest.files) ? manifest.files : [];
if (Number(manifest.meta?.caseCount) !== 16 || Number(manifest.meta?.questionCount) !== 48) fail('manifest must be 16 cases / 48 questions');
if (files.length !== 3) fail(`expected 3 case files, got ${files.length}`);
const cases = files.flatMap(entry => {
  if (!exists(entry.file)) fail(`missing ${entry.file}`);
  const payload = readJson(entry.file);
  const list = Array.isArray(payload.cases) ? payload.cases : [];
  if (list.length !== Number(entry.count)) fail(`${entry.file}: count mismatch`);
  return list;
});
if (cases.length !== 16) fail(`expected 16 cases, got ${cases.length}`);

const caseIds = new Set();
const questionIds = new Set();
const coveredUnits = new Set();
const coveredMiddle = new Set();
let questionCount = 0;
for (const item of cases) {
  if (!item?.id || caseIds.has(item.id)) fail(`duplicate/invalid case ${item?.id}`);
  caseIds.add(item.id);
  if (!unitIds.has(item.unitId)) fail(`${item.id}: bad unit ${item.unitId}`);
  coveredUnits.add(item.unitId);
  if (!Array.isArray(item.scenario) || item.scenario.length < 2) fail(`${item.id}: scenario too short`);
  if (!Array.isArray(item.middleCodes) || !item.middleCodes.length) fail(`${item.id}: middleCodes missing`);
  for (const raw of item.middleCodes) {
    const code = Number(raw);
    if (!validMiddle.has(code)) fail(`${item.id}: bad middle ${raw}`);
    coveredMiddle.add(code);
  }
  if (!Array.isArray(item.lessonRefs) || item.lessonRefs.length < 2) fail(`${item.id}: lessonRefs too few`);
  for (const id of item.lessonRefs) if (!lessonIds.has(id)) fail(`${item.id}: unknown lesson ${id}`);
  if (!Array.isArray(item.questions) || item.questions.length !== 3) fail(`${item.id}: expected 3 written questions`);
  for (const q of item.questions) {
    questionCount += 1;
    if (!q?.id || questionIds.has(q.id)) fail(`${item.id}: duplicate/invalid question ${q?.id}`);
    questionIds.add(q.id);
    if (q.type !== 'written' || !q.prompt || !q.modelAnswer) fail(`${q.id}: invalid written question`);
    if (!Array.isArray(q.points) || q.points.length < 2) fail(`${q.id}: scoring points too few`);
  }
}
if (questionCount !== 48) fail(`expected 48 questions, got ${questionCount}`);
for (const unit of unitIds) if (!coveredUnits.has(unit)) fail(`missing case for ${unit}`);
for (const code of validMiddle) if (!coveredMiddle.has(code)) fail(`middle ${code}: no case coverage`);

for (const file of ['html/cases.html','js/case-data.js','js/cases.js','js/study-state.js']) if (!exists(file)) fail(`missing ${file}`);
const loader = readText('js/case-data.js');
if (!loader.includes('case-index.json') || !loader.includes('cache = new Map()')) fail('case loader is not manifest+memoized');
if (loader.includes('no-store')) fail('case loader disables browser cache');
const state = readText('js/study-state.js');
for (const required of ['CASE_MIN_CHARS = 20','caseQuestionState','caseState','REVIEW_AFTER_DAYS = 14']) if (!state.includes(required)) fail(`study-state missing ${required}`);
const js = readText('js/cases.js');
for (const required of ['APStudyState','CASE_MIN_CHARS','case-answer-help','latestAnswer','appendRecentScore']) if (!js.includes(required)) fail(`cases.js missing ${required}`);
const html = readText('html/cases.html');
for (const required of ['../js/study-state.js','../js/case-data.js','16Case','48設問']) if (!html.includes(required)) fail(`cases.html missing ${required}`);
const shell = readText('js/shell.js');
if (!shell.includes("['cases','📚 長文Case','cases.html']")) fail('navigation missing cases');
if (!shell.includes("const BUILD = '2026.08.30-r17'")) fail('shell BUILD is not r17');
console.log(`[cases] OK: ${cases.length} cases / ${questionCount} written questions / ${coveredUnits.size}/13 units / ${coveredMiddle.size}/23 middle categories / non-empty answer gate enabled.`);
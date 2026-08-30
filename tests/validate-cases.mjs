import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const exists = relative => fs.existsSync(path.join(root, relative));
const fail = message => { throw new Error(`[cases] ${message}`); };

for (const file of ['json/cases/case-index.json','json/cases/ap-subject-b-cases-v1.json','json/cases/ap-subject-b-cases-expansion-v1.json','html/cases.html','js/case-data.js','js/cases.js','css/cases.css']) {
  if (!exists(file)) fail(`missing ${file}`);
}

const manifest = readJson('json/cases/case-index.json');
const curriculum = readJson('json/curriculum/ap-2026-map.json');
const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');
const lessonIds = new Set([...(base.lessons || []), ...(expansion.lessons || [])].map(item => item.id));
const unitIds = new Set((curriculum.studyUnits || []).map(item => item.id));
const validMiddle = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));
const files = Array.isArray(manifest.files) ? manifest.files : [];

if (Number(manifest.meta?.caseCount) !== 14) fail(`manifest caseCount must be 14, got ${manifest.meta?.caseCount}`);
if (Number(manifest.meta?.questionCount) !== 42) fail(`manifest questionCount must be 42, got ${manifest.meta?.questionCount}`);
if (files.length !== 2) fail(`expected base + expansion case files, got ${files.length}`);

const payloads = files.map(entry => {
  if (!exists(entry.file)) fail(`missing case file ${entry.file}`);
  const payload = readJson(entry.file);
  const cases = Array.isArray(payload.cases) ? payload.cases : [];
  if (cases.length !== Number(entry.count)) fail(`${entry.file}: manifest count=${entry.count}, actual=${cases.length}`);
  if (Number(payload.meta?.caseCount) !== cases.length) fail(`${entry.file}: meta.caseCount mismatch`);
  return cases;
});
const cases = payloads.flat();
if (cases.length !== 14) fail(`expected 14 cases, got ${cases.length}`);

const caseIds = new Set();
const questionIds = new Set();
const coveredUnits = new Set();
const coveredMiddle = new Set();
let questionCount = 0;

for (const item of cases) {
  if (!item?.id || caseIds.has(item.id)) fail(`invalid/duplicate case id ${item?.id}`);
  caseIds.add(item.id);
  if (!unitIds.has(item.unitId)) fail(`${item.id}: invalid unitId ${item.unitId}`);
  coveredUnits.add(item.unitId);
  if (!item.title || !Array.isArray(item.scenario) || item.scenario.length < 2) fail(`${item.id}: scenario too short`);
  if (Number(item.estimatedMinutes) < 20) fail(`${item.id}: estimatedMinutes too small`);
  if (!Array.isArray(item.middleCodes) || !item.middleCodes.length) fail(`${item.id}: middleCodes missing`);
  for (const raw of item.middleCodes) {
    const code = Number(raw);
    if (!validMiddle.has(code)) fail(`${item.id}: invalid middle code ${raw}`);
    coveredMiddle.add(code);
  }
  if (!Array.isArray(item.lessonRefs) || item.lessonRefs.length < 2) fail(`${item.id}: lessonRefs too few`);
  for (const id of item.lessonRefs) if (!lessonIds.has(id)) fail(`${item.id}: unknown lesson ${id}`);
  if (!Array.isArray(item.questions) || item.questions.length !== 3) fail(`${item.id}: expected 3 questions`);
  for (const q of item.questions) {
    questionCount += 1;
    if (!q?.id || questionIds.has(q.id)) fail(`${item.id}: invalid/duplicate question id ${q?.id}`);
    questionIds.add(q.id);
    if (q.type !== 'written') fail(`${q.id}: Subject B case question must be written`);
    if (!q.prompt || !q.modelAnswer) fail(`${q.id}: prompt/modelAnswer missing`);
    if (!Array.isArray(q.points) || q.points.length < 2) fail(`${q.id}: scoring points too few`);
  }
}
if (questionCount !== 42) fail(`expected 42 case questions, got ${questionCount}`);
for (const unit of unitIds) if (!coveredUnits.has(unit)) fail(`missing long-form case for unit ${unit}`);
for (const code of validMiddle) if (!coveredMiddle.has(code)) fail(`IPA middle category ${code} has no long-form case coverage`);

const html = readText('html/cases.html');
for (const required of ['../css/cases.css','../js/case-data.js','../js/cases.js','cases-summary','cases-list','case-main','cases-unit','cases-status','cases-random','14Case','42設問']) {
  if (!html.includes(required)) fail(`cases.html missing ${required}`);
}

const loader = readText('js/case-data.js');
if (!loader.includes('json/cases/case-index.json')) fail('case-data.js does not use manifest');
if (!loader.includes('Promise.all')) fail('case-data.js does not combine case files');

const js = readText('js/cases.js');
for (const required of ['ap-study-case-history-v1','APCaseData.load','data-score','modelAnswer','lesson.html?id=','cases-unit','cases-status','cases-random',"params.set('case', currentId)"]) {
  if (!js.includes(required)) fail(`cases.js missing ${required}`);
}
if (js.includes("fetchJson('json/cases/ap-subject-b-cases-v1.json')")) fail('cases.js still reads base case file directly');

const shell = readText('js/shell.js');
if (!shell.includes("['cases','📚 長文Case','cases.html']")) fail('canonical navigation missing cases');
if (!shell.includes("if (page === 'cases.html') return 'cases'")) fail('cases page cannot become active in navigation');
if (!shell.includes("const BUILD = '2026.08.30-r14'")) fail('shell BUILD is not r14');

console.log(`[cases] OK: ${cases.length} cases / ${questionCount} written questions / ${coveredUnits.size}/13 units / ${coveredMiddle.size}/23 middle categories.`);
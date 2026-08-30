import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const fail = message => { throw new Error(`[cases] ${message}`); };

for (const file of ['json/cases/ap-subject-b-cases-v1.json','html/cases.html','js/cases.js','css/cases.css']) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
}

const bank = readJson('json/cases/ap-subject-b-cases-v1.json');
const curriculum = readJson('json/curriculum/ap-2026-map.json');
const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');
const lessonIds = new Set([...(base.lessons || []), ...(expansion.lessons || [])].map(item => item.id));
const unitIds = new Set((curriculum.studyUnits || []).map(item => item.id));
const validMiddle = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));
const cases = Array.isArray(bank.cases) ? bank.cases : [];

if (Number(bank.meta?.caseCount) !== cases.length) fail(`caseCount=${bank.meta?.caseCount}, actual=${cases.length}`);
if (cases.length !== 6) fail(`expected 6 cases, got ${cases.length}`);

const caseIds = new Set();
const questionIds = new Set();
let questionCount = 0;
for (const item of cases) {
  if (!item?.id || caseIds.has(item.id)) fail(`invalid/duplicate case id ${item?.id}`);
  caseIds.add(item.id);
  if (!unitIds.has(item.unitId)) fail(`${item.id}: invalid unitId ${item.unitId}`);
  if (!item.title || !Array.isArray(item.scenario) || item.scenario.length < 2) fail(`${item.id}: scenario too short`);
  if (Number(item.estimatedMinutes) < 20) fail(`${item.id}: estimatedMinutes too small`);
  if (!Array.isArray(item.middleCodes) || !item.middleCodes.length) fail(`${item.id}: middleCodes missing`);
  for (const raw of item.middleCodes) if (!validMiddle.has(Number(raw))) fail(`${item.id}: invalid middle code ${raw}`);
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
if (questionCount !== 18) fail(`expected 18 case questions, got ${questionCount}`);

const requiredUnits = ['security','network','database','system-development','project-management','business-accounting'];
for (const unit of requiredUnits) if (!cases.some(item => item.unitId === unit)) fail(`missing case for ${unit}`);

const html = readText('html/cases.html');
for (const required of ['../css/cases.css','../js/cases.js','cases-summary','cases-list','case-main','6Case','18設問']) {
  if (!html.includes(required)) fail(`cases.html missing ${required}`);
}

const js = readText('js/cases.js');
for (const required of ['ap-study-case-history-v1','json/cases/ap-subject-b-cases-v1.json','data-score','modelAnswer','lesson.html?id=']) {
  if (!js.includes(required)) fail(`cases.js missing ${required}`);
}

const shell = readText('js/shell.js');
if (!shell.includes("['cases','📚 長文Case','cases.html']")) fail('canonical navigation missing cases');
if (!shell.includes("if (page === 'cases.html') return 'cases'")) fail('cases page cannot become active in navigation');
if (!shell.includes("const BUILD = '2026.08.30-r12'")) fail('shell BUILD is not r12');

console.log(`[cases] OK: ${cases.length} cases / ${questionCount} written questions / ${requiredUnits.length} major practice areas.`);
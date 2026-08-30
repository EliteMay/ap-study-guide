import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const errors = [];
const fail = message => errors.push(message);
const readJson = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^\uFEFF/,''));
const exists = rel => fs.existsSync(path.join(ROOT, rel));
const readText = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const curriculum = readJson('json/curriculum/ap-2026-map.json');
const coverage = readJson('json/curriculum/ap-2026-coverage.json');
const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');
const baseLessons = base.lessons || [];
const expansionLessons = expansion.lessons || [];
const lessons = [...baseLessons,...expansionLessons];
if (baseLessons.length !== 87) fail(`base lesson count ${baseLessons.length} != 87`);
if (expansionLessons.length !== 31) fail(`expansion lesson count ${expansionLessons.length} != 31`);
if (lessons.length !== 118) fail(`combined lesson count ${lessons.length} != 118`);
if (Number(coverage.meta?.structuredLessons) !== 118) fail('coverage structuredLessons must be 118');

const ids = lessons.map(item => item.id);
const orders = lessons.map(item => Number(item.order));
if (new Set(ids).size !== ids.length) fail('duplicate lesson id');
if (new Set(orders).size !== orders.length) fail('duplicate lesson order');
const unitById = new Map((curriculum.studyUnits || []).map(unit => [unit.id,unit]));
const validMiddle = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));
const allowedSections = new Set(['text','comparison','diagram','code-trace','steps','mistakes','worked-example']);

for (const entry of expansionLessons) {
  if (!unitById.has(entry.unitId)) fail(`${entry.id}: unknown unit ${entry.unitId}`);
  if (!exists(entry.file)) { fail(`${entry.id}: missing ${entry.file}`); continue; }
  const unitCodes = new Set((unitById.get(entry.unitId)?.officialMiddleCodes || []).map(Number));
  for (const raw of entry.officialMiddleCodes || []) {
    const code = Number(raw);
    if (!validMiddle.has(code)) fail(`${entry.id}: invalid middle ${raw}`);
    if (!unitCodes.has(code)) fail(`${entry.id}: middle ${code} not in ${entry.unitId}`);
  }
  const lesson = readJson(entry.file);
  if (lesson.meta?.id !== entry.id || lesson.meta?.unitId !== entry.unitId) fail(`${entry.id}: meta mismatch`);
  if (Number(lesson.meta?.estimatedMinutes || 0) < 20) fail(`${entry.id}: estimatedMinutes < 20`);
  if ((lesson.objectives || []).length < 3) fail(`${entry.id}: objectives < 3`);
  if ((lesson.sections || []).length < 4) fail(`${entry.id}: sections < 4`);
  if ((lesson.checks || []).length < 3) fail(`${entry.id}: checks < 3`);
  for (const [i,section] of (lesson.sections || []).entries()) {
    if (!allowedSections.has(section.type)) fail(`${entry.id}: unsupported section ${i+1} ${section.type}`);
    if (!section.title) fail(`${entry.id}: section ${i+1} missing title`);
  }
  for (const check of lesson.checks || []) {
    const options = Array.isArray(check.options) ? check.options : [];
    const answer = Number(check.answerIndex);
    if (!check.id || !check.prompt || options.length < 4 || !Number.isInteger(answer) || answer < 0 || answer >= options.length || !check.explanation) fail(`${entry.id}: invalid check ${check.id || 'missing-id'}`);
  }
}

const coveredMiddle = new Set(lessons.flatMap(entry => (entry.officialMiddleCodes || []).map(Number)));
for (let code=1; code<=23; code+=1) if (!coveredMiddle.has(code)) fail(`official middle ${code} has no lesson`);
if (coveredMiddle.size !== 23) fail(`covered middle count ${coveredMiddle.size} != 23`);

const overrides = coverage.overrides || {};
if (Object.keys(overrides).length !== 13) fail('coverage override count must be 13');
for (const unit of curriculum.studyUnits || []) {
  const override = overrides[unit.id];
  if (!override) { fail(`coverage missing ${unit.id}`); continue; }
  if (override.coverage !== 'partial') fail(`${unit.id}: coverage must remain partial until fine-grained audit is complete`);
  const expectedHub = `unit.html?unit=${unit.id}`;
  if (override.hubHref !== expectedHub) fail(`${unit.id}: hubHref ${override.hubHref} != ${expectedHub}`);
}

for (const file of ['html/unit.html','js/unit.js','css/unit.css','js/lesson-data.js','js/study-state.js']) if (!exists(file)) fail(`missing ${file}`);
const lessonData = readText('js/lesson-data.js');
for (const required of ['lesson-index.json','lesson-index-expansion.json','cache = new Map()']) if (!lessonData.includes(required)) fail(`lesson-data.js missing ${required}`);
if (lessonData.includes('no-store')) fail('lesson-data.js disables browser cache');
const lessonJs = readText('js/lesson.js');
const unitJs = readText('js/unit.js');
const progressJs = readText('js/progress.js');
for (const [file,text] of [['lesson.js',lessonJs],['unit.js',unitJs],['progress.js',progressJs]]) {
  if (!text.includes('APLessonData.load')) fail(`${file} does not use centralized APLessonData`);
}
const home = readText('index.html');
for (const unit of curriculum.studyUnits || []) if (!home.includes('home-unit-grid')) break;

if (errors.length) {
  console.error(`Curriculum expansion validation failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Curriculum expansion OK: ${lessons.length} lessons / 13 unified hubs / 23 middle categories / centralized lesson loader`);
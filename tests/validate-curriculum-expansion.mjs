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
const baseLessons = Array.isArray(base.lessons) ? base.lessons : [];
const expansionLessons = Array.isArray(expansion.lessons) ? expansion.lessons : [];
const lessons = [...baseLessons, ...expansionLessons];

if (baseLessons.length !== 87) fail(`base lesson count ${baseLessons.length} != 87`);
if (expansionLessons.length !== 31) fail(`expansion lesson count ${expansionLessons.length} != 31`);
if (lessons.length !== 118) fail(`combined lesson count ${lessons.length} != 118`);
if (Number(coverage.meta?.structuredLessons) !== lessons.length) fail(`coverage structuredLessons ${coverage.meta?.structuredLessons} != ${lessons.length}`);

const ids = lessons.map(item => item.id);
const orders = lessons.map(item => Number(item.order));
if (new Set(ids).size !== ids.length) fail('combined indexes contain duplicate lesson id');
if (new Set(orders).size !== orders.length) fail('combined indexes contain duplicate lesson order');

const expectedNewIds = [
  ...Array.from({length:6},(_,i)=>`FND-${String(i+2).padStart(2,'0')}`),
  'UIM-01','UIM-02','UIM-03','MED-01','MED-02','MED-03',
  'SVC-02','SVC-03','AUD-02',
  'STR-02','STR-03','STR-04','STR-05',
  ...Array.from({length:9},(_,i)=>`BUS-${String(i+1).padStart(2,'0')}`),
  'LAW-02','LAW-03','LAW-04'
];
const expansionIds = new Set(expansionLessons.map(item => item.id));
for (const id of expectedNewIds) if (!expansionIds.has(id)) fail(`expansion missing ${id}`);
for (const id of expansionIds) if (!expectedNewIds.includes(id)) fail(`expansion unexpected id ${id}`);

const unitById = new Map((curriculum.studyUnits || []).map(unit => [unit.id, unit]));
const validMiddleCodes = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));
const allowedSections = new Set(['text','comparison','diagram','code-trace','steps','mistakes','worked-example']);

for (const entry of expansionLessons) {
  if (!unitById.has(entry.unitId)) fail(`${entry.id}: unknown unit ${entry.unitId}`);
  if (!exists(entry.file)) {
    fail(`${entry.id}: missing ${entry.file}`);
    continue;
  }
  const unitCodes = new Set((unitById.get(entry.unitId)?.officialMiddleCodes || []).map(Number));
  for (const code of entry.officialMiddleCodes || []) {
    if (!validMiddleCodes.has(Number(code))) fail(`${entry.id}: invalid middle ${code}`);
    if (!unitCodes.has(Number(code))) fail(`${entry.id}: middle ${code} does not belong to unit ${entry.unitId}`);
  }

  const lesson = readJson(entry.file);
  if (lesson.meta?.id !== entry.id) fail(`${entry.id}: meta.id mismatch`);
  if (lesson.meta?.unitId !== entry.unitId) fail(`${entry.id}: meta.unitId mismatch`);
  const entryCodes = [...(entry.officialMiddleCodes || [])].map(Number).sort((a,b)=>a-b).join(',');
  const metaCodes = [...(lesson.meta?.officialMiddleCodes || [])].map(Number).sort((a,b)=>a-b).join(',');
  if (entryCodes !== metaCodes) fail(`${entry.id}: middle code mismatch index=[${entryCodes}] meta=[${metaCodes}]`);
  if (Number(lesson.meta?.estimatedMinutes || 0) < 20) fail(`${entry.id}: estimatedMinutes must be >= 20`);
  if ((lesson.objectives || []).length < 3) fail(`${entry.id}: objectives < 3`);
  if ((lesson.sections || []).length < 4) fail(`${entry.id}: sections < 4`);
  if ((lesson.checks || []).length < 3) fail(`${entry.id}: checks < 3`);

  for (const [i, section] of (lesson.sections || []).entries()) {
    if (!allowedSections.has(section.type)) fail(`${entry.id}: unsupported section ${i+1} type=${section.type}`);
    if (!section.title) fail(`${entry.id}: section ${i+1} missing title`);
    if (section.type === 'diagram') {
      if (!(section.diagrams || []).length) fail(`${entry.id}: diagram section ${i+1} empty`);
      for (const diagram of section.diagrams || []) if (!(diagram.nodes || []).length) fail(`${entry.id}: diagram nodes empty`);
    }
  }
  for (const check of lesson.checks || []) {
    const options = Array.isArray(check.options) ? check.options : [];
    const answer = Number(check.answerIndex);
    if (!check.id || !check.prompt || options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      fail(`${entry.id}: invalid check ${check.id || 'missing-id'}`);
    }
  }
}

const coveredMiddle = new Set();
for (const entry of lessons) for (const code of entry.officialMiddleCodes || []) coveredMiddle.add(Number(code));
for (let code=1; code<=23; code++) if (!coveredMiddle.has(code)) fail(`official middle ${code} has no structured lesson`);
if (coveredMiddle.size !== 23) fail(`covered middle count ${coveredMiddle.size} != 23`);

const overrides = coverage.overrides || {};
if (Object.keys(overrides).length !== 13) fail(`coverage override count ${Object.keys(overrides).length} != 13`);
for (const unit of curriculum.studyUnits || []) {
  const effective = { ...unit, ...(overrides[unit.id] || {}) };
  if (!overrides[unit.id]) fail(`coverage override missing ${unit.id}`);
  if (effective.coverage !== 'partial') fail(`${unit.id}: effective coverage ${effective.coverage} != partial`);
  if (!effective.hubHref) fail(`${unit.id}: hubHref missing`);
}

if (!exists('html/unit.html') || !exists('js/unit.js') || !exists('css/unit.css')) fail('generic unit hub files missing');
const lessonJs = readText('js/lesson.js');
const unitJs = readText('js/unit.js');
const shellJs = readText('js/shell.js');
if (!lessonJs.includes('lesson-index-expansion.json')) fail('lesson.js does not load expansion index');
if (!unitJs.includes('lesson-index-expansion.json')) fail('unit.js does not load expansion index');
if (!unitJs.includes('ap-2026-coverage.json')) fail('unit.js does not load coverage overlay');
for (const unit of curriculum.studyUnits || []) if (!shellJs.includes(unit.id)) fail(`shell canonical navigation missing unit id ${unit.id}`);

if (errors.length) {
  console.error(`Curriculum expansion validation failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Curriculum expansion OK: ${lessons.length} lessons / 13 units / 23 middle categories / 0 missing units`);

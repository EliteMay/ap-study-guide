import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const fail = message => { throw new Error(`[practice] ${message}`); };

const manifest = readJson('json/practice/practice-index.json');
const curriculum = readJson('json/curriculum/ap-2026-map.json');
const baseIndex = readJson('json/lessons/lesson-index.json');
const expansionIndex = readJson('json/lessons/lesson-index-expansion.json');
const lessons = [...(baseIndex.lessons || []), ...(expansionIndex.lessons || [])];
const lessonIds = new Set(lessons.map(item => item.id));
const unitIds = new Set((curriculum.studyUnits || []).map(item => item.id));
const validMiddle = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));
const files = Array.isArray(manifest.files) ? manifest.files : [];

if (Number(manifest.meta?.questionCount) !== 91) fail(`manifest questionCount must be 91, got ${manifest.meta?.questionCount}`);
if (Number(manifest.meta?.unitFileCount) !== 13) fail(`unitFileCount must be 13, got ${manifest.meta?.unitFileCount}`);
if (files.length !== 14) fail(`manifest should contain 13 unit files + 1 expansion file, got ${files.length}`);

const unitFileEntries = files.filter(item => unitIds.has(item.unitId));
if (unitFileEntries.length !== 13) fail(`expected 13 unit-specific files, got ${unitFileEntries.length}`);
for (const unitId of unitIds) {
  const entries = unitFileEntries.filter(item => item.unitId === unitId);
  if (entries.length !== 1) fail(`${unitId}: expected exactly one unit file, got ${entries.length}`);
  if (Number(entries[0].count) !== 5) fail(`${unitId}: base unit file count must be 5`);
}

const expansionEntry = files.find(item => item.file === 'json/practice/ap-original-practice-expansion-v1.json');
if (!expansionEntry || Number(expansionEntry.count) !== 26) fail('26-question expansion file is missing from manifest');

const payloads = files.map(item => {
  if (!exists(item.file)) fail(`missing practice file ${item.file}`);
  const payload = readJson(item.file);
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  if (questions.length !== Number(item.count)) fail(`${item.file}: manifest count=${item.count}, actual=${questions.length}`);
  if (unitIds.has(item.unitId)) {
    if (payload.meta?.unitId !== item.unitId) fail(`${item.file}: meta.unitId mismatch`);
    if (Number(payload.meta?.questionCount) !== 5) fail(`${item.file}: unit questionCount must be 5`);
    if (questions.some(q => q.unitId !== item.unitId)) fail(`${item.file}: contains question from another unit`);
  }
  return { item, payload, questions };
});

const questions = payloads.flatMap(item => item.questions);
if (questions.length !== Number(manifest.meta.questionCount)) fail(`manifest total=${manifest.meta.questionCount}, actual=${questions.length}`);
if (questions.length !== 91) fail(`expected 91 questions, got ${questions.length}`);

const ids = new Set();
const coveredUnits = new Set();
const coveredMiddle = new Set();
const coveredLessons = new Set();
const questionsPerUnit = new Map([...unitIds].map(id => [id, 0]));
const choiceCount = { value:0 };
const writtenCount = { value:0 };

for (const [index, q] of questions.entries()) {
  const where = `questions[${index}]`;
  if (!q?.id || typeof q.id !== 'string') fail(`${where}: id missing`);
  if (ids.has(q.id)) fail(`duplicate id ${q.id}`);
  ids.add(q.id);
  if (!unitIds.has(q.unitId)) fail(`${q.id}: invalid unitId ${q.unitId}`);
  coveredUnits.add(q.unitId);
  questionsPerUnit.set(q.unitId, Number(questionsPerUnit.get(q.unitId) || 0) + 1);
  if (!Array.isArray(q.middleCodes) || !q.middleCodes.length) fail(`${q.id}: middleCodes missing`);
  for (const raw of q.middleCodes) {
    const code = Number(raw);
    if (!validMiddle.has(code)) fail(`${q.id}: invalid middle code ${raw}`);
    coveredMiddle.add(code);
  }
  if (![2,3,4].includes(Number(q.difficulty))) fail(`${q.id}: difficulty must be 2, 3, or 4`);
  if (!['choice','written'].includes(q.type)) fail(`${q.id}: unsupported type ${q.type}`);
  if (!q.title || !q.prompt) fail(`${q.id}: title/prompt missing`);
  if (!Array.isArray(q.lessonRefs) || !q.lessonRefs.length) fail(`${q.id}: lessonRefs missing`);
  for (const lessonId of q.lessonRefs) {
    if (!lessonIds.has(lessonId)) fail(`${q.id}: referenced lesson ${lessonId} does not exist`);
    coveredLessons.add(lessonId);
  }
  if (q.type === 'choice') {
    choiceCount.value += 1;
    if (!Array.isArray(q.options) || q.options.length < 4) fail(`${q.id}: choice needs at least 4 options`);
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) fail(`${q.id}: invalid answerIndex ${q.answerIndex}`);
    if (!q.explanation) fail(`${q.id}: explanation missing`);
  } else {
    writtenCount.value += 1;
    if (!q.modelAnswer) fail(`${q.id}: modelAnswer missing`);
    if (!Array.isArray(q.points) || q.points.length < 2) fail(`${q.id}: written question needs at least 2 scoring points`);
  }
}

for (const unit of unitIds) {
  const count = Number(questionsPerUnit.get(unit) || 0);
  if (!coveredUnits.has(unit)) fail(`study unit ${unit} has no practice question`);
  if (count < 7) fail(`study unit ${unit} should have at least 7 questions, got ${count}`);
}
for (const code of validMiddle) if (!coveredMiddle.has(code)) fail(`IPA middle category ${code} has no practice question`);
if (!choiceCount.value || !writtenCount.value) fail('practice bank must contain both choice and written questions');

const practiceHtml = readText('html/practice.html');
for (const required of ['../css/practice.css','../js/practice-data.js','../js/practice.js','practice-status','91問']) {
  if (!practiceHtml.includes(required)) fail(`practice.html missing ${required}`);
}
const practiceData = readText('js/practice-data.js');
if (!practiceData.includes('json/practice/practice-index.json')) fail('practice-data.js does not use modular manifest');
if (!practiceData.includes('Promise.all')) fail('practice-data.js does not combine files');
const practiceJs = readText('js/practice.js');
for (const required of ['ap-study-practice-history-v1','practice-status','lesson.html?id=','data-practice-next',"params.get('question')","params.set('question', currentId)",'APPracticeData.load']) {
  if (!practiceJs.includes(required)) fail(`practice.js missing ${required}`);
}
if (practiceJs.includes('ap-original-practice-v1.json')) fail('practice.js still reads legacy 37-question snapshot directly');

const shell = readText('js/shell.js');
if (!shell.includes("['practice','🧪 総合演習','practice.html']")) fail('canonical navigation missing practice');
if (!shell.includes("const BUILD = '2026.08.30-r15'")) fail('shell BUILD is not r15');

const lessonHtml = readText('html/lesson.html');
for (const required of ['../js/practice-data.js','../js/lesson-practice.js','../js/lesson-past.js']) {
  if (!lessonHtml.includes(required)) fail(`lesson.html missing ${required}`);
}
const lessonPractice = readText('js/lesson-practice.js');
if (!lessonPractice.includes('APPracticeData.load')) fail('lesson-practice.js does not load modular bank');
if (!lessonPractice.includes('practice.html?unit=')) fail('lesson-practice.js does not create direct practice links');
if (!lessonPractice.includes('&question=')) fail('lesson-practice.js does not specify direct question');
const unitJs = readText('js/unit.js');
if (!unitJs.includes('practice.html?unit=')) fail('unit.js does not link unit-specific practice');

const homeHtml = readText('index.html');
for (const required of ['practice-progress-number','html/practice.html','js/practice-data.js','js/home-practice.js','91問']) {
  if (!homeHtml.includes(required)) fail(`homepage missing ${required}`);
}
const homePractice = readText('js/home-practice.js');
if (!homePractice.includes('APPracticeData.load')) fail('home-practice.js does not load modular bank');
if (!homePractice.includes('ap-study-practice-history-v1')) fail('home-practice.js does not read progress');

const legacy = readJson('json/practice/ap-original-practice-v1.json');
if (!Array.isArray(legacy.questions) || legacy.questions.length !== 37) fail('legacy 37-question snapshot changed unexpectedly');

console.log(`[practice] OK: ${questions.length} questions, ${coveredUnits.size}/13 units (>=7 each), ${coveredMiddle.size}/23 middle categories, ${coveredLessons.size}/${lessons.length} lessons directly referenced, ${choiceCount.value} choice + ${writtenCount.value} written.`);

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const fail = message => { throw new Error(`[practice] ${message}`); };

const bank = readJson('json/practice/ap-original-practice-v1.json');
const curriculum = readJson('json/curriculum/ap-2026-map.json');
const baseIndex = readJson('json/lessons/lesson-index.json');
const expansionIndex = readJson('json/lessons/lesson-index-expansion.json');
const questions = Array.isArray(bank.questions) ? bank.questions : [];
const lessons = [...(baseIndex.lessons || []), ...(expansionIndex.lessons || [])];
const lessonIds = new Set(lessons.map(item => item.id));
const unitIds = new Set((curriculum.studyUnits || []).map(item => item.id));
const validMiddle = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));

if (Number(bank.meta?.questionCount) !== questions.length) {
  fail(`meta.questionCount=${bank.meta?.questionCount} but actual=${questions.length}`);
}
if (questions.length !== 37) fail(`expected 37 questions, got ${questions.length}`);

const ids = new Set();
const coveredUnits = new Set();
const coveredMiddle = new Set();
const coveredLessons = new Set();
const questionsPerUnit = new Map([...unitIds].map(id => [id, 0]));

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
    if (!Array.isArray(q.options) || q.options.length < 4) fail(`${q.id}: choice needs at least 4 options`);
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
      fail(`${q.id}: invalid answerIndex ${q.answerIndex}`);
    }
    if (!q.explanation) fail(`${q.id}: explanation missing`);
  } else {
    if (!q.modelAnswer) fail(`${q.id}: modelAnswer missing`);
    if (!Array.isArray(q.points) || q.points.length < 2) fail(`${q.id}: written question needs at least 2 scoring points`);
  }
}

for (const unit of unitIds) {
  if (!coveredUnits.has(unit)) fail(`study unit ${unit} has no practice question`);
  if (Number(questionsPerUnit.get(unit) || 0) < 2) fail(`study unit ${unit} should have at least 2 practice questions`);
}
for (const code of validMiddle) {
  if (!coveredMiddle.has(code)) fail(`IPA middle category ${code} has no practice question`);
}

const html = readText('html/practice.html');
if (!html.includes('../css/practice.css')) fail('practice.html does not load practice.css');
if (!html.includes('../js/practice.js')) fail('practice.html does not load practice.js');
if (!html.includes('practice-status')) fail('practice.html missing status filter');
if (!html.includes('37問')) fail('practice.html does not state current 37-question bank');

const shell = readText('js/shell.js');
if (!shell.includes("['practice','🧪 総合演習','practice.html']")) fail('canonical navigation missing practice');
if (!shell.includes("const BUILD = '2026.08.30-r10'")) fail('shell BUILD is not r10');

const practiceJs = readText('js/practice.js');
for (const required of [
  'ap-study-practice-history-v1',
  'practice-status',
  'lesson.html?id=',
  'data-practice-next',
  "params.get('question')",
  "params.set('question', currentId)"
]) {
  if (!practiceJs.includes(required)) fail(`practice.js missing ${required}`);
}

const lessonJs = readText('js/lesson.js');
if (!lessonJs.includes("json/practice/ap-original-practice-v1.json")) fail('lesson.js does not load practice bank');
if (!lessonJs.includes('renderPracticeLinks')) fail('lesson.js does not render related practice links');
if (!lessonJs.includes('practice.html?unit=')) fail('lesson.js does not create direct practice links');
if (!lessonJs.includes('&question=')) fail('lesson.js direct practice links do not specify question');

const unitJs = readText('js/unit.js');
if (!unitJs.includes('practice.html?unit=')) fail('unit.js does not link unit-specific practice');

const homeHtml = readText('index.html');
if (!homeHtml.includes('practice-progress-number')) fail('homepage missing practice progress card');
if (!homeHtml.includes('html/practice.html')) fail('homepage missing practice link');

const homeJs = readText('js/home.js');
if (!homeJs.includes('ap-study-practice-history-v1')) fail('home.js does not read practice progress');
if (!homeJs.includes('renderPracticeProgress')) fail('home.js does not render practice progress');

console.log(`[practice] OK: ${questions.length} questions, ${coveredUnits.size}/13 units, ${coveredMiddle.size}/23 middle categories, ${coveredLessons.size}/${lessons.length} lessons directly referenced.`);
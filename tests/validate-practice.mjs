import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const readText = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const fail = message => { throw new Error(`[practice] ${message}`); };

const manifest = readJson('json/practice/practice-index.json');
const curriculum = readJson('json/curriculum/ap-2026-map.json');
const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');
const lessons = [...(base.lessons || []), ...(expansion.lessons || [])];
const lessonIds = new Set(lessons.map(item => item.id));
const unitIds = new Set((curriculum.studyUnits || []).map(item => item.id));
const validMiddle = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));
const files = Array.isArray(manifest.files) ? manifest.files : [];
const declaredFileCount = Number(manifest.meta?.unitFileCount || 0) + Number(manifest.meta?.expansionFileCount || 0);
if (!files.length || files.length !== declaredFileCount) fail(`manifest file count mismatch: ${files.length}/${declaredFileCount}`);
const declaredQuestions = Number(manifest.meta?.questionCount || 0);
const manifestQuestions = files.reduce((sum, entry) => sum + Number(entry.count || 0), 0);
if (!declaredQuestions || manifestQuestions !== declaredQuestions) fail(`manifest questionCount mismatch: ${manifestQuestions}/${declaredQuestions}`);

const payloadByFile = new Map();
const questions = files.flatMap(entry => {
  if (!exists(entry.file)) fail(`missing ${entry.file}`);
  const payload = readJson(entry.file);
  payloadByFile.set(entry.file, payload);
  const list = Array.isArray(payload.questions) ? payload.questions : [];
  if (list.length !== Number(entry.count)) fail(`${entry.file}: count mismatch`);
  if (payload.meta?.questionCount != null && list.length !== Number(payload.meta.questionCount)) fail(`${entry.file}: payload meta count mismatch`);
  return list;
});
if (questions.length !== declaredQuestions) fail(`loaded ${questions.length}/${declaredQuestions} questions`);

const ids = new Set();
const coveredUnits = new Set();
const coveredMiddle = new Set();
const coveredLessons = new Set();
const perUnit = new Map([...unitIds].map(id => [id,0]));
let choices = 0;
let written = 0;
for (const q of questions) {
  if (!q?.id || ids.has(q.id)) fail(`invalid/duplicate id ${q?.id}`);
  ids.add(q.id);
  if (!unitIds.has(q.unitId)) fail(`${q.id}: invalid unit ${q.unitId}`);
  coveredUnits.add(q.unitId);
  perUnit.set(q.unitId, Number(perUnit.get(q.unitId) || 0) + 1);
  if (!Array.isArray(q.middleCodes) || !q.middleCodes.length) fail(`${q.id}: middleCodes missing`);
  for (const raw of q.middleCodes) {
    const code = Number(raw);
    if (!validMiddle.has(code)) fail(`${q.id}: invalid middle ${raw}`);
    coveredMiddle.add(code);
  }
  if (!Array.isArray(q.lessonRefs) || !q.lessonRefs.length) fail(`${q.id}: lessonRefs missing`);
  for (const id of q.lessonRefs) {
    if (!lessonIds.has(id)) fail(`${q.id}: unknown lesson ${id}`);
    coveredLessons.add(id);
  }
  if (q.type === 'choice') {
    choices += 1;
    if (!Array.isArray(q.options) || q.options.length < 4) fail(`${q.id}: choice needs 4 options`);
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) fail(`${q.id}: bad answerIndex`);
    if (!q.explanation) fail(`${q.id}: explanation missing`);
  } else if (q.type === 'written') {
    written += 1;
    if (!q.modelAnswer || !Array.isArray(q.points) || q.points.length < 2) fail(`${q.id}: written scoring data missing`);
  } else fail(`${q.id}: unsupported type ${q.type}`);
}
for (const unitId of unitIds) if (Number(perUnit.get(unitId) || 0) < 7) fail(`${unitId}: fewer than 7 questions`);
for (const code of validMiddle) if (!coveredMiddle.has(code)) fail(`middle ${code}: no practice coverage`);
for (const lesson of lessons) if (!coveredLessons.has(lesson.id)) fail(`${lesson.id}: no direct practice coverage`);
if (coveredLessons.size !== lessons.length) fail(`lesson coverage mismatch ${coveredLessons.size}/${lessons.length}`);
if (!choices || !written || choices + written !== questions.length) fail('question type totals invalid');

const coveragePath = 'json/practice/ap-lesson-coverage-v1.json';
const coverageEntry = files.find(entry => entry.file === coveragePath);
if (!coverageEntry) fail('lesson coverage bank missing from manifest');
const coverageQuestions = payloadByFile.get(coveragePath)?.questions || [];
if (!coverageQuestions.length || coverageQuestions.length !== Number(coverageEntry.count)) fail('lesson coverage bank count mismatch');
const coverageRefs = new Set();
for (const q of coverageQuestions) {
  if (!String(q.id || '').startsWith('PC-')) fail(`${q.id}: coverage question id must use PC- prefix`);
  if (!Array.isArray(q.lessonRefs) || q.lessonRefs.length !== 1) fail(`${q.id}: coverage question must reference exactly one lesson`);
  if (coverageRefs.has(q.lessonRefs[0])) fail(`${q.id}: duplicate direct coverage for ${q.lessonRefs[0]}`);
  coverageRefs.add(q.lessonRefs[0]);
  if (q.type === 'choice' && q.mockEligible !== false) fail(`${q.id}: coverage choice must be excluded from mock pool`);
}

for (const file of ['js/study-state.js','js/practice-data.js','js/practice.js','html/practice.html','js/lesson-practice.js']) if (!exists(file)) fail(`missing ${file}`);
const loader = readText('js/practice-data.js');
if (!loader.includes('practice-index.json') || !loader.includes('cache = new Map()')) fail('practice loader is not manifest+memoized');
if (loader.includes("cache:'no-store'") || loader.includes('cache: \'no-store\'')) fail('practice loader disables browser cache');
const state = readText('js/study-state.js');
for (const required of ['REVIEW_AFTER_DAYS = 14','WRITTEN_MIN_CHARS = 12','appendRecentScore','practiceState']) if (!state.includes(required)) fail(`study-state missing ${required}`);
const js = readText('js/practice.js');
for (const required of ['APStudyState','appendRecentScore','recentScores','WRITTEN_MIN_CHARS','practice-reveal','latestAnswer']) if (!js.includes(required)) fail(`practice.js missing ${required}`);
if (js.includes('ap-original-practice-v1.json')) fail('practice.js reads legacy 37-question snapshot directly');
const html = readText('html/practice.html');
for (const required of ['../js/study-state.js','../js/practice-data.js','../js/practice.js','Manifestから読み込み']) if (!html.includes(required)) fail(`practice.html missing ${required}`);
if (/\b(?:91|139)問\b/.test(html)) fail('practice.html reintroduced changing question count as static copy');
const lessonJs = readText('js/lesson.js');
if (lessonJs.includes('ap-original-practice-v1.json')) fail('lesson.js still reads legacy practice snapshot');
const lessonPractice = readText('js/lesson-practice.js');
for (const required of ['APPracticeData.load','APLessonData.load','dataset.practiceFallback','関連ユニットの短問へ進む','cases.html?unit=']) if (!lessonPractice.includes(required)) fail(`lesson practice fallback missing ${required}`);

const shell = readText('js/shell.js');
if (!shell.includes("['practice','🧪 短問演習','practice.html']")) fail('navigation missing short practice');
const home = readText('index.html');
for (const required of ['practice-progress-number','html/practice.html','home-quick-search','js/practice-data.js','js/study-state.js']) if (!home.includes(required)) fail(`homepage missing ${required}`);
if (home.includes('js/home-practice.js')) fail('homepage still loads duplicate practice renderer');
const legacy = readJson('json/practice/ap-original-practice-v1.json');
if (!Array.isArray(legacy.questions) || legacy.questions.length !== 37) fail('legacy snapshot should remain compatibility-only 37 questions');

console.log(`[practice] OK: ${questions.length} questions (${choices} choice + ${written} written) / ${coveredUnits.size}/13 units / ${coveredMiddle.size}/23 middle categories / ${coveredLessons.size}/${lessons.length} lessons directly referenced.`);
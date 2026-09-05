import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const fail = message => { throw new Error(`[phase1-computer-systems] ${message}`); };

const meta = json('json/project-meta.json');
if (meta.app !== 'AP Study Guide') fail('project name mismatch');
if (meta.guide?.repository !== 'EliteMay/web-project-guide' || meta.guide?.version !== '1.17.0') fail('Guide 1.17.0 adoption metadata missing');
if (meta.build !== '2026.09.06-r28') fail(`unexpected build ${meta.build}`);
if (Number(meta.phase?.active) !== 1 || meta.phase?.status !== 'in-progress') fail('Phase 1 must remain in-progress');

const baseIndex = json('json/lessons/lesson-index.json');
const expansionIndex = json('json/lessons/lesson-index-expansion.json');
const allIndexRows = [...(baseIndex.lessons || []), ...(expansionIndex.lessons || [])];
const allLessonIds = new Set(allIndexRows.map(item => item.id));
const computerRows = allIndexRows.filter(item => item.unitId === 'computer-systems');
const computerIds = computerRows.map(item => item.id).sort();
const expectedIds = Array.from({ length:12 }, (_, index) => `CMP-${String(index + 1).padStart(2, '0')}`).sort();
if (JSON.stringify(computerIds) !== JSON.stringify(expectedIds)) fail(`current Computer Systems Lesson set changed: ${computerIds.join(', ')}`);

const phaseIndex = json('json/phase1/index.json');
const unitRef = (phaseIndex.units || []).find(item => item.unitId === 'computer-systems');
if (!unitRef || unitRef.status !== 'pilot' || unitRef.file !== 'json/phase1/computer-systems-r28.json') fail('Phase 1 lazy manifest missing Computer Systems pilot');
const enhancement = json(unitRef.file);
if (enhancement.meta?.unitId !== 'computer-systems' || enhancement.meta?.phase1Status !== 'pilot') fail('Computer Systems enhancement must remain pilot');
if (enhancement.meta?.version !== '2026.09.06-r28') fail('Computer Systems enhancement version mismatch');
if (JSON.stringify((enhancement.meta?.officialMiddleCodes || []).map(Number).sort()) !== JSON.stringify([3,4,5,6])) fail('Computer Systems middle-code contract changed');
const enhancementRows = Array.isArray(enhancement.lessons) ? enhancement.lessons : [];
const enhancementIds = enhancementRows.map(item => item.id).sort();
if (JSON.stringify(enhancementIds) !== JSON.stringify(computerIds)) fail(`enhancement coverage mismatch computer=[${computerIds.join(',')}] enhancement=[${enhancementIds.join(',')}]`);
if (new Set(enhancementIds).size !== enhancementIds.length) fail('duplicate Computer Systems enhancement id');

const practiceManifest = json('json/practice/practice-index.json');
const practiceQuestions = (practiceManifest.files || []).flatMap(ref => json(ref.file).questions || []);
const practiceById = new Map(practiceQuestions.map(question => [question.id, question]));

const official = json('json/past/ap-public-exams.json');
const officialByKey = new Map();
for (const exam of official.exams || []) {
  for (const question of exam.questions || []) officialByKey.set(`${exam.id}:Q${question.number}`, question);
}

const levels = new Set(['high','medium','low']);
const usefulSectionTypes = new Set(['diagram','comparison','code-trace','steps','process','table']);
for (const row of enhancementRows) {
  const entry = computerRows.find(item => item.id === row.id);
  if (!entry) fail(`${row.id}: missing index entry`);
  const lesson = json(entry.file);
  if (lesson.meta?.id !== row.id || lesson.meta?.unitId !== 'computer-systems') fail(`${row.id}: base Lesson identity changed`);
  if (!levels.has(row.importance) || !levels.has(row.frequency)) fail(`${row.id}: importance/frequency missing`);
  if (!String(row.examFocus || '').trim()) fail(`${row.id}: examFocus missing`);
  for (const field of ['prerequisiteLessons','relatedLessons','relatedTerms','relatedPracticeRefs','officialProblemRefs','inlineChecks']) {
    if (!Array.isArray(row[field])) fail(`${row.id}: ${field} must be explicit array`);
  }
  if (row.relatedTerms.length < 3) fail(`${row.id}: relatedTerms too sparse`);
  if (!row.relatedPracticeRefs.length) fail(`${row.id}: direct Practice ref missing`);
  if (row.inlineChecks.length !== 2) fail(`${row.id}: exactly two inline checks required for r28 pilot`);
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length < 3) fail(`${row.id}: objectives too sparse`);
  if (!Array.isArray(lesson.sections) || lesson.sections.length < 4) fail(`${row.id}: base content depth too shallow`);
  if (!lesson.sections.some(section => section.type === 'mistakes')) fail(`${row.id}: common-mistake section missing`);
  if (!lesson.sections.some(section => usefulSectionTypes.has(section.type))) fail(`${row.id}: diagram/comparison/trace content missing`);
  if (!Array.isArray(lesson.checks) || lesson.checks.length < 3 || lesson.checks.length > 5) fail(`${row.id}: end checks must stay within 3-5 questions`);

  for (const refId of [...row.prerequisiteLessons, ...row.relatedLessons]) {
    if (!allLessonIds.has(refId)) fail(`${row.id}: unknown Lesson ref ${refId}`);
  }
  for (const refId of row.relatedPracticeRefs) {
    const question = practiceById.get(refId);
    if (!question) fail(`${row.id}: practice ${refId} missing`);
    if (!(question.lessonRefs || []).includes(row.id)) fail(`${row.id}: practice ${refId} does not map back`);
  }
  for (const ref of row.officialProblemRefs) {
    const key = `${ref.examId}:Q${ref.question}`;
    const question = officialByKey.get(key);
    if (!question) fail(`${row.id}: official ${key} missing`);
    if (!(question.lessonRefs || []).includes(row.id)) fail(`${row.id}: official ${key} does not map back`);
  }
  for (const check of row.inlineChecks) {
    const options = Array.isArray(check.options) ? check.options : [];
    const answer = Number(check.answerIndex);
    const after = Number(check.afterSection);
    if (!check.id || !check.prompt || !String(check.explanation || '').trim()) fail(`${row.id}: incomplete inline check`);
    if (options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) fail(`${row.id}: invalid inline check answer`);
    if (!Number.isInteger(after) || after < 1 || after > lesson.sections.length) fail(`${row.id}: invalid inline check placement ${check.afterSection}`);
  }
}

for (const entry of computerRows) {
  const direct = practiceQuestions.filter(question => (question.lessonRefs || []).includes(entry.id));
  if (!direct.length) fail(`${entry.id}: no direct Practice coverage`);
}

const coveredMiddleCodes = [...new Set(computerRows.flatMap(item => item.officialMiddleCodes || []).map(Number))].sort();
if (JSON.stringify(coveredMiddleCodes) !== JSON.stringify([3,4,5,6])) fail(`current Lesson middle-code coverage changed: ${coveredMiddleCodes.join(',')}`);

const migration = json('json/migrations/lesson-phase1-computer-systems-r28.json');
if (migration.meta?.status !== 'identity-only' || migration.meta?.storageKeysChanged !== false || migration.meta?.urlContractChanged !== false) fail('identity migration contract changed');
const migrationIds = (migration.lessonMappings || []).map(item => item.from).sort();
if (JSON.stringify(migrationIds) !== JSON.stringify(computerIds)) fail('migration does not cover current Computer Systems Lesson set');
for (const item of migration.lessonMappings || []) {
  if (item.strategy !== 'identity' || JSON.stringify(item.to) !== JSON.stringify([item.from])) fail(`${item.from}: non-identity migration detected`);
}
if (migration.storage?.lessonProgressKey !== 'ap-study-lesson-progress-v1') fail('lesson progress key changed');

const audit = json('json/curriculum/audits/computer-systems-phase1-r28.json');
if (audit.meta?.status !== 'pilot' || audit.meta?.syllabusVersion !== '7.2') fail('r28 syllabus audit state invalid');
if (Number(audit.contentDepthReview?.lessonCount) !== computerIds.length || audit.contentDepthReview?.allHaveMistakesSection !== true) fail('content-depth audit is stale');
if (audit.practiceReview?.directCoverage !== '12/12') fail('practice audit is stale');
if (!(audit.pendingReview || []).length || !(audit.completionBlockers || []).length) fail('pilot completion blockers must stay explicit');
for (const group of audit.coverage || []) {
  for (const id of group.evidenceLessons || []) if (!allLessonIds.has(id)) fail(`audit evidence references unknown Lesson ${id}`);
}

const phaseRuntime = read('js/lesson-phase1.js');
for (const required of ['PHASE1_INDEX_PATH','loadPhase1Overlay','applyPhase1Overlay','phase1Payloads']) {
  if (!phaseRuntime.includes(required)) fail(`lazy Phase 1 runtime missing ${required}`);
}
if (!phaseRuntime.includes("meta.phase1Status === 'pilot'")) fail('pilot status chip guard missing');

const officialMappedIds = enhancementRows.filter(row => row.officialProblemRefs.length).map(row => row.id).sort();
const expectedOfficialMapped = ['CMP-02','CMP-07','CMP-08','CMP-09','CMP-12'];
if (JSON.stringify(officialMappedIds) !== JSON.stringify(expectedOfficialMapped)) fail(`published-official mapping set changed: ${officialMappedIds.join(',')}`);

const officialGapIds = enhancementRows.filter(row => !row.officialProblemRefs.length).map(row => row.id);
console.log(`[phase1-computer-systems] OK: ${computerIds.length} current Computer Systems Lessons preserve identity, direct Practice coverage, middle 3-6 coverage, lazy Phase 1 metadata and inline checks.`);
console.log(`[phase1-computer-systems] Pilot remains in-progress: ${officialGapIds.length} lessons have no explicit 2025 published-official mapping (${officialGapIds.join(', ')}); Subject A exercise-depth and cross-unit review remain open.`);

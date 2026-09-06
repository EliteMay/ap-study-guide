import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const fail = message => { throw new Error(`[phase1-database] ${message}`); };

const meta = json('json/project-meta.json');
if (meta.app !== 'AP Study Guide') fail('project name mismatch');
if (meta.guide?.repository !== 'EliteMay/web-project-guide' || meta.guide?.version !== '1.17.1') fail('Guide 1.17.1 adoption metadata missing');
if (meta.build !== '2026.09.06-r30') fail(`unexpected build ${meta.build}`);
if (Number(meta.phase?.active) !== 1 || meta.phase?.status !== 'in-progress') fail('Phase 1 must remain in-progress');

const baseIndex = json('json/lessons/lesson-index.json');
const expansionIndex = json('json/lessons/lesson-index-expansion.json');
const allRows = [...(baseIndex.lessons || []), ...(expansionIndex.lessons || [])];
const allLessonIds = new Set(allRows.map(item => item.id));
const unitRows = allRows.filter(item => item.unitId === 'database');
const expectedOrder = Array.from({ length:14 }, (_, index) => `DB-${String(index + 1).padStart(2, '0')}`);
const unitIds = unitRows.map(item => item.id).sort();
const expectedSorted = [...expectedOrder].sort();
if (JSON.stringify(unitIds) !== JSON.stringify(expectedSorted)) fail(`current Database Lesson set changed: ${unitIds.join(', ')}`);
const learningOrder = [...unitRows].sort((a,b) => Number(a.order) - Number(b.order)).map(item => item.id);
if (JSON.stringify(learningOrder) !== JSON.stringify(expectedOrder)) fail(`Database learning order changed: ${learningOrder.join(' -> ')}`);

const curriculum = json('json/curriculum/ap-2026-map.json');
const unitMap = (curriculum.studyUnits || []).find(item => item.id === 'database');
if (!unitMap || unitMap.coverage !== 'partial') fail('database curriculum map must remain partial while blockers exist');
if (JSON.stringify((unitMap.officialMiddleCodes || []).map(Number)) !== JSON.stringify([9])) fail('database middle-code map changed');

const phaseIndex = json('json/phase1/index.json');
const unitRef = (phaseIndex.units || []).find(item => item.unitId === 'database');
if (!unitRef || unitRef.status !== 'pilot' || unitRef.file !== 'json/phase1/database-r30.json') fail('Phase 1 lazy manifest missing Database pilot');
const enhancement = json(unitRef.file);
if (enhancement.meta?.unitId !== 'database' || enhancement.meta?.phase1Status !== 'pilot' || enhancement.meta?.version !== '2026.09.06-r30') fail('Database enhancement metadata invalid');
if (JSON.stringify((enhancement.meta?.officialMiddleCodes || []).map(Number)) !== JSON.stringify([9])) fail('Database overlay middle-code contract changed');
const enhancementRows = Array.isArray(enhancement.lessons) ? enhancement.lessons : [];
const enhancementIds = enhancementRows.map(item => item.id).sort();
if (JSON.stringify(enhancementIds) !== JSON.stringify(expectedSorted)) fail(`overlay coverage mismatch unit=[${expectedSorted.join(',')}] overlay=[${enhancementIds.join(',')}]`);
if (new Set(enhancementIds).size !== enhancementIds.length) fail('duplicate Database overlay id');

const practiceManifest = json('json/practice/practice-index.json');
if (Number(practiceManifest.meta?.questionCount) !== 141) fail('r30 must not change existing 141-question snapshot');
const practiceQuestions = (practiceManifest.files || []).flatMap(ref => json(ref.file).questions || []);
const practiceById = new Map(practiceQuestions.map(question => [question.id, question]));

const official = json('json/past/ap-public-exams.json');
const officialByKey = new Map();
for (const exam of official.exams || []) {
  for (const question of exam.questions || []) officialByKey.set(`${exam.id}:Q${question.number}`, question);
}

const levels = new Set(['high','medium','low']);
const usefulTypes = new Set(['diagram','comparison','code-trace','steps','worked-example','process','table']);
for (const row of enhancementRows) {
  const entry = unitRows.find(item => item.id === row.id);
  if (!entry) fail(`${row.id}: index entry missing`);
  const lesson = json(entry.file);
  if (lesson.meta?.id !== row.id || lesson.meta?.unitId !== 'database') fail(`${row.id}: Lesson identity mismatch`);
  if (JSON.stringify((lesson.meta?.officialMiddleCodes || []).map(Number)) !== JSON.stringify([9])) fail(`${row.id}: official middle code changed`);
  if (!levels.has(row.importance) || !levels.has(row.frequency)) fail(`${row.id}: importance/frequency missing`);
  if (!String(row.examFocus || '').trim()) fail(`${row.id}: examFocus missing`);
  for (const field of ['prerequisiteLessons','relatedLessons','relatedTerms','relatedPracticeRefs','officialProblemRefs','inlineChecks']) {
    if (!Array.isArray(row[field])) fail(`${row.id}: ${field} must be explicit array`);
  }
  if (row.relatedTerms.length < 3) fail(`${row.id}: relatedTerms too sparse`);
  if (!row.relatedPracticeRefs.length) fail(`${row.id}: direct Practice ref missing`);
  if (row.inlineChecks.length !== 2) fail(`${row.id}: exactly two inline checks required`);
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length < 3) fail(`${row.id}: objectives too sparse`);
  if (!Array.isArray(lesson.sections) || lesson.sections.length < 5) fail(`${row.id}: content depth too shallow`);
  if (!lesson.sections.some(section => section.type === 'mistakes')) fail(`${row.id}: mistakes section missing`);
  if (!lesson.sections.some(section => usefulTypes.has(section.type))) fail(`${row.id}: concrete comparison/diagram/SQL trace missing`);
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
    if (options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) fail(`${row.id}: invalid inline answer`);
    if (!Number.isInteger(after) || after < 1 || after > lesson.sections.length) fail(`${row.id}: invalid inline placement ${check.afterSection}`);
  }
}

for (const entry of unitRows) {
  if (!practiceQuestions.some(question => (question.lessonRefs || []).includes(entry.id))) fail(`${entry.id}: no direct Practice coverage`);
}

const officialMappedIds = enhancementRows.filter(row => row.officialProblemRefs.length).map(row => row.id).sort();
const expectedOfficialMapped = ['DB-02','DB-03','DB-04','DB-05','DB-06'];
if (JSON.stringify(officialMappedIds) !== JSON.stringify(expectedOfficialMapped)) fail(`published-official mapping set changed: ${officialMappedIds.join(',')}`);
for (const key of ['AP-2025-SPRING-B:Q6','AP-2025-AUTUMN-B:Q6']) {
  const question = officialByKey.get(key);
  if (!question || question.primaryUnitId !== 'database') fail(`${key}: current public Database mapping missing`);
}

const migration = json('json/migrations/lesson-phase1-database-r30.json');
if (migration.meta?.status !== 'identity' || migration.meta?.storageKeysChanged !== false || migration.meta?.urlContractChanged !== false) fail('r30 identity migration contract invalid');
const migrationIds = (migration.lessonMappings || []).map(item => item.from).sort();
if (JSON.stringify(migrationIds) !== JSON.stringify(expectedSorted)) fail('r30 migration does not cover all Database Lessons');
for (const item of migration.lessonMappings || []) {
  if (item.strategy !== 'identity' || JSON.stringify(item.to) !== JSON.stringify([item.from])) fail(`${item.from}: non-identity migration detected`);
}
if (migration.storage?.lessonProgressKey !== 'ap-study-lesson-progress-v1') fail('lesson progress key changed');
if (migration.storage?.practiceHistoryKey !== 'ap-study-practice-history-v1') fail('practice history key changed');
if (migration.storage?.caseHistoryKey !== 'ap-study-case-history-v1') fail('case history key changed');
if (migration.storage?.mockHistoryKey !== 'ap-study-mock-history-v1') fail('mock history key changed');

const audit = json('json/curriculum/audits/database-phase1-r30.json');
if (audit.meta?.status !== 'pilot' || audit.meta?.syllabusVersion !== '7.2') fail('r30 syllabus audit state invalid');
if (Number(audit.contentDepthReview?.lessonCount) !== 14 || audit.contentDepthReview?.allHaveMistakesSection !== true || audit.contentDepthReview?.newLessons?.length !== 0) fail('r30 content-depth audit stale');
if (audit.practiceReview?.directCoverage !== '14/14') fail('r30 practice audit stale');
if (audit.officialReview?.directMappedLessons !== '5/14') fail('r30 official audit stale');
if ((audit.legacyAuditResolution?.resolvedLearningGoals || []).length !== 8) fail('legacy Database audit gaps are not fully re-audited');
for (const goal of audit.legacyAuditResolution?.resolvedLearningGoals || []) {
  if (!String(goal.goal || '').trim() || !(goal.evidenceLessons || []).length) fail('legacy audit resolution entry incomplete');
  for (const id of goal.evidenceLessons || []) if (!allLessonIds.has(id)) fail(`legacy audit evidence references unknown Lesson ${id}`);
}
if (!(audit.pendingReview || []).length || !(audit.completionBlockers || []).length) fail('pilot blockers must remain explicit');
for (const group of audit.coverage || []) for (const id of group.evidenceLessons || []) if (!allLessonIds.has(id)) fail(`audit evidence references unknown Lesson ${id}`);

const phaseRuntime = read('js/lesson-phase1.js');
for (const required of ['PHASE1_INDEX_PATH','loadPhase1Overlay','applyPhase1Overlay','phase1Payloads']) if (!phaseRuntime.includes(required)) fail(`lazy Phase 1 runtime missing ${required}`);
if (!phaseRuntime.includes("meta.phase1Status === 'pilot'")) fail('pilot status chip guard missing');

const gapIds = enhancementRows.filter(row => !row.officialProblemRefs.length).map(row => row.id);
console.log(`[phase1-database] OK: ${unitIds.length} Database Lessons preserve identity and ordered learning path, 14/14 direct Practice, middle 9 coverage, resolved legacy audit gaps, lazy metadata and inline checks.`);
console.log(`[phase1-database] Pilot remains in-progress: ${gapIds.length} lessons have no explicit 2025 published-official mapping (${gapIds.join(', ')}); Subject A SQL/design/transaction variation and cross-unit review remain open.`);

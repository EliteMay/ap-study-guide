import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const fail = message => { throw new Error(`[phase1-ui-media] ${message}`); };

const meta = json('json/project-meta.json');
if (meta.app !== 'AP Study Guide') fail('project name mismatch');
if (meta.guide?.repository !== 'EliteMay/web-project-guide' || meta.guide?.version !== '1.17.0') fail('Guide 1.17.0 adoption metadata missing');
if (meta.build !== '2026.09.06-r29') fail(`unexpected build ${meta.build}`);
if (Number(meta.phase?.active) !== 1 || meta.phase?.status !== 'in-progress') fail('Phase 1 must remain in-progress');

const baseIndex = json('json/lessons/lesson-index.json');
const expansionIndex = json('json/lessons/lesson-index-expansion.json');
const allRows = [...(baseIndex.lessons || []), ...(expansionIndex.lessons || [])];
const allLessonIds = new Set(allRows.map(item => item.id));
const unitRows = allRows.filter(item => item.unitId === 'ui-media');
const unitIds = unitRows.map(item => item.id).sort();
const expectedIds = ['MED-01','MED-02','MED-03','MED-04','UIM-01','UIM-02','UIM-03','UIM-04'];
if (JSON.stringify(unitIds) !== JSON.stringify(expectedIds)) fail(`current UI/Media Lesson set changed: ${unitIds.join(', ')}`);
const learningOrder = [...unitRows].sort((a,b) => Number(a.order) - Number(b.order)).map(item => item.id);
const expectedLearningOrder = ['UIM-01','UIM-02','UIM-03','UIM-04','MED-01','MED-02','MED-03','MED-04'];
if (JSON.stringify(learningOrder) !== JSON.stringify(expectedLearningOrder)) fail(`UI/Media learning order changed: ${learningOrder.join(' -> ')}`);

const expectedNew = new Map([
  ['UIM-04','json/lessons/ui-media/uim-04-screen-web-design.json'],
  ['MED-04','json/lessons/ui-media/med-04-multimedia-integration-compression.json']
]);
for (const [id,file] of expectedNew) {
  const row = unitRows.find(item => item.id === id);
  if (!row || row.file !== file) fail(`${id}: new lesson index contract missing`);
}

const curriculum = json('json/curriculum/ap-2026-map.json');
const unitMap = (curriculum.studyUnits || []).find(item => item.id === 'ui-media');
if (!unitMap || unitMap.coverage !== 'partial') fail('ui-media curriculum map must reflect implemented partial coverage');
if (JSON.stringify((unitMap.officialMiddleCodes || []).map(Number).sort()) !== JSON.stringify([7,8])) fail('ui-media middle-code map changed');
const coverage = json('json/curriculum/ap-2026-coverage.json');
if (Number(coverage.meta?.structuredLessons) !== 120) fail('structured lesson snapshot must be 120 for r29');
if (coverage.overrides?.['ui-media']?.coverage !== 'partial') fail('ui-media coverage overlay must remain partial');

const phaseIndex = json('json/phase1/index.json');
const unitRef = (phaseIndex.units || []).find(item => item.unitId === 'ui-media');
if (!unitRef || unitRef.status !== 'pilot' || unitRef.file !== 'json/phase1/ui-media-r29.json') fail('Phase 1 lazy manifest missing UI/Media pilot');
const enhancement = json(unitRef.file);
if (enhancement.meta?.unitId !== 'ui-media' || enhancement.meta?.phase1Status !== 'pilot' || enhancement.meta?.version !== '2026.09.06-r29') fail('UI/Media enhancement metadata invalid');
if (JSON.stringify((enhancement.meta?.officialMiddleCodes || []).map(Number).sort()) !== JSON.stringify([7,8])) fail('UI/Media overlay middle-code contract changed');
const enhancementRows = Array.isArray(enhancement.lessons) ? enhancement.lessons : [];
const enhancementIds = enhancementRows.map(item => item.id).sort();
if (JSON.stringify(enhancementIds) !== JSON.stringify(unitIds)) fail(`overlay coverage mismatch unit=[${unitIds.join(',')}] overlay=[${enhancementIds.join(',')}]`);
if (new Set(enhancementIds).size !== enhancementIds.length) fail('duplicate UI/Media overlay id');

const practiceManifest = json('json/practice/practice-index.json');
if (Number(practiceManifest.meta?.questionCount) !== 141) fail('r29 practice question count must be 141');
const practiceQuestions = (practiceManifest.files || []).flatMap(ref => json(ref.file).questions || []);
const practiceById = new Map(practiceQuestions.map(question => [question.id, question]));
for (const id of ['P-UIM-06','P-UIM-07']) {
  const question = practiceById.get(id);
  if (!question || question.mockEligible !== false) fail(`${id}: pilot question must remain outside full mock until Subject A review`);
}

const official = json('json/past/ap-public-exams.json');
const officialByKey = new Map();
for (const exam of official.exams || []) for (const question of exam.questions || []) officialByKey.set(`${exam.id}:Q${question.number}`, question);
const autumnQ8 = officialByKey.get('AP-2025-AUTUMN-B:Q8');
for (const id of ['UIM-01','UIM-02','UIM-03','UIM-04']) if (!(autumnQ8?.lessonRefs || []).includes(id)) fail(`2025 autumn Q8 missing ${id} mapping`);

const levels = new Set(['high','medium','low']);
const usefulTypes = new Set(['diagram','comparison','code-trace','steps','worked-example']);
for (const row of enhancementRows) {
  const entry = unitRows.find(item => item.id === row.id);
  if (!entry) fail(`${row.id}: index entry missing`);
  const lesson = json(entry.file);
  if (lesson.meta?.id !== row.id || lesson.meta?.unitId !== 'ui-media') fail(`${row.id}: Lesson identity mismatch`);
  if (!levels.has(row.importance) || !levels.has(row.frequency)) fail(`${row.id}: importance/frequency missing`);
  if (!String(row.examFocus || '').trim()) fail(`${row.id}: examFocus missing`);
  for (const field of ['prerequisiteLessons','relatedLessons','relatedTerms','relatedPracticeRefs','officialProblemRefs','inlineChecks']) if (!Array.isArray(row[field])) fail(`${row.id}: ${field} must be explicit array`);
  if (row.relatedTerms.length < 3) fail(`${row.id}: relatedTerms too sparse`);
  if (!row.relatedPracticeRefs.length) fail(`${row.id}: direct Practice ref missing`);
  if (row.inlineChecks.length !== 2) fail(`${row.id}: exactly two inline checks required`);
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length < 3) fail(`${row.id}: objectives too sparse`);
  if (!Array.isArray(lesson.sections) || lesson.sections.length < 5) fail(`${row.id}: content depth too shallow`);
  if (!lesson.sections.some(section => section.type === 'mistakes')) fail(`${row.id}: mistakes section missing`);
  if (!lesson.sections.some(section => usefulTypes.has(section.type))) fail(`${row.id}: comparison/diagram/trace content missing`);
  if (!Array.isArray(lesson.checks) || lesson.checks.length < 3 || lesson.checks.length > 5) fail(`${row.id}: end checks must stay within 3-5 questions`);

  for (const refId of [...row.prerequisiteLessons, ...row.relatedLessons]) if (!allLessonIds.has(refId)) fail(`${row.id}: unknown Lesson ref ${refId}`);
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

for (const entry of unitRows) if (!practiceQuestions.some(question => (question.lessonRefs || []).includes(entry.id))) fail(`${entry.id}: no direct Practice coverage`);
const coveredMiddle = [...new Set(unitRows.flatMap(item => item.officialMiddleCodes || []).map(Number))].sort();
if (JSON.stringify(coveredMiddle) !== JSON.stringify([7,8])) fail(`UI/Media middle coverage changed: ${coveredMiddle.join(',')}`);

const migration = json('json/migrations/lesson-phase1-ui-media-r29.json');
if (migration.meta?.status !== 'identity-plus-additions' || migration.meta?.storageKeysChanged !== false || migration.meta?.urlContractChanged !== false) fail('r29 migration contract invalid');
const existingIds = ['MED-01','MED-02','MED-03','UIM-01','UIM-02','UIM-03'];
const migrationIds = (migration.lessonMappings || []).map(item => item.from).sort();
if (JSON.stringify(migrationIds) !== JSON.stringify(existingIds)) fail(`existing identity coverage mismatch: ${migrationIds.join(',')}`);
for (const item of migration.lessonMappings || []) if (item.strategy !== 'identity' || JSON.stringify(item.to) !== JSON.stringify([item.from])) fail(`${item.from}: existing lesson must remain identity`);
const newIds = (migration.newLessons || []).map(item => item.id).sort();
if (JSON.stringify(newIds) !== JSON.stringify(['MED-04','UIM-04'])) fail(`new lesson migration set mismatch: ${newIds.join(',')}`);
for (const item of migration.newLessons || []) if (item.strategy !== 'addition' || item.unitId !== 'ui-media') fail(`${item.id}: new lesson strategy invalid`);
if (migration.storage?.lessonProgressKey !== 'ap-study-lesson-progress-v1') fail('lesson progress key changed');

const audit = json('json/curriculum/audits/ui-media-phase1-r29.json');
if (audit.meta?.status !== 'pilot' || audit.meta?.syllabusVersion !== '7.2') fail('r29 syllabus audit state invalid');
if (Number(audit.contentDepthReview?.lessonCount) !== 8 || audit.contentDepthReview?.allHaveMistakesSection !== true) fail('r29 content depth audit stale');
if (audit.practiceReview?.directCoverage !== '8/8') fail('r29 practice audit stale');
if (audit.officialReview?.directMappedLessons !== '4/8') fail('r29 official audit stale');
if (!(audit.pendingReview || []).length || !(audit.completionBlockers || []).length) fail('pilot blockers must remain explicit');
for (const group of audit.coverage || []) for (const id of group.evidenceLessons || []) if (!allLessonIds.has(id)) fail(`audit evidence references unknown Lesson ${id}`);

const phaseRuntime = read('js/lesson-phase1.js');
for (const required of ['PHASE1_INDEX_PATH','loadPhase1Overlay','applyPhase1Overlay','phase1Payloads']) if (!phaseRuntime.includes(required)) fail(`lazy Phase 1 runtime missing ${required}`);
if (!phaseRuntime.includes("meta.phase1Status === 'pilot'")) fail('pilot status chip guard missing');

const officialMappedIds = enhancementRows.filter(row => row.officialProblemRefs.length).map(row => row.id).sort();
if (JSON.stringify(officialMappedIds) !== JSON.stringify(['UIM-01','UIM-02','UIM-03','UIM-04'])) fail(`published-official mapping set changed: ${officialMappedIds.join(',')}`);
const gapIds = enhancementRows.filter(row => !row.officialProblemRefs.length).map(row => row.id);
console.log(`[phase1-ui-media] OK: ${unitIds.length} UI/Media Lessons, including 2 r29 additions, preserve existing identity and provide 8/8 direct Practice, middle 7-8 coverage, lazy metadata, inline checks and ordered learning path.`);
console.log(`[phase1-ui-media] Pilot remains in-progress: ${gapIds.length} Media lessons have no explicit 2025 published-official mapping (${gapIds.join(', ')}); Subject A variation and cross-unit review remain open.`);

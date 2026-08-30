import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(readText(relative));
const exists = relative => fs.existsSync(path.join(root, relative));
const fail = message => { throw new Error(`[mock] ${message}`); };

const requiredFiles = [
  'json/mock/mock-config.json',
  'json/mock/subject-a-extra.json',
  'html/mock.html',
  'css/mock.css',
  'js/mock-data.js',
  'js/mock.js',
  'js/practice-data.js',
  'js/case-data.js'
];
for (const file of requiredFiles) if (!exists(file)) fail(`missing ${file}`);

const config = readJson('json/mock/mock-config.json');
const a = config.subjectA || {};
const b = config.subjectB || {};
if (Number(a.durationMinutes) !== 150) fail('subject A duration must be 150 minutes');
if (Number(a.questionCount) !== 80 || Number(a.answerCount) !== 80) fail('subject A must be 80 questions / 80 answers');
if (a.type !== 'choice') fail('subject A must be choice-only');
if (Number(a.practiceChoiceCount) !== 57 || Number(a.extraChoiceCount) !== 23) fail('subject A must be 57 existing + 23 mock-only choices');
if (a.historyKey !== 'ap-study-mock-history-v1' || a.activeKey !== 'ap-study-mock-active-a-v1') fail('subject A storage keys mismatch');

if (Number(b.durationMinutes) !== 150) fail('subject B duration must be 150 minutes');
if (Number(b.offeredMainQuestions) !== 11 || Number(b.answeredMainQuestions) !== 5) fail('subject B must offer 11 and answer 5');
if (b.mandatoryUnitId !== 'security' || b.mandatoryCaseId !== 'CASE-SEC-01') fail('subject B mandatory security case mismatch');
if (Number(b.mandatoryCount) !== 1 || Number(b.optionalOfferedCount) !== 10 || Number(b.optionalAnswerCount) !== 4) fail('subject B selection counts mismatch');
if (Number(b.questionsPerCase) !== 3) fail('subject B mock cases must contain 3 written subquestions');
if (b.historyKey !== 'ap-study-mock-history-v1' || b.activeKey !== 'ap-study-mock-active-b-v1') fail('subject B storage keys mismatch');

const baseIndex = readJson('json/lessons/lesson-index.json');
const expansionIndex = readJson('json/lessons/lesson-index-expansion.json');
const lessons = [...(baseIndex.lessons || []), ...(expansionIndex.lessons || [])];
const lessonIds = new Set(lessons.map(item => item.id));
const curriculum = readJson('json/curriculum/ap-2026-map.json');
const unitIds = new Set((curriculum.studyUnits || []).map(item => item.id));
const middleCodes = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));

const practiceManifest = readJson('json/practice/practice-index.json');
const practiceQuestions = (practiceManifest.files || []).flatMap(item => readJson(item.file).questions || []);
const practiceChoices = practiceQuestions.filter(item => item.type === 'choice');
if (practiceChoices.length !== 57) fail(`expected 57 existing choices, got ${practiceChoices.length}`);

const extra = readJson(a.extraFile);
const extraQuestions = Array.isArray(extra.questions) ? extra.questions : [];
if (Number(extra.meta?.questionCount) !== 23 || extraQuestions.length !== 23) fail('mock-only subject A bank must contain 23 questions');
const allIds = new Set(practiceQuestions.map(item => item.id));
for (const question of extraQuestions) {
  if (!question?.id || allIds.has(question.id)) fail(`invalid/duplicate mock question id ${question?.id}`);
  allIds.add(question.id);
  if (question.type !== 'choice') fail(`${question.id}: must be choice`);
  if (!unitIds.has(question.unitId)) fail(`${question.id}: invalid unitId ${question.unitId}`);
  if (!Array.isArray(question.middleCodes) || !question.middleCodes.length) fail(`${question.id}: middleCodes missing`);
  for (const code of question.middleCodes) if (!middleCodes.has(Number(code))) fail(`${question.id}: invalid middle code ${code}`);
  if (!Array.isArray(question.options) || question.options.length !== 4) fail(`${question.id}: must have exactly 4 options`);
  if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) fail(`${question.id}: invalid answerIndex`);
  if (!question.prompt || !question.explanation) fail(`${question.id}: prompt/explanation missing`);
  if (!Array.isArray(question.lessonRefs) || !question.lessonRefs.length) fail(`${question.id}: lessonRefs missing`);
  for (const id of question.lessonRefs) if (!lessonIds.has(id)) fail(`${question.id}: unknown lesson ${id}`);
}
if (practiceChoices.length + extraQuestions.length !== 80) fail('subject A combined bank is not exactly 80 choices');

const caseManifest = readJson('json/cases/case-index.json');
const cases = (caseManifest.files || []).flatMap(item => readJson(item.file).cases || []);
if (cases.length !== 16) fail(`expected 16 general long cases, got ${cases.length}`);
const caseMap = new Map(cases.map(item => [item.id, item]));
const mandatory = caseMap.get(b.mandatoryCaseId);
if (!mandatory || mandatory.unitId !== 'security') fail('mandatory security case missing');
const optional = Array.isArray(b.optionalCases) ? b.optionalCases : [];
if (optional.length !== 10) fail(`expected 10 subject B optional domains, got ${optional.length}`);
const domains = new Set();
const optionalCaseIds = new Set();
for (const entry of optional) {
  if (!entry.domain || domains.has(entry.domain)) fail(`invalid/duplicate subject B domain ${entry.domain}`);
  domains.add(entry.domain);
  if (!entry.caseId || optionalCaseIds.has(entry.caseId) || entry.caseId === b.mandatoryCaseId) fail(`invalid/duplicate optional case ${entry.caseId}`);
  optionalCaseIds.add(entry.caseId);
  const item = caseMap.get(entry.caseId);
  if (!item) fail(`subject B case does not exist: ${entry.caseId}`);
  if (!Array.isArray(item.questions) || item.questions.length !== 3) fail(`${entry.caseId}: expected 3 questions`);
}
for (const expected of ['経営戦略','プログラミング','システムアーキテクチャ','ネットワーク','データベース','組込みシステム開発','情報システム開発','プロジェクトマネジメント','サービスマネジメント','システム監査']) {
  if (!domains.has(expected)) fail(`subject B domain missing: ${expected}`);
}
for (const id of ['CASE-EMB-01','CASE-AUD-01']) if (!optionalCaseIds.has(id)) fail(`mock support case missing from subject B: ${id}`);

const html = readText('html/mock.html');
for (const required of ['../css/mock.css','../js/practice-data.js','../js/case-data.js','../js/mock-data.js','../js/mock.js','mock-status','mock-root','80問','150分','11問提示','5問解答']) {
  if (!html.includes(required)) fail(`mock.html missing ${required}`);
}

const loader = readText('js/mock-data.js');
for (const required of ['json/mock/mock-config.json','APPracticeData.load','APCaseData.load','practiceChoices','extraChoices','subjectAQuestions','subjectBCases','mandatoryCaseId','optionalCases']) {
  if (!loader.includes(required)) fail(`mock-data.js missing ${required}`);
}

const js = readText('js/mock.js');
for (const required of [
  'ap-study-mock-history-v1',
  'durationSeconds',
  'mock-timer',
  'mock-nav-btn',
  'flags',
  'answers',
  'selectedCaseIds',
  'grades',
  'autoSubmitted',
  'APMockData.load',
  'submitA',
  'submitB',
  'renderBGrading',
  'localStorage'
]) {
  if (!js.includes(required)) fail(`mock.js missing ${required}`);
}

const shell = readText('js/shell.js');
if (!shell.includes("['mock','⏱️ 模試','mock.html']")) fail('canonical navigation missing mock');
if (!shell.includes("if (page === 'mock.html') return 'mock'")) fail('mock page cannot become active in navigation');
if (!shell.includes("const BUILD = '2026.08.30-r15'")) fail('shell BUILD is not r15');

const progress = readText('js/progress.js');
if (!progress.includes('ap-study-mock-history-v1') || !progress.includes('mock.html') || !progress.includes('FULL MOCK')) fail('progress dashboard is not connected to mock history');

console.log(`[mock] OK: Subject A ${practiceChoices.length}+${extraQuestions.length}=80 choices / 150min; Subject B 1 mandatory + ${optional.length} optional domains, answer 5 / 150min.`);

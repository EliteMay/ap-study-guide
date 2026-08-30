import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = rel => JSON.parse(readText(rel));
const exists = rel => fs.existsSync(path.join(root, rel));
const fail = message => { throw new Error(`[mock] ${message}`); };

for (const file of ['json/mock/mock-config.json','json/mock/subject-a-extra.json','html/mock.html','css/mock.css','js/mock-data.js','js/mock.js','js/practice-data.js','js/case-data.js']) if (!exists(file)) fail(`missing ${file}`);
const config = readJson('json/mock/mock-config.json');
const a = config.subjectA || {};
const b = config.subjectB || {};
if (Number(a.durationMinutes) !== 150 || Number(a.questionCount) !== 80 || Number(a.answerCount) !== 80 || a.type !== 'choice') fail('subject A public-format settings mismatch');
if (Number(a.practiceChoiceCount) !== 57 || Number(a.extraChoiceCount) !== 23) fail('subject A must be 57 existing + 23 mock-only choices');
if (Number(b.durationMinutes) !== 150 || Number(b.offeredMainQuestions) !== 11 || Number(b.answeredMainQuestions) !== 5) fail('subject B public-format settings mismatch');
if (b.mandatoryUnitId !== 'security' || b.mandatoryCaseId !== 'CASE-SEC-01') fail('subject B mandatory security case mismatch');
if (Number(b.mandatoryCount) !== 1 || Number(b.optionalOfferedCount) !== 10 || Number(b.optionalAnswerCount) !== 4 || Number(b.questionsPerCase) !== 3) fail('subject B selection settings mismatch');

const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');
const lessonIds = new Set([...(base.lessons || []), ...(expansion.lessons || [])].map(item => item.id));
const practiceManifest = readJson('json/practice/practice-index.json');
const practiceQuestions = (practiceManifest.files || []).flatMap(item => readJson(item.file).questions || []);
const practiceChoices = practiceQuestions.filter(item => item.type === 'choice');
if (practiceChoices.length !== 57) fail(`expected 57 practice choices, got ${practiceChoices.length}`);
const extra = readJson(a.extraFile);
const extraQuestions = extra.questions || [];
if (extraQuestions.length !== 23) fail(`expected 23 mock-only choices, got ${extraQuestions.length}`);
const ids = new Set(practiceQuestions.map(item => item.id));
for (const q of extraQuestions) {
  if (!q?.id || ids.has(q.id)) fail(`duplicate/invalid mock question ${q?.id}`);
  ids.add(q.id);
  if (q.type !== 'choice' || !Array.isArray(q.options) || q.options.length !== 4) fail(`${q.id}: invalid choice structure`);
  if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) fail(`${q.id}: invalid answerIndex`);
  if (!Array.isArray(q.lessonRefs) || !q.lessonRefs.length) fail(`${q.id}: lessonRefs missing`);
  for (const id of q.lessonRefs) if (!lessonIds.has(id)) fail(`${q.id}: unknown lesson ${id}`);
}
if (practiceChoices.length + extraQuestions.length !== 80) fail('subject A combined bank is not 80');

const caseManifest = readJson('json/cases/case-index.json');
const cases = (caseManifest.files || []).flatMap(item => readJson(item.file).cases || []);
const caseMap = new Map(cases.map(item => [item.id,item]));
if (!caseMap.has(b.mandatoryCaseId)) fail('mandatory security case missing');
const optional = b.optionalCases || [];
if (optional.length !== 10) fail(`expected 10 optional domains, got ${optional.length}`);
for (const entry of optional) {
  const item = caseMap.get(entry.caseId);
  if (!item || item.questions?.length !== 3) fail(`bad optional case ${entry.caseId}`);
}
for (const id of ['CASE-EMB-01','CASE-AUD-01']) if (!optional.some(item => item.caseId === id)) fail(`mock support case missing ${id}`);

const html = readText('html/mock.html');
for (const required of ['../css/mock.css','../js/practice-data.js','../js/case-data.js','../js/mock-data.js','../js/mock.js','80問','150分','11問提示','5問解答']) if (!html.includes(required)) fail(`mock.html missing ${required}`);
const loader = readText('js/mock-data.js');
for (const required of ['mock-config.json','APPracticeData.load','APCaseData.load','subjectAQuestions','subjectBCases']) if (!loader.includes(required)) fail(`mock-data.js missing ${required}`);
const js = readText('js/mock.js');
for (const required of ['ap-study-mock-history-v1','mock-timer','flags','answers','selectedCaseIds','grades','autoSubmitted','submitA','submitB','renderBGrading']) if (!js.includes(required)) fail(`mock.js missing ${required}`);

const shell = readText('js/shell.js');
if (!shell.includes("['mock','⏱️ 150分模試','mock.html']")) fail('navigation missing mock');
const progress = readText('js/progress.js');
if (!progress.includes('ap-study-mock-history-v1') || !progress.includes('FULL MOCK')) fail('progress not connected to mock history');
const home = readText('index.html');
for (const required of ['html/mock.html','150分模試','mock-progress-number']) if (!home.includes(required)) fail(`homepage missing ${required}`);
if (home.includes('js/home-mock.js')) fail('homepage should not load separate mock renderer');
const homeJs = readText('js/home.js');
if (!homeJs.includes('ap-study-mock-history-v1') || !homeJs.includes('mock-progress-number')) fail('home.js does not aggregate mock history');

console.log(`[mock] OK: Subject A ${practiceChoices.length}+${extraQuestions.length}=80 choices / 150min; Subject B 11 offered, 5 answered / 150min; home/progress integrated.`);
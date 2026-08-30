import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const exists = rel => fs.existsSync(path.join(root, rel));
const fail = message => { throw new Error(`[runtime-quality] ${message}`); };

for (const file of ['json/project-meta.json','js/study-state.js','js/lesson-data.js','html/data.html','js/data-tools.js','css/data-tools.css']) if (!exists(file)) fail(`missing ${file}`);
const meta = json('json/project-meta.json');
if (meta.app !== 'AP Study Notes' || !/^\d{4}\.\d{2}\.\d{2}-r\d+$/.test(String(meta.build || ''))) fail('project-meta app/build invalid');
if (meta.guide?.repository !== 'EliteMay/web-project-guide' || meta.guide?.version !== '1.1.0') fail('web-project-guide adoption metadata mismatch');
for (const profile of ['STATIC','DATA','TOOL','PUBLIC-CONTENT']) if (!(meta.profiles || []).includes(profile)) fail(`project profile missing ${profile}`);
if (meta.deployment?.target !== 'GitHub Pages' || Number(meta.storage?.backupSchemaVersion) !== 1) fail('deployment/storage metadata mismatch');

const shell = read('js/shell.js');
if (shell.includes('const BUILD =')) fail('shell reintroduced duplicated BUILD constant');
for (const required of ['project-meta.json','loadProjectMeta','APStudyUI.ready','data-ap-build','NAV_GROUPS']) if (!shell.includes(required)) fail(`shell metadata/navigation missing ${required}`);
if (!shell.includes("['glossary','🔎 単語辞書','glossary.html']")) fail('glossary missing from navigation');
if (!shell.includes("['data','💾 学習データ','data.html']")) fail('data backup page missing from navigation');
if (!shell.includes("toggleAttribute('inert'")) fail('mobile drawer does not become inert when closed');
if (!shell.includes('ap-skip-link')) fail('skip link is not created');

const state = read('js/study-state.js');
for (const required of ['LESSON_PASS_RATIO = 0.75','REVIEW_AFTER_DAYS = 14','WRITTEN_MIN_CHARS = 12','CASE_MIN_CHARS = 20','recentScores','recognizedKeys']) if (!state.includes(required)) fail(`study-state missing ${required}`);
const lessonData = read('js/lesson-data.js');
if (!lessonData.includes('lesson-index.json') || !lessonData.includes('lesson-index-expansion.json') || !lessonData.includes('cache = new Map()')) fail('lesson-data is not centralized+memoized');
if (lessonData.includes('no-store')) fail('lesson-data disables browser cache');
const practiceData = read('js/practice-data.js');
const caseData = read('js/case-data.js');
if (practiceData.includes('no-store') || caseData.includes('no-store')) fail('core modular loaders disable browser cache');
for (const file of ['js/lesson.js','js/home.js','js/progress.js']) if (read(file).includes('ap-original-practice-v1.json')) fail(`${file} reads legacy 37-question snapshot`);
if (!read('js/lesson.js').includes('APLessonData.load')) fail('lesson.js does not use APLessonData');
if (!read('js/unit.js').includes('APLessonData.load')) fail('unit.js does not use APLessonData');
if (!read('js/progress.js').includes('APLessonData.load')) fail('progress.js does not use APLessonData');
if (!read('js/home.js').includes('APLessonData.load')) fail('home.js does not use APLessonData');
const practice = read('js/practice.js');
if (!practice.includes('WRITTEN_MIN_CHARS') || !practice.includes('appendRecentScore') || !practice.includes('practice-reveal') || !practice.includes('reveal.disabled = length < min')) fail('practice written answer gate/recent score logic missing');
const cases = read('js/cases.js');
if (!cases.includes('CASE_MIN_CHARS') || !cases.includes('appendRecentScore') || !cases.includes('reveal.disabled = length < min')) fail('case answer gate/recent score logic missing');
const lesson = read('js/lesson.js');
if (!lesson.includes('LESSON_PASS_RATIO') || !lesson.includes('completed:passed')) fail('lesson completion is not pass-threshold based');

const coverage = json('json/curriculum/ap-2026-coverage.json');
const curriculum = json('json/curriculum/ap-2026-map.json');
for (const unit of curriculum.studyUnits || []) {
  const expected = `unit.html?unit=${unit.id}`;
  if (coverage.overrides?.[unit.id]?.hubHref !== expected) fail(`${unit.id}: hub is not unified (${coverage.overrides?.[unit.id]?.hubHref})`);
}

const index = read('index.html');
for (const legacy of ['html/algorithm.html','html/computer.html','html/database.html','html/network.html','html/security.html','html/system.html','html/management.html']) if (index.includes(`href="${legacy}"`)) fail(`homepage links directly to legacy hub ${legacy}`);
if (!index.includes('home-quick-search') || !index.includes('html/glossary.html')) fail('action-first home/glossary entry missing');
if (index.includes('js/home-practice.js') || index.includes('js/home-cases.js') || index.includes('js/home-mock.js')) fail('homepage still loads duplicate progress renderers');
for (const stale of ['0/118','0/91','0/16','0 / 118','0 / 91','0 / 16','BUILD r17']) if (index.includes(stale)) fail(`homepage contains stale magic value ${stale}`);
const homeJs = read('js/home.js');
for (const required of ['buildQuickActions','renderLoadError','finderBound','lessonCount:lessons.length','practiceCount:questions.length','caseCount:cases.length']) if (!homeJs.includes(required)) fail(`home runtime missing ${required}`);

const dataPage = read('html/data.html');
for (const required of ['JSONを書き出す','data-import-file','data-reset','../js/data-tools.js','aria-live="polite"']) if (!dataPage.includes(required)) fail(`data page missing ${required}`);
const dataTools = read('js/data-tools.js');
for (const required of ['recognizedKeys','expectedSchemaVersion','validateStorageValue','preview.replaceChildren','ap-study-before-restore','rollbackFailed','localStorage.setItem','localStorage.removeItem']) if (!dataTools.includes(required)) fail(`data-tools missing ${required}`);
if (dataTools.includes("$('data-import-preview').innerHTML") || dataTools.includes('data-import-preview.innerHTML')) fail('import preview uses raw innerHTML');

console.log(`[runtime-quality] OK: ${meta.build} / guide ${meta.guide.version} / profiles ${meta.profiles.join('+')} / centralized metadata, safe backup restore, dynamic home, accessible navigation.`);
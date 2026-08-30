import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const fail = message => { throw new Error(`[past-map] ${message}`); };

const index = readJson('security-past-index.json');
const map = readJson('json/past/lesson-past-map.json');
const base = readJson('json/lessons/lesson-index.json');
const expansion = readJson('json/lessons/lesson-index-expansion.json');

const pastIds = new Set((index.files || []).map(item => item.id));
const lessonIds = new Set([...(base.lessons || []), ...(expansion.lessons || [])].map(item => item.id));
const mappings = Array.isArray(map.mappings) ? map.mappings : [];

if (pastIds.size !== 7) fail(`expected 7 existing past questions, got ${pastIds.size}`);
if (mappings.length !== 7) fail(`expected 7 mappings, got ${mappings.length}`);

const mappedPast = new Set();
const mappedLessons = new Set();
for (const item of mappings) {
  if (!pastIds.has(item.pastId)) fail(`unknown pastId ${item.pastId}`);
  if (mappedPast.has(item.pastId)) fail(`duplicate pastId ${item.pastId}`);
  mappedPast.add(item.pastId);
  if (!item.label || !item.theme) fail(`${item.pastId}: label/theme missing`);
  if (!Array.isArray(item.lessonRefs) || item.lessonRefs.length < 2) fail(`${item.pastId}: needs at least 2 lessonRefs`);
  for (const lessonId of item.lessonRefs) {
    if (!lessonIds.has(lessonId)) fail(`${item.pastId}: unknown lesson ${lessonId}`);
    mappedLessons.add(lessonId);
  }
}

for (const pastId of pastIds) {
  if (!mappedPast.has(pastId)) fail(`past question ${pastId} has no lesson mapping`);
}

const lessonHtml = readText('html/lesson.html');
if (!lessonHtml.includes('../js/lesson-past.js')) fail('lesson.html does not load lesson-past.js');
const lessonPast = readText('js/lesson-past.js');
if (!lessonPast.includes('json/past/lesson-past-map.json')) fail('lesson-past.js does not load mapping');
if (!lessonPast.includes('security-past.html?id=')) fail('lesson-past.js does not create direct past links');

const pastHtml = readText('html/security-past.html');
if (!pastHtml.includes('../js/past-direct.js')) fail('security-past.html does not load past-direct.js');
const pastDirect = readText('js/past-direct.js');
if (!pastDirect.includes("get('id')")) fail('past-direct.js does not read id query');
if (!pastDirect.includes('[data-action="toggle"]')) fail('past-direct.js does not open target card');

console.log(`[past-map] OK: ${mappings.length}/7 past questions mapped to ${mappedLessons.size} structured lessons.`);
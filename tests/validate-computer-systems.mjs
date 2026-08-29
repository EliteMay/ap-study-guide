import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const read = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^\uFEFF/, ''));
const errors = [];
const fail = message => errors.push(message);

const index = read('json/lessons/lesson-index.json');
const entries = (index.lessons || []).filter(item => item.unitId === 'computer-systems');
const byId = new Map(entries.map(item => [item.id, item]));
const requiredIds = Array.from({ length: 12 }, (_, i) => `CMP-${String(i + 1).padStart(2, '0')}`);
const requiredMiddle = [3, 4, 5, 6];

if (entries.length !== 12) fail(`computer-systems: lesson count ${entries.length} != 12`);
for (const id of requiredIds) {
  const entry = byId.get(id);
  if (!entry) {
    fail(`computer-systems: missing ${id}`);
    continue;
  }
  const full = path.join(ROOT, entry.file || '');
  if (!entry.file || !fs.existsSync(full)) {
    fail(`computer-systems: ${id} missing file ${entry.file || 'none'}`);
    continue;
  }
  const lesson = read(entry.file);
  if (lesson.meta?.id !== id) fail(`computer-systems: ${id} meta.id mismatch`);
  if (lesson.meta?.unitId !== 'computer-systems') fail(`computer-systems: ${id} wrong unit ${lesson.meta?.unitId}`);
  if (!(lesson.objectives || []).length) fail(`computer-systems: ${id} objectives empty`);
  if (!(lesson.sections || []).length) fail(`computer-systems: ${id} sections empty`);
  if ((lesson.checks || []).length < 3) fail(`computer-systems: ${id} checks < 3`);
}

const covered = new Set(entries.flatMap(item => item.officialMiddleCodes || []).map(Number));
for (const code of requiredMiddle) {
  if (!covered.has(code)) fail(`computer-systems: IPA middle ${code} is not covered by any CMP lesson`);
}
for (const code of covered) {
  if (!requiredMiddle.includes(code)) fail(`computer-systems: unexpected middle code ${code}`);
}

if (!fs.existsSync(path.join(ROOT, 'html/computer.html'))) fail('computer-systems: html/computer.html missing');
const hub = fs.readFileSync(path.join(ROOT, 'html/computer.html'), 'utf8');
for (const id of requiredIds) {
  if (!hub.includes(`id=${id}`)) fail(`computer-systems: hub missing link to ${id}`);
}

if (errors.length) {
  console.error(`COMPUTER SYSTEMS VALIDATION FAILED: ${errors.length} error(s)`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('COMPUTER SYSTEMS VALIDATION OK: CMP-01..12 implemented, IPA middle 3/4/5/6 covered, hub links complete');

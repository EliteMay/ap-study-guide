import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const read = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^\uFEFF/, ''));
const errors = [];
const fail = message => errors.push(message);
const pad3 = n => String(n).padStart(3, '0');
const sameMembers = (a, b) => {
  const x = [...a].map(String).sort();
  const y = [...b].map(String).sort();
  return x.length === y.length && x.every((value, index) => value === y[index]);
};

function expandRanges(ranges, context) {
  const result = [];
  for (const range of Array.isArray(ranges) ? ranges : []) {
    const from = Number(range?.from);
    const to = Number(range?.to);
    if (!range?.prefix || !Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from) {
      fail(`${context}: invalid range ${JSON.stringify(range)}`);
      continue;
    }
    for (let n = from; n <= to; n += 1) result.push(`${range.prefix}${pad3(n)}`);
  }
  return result;
}

function groupIds(group, context) {
  return [
    ...(Array.isArray(group?.ids) ? group.ids : []),
    ...expandRanges(group?.ranges, context)
  ];
}

function lessonLegacyIds(lesson, context) {
  return [
    ...(Array.isArray(lesson?.meta?.legacyTermIds) ? lesson.meta.legacyTermIds : []),
    ...expandRanges(lesson?.meta?.legacyTermRanges, context)
  ];
}

const curriculum = read('json/curriculum/ap-2026-map.json');
const validMiddle = new Set((curriculum.middleCategories || []).map(item => Number(item.code)));
const validUnits = new Set((curriculum.studyUnits || []).map(item => item.id));
const lessonIndex = read('json/lessons/lesson-index.json');
const lessonById = new Map((lessonIndex.lessons || []).map(entry => [entry.id, entry]));
const audit = read('json/curriculum/audits/security-audit.json');
const manifest = read('security-terms-manifest.json');
const terms = (manifest.files || []).flatMap(item => read(item.file).terms || []);
const termIds = terms.map(item => item.id);
const expectedIds = Array.from({ length: 501 }, (_, index) => `sec-${pad3(index + 1)}`);
const groups = Array.isArray(audit.assignmentGroups) ? audit.assignmentGroups : [];

if (terms.length !== 501) fail(`security audit: term count ${terms.length} != 501`);
if (Number(manifest.meta?.totalTerms) !== 501) fail(`security audit: manifest totalTerms ${manifest.meta?.totalTerms} != 501`);
if (Number(audit.meta?.termsAudited) !== 501) fail(`security audit: termsAudited ${audit.meta?.termsAudited} != 501`);
if (!sameMembers(termIds, expectedIds)) {
  const missing = expectedIds.filter(id => !termIds.includes(id));
  const extra = termIds.filter(id => !expectedIds.includes(id));
  fail(`security audit: legacy IDs must be exactly sec-001..sec-501 missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
}
if (new Set(termIds).size !== termIds.length) fail('security audit: duplicate term ID in source data');
if (!groups.length) fail('security audit: assignmentGroups empty');

const seenAudit = new Map();
const securityAuditIds = [];
const movedAuditIds = [];
const countsByUnit = new Map();
const securityLessonIds = new Set();

for (const group of groups) {
  const context = `security audit ${group?.lessonId || 'unknown'}`;
  const ids = groupIds(group, context);
  if (!group?.lessonId) {
    fail(`${context}: lessonId missing`);
    continue;
  }
  if (!ids.length) fail(`${context}: no ids/ranges`);
  if (new Set(ids).size !== ids.length) fail(`${context}: duplicate ID inside group`);
  if (!['merge-into-lesson', 'move-primary-unit'].includes(group.action)) fail(`${context}: invalid action ${group.action}`);
  if (!validUnits.has(group.unitId)) fail(`${context}: unknown unit ${group.unitId}`);
  const middle = Number(group.officialMiddleCode);
  if (!validMiddle.has(middle)) fail(`${context}: invalid middle ${group.officialMiddleCode}`);

  const entry = lessonById.get(group.lessonId);
  if (!entry) {
    fail(`${context}: destination lesson not implemented`);
  } else {
    if (entry.unitId !== group.unitId) fail(`${context}: index unit ${entry.unitId} != audit unit ${group.unitId}`);
    if (!(entry.officialMiddleCodes || []).map(Number).includes(middle)) fail(`${context}: lesson index missing middle ${middle}`);
  }

  if (group.unitId === 'security') {
    if (group.action !== 'merge-into-lesson') fail(`${context}: security-owned group must use merge-into-lesson`);
    if (middle !== 11) fail(`${context}: security-owned group must use middle 11`);
    securityLessonIds.add(group.lessonId);
    securityAuditIds.push(...ids);
    if (entry) {
      const lesson = read(entry.file);
      if (lesson.meta?.id !== group.lessonId) fail(`${context}: lesson meta.id mismatch`);
      if (lesson.meta?.unitId !== 'security') fail(`${context}: lesson meta.unitId ${lesson.meta?.unitId} != security`);
      if (!(lesson.meta?.officialMiddleCodes || []).map(Number).includes(11)) fail(`${context}: lesson meta missing middle 11`);
      const metaIds = lessonLegacyIds(lesson, `lesson ${group.lessonId}`);
      if (new Set(metaIds).size !== metaIds.length) fail(`${context}: duplicate legacy ID in lesson meta`);
      if (!sameMembers(ids, metaIds)) {
        const missing = ids.filter(id => !metaIds.includes(id));
        const extra = metaIds.filter(id => !ids.includes(id));
        fail(`${context}: lesson meta migration mismatch missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
      }
    }
  } else {
    if (group.action !== 'move-primary-unit') fail(`${context}: cross-unit group must use move-primary-unit`);
    movedAuditIds.push(...ids);
  }

  countsByUnit.set(group.unitId, (countsByUnit.get(group.unitId) || 0) + ids.length);
  for (const id of ids) {
    if (!String(id).startsWith('sec-')) fail(`${context}: invalid security legacy ID ${id}`);
    if (seenAudit.has(id)) fail(`${context}: ${id} assigned more than once (${seenAudit.get(id)} / ${group.lessonId})`);
    seenAudit.set(id, group.lessonId);
  }
}

const assignedIds = [...seenAudit.keys()];
if (!sameMembers(termIds, assignedIds)) {
  const missing = termIds.filter(id => !seenAudit.has(id));
  const extra = assignedIds.filter(id => !termIds.includes(id));
  fail(`security audit: assignment mismatch missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
}

if (securityAuditIds.length !== Number(audit.summary?.mappedToSecurityLessons || 0)) {
  fail(`security audit: mappedToSecurityLessons ${securityAuditIds.length} != summary ${audit.summary?.mappedToSecurityLessons}`);
}
if (movedAuditIds.length !== Number(audit.summary?.movedPrimaryUnit || 0)) {
  fail(`security audit: movedPrimaryUnit ${movedAuditIds.length} != summary ${audit.summary?.movedPrimaryUnit}`);
}
if (securityLessonIds.size !== Number(audit.summary?.securityLessons || 0)) {
  fail(`security audit: securityLessons ${securityLessonIds.size} != summary ${audit.summary?.securityLessons}`);
}

const expectedUnitCounts = {
  network: Number(audit.summary?.movedToNetwork || 0),
  'computer-systems': Number(audit.summary?.movedToComputerSystems || 0),
  'law-standards': Number(audit.summary?.movedToLawStandards || 0),
  'system-development': Number(audit.summary?.movedToSystemDevelopment || 0),
  'service-audit': Number(audit.summary?.movedToServiceAudit || 0)
};
for (const [unitId, expected] of Object.entries(expectedUnitCounts)) {
  const actual = countsByUnit.get(unitId) || 0;
  if (actual !== expected) fail(`security audit: ${unitId} moved count ${actual} != summary ${expected}`);
}
if ((countsByUnit.get('security') || 0) !== 369) fail(`security audit: security unit count ${countsByUnit.get('security') || 0} != 369`);
if (securityAuditIds.length + movedAuditIds.length !== 501) fail('security audit: security + moved counts do not total 501');
if (!(audit.missingLearningGoals || []).length) fail('security audit: missingLearningGoals empty');

const indexedSecurityLessons = (lessonIndex.lessons || []).filter(entry => entry.unitId === 'security');
const indexedSecurityIds = indexedSecurityLessons.map(entry => entry.id);
if (indexedSecurityLessons.length !== 12) fail(`security audit: indexed security lessons ${indexedSecurityLessons.length} != 12`);
if (!sameMembers(indexedSecurityIds, [...securityLessonIds])) {
  const missing = [...securityLessonIds].filter(id => !indexedSecurityIds.includes(id));
  const extra = indexedSecurityIds.filter(id => !securityLessonIds.has(id));
  fail(`security audit: security lesson index mismatch missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
}

const securityMetaIds = [];
for (const entry of indexedSecurityLessons) {
  const lesson = read(entry.file);
  securityMetaIds.push(...lessonLegacyIds(lesson, `lesson ${entry.id}`));
}
if (new Set(securityMetaIds).size !== securityMetaIds.length) fail('security audit: duplicate sec legacy ID across SEC lesson metadata');
if (!sameMembers(securityMetaIds, securityAuditIds)) {
  const missing = securityAuditIds.filter(id => !securityMetaIds.includes(id));
  const extra = securityMetaIds.filter(id => !securityAuditIds.includes(id));
  fail(`security audit: SEC lesson metadata must cover exactly 369 security-owned IDs missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
}

if (errors.length) {
  console.error(`SECURITY AUDIT VALIDATION FAILED: ${errors.length} error(s)`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('SECURITY AUDIT VALIDATION OK: security 501/501 audited; 369 mapped to SEC-01..12 and 132 remapped to implemented cross-domain lessons');

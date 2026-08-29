import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const read = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^\uFEFF/, ''));
const errors = [];
const fail = message => errors.push(message);
const sameMembers = (a,b) => {
  const x=[...a].map(String).sort(), y=[...b].map(String).sort();
  return x.length===y.length && x.every((v,i)=>v===y[i]);
};

const curriculum = read('json/curriculum/ap-2026-map.json');
const validMiddle = new Set((curriculum.middleCategories||[]).map(x=>Number(x.code)));
const validUnits = new Set((curriculum.studyUnits||[]).map(x=>x.id));
const allowedActions = new Set(['keep-core','keep-supporting','merge-into-lesson','move-primary-unit']);
const lessonIndex = read('json/lessons/lesson-index.json');
const lessonEntries = lessonIndex.lessons || [];
const lessonById = new Map(lessonEntries.map(entry => [entry.id, entry]));
const legacyAssignments = new Map();

for (const entry of lessonEntries) {
  const lesson = read(entry.file);
  for (const termId of lesson.meta?.legacyTermIds || []) {
    if (!legacyAssignments.has(termId)) legacyAssignments.set(termId, []);
    legacyAssignments.get(termId).push({lessonId:entry.id, unitId:entry.unitId, middleCodes:entry.officialMiddleCodes||[]});
  }
}

const configs = [
  {
    name:'system audit',
    audit:'json/curriculum/audits/system-audit.json',
    terms:'json/terms/system-terms.json',
    expected:75,
    idPrefix:'term-sys-',
    summary:{'keep-core':'keepCore','keep-supporting':'keepSupporting','merge-into-lesson':'mergeIntoLesson','move-primary-unit':'movePrimaryUnit'}
  },
  {
    name:'management audit',
    audit:'json/curriculum/audits/management-audit.json',
    terms:'json/terms/management-terms.json',
    expected:72,
    idPrefix:'term-pm-',
    summary:{'keep-core':'keepCore','keep-supporting':'keepSupporting','merge-into-lesson':'mergeIntoLesson','move-primary-unit':'movePrimaryUnit'}
  }
];

for (const cfg of configs) {
  const audit = read(cfg.audit);
  const terms = read(cfg.terms).terms || [];
  const decisions = audit.decisions || [];
  const plannedLessonIds = new Set((audit.targetLessons||[]).map(x=>x.id));
  const termIds = terms.map(x=>x.id);
  const decisionIds = decisions.map(x=>x.id);

  if (terms.length !== cfg.expected) fail(`${cfg.name}: term count ${terms.length} != ${cfg.expected}`);
  if (Number(audit.meta?.termsAudited) !== terms.length) fail(`${cfg.name}: termsAudited mismatch`);
  if (decisions.length !== terms.length) fail(`${cfg.name}: decisions ${decisions.length} != terms ${terms.length}`);
  if (new Set(decisionIds).size !== decisionIds.length) fail(`${cfg.name}: duplicate decision id`);
  if (!sameMembers(termIds, decisionIds)) fail(`${cfg.name}: decision IDs do not cover every term exactly once`);

  const counts = {};
  for (const d of decisions) {
    counts[d.action] = (counts[d.action]||0)+1;
    if (!allowedActions.has(d.action)) fail(`${cfg.name}: ${d.id} invalid action ${d.action}`);
    if (!d.id?.startsWith(cfg.idPrefix)) fail(`${cfg.name}: invalid id ${d.id}`);
    if (!validMiddle.has(Number(d.officialMiddleCode))) fail(`${cfg.name}: ${d.id} invalid middle ${d.officialMiddleCode}`);
    if (!d.target) fail(`${cfg.name}: ${d.id} target missing`);

    if (d.action === 'move-primary-unit') {
      if (!validUnits.has(d.target)) fail(`${cfg.name}: ${d.id} unknown target unit ${d.target}`);
    } else {
      if (!plannedLessonIds.has(d.target)) fail(`${cfg.name}: ${d.id} unknown planned lesson ${d.target}`);
      if (!lessonById.has(d.target)) fail(`${cfg.name}: planned lesson ${d.target} has not been implemented`);
    }

    const assignments = legacyAssignments.get(d.id) || [];
    if (assignments.length !== 1) {
      fail(`${cfg.name}: ${d.id} must map to exactly one implemented lesson, found ${assignments.length}`);
      continue;
    }

    const assigned = assignments[0];
    if (!assigned.middleCodes.map(Number).includes(Number(d.officialMiddleCode))) {
      fail(`${cfg.name}: ${d.id} lesson ${assigned.lessonId} does not include middle ${d.officialMiddleCode}`);
    }
    if (d.action === 'move-primary-unit') {
      if (assigned.unitId !== d.target) fail(`${cfg.name}: ${d.id} expected unit ${d.target}, mapped to ${assigned.unitId}`);
    } else if (assigned.lessonId !== d.target) {
      fail(`${cfg.name}: ${d.id} expected lesson ${d.target}, mapped to ${assigned.lessonId}`);
    }
  }

  for (const [action,key] of Object.entries(cfg.summary)) {
    const expected = Number(audit.summary?.[key]||0);
    if ((counts[action]||0) !== expected) fail(`${cfg.name}: ${action} ${counts[action]||0} != summary ${expected}`);
  }
  if (!(audit.missingLearningGoals||[]).length) fail(`${cfg.name}: missingLearningGoals empty`);

  const mappedIds = [...legacyAssignments.keys()].filter(id => id.startsWith(cfg.idPrefix));
  if (!sameMembers(termIds, mappedIds)) {
    const missing = termIds.filter(id => !mappedIds.includes(id));
    const extra = mappedIds.filter(id => !termIds.includes(id));
    fail(`${cfg.name}: lesson migration mismatch missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
  }
}

function loadManifestTerms(manifestPath) {
  const manifest = read(manifestPath);
  return (manifest.files || []).flatMap(item => read(item.file).terms || []);
}

try {
  const name = 'database audit';
  const audit = read('json/curriculum/audits/database-audit.json');
  const terms = loadManifestTerms('database-terms-manifest.json');
  const termIds = terms.map(item => item.id);
  const groups = Array.isArray(audit.assignmentGroups) ? audit.assignmentGroups : [];
  const seen = new Map();
  const counts = {keepCore:0, keepSupporting:0, mergeIntoLesson:0, movePrimaryUnit:0};

  if (terms.length !== 229) fail(`${name}: term count ${terms.length} != 229`);
  if (Number(audit.meta?.termsAudited) !== 229) fail(`${name}: termsAudited ${audit.meta?.termsAudited} != 229`);
  if (!groups.length) fail(`${name}: assignmentGroups empty`);

  for (const group of groups) {
    if (!group.lessonId) {
      fail(`${name}: group lessonId missing`);
      continue;
    }
    const entry = lessonById.get(group.lessonId);
    if (!entry) fail(`${name}: lesson ${group.lessonId} has not been implemented`);
    if (Number(group.officialMiddleCode) !== 9 || !validMiddle.has(Number(group.officialMiddleCode))) {
      fail(`${name}: ${group.lessonId} invalid middle ${group.officialMiddleCode}`);
    }
    if (entry) {
      if (entry.unitId !== 'database') fail(`${name}: ${group.lessonId} unit ${entry.unitId} != database`);
      if (!(entry.officialMiddleCodes||[]).map(Number).includes(9)) fail(`${name}: ${group.lessonId} index does not include middle 9`);
    }

    const buckets = [
      ['coreIds','keepCore'],
      ['supportingIds','keepSupporting'],
      ['mergeIds','mergeIntoLesson']
    ];
    for (const [field,summaryKey] of buckets) {
      const ids = Array.isArray(group[field]) ? group[field] : [];
      counts[summaryKey] += ids.length;
      for (const id of ids) {
        if (!String(id).startsWith('term-db-')) fail(`${name}: invalid id ${id}`);
        if (seen.has(id)) fail(`${name}: ${id} assigned more than once (${seen.get(id)} / ${group.lessonId})`);
        seen.set(id, group.lessonId);

        const assignments = legacyAssignments.get(id) || [];
        if (assignments.length !== 1) {
          fail(`${name}: ${id} must map to exactly one implemented lesson, found ${assignments.length}`);
          continue;
        }
        const assigned = assignments[0];
        if (assigned.lessonId !== group.lessonId) fail(`${name}: ${id} expected ${group.lessonId}, mapped to ${assigned.lessonId}`);
        if (assigned.unitId !== 'database') fail(`${name}: ${id} mapped unit ${assigned.unitId} != database`);
        if (!assigned.middleCodes.map(Number).includes(9)) fail(`${name}: ${id} lesson ${assigned.lessonId} missing middle 9`);
      }
    }
  }

  const assignedIds = [...seen.keys()];
  if (!sameMembers(termIds, assignedIds)) {
    const missing = termIds.filter(id => !seen.has(id));
    const extra = assignedIds.filter(id => !termIds.includes(id));
    fail(`${name}: audit assignment mismatch missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
  }

  const mappedIds = [...legacyAssignments.keys()].filter(id => id.startsWith('term-db-'));
  if (!sameMembers(termIds, mappedIds)) {
    const missing = termIds.filter(id => !mappedIds.includes(id));
    const extra = mappedIds.filter(id => !termIds.includes(id));
    fail(`${name}: lesson migration mismatch missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
  }

  if (counts.keepCore !== Number(audit.summary?.keepCore||0)) fail(`${name}: keepCore ${counts.keepCore} != summary ${audit.summary?.keepCore}`);
  if (counts.keepSupporting !== Number(audit.summary?.keepSupporting||0)) fail(`${name}: keepSupporting ${counts.keepSupporting} != summary ${audit.summary?.keepSupporting}`);
  if (counts.mergeIntoLesson !== Number(audit.summary?.mergeIntoLesson||0)) fail(`${name}: mergeIntoLesson ${counts.mergeIntoLesson} != summary ${audit.summary?.mergeIntoLesson}`);
  if (Number(audit.summary?.movePrimaryUnit||0) !== 0) fail(`${name}: movePrimaryUnit must be 0`);
  if (!(audit.missingLearningGoals||[]).length) fail(`${name}: missingLearningGoals empty`);
} catch (error) {
  fail(`database audit: ${error.message}`);
}

if (errors.length) {
  console.error(`AUDIT VALIDATION FAILED: ${errors.length} error(s)`);
  errors.forEach(e=>console.error(`- ${e}`));
  process.exit(1);
}

console.log('AUDIT VALIDATION OK: system 75/75, management 72/72, database 229/229 audited and mapped exactly once to implemented lessons');

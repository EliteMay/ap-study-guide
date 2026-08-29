import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const read = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^\uFEFF/, ''));
const errors = [];
const fail = message => errors.push(message);
const sameMembers = (a,b) => {
  const x=[...a].sort(), y=[...b].sort();
  return x.length===y.length && x.every((v,i)=>v===y[i]);
};

const curriculum = read('json/curriculum/ap-2026-map.json');
const validMiddle = new Set((curriculum.middleCategories||[]).map(x=>Number(x.code)));
const validUnits = new Set((curriculum.studyUnits||[]).map(x=>x.id));
const allowedActions = new Set(['keep-core','keep-supporting','merge-into-lesson','move-primary-unit']);

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
  const lessonIds = new Set((audit.targetLessons||[]).map(x=>x.id));
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
    } else if (!lessonIds.has(d.target)) {
      fail(`${cfg.name}: ${d.id} unknown planned lesson ${d.target}`);
    }
  }

  for (const [action,key] of Object.entries(cfg.summary)) {
    const expected = Number(audit.summary?.[key]||0);
    if ((counts[action]||0) !== expected) fail(`${cfg.name}: ${action} ${counts[action]||0} != summary ${expected}`);
  }
  if (!(audit.missingLearningGoals||[]).length) fail(`${cfg.name}: missingLearningGoals empty`);
}

if (errors.length) {
  console.error(`AUDIT VALIDATION FAILED: ${errors.length} error(s)`);
  errors.forEach(e=>console.error(`- ${e}`));
  process.exit(1);
}

console.log('AUDIT VALIDATION OK: system 75/75, management 72/72');

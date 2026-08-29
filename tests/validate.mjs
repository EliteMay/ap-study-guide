import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const domains = [
  ['security','security-terms-manifest.json','security-details-manifest.json'],
  ['network','network-terms-manifest.json','network-details-manifest.json'],
  ['database','database-terms-manifest.json','database-details-manifest.json'],
  ['algorithm','algorithm-terms-manifest.json',null],
  ['system','system-terms-manifest.json',null],
  ['management','management-terms-manifest.json',null]
];
const errors=[];
const notes=[];
const fail=message=>errors.push(message);
const cleanText=text=>String(text).replace(/^\uFEFF/,'');
const parseJsonText=text=>JSON.parse(cleanText(text));
const readJson=rel=>parseJsonText(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const exists=rel=>fs.existsSync(path.join(ROOT,rel));
const expected=(manifest,key)=>Number.isFinite(Number(manifest?.meta?.[key]))
  ? Number(manifest.meta[key])
  : (manifest.files||[]).reduce((sum,item)=>sum+Number(item.count||0),0);
const sameMembers=(a,b)=>{
  const left=[...(a||[])].map(String).sort();
  const right=[...(b||[])].map(String).sort();
  return left.length===right.length&&left.every((value,index)=>value===right[index]);
};

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

for(const file of walk(ROOT).filter(file=>file.endsWith('.json'))){
  try{ parseJsonText(fs.readFileSync(file,'utf8')); }
  catch(error){ fail(`JSON parse: ${path.relative(ROOT,file)}: ${error.message}`); }
}

try{
  const curriculum=readJson('json/curriculum/ap-2026-map.json');
  const majors=Array.isArray(curriculum.majorCategories)?curriculum.majorCategories:[];
  const middles=Array.isArray(curriculum.middleCategories)?curriculum.middleCategories:[];
  const units=Array.isArray(curriculum.studyUnits)?curriculum.studyUnits:[];
  const expectedMiddleCodes=Array.from({length:23},(_,index)=>index+1);

  if(curriculum.meta?.syllabusVersion!=='7.2')fail(`curriculum: syllabusVersion ${curriculum.meta?.syllabusVersion||'missing'} != 7.2`);
  if(majors.length!==9)fail(`curriculum: major category count ${majors.length} != 9`);
  if(middles.length!==23)fail(`curriculum: middle category count ${middles.length} != 23`);
  if(units.length!==13)fail(`curriculum: study unit count ${units.length} != 13`);

  const majorCodes=new Set(majors.map(item=>Number(item.code)));
  const middleCodes=middles.map(item=>Number(item.code));
  if(!sameMembers(middleCodes,expectedMiddleCodes))fail('curriculum: middle category codes must be 1..23');
  for(const middle of middles){
    if(!majorCodes.has(Number(middle.majorCode)))fail(`curriculum: middle ${middle.code} references unknown major ${middle.majorCode}`);
  }

  const allowedCoverage=new Set(['existing-needs-audit','partial','missing']);
  const unitIds=new Set();
  const mappedCodes=[];
  for(const unit of units){
    if(!unit.id||unitIds.has(unit.id))fail(`curriculum: invalid or duplicate study unit id ${unit.id||'missing'}`);
    unitIds.add(unit.id);
    if(!allowedCoverage.has(unit.coverage))fail(`curriculum: ${unit.id} invalid coverage ${unit.coverage}`);
    for(const code of unit.officialMiddleCodes||[]){
      if(!expectedMiddleCodes.includes(Number(code)))fail(`curriculum: ${unit.id} unknown middle code ${code}`);
      mappedCodes.push(Number(code));
    }
  }
  if(mappedCodes.length!==23||new Set(mappedCodes).size!==23||!sameMembers(mappedCodes,expectedMiddleCodes)){
    fail('curriculum: 13 study units must cover every middle category 1..23 exactly once');
  }
  notes.push('curriculum: 9 major / 23 middle / 13 study units OK');
}catch(error){
  fail(`curriculum: ${error.message}`);
}

try{
  const audit=readJson('json/curriculum/audits/algorithm-audit.json');
  const terms=readJson('json/terms/algorithm-terms.json').terms||[];
  const decisions=Array.isArray(audit.decisions)?audit.decisions:[];
  const lessonIds=new Set((audit.targetLessons||[]).map(item=>item.id));
  const curriculum=readJson('json/curriculum/ap-2026-map.json');
  const unitIds=new Set((curriculum.studyUnits||[]).map(item=>item.id));
  const allowedActions=new Set(['keep-core','keep-supporting','merge-into-lesson','move-primary-unit']);
  const termIds=terms.map(item=>item.id);
  const decisionIds=decisions.map(item=>item.id);

  if(Number(audit.meta?.termsAudited)!==terms.length)fail(`algorithm audit: termsAudited ${audit.meta?.termsAudited} != ${terms.length}`);
  if(decisions.length!==terms.length)fail(`algorithm audit: decision count ${decisions.length} != ${terms.length}`);
  if(new Set(decisionIds).size!==decisionIds.length)fail('algorithm audit: duplicate decision id');
  if(!sameMembers(termIds,decisionIds)){
    const missing=termIds.filter(id=>!decisionIds.includes(id));
    const extra=decisionIds.filter(id=>!termIds.includes(id));
    fail(`algorithm audit: ids mismatch missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
  }

  for(const item of decisions){
    if(!allowedActions.has(item.action))fail(`algorithm audit: ${item.id} invalid action ${item.action}`);
    if(!item.priority||!item.contentType||!item.targetLesson)fail(`algorithm audit: ${item.id} missing priority/contentType/targetLesson`);
    if(item.action==='move-primary-unit'){
      if(!unitIds.has(item.targetLesson))fail(`algorithm audit: ${item.id} unknown target unit ${item.targetLesson}`);
    }else if(!lessonIds.has(item.targetLesson)){
      fail(`algorithm audit: ${item.id} unknown target lesson ${item.targetLesson}`);
    }
  }

  const counts=decisions.reduce((acc,item)=>{
    acc[item.action]=(acc[item.action]||0)+1;
    return acc;
  },{});
  const summary={
    'keep-core':Number(audit.summary?.keepCore||0),
    'keep-supporting':Number(audit.summary?.keepSupporting||0),
    'merge-into-lesson':Number(audit.summary?.mergeIntoLesson||0),
    'move-primary-unit':Number(audit.summary?.movePrimaryUnit||0)
  };
  for(const [action,count] of Object.entries(summary)){
    if((counts[action]||0)!==count)fail(`algorithm audit: ${action} count ${counts[action]||0} != summary ${count}`);
  }
  if(!(audit.missingLearningGoals||[]).length)fail('algorithm audit: missingLearningGoals is empty');
  notes.push(`algorithm audit: ${decisions.length} decisions / ${audit.targetLessons?.length||0} planned lessons OK`);
}catch(error){
  fail(`algorithm audit: ${error.message}`);
}

try{
  const lessonIndex=readJson('json/lessons/lesson-index.json');
  const lessons=Array.isArray(lessonIndex.lessons)?lessonIndex.lessons:[];
  const curriculum=readJson('json/curriculum/ap-2026-map.json');
  const unitIds=new Set((curriculum.studyUnits||[]).map(item=>item.id));
  const validMiddleCodes=new Set((curriculum.middleCategories||[]).map(item=>Number(item.code)));
  const algorithmTermIds=new Set((readJson('json/terms/algorithm-terms.json').terms||[]).map(item=>item.id));
  const allowedSectionTypes=new Set(['text','comparison','diagram','code-trace','steps','mistakes']);
  const ids=lessons.map(item=>item.id);
  const orders=lessons.map(item=>Number(item.order));
  const replacedTermIds=new Set();

  if(!lessons.length)fail('lessons: lesson-index is empty');
  if(new Set(ids).size!==ids.length)fail('lessons: duplicate lesson id');
  if(orders.some(order=>!Number.isInteger(order)||order<1))fail('lessons: invalid lesson order');
  if(new Set(orders).size!==orders.length)fail('lessons: duplicate lesson order');

  for(const entry of lessons){
    if(!entry.id||!entry.file||!entry.title)fail(`lessons: invalid index entry ${entry.id||'missing-id'}`);
    if(!unitIds.has(entry.unitId))fail(`lessons: ${entry.id} unknown unit ${entry.unitId}`);
    for(const code of entry.officialMiddleCodes||[]){
      if(!validMiddleCodes.has(Number(code)))fail(`lessons: ${entry.id} invalid middle code ${code}`);
    }
    if(!exists(entry.file)){
      fail(`lessons: ${entry.id} missing ${entry.file}`);
      continue;
    }

    const lesson=readJson(entry.file);
    if(lesson.meta?.id!==entry.id)fail(`lessons: ${entry.id} meta.id mismatch ${lesson.meta?.id||'missing'}`);
    if(lesson.meta?.unitId!==entry.unitId)fail(`lessons: ${entry.id} unitId mismatch`);
    if(!(lesson.objectives||[]).length)fail(`lessons: ${entry.id} objectives empty`);
    if(!(lesson.sections||[]).length)fail(`lessons: ${entry.id} sections empty`);

    for(const termId of lesson.meta?.replacesTemplateFor||[]){
      if(!algorithmTermIds.has(termId))fail(`lessons: ${entry.id} replaces unknown algorithm term ${termId}`);
      if(replacedTermIds.has(termId))fail(`lessons: algorithm term ${termId} replaced by more than one lesson`);
      replacedTermIds.add(termId);
    }

    for(const [sectionIndex,section] of (lesson.sections||[]).entries()){
      if(!allowedSectionTypes.has(section.type))fail(`lessons: ${entry.id} section ${sectionIndex+1} unsupported type ${section.type||'missing'}`);
      if(!section.title)fail(`lessons: ${entry.id} section ${sectionIndex+1} title missing`);
      if(section.type==='diagram'){
        const diagrams=Array.isArray(section.diagrams)?section.diagrams:[];
        if(!diagrams.length)fail(`lessons: ${entry.id} diagram section ${sectionIndex+1} has no diagrams`);
        for(const [diagramIndex,diagram] of diagrams.entries()){
          const nodes=Array.isArray(diagram.nodes)?diagram.nodes:[];
          if(!diagram.label)fail(`lessons: ${entry.id} diagram ${sectionIndex+1}.${diagramIndex+1} label missing`);
          if(!nodes.length)fail(`lessons: ${entry.id} diagram ${sectionIndex+1}.${diagramIndex+1} nodes empty`);
          for(const [nodeIndex,node] of nodes.entries()){
            if(!node.title&&!node.value)fail(`lessons: ${entry.id} diagram ${sectionIndex+1}.${diagramIndex+1} node ${nodeIndex+1} is empty`);
          }
        }
      }
    }

    for(const check of lesson.checks||[]){
      const options=Array.isArray(check.options)?check.options:[];
      const answer=Number(check.answerIndex);
      if(!check.id||!check.prompt||options.length<2||!Number.isInteger(answer)||answer<0||answer>=options.length){
        fail(`lessons: ${entry.id} invalid check ${check.id||'missing-id'}`);
      }
    }

    for(const next of lesson.next||[]){
      if(next.lessonId&&!ids.includes(next.lessonId))fail(`lessons: ${entry.id} next references unknown lesson ${next.lessonId}`);
    }
  }

  if(!sameMembers([...algorithmTermIds],[...replacedTermIds])){
    const missing=[...algorithmTermIds].filter(id=>!replacedTermIds.has(id));
    const extra=[...replacedTermIds].filter(id=>!algorithmTermIds.has(id));
    fail(`lessons: legacy algorithm coverage incomplete missing=[${missing.join(',')}] extra=[${extra.join(',')}]`);
  }

  notes.push(`lessons: ${lessons.length} structured lesson(s) / ${replacedTermIds.size}/${algorithmTermIds.size} legacy algorithm terms covered exactly once`);
}catch(error){
  fail(`lessons: ${error.message}`);
}

for(const [id,termManifestPath,detailManifestPath] of domains){
  try{
    const termManifest=readJson(termManifestPath);
    const categories=new Set((termManifest.categories||[]).map(item=>item.title));
    const terms=[];

    for(const item of termManifest.files||[]){
      if(!exists(item.file)){
        fail(`${id}: missing ${item.file}`);
        continue;
      }
      const rows=readJson(item.file).terms||[];
      if(rows.length!==Number(item.count||0))fail(`${id}: ${item.file} count ${rows.length} != ${item.count}`);
      terms.push(...rows);
    }

    if(terms.length!==expected(termManifest,'totalTerms'))fail(`${id}: totalTerms ${terms.length} != ${expected(termManifest,'totalTerms')}`);
    const termIds=terms.map(item=>item.id);
    if(new Set(termIds).size!==termIds.length)fail(`${id}: duplicate term id`);
    for(const term of terms){
      if(!term.id||!term.term||!term.category||!term.definition)fail(`${id}: required field missing ${term.id||term.term||'unknown'}`);
      if(categories.size&&!categories.has(term.category))fail(`${id}: undefined category ${term.id}: ${term.category}`);
    }

    if(detailManifestPath){
      const detailManifest=readJson(detailManifestPath);
      const details=[];
      for(const item of detailManifest.files||[]){
        if(!exists(item.file)){
          fail(`${id}: missing ${item.file}`);
          continue;
        }
        const rows=readJson(item.file).details||[];
        if(rows.length!==Number(item.count||0))fail(`${id}: ${item.file} detail count ${rows.length} != ${item.count}`);
        details.push(...rows);
      }
      if(details.length!==expected(detailManifest,'totalDetails'))fail(`${id}: totalDetails ${details.length} != ${expected(detailManifest,'totalDetails')}`);
      const termById=new Map(terms.map(item=>[item.id,item]));
      const detailById=new Map(details.map(item=>[item.id,item]));
      for(const [termId,term] of termById){
        const detail=detailById.get(termId);
        if(!detail){
          fail(`${id}: detail missing ${termId}`);
          continue;
        }
        if(detail.term&&detail.term!==term.term)fail(`${id}: term mismatch ${termId}`);
        if(detail.category&&detail.category!==term.category)fail(`${id}: category mismatch ${termId}`);
      }
      for(const detailId of detailById.keys()){
        if(!termById.has(detailId))fail(`${id}: orphan detail ${detailId}`);
      }
    }
    notes.push(`${id}: ${terms.length} terms OK`);
  }catch(error){
    fail(`${id}: ${error.message}`);
  }
}

try{
  const index=readJson('security-past-index.json');
  for(const item of index.files||[]){
    if(!exists(item.file)||!exists(item.problemFile)){
      fail(`past ${item.id}: source file missing`);
      continue;
    }
    const past=readJson(item.file).pastQuestions||[];
    const problem=readJson(item.problemFile).problem||{};
    if(past.length!==Number(item.count||0))fail(`past ${item.id}: count mismatch`);
    const problemQuestions=new Map((problem.questions||[]).map(question=>[String(question.label||''),question]));
    for(const question of past){
      const labels=new Set();
      for(const section of question.sections||[]){
        labels.add(String(section.label||''));
        const source=problemQuestions.get(String(section.label||''));
        if(!source)fail(`${question.id} ${section.label}: problem section missing`);
        else if(!sameMembers(section.answerTargets,source.targets))fail(`${question.id} ${section.label}: targets mismatch`);
        if(!(section.expectedAnswers||[]).length&&section.status!=='要原本確認')fail(`${question.id} ${section.label}: expectedAnswers missing`);
      }
      for(const label of problemQuestions.keys()){
        if(!labels.has(label))fail(`${question.id}: explanation section missing ${label}`);
      }
    }
  }
  notes.push('security past questions OK');
}catch(error){
  fail(`past: ${error.message}`);
}

const mainPages=[
  'index.html','html/roadmap.html','html/lesson.html','html/security.html','html/network.html',
  'html/database.html','html/algorithm.html','html/system.html','html/management.html',
  'html/security-past.html','html/test.html'
];
for(const page of mainPages){
  if(!exists(page)){
    fail(`missing page: ${page}`);
    continue;
  }
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  const base=path.dirname(page);
  for(const match of html.matchAll(/(?:href|src)="([^"#?]+)"/g)){
    const target=match[1];
    if(/^(?:https?:|mailto:|data:|javascript:)/.test(target))continue;
    const resolved=path.normalize(path.join(base,target));
    if(!exists(resolved))fail(`${page}: missing reference ${target} -> ${resolved}`);
  }
}

if(errors.length){
  console.error(`VALIDATION FAILED: ${errors.length} error(s)`);
  for(const error of errors)console.error(`- ${error}`);
  process.exit(1);
}

console.log(`VALIDATION PASSED: ${notes.length} groups`);
for(const note of notes)console.log(`- ${note}`);

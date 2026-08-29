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
const fail=msg=>errors.push(msg);
const cleanText=text=>String(text).replace(/^\uFEFF/,'');
const parseJsonText=text=>JSON.parse(cleanText(text));
const readJson=rel=>parseJsonText(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const exists=rel=>fs.existsSync(path.join(ROOT,rel));
const expected=(m,key)=>Number.isFinite(Number(m?.meta?.[key]))?Number(m.meta[key]):(m.files||[]).reduce((s,x)=>s+Number(x.count||0),0);
const sameMembers=(a,b)=>{const x=[...(a||[])].map(String).sort(),y=[...(b||[])].map(String).sort();return x.length===y.length&&x.every((v,i)=>v===y[i]);};

function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const full=path.join(dir,entry.name);return entry.isDirectory()?walk(full):[full];});}

for(const file of walk(ROOT).filter(file=>file.endsWith('.json'))){
  try{parseJsonText(fs.readFileSync(file,'utf8'));}
  catch(error){fail(`JSON parse: ${path.relative(ROOT,file)}: ${error.message}`);}
}

try{
  const curriculum=readJson('json/curriculum/ap-2026-map.json');
  const majors=Array.isArray(curriculum.majorCategories)?curriculum.majorCategories:[];
  const middles=Array.isArray(curriculum.middleCategories)?curriculum.middleCategories:[];
  const units=Array.isArray(curriculum.studyUnits)?curriculum.studyUnits:[];
  if(curriculum.meta?.syllabusVersion!=='7.2')fail(`curriculum: syllabusVersion ${curriculum.meta?.syllabusVersion||'missing'} != 7.2`);
  if(majors.length!==9)fail(`curriculum: major category count ${majors.length} != 9`);
  if(middles.length!==23)fail(`curriculum: middle category count ${middles.length} != 23`);
  if(units.length!==13)fail(`curriculum: study unit count ${units.length} != 13`);
  const middleCodes=middles.map(item=>Number(item.code));
  const expectedMiddleCodes=Array.from({length:23},(_,i)=>i+1);
  if(!sameMembers(middleCodes,expectedMiddleCodes))fail('curriculum: middle category codes must be 1..23');
  const majorCodes=new Set(majors.map(item=>Number(item.code)));
  for(const middle of middles)if(!majorCodes.has(Number(middle.majorCode)))fail(`curriculum: middle ${middle.code} references unknown major ${middle.majorCode}`);
  const allowedStatuses=new Set(['existing-needs-audit','partial','missing']);
  const mappedCodes=[];
  const unitIds=new Set();
  for(const unit of units){
    if(!unit.id||unitIds.has(unit.id))fail(`curriculum: invalid or duplicate study unit id ${unit.id||'missing'}`);
    unitIds.add(unit.id);
    if(!allowedStatuses.has(unit.coverage))fail(`curriculum: ${unit.id} invalid coverage ${unit.coverage}`);
    for(const code of unit.officialMiddleCodes||[]){
      if(!expectedMiddleCodes.includes(Number(code)))fail(`curriculum: ${unit.id} unknown middle code ${code}`);
      mappedCodes.push(Number(code));
    }
  }
  if(mappedCodes.length!==23||new Set(mappedCodes).size!==23||!sameMembers(mappedCodes,expectedMiddleCodes))fail('curriculum: 13 study units must cover every middle category 1..23 exactly once');
  notes.push('curriculum: 9 major / 23 middle / 13 study units OK');
}catch(error){fail(`curriculum: ${error.message}`);}

for(const [id,termManifestPath,detailManifestPath] of domains){
  try{
    const tm=readJson(termManifestPath);
    const categories=new Set((tm.categories||[]).map(x=>x.title));
    const terms=[];
    for(const item of tm.files||[]){
      if(!exists(item.file)){fail(`${id}: missing ${item.file}`);continue;}
      const rows=readJson(item.file).terms||[];
      if(rows.length!==Number(item.count||0))fail(`${id}: ${item.file} count ${rows.length} != ${item.count}`);
      terms.push(...rows);
    }
    if(terms.length!==expected(tm,'totalTerms'))fail(`${id}: totalTerms ${terms.length} != ${expected(tm,'totalTerms')}`);
    const ids=terms.map(x=>x.id);
    if(new Set(ids).size!==ids.length)fail(`${id}: duplicate term id`);
    for(const term of terms){
      if(!term.id||!term.term||!term.category||!term.definition)fail(`${id}: required field missing ${term.id||term.term||'unknown'}`);
      if(categories.size&&!categories.has(term.category))fail(`${id}: undefined category ${term.id}: ${term.category}`);
    }
    if(detailManifestPath){
      const dm=readJson(detailManifestPath),details=[];
      for(const item of dm.files||[]){
        if(!exists(item.file)){fail(`${id}: missing ${item.file}`);continue;}
        const rows=readJson(item.file).details||[];
        if(rows.length!==Number(item.count||0))fail(`${id}: ${item.file} detail count ${rows.length} != ${item.count}`);
        details.push(...rows);
      }
      if(details.length!==expected(dm,'totalDetails'))fail(`${id}: totalDetails ${details.length} != ${expected(dm,'totalDetails')}`);
      const termById=new Map(terms.map(x=>[x.id,x])),detailById=new Map(details.map(x=>[x.id,x]));
      for(const [termId,term] of termById){
        const detail=detailById.get(termId);
        if(!detail){fail(`${id}: detail missing ${termId}`);continue;}
        if(detail.term&&detail.term!==term.term)fail(`${id}: term mismatch ${termId}`);
        if(detail.category&&detail.category!==term.category)fail(`${id}: category mismatch ${termId}`);
      }
      for(const detailId of detailById.keys())if(!termById.has(detailId))fail(`${id}: orphan detail ${detailId}`);
    }
    notes.push(`${id}: ${terms.length} terms OK`);
  }catch(error){fail(`${id}: ${error.message}`);}
}

try{
  const index=readJson('security-past-index.json');
  for(const item of index.files||[]){
    if(!exists(item.file)||!exists(item.problemFile)){fail(`past ${item.id}: source file missing`);continue;}
    const past=readJson(item.file).pastQuestions||[],problem=readJson(item.problemFile).problem||{};
    if(past.length!==Number(item.count||0))fail(`past ${item.id}: count mismatch`);
    const problemQuestions=new Map((problem.questions||[]).map(q=>[String(q.label||''),q]));
    for(const q of past){
      const labels=new Set();
      for(const section of q.sections||[]){
        labels.add(String(section.label||''));
        const source=problemQuestions.get(String(section.label||''));
        if(!source)fail(`${q.id} ${section.label}: problem section missing`);
        else if(!sameMembers(section.answerTargets,source.targets))fail(`${q.id} ${section.label}: targets mismatch`);
        if(!(section.expectedAnswers||[]).length&&section.status!=='要原本確認')fail(`${q.id} ${section.label}: expectedAnswers missing`);
      }
      for(const label of problemQuestions.keys())if(!labels.has(label))fail(`${q.id}: explanation section missing ${label}`);
    }
  }
  notes.push('security past questions OK');
}catch(error){fail(`past: ${error.message}`);}

const mainPages=['index.html','html/roadmap.html','html/security.html','html/network.html','html/database.html','html/algorithm.html','html/system.html','html/management.html','html/security-past.html','html/test.html'];
for(const page of mainPages){
  if(!exists(page)){fail(`missing page: ${page}`);continue;}
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

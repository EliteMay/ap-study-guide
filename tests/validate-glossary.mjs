import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root,rel),'utf8');
const json = rel => JSON.parse(read(rel));
const exists = rel => fs.existsSync(path.join(root,rel));
const fail = message => { throw new Error(`[glossary] ${message}`); };

for (const file of ['html/glossary.html','css/glossary.css','js/glossary.js','css/home-launch.css']) if (!exists(file)) fail(`missing ${file}`);
const domains = [
  ['algorithm','algorithm-terms-manifest.json',65,'algorithm-terms-checked'],
  ['database','database-terms-manifest.json',229,'database-terms-checked'],
  ['network','network-terms-manifest.json',480,'network-terms-checked'],
  ['security','security-terms-manifest.json',501,'security-terms-checked'],
  ['system','system-terms-manifest.json',75,'system-terms-checked'],
  ['management','management-terms-manifest.json',72,'management-terms-checked']
];
let total = 0;
for (const [domain,manifestFile,expected,storageKey] of domains) {
  const manifest = json(manifestFile);
  const files = manifest.files || [];
  let count = 0;
  for (const entry of files) {
    if (!exists(entry.file)) fail(`${domain}: missing ${entry.file}`);
    const payload = json(entry.file);
    const terms = payload.terms || [];
    if (terms.length !== Number(entry.count)) fail(`${domain}: ${entry.file} count mismatch`);
    count += terms.length;
  }
  if (count !== expected) fail(`${domain}: expected ${expected}, got ${count}`);
  total += count;
  if (!read('js/glossary.js').includes(storageKey)) fail(`${domain}: glossary missing legacy checked key`);
}
if (total !== 1422) fail(`legacy total must be 1422, got ${total}`);

for (const details of ['security-details-manifest.json','network-details-manifest.json','database-details-manifest.json']) if (!exists(details)) fail(`missing ${details}`);
const html = read('html/glossary.html');
for (const required of ['1,422','glossary-search','glossary-domain','glossary-category','glossary-status','glossary-more','../js/glossary.js']) if (!html.includes(required)) fail(`glossary.html missing ${required}`);
const js = read('js/glossary.js');
for (const required of ['PAGE_SIZE = 60','loadDetailFor','detailFileCache','detailIndex','state.filtered.slice(0,state.visible)','APStudyUI','glossary.html?term=']) if (!js.includes(required)) fail(`glossary.js missing ${required}`);
if (js.includes('term-page.js')) fail('unified glossary must not depend on legacy term-page runtime');
if (js.includes("cache:'no-store'") || js.includes('cache: \'no-store\'')) fail('glossary disables browser cache');

const unit = read('js/unit.js');
for (const required of ['GLOSSARY_DOMAINS','glossary.html?domain=','>単語辞書<']) if (!unit.includes(required)) fail(`unit hub missing ${required}`);
for (const old of ['>旧用語辞書<','LEGACY_GLOSSARIES']) if (unit.includes(old)) fail(`unit hub still promotes legacy glossary: ${old}`);

const home = read('index.html');
for (const required of ['home-quick-search','やりたいことから選ぶ','html/glossary.html','単語を調べる','css/home-launch.css']) if (!home.includes(required)) fail(`homepage missing ${required}`);
const homeJs = read('js/home.js');
for (const required of ['QUICK_ACTIONS','home-quick-search','glossary.html?q=','unit.html?unit=']) if (!homeJs.includes(required)) fail(`home.js missing ${required}`);

const shell = read('js/shell.js');
if (!shell.includes("['glossary','🔎 単語辞書','glossary.html']")) fail('navigation missing glossary');
if (!shell.includes("const BUILD = '2026.08.30-r17'")) fail('shell BUILD is not r17');

console.log(`[glossary] OK: ${total} legacy terms unified, 60-result pagination, lazy rich details, action-first home, r17 navigation.`);
(() => {
  'use strict';

  const els={
    list:document.getElementById('past-list'),
    search:document.getElementById('past-search'),
    round:document.getElementById('round-filter'),
    count:document.getElementById('past-count')
  };
  let past=[];
  let problems=new Map();
  let termByLabel=new Map();
  let termRegex=null;

  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  async function fetchJson(path){const response=await fetch('../'+path,{cache:'no-store'});if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);return response.json();}

  async function loadTerms(){
    const manifest=await fetchJson('security-terms-manifest.json');
    const payloads=await Promise.all((manifest.files||[]).map(item=>fetchJson(item.file)));
    const terms=payloads.flatMap(payload=>payload.terms||[]);
    const labels=[];
    for(const term of terms){
      for(const raw of [term.term,...(Array.isArray(term.aliases)?term.aliases:[])]){
        const label=String(raw||'').trim();if(label.length<2)continue;
        const key=label.toLocaleLowerCase('ja-JP');
        if(!termByLabel.has(key)){termByLabel.set(key,{id:term.id,term:term.term});labels.push(label);}
      }
    }
    labels.sort((a,b)=>b.length-a.length);
    termRegex=labels.length?new RegExp(labels.map(escapeRegExp).join('|'),'gi'):null;
  }

  function findTerm(label){return termByLabel.get(String(label||'').trim().toLocaleLowerCase('ja-JP'))||null;}
  function linkify(text){
    const escaped=escapeHtml(text);if(!termRegex)return escaped;
    return escaped.replace(termRegex,match=>{const hit=findTerm(match);return hit?`<a class="term-link" href="security.html#${escapeHtml(hit.id)}">${escapeHtml(match)}</a>`:match;});
  }
  function formatChoice(choice){
    if(typeof choice==='string')return choice;
    if(choice&&typeof choice==='object')return [choice.key,choice.text].filter(Boolean).join(' ');
    return String(choice??'');
  }

  function buildProblemMap(payloads){
    problems=new Map();
    for(const payload of payloads){
      if(!payload?.problem?.id)continue;
      const id=payload.problem.id.endsWith('-problem')?payload.problem.id.slice(0,-8):payload.problem.id;
      problems.set(id,payload);
    }
  }

  function renderRoundFilter(){
    const rounds=[...new Set(past.map(q=>q.examRound).filter(Boolean))];
    els.round.innerHTML='<option value="all">すべて</option>'+rounds.map(round=>`<option value="${escapeHtml(round)}">${escapeHtml(round)}</option>`).join('');
  }
  function searchText(q){return [q.examRound,q.questionNumber,q.title,q.themeSummary,...(q.relatedTerms||[])].join(' ').toLocaleLowerCase('ja-JP');}
  function filteredPast(){const keyword=els.search.value.trim().toLocaleLowerCase('ja-JP');const round=els.round.value;return past.filter(q=>(round==='all'||q.examRound===round)&&(!keyword||searchText(q).includes(keyword)));}

  function renderList(){
    const filtered=filteredPast();els.count.textContent=`${filtered.length} / ${past.length} 件`;
    if(!filtered.length){els.list.innerHTML='<div class="empty-note">条件に合う過去問がありません。</div>';return;}
    els.list.innerHTML=filtered.map(q=>`<article class="past-card" id="${escapeHtml(q.id)}">
      <button class="past-card-header" type="button" data-action="toggle" data-id="${escapeHtml(q.id)}" aria-expanded="false">
        <span><span class="past-meta"><span class="past-pill">${escapeHtml(q.examRound)}</span><span class="past-pill">${escapeHtml(q.questionNumber)}</span></span><h3 class="past-title">${escapeHtml(q.title)}</h3><p class="past-theme">${escapeHtml(q.themeSummary||'')}</p></span>
        <span class="past-toggle">解説を開く</span>
      </button>
      <div class="past-panel" id="panel-${escapeHtml(q.id)}" hidden data-rendered="false"></div>
    </article>`).join('');
  }

  function relatedLinks(items){
    if(!Array.isArray(items)||!items.length)return '<p class="empty-note">関連用語は未設定です。</p>';
    return `<div class="related-list">${items.map(label=>{const hit=findTerm(label);return hit?`<a href="security.html#${escapeHtml(hit.id)}">${escapeHtml(label)}</a>`:`<span class="missing-term-link">${escapeHtml(label)}</span>`;}).join('')}</div>`;
  }

  function renderCoverage(q){
    const sections=Array.isArray(q.sections)?q.sections:[];if(!sections.length)return '';
    return `<h4 class="section-heading">設問カバレッジ</h4><div class="coverage-wrap"><table class="coverage-table"><thead><tr><th>設問</th><th>対象</th><th>状態</th><th>答案・確認点</th></tr></thead><tbody>${sections.map(section=>{const ok=section.status==='解説済み';return `<tr><td>${escapeHtml(section.label||'')}</td><td>${escapeHtml((section.answerTargets||[]).join(' / '))}</td><td class="${ok?'status-ok':'status-warn'}">${escapeHtml(section.status||'未設定')}</td><td>${escapeHtml((section.expectedAnswers||[]).join('、'))}${section.qualityNote?`<br><small>${escapeHtml(section.qualityNote)}</small>`:''}</td></tr>`;}).join('')}</tbody></table></div>`;
  }

  function renderProblem(q){
    const payload=problems.get(q.id);const p=payload?.problem;const pdf=q.sourcePdf||payload?.meta?.sourcePdf||'';
    if(!p&&!pdf)return '';
    const opening=(p?.opening||[]).map(x=>`<p>${escapeHtml(x)}</p>`).join('');
    const body=(p?.body||[]).map(x=>`<p>${escapeHtml(x)}</p>`).join('');
    const tables=(p?.tables||[]).map(table=>`<details><summary>${escapeHtml(table.title||'表')}</summary><ul>${(table.rows||[]).map(row=>`<li>${escapeHtml(row)}</li>`).join('')}</ul></details>`).join('');
    const questions=(p?.questions||[]).map(item=>`<div class="answer-item"><h4>${escapeHtml(item.label||'設問')}</h4><p>${escapeHtml(item.prompt||item.instruction||'')}</p><p><strong>答える対象：</strong>${escapeHtml((item.targets||[]).join(' / '))}</p>${Array.isArray(item.choices)&&item.choices.length?`<p><strong>選択肢：</strong>${escapeHtml(item.choices.map(formatChoice).join('、'))}</p>`:''}${item.note?`<p><strong>注意：</strong>${escapeHtml(item.note)}</p>`:''}</div>`).join('');
    return `<div class="problem-source"><h4>問題文・原本</h4>${pdf?`<a class="source-pdf-link" href="../${escapeHtml(pdf)}" target="_blank" rel="noopener">PDF原本を開く</a>`:''}${p?`<details><summary>問題文の起こしを開く</summary>${opening}${tables}${body}</details>${questions?`<details open><summary>設問・解答対象</summary><div class="answer-guide">${questions}</div></details>`:''}`:'<p>問題文JSONを読み込めませんでした。</p>'}</div>`;
  }

  function renderAnswerGuide(q){
    const guides=Array.isArray(q.answerGuide)&&q.answerGuide.length?q.answerGuide:(q.sections||[]).map(section=>({label:section.label,answer:(section.expectedAnswers||[]).join('、'),why:section.qualityNote||''}));
    if(!guides.length)return '<p class="empty-note">答案ガイドは未設定です。</p>';
    return `<div class="answer-guide">${guides.map(item=>`<div class="answer-item"><h4>${escapeHtml(item.label||'設問')}</h4><p><strong>答案の方向：</strong>${linkify(item.answer||'')}</p>${item.why?`<p><strong>理由：</strong>${linkify(item.why)}</p>`:''}${item.howToRead?`<p><strong>読み方：</strong>${linkify(item.howToRead)}</p>`:''}</div>`).join('')}</div>`;
  }
  function renderBlocks(blocks,emptyText){
    if(!Array.isArray(blocks)||!blocks.length)return `<p class="empty-note">${escapeHtml(emptyText)}</p>`;
    return blocks.map(block=>`<div class="explain-block"><h4>${escapeHtml(block.heading||'解説')}</h4>${(block.body||[]).map(text=>`<p>${linkify(text)}</p>`).join('')}</div>`).join('');
  }
  function renderChecklist(q){
    const items=(Array.isArray(q.studyChecklist)&&q.studyChecklist.length?q.studyChecklist:q.reviewChecklist)||[];
    if(!items.length)return '';
    return `<div class="checklist"><strong>復習チェック</strong><ul>${items.map(item=>`<li>${linkify(item)}</li>`).join('')}</ul></div>`;
  }

  function renderPanel(q,panel){
    panel.innerHTML=`${renderCoverage(q)}${renderProblem(q)}
      <h4 class="section-heading">関連用語</h4>${relatedLinks(q.relatedTerms)}
      <h4 class="section-heading">答案ガイド</h4>${renderAnswerGuide(q)}
      <h4 class="section-heading">最初に読むポイント</h4>${renderBlocks(q.fullWalkthrough,'読み方の詳細は未設定です。')}
      <h4 class="section-heading">詳しい解説</h4>${renderBlocks(q.ultraExplanation,'詳細解説は未設定です。')}
      ${renderChecklist(q)}`;
    panel.dataset.rendered='true';
  }

  function validate(){
    const ids=new Set();
    for(const q of past){
      if(!q.id)console.error('[past] missing id',q);
      else if(ids.has(q.id))console.error('[past] duplicate id',q.id);
      else ids.add(q.id);
      if(!Array.isArray(q.sections)||!q.sections.length)console.warn('[past] sections missing',q.id);
    }
  }

  async function init(){
    try{
      const [,index]=await Promise.all([loadTerms(),fetchJson('security-past-index.json')]);
      const files=Array.isArray(index.files)?index.files:[];
      const [explanations,problemPayloads]=await Promise.all([
        Promise.all(files.map(item=>fetchJson(item.file))),
        Promise.all(files.map(item=>item.problemFile?fetchJson(item.problemFile).catch(error=>{console.warn('[problem] load failed',item.problemFile,error);return null;}):null))
      ]);
      past=explanations.flatMap(payload=>payload.pastQuestions||[]);
      buildProblemMap(problemPayloads.filter(Boolean));
      validate();renderRoundFilter();renderList();
    }catch(error){
      console.error(error);els.list.innerHTML=`<div class="load-error">過去問データの読み込みに失敗しました。GitHub PagesまたはLive Server経由で開いてください。<br>${escapeHtml(error.message)}</div>`;els.count.textContent='読み込み失敗';
    }
  }

  els.search.addEventListener('input',renderList);
  els.round.addEventListener('change',renderList);
  els.list.addEventListener('click',event=>{
    const header=event.target.closest('[data-action="toggle"]');if(!header)return;
    const q=past.find(item=>item.id===header.dataset.id);const panel=document.getElementById(`panel-${header.dataset.id}`);if(!q||!panel)return;
    const opening=panel.hidden;if(opening&&panel.dataset.rendered!=='true')renderPanel(q,panel);panel.hidden=!opening;header.setAttribute('aria-expanded',String(opening));const toggle=header.querySelector('.past-toggle');if(toggle)toggle.textContent=opening?'閉じる':'解説を開く';
  });
  document.addEventListener('DOMContentLoaded',init);
})();

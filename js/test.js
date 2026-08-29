(() => {
  'use strict';

  const DOMAINS = [
    { id:'security', label:'情報セキュリティ', manifest:'security-terms-manifest.json', page:'security.html' },
    { id:'network', label:'ネットワーク', manifest:'network-terms-manifest.json', page:'network.html' },
    { id:'database', label:'データベース', manifest:'database-terms-manifest.json', page:'database.html' },
    { id:'algorithm', label:'アルゴリズム', manifest:'algorithm-terms-manifest.json', page:'algorithm.html' },
    { id:'system', label:'システム開発', manifest:'system-terms-manifest.json', page:'system.html' },
    { id:'management', label:'プロジェクト管理', manifest:'management-terms-manifest.json', page:'management.html' }
  ];
  const TEST_HISTORY_KEY = 'ap-study-test-history-v1';

  const els = {
    count:document.getElementById('question-count'), domain:document.getElementById('domain-mode'), mode:document.getElementById('question-mode'),
    difficulty:document.getElementById('difficulty-mode'), start:document.getElementById('start-test'), retry:document.getElementById('retry-wrongs'),
    restart:document.getElementById('restart-test'), testArea:document.getElementById('test-area'), questionBox:document.getElementById('question-box'),
    resultArea:document.getElementById('result-area'), dataStatus:document.getElementById('data-status')
  };

  let terms=[], bookmarkKeys=new Set(), questions=[], index=0, score=0, answered=false, review=[], wrongTerms=[];

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

  function maskAnswer(text, term) {
    let result=String(text||'');
    const labels=[term.term,...(term.aliases||[])].map(value=>String(value||'').trim()).filter(value=>value.length>=2).sort((a,b)=>b.length-a.length);
    for(const label of labels) result=result.replace(new RegExp(escapeRegExp(label),'gi'),'【この用語】');
    return result;
  }

  function shuffle(source) {
    const array=[...source];
    for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];}
    return array;
  }

  async function fetchJson(path) {
    const response=await fetch('../'+path,{cache:'no-store'});
    if(!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadDomain(domain) {
    const manifest=await fetchJson(domain.manifest);
    const payloads=await Promise.all((manifest.files||[]).map(item=>fetchJson(item.file)));
    return payloads.flatMap(payload=>payload.terms||[]).map(raw=>({
      ...raw,domain:domain.id,domainLabel:domain.label,page:domain.page,aliases:Array.isArray(raw.aliases)?raw.aliases:[]
    })).filter(term=>term.id&&term.term&&term.definition);
  }

  function loadBookmarks() {
    const items=window.APStudyUI?.getBookmarks?.()||(()=>{try{const value=JSON.parse(localStorage.getItem('ap-study-bookmarks-v1')||'[]');return Array.isArray(value)?value:[];}catch{return [];}})();
    bookmarkKeys=new Set(items.filter(item=>item?.domain&&item?.id).map(item=>`${item.domain}:${item.id}`));
  }

  function domainTerms() {
    if(els.domain.value==='all') return terms;
    if(els.domain.value==='bookmarks') return terms.filter(term=>bookmarkKeys.has(`${term.domain}:${term.id}`));
    return terms.filter(term=>term.domain===els.domain.value);
  }

  function distractorPool(){return els.domain.value==='bookmarks'?terms:domainTerms();}

  function updateCountLimit() {
    loadBookmarks();
    const available=domainTerms().length;
    els.count.max=Math.max(1,Math.min(100,available||1));
    if(available&&Number(els.count.value)>Number(els.count.max)) els.count.value=els.count.max;
    if(!available){
      els.start.disabled=true;
      els.dataStatus.textContent=els.domain.value==='bookmarks'?'復習リストが空です。用語ページで「☆ 復習」を付けると、ここから出題できます。':'この条件で出題できる用語がありません。';
      return;
    }
    els.start.disabled=false;
    els.dataStatus.textContent=els.domain.value==='bookmarks'?`復習リスト ${available}語から出題可能 / 全体 ${terms.length}語`:`${available}語から出題可能 / 全体 ${terms.length}語`;
  }

  function uniqueBy(items,getLabel){const seen=new Set();return items.filter(item=>{const label=getLabel(item);if(!label||seen.has(label))return false;seen.add(label);return true;});}

  function distractors(correct,pool,labelKey) {
    const sameCategory=pool.filter(term=>term.id!==correct.id&&term.domain===correct.domain&&term.category===correct.category);
    const sameDomain=pool.filter(term=>term.id!==correct.id&&term.domain===correct.domain);
    const allOther=terms.filter(term=>term.id!==correct.id);
    const ordered=els.difficulty.value==='similar'?[...shuffle(sameCategory),...shuffle(sameDomain),...shuffle(allOther)]:[...shuffle(sameDomain),...shuffle(allOther)];
    return uniqueBy(ordered,labelKey).slice(0,3);
  }

  function makeQuestion(term,pool) {
    let mode=els.mode.value;
    if(mode==='mixed') mode=Math.random()<.5?'definition-to-term':'term-to-definition';
    if(mode==='term-to-definition'){
      const others=distractors(term,pool,item=>item.definition);
      return {term,prompt:`「${term.term}」の説明として最も適切なものはどれか。`,detail:'',answer:term.definition,options:shuffle([term,...others]).map(item=>({label:item.definition,correct:item.id===term.id}))};
    }
    const others=distractors(term,pool,item=>item.term);
    return {term,prompt:'次の説明に該当する用語として最も適切なものはどれか。',detail:maskAnswer(term.definition,term),answer:term.term,options:shuffle([term,...others]).map(item=>({label:item.term,correct:item.id===term.id}))};
  }

  function buildQuestionSet(sourceTerms,count){const pool=distractorPool();return shuffle(sourceTerms).slice(0,Math.min(count,sourceTerms.length)).map(term=>makeQuestion(term,pool));}

  function start(sourceTerms=null) {
    loadBookmarks();
    const pool=sourceTerms||domainTerms();
    const requested=Math.max(1,Number(els.count.value||10));
    questions=buildQuestionSet(pool,requested);
    if(!questions.length){window.APStudyUI?.toast?.('出題できる用語がありません');updateCountLimit();return;}
    index=0;score=0;review=[];wrongTerms=[];
    els.resultArea.hidden=true;els.testArea.hidden=false;els.restart.hidden=false;els.retry.hidden=true;
    renderQuestion();
    els.testArea.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function renderQuestion() {
    answered=false;
    const q=questions[index];
    els.questionBox.innerHTML=`<div class="question-meta"><span>${index+1} / ${questions.length} 問</span><span class="question-tag">${escapeHtml(q.term.domainLabel)} / ${escapeHtml(q.term.category||'未分類')}</span></div><div class="question-title">${escapeHtml(q.prompt)}${q.detail?`<div class="question-detail">${escapeHtml(q.detail)}</div>`:''}</div><div class="option-grid">${q.options.map((option,i)=>`<button type="button" class="option-btn" data-index="${i}" data-correct="${option.correct}"><strong>${i+1}.</strong> ${escapeHtml(option.label)}</button>`).join('')}</div><div id="test-feedback" class="test-feedback" hidden></div><div class="test-actions"><button id="next-question" class="primary-link-btn" type="button" hidden>次へ</button></div><p class="kbd-note">キーボード: 1〜4で回答 / 回答後Enterで次へ</p>`;
    els.questionBox.querySelectorAll('.option-btn').forEach(button=>button.addEventListener('click',()=>choose(button)));
    document.getElementById('next-question').addEventListener('click',next);
  }

  function choose(button) {
    if(answered)return;
    answered=true;
    const q=questions[index],correct=button.dataset.correct==='true',feedback=document.getElementById('test-feedback'),nextButton=document.getElementById('next-question');
    els.questionBox.querySelectorAll('.option-btn').forEach(option=>{option.disabled=true;if(option.dataset.correct==='true')option.classList.add('correct');});
    if(correct){score+=1;feedback.innerHTML=`<strong>正解。</strong><br>${escapeHtml(q.term.term)}：${escapeHtml(q.term.definition)}`;}
    else{button.classList.add('wrong');wrongTerms.push(q.term);feedback.innerHTML=`<strong>不正解。</strong> 正解は「${escapeHtml(q.answer)}」。<br>${escapeHtml(q.term.term)}：${escapeHtml(q.term.definition)}`;}
    review.push({term:q.term,correct,answer:q.answer});
    feedback.innerHTML+=`<br><a href="${escapeHtml(q.term.page)}#${escapeHtml(q.term.id)}">辞書カードで確認 →</a>`;
    feedback.hidden=false;nextButton.hidden=false;nextButton.textContent=index+1>=questions.length?'結果を見る':'次へ';
  }

  function next(){index+=1;if(index>=questions.length)finish();else renderQuestion();}

  function sourceLabel() {
    if(els.domain.value==='bookmarks') return '☆ 復習リスト';
    if(els.domain.value==='all') return '6分野ミックス';
    return DOMAINS.find(item=>item.id===els.domain.value)?.label||'ランダム';
  }

  function saveHistory(percent) {
    let history=[];
    try{const value=JSON.parse(localStorage.getItem(TEST_HISTORY_KEY)||'[]');if(Array.isArray(value))history=value;}catch{}
    history.unshift({at:Date.now(),score,total:questions.length,percent,source:els.domain.value,sourceLabel:sourceLabel(),mode:els.mode.value,difficulty:els.difficulty.value});
    try{localStorage.setItem(TEST_HISTORY_KEY,JSON.stringify(history.slice(0,30)));}catch{}
  }

  function finish() {
    els.testArea.hidden=true;
    const percent=Math.round(score/questions.length*100),wrongs=review.filter(item=>!item.correct);
    saveHistory(percent);
    els.resultArea.hidden=false;
    els.resultArea.innerHTML=`<h2>結果：${score} / ${questions.length} 問（${percent}%）</h2><p>${wrongs.length?`間違えた ${wrongs.length} 問を下にまとめました。`:'全問正解です。'}</p><div class="review-list">${wrongs.map(item=>`<div class="review-item"><strong>${escapeHtml(item.term.term)}</strong><br>${escapeHtml(item.term.definition)}<br><a href="${escapeHtml(item.term.page)}#${escapeHtml(item.term.id)}">辞書で復習 →</a></div>`).join('')}</div>`;
    els.retry.hidden=wrongTerms.length===0;
    els.resultArea.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function init() {
    els.start.disabled=true;
    try{
      const loaded=await Promise.all(DOMAINS.map(loadDomain));
      terms=loaded.flat();
      loadBookmarks();
      if(new URLSearchParams(location.search).get('source')==='bookmarks')els.domain.value='bookmarks';
      updateCountLimit();
    }catch(error){console.error(error);els.dataStatus.textContent=`データ読み込み失敗: ${error.message}`;}
  }

  els.domain.addEventListener('change',updateCountLimit);
  els.start.addEventListener('click',()=>start());
  els.restart.addEventListener('click',()=>start());
  els.retry.addEventListener('click',()=>{const retryPool=[...new Map(wrongTerms.map(term=>[`${term.domain}:${term.id}`,term])).values()];els.count.value=retryPool.length;start(retryPool);});
  window.addEventListener('ap-bookmarks-changed',updateCountLimit);
  document.addEventListener('keydown',event=>{
    if(els.testArea.hidden)return;
    if(!answered&&/^[1-4]$/.test(event.key))els.questionBox.querySelector(`.option-btn[data-index="${Number(event.key)-1}"]`)?.click();
    else if(answered&&event.key==='Enter')document.getElementById('next-question')?.click();
  });
  document.addEventListener('DOMContentLoaded',init);
})();
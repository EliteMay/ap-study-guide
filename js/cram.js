(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const e = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const MS_DAY = 86400000;
  let topics = [];
  let activeId = null;
  let filter = 'all';
  const answered = new Map();

  function jstToday() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
    const part = k => parts.find(item => item.type === k)?.value;
    return [part('year'),part('month'),part('day')].join('-');
  }
  function utcDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const [year,month,day] = value.split('-').map(Number);
    const ms = Date.UTC(year,month - 1,day);
    if (new Date(ms).toISOString().slice(0,10) !== value) return NaN;
    return ms;
  }
  function daysUntil(date) {
    const ms = utcDay(date);
    return Number.isFinite(ms) ? Math.round((ms - utcDay(jstToday())) / MS_DAY) : NaN;
  }
  const params = new URLSearchParams(location.search);
  function restoreDate(id, param, fallback) {
    const value = params.get(param) || fallback;
    $(id).value = Number.isFinite(utcDay(value)) ? value : fallback;
  }

  function phaseInfo() {
    const a = daysUntil($('cram-date-a').value);
    const b = daysUntil($('cram-date-b').value);
    const phase = a >= 0 ? 'A' : b >= 0 ? 'B' : 'done';
    return {a,b,phase};
  }
  function showDays(value) {
    return !Number.isFinite(value) ? '日付未設定' : value < 0 ? '受験日を経過' : value === 0 ? '今日' : 'あと' + value + '日';
  }
  function sortedByPriority(phase) {
    const bFirst = ['security-chain','risk-availability','audit-service','pm-pert','db-relations','db-transaction','web-route'];
    return [...topics].sort((x,y) => phase === 'B'
      ? ((bFirst.indexOf(x.id) < 0 ? 100 : bFirst.indexOf(x.id)) - (bFirst.indexOf(y.id) < 0 ? 100 : bFirst.indexOf(y.id)) || x.priority - y.priority)
      : x.priority - y.priority);
  }
  function topicForToday(phase) {
    const pool = sortedByPriority(phase).filter(t => phase === 'B' || t.priority < 3);
    const stamp = Math.round(utcDay(jstToday()) / MS_DAY);
    return pool[stamp % pool.length] || topics[0];
  }
  function renderPlan() {
    if (!topics.length) return;
    const {a,b,phase} = phaseInfo();
    const selectedA = $('cram-date-a').value;
    const selectedB = $('cram-date-b').value;
    const validOrder = Number.isFinite(utcDay(selectedA)) && Number.isFinite(utcDay(selectedB)) && utcDay(selectedB) > utcDay(selectedA);
    $('cram-date-warning').textContent = validOrder ? '' : '科目Bは科目Aより後の日付に設定してください。日程はIPAと申込画面で確認してください。';
    $('cram-days-a').textContent = showDays(a);
    $('cram-days-b').textContent = showDays(b);
    $('cram-phase').textContent = phase === 'A' ? '科目A優先' : phase === 'B' ? '科目B優先' : '受験日を再設定';
    const mins = Number($('cram-minutes').value) || 60;
    const urgent = phase === 'A' && a <= 7;
    const reading = Math.max(5,Math.round(mins * (phase === 'B' ? .15 : urgent ? .15 : .3) / 5) * 5);
    const practice = Math.max(10,Math.round((mins - reading) * .7 / 5) * 5);
    const review = mins - reading - practice;
    const today = topicForToday(phase);
    $('cram-policy').textContent = phase === 'A'
      ? (urgent ? '直前期。新しい基礎を広げず、演習と誤答復習を中心にする。' : '仕組みを短く確認したら、すぐ科目Aの過去問へ進む。')
      : phase === 'B' ? '科目Aの日程後。科目Bの長文・記述と必須セキュリティに重点を移す。'
      : '設定した試験日が過ぎています。次の受験日を入力してください。';
    const target = phase === 'B' ? '科目Bの公開長文問題' : '科目Aの公開過去問';
    $('cram-today').innerHTML = '<div class="cram-today-head"><div><strong>今日のおすすめ</strong><h3>' + e(today.title) + '</h3><p>約' + today.minutes + '分で仕組みを整理。分かったら問題へ。</p></div><button type="button" id="cram-open-today">仕組みを見る →</button></div>'
      + '<ol class="cram-time-steps"><li><strong>' + reading + '分</strong><span>必要な仕組みだけ理解</span></li><li><strong>' + practice + '分</strong><span>' + target + 'を解く</span></li><li><strong>' + review + '分</strong><span>誤答理由をつなげ直す</span></li></ol>'
      + '<p class="cram-small">目安時間です。過去問の正解数が低いなら「過去問 → 関連する仕組みへ戻る」の順でも構いません。</p>';
    $('cram-open-today').addEventListener('click', () => openTopic(today.id,true));
  }

  function listTopics() {
    if (!topics.length) return;
    const shown = sortedByPriority(phaseInfo().phase).filter(t => filter === 'all' || t.category === filter);
    $('cram-topic-list').innerHTML = shown.map(t =>
      '<button type="button" class="cram-topic-item' + (activeId === t.id ? ' is-selected' : '') + '" data-topic-id="' + e(t.id) + '" aria-pressed="' + (activeId === t.id) + '"><span>' + e(t.category) + ' · 約' + t.minutes + '分</span><strong>' + e(t.title) + '</strong><small>重要度 ' + (t.priority === 1 ? '高' : t.priority === 2 ? '中' : '補足') + '</small></button>'
    ).join('') || '<p class="cram-empty">この条件の学習テーマはありません。</p>';
  }
  function openTopic(id, scroll = false) {
    const topic = topics.find(t => t.id === id);
    if (!topic) return;
    activeId = id;
    if (filter !== 'all' && filter !== topic.category) {
      filter = 'all';
      document.querySelectorAll('[data-topic-filter]').forEach(button => {
        const selected = button.dataset.topicFilter === 'all';
        button.classList.toggle('is-active',selected);
        button.setAttribute('aria-pressed',String(selected));
      });
    }
    const flow = topic.flow.map((step,i) => '<li><span>' + (i+1) + '</span><p>' + e(step) + '</p></li>').join('');
    const options = topic.choices.map((choice,i) => '<button type="button" class="cram-choice" data-choice="' + i + '">' + String.fromCharCode(65+i) + '. ' + e(choice) + '</button>').join('');
    const related = topic.lessons.map(ref => '<a href="lesson.html?id=' + encodeURIComponent(ref) + '">' + e(ref) + ' 詳しく →</a>').join('');
    $('cram-lesson').innerHTML = '<div class="cram-topic-head"><span class="cram-label">仕組みのつながり · ' + e(topic.category) + '</span><h3>' + e(topic.title) + '</h3></div>'
      + '<h4>なぜ必要？</h4><p>' + e(topic.why) + '</p>'
      + '<h4>どう動く？</h4><ol class="cram-flow">' + flow + '</ol>'
      + '<h4>単語同士のつながり</h4><p class="cram-bridge">' + e(topic.bridge) + '</p>'
      + '<h4>ここを間違えやすい</h4><p>' + e(topic.trap) + '</p>'
      + '<div class="cram-quiz"><span class="cram-label">理解確認 · オリジナル</span><h4>' + e(topic.question) + '</h4><div class="cram-choices">' + options + '</div><div id="cram-answer" class="cram-answer" aria-live="polite"></div></div>'
      + '<div class="cram-related"><strong>もっと詳しく必要なら</strong><div>' + related + '</div></div>';
    listTopics();
    $('cram-lesson').querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => answerTopic(topic,Number(button.dataset.choice))));
    if (answered.has(topic.id)) answerTopic(topic,answered.get(topic.id));
    const url = new URL(location.href);
    url.hash = 'topic=' + encodeURIComponent(id);
    history.replaceState(null,'',url.pathname + url.search + url.hash);
    if (scroll) $('cram-lesson').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
  }
  function answerTopic(topic, index) {
    answered.set(topic.id,index);
    const correct = index === topic.answer;
    $('cram-lesson').querySelectorAll('[data-choice]').forEach(button => {
      const value = Number(button.dataset.choice);
      button.classList.toggle('is-correct',value === topic.answer);
      button.classList.toggle('is-wrong',value === index && !correct);
      button.setAttribute('aria-pressed',String(value === index));
    });
    $('cram-answer').innerHTML = '<strong>' + (correct ? '正解。役割を区別できている。' : 'ここが復習ポイント。') + '</strong><p>' + e(topic.reasons[index]) + '</p><p><b>正しい考え方：</b>' + e(topic.reasons[topic.answer]) + '</p><p class="cram-small">※これは独自問題です。IPA公式問題の正誤ではありません。</p>';
  }
  async function init() {
    restoreDate('cram-date-a','a','2026-10-28');
    restoreDate('cram-date-b','b','2026-11-24');
    const response = await fetch('../json/cram/connections.json');
    if (!response.ok) throw new Error('教材の読み込みに失敗しました（HTTP ' + response.status + '）');
    const data = await response.json();
    topics = data.topics || [];
    if (!topics.length) throw new Error('教材がありません。');
    ['cram-date-a','cram-date-b','cram-minutes'].forEach(id => $(id).addEventListener('change', () => {
      const url = new URL(location.href);
      url.searchParams.set('a',$('cram-date-a').value);
      url.searchParams.set('b',$('cram-date-b').value);
      history.replaceState(null,'',url.pathname + url.search + url.hash);
      renderPlan();
      listTopics();
    }));
    document.querySelectorAll('[data-topic-filter]').forEach(button => button.addEventListener('click', () => {
      filter = button.dataset.topicFilter;
      document.querySelectorAll('[data-topic-filter]').forEach(other => {
        other.classList.toggle('is-active',other === button);
        other.setAttribute('aria-pressed',String(other === button));
      });
      listTopics();
    }));
    $('cram-topic-list').addEventListener('click', event => {
      const button = event.target.closest('[data-topic-id]');
      if (button) openTopic(button.dataset.topicId);
    });
    renderPlan();
    const hashId = location.hash.startsWith('#topic=') ? decodeURIComponent(location.hash.slice(7)) : '';
    openTopic(topics.some(topic => topic.id === hashId) ? hashId : topicForToday(phaseInfo().phase).id);
  }
  document.addEventListener('DOMContentLoaded', () => init().catch(error => {
    console.error(error);
    $('cram-topic-list').textContent = '教材の読み込みに失敗しました。再読み込みしてください。';
    $('cram-lesson').textContent = error.message;
    $('cram-today').textContent = '教材が読み込めないため計画を表示できません。';
  }));
})();
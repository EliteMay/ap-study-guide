(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  // 学習用の着眼点はAP Study Guide独自の内容です。IPAの設問別模範解答ではありません。
  const SOLVE_GUIDES = {
    '情報セキュリティ':['攻撃の入口 → 権限・設定の弱点 → 被害の拡大 → 対策の順で因果関係を整理する。','認証・認可・ネットワーク制御・監視の役割を混ぜず、設問が求める対策の位置を確かめる。'],
    '経営戦略':['誰のどの課題を解決するのか、競争優位と数字の根拠を分けて読む。','戦略の目標と具体的な施策、測定するKPIを対応させる。'],
    'プログラミング':['変数と配列の意味を先に定義し、小さな入力で1ステップずつ状態を表にする。','ループの終了条件や再帰・探索の不変条件を確認する。'],
    'システムアーキテクチャ':['利用者・サーバー・ネットワーク間の処理とデータの流れを図にする。','性能、可用性、保守性など要求ごとの理由を明確にする。'],
    'ネットワーク':['端末・スイッチ・ルーター・DNSなどを並べ、どこまで通信できるか順番に追う。','IPアドレス・経路・名前解決・ポート・フィルタを混同しない。'],
    'データベース':['テーブル間の主キー・外部キーの対応を先に確認する。','更新異常、正規化、JOIN、トランザクションのどれが課題か区別する。'],
    '組込みシステム開発':['入力センサ → 条件判断 → 状態変更 → 出力アクチュエータの流れを整理する。','時間条件・例外・状態遷移の境界を見落とさない。'],
    '情報システム開発':['利用者操作 → 要件 → 設計・テストへの反映をたどる。','正常系だけでなく誤入力・通信失敗・復旧などの異常系も確認する。'],
    'プロジェクトマネジメント':['作業依存・期間・リスクのうち、何が納期や費用を変えるか特定する。','プロジェクトの変更前と変更後の差から理由を導く。'],
    'サービスマネジメント':['利用者への影響と、復旧・原因除去・再発防止の目的を切り分ける。','SLA、対応手順、担当者、運用実績の関係を確認する。'],
    'システム監査':['監査目的 → リスク → 統制 → 必要な証拠の順で考える。','監査人による独立した評価と運用担当者による実際の対応を分ける。']
  };

  let data = null;
  let curriculum = null;

  async function fetchJson(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  function unitLabel(id) { return (curriculum.studyUnits || []).find(unit => unit.id === id)?.title || id; }
  function allQuestions() { return (data.exams || []).flatMap(exam => (exam.questions || []).map(question => ({ ...question, exam }))); }

  function renderSummary(filtered) {
    const lessons = new Set(filtered.flatMap(item => item.lessonRefs || []));
    const units = new Set(filtered.map(item => item.primaryUnitId));
    const required = filtered.filter(item => item.selection === 'required').length;
    $('official-summary').innerHTML = `<div><strong>${filtered.length}</strong><span>表示中の大問</span></div><div><strong>${units.size}</strong><span>主学習ユニット</span></div><div><strong>${lessons.size}</strong><span>関連Lesson</span></div><div><strong>${required}</strong><span>必須問題</span></div>`;
  }

  function questionCard(item) {
    const required = item.selection === 'required';
    return `<article class="official-question-card"><div class="official-question-head"><span class="official-qno">問${item.number}</span><span class="official-domain">${escapeHtml(item.domain)}</span><span class="official-selection ${required ? 'required' : ''}">${required ? '必須' : '選択'}</span></div><h3>${escapeHtml(item.topic)}</h3><p class="official-unit-label">主学習ユニット：${escapeHtml(unitLabel(item.primaryUnitId))}</p><div class="official-lessons">${(item.lessonRefs || []).map(id => `<a href="lesson.html?id=${encodeURIComponent(id)}">${escapeHtml(id)}</a>`).join('')}</div><details class="official-guide"><summary>解説の着眼点（独自）</summary><p>この題材では、まず次の関係を理解してから公式問題を解きます。</p><ul>${(SOLVE_GUIDES[item.domain] || ['問題文の条件と選択肢・設問の関係を整理する。']).map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul><p class="official-guide-note">これは設問ごとの模範解答ではありません。正答はIPA公式の解答例を確認してください。</p><a href="${escapeHtml(item.exam.officialPageUrl)}" target="_blank" rel="noopener noreferrer">IPA公式の解答例を確認 ↗</a></details></article>`;
  }

  function renderExams(filtered) {
    const groups = (data.exams || []).map(exam => {
      const items = filtered.filter(item => item.exam.id === exam.id);
      if (!items.length) return '';
      return `<section class="official-exam-block"><div class="official-exam-heading"><div><p>${escapeHtml(exam.id)}</p><h2>${escapeHtml(exam.seasonLabel)} AP ${escapeHtml(exam.legacySubjectName)}</h2><span>現在の名称では ${escapeHtml(exam.currentSubjectName)} · ${escapeHtml(exam.selectionRule)}</span></div><div class="official-source-actions"><a href="${escapeHtml(exam.officialQuestionPdfUrl)}" target="_blank" rel="noopener noreferrer">公式問題PDF</a><a href="${escapeHtml(exam.officialPageUrl)}" target="_blank" rel="noopener noreferrer">IPA掲載ページ</a></div></div><div class="official-question-grid">${items.map(questionCard).join('')}</div></section>`;
    }).filter(Boolean);
    $('official-exams').innerHTML = groups.length ? groups.join('') : '<div class="official-empty">条件に一致する公開問題がありません。</div>';
  }

  function applyFilters() {
    const season = $('official-season').value;
    const unit = $('official-unit').value;
    const selection = $('official-selection').value;
    const filtered = allQuestions().filter(item => (season === 'all' || item.exam.season === season) && (unit === 'all' || item.primaryUnitId === unit) && (selection === 'all' || item.selection === selection));
    renderSummary(filtered); renderExams(filtered);
  }

  async function init() {
    [data,curriculum] = await Promise.all([fetchJson('json/past/ap-public-exams.json'),fetchJson('json/curriculum/ap-2026-map.json')]);
    const usedUnits = new Set(allQuestions().map(item => item.primaryUnitId));
    const options = [...(curriculum.studyUnits || [])].filter(unit => usedUnits.has(unit.id)).sort((a,b) => Number(a.order)-Number(b.order)).map(unit => `<option value="${escapeHtml(unit.id)}">${escapeHtml(unit.title)}</option>`).join('');
    $('official-unit').insertAdjacentHTML('beforeend',options);
    ['official-season','official-unit','official-selection'].forEach(id => $(id).addEventListener('change',applyFilters));
    applyFilters();
  }

  document.addEventListener('DOMContentLoaded', () => init().catch(error => { console.error(error); $('official-exams').innerHTML = `<div class="official-empty">公式問題対応表の読み込みに失敗しました: ${escapeHtml(error.message)}</div>`; }));
})();
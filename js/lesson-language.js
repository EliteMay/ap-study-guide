(() => {
  'use strict';

  const replacements = [
    ['Structured Lesson','構造化レッスン'],
    ['Open Standard','オープン標準'],
    ['Open Loop','オープンループ'],
    ['Closed Loop','クローズドループ'],
    ['Cost Leadership','コストリーダーシップ'],
    ['Differentiation','差別化'],
    ['Internal Resource','内部資源'],
    ['Business System','業務システム'],
    ['Enterprise Architecture','エンタープライズアーキテクチャ'],
    ['Technology Roadmap','技術ロードマップ'],
    ['Smart Factory','スマートファクトリー'],
    ['Supply Chain','サプライチェーン'],
    ['Set Point','目標値'],
    ['Controller','制御器'],
    ['Plant','制御対象'],
    ['Sampling','サンプリング'],
    ['Feedback','フィードバック'],
    ['Framework','フレームワーク'],
    ['Marketing','マーケティング'],
    ['Position','ポジション'],
    ['Segment','対象市場'],
    ['Share','シェア'],
    ['Cash','キャッシュ'],
    ['Cost','コスト'],
    ['Brand','ブランド'],
    ['Server','サーバ'],
    ['System','システム'],
    ['Database','データベース'],
    ['Program','プログラム'],
    ['Media','メディア'],
    ['Data Center','データセンター'],
    ['Data','データ'],
    ['Analog','アナログ'],
    ['Digital','デジタル'],
    ['Parameter','パラメータ'],
    ['Polling','ポーリング'],
    ['Round Robin','ラウンドロビン'],
    ['Underflow','アンダーフロー'],
    ['Balance Sheet','貸借対照表'],
    ['Outsourcing','アウトソーシング'],
    ['Compliance','コンプライアンス'],
    ['Software License','ソフトウェアライセンス'],
    ['Open Source','オープンソース'],
    ['Case','事例問題'],
    ['Lesson','レッスン']
  ];

  const contentTypeLabels = {
    concept:'基本概念', text:'丁寧な解説', calculation:'計算', diagram:'図解', comparison:'比較',
    'code-trace':'処理を追う', exercise:'演習', 'worked-example':'例題', steps:'手順', mistakes:'つまずき対策',
    reference:'用語整理', process:'流れ', architecture:'構成', hardware:'ハードウェア', interaction:'操作', case:'事例',
    evaluation:'評価', 'information-architecture':'情報設計', media:'メディア', performance:'性能', facility:'設備', audit:'監査',
    strategy:'戦略', governance:'統制', adoption:'導入・定着', measurement:'測定', marketing:'マーケティング',
    'technology-strategy':'技術戦略', roadmap:'ロードマップ', 'business-system':'業務システム', engineering:'エンジニアリング',
    iot:'IoT', organization:'組織', control:'管理', accounting:'会計', finance:'財務', law:'法務', ethics:'倫理', standards:'標準化'
  };

  function localizeText(value) {
    let text = String(value ?? '');
    for (const [from,to] of replacements) {
      const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const asciiWord = /^[A-Za-z][A-Za-z ]+$/.test(from);
      const pattern = asciiWord ? new RegExp(`\\b${escaped}\\b`, 'g') : new RegExp(escaped, 'g');
      text = text.replace(pattern,to);
    }
    return text;
  }

  function contentTypeLabel(value) {
    const key = String(value || '').trim();
    return contentTypeLabels[key] || '学習';
  }

  function flattenText(value, output = []) {
    if (typeof value === 'string') output.push(value);
    else if (Array.isArray(value)) value.forEach(item => flattenText(item,output));
    else if (value && typeof value === 'object') Object.values(value).forEach(item => flattenText(item,output));
    return output;
  }

  function collectTermHelp(lesson, dictionary, limit = 8) {
    const haystack = ` ${flattenText(lesson).join(' ')} `;
    const upper = haystack.toUpperCase();
    const terms = Array.isArray(dictionary?.terms) ? dictionary.terms : [];
    const found = [];
    for (const item of terms) {
      const matches = Array.isArray(item.match) ? item.match : [item.term];
      const hit = matches.some(token => upper.includes(String(token || '').toUpperCase()));
      if (hit) found.push(item);
      if (found.length >= limit) break;
    }
    return found;
  }

  window.APLearningLanguage = { localizeText, contentTypeLabel, collectTermHelp };
})();
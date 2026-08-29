# AP Study Notes

応用情報技術者試験（AP）の学習用Webサイトです。

このGitHubリポジトリ `EliteMay/ap-study-notes` を正本として管理します。今後は原則としてChatGPTがGitHub上の最新版を確認し、そのまま修正します。ZIPやCodexを通常フローにはしません。

## 目的

用語を暗記するだけでなく、次をつなげて理解できるサイトを目指します。

- 短い定義
- 初心者向け説明
- 具体例
- 試験での出方
- ひっかけ
- 午後問題での使い方
- 関連用語
- テスト・過去問による定着

現在のHTML構成やUIは固定仕様ではありません。より分かりやすく、軽く、保守しやすくなるなら大きく変更して構いません。

## 現在公開している主な機能

| 機能 | 状態 |
|---|---|
| 情報セキュリティ用語 | 公開中・501語 |
| ネットワーク用語 | 公開中・480語 |
| データベース用語 | 公開中・229語 |
| セキュリティ午後過去問 | 公開中・7問 |
| 選択式テスト | 公開中・改善予定 |
| アルゴリズム | 準備中 |
| システム開発 | 準備中 |
| プロジェクト管理 | 準備中 |

## 現在の構成

```text
/
├─ index.html
├─ README.md
├─ .nojekyll
│
├─ css/
│  ├─ style.css          # 全体共通
│  ├─ home.css           # ホーム専用
│  └─ term-page.css      # 用語ページ共通
│
├─ js/
│  ├─ home.js            # ホームの件数・進捗集計
│  └─ term-page.js       # 用語ページ共通エンジン
│
├─ html/
│  ├─ security.html
│  ├─ network.html
│  ├─ database.html
│  ├─ security-past.html
│  ├─ test.html
│  ├─ algorithm.html
│  ├─ system.html
│  ├─ management.html
│  └─ template.html
│
├─ *-terms-manifest.json
├─ *-details-manifest.json
├─ security-past-index.json
│
├─ json/
│  ├─ terms/
│  ├─ details/
│  ├─ past/
│  └─ past-problems/
│
├─ sources/              # 過去問PDF
├─ tools/
│  └─ check-json.html
└─ docs/
   ├─ 仕様書.md
   ├─ 作業報告書.md
   └─ ai/
```

## 用語ページの設計

情報セキュリティ・ネットワーク・データベースは、同じ表示エンジン `js/term-page.js` を使います。

各HTMLは、ページ固有の説明と次の設定だけを持ちます。

```js
window.TERM_PAGE_CONFIG = {
  subject: '情報セキュリティ',
  termsManifest: 'security-terms-manifest.json',
  detailsManifest: 'security-details-manifest.json',
  storageKey: 'security-terms-checked',
  fallbackIdPrefix: 'sec',
  rootPath: '../'
};
```

共通機能:

- JSON読み込み
- 検索
- カテゴリ絞り込み
- 単語一覧生成
- 詳細解説展開
- 用語間リンク
- URLハッシュから該当カードを開く
- 習得済みチェック
- 進捗保存
- 目次ハイライト
- ID・term・categoryの基本整合警告

新しい用語単元を追加するときは `html/template.html` を使い、同じ処理をHTMLへコピーしないでください。

## データ構成

### 軽量用語

`json/terms/*.json`

主なフィールド:

- `id`
- `term`
- `aliases`
- `category`
- `definition`

検索・一覧表示に必要な短い情報だけを入れます。

### 詳細解説

`json/details/*.json`

主なフィールド:

- `id`
- `term`
- `category`
- `level`
- `tags`
- `beginner`
- `example`
- `examPoint`
- `trap`
- `deepDive`
- `relatedConcepts`
- `commonMistakes`
- `afternoonUse`
- `howToRemember`

用語JSONと詳細JSONは `id`・`term`・`category` を対応させます。

### 過去問

- 索引: `security-past-index.json`
- 問題文・設問: `json/past-problems/`
- 解説: `json/past/`
- PDF原本: `sources/`

解説側 `sections[].answerTargets` と問題文側 `questions[].targets` は一致させます。

## 保存データ

習得済み状態は `localStorage` に保存します。

| 単元 | キー |
|---|---|
| 情報セキュリティ | `security-terms-checked` |
| ネットワーク | `network-terms-checked` |
| データベース | `database-terms-checked` |

これらのキーや既存用語IDを変更すると進捗が消える可能性があります。変更自体は禁止ではありませんが、必要なら移行処理を用意してください。

## 利用方法

静的サイトなのでビルドは不要です。

### GitHub Pages

GitHub Pagesを有効にした場合は、ルートの `index.html` からそのまま利用できます。

想定URL:

`https://elitemay.github.io/ap-study-notes/`

`.nojekyll` は配置済みです。

### ローカル

JSONを `fetch()` するため、`file://` 直開きではなくLive Server等のHTTPサーバ経由で開いてください。

## 品質チェック

`tools/check-json.html` をHTTP経由で開き、チェックを実行します。

現在の検査対象:

- セキュリティ用語・詳細
- ネットワーク用語・詳細
- データベース用語・詳細
- マニフェスト件数
- ID重複
- term重複
- 用語と詳細のID対応
- term/category不一致
- 過去問索引と解説JSON
- 問題文JSONの存在
- `answerTargets` / `expectedAnswers`
- 問題文 `targets` と解説 `answerTargets` の一致

`ERROR 0` を基本的な完了条件とします。

## 変更時に特に注意するもの

今の画面構成を守る必要はありませんが、以下は壊すと影響が大きいため慎重に扱います。

- localStorageの進捗
- 用語ID
- マニフェストと実データの対応
- 過去問の年度・問番号・PDF対応
- 問題文JSONと解説JSONの設問対応
- GitHub Pagesでの相対パス

## 現在分かっている改善対象

### 1. テストページ

`html/test.html` は昔の用語データをHTML内JavaScriptに別管理しており、現在の用語JSONと二重管理になっています。

今後は次の形へ移行します。

- 通常問題: 最新のセキュリティ/ネットワーク/DB JSONから生成
- 手作りのAP本番風問題: 専用JSONへ分離して維持
- 苦手問題・正答率などの学習履歴を追加検討

手作り問題を失わないため、今回の整理ではまだ置き換えていません。

### 2. 過去問ページ

過去のデータには `studyChecklist` と `reviewChecklist` など、時期によるフィールド名の揺れがあります。画面側またはデータ側を次回整理します。

### 3. 実ブラウザ検証

GitHub上のファイル構成・コードは確認できますが、今回の作業ではGitHub Pages上での実クリック確認までは実施できていません。

## 開発方針

優先順位:

1. 操作性
2. 分かりやすさ・学習効果
3. 軽量さ
4. 保守・修正のしやすさ
5. 見た目

大きく変えた方が良い場合は、現在の構成を守ることより改善を優先します。ただしデータ破損や進捗消失を伴う変更は、影響を確認してから行います。

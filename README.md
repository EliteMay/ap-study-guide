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
| 選択式テスト | 公開中・3分野の最新JSON連動 |
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
│  ├─ term-page.css      # 用語ページ共通
│  ├─ past.css           # 過去問ページ専用
│  └─ test.css           # テスト専用
│
├─ js/
│  ├─ home.js            # ホームの件数・進捗集計
│  ├─ term-page.js       # 用語ページ共通エンジン
│  ├─ past.js            # 過去問表示エンジン
│  └─ test.js            # 最新用語JSONからテスト生成
│
├─ html/
│  ├─ security.html
│  ├─ network.html
│  ├─ database.html
│  ├─ security-past.html
│  ├─ test.html
│  ├─ test-legacy.html   # 旧手作り問題の一時保存
│  ├─ algorithm.html
│  ├─ system.html
│  ├─ management.html
│  └─ template.html
│
├─ *-terms-manifest.json
├─ *-details-manifest.json
├─ security-past-index.json
├─ json/
│  ├─ terms/
│  ├─ details/
│  ├─ past/
│  └─ past-problems/
├─ sources/
├─ tools/check-json.html
└─ docs/
```

## 用語ページ

情報セキュリティ・ネットワーク・データベースは同じ `js/term-page.js` と `css/term-page.css` を使います。

各HTMLはページ固有の説明と `window.TERM_PAGE_CONFIG` を中心に持ち、検索・カード生成・進捗処理を個別コピーしません。

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

新しい用語単元を追加するときは `html/template.html` を使います。

## データ構成

### 軽量用語

`json/terms/*.json`

主なフィールド: `id`, `term`, `aliases`, `category`, `definition`

### 詳細解説

`json/details/*.json`

主なフィールド:

`id`, `term`, `category`, `level`, `tags`, `beginner`, `example`, `examPoint`, `trap`, `deepDive`, `relatedConcepts`, `commonMistakes`, `afternoonUse`, `howToRemember`

用語JSONと詳細JSONは `id`・`term`・`category` を対応させます。

## セキュリティ過去問

- 表示: `html/security-past.html`
- ロジック: `js/past.js`
- スタイル: `css/past.css`
- 索引: `security-past-index.json`
- 問題文・設問: `json/past-problems/`
- 解説: `json/past/`
- PDF原本: `sources/`

解説側 `sections[].answerTargets` と問題文側 `questions[].targets` は一致させます。

過去データの世代差として `studyChecklist` / `reviewChecklist` の両方を表示側で吸収します。問題文の `choices` も文字列形式と `{key,text}` 形式の両方を表示できます。

関連用語は `security.html#用語ID` へリンクし、辞書側で対象カードを開きます。

## テスト

通常テスト `html/test.html` は、セキュリティ・ネットワーク・データベースの最新用語JSONから問題を生成します。

現在の機能:

- 3分野ミックス / 分野指定
- 問題数指定
- 説明→用語 / 用語→説明 / ミックス
- 同カテゴリ中心の紛らわしい選択肢
- 正解語・別名が説明文に含まれる場合の自動マスク
- 1〜4キー回答、Enterで次へ
- 間違えた問題だけ再テスト
- 辞書カードへの復習リンク

以前の手作りAP本番風問題は `html/test-legacy.html` に一時保存しています。今後、良い問題だけを専用JSONへ抽出した後にlegacyページを削除できます。

## 保存データ

習得済み状態は `localStorage` に保存します。

| 単元 | キー |
|---|---|
| 情報セキュリティ | `security-terms-checked` |
| ネットワーク | `network-terms-checked` |
| データベース | `database-terms-checked` |

これらのキーや既存用語IDを変更すると進捗が消える可能性があります。必要なら移行処理を用意します。

## 利用方法

静的サイトなのでビルドは不要です。

### GitHub Pages

GitHub Pagesを有効にした場合はルートの `index.html` から利用できます。

想定URL: `https://elitemay.github.io/ap-study-notes/`

`.nojekyll` は配置済みです。

### ローカル

JSONを `fetch()` するため、`file://` 直開きではなくLive Server等のHTTPサーバ経由で開いてください。

## 品質チェック

`tools/check-json.html` をHTTP経由で開きます。

検査対象:

- セキュリティ / ネットワーク / DB の用語・詳細
- マニフェスト件数
- ID重複・term重複
- 用語と詳細のID / term / category対応
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

## 現在の次候補

1. `test-legacy.html` から価値のある本番風問題だけを専用JSONへ抽出し、新テストへ統合。
2. `studyChecklist` / `reviewChecklist` など過去問データ自体のフィールドを統一（表示側は既に両対応）。
3. アルゴリズム・システム開発・プロジェクト管理を追加。
4. `css/style.css` に残る旧ページ由来の未使用スタイルを精査して削減。
5. GitHub Pagesを有効化し、主要導線を実ブラウザ検証。

## 開発方針

優先順位:

1. 操作性
2. 分かりやすさ・学習効果
3. 軽量さ
4. 保守・修正のしやすさ
5. 見た目

大きく変えた方が良い場合は、現在の構成を守ることより改善を優先します。ただしデータ破損や進捗消失を伴う変更は影響を確認してから行います。

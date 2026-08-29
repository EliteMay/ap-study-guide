# AP Study Notes

応用情報技術者試験（AP）の個人学習用Webアプリです。

このGitHubリポジトリ `EliteMay/ap-study-notes` を正本として管理し、通常の改修はChatGPTからGitHub上の最新版を直接確認・修正します。

## 目的

単語帳を大量に並べるだけではなく、次の流れで知識を定着させることを目的にしています。

**理解する → 怪しい用語を復習リストへ残す → テストする → 過去問で使う → 習得済みにする**

現在のUIやフォルダ構成は固定仕様ではありません。操作性・分かりやすさ・軽量性・保守性が上がるなら再設計して構いません。

## 現在の主要機能

| 機能 | 状態 |
|---|---|
| 情報セキュリティ | 公開中・501語 |
| ネットワーク | 公開中・480語 |
| データベース | 公開中・229語 |
| セキュリティ午後過去問 | 公開中・7問 |
| 最新JSON連動テスト | 公開中 |
| ☆ 復習リスト | 公開中 |
| 最近見た用語 / 続きから | 公開中 |
| ダークモード | 公開中 |
| PCサイドバー / スマホドロワー | 公開中 |
| データ整合ブラウザテスト | `tests/` に追加済み |
| アルゴリズム | 準備中 |
| システム開発 | 準備中 |
| プロジェクト管理 | 準備中 |

現在の3分野合計は **1210語** です。

## 他の自作GitHubから横展開した設計

APサイトだけを単独で改善せず、同じGitHubアカウント内の他プロジェクトで使いやすかった設計をAP向けに再利用しています。

- **VReview**: 左サイドバー、Dashboard、現在バージョン表示、次にやることが分かる導線
- **LyricTube**: 小画面でサイドバーをドロワー化、safe-area対応、PC/スマホで操作を崩しにくい構成
- **DesignShelf**: localStorage状態管理、ダークモード、トースト通知、お気に入り方式
- **ASMRTube**: `tests/` をサイト本体から分離して、壊れやすいデータ処理を検査する構成

見た目をコピーするのではなく、AP学習に意味がある部分だけ採用しています。

## 学習Dashboard

ホーム `index.html` は単なるリンク一覧ではなくDashboardとして使います。

表示内容:

- 全体の習得済み語数
- 復習リスト件数
- 最後に見た用語から「続きから」
- 最近見た用語 最大5件
- 分野別進捗
- 過去問・テストへの導線

学習履歴や復習リストはブラウザのlocalStorageに保存します。

## 共通アプリシェル

共通UI:

- `css/shell.css`
- `js/shell.js`

主な機能:

- PC: 固定左サイドバー
- 920px以下: ハンバーガー式ドロワー
- モバイルsafe-area考慮
- ダーク / ライトテーマ
- テーマ状態保存
- 現在BUILD表示
- 共通ランダムテスト導線
- トースト通知
- `/` キーでページ内検索へ移動
- `Esc` でモバイルメニューを閉じる
- `prefers-reduced-motion` 対応

現在BUILD: `2026.08.29-r3`

## 用語ページ

対象:

- `html/security.html`
- `html/network.html`
- `html/database.html`

共通エンジン:

- `js/term-page.js`
- `css/term-page.css`

各HTMLは `window.TERM_PAGE_CONFIG` だけで、分野名・マニフェスト・保存キー等を指定します。

共通機能:

- JSON読み込み
- リアルタイム検索
- カテゴリ絞り込み
- 単語一覧自動生成
- 詳細解説の遅延描画
- 用語間リンク
- URLハッシュから対象用語を直接開く
- 隠して確認
- 習得済みチェック
- ☆ 復習リスト追加/解除
- 復習リストだけ表示
- 最近見た用語の記録
- 進捗保存
- 目次ハイライト
- ID / term / category の基本整合警告

## ☆ 復習リスト

用語カードの `☆ 復習` を押すと、3分野共通の復習リストへ保存されます。

利用方法:

1. 分からない・怪しい用語へ `☆ 復習`
2. 用語ページで `☆ 復習リスト` フィルタを押す
3. ホームで復習件数と分野別内訳を確認
4. テストの出題元を `☆ 復習リスト` にする
5. 理解できたら復習リストから外す / 習得済みにする

## テスト

現行版:

- `html/test.html`
- `css/test.css`
- `js/test.js`

辞書と別の古い用語一覧を持たず、3分野の正式JSONから直接出題します。

機能:

- 3分野ミックス
- 分野指定
- ☆ 復習リストだけ出題
- 問題数指定
- 説明 → 用語
- 用語 → 説明
- ミックス
- 同カテゴリ中心の紛らわしい選択肢
- 説明中に正解語・別名が含まれる場合の自動マスク
- 1〜4キー回答
- Enterで次へ
- 間違えた問題だけ再テスト
- 辞書カードへの復習リンク

旧手作り問題は `html/test-legacy.html` に退避しています。良い問題だけ後で専用JSONへ移す予定です。

## セキュリティ過去問

- 表示: `html/security-past.html`
- ロジック: `js/past.js`
- スタイル: `css/past.css`
- 索引: `security-past-index.json`
- 問題文: `json/past-problems/`
- 解説: `json/past/`
- PDF: `sources/`

解説 `sections[].answerTargets` と問題文 `problem.questions[].targets` を同じ設問単位で対応させます。

古いデータの `studyChecklist` / `reviewChecklist`、複数のchoices形式は表示側で吸収します。

## データ構成

### 軽量用語

`json/terms/*.json`

主なフィールド:

`id`, `term`, `aliases`, `category`, `definition`

### 詳細解説

`json/details/*.json`

主なフィールド:

`id`, `term`, `category`, `level`, `tags`, `beginner`, `example`, `examPoint`, `trap`, `deepDive`, `relatedConcepts`, `commonMistakes`, `afternoonUse`, `howToRemember`

terms/detailsは `id`・`term`・`category` を対応させます。

## localStorage

| 用途 | キー |
|---|---|
| セキュリティ習得済み | `security-terms-checked` |
| ネットワーク習得済み | `network-terms-checked` |
| DB習得済み | `database-terms-checked` |
| 復習リスト | `ap-study-bookmarks-v1` |
| 最近見た用語 | `ap-study-recent-v1` |
| テーマ | `ap-study-theme` |

既存用語IDやこれらのキーを変更する場合、学習データ移行を検討します。

## ファイル構成

```text
/
├─ index.html
├─ README.md
├─ .nojekyll
├─ css/
│  ├─ style.css
│  ├─ shell.css
│  ├─ home.css
│  ├─ term-page.css
│  ├─ past.css
│  └─ test.css
├─ js/
│  ├─ shell.js
│  ├─ home.js
│  ├─ term-page.js
│  ├─ past.js
│  └─ test.js
├─ html/
│  ├─ security.html
│  ├─ network.html
│  ├─ database.html
│  ├─ security-past.html
│  ├─ test.html
│  ├─ test-legacy.html
│  ├─ algorithm.html
│  ├─ system.html
│  ├─ management.html
│  └─ template.html
├─ json/
│  ├─ terms/
│  ├─ details/
│  ├─ past/
│  └─ past-problems/
├─ sources/
├─ tools/
│  └─ check-json.html
├─ tests/
│  ├─ data-integrity.test.html
│  └─ README.md
└─ docs/
```

## 品質チェック

### 手動チェック画面

`tools/check-json.html`

### 自動ブラウザテスト

`tests/data-integrity.test.html`

GitHub PagesまたはLive Serverで開くと自動実行します。

主な検査:

- 3分野のmanifest countと実JSON件数
- 用語ID重複
- 用語名重複
- term/detail ID対応
- term/category対応
- 過去問解説と問題文JSONの存在
- `answerTargets` と `targets` の一致
- 解説済み設問の答案情報

## GitHub Pages

ビルド不要の静的構成です。

想定URL:

`https://elitemay.github.io/ap-study-notes/`

`.nojekyll` は配置済みです。

JSONをfetchするため、ローカル利用では `file://` 直開きではなくLive Server等のHTTPサーバを使います。

## 変更時に慎重に扱うもの

現在の見た目やHTML構成を守る必要はありませんが、以下は破壊すると学習データへ影響するため注意します。

- localStorageキー
- 用語ID
- manifestと実JSONの対応
- 過去問ID
- 年度 / 問番号 / PDF対応
- 問題文と解説の設問対応
- GitHub Pagesの相対パス

## 次の主要改善候補

1. `test-legacy.html` の良質な手作り問題を専用JSONへ移し、本番風モードへ統合。
2. アルゴリズム・システム開発・プロジェクト管理を正式JSON単元として追加。
3. Dashboardに弱点傾向・テスト履歴を追加。
4. `css/style.css` の未使用旧スタイルを削減。
5. GitHub Pages上でPC/スマホの実操作確認。

## 開発優先順位

1. 操作性
2. 分かりやすさ・学習効果
3. 軽量化
4. 保守・修正しやすさ
5. 見た目

# AP Study Notes

応用情報技術者試験（AP）の個人学習用Webアプリです。

**v1.0 / BUILD `2026.08.29-r4`**

このGitHubリポジトリ `EliteMay/ap-study-notes` を正本として管理します。通常の改修はChatGPTからGitHub上の最新版を直接確認・修正し、ZIPやCodexを通常フローにはしません。

## 目的

単語を読むだけではなく、次の流れを1つのサイトで回せることを目的にしています。

**理解する → 怪しい用語を☆復習へ残す → テストする → 過去問で使う → 習得済みにする → Dashboardから続ける**

## v1.0の完成範囲

| 分野 | 用語数 | 詳細方式 | 状態 |
|---|---:|---|---|
| 情報セキュリティ | 501 | 個別詳細JSON | 公開中 |
| ネットワーク | 480 | 個別詳細JSON | 公開中 |
| データベース | 229 | 個別詳細JSON | 公開中 |
| アルゴリズム | 65 | 共通エンジン生成詳細 | 公開中 |
| システム開発 | 75 | 共通エンジン生成詳細 | 公開中 |
| プロジェクト管理 | 72 | 共通エンジン生成詳細 | 公開中 |

**合計 1422語**。

加えて、情報セキュリティ午後過去問7問、6分野4択テスト、復習リスト、学習履歴、テスト履歴、ダークモード、PC/スマホ共通ナビを実装しています。

## GitHub Pages

GitHub Pagesは有効です。

`https://elitemay.github.io/ap-study-notes/`

GitHub側の Pages build and deployment が成功することを確認しています。`.nojekyll` も配置済みです。

ローカルで利用する場合、JSONを `fetch()` するため `file://` 直開きではなくLive Server等のHTTPサーバを使ってください。

## Dashboard

ホーム `index.html` は学習Dashboardです。

表示内容:

- 6単元の公開状態
- 収録用語総数
- 習得済み総数
- 各単元の進捗
- ☆復習リスト件数・分野別内訳
- 最後に見た用語から「続きから」
- 最近見た用語 最大5件
- 直近のテスト結果
- 過去問件数

## 用語ページ

6分野すべて同じ共通エンジンを使います。

- `js/term-page.js`
- `css/term-page.css`

各ページは `window.TERM_PAGE_CONFIG` で分野固有設定だけを指定します。

共通機能:

- JSON / manifest読み込み
- リアルタイム検索
- カテゴリ絞り込み
- 用語一覧自動生成
- 詳細解説の遅延描画
- 用語間リンク
- URLハッシュから該当カードを直接開く
- 隠して確認
- ✓ 習得済み
- ☆ 復習リスト
- 復習リストだけ表示
- 最近見た用語の記録
- 進捗保存
- 目次ハイライト

### 詳細解説方式

情報セキュリティ・ネットワーク・データベースは `json/details/` の個別詳細JSONを使います。

アルゴリズム・システム開発・プロジェクト管理は、v1.0では軽量用語JSONとカテゴリ学習ポイントから共通エンジンが詳細を生成します。表示される内容は、初心者向け説明、具体例、試験での見方、ひっかけ、午後問題での使い方、覚え方、深掘り、関連語、よくあるミスです。

将来は重要語だけ個別詳細JSONへ置き換えられる構成です。

## テスト

- `html/test.html`
- `js/test.js`
- `css/test.css`

機能:

- 6分野ミックス
- 分野別出題
- ☆復習リストだけ出題
- 最大100問
- 説明 → 用語
- 用語 → 説明
- ミックス
- 同カテゴリ中心の誤答候補
- 正解語・別名の自動マスク
- 1〜4キーで回答
- Enterで次へ
- 間違いだけ再テスト
- 辞書カードへ直接戻る
- 直近30回の結果をlocalStorageへ保存

旧62KB版の手作り問題はデータ消失防止のため `html/test-legacy.html` にアーカイブしていますが、通常UIからは使いません。

## 情報セキュリティ過去問

- `html/security-past.html`
- `js/past.js`
- `css/past.css`
- `security-past-index.json`
- `json/past-problems/`
- `json/past/`
- `sources/`

問題文JSON、PDF原本、設問別解説、答案例、関連用語をつなげています。

解説側 `sections[].answerTargets` と問題文側 `problem.questions[].targets` は設問単位で対応させます。

## 保存データ

ブラウザ `localStorage` を使います。

| 用途 | キー |
|---|---|
| セキュリティ習得 | `security-terms-checked` |
| ネットワーク習得 | `network-terms-checked` |
| DB習得 | `database-terms-checked` |
| アルゴリズム習得 | `algorithm-terms-checked` |
| システム開発習得 | `system-terms-checked` |
| プロジェクト管理習得 | `management-terms-checked` |
| 復習リスト | `ap-study-bookmarks-v1` |
| 最近見た用語 | `ap-study-recent-v1` |
| テスト履歴 | `ap-study-test-history-v1` |
| テーマ | `ap-study-theme` |

旧 `sec / net / db` 等の短い分野IDで保存された復習・履歴データは `js/shell.js` が現行IDへ移行します。

## UI

共通アプリシェル:

- `css/shell.css`
- `js/shell.js`

仕様:

- PC: 固定左サイドバー
- 920px以下: ハンバーガー式ドロワー
- safe-area対応
- ダーク / ライトテーマ
- テーマ保存
- BUILD表示
- 共通テスト導線
- トースト通知
- `/` で検索へフォーカス
- `Esc` でドロワーを閉じる
- `prefers-reduced-motion` 対応

この設計は同じGitHub内の VReview / LyricTube / DesignShelf / ASMRTube で良かった要素を、AP学習向けに再構成しています。

## データ構成

```text
/
├─ index.html
├─ *-terms-manifest.json
├─ *-details-manifest.json       # 既存3分野
├─ security-past-index.json
├─ css/
├─ js/
├─ html/
│  ├─ security.html
│  ├─ network.html
│  ├─ database.html
│  ├─ algorithm.html
│  ├─ system.html
│  ├─ management.html
│  ├─ security-past.html
│  └─ test.html
├─ json/
│  ├─ terms/
│  ├─ details/
│  ├─ past/
│  └─ past-problems/
├─ sources/
├─ tests/
│  ├─ data-integrity.test.html
│  ├─ validate.mjs
│  └─ README.md
├─ tools/
│  └─ check-json.html            # tests/へ転送
├─ .github/workflows/
│  └─ validate.yml
└─ docs/
```

## 品質チェック

### GitHub Actions

`.github/workflows/validate.yml`

mainへのpush / PRごとに次を自動確認します。

- `js/*.js` のJavaScript構文
- 全JSONの構文
- 6分野manifestと実件数
- 用語ID重複
- 必須フィールド
- manifest category対応
- 既存3分野のterms/details ID・term・category対応
- セキュリティ過去問の問題文/解説targets対応
- 主要HTMLの内部 `href` / `src` 参照切れ

2026-08-29のv1.0完成作業で **Validate AP Study Notes が成功**することを確認しています。

### ブラウザテスト

`tests/data-integrity.test.html`

GitHub Pages上でも同様のデータ整合確認を実行できます。

`tools/check-json.html` は検査コードの二重管理を避けるため、このテストへ転送します。

## 崩してはいけないもの

UIや構成は今後も自由に改善して構いませんが、次は変更時に移行・影響確認が必要です。

- localStorageキー
- 用語ID
- manifestと実JSONの対応
- 過去問ID
- 年度 / 問番号 / PDF対応
- 問題文と解説の設問対応
- GitHub Pagesの相対パス

## v1.0完成条件

- 主要6分野がすべて学習可能
- 検索・カテゴリ・詳細・復習・習得チェックが共通で使える
- 6分野テストが使える
- セキュリティ過去問が使える
- Dashboardで学習状態を確認できる
- PC/小画面向けナビがある
- データ/JS/相対参照の自動検証が成功する
- GitHub Pages buildが成功する
- README / 仕様書 / 作業報告書が最新状態

## 未確認・今後の改善

自動検証とPagesビルドは確認済みですが、この作業環境からGitHub Pagesの画面を実ブラウザ操作して、PC/スマホの全クリックを通すところまでは確認できていません。

v1.0以降の改善候補:

- 新3分野の重要語へ専用の個別詳細解説を追加
- 本番風の良質な手作り問題を専用JSONへ移行
- セキュリティ以外の過去問解説を追加
- テスト履歴から苦手カテゴリ分析を追加
- `css/style.css` の旧未使用スタイルをさらに削減

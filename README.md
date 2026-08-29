# AP Study Notes

応用情報技術者試験（AP）の学習用Webサイトです。

このリポジトリを**正本**として管理し、今後の改修は原則としてGitHub上のファイルをChatGPTから直接確認・編集します。ZIPを毎回作る運用や、Codexでの最終反映を前提にはしません。

---

## 1. プロジェクトの目的

AP対策で必要な知識を、単なる暗記ではなく「意味・仕組み・具体例・試験での出方・午後問題での使い方」までつなげて学べるサイトを作ることが目的です。

現在は主に以下を扱っています。

- 情報セキュリティ
- ネットワーク
- データベース
- セキュリティ午後過去問
- ランダムテスト

今後、アルゴリズム、システム開発、マネジメントなども追加・再設計して構いません。

---

## 2. 開発方針

優先順位は次の通りです。

1. 操作性
2. 分かりやすさ
3. 学習効果
4. 軽量さ
5. 保守・修正のしやすさ
6. 見た目

### 現在の形は固定しない

今のHTML構成、画面配置、JSON分割、UIは**現時点の実装**であり、絶対仕様ではありません。

より良い方法があるなら、次のような変更も可能です。

- ページ構成の再設計
- UIの大幅変更
- JSON構成の整理
- JavaScriptの分割
- テスト機能の作り直し
- 新しい単元・学習モードの追加
- 共通コンポーネント化
- データ保存方式の改善

ただし、既存データや学習進捗を壊す変更は、必要に応じて移行処理を用意します。

---

## 3. 現在の技術構成

- HTML
- CSS
- JavaScript
- JSON
- PDF
- localStorage
- GitHub Pagesで利用可能な静的構成

ビルドツールやサーバーを必須にはしていません。

### GitHub

リポジトリ:

`EliteMay/ap-study-notes`

想定Pages URL:

`https://elitemay.github.io/ap-study-notes/`

`.nojekyll` をルートに置いています。

---

## 4. 現在の主なファイル構成

```text
ap-study-notes/
├─ index.html
├─ README.md
├─ .nojekyll
│
├─ html/
│  ├─ security.html
│  ├─ security-past.html
│  ├─ network.html
│  ├─ database.html
│  ├─ test.html
│  ├─ algorithm.html
│  ├─ system.html
│  ├─ management.html
│  └─ template.html
│
├─ css/
│  └─ style.css
│
├─ json/
│  ├─ terms/
│  ├─ details/
│  ├─ past/
│  └─ past-problems/
│
├─ sources/
│  └─ 過去問PDF
│
├─ tools/
│  └─ check-json.html
│
└─ docs/
   ├─ 仕様書.md
   ├─ 作業報告書.md
   └─ ai/
      ├─ AI最重要ルール.md
      ├─ ChatGPT作業ルール.md
      └─ ChatGPT依頼用プロンプト.md
```

この構成は変更可能です。大きく変える場合は、リンク・JSON参照・保存データ・GitHub Pagesへの影響を同時に確認します。

---

## 5. 現在の学習データ

### 情報セキュリティ

- 用語: 501件
- 詳細解説: 501件
- 過去問解説: 7件

主なファイル:

- `security-terms-manifest.json`
- `security-details-manifest.json`
- `security-past-index.json`
- `json/terms/security-terms-*.json`
- `json/details/security-details-*.json`
- `json/past/*.json`
- `json/past-problems/*.json`

### ネットワーク

- 用語: 480件
- 詳細解説: 480件

主なファイル:

- `network-terms-manifest.json`
- `network-details-manifest.json`
- `json/terms/network-terms-*.json`
- `json/details/network-details-*.json`

### データベース

現在、用語・詳細解説をJSON分離して管理しています。

主なファイル:

- `database-terms-manifest.json`
- `database-details-manifest.json`
- `json/terms/database-terms-*.json`
- `json/details/database-details-*.json`

---

## 6. JSONの基本方針

大量の学習データをHTMLやJavaScriptへ直接書き込みすぎないようにします。

### 用語一覧

`json/terms/`

検索・一覧表示向けの比較的軽いデータを置きます。

例:

```json
{
  "id": "sec-network-dns-001",
  "term": "DNS",
  "aliases": ["Domain Name System", "名前解決"],
  "category": "ネットワーク基礎・DNS・通信",
  "definition": "ドメイン名とIPアドレスを対応付ける仕組み。"
}
```

### 詳細解説

`json/details/`

用語を理解するための長い説明を置きます。

主な項目:

- `beginner`
- `example`
- `examPoint`
- `trap`
- `deepDive`
- `relatedConcepts`
- `commonMistakes`
- `afternoonUse`
- `howToRemember`

### 過去問

- 問題文: `json/past-problems/`
- 解説: `json/past/`
- PDF: `sources/`

現在は、インデックス側の問題文参照に `problemFile`、解説JSON側に `sourceProblemFile` を使っています。

この構造自体を将来変更することは可能ですが、変更するなら参照元を一括で移行します。

---

## 7. 壊すと困る部分

サイト全体の形は柔軟に変えて構いませんが、次は注意が必要です。

### 学習進捗

現在は `localStorage` を使っています。

主なキー:

- `security-terms-checked`
- `network-terms-checked`
- `database-terms-checked`

キーやIDを変更すると進捗が消える可能性があります。
変更が必要なら、旧データから新形式へ引き継ぐ処理を検討します。

### 用語ID

`id` は、詳細解説、リンク、進捗など複数箇所で使われることがあります。
単純な名前変更のつもりで変更しないようにします。

### 過去問の対応

年度、問番号、問題文JSON、解説JSON、PDFの対応を崩さないようにします。

---

## 8. 解説品質の基準

このサイトでは「長いだけの説明」より「読んで理解できる説明」を優先します。

良い解説には、必要に応じて次を含めます。

- まず何なのか
- どういう仕組みか
- 実際の例
- 何と混同しやすいか
- 午前問題でどう問われるか
- 午後問題で本文のどこを見るか
- なぜその答えになるか
- 覚え方

次のような、どの用語にも貼れる文の大量使い回しは避けます。

- 「万能な対策ではない」だけで終わる
- 「名前だけで判断しない」だけで終わる
- 「目的・対象・限界を理解する」だけで終わる

各用語固有の内容へ具体化します。

---

## 9. GitHubでの改修方法

今後は原則として次の流れです。

1. ChatGPTがGitHub上の最新ファイルを確認する。
2. `README.md`、必要なら `docs/仕様書.md`、`docs/作業報告書.md` を確認する。
3. 対象コード・JSONを確認する。
4. 必要な変更をGitHubへ直接反映する。
5. 構文・参照・データ整合を可能な範囲で検査する。
6. `docs/作業報告書.md` を更新する。

### Codexについて

基本運用では使いません。

次のように、実行環境での確認が重要なときだけ補助として使うことがあります。

- Electronの実行・ビルド
- OS依存処理
- 実ブラウザ操作が必要な再現確認
- 大規模な自動テスト

静的HTML/CSS/JS/JSONの通常改修はChatGPTからGitHubを直接変更して完結させる方針です。

---

## 10. GitHub Pages

このサイトは静的サイトなので、GitHub Pagesでの利用を基本とします。

GitHub側では通常、次を設定します。

1. Repository Settings
2. Pages
3. Build and deployment
4. Source: `Deploy from a branch`
5. Branch: `main`
6. Folder: `/ (root)`

Pagesで使うときは、相対パスを優先します。

特に確認するもの:

- CSS参照
- HTML間リンク
- JSONの `fetch()` パス
- PDFリンク
- `../` の階層

---

## 11. 品質チェック

現在は `tools/check-json.html` があります。

変更内容に応じて、最低限次を確認します。

### JSON

- 構文エラー
- ID重複
- terms/detailsの対応
- マニフェスト件数
- ファイル参照

### HTML / JavaScript

- JavaScript構文
- ファイルパス
- リンク切れ
- JSON読み込みパス
- GitHub Pagesサブパスでの動作

### UI

可能なら次を確認します。

- 小さい画面で致命的に崩れない
- 主要ボタンが使える
- 検索・絞り込みが使える
- 進捗が消えない
- 画面外へ大きくはみ出さない

実ブラウザで未確認のものは未確認として記録します。

---

## 12. 文書の役割

### `README.md`

プロジェクト全体の方針と、壊すと困る重要事項。

### `docs/仕様書.md`

現在実装されている画面・データ・保存方式を、READMEより具体的に記録します。

### `docs/作業報告書.md`

実際に何を変更したかを時系列で残します。

READMEと仕様書は「永遠に守る法律」ではありません。
仕様変更をしたら、実装に合わせて一緒に更新します。

---

## 13. 完成の考え方

一度完成したら固定するサイトではありません。

各改修で「完成」とする条件は次です。

- 今回要求された主要機能が実装されている
- 重大な既知不具合が残っていない
- 関連するJSON・HTML・CSS・リンクが整合している
- 必要な文書が更新されている
- 確認できなかった内容が明記されている

その後も、より良い案があれば構成・UI・機能を変更して構いません。

---

## 14. 現在の優先改善候補

- 学習サイト全体のUI再設計
- データベース単元の品質強化
- テスト機能のJSON分離・強化
- 単元横断検索
- 苦手問題・復習機能
- 学習履歴・正答率の可視化
- 午前問題対応
- アルゴリズム単元追加
- システム開発単元追加
- マネジメント単元追加
- スマホ表示改善

優先順位は今後の使い方に応じて変更します。

---

## 15. 2026-08-29 GitHub運用へ移行

- ZIP中心の管理から `EliteMay/ap-study-notes` を正本とするGitHub管理へ移行。
- ChatGPTからGitHubを直接確認・編集する運用へ変更。
- Codexを必須の最終反映担当から外した。
- 現在のファイル構成を過度に固定する旧ルールを撤廃。
- 将来の大幅なUI・構成・データ設計変更を許容する方針へ変更。
- ただし進捗消失、データ破損、参照切れにつながる変更は移行を考慮する。

# AP Study Notes

応用情報技術者試験（AP）の個人学習用Webアプリです。

**教材再設計中 / BUILD `2026.08.29-r5`**

正本: GitHub `EliteMay/ap-study-notes`

GitHub Pages: `https://elitemay.github.io/ap-study-notes/`

## 目的

単語数を増やすことではなく、APで必要な知識を **理解 → 適用 → 演習** までつなげることを目的にします。

内容に応じて、用語・比較・図・コードトレース・計算・SQL・ケース・過去問などを使い分けます。

## 現在の状態

Webアプリ基盤は利用できますが、**AP教材全体としてはまだ完成扱いにしません**。

旧6教材には1,422語ありますが、語数は完成度ではありません。旧データは検索・復習・既存進捗の互換を維持しながら、構造化Lessonへ移行します。

### 全件監査・Lesson移行

| 旧教材 | 語数 | 状態 |
|---|---:|---|
| アルゴリズム | 65 | **65/65を実Lessonへ一意割当済み** |
| システム開発 | 75 | **75/75を実Lessonへ一意割当済み** |
| プロジェクト管理 | 72 | **72/72を実Lessonへ一意割当済み** |
| データベース | 229 | 要監査 |
| ネットワーク | 480 | 要監査 |
| セキュリティ | 501 | 要監査 |

現在、**212 / 212語の監査・実Lesson割当が完了**しています。

## カリキュラム基準

2026年度現行制度はIPA「応用情報技術者試験 シラバス Ver.7.2」を分類基準にします。

- 定義: `json/curriculum/ap-2026-map.json`
- 表示: `html/roadmap.html`
- 内部分類: 9大分類 / 23中分類
- 学習画面: 13学習ユニット

13ユニット:

1. 基礎理論・数学
2. アルゴリズム・プログラミング
3. コンピュータシステム
4. UI・情報メディア
5. データベース
6. ネットワーク
7. セキュリティ
8. システム開発
9. プロジェクト管理
10. サービス管理・監査
11. システム戦略・企画
12. 経営・会計・ビジネス
13. 法務・標準化

2027年度以降の新制度は別マップで管理し、2026年度マップを上書きしません。

---

# 構造化Lesson

共通URL:

`html/lesson.html?id=<LESSON_ID>`

構成:

- `html/lesson.html`
- `js/lesson.js`
- `css/lesson.css`
- `json/lessons/lesson-index.json`
- `json/lessons/<unit>/*.json`

対応section type:

- `text`
- `comparison`
- `diagram`
- `code-trace`
- `steps`
- `mistakes`

同じ学習ユニット内は`order`順で前後移動し、別ユニットへの移動は`next[]`で明示します。

## 現在35Lesson

### アルゴリズム・プログラミング 15本

- ALG-01 擬似言語トレース
- ALG-02 計算量
- ALG-03 配列・リスト
- ALG-04 スタック・キュー
- ALG-05 ハッシュ
- ALG-06 探索
- ALG-07 ソート
- ALG-08 再帰・問題分割
- ALG-09 木・走査
- ALG-10 グラフ・最短経路
- ALG-11 文字列探索
- PROG-01 基本制御・データ型
- PROG-02 関数・引数・スコープ
- PROG-03 プログラミング言語
- PROG-04 Web・マークアップ・データ記述言語

### 基礎理論 1本

- FND-01 論理演算・ビットシフト

### コンピュータシステム 1本

- CMP-01 コンテナと仮想化

### システム開発 9本

- SYS-01 開発ライフサイクルと開発プロセス
- SYS-02 要件定義とトレーサビリティ
- SYS-03 設計・アーキテクチャ・モジュール
- SYS-04 オブジェクト指向とUML
- SYS-05 実装品質とリファクタリング
- SYS-06 構成管理・CI/CD・DevOps
- SYS-07 テスト設計・網羅・レビュー
- SYS-08 保守とリリース方式
- DEV-01 アジャイル開発とスクラム

### プロジェクト管理 6本

- PM-01 プロジェクト立上げ・スコープ・WBS
- PM-02 PERT・クリティカルパス・日程短縮
- PM-03 EVMを式と状態で読む
- PM-04 品質マネジメントと分析
- PM-05 リスク評価と対応
- PM-06 組織・コミュニケーション・調達・変更

### サービス管理・監査 2本

- SVC-01 サービスマネジメントとSLA
- AUD-01 システム監査と内部統制

### システム戦略・企画 1本

- STR-01 システム化計画・フィージビリティ・RFP

---

# 監査と再分類

## アルゴリズム65語

監査: `json/curriculum/audits/algorithm-audit.json`

- keep-core: 31
- keep-supporting: 5
- merge-into-lesson: 25
- move-primary-unit: 4

AND / OR / XOR / ビットシフトは`FND-01`へ移しました。

## システム開発75語

監査: `json/curriculum/audits/system-audit.json`

- keep-core: 21
- keep-supporting: 6
- merge-into-lesson: 44
- move-primary-unit: 4

再配置:

- フィージビリティスタディ → `STR-01` / 中分類18
- RFP → `STR-01` / 中分類18
- SLA → `SVC-01` / 中分類15
- コンテナ → `CMP-01` / 中分類5

## プロジェクト管理72語

監査: `json/curriculum/audits/management-audit.json`

- keep-core: 18
- keep-supporting: 6
- merge-into-lesson: 30
- move-primary-unit: 18

再配置:

- Agile/Scrum 12語 → `DEV-01` / 中分類13
- ITSM 6語 → `SVC-01` / 中分類15

旧72語に不足していた中分類16は`AUD-01`で新規教材化しました。

## 旧ページの扱い

- `html/algorithm.html`
- `html/system.html`
- `html/management.html`

上部を正式Lessonの学習ハブへ変更済みです。

旧65/75/72語は、検索・復習・localStorage進捗を壊さないため索引として下部へ残しています。

`generatedDetail()` は移行互換として残りますが、正式Lessonの主本文として扱いません。

---

# データ保存

教材データ: GitHub上のJSON

個人進捗: ブラウザlocalStorage

| 用途 | localStorageキー |
|---|---|
| Security習得 | `security-terms-checked` |
| Network習得 | `network-terms-checked` |
| Database習得 | `database-terms-checked` |
| Algorithm習得 | `algorithm-terms-checked` |
| System習得 | `system-terms-checked` |
| Management習得 | `management-terms-checked` |
| 復習リスト | `ap-study-bookmarks-v1` |
| 最近見た用語 | `ap-study-recent-v1` |
| 用語テスト履歴 | `ap-study-test-history-v1` |
| テーマ | `ap-study-theme` |

Lesson理解度の永続化は未実装です。

---

# 自動検証

`.github/workflows/validate.yml` をmain / PRごとに実行します。

### `tests/validate.mjs`

- 全JSON構文
- JavaScript構文（Workflow側）
- manifest件数 / ID / category / details
- 過去問targets
- 主要HTML相対参照
- 9大分類 / 23中分類 / 13学習ユニット
- Lesson ID / order / unit / IPA中分類
- section / diagram / checks / next
- 旧アルゴリズム65/65の一意Lesson割当

### `tests/validate-audits.mjs`

- System 75/75監査
- Management 72/72監査
- actionとsummary一致
- IPA中分類・移動先ユニット存在
- **System 75/75が実装Lessonへちょうど1回ずつ割当されていること**
- **Management 72/72が実装Lessonへちょうど1回ずつ割当されていること**
- 非move項目は監査指定Lessonと一致
- move項目は監査指定unitと一致

---

# GitHub Pagesでの利用

`https://elitemay.github.io/ap-study-notes/`

静的HTML/CSS/JS/JSONだけで動き、通常はビルドやローカルサーバーは不要です。

## ファイル構成

- `index.html`: ダッシュボード
- `html/`: 各学習ページ
- `css/`: UI
- `js/`: 共通処理・ページ処理
- `json/terms/`: 旧用語データ
- `json/lessons/`: 構造化Lesson
- `json/curriculum/`: シラバス・監査データ
- `tests/`: CI / ブラウザ検証
- `docs/仕様書.md`: 現行仕様
- `docs/作業報告書.md`: 変更記録

---

# 現在の注意点・既知の問題

- Security 501 / Network 480 / Database 229はまだ大規模監査前。
- 現行`html/test.html`は主に用語・定義の4択で、本番型総合テストではない。
- Lessonの正答履歴・理解度はまだ永続保存しない。
- 最近のAP過去問とのLesson単位の対応付けは不足。
- 公開Pagesを通常ブラウザとして35Lesson全件クリックするE2E確認は未実施。

## 次の優先作業

1. Database 229 / Network 480 / Security 501の監査優先順を決める。
2. 最近の過去問から逆算してLesson不足を補完する。
3. 本番型の計算・SQL・コード・ケース問題を増やす。
4. Lesson理解度・解答履歴の保存モデルを追加する。

# 完成条件

- 対象シラバス全範囲を追跡できる。
- テンプレ文章による水増しがない。
- 各内容に適した教材形式がある。
- 必要な計算 / 図 / コード / SQL / ケース演習がある。
- 最近の過去問へ接続できる。
- 問題結果から理解度を確認できる。
- 主要操作がPC/スマホで利用できる。
- CIとPages buildが通る。

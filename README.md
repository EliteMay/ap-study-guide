# AP Study Notes

応用情報技術者試験（AP）の個人学習用Webアプリです。

**教材再設計中 / BUILD `2026.08.29-r5`**

正本: GitHub `EliteMay/ap-study-notes`  
GitHub Pages: `https://elitemay.github.io/ap-study-notes/`

## 目的

単語数を増やすことではなく、APで必要な知識を **理解 → 適用 → 演習** までつなげることを目的にします。

教材形式は内容に合わせます。

- 用語・比較
- 図・構成図
- 擬似言語 / コードトレース
- SQL
- E-R図 / 正規化
- 計算
- ケース判断
- 過去問

## 現在の状態

Webアプリ基盤は利用できますが、**AP教材全体としてはまだ完成扱いにしません**。

旧6教材は合計1,422語あります。現在は検索・復習・既存進捗の互換用索引として維持し、主教材を構造化Lessonへ移行しています。

| 旧教材 | 語数 | 状態 |
|---|---:|---|
| アルゴリズム | 65 | **65/65 全件監査・Lesson割当済み** |
| データベース | 229 | **229/229 全件監査・Lesson割当済み** |
| システム開発 | 75 | **75/75 全件監査・Lesson割当済み** |
| プロジェクト管理 | 72 | **72/72 全件監査・Lesson割当済み** |
| ネットワーク | 480 | 要監査 |
| セキュリティ | 501 | 要監査 |

**441語を全件監査し、441/441を実装済みLessonへ一意割当済みです。**

現在の構造化Lessonは **49本** です。

## カリキュラム基準

2026年度現行制度は IPA「応用情報技術者試験 シラバス Ver.7.2」を分類基準にします。

- 内部: 9大分類 / 23中分類
- 学習UI: 13学習ユニット
- 定義: `json/curriculum/ap-2026-map.json`
- 表示: `html/roadmap.html`

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

2027年度以降の新制度は別マップとして管理し、2026年度定義を上書きしません。

---

# 構造化Lesson

共通URL:

`html/lesson.html?id=<LESSON_ID>`

主な構成:

- `html/lesson.html`
- `js/lesson.js`
- `css/lesson.css`
- `json/lessons/lesson-index.json`
- `json/lessons/<unit>/*.json`

現在の表示形式:

- `text`
- `comparison`
- `diagram`
- `code-trace`
- `steps`
- `mistakes`

`worked-example` rendererも追加済みですが、現時点の49Lessonでは既存の検証済み形式を中心に使用しています。

## アルゴリズム・プログラミング

- ALG-01〜ALG-11
- PROG-01〜PROG-04
- FND-01 論理演算・ビットシフト

旧65語は **65/65** 一意割当済み。

監査: `json/curriculum/audits/algorithm-audit.json`

## データベース

旧229語を単語カードのまま磨かず、14Lessonへ再構成しました。

| Lesson | 内容 |
|---|---|
| DB-01 | DBMS・3層スキーマ・関係モデル |
| DB-02 | E-R図・キー・参照整合性 |
| DB-03 | 正規化と更新異常 |
| DB-04 | SQL定義・更新・権限制御 |
| DB-05 | SELECT・条件式・NULL |
| DB-06 | 表結合を結果表から読む |
| DB-07 | 集計・GROUP BY・集合演算 |
| DB-08 | 副問合せ・EXISTS・CTE |
| DB-09 | トランザクション・ロック・分離レベル |
| DB-10 | ログ・バックアップ・障害回復 |
| DB-11 | 索引・実行計画・性能 |
| DB-12 | ビュー・ストアド処理・安全なSQL実行 |
| DB-13 | 分散DB・NoSQL・CAP |
| DB-14 | DWH・ETL・OLAP・スタースキーマ |

監査: `json/curriculum/audits/database-audit.json`

監査結果:

- 主要概念: 84語
- 補助: 76語
- 上位Lessonへ統合: 69語
- 別ユニット移動: 0語

補完した主な不足:

- 関係代数: 選択 / 射影 / 結合
- SQL論理評価順
- 関数従属性からの実正規化
- NULL三値論理
- JOIN結果表トレース
- 分離レベルと読取り異常
- UNDO / REDO / WAL / チェックポイント
- フル / 差分 / 増分バックアップ
- 索引の選択率・複合列順
- 2相コミット
- OLAPのslice / dice / drill-down / roll-up

既存の `database-details-*.json` 229件は定型文比率が高いため、現在は互換用の旧詳細として扱い、主教材にはしません。

## システム開発・PM・サービス管理

実装済み:

- SYS-01〜SYS-08
- DEV-01 Agile / Scrum
- PM-01〜PM-06
- SVC-01 サービスマネジメント / SLA
- AUD-01 システム監査 / 内部統制
- STR-01 システム化計画 / RFP
- CMP-01 コンテナ / 仮想化

System 75語 + Management 72語 = **147/147** 一意割当済み。

監査:

- `json/curriculum/audits/system-audit.json`
- `json/curriculum/audits/management-audit.json`

---

# 崩してはいけない仕様

- 既存用語IDを不用意に変更・削除しない。
- localStorageキーを変更する場合は移行処理を用意する。
- 過去問PDF / 問題JSON / 解説JSONの対応を壊さない。
- GitHub Pagesで動く相対パスを維持する。
- 秘密情報やAPIキーを公開リポジトリへ置かない。
- 監査前の大量削除をしない。
- 「語数が多い = 教材完成」と扱わない。

# データ構成

主な場所:

```text
index.html
html/
css/
js/
json/
  curriculum/
    ap-2026-map.json
    audits/
  lessons/
  terms/
  details/
docs/
tests/
```

教材本文・用語・監査結果はJSONへ分離し、大量データをHTMLへ直書きしません。

# 保存方法

教材データはGitHub上のJSON。個人進捗はブラウザのlocalStorageへ保存します。

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

Lesson理解度の永続保存は未実装です。

# 起動・利用方法

GitHub PagesではURLを開くだけで利用できます。

ローカル利用も静的HTML/CSS/JS/JSONのみで構成されていますが、`fetch()` でJSONを読むため、ブラウザの `file://` 直開きよりGitHub PagesやLive Server等のHTTP環境を推奨します。

# GitHub Pages

公開URL:

`https://elitemay.github.io/ap-study-notes/`

ビルド工程は不要です。main更新後にGitHub Pagesがデプロイされます。

# 自動検証

`.github/workflows/validate.yml` でmain / PRごとに検証します。

主な検査:

- JavaScript構文
- 全JSON構文
- manifest件数 / ID / category
- 9大分類 / 23中分類 / 13ユニット
- Lesson ID / order / unit / IPA中分類
- section / diagram / checks / next参照
- Algorithm 65/65完全割当
- System 75/75完全割当
- Management 72/72完全割当
- Database 229/229完全割当
- 監査JSONと実装Lessonの割当一致
- セキュリティ過去問targets
- 主要HTML参照

監査専用: `tests/validate-audits.mjs`

# 注意点・既知の問題

- Network 480語とSecurity 501語はまだ大規模監査前です。
- UI/情報メディア、経営・会計、法務など独立教材が未整備のユニットがあります。
- 現行 `html/test.html` は用語・定義中心の4択で、本番力測定としては未完成です。
- Lessonの正答履歴を永続化する理解度システムは未実装です。
- Databaseの旧229詳細JSONは定型文が多く、主教材には使用しません。
- 公開Pagesを通常ブラウザで49Lessonすべて操作するE2E総当たり確認は未実施です。

# 次の大バッチ

残る最大の旧教材:

1. Network 480語
2. Security 501語

この2分野を、重複・一般語・誤配置・テンプレ詳細を監査したうえで、通信フロー・構成図・サブネット計算・攻撃/対策対応・ケース問題中心のLessonへ移行します。

# 完成条件

- 対象シラバス全範囲を追跡できる。
- テンプレ文章による水増しがない。
- 各内容に適した教材形式がある。
- 必要な計算 / 図 / コード / SQL / ケース演習がある。
- 最近の過去問へ接続できる。
- 問題結果から理解度を確認できる。
- CIとPages buildが通る。
- 重大な既知不具合がなく通常利用できる。

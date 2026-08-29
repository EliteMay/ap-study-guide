# AP Study Notes

応用情報技術者試験（AP）の個人学習用Webアプリです。

**教材基盤 v1 / BUILD `2026.08.29-r5` / 教材内容は再設計中**

正本は GitHub `EliteMay/ap-study-notes`。通常の改修はChatGPTからGitHub上の最新版を直接確認・修正します。

## 目的

単語数を増やすことではなく、APで必要な知識を **理解 → 適用 → 演習** までつなげることを目的にします。

- 用語・概念
- 計算
- 擬似言語 / コードトレース
- SQL / 正規化
- ER/UML/ネットワーク図
- ケース判断
- 過去問

を内容に合う形式で学べる教材へ作り直しています。

## 現在の状態

Webアプリ基盤は利用できますが、**AP教材としては完成扱いにしません**。

旧6教材には合計1422語ありますが、これは完成度ではなく監査対象の既存データです。

主な問題:

- 詳細解説のテンプレート比率が高い。
- 旧6分野だけではAP全範囲をカバーしていない。
- Security / Network / System / Management間などに重複・誤配置候補がある。
- 用語カードへ寄せすぎて、計算・図・SQL・コード・ケース演習が弱い。
- 現行4択テストは用語と定義の対応確認が中心。

## カリキュラム基準

2026年度現行制度は IPA「応用情報技術者試験 シラバス Ver.7.2」を分類基準にします。

内部では **9大分類・23中分類** を保持し、学習画面では13ユニットへまとめます。

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

定義:

`json/curriculum/ap-2026-map.json`

表示:

`html/roadmap.html`

2027年度以降の新制度は別マップで管理し、2026年度定義を上書きしません。

## アルゴリズム再教材化

既存65語は全件監査済みです。

`json/curriculum/audits/algorithm-audit.json`

| 判定 | 件数 |
|---|---:|
| 主要教材として残す | 31 |
| 補助として残す | 5 |
| 上位Lessonへ統合 | 25 |
| 別学習ユニットを主教材にする | 4 |

既存IDは進捗維持のため監査段階では削除していません。

### 実装済み構造化Lesson

| Lesson | 内容 | 旧テンプレ置換対象 |
|---|---|---|
| ALG-01 | アルゴリズムの表現と擬似言語トレース | `term-alg-001`〜`003` |
| ALG-02 | 計算量とオーダの読み方 | `term-alg-004`〜`012` |
| ALG-03 | 配列・リストとデータの持ち方 | `term-alg-014`〜`017` |

ALG-03では、配列と連結リストを別々の定義として読むのではなく、同じデータの保持方法、添字アクセス、途中挿入、削除、参照変更を図で比較します。

追加で扱う内容:

- 動的配列
- 多次元配列
- 単方向 / 双方向 / 循環リスト
- 連結リストの挿入がO(1)になる条件
- 挿入位置を探す場合は全体でO(n)になり得ること

次は `ALG-04 スタック・キューと操作順`。

## 構造化Lesson

共通画面:

`html/lesson.html?id=<LESSON_ID>`

構成:

- `html/lesson.html`
- `js/lesson.js`
- `css/lesson.css`
- `json/lessons/lesson-index.json`
- `json/lessons/<unit>/*.json`

現在のsection type:

- `text`
- `comparison`
- `diagram`
- `code-trace`
- `steps`
- `mistakes`

確認問題は各Lessonの `checks[]` に持ちます。

`diagram` はJSONのノードから軽量なHTML図を生成し、配列・連結リストだけでなく、今後の木・グラフ・ER図・ネットワーク構成などへ拡張できる基盤です。

## 現在利用できる既存教材

- 情報セキュリティ: 501語（要監査）
- ネットワーク: 480語（要監査）
- データベース: 229語（要監査）
- アルゴリズム: 65語（全件監査済み・Lessonへ置換中）
- システム開発: 75語（要監査）
- プロジェクト管理: 72語（要監査）

## 現在使える機能

- Dashboard
- PCサイドバー / スマホドロワー
- 学習マップ
- 構造化Lesson
- 用語検索 / カテゴリ絞り込み
- URLハッシュで用語へ直接移動
- ☆ 復習リスト
- ✓ 習得済み
- 最近見た用語 / 続きから
- ダークモード
- 旧6教材の用語4択テスト
- セキュリティ過去問7問
- localStorageによる進捗保存
- GitHub Pages
- GitHub Actionsによる自動検証

## 起動・利用方法

GitHub Pages:

`https://elitemay.github.io/ap-study-notes/`

静的HTML/CSS/JS/JSONだけで動き、ビルドやローカルサーバーは通常不要です。

## データ保存

教材データはGitHub内のJSON。

個人進捗はブラウザのlocalStorageへ保存します。

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

Lessonの実測理解度保存はまだ未実装です。

## 崩してはいけない仕様

- 既存用語IDと進捗対応を不用意に壊さない。
- localStorageキー変更時は移行処理を用意する。
- 過去問PDF / 問題JSON / 解説JSONの対応を壊さない。
- GitHub Pagesの相対パスを壊さない。
- APIキーや秘密情報を公開リポジトリへ置かない。
- 監査前の大量削除・大量ID変更をしない。

## ファイル構成

```text
/
├─ index.html
├─ html/
│  ├─ roadmap.html
│  ├─ lesson.html
│  ├─ security.html
│  ├─ network.html
│  ├─ database.html
│  ├─ algorithm.html
│  ├─ system.html
│  ├─ management.html
│  ├─ security-past.html
│  └─ test.html
├─ json/
│  ├─ curriculum/
│  │  ├─ ap-2026-map.json
│  │  └─ audits/
│  │     └─ algorithm-audit.json
│  ├─ lessons/
│  │  ├─ lesson-index.json
│  │  └─ algorithm/
│  │     ├─ alg-01-pseudocode-trace.json
│  │     ├─ alg-02-complexity.json
│  │     └─ alg-03-array-list.json
│  ├─ terms/
│  ├─ details/
│  ├─ past/
│  └─ past-problems/
├─ css/
├─ js/
├─ tests/
├─ sources/
└─ docs/
```

## 品質チェック

`.github/workflows/validate.yml` でmain / PRごとに確認します。

- JavaScript構文
- 全JSON構文
- manifest件数 / ID / category
- terms/details対応
- 過去問targets対応
- 主要HTMLの相対参照
- 9大分類 / 23中分類 / 13学習ユニット
- アルゴリズム65語と監査decisionの1対1対応
- Lesson index / JSON / Unit / IPA中分類対応
- Lesson order重複
- 同じ既存termを複数Lessonが重複置換していないこと
- section type
- `diagram` のlabel / nodes
- 確認問題の選択肢 / answerIndex

## 既知の問題・未確認

- 公開GitHub Pagesを通常ブラウザとして全操作するE2E確認はこの作業環境では未実施。
- ALG LessonのPC/スマホ実表示、表・図の横スクロール、ダークモード視認性は実機未確認。
- 旧3分野の大量テンプレ解説はまだ残っている。
- AP全13ユニットの教材はまだ未完成。
- Lesson理解度を成績として保存する仕組みは未実装。

## 完成条件

次を満たして初めて教材として完成扱いにします。

- 対象シラバス全範囲を追跡できる。
- 各内容に適した教材形式がある。
- テンプレ文章で水増ししていない。
- 必要な計算・図・コード・SQL・ケース演習がある。
- 最近の過去問へ知識がつながる。
- 問題結果から理解度を確認できる。
- CIとPages buildが通る。

# AP Study Notes

応用情報技術者試験（AP）の個人学習用Webアプリです。

**教材再設計中 / BUILD `2026.08.29-r5`**

正本は GitHub `EliteMay/ap-study-notes`。通常の改修はChatGPTからGitHub上の最新版を直接確認・修正します。

## 目的

単語数を増やすことではなく、APで必要な知識を **理解 → 適用 → 演習** までつなげることを目的にします。

用語・計算・コードトレース・図・SQL・ケース・過去問など、内容に合う教材形式を使います。

## 現在の評価

Webアプリ基盤は利用できますが、**AP教材全体としてはまだ完成扱いにしません**。

旧6教材には合計1422語ありますが、これは完成度ではなく監査対象の既存データです。

確認済みの主な問題:

- 詳細解説のテンプレート比率が高い。
- 旧6分野だけではAP全範囲をカバーしない。
- 分野間に重複・誤配置候補がある。
- 用語カードへ寄せすぎ、計算・図・SQL・コード・ケース演習が弱い。
- 現行4択テストは用語と定義の対応確認が中心。

## カリキュラム基準

2026年度現行制度は IPA「応用情報技術者試験 シラバス Ver.7.2」を分類基準にします。

内部では **9大分類・23中分類** を保持し、学習画面では13ユニットへ整理します。

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

定義: `json/curriculum/ap-2026-map.json`

表示: `html/roadmap.html`

2027年度以降の新制度は別マップで管理し、2026年度定義を上書きしません。

---

# アルゴリズム・プログラミング再設計

既存65語は全件監査済みです。

監査:

`json/curriculum/audits/algorithm-audit.json`

| 判定 | 件数 |
|---|---:|
| 主要教材として残す | 31 |
| 補助として残す | 5 |
| 上位Lessonへ統合 | 25 |
| 別学習ユニットを主教材にする | 4 |

## 旧65語の移行状況

**65 / 65語すべてに、重複なしで構造化Lessonの行き先を実装済みです。**

既存用語IDと `algorithm-terms-checked` は進捗互換のため残しています。

AND / OR / XOR / ビットシフトの4語は、監査結果どおりアルゴリズムへ無理に残さず `FND-01` 基礎理論へ移しました。

この65/65は「旧データの移行が完了した」という意味であり、IPA中分類2の教材品質が最終完成したという意味ではありません。今後、過去問・本番型演習・説明精度で再評価します。

## 現在の構造化Lesson 16本

### アルゴリズム

| Lesson | 内容 |
|---|---|
| ALG-01 | アルゴリズムの表現と擬似言語トレース |
| ALG-02 | 計算量とオーダの読み方 |
| ALG-03 | 配列・リストとデータの持ち方 |
| ALG-04 | スタック・キューと操作順 |
| ALG-05 | ハッシュ表と衝突処理 |
| ALG-06 | 探索アルゴリズム |
| ALG-07 | ソートを比較して理解する |
| ALG-08 | 再帰と問題分割の考え方 |
| ALG-09 | 木構造と走査 |
| ALG-10 | グラフ探索と最短経路 |
| ALG-11 | 文字列探索 |

### プログラミング・言語

| Lesson | 内容 |
|---|---|
| PROG-01 | プログラムの基本制御とデータ型 |
| PROG-02 | 関数・モジュール・引数・スコープ |
| PROG-03 | プログラミング言語の分類と特徴 |
| PROG-04 | Web・マークアップ・データ記述言語 |

### 基礎理論へ移した教材

| Lesson | 内容 |
|---|---|
| FND-01 | 論理演算とビットシフト |

## Lessonで補完した旧65語外の不足内容

- 動的配列 / 多次元配列 / 循環リスト
- push / pop / enqueue / dequeue / 循環キュー
- Shell sort
- 完全二分木 / 平衡木 / AVL木 / B木
- preorder / inorder / postorder
- Bellman-Ford
- KMP / BM
- 順次 / 選択 / 反復
- 基本データ型 / 型変換
- 関数 / 実引数 / 仮引数 / 値渡し / 参照渡し
- スコープ / 変数の寿命 / モジュール化
- BNF / EBNF
- プログラミングパラダイム
- コンパイル / インタプリタ / JIT
- ヒープ領域 / GC
- HTML / CSS / XML / XHTML / JSON / YAML / XSL / UML

---

# 構造化Lesson基盤

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

Lessonナビは同じ学習ユニット内を自動で前後移動し、別ユニットへの移動は明示リンクで行います。

---

# 現在利用できる旧教材

- 情報セキュリティ: 501語（要監査）
- ネットワーク: 480語（要監査）
- データベース: 229語（要監査）
- アルゴリズム: 65語（全件監査・全件Lesson割当済み）
- システム開発: 75語（要監査）
- プロジェクト管理: 72語（要監査）

アルゴリズム以外は、まだ旧教材を完成版として扱いません。

## 次の大バッチ

**システム開発75語 + プロジェクト管理72語 = 147語をまとめて監査**します。

特に以下を確認します。

- RFP → システム企画/調達への再配置候補
- SLA → サービスマネジメントへの再配置候補
- 開発技術とプロジェクト管理の境界
- サービスマネジメント項目の混在
- 共通生成解説をLessonへ統合すべき範囲

---

# 保存データ

教材はGitHub内のJSON、個人進捗はブラウザのlocalStorageへ保存します。

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

Lesson理解度の永続化はまだ未実装です。

# 品質チェック

`.github/workflows/validate.yml` でmain / PRごとに確認します。

- JavaScript / 全JSON構文
- 既存manifest / ID / category / details対応
- 過去問targets対応
- 主要HTML相対参照
- 9大分類 / 23中分類 / 13学習ユニット
- アルゴリズム65語と監査decisionの1対1
- Lesson ID / order / unit / IPA中分類
- 同じ旧termの重複置換禁止
- **旧アルゴリズム65語が65/65ちょうど1回ずつLessonへ割り当てられていること**
- section type / diagram構造
- 確認問題のanswerIndex
- Lessonのnext参照

# GitHub Pages

`https://elitemay.github.io/ap-study-notes/`

静的HTML/CSS/JS/JSONだけで動き、通常はビルドやローカルサーバー不要です。

# 未確認

この作業環境では公開GitHub Pagesを通常ブラウザとして全操作するE2E確認は未実施です。

- 16LessonのPC/スマホ実表示
- 全確認問題のクリック操作
- 図/表の横スクロール
- ダークモード視認性

# 完成条件

- 対象シラバス全範囲を追跡できる。
- 各内容に適した教材形式がある。
- テンプレ文章で水増ししていない。
- 必要な計算・図・コード・SQL・ケース演習がある。
- 最近の過去問へ知識がつながる。
- 問題結果から理解度を確認できる。
- CIとPages buildが通る。

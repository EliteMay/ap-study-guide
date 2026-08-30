# AP Study Notes

応用情報技術者試験（AP）の個人学習用・静的Webアプリです。

**BUILD `2026.08.30-r14`**

- 正本: GitHub `EliteMay/ap-study-notes`
- GitHub Pages: `https://elitemay.github.io/ap-study-notes/`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 技術: HTML / CSS / JavaScript / JSON / PDF
- Server必須機能・秘密情報なし

## 目的

APの知識を **範囲把握 → Lesson理解 → 直後確認 → 短問 → 長文Case → 公式公開問題 → 弱点復習** までつなげます。

制作優先順位は **操作性 → 分かりやすさ → 軽量性 → 保守性 → 見た目** です。

## 現在の状態

| 項目 | 状態 |
|---|---:|
| IPA大分類 | **9 / 9** |
| IPA中分類 Lesson Coverage | **23 / 23** |
| 学習ユニット | **13 / 13** |
| 構造化Lesson | **118本** |
| 短問総合演習 | **91問** |
| 短問 中分類Coverage | **23 / 23** |
| 長文Case | **14本 / 42設問** |
| 長文Case Unit Coverage | **13 / 13** |
| 長文Case 中分類Coverage | **23 / 23** |
| 最新公開公式問題Mapping | **2025春・秋 午後22大問** |
| 旧教材監査 | **1,422 / 1,422語** |
| 既存Security過去問Mapping | **7 / 7** |

「23/23」は全中分類に学習・演習の入口があるという意味で、公式過去問量や各Lessonの深度まで完成したという意味ではありません。

## 2026年度CBTと公式問題の扱い

2026年度からAPはCBT方式です。

- 従来の「午前」→ **科目A**
- 従来の「午後」→ **科目B**
- 問う知識・技能の範囲、出題形式、出題数・解答数、採点方式、配点、合格基準、試験時間は変更なし
- **2026年度CBTの実際の試験問題はIPA方針で非公開**

そのため、本サイトでは**最新の公開済みフル公式問題である2025年度春期・秋期**を現在の学習教材へ接続します。

公式公開問題Mapping:

- Data: `json/past/ap-public-exams.json`
- Page: `html/official-past.html`
- Lesson逆引き: `js/lesson-official-past.js`

2025春・秋の旧「午後」22大問について、問題全文は転載せず、**問番号・分野・テーマ要約・関連Lesson**だけを保持します。実問題はIPA公式PDFを開いて利用します。MappingはAP Study Notes独自分析でありIPA公式分類ではありません。

## 13学習ユニット

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

正式分類は `json/curriculum/ap-2026-map.json`、教材整備状況は `json/curriculum/ap-2026-coverage.json` で分離管理します。

## 構造化Lesson

共通URL:

`html/lesson.html?id=<LESSON_ID>`

Index:

- `json/lessons/lesson-index.json` — Base 87本
- `json/lessons/lesson-index-expansion.json` — Expansion 31本
- 合計 **118本**

主な教材形式:

- text
- comparison
- diagram
- code-trace
- worked-example
- steps
- mistakes

計算、状態遷移、構成図、SQL結果、擬似言語Trace、障害切り分け、Security Case、会計/NPVなど、内容に適した形式を使います。

Lesson進捗は `ap-study-lesson-progress-v1` に保存します。

## 短問総合演習

- Page: `html/practice.html`
- Runtime正本: `json/practice/practice-index.json`
- 基本65問 + Expansion26問 = **91問**
- 13/13 Unit、23/23中分類Coverage
- 各Unit 7問以上
- 選択式 + 記述式
- Unit / Type / Difficulty / Status Filter
- Random出題
- Lesson → 関連問題Direct Link

履歴: `ap-study-practice-history-v1`

旧37問JSONは移行前Snapshotとして残しますがRuntimeから直接読みません。

## 長文Case

- Page: `html/cases.html`
- Runtime正本: `json/cases/case-index.json`
- Base 6Case / 18設問
- Expansion 8Case / 24設問
- 合計 **14Case / 42設問**
- **13/13 Unit、23/23中分類Coverage**

各Caseは状況文 + 3設問。自分で回答した後にModel Answerと採点観点を開き、自己評価します。

履歴: `ap-study-case-history-v1`

## 学習進捗Dashboard

`html/progress.html`

118Lesson・91短問・14Caseを統合して、

- 全体Lesson完了率
- 短問の挑戦 / 理解済み / 要復習
- 長文Case理解済み
- 13Unit別3系統進捗
- 23中分類別Coverage / 完了状態
- Next Action

を表示します。

Next Actionは概ね、**途中Case → 要復習短問 → 未完了Lesson** の順です。

## 旧1,422語の監査

| 旧教材 | 語数 | 状態 |
|---|---:|---|
| Algorithm | 65 | 65/65 |
| Database | 229 | 229/229 |
| Network | 480 | 480/480 |
| Security | 501 | 501/501 |
| System | 75 | 75/75 |
| Management | 72 | 72/72 |
| **合計** | **1,422** | **1,422/1,422** |

旧用語Pageは削除せず、検索・☆復習・既存localStorageとの互換索引として維持します。

## 過去問

### 最新公開公式問題

`html/official-past.html`

2025春・秋の午後22大問を118LessonへテーマMapping済み。

### 既存Security過去問

`html/security-past.html`

既存7問を `json/past/lesson-past-map.json` でLessonへ7/7 Mapping済み。

## 保存方法

教材DataはGitHub上のJSON。個人履歴はBrowser localStorageです。

主なKey:

- `security-terms-checked`
- `network-terms-checked`
- `database-terms-checked`
- `algorithm-terms-checked`
- `system-terms-checked`
- `management-terms-checked`
- `ap-study-bookmarks-v1`
- `ap-study-recent-v1`
- `ap-study-test-history-v1`
- `ap-study-lesson-progress-v1`
- `ap-study-practice-history-v1`
- `ap-study-case-history-v1`
- `ap-study-theme`

## 崩してはいけない仕様

- 既存用語IDを不用意に変更・削除しない。
- localStorage Key変更時は移行処理を用意する。
- 過去問PDF / 問題JSON / 解説JSONの対応を壊さない。
- GitHub Pagesで動く相対Pathを維持する。
- API Key・Password・秘密情報を公開Repoへ入れない。
- 監査済みIDとLesson割当を根拠なく変更しない。
- LessonはBase/Expansion indexをRuntimeとCIの双方で結合する。
- Practiceは`practice-index.json`をRuntime正本とする。
- Caseは`case-index.json`をRuntime正本とする。
- 2026 CBTの非公開実問題を再現・転載したものとして扱わない。
- 2025「午後」と現在の「科目B」の名称差を明示する。
- 「23/23に教材あり」を「試験対策として完全」と表現しない。

## 自動検証

`.github/workflows/validate.yml`

主Validator:

- `tests/validate.mjs`
- `tests/validate-audits.mjs`
- `tests/validate-security-audit.mjs`
- `tests/validate-computer-systems.mjs`
- `tests/validate-curriculum-expansion.mjs`
- `tests/validate-practice.mjs`
- `tests/validate-cases.mjs`
- `tests/validate-official-past.mjs`
- `tests/validate-past-lesson-map.mjs`
- `tests/validate-progress.mjs`

主な保証:

- 旧1,422語監査整合
- 118Lesson
- Lesson 23/23中分類Coverage
- 91短問 / 13Unit / 23中分類Coverage
- 14Case / 42設問 / 13Unit / 23中分類Coverage
- 2025春秋22公開大問のLesson Mapping
- 2026 CBT実問題を非公開として扱うMetadata
- Security過去問7/7 Mapping
- Progress Dashboard Data接続

## GitHub Pages

`https://elitemay.github.io/ap-study-notes/`

静的構成のためURLを開くだけで利用できます。

## 既知の未完了

- 2025午前80問まで含む公式問題単位の詳細Mappingは未実装。
- 2024以前の公開問題を体系的に118LessonへMappingしていない。
- 118Lessonすべての演習密度は均一ではない。
- 旧用語Pageの生成詳細は互換層として残っている。
- PC / Mobile / Dark Mode / 118Lesson / 91短問 / 42Case設問 / 公式問題対応画面の実Browser総当たりE2Eは未実施。

## 完成条件

- 23中分類をLesson / Short Practice / Long Caseから追跡できる。
- 主教材でテンプレ文章水増しを使わない。
- 計算 / 図 / Code / SQL / Network / Security / Business Caseがある。
- 弱点から再学習へ戻れる。
- 最新公開公式問題へ体系的に接続できる。
- CI / Pagesが通る。
- 重大な既知不具合なく通常利用できる。
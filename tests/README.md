# AP Study Notes tests

CIは構文・Data・参照・Coverageを保証します。実Browserの見た目や全Clickを完全保証するものではありません。

## Validator一覧

### `validate.mjs`

- 全JSON構文
- 旧6教材manifest / 件数 / ID
- Security / Network / Database details対応
- Security既存過去問target
- 主要HTML参照
- IPA 9大分類 / 23中分類 / 13Unit
- Base Lesson構造
- Algorithm 65/65

### `validate-audits.mjs`

- System 75/75
- Management 72/72
- Database 229/229
- Network 480/480
- `legacyTermRanges`展開
- missing / duplicate / extra ID検出

### `validate-security-audit.mjs`

Security 501語のCross-domain再分類を検証。

### `validate-computer-systems.mjs`

CMP-01〜12とIPA中分類3〜6のCoverage。

### `validate-curriculum-expansion.mjs`

- Base Lesson 87
- Expansion 31
- Total **118**
- 13Unit Hub
- IPA中分類1〜23 Lesson Coverage

### `validate-practice.mjs`

Runtime正本: `json/practice/practice-index.json`

期待:

- **91短問**
- **57 Choice + 34 Written**
- 13/13 Unit
- 各Unit 7問以上
- 23/23中分類
- Lesson参照実在
- Filter / Random / Direct Link
- BUILD r15

### `validate-cases.mjs`

Runtime正本: `json/cases/case-index.json`

期待:

- Base6 + Expansion8 + Mock Support2 = **16Case**
- **48 Written設問**
- 13/13 Unit
- 23/23中分類
- 1Case 3設問
- `CASE-EMB-01`
- `CASE-AUD-01`
- Model Answer / 採点観点
- Unit / Status Filter
- Random Case
- Mock Link
- BUILD r15

### `validate-mock.mjs`

150分オリジナル模試専用。

科目A:

- duration 150分
- 80問提示 / 80問解答
- Choice only
- Practice choice 57 + Mock extra 23 = exactly **80**
- Extra23のID重複なし
- Unit / Middle / Lesson参照実在
- option exactly 4
- answerIndex / explanation必須

科目B:

- duration 150分
- 11問提示 / 5問解答
- Security 1問必須
- 選択10分野から4問
- 10分野の一意性
- 組込み `CASE-EMB-01`
- 監査 `CASE-AUD-01`
- 各Case 3設問

Runtime/UI:

- `html/mock.html`
- `css/mock.css`
- `js/mock-data.js`
- `js/mock.js`
- Timer
- Answer保存
- Flag
- Navigator
- 科目B Case選択
- 提出後自己採点
- 時間切れ自動提出
- `ap-study-mock-history-v1`
- Active Session Key
- Shared Navigation
- Progress Dashboard接続
- BUILD r15

### `validate-official-past.mjs`

最新公開公式問題Mapping専用。

期待:

- currentExamYear = 2026
- currentMethod = CBT
- **2026 actual questions = non-public**
- latestPublicFullExamYear = 2025
- 2025春 + 秋
- 各午後11大問
- Total **22大問**
- 問1必須
- 問2〜11選択
- Unit / Lesson参照実在
- IPA公式URLのみ
- `html/official-past.html`
- `js/lesson-official-past.js`
- canonical Navigation
- BUILD r15

### `validate-past-lesson-map.mjs`

既存Security過去問7問のLesson Mapping。

- 7/7
- 関連Lesson実在
- Lesson→過去問Direct Link

### `validate-progress.mjs`

学習進捗Dashboard。

接続:

- 118Lesson
- 91短問
- 16長文Case / 48設問
- Mock履歴
- 13Unit
- 23中分類

各Unit / 中分類にLesson・短問・長文Caseが存在すること、Mock履歴とNext Actionが接続されることを検証。

## GitHub Actions

`.github/workflows/validate.yml`

現在の実行順:

1. JavaScript syntax
2. `validate.mjs`
3. `validate-audits.mjs`
4. `validate-security-audit.mjs`
5. `validate-computer-systems.mjs`
6. `validate-curriculum-expansion.mjs`
7. `validate-practice.mjs`
8. `validate-cases.mjs`
9. `validate-mock.mjs`
10. `validate-official-past.mjs`
11. `validate-past-lesson-map.mjs`
12. `validate-progress.mjs`

## CIで保証しないもの

実Browser E2Eが別途必要:

- PC / Mobile
- Dark Mode
- 118Lesson全表示
- 全Lesson check button
- Table / Diagram horizontal scroll
- 13Unit Hub
- Practice 91問全操作
- Case 16本 / 48設問全操作
- Mock 80問Navigatorの実操作
- 150分Timerの実時間経過
- Reload後のMock Session復元
- 時間切れ自動提出
- 科目B 11→5選択と自己採点Flow
- Official Public Exam Mapの外部PDF Link実操作
- Mobile drawer
- GitHub Pages上の実操作

CI successだけでこれらを確認済みと扱いません。

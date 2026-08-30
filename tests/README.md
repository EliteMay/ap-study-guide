# AP Study Notes tests

品質確認をサイト本体から分離して管理するフォルダです。

CIは構文・JSON・ID・参照・Coverage・Runtime配線を検証します。**実Browserの見た目・全Click・Mobile/Dark Modeを完全保証するものではありません。**

## 実行

主要検証はGitHub Actions `.github/workflows/validate.yml` でmain/PRごとに実行する。

ローカル例:

```bash
node tests/validate.mjs
node tests/validate-audits.mjs
node tests/validate-security-audit.mjs
node tests/validate-computer-systems.mjs
node tests/validate-curriculum-expansion.mjs
node tests/validate-practice.mjs
node tests/validate-past-lesson-map.mjs
node tests/validate-progress.mjs
```

## `validate.mjs`

基本Data / Legacy機能 / Base Lesson検証。

- 全JSON parse
- 旧6教材manifest / 件数
- 用語ID / category / required field
- Security / Network / Database terms-details
- 主要HTML参照
- IPA 9大分類 / 23中分類 / 13 Unit
- Base Lesson section / diagram / checks / next
- Algorithm 65/65割当

## `validate-audits.mjs`

旧教材監査と実Lesson移行。

- System 75/75
- Management 72/72
- Database 229/229
- Network 480/480
- `legacyTermRanges`展開
- missing / duplicate / extra ID禁止

## `validate-security-audit.mjs`

Security 501語Cross-domain再分類。

期待:

- Security 369
- Network 104
- Computer Systems 13
- Law 10
- System Development 2
- Service/Audit 3
- Total 501

移動先Lesson / Unit / IPA中分類まで検査する。

## `validate-computer-systems.mjs`

CMP-01〜12と中分類3〜6Coverage、Computer Hub linkを検査する。

## `validate-curriculum-expansion.mjs`

構造化Lesson全体。

期待:

- Base 87
- Expansion 31
- Total **118**

検査:

- ID/order duplicate禁止
- Lesson JSON / meta / unit / middle整合
- Expansion最低教材密度
- RuntimeがBase+Expansionを結合
- 13 Unitに有効Hub
- **IPA中分類1〜23すべてにLessonあり**

## `validate-practice.mjs`

オリジナル総合演習。

Runtime正本:

`json/practice/practice-index.json`

期待:

- 13 Unit file × 5 = 65問
- Expansion = 26問
- Total = **91問**
- 各Unit **7問以上**
- **13/13 Unit Coverage**
- **23/23 Middle Category Coverage**

検査:

- Manifest file/count
- Question ID duplicate禁止
- valid unitId / middleCodes / difficulty
- Choice options / answerIndex / explanation
- Written modelAnswer / 採点観点
- lessonRefs実在
- `practice-data.js` Manifest読込
- Practice Filter / history / direct `question=`
- Lesson↔Practice direct link
- Home Practice progress
- Legacy 37問Snapshotが保持されていること
- BUILD r11

## `validate-past-lesson-map.mjs`

既存Security過去問7問を検証。

- 7/7 Mapping
- lessonRefs実在
- Lesson→過去問direct link
- 過去問`id=` direct open

## `validate-progress.mjs`

学習進捗Dashboard専用。

期待:

- 118Lesson
- Practice 91問
- 13 Unit
- 23 Middle Category

検査:

- `html/progress.html` / CSS / JS
- Lesson/Practice localStorage key
- Practice Manifest読込
- 13 UnitすべてにLesson + Practice
- 23中分類すべてにLesson + Practice
- 教材/演習/Continue link
- Canonical Navigationに `📈 学習進捗`
- BUILD r11

## Browser検査

`tests/data-integrity.test.html` は旧6教材中心のBrowser検査として残す。

CIとは別途、次を実Browserで確認する必要がある。

- PC / Mobile
- Dark Mode
- 118Lesson全表示
- 全Lesson確認問題
- Table / Diagram horizontal scroll
- 13 Unit Hub
- Practice 91問全操作
- Written self-grade
- Lesson ↔ Practice direct link
- Lesson ↔ Past direct link
- Progress Dashboard
- Canonical Navigation

未確認項目をCI successだけで「確認済み」としない。
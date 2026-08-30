# AP Study Notes tests

品質確認をサイト本体から分離して管理するフォルダです。

CIは構文・JSON・ID・参照・Coverage・Runtime配線を検証します。**実Browserの見た目・全Click・Mobile/Dark Modeを完全保証するものではありません。**

## GitHub Actions 実行順

`.github/workflows/validate.yml`

1. JavaScript syntax
2. `validate.mjs`
3. `validate-audits.mjs`
4. `validate-security-audit.mjs`
5. `validate-computer-systems.mjs`
6. `validate-curriculum-expansion.mjs`
7. `validate-practice.mjs`
8. `validate-cases.mjs`
9. `validate-past-lesson-map.mjs`
10. `validate-progress.mjs`

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

## `validate-computer-systems.mjs`

CMP-01〜12、中分類3〜6Coverage、Computer Hub linkを検証。

## `validate-curriculum-expansion.mjs`

期待:

- Base 87
- Expansion 31
- Total **118Lesson**

検査:

- ID/order duplicate禁止
- Lesson JSON / meta / unit / middle整合
- Expansion最低教材密度
- RuntimeがBase+Expansionを結合
- 13 Unitに有効Hub
- IPA中分類1〜23すべてにLessonあり

## `validate-practice.mjs`

Runtime正本:

`json/practice/practice-index.json`

期待:

- 13 Unit file × 5 = 65問
- Expansion 26問
- Total **91問**
- 各Unit **7問以上**
- 13/13 Unit Coverage
- 23/23 Middle Category Coverage

検査:

- Manifest file/count
- Question ID duplicate禁止
- valid unitId / middleCodes / difficulty
- Choice options / answerIndex / explanation
- Written modelAnswer / scoring points
- lessonRefs実在
- `practice-data.js` Manifest読込
- Filter / history / direct `question=`
- Lesson↔Practice link
- Home Practice progress
- Legacy 37問Snapshot維持
- BUILD r12

## `validate-cases.mjs`

Subject B型Long Case専用。

期待:

- **6 Case**
- **18 written questions**
- 各Case 3設問
- Security / Network / Database / System Development / Project / BusinessをCoverage

検査:

- Case/Question ID duplicate禁止
- scenario 2段落以上
- 20分以上の想定時間
- valid unitId / middleCodes
- lessonRefs実在
- Model Answer / scoring points
- Case history key
- HTML / CSS / JS
- Canonical Navに `📚 長文Case`
- BUILD r12

## `validate-past-lesson-map.mjs`

既存Security過去問7問:

- 7/7 Mapping
- lessonRefs実在
- Lesson→Past direct link
- Past `id=` direct open

## `validate-progress.mjs`

学習進捗Dashboard専用。

Input:

- 118Lesson
- Short Practice 91問
- Long Case 6本
- 13 Unit / 23 Middle Category

検査:

- `html/progress.html` / CSS / JS
- Lesson/Practice/Case localStorage key
- Practice Manifest
- Case Bank
- 13 UnitすべてにLesson + Short Practice
- 23 Middle CategoryすべてにLesson + Short Practice
- Case retry / Practice retry / Lesson continue links
- Canonical Navigationに `📈 学習進捗`
- BUILD r12

## Browser検査

`tests/data-integrity.test.html` は旧6教材中心のBrowser検査として残す。

CIとは別途、実Browserで次を確認する必要がある。

- PC / Mobile
- Dark Mode
- 118Lesson全表示
- 全Lesson確認問題
- Table / Diagram horizontal scroll
- 13 Unit Hub
- Short Practice 91問全操作
- Written self-grade
- Long Case 6本 / 18設問
- Lesson ↔ Practice direct link
- Lesson ↔ Past direct link
- Progress Dashboard
- Canonical Navigation

未確認項目をCI successだけで「確認済み」としない。
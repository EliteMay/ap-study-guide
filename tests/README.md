# AP Study Notes tests

品質確認をサイト本体から分離して管理するフォルダ。

CIは構文・Data・内部参照・Coverageを保証する。実Browserの見た目や全Clickを完全保証するものではない。

## `validate.mjs`

基本Data / 既存機能検証。

主な検査:

- 全JSON構文
- 旧6教材manifest / JSON件数
- 用語ID / category / required fields
- terms-details対応
- Security過去問target
- 主要HTML参照
- IPA大分類9 / 中分類23 / 学習Unit13
- Base Lesson構造
- Algorithm 65/65割当

## `validate-audits.mjs`

旧教材監査と実Lesson移行。

対象:

- System 75/75
- Management 72/72
- Database 229/229
- Network 480/480

`legacyTermRanges`を展開し、missing / duplicate / extra IDを検出する。

## `validate-security-audit.mjs`

Security 501語のCross-domain再分類専用。

期待:

- Security 369
- Network 104
- Computer Systems 13
- Law 10
- System Development 2
- Service / Audit 3
- Total 501

## `validate-computer-systems.mjs`

CMP-01〜12と中分類3〜6のCoverageを検証する。

## `validate-curriculum-expansion.mjs`

118Lessonと23中分類Coverage。

期待:

- Base: 87
- Expansion: 31
- Total: **118**
- 13学習Unitに有効Hub
- IPA中分類1〜23すべてにLesson

## `validate-practice.mjs`

短問総合演習専用。

Runtime正本:

`json/practice/practice-index.json`

期待:

- **91問**
- 13 / 13学習Unit
- 各Unit 7問以上
- 23 / 23 IPA中分類
- Choice / Written両方
- 関連Lesson実在
- Practice画面 / Filter / Random / Direct Link整合
- BUILD r13

旧37問JSONはSnapshotとして維持し、Runtimeから直接読まないことも検証する。

## `validate-cases.mjs`

長文Case専用。

Runtime正本:

`json/cases/case-index.json`

期待:

- Base 6Case
- Expansion 8Case
- **Total 14Case**
- **42 Written questions**
- **13 / 13学習Unit Coverage**
- **23 / 23 IPA中分類Coverage**

検査:

- Manifest count
- Case / Question ID重複
- Scenario長
- estimatedMinutes
- 1Case 3設問
- Model Answer
- 採点観点
- 関連Lesson実在
- Unit / Status Filter
- Random Case
- `ap-study-case-history-v1`
- BUILD r13

## `validate-past-lesson-map.mjs`

既存Security過去問7問をLessonへ対応付けるMappingを検証。

期待:

- 7 / 7 past question Mapping
- 関連Lesson実在
- Lesson → 過去問direct Link
- 過去問Page → target card open

## `validate-progress.mjs`

学習進捗Dashboard専用。

接続対象:

- 118Lesson
- 91短問
- 14長文Case
- 13学習Unit
- 23中分類

検査:

- Lesson / Practice / Case Data loader
- 3種類のlocalStorage Key
- 13 / 13 UnitにLesson・短問・Caseあり
- 23 / 23中分類にLesson・短問・Caseあり
- Unit別Link
- Next Action
- BUILD r13

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
9. `validate-past-lesson-map.mjs`
10. `validate-progress.mjs`

## CIで保証しないもの

以下は実Browser E2Eが別途必要。

- PC表示
- Mobile表示
- Dark Mode
- 118Lesson全表示
- 全Lesson check button
- Table / Diagram horizontal scroll
- 13Unit Hub
- Practice 91問全操作
- Written自己採点
- Case 14本 / 42設問全操作
- Case Filter / Random
- Navigation drawer
- GitHub Pages上での実操作

CI successだけでこれらを「確認済み」と扱わない。
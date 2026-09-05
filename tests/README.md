# AP Study Guide tests

CIは **Data整合・LEARNING Contract・Migration・Runtime構造・保存安全性・Development Diagnostics・主要Browser操作・Visual Review** を検証します。

Build / Guide Version / Project Profileの正本は `json/project-meta.json`、正式要件はRepository Root `REQUIREMENTS.md` です。

Project Profile: `STATIC + DATA + LEARNING + TOOL + PUBLIC-CONTENT`

## Phase 1 Validator

### `validate-phase1-foundation.mjs`

対象: `FND-01`〜`FND-07`

主な検証:

- 既存Lesson ID / Unit / File Path
- importance / frequency / examFocus
- 前提 / 関連Lesson / 用語 / Practice / Official
- 本文Depth / mistakes / Inline Check / 末尾確認
- Practice双方向Mapping
- `json/migrations/lesson-phase1-r26.json`
- 横断検索
- 旧 `AP Study Notes` Backup互換

公開公式問題Mapping不足が残るためPilotをComplete扱いしない。

### `validate-phase1-algorithm.mjs`

対象: `ALG-01`〜`ALG-11` / `PROG-01`〜`PROG-04`

主な検証:

- 現行Lesson集合とr27 Overlayの1対1 Coverage
- 既存Identity
- importance / frequency / examFocus
- 前提 / 関連 / Practice / Official双方向参照
- 本文Depth / mistakes / 末尾確認 / 2 Inline Checks
- `json/migrations/lesson-phase1-algorithm-r27.json`
- `json/curriculum/audits/algorithm-phase1-r27.json`
- Lazy Phase 1 Runtime

過去PhaseのRegression Validatorはglobal Build番号を固定せず、r27 Overlay自身のVersionを検証する。

### `validate-phase1-computer-systems.mjs`

対象: `CMP-01`〜`CMP-12`

主な検証:

- 12 Lesson / 中分類3〜6
- r28 Overlay 1対1 Coverage
- 既存Identity
- Practice / Official双方向Mapping
- 本文Depth / 図解・比較・Trace / mistakes / 末尾3〜5問
- 2 Inline Checks
- Identity Migration
- Syllabus Audit / Completion Blocker
- Lazy Runtime

過去PhaseのRegression Validatorはglobal Build番号を固定せず、r28 Overlay自身のVersionを検証する。

### `validate-phase1-ui-media.mjs`

対象:

- `UIM-01`〜`UIM-04`
- `MED-01`〜`MED-04`

主な検証:

- 8 Lesson / 中分類7〜8
- 既存6 LessonのIdentity
- `UIM-04 / MED-04` の新規Addition
- r29 Overlay 1対1 Coverage
- 学習順 `UIM-01 → 02 → 03 → 04 → MED-01 → 02 → 03 → 04`
- importance / frequency / examFocus
- Direct Practice 8/8
- `P-UIM-06 / P-UIM-07` が `mockEligible:false`
- 2025秋公開問8が `UIM-01〜04` へ逆参照されること
- Media側へ無関係な公式問題を作らないこと
- 本文Depth / mistakes / 末尾3〜5問 / 2 Inline Checks
- `json/migrations/lesson-phase1-ui-media-r29.json`
- `json/curriculum/audits/ui-media-phase1-r29.json`
- Curriculum Mapが古い `missing` ではなく実装済み `partial`
- Lesson Snapshot 120 / Practice Snapshot 141

Media側の公開公式問題Mapping、科目A型Variation、Cross-unit Reviewが残るためPilotをComplete扱いしない。

## その他Static Validator

### `validate.mjs`

既存Data / Manifest / ID /主要HTML参照の基本整合。

### `validate-audits.mjs`

System / Management / Database / Networkの監査ID・移行先。

### `validate-security-audit.mjs`

Security 501語のCross-domain再分類。

### `validate-computer-systems.mjs`

CMP-01〜12と中分類3〜6。

### `validate-curriculum-expansion.mjs`

Current Curriculum / Lesson Index / Generic Unit Hub / IPA中分類Coverage / `APLessonData` Loaderを検証する。

現在のSnapshot:

- Base Lesson: 87
- Expansion Lesson: 33
- Total Lesson: 120
- Unit: 13
- IPA中分類: 23

これらの教材件数は要件上の固定値ではない。Lessonを追加・再編したChange SetではDataとOracleを同時に更新する。

### `validate-practice.mjs`

Practice Manifestを正本に検証する。

- Current Unit / Middle Coverage
- Current Lesson集合へのDirect Practice Coverage
- Choice / Written Schema
- Coverage Bank
- `mockEligible:false`
- Loader / memoize
- Lesson→Practice / Home / Navigation

r29 Snapshotは141問 / 120 Lesson Direct Coverage。

### `validate-cases.mjs`

Case Data / Question / Model Answer /採点観点 / Written Guard / Navigation。

### `validate-mock.mjs`

現行Mock ConfigとPractice Pool、Timer / Answer / Flag / Session復帰 / Self Gradeを検証する。

r29の `P-UIM-06 / P-UIM-07` はDirect Practice用だが、科目A型Variation監査前なのでFull Mockへ混ぜない。

### `validate-official-past.mjs`

- Current Exam Year / CBT
- 2026実問題非公開Contract
- 収録済み公開公式問題
- Lesson Mapping
- IPA公式URL
- Navigation

### `validate-past-lesson-map.mjs`

Legacy Security過去問とLesson Mapping。

### `validate-progress.mjs`

Lesson / Practice / Case件数をManifest / Indexから集計し、Progress表示へ接続する。固定件数へ依存しない。

### `validate-runtime-quality.mjs`

主なRegression Guard:

- `AP Study Guide`
- Guide 1.17.0
- `STATIC + DATA + LEARNING + TOOL + PUBLIC-CONTENT`
- Phase 1 `in-progress`
- Central Loader
- Current Mastery / Review Due / Written Guard
- Generic Unit Hub
- Action-first Home / 横断検索
- Phase 1 Lazy Overlay
- Dynamic Count
- Backup Validation / Rollback
- Mobile Drawer
- Local Diagnostics / Privacy
- PUBLIC-CONTENT / 404 Recovery

### `validate-glossary.mjs`

統合Glossary、旧6Manifest、Lazy Detail、Bookmark / Checked、Pagination、Navigation。

## Browser Smoke

### `e2e-smoke.mjs`

Product全体の主要Browser操作をPlaywright Chromiumで確認する。

- Metadata / Guide / Profile / Phase
- Home Unit動的件数
- Launcher / Cross Search
- Diagnostics
- Lesson / Term / Practice Search
- Glossary
- Generic Unit Hub
- Current Lesson全件のDirect Practice
- Lesson→Practice実遷移
- Foundation Learning Map / Inline Check
- Written / Case Guard
- 320px主要Route
- Mobile Drawer
- Backup拒否 / Legacy互換 / XSS防止
- 404 Recovery
- Console / Page Errorなし

### `e2e-phase1-algorithm.mjs`

Algorithm / Programming専用Regression。

- ALG-01 Metadata / Learning Map / Inline Check
- ALG-10 Official Mapping
- PROG-03
- Search
- 320px

### `e2e-phase1-computer-systems.mjs`

Computer Systems専用Regression。

- CMP-03 / CMP-07 / CMP-12
- Official / Practice / Inline Check
- Search
- Unit Hub Unique Lesson集合
- 320px

### `e2e-phase1-ui-media.mjs`

UI・情報メディア専用Regression。

- UIM-01 Metadata / Learning Map / 2025秋問8 / Inline Check
- 新規UIM-04 / MED-04の表示
- 新規Direct Practice
- MED-04へ無関係なOfficial Mappingが出ないこと
- Cross SearchからUIM-04 / MED-04へ到達
- Unit Hub Unique Lesson集合8件
- Unit Hub学習順 `UIM-01〜04 → MED-01〜04`
- 表示番号 `01〜08`
- UIM-04 / MED-04 / Unit Hubの320px横Overflow
- Console / Page Errorなし

## Visual Review

`tests/visual-review.mjs`

Desktop 1280px / Mobile 390pxで主要RouteをScreenshot化する。

Phase 1重点対象:

- Foundation: `FND-02`
- Algorithm: Unit Hub / `ALG-01`
- Computer Systems: Unit Hub / `CMP-03` / `CMP-12`
- UI・情報メディア: Unit Hub / `UIM-04` / `MED-04`
- Search / Glossary / Practice / Case / Mock / Official / Progress / Data / Diagnostics

Scriptは次も機械確認する。

- 横Overflowなし
- Suspiciously Emptyでない
- Mobileで非Focus Skip Linkが露出しない
- Console / Page Errorなし

Screenshot生成だけでVisual Reviewedとは扱わず、最終PR HEADのArtifactを実際に確認する。

## Backup Compatibility Policy

Product名変更だけではStorage Keyを変更しない。

- 新規Export App名: `AP Study Guide`
- Import受理: `AP Study Guide` / `AP Study Notes`
- 既存localStorage Key: 維持
- Backup Schema Version: Metadataに従う

## GitHub Actions順序

`.github/workflows/validate.yml`

1. JavaScript Syntax
2. Basic JSON / References
3. Foundation Phase 1
4. Algorithm Phase 1
5. Computer Systems Phase 1
6. UI・情報メディア Phase 1
7. Domain / Curriculum / Practice / Case / Mock / Official / Progress
8. Runtime Quality / Glossary
9. Playwright Chromium
10. Product Browser Smoke
11. Algorithm Browser Smoke
12. Computer Systems Browser Smoke
13. UI・情報メディア Browser Smoke
14. Visual Review
15. Screenshot Artifact Upload

## CIで完全には保証しないもの

- 全Lesson全Sectionの教育品質
- 全問題選択肢の妥当性
- 全Practice / Caseの回答品質
- Mockの実時間経過
- Dark Mode全画面
- Legacy互換Page全表示
- 全外部IPA Link
- Firefox総合Smoke
- 長時間Performance
- 実利用者によるUser Validation

Direct Practice Coverageは参照整合を保証するもので、全問題の難易度・本番類似度を保証しない。

## Verification State

作業報告では次を区別する。

- Implemented
- Static Validated
- Browser Validated
- Visual Reviewed
- GitHub Pages Validated
- User Validated
- Known Limitation
- Not Verified

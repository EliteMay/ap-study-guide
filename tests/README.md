# AP Study Guide tests

CIは **Data整合・LEARNING Contract・Migration・Runtime構造・保存安全性・Development Diagnostics・主要Browser操作・Visual Review** を検証します。

- Build / Guide / Project Profile正本: `json/project-meta.json`
- 正式要件: `REQUIREMENTS.md`
- Current Guide: `EliteMay/web-project-guide` 1.17.1
- Project Profile: `STATIC + DATA + LEARNING + TOOL + PUBLIC-CONTENT`

## Phase 1 Validator

### `validate-phase1-foundation.mjs`

対象: `FND-01〜07`

- Foundation Lesson自身のPhase 1 Metadata
- Direct Practice
- 本文Depth / mistakes / Inline Check / End Check
- Identity Migration
- Cross Search / Legacy Backup compatibility

過去Pilot Validatorはcurrent Guide patchの正本にはしない。Foundation固有ContractをRegression Guardする。

### `validate-phase1-algorithm.mjs`

対象: `ALG-01〜11 / PROG-01〜04`

- r27 Companion Data 1対1 Coverage
- Direct Practice / Official Mapping
- 本文Depth / Inline Check
- Identity Migration
- r27 Syllabus Audit
- Lazy Overlay Runtime

### `validate-phase1-computer-systems.mjs`

対象: `CMP-01〜12`

- r28 Companion Data
- 中分類3〜6
- Direct Practice 12/12
- Official Mapping
- Identity Migration
- Syllabus Audit
- Lazy Overlay Runtime

### `validate-phase1-ui-media.mjs`

対象: `UIM-01〜04 / MED-01〜04`

- r29 Companion Data
- 中分類7〜8
- 学習順 `UIM-01→04 → MED-01→04`
- Direct Practice 8/8
- 2025秋問8 Mapping
- Existing Identity + UIM-04/MED-04 Addition
- 新規2問のMock除外

### `validate-phase1-database.mjs`

対象: `DB-01〜14`

r30専用Static Contract:

- Current Database Lesson集合がDB-01〜14
- 学習順がDB-01→DB-14
- Current Guide 1.17.1 / Build r30 / Phase 1 in-progress
- `json/phase1/database-r30.json` と14 Lessonが1対1
- importance / frequency / examFocus
- prerequisite / related Lesson実在
- relatedTerms
- Direct Practice参照とQuestion側逆参照
- Public Official参照とLesson側逆参照
- Objectives >=3
- Sections >=5
- mistakes Section
- Comparison / Diagram / SQL Trace等の具体的理解要素
- End Check 3〜5問
- Inline Check exactly 2
- Direct Practice 14/14
- Public Official直接Mapping集合が `DB-02 / DB-03 / DB-04 / DB-05 / DB-06`
- `json/migrations/lesson-phase1-database-r30.json` の14 Identity Mapping
- 既存Storage Key維持
- `json/curriculum/audits/database-phase1-r30.json` がPilot
- 旧 `database-audit.json` の不足8学習目標を現行Lesson Evidenceで再評価済み
- Completion Blockerが明示されていること
- Lazy Overlay Runtime

DatabaseはStaticが通ってもComplete扱いにしない。公式問題Mapping5/14、科目A型Variation、Cross-unit Reviewが残る。

## その他のStatic Validator

### `validate.mjs`

JSON Parse、Manifest、ID、Reference、Curriculum等の基本整合。

### `validate-audits.mjs`

既存Domain AuditのID・Mapping等を確認。

### `validate-security-audit.mjs`

Security 501語の監査Contract。

### `validate-computer-systems.mjs`

Computer Systems CoverageのLegacy/Current Contract。

### `validate-curriculum-expansion.mjs`

Current Lesson Index、Generic Unit Hub、IPA中分類Coverageを検証する。13 Unit / 120 LessonはSnapshotであり固定要件ではない。

### `validate-practice.mjs`

Practice Manifest、Choice/Written Schema、Current Lesson Direct Coverage、`mockEligible`、Loader、Lesson導線。

### `validate-cases.mjs`

Case Data / Model Answer / Self Grade Contract。

### `validate-mock.mjs`

Mock Config / Practice Pool / Timer / Answer / Flag / Session復帰。Coverage用問題を意図せずMockへ混ぜない。

### `validate-official-past.mjs`

Current CBT Contract、2026非公開実問題、2025公開問題、Lesson Mapping、IPA URL。

### `validate-past-lesson-map.mjs`

Legacy過去問とLesson Mapping。

### `validate-progress.mjs`

Lesson / Practice / Case件数をManifest / Indexから動的集計し、旧固定件数へ依存しないことを確認。

### `validate-runtime-quality.mjs`

Global Runtime Contractの正本Oracle。

- `AP Study Guide`
- **Guide 1.17.1**
- Project Profiles
- Phase 1 in-progress
- Central Loader
- Current Mastery / Review Due
- Generic Unit Hub
- Action-first Home
- Cross Search
- Lazy Phase 1 Overlay
- Dynamic Count
- Backup Validation / Rollback
- Accessible Mobile Drawer
- Local Diagnostics
- PUBLIC-CONTENT / 404 Recovery

Current Guide patchの厳密判定はこのGlobal ValidatorとProduct E2Eが担当し、過去Phase Validatorへ重複させない。

## Browser Smoke

### `e2e-smoke.mjs`

Product全体の主要Browser操作。

- Project Metadata / Guide 1.17.1 / LEARNING Profile
- Home / Cross Search / Glossary
- Generic Unit Hub
- Current Lesson全件 Direct Practice Coverage
- Lesson / Practice / Case操作
- Foundation Inline Check
- 320px主要Route
- Mobile Drawer
- Backup Import / Legacy compatibility / XSS guard
- Diagnostics / 404
- Console / Page Errorなし

### `e2e-phase1-algorithm.mjs`

Algorithm / Programming Phase 1 Browser Regression。

### `e2e-phase1-computer-systems.mjs`

Computer Systems Phase 1 Browser Regression。

### `e2e-phase1-ui-media.mjs`

UI・情報メディア Phase 1 Browser Regression。新Lesson、学習順、表示番号、320pxを含む。

### `e2e-phase1-database.mjs`

Database r30 Browser Contract:

- Phase1 Manifest / 14 Overlay
- DB-03 Metadata / Learning Map / Inline Check / P-DB-01 / 2025春秋問6
- DB-05 SQL Lesson / P-DB-02 / 2025春秋問6
- DB-09 Transaction / P-DB-04 / 無関係なOfficial Mappingなし
- DB-14 Medium importance/frequency / PC-DB-14
- Cross Search → DB-11
- Database Unit Hub title
- Unit Hub DOM順 DB-01→14
- Unit Hub表示番号 01→14
- 320px DB-05 / DB-09 / DB-14 / Unit Hub
- Console / Page Errorなし

## Visual Review

`tests/visual-review.mjs`

Desktop 1280pxとMobile 390pxで主要RouteをScreenshot化する。

Database r30追加対象:

- `html/unit.html?unit=database`
- `html/lesson.html?id=DB-03`
- `html/lesson.html?id=DB-05`
- `html/lesson.html?id=DB-09`

ScriptはScreenshot生成に加え次を機械確認する。

- 横Overflowなし
- Suspiciously Emptyでない
- Mobileで非FocusのSkip Linkが露出しない
- Console / Page Errorなし

Screenshot生成だけでVisual Reviewedとは扱わず、最終Artifactを実際に確認する。

## Backup Compatibility Policy

Product名変更だけではStorage Keyを変更しない。

- 新規Export App名: `AP Study Guide`
- Import受理: `AP Study Guide` / `AP Study Notes`
- 既存localStorage Key: 維持
- Backup Schema Version: Metadata正本

Guide 1.17.1のdestructive Reset/Delete Ruleは、今後Reset implementationを変更するときに別途適用する。r30はReset処理自体を変更しない。

## GitHub Actions

`.github/workflows/validate.yml`

順序:

1. JavaScript Syntax
2. Basic JSON / References
3. Phase 1 Foundation
4. Phase 1 Algorithm / Programming
5. Phase 1 Computer Systems
6. Phase 1 UI・情報メディア
7. Phase 1 Database
8. Domain / Curriculum / Practice / Case / Mock / Official / Progress
9. Runtime Quality / Glossary
10. Playwright Chromium Install
11. Product Browser Smoke
12. Unit別Phase 1 Browser Smoke
13. Visual Review
14. Screenshot Artifact Upload

## CIで完全には保証しないもの

- 全Lesson全Sectionの教育品質
- 全Practice / Caseの本番類似度
- Mockの実時間経過
- Dark Mode全画面
- Firefox総合Smoke
- 外部IPA Linkの継続可用性
- 長時間Performance
- 実利用者によるUser Validation

Direct Practice Coverageは参照整合を保証するもので、問題Variationや難易度の十分性を保証しない。

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

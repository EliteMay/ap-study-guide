# AP Study Notes tests

CIは **Data整合・Runtime構造・保存安全性・主要Browser操作** を検証します。

Buildの正本は `json/project-meta.json` です。Test READMEや各ValidatorへBuild文字列を重複して持ちません。

Project Profile: `STATIC + DATA + TOOL + PUBLIC-CONTENT`

採用Guide: `EliteMay/web-project-guide`（Versionは `json/project-meta.json` に記録）

## Validator一覧

### `validate.mjs`

- 全JSON構文
- 旧6教材Manifest / 件数 / ID
- Security / Network / Database details対応
- Security既存過去問target
- 主要HTML参照
- IPA 9大分類 / 23中分類 / 13Unit
- Base Lesson構造
- Algorithm 65/65

### `validate-audits.mjs`

System / Management / Database / Networkの監査ID・移行先を検証。

### `validate-security-audit.mjs`

Security 501語のCross-domain再分類を検証。

### `validate-computer-systems.mjs`

CMP-01〜12と中分類3〜6。

### `validate-curriculum-expansion.mjs`

- Base Lesson 87
- Expansion 31
- Total 118
- Generic 13Unit Hub
- IPA中分類1〜23 Lesson Coverage
- `APLessonData` Loader

### `validate-practice.mjs`

現在はManifestから139問を読み込む。固定件数をValidatorへ重複させず、Manifestの宣言値と各File実件数を照合する。

主な検証:

- 13/13 Unit
- 23/23中分類
- **118/118 Lessonが短問から直接参照される**
- Choice / Written Schema
- `json/practice/ap-lesson-coverage-v1.json` の存在
- Coverage Bankは1問につき1 Lesson参照
- Coverage Bankの4択は `mockEligible:false`
- Manifest Loader / memoize
- Recent-result mastery
- Written Guard
- Lesson→Practice / Home / Navigation接続

### `validate-cases.mjs`

- 16Case / 48設問
- 13/13 Unit
- 23/23中分類
- 1Case 3設問
- Model Answer / 採点観点
- Written Guard
- Navigation

### `validate-mock.mjs`

科目A:

- 150分
- 80問 / 80解答
- Practice由来の **mockEligibleな4択57問** + Mock専用23問
- Lesson Coverage追加4択はMock Poolから除外

科目B:

- 150分
- 11問提示 / 5問解答
- Security必須
- 選択10分野

RuntimeのTimer / Answer / Flag / Session復帰 / Self GradeとHome / Progress接続を検証。

### `validate-official-past.mjs`

- currentExamYear 2026
- CBT
- 2026実問題非公開
- latest public full = 2025
- 2025春 + 秋 午後22大問
- Lesson Mapping
- IPA公式URL
- Navigation

### `validate-past-lesson-map.mjs`

既存Security過去問7/7 Lesson Mapping。

### `validate-progress.mjs`

Lesson / Practice / Caseの件数を各Manifest / Indexから集計し、13Unitへ接続する。Practice件数増加時に91等の古い固定値へ依存しない。

### `validate-runtime-quality.mjs`

Web Project Guideで再発コストが高い項目を、このサイトに必要な範囲でRegression Guardする。

検証:

- `json/project-meta.json` が存在する
- Build形式
- Guide Repository / Version
- `STATIC + DATA + TOOL + PUBLIC-CONTENT`
- GitHub Pages target
- Backup Schema Version
- `js/shell.js` に固定BUILDが再混入していない
- Central Loader
- Strict Mastery / Review Due / Written Guard
- Generic Unit Hub
- Action-first Home
- Home件数の旧hardcode再混入禁止
- Home Loading失敗時のError / Retry State
- Home Finder Listener重複防止
- Glossary Navigation
- Backup Key別Validation
- Restore前Backup
- Restore失敗時Rollback
- Import Previewをraw `innerHTML`へ入れない
- Accessible Mobile Drawer

### `validate-glossary.mjs`

- `html/glossary.html`
- `css/glossary.css`
- `js/glossary.js`
- 旧6Manifest
- 全Term File count
- Total 1,422
- 旧6 `*-terms-checked`
- `ap-study-bookmarks-v1`連携コード
- Details Manifest
- `PAGE_SIZE = 60`
- 60件ずつDOM描画
- 詳細JSON Lazy Load
- Detail File memoize
- `no-store`を使わない
- Unit Hub→Glossary
- Home Quick Finder
- Sidebar Glossary

## Browser Smoke

`tests/e2e-smoke.mjs`

Playwright Chromiumで実ブラウザ操作する。

現在の対象:

1. Action-first Homeを開く
2. `project-meta.json` のBuild表示を確認
3. Homeの教材件数がLoading状態から実Dataへ更新される
4. 13Unit Card / 主要8Action確認
5. Home Search→Glossary
6. Glossary検索 / Lazy Detail
7. Security Generic Hub→Domain指定Glossary
8. **Practice ManifestをBrowserから読み、118 Lessonすべてに直接参照があることを確認**
9. **ALG-01 LessonからPC-ALG-01へ実際に遷移し問題表示を確認**
10. Lessonを全問誤答しMasteredにならないこと
11. Written Practiceの空欄Guard
12. Long Caseの空欄Guard
13. 320px Homeでページ全体の横overflowなし
14. Mobile Drawerの`inert` / Open / Escape Close
15. 320px Glossaryでページ全体の横overflowなし
16. Backup Export / Import UI
17. 壊れた認識済みStorage JSONをImport拒否
18. Import JSON内のHTML文字列をDOMとして実行しない
19. Validation済みBackupを実際にRestoreできる
20. Browser console / page errorがないこと

Backup Restore Smokeは、既存保存Dataがある状態で実行するため、復元直前BackupのDownload経路も通る。

## GitHub Actions

`.github/workflows/validate.yml`

実行順:

1. JavaScript Syntax
2. Basic JSON / References
3. Domain Audits
4. Security Audit
5. Computer Systems
6. Curriculum / Unified Hub
7. Practice
8. Case
9. Mock
10. Official Public Mapping
11. Security Past Mapping
12. Progress
13. Runtime Quality / Guide Profile / Backup Safety
14. Unified Glossary / Action Home
15. Install Playwright Chromium
16. Browser Smoke

## CIで完全には保証しないもの

- 118Lesson全表示
- 全Lesson Checkの全選択肢
- 139問すべてのUser操作・回答品質
- 16Case / 48設問全操作
- Mock 150分の実時間経過
- 全Table / Diagramの全Viewport
- Dark Mode全画面
- Legacy互換ページ全用語Card
- すべての外部IPA PDF Link
- 長時間利用時の全Performance
- 実利用者によるUser Validation

`118/118` はLesson→短問の参照整合を保証するもので、全問題の難易度・本番類似度を保証する値ではない。

## Verification State

作業報告では必要に応じて以下を区別する。

- Implemented
- Static Validated
- Browser Validated
- GitHub Pages Validated
- User Validated
- Known Limitation
- Not Verified

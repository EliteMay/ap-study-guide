# AP Study Notes tests

CIは構文・Data・参照・Runtime設計に加えて、主要導線をChromiumで実操作します。

## Validator

### `validate.mjs`

旧6教材Data、JSON構文、主要参照、IPA 9大分類 / 23中分類 / 13Unit、Base Lesson、Security過去問などの基礎整合。

### `validate-audits.mjs`

System 75/75、Management 72/72、Database 229/229、Network 480/480の監査・Lesson割当。

### `validate-security-audit.mjs`

Security 501/501の監査とCross-domain再分類。

### `validate-computer-systems.mjs`

CMP-01〜12、中分類3〜6、Computer Systems教材整合。

### `validate-curriculum-expansion.mjs`

- Base87 + Expansion31 = 118Lesson
- 23/23中分類Lesson Coverage
- 13Unitの統一Hub
- `APLessonData`による中央Loader

### `validate-practice.mjs`

- 91短問
- Choice57 + Written34
- 13/13 Unit
- 23/23中分類
- Manifest Runtime
- 記述空欄Guard
- `APStudyState`による現在理解判定
- BUILD r16

### `validate-cases.mjs`

- 16Case / 48Written
- 13/13 Unit
- 23/23中分類
- 1Case 3設問
- 記述空欄Guard
- `APStudyState`利用
- BUILD r16

### `validate-mock.mjs`

科目A:

- 80問 / 80解答 / 150分
- Practice choice57 + Mock extra23

科目B:

- 11問提示 / 5問解答 / 150分
- Security必須
- 選択10分野

Timer / Flag / Session保存 / Reload復帰 / 自動提出 / 自己採点などを静的検証。

### `validate-official-past.mjs`

- 2026 AP = CBT
- 2026実問題 = non-public
- 最新公開Full Exam = 2025
- 春11 + 秋11 = 22大問
- Lesson Mapping / IPA URL

### `validate-past-lesson-map.mjs`

既存Security過去問7/7のLesson Mapping。

### `validate-progress.mjs`

118Lesson + 91短問 + 16Case + Mock履歴を現在理解状態で集計するDashboardを検証。

### `validate-runtime-quality.mjs`

r16の再発防止専用。

主な強制項目:

- `js/study-state.js`存在
- `js/lesson-data.js`存在
- Lesson / Practice / Case Loader統一
- 旧37問Snapshotの直接Runtime読込禁止
- Lesson 75%基準
- Written Practice 12文字Guard
- Long Case 20文字Guard
- 13Unitの`unit.html?unit=...`統一
- Backup / Restore page
- Compact Shared Navigation
- Mobile `inert`
- BUILD r16

## Browser Smoke

`tests/e2e-smoke.mjs`

Playwright ChromiumをGitHub Actions上で起動し、HTTP Server経由で実操作します。

確認内容:

1. Homeが表示され13Unit Cardが生成される。
2. `unit.html?unit=security`が汎用Hubとして動く。
3. 旧用語辞書Linkが存在する。
4. Lesson確認問題を全問誤答してもMasteredにならない。
5. Written Practiceは空欄でModel Answerを開けない。
6. 十分回答するとModel Answerを開ける。
7. Long Caseも空欄ではModel Answerを開けない。
8. Mobile幅390pxで閉じたSidebarが`inert`になる。
9. Menu Open時は`inert`解除。
10. EscapeでCloseし再び`inert`になる。
11. Backup pageのExport / Import UIが存在する。
12. Browser console / page errorを検出する。

初回導入時、このSmokeでSkip LinkがMobile Menuのpointer eventを奪う実UI不具合を検出した。

## Workflow

`.github/workflows/validate.yml`

概略:

1. JS / MJS syntax
2. 基礎Data Validator
3. Audit Validators
4. Curriculum / Practice / Case / Mock / Official / Progress Validators
5. Runtime Quality Validator
6. Playwright Chromium install
7. Browser Smoke

## CIでまだ完全保証しないもの

- 全118Lessonの全表示・全問題
- 91短問全操作
- 16Case / 48設問全操作
- 科目A 80問の全Navigator操作
- 150分の実時間経過
- 全Dark Mode visual
- 全画面サイズのVisual Regression
- GitHub Pages本番URL上での全操作
- IPA外部PDF先の可用性

したがってSmoke successは「主要導線の実Browser確認」であり、全画面総当たり完了とは扱いません。

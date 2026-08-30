# AP Study Notes tests

CIは **Data整合・Runtime構造・主要Browser操作** を検証します。

BUILD基準: **`2026.08.30-r17`**

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

- 91問
- Choice57 + Written34
- 13/13 Unit
- 23/23中分類
- Lesson参照
- Manifest Loader
- Recent-result mastery
- Written Guard
- r17 Home / Navigation接続

### `validate-cases.mjs`

- 16Case / 48設問
- 13/13 Unit
- 23/23中分類
- 1Case 3設問
- Model Answer / 採点観点
- Written Guard
- r17 Navigation

### `validate-mock.mjs`

科目A:

- 150分
- 80問 / 80解答
- Practice Choice57 + Mock専用23

科目B:

- 150分
- 11問提示 / 5問解答
- Security必須
- 選択10分野

RuntimeのTimer / Answer / Flag / Session復帰 / Self Gradeと、r17 Home / Progress接続を検証。

### `validate-official-past.mjs`

- currentExamYear 2026
- CBT
- 2026実問題非公開
- latest public full = 2025
- 2025春 + 秋 午後22大問
- Lesson Mapping
- IPA公式URL
- r17 Navigation

### `validate-past-lesson-map.mjs`

既存Security過去問7/7 Lesson Mapping。

### `validate-progress.mjs`

118Lesson + 91短問 + 16Case + Mock履歴を13Unitへ接続。

### `validate-runtime-quality.mjs`

- BUILD r17
- Central Loader
- Strict Mastery
- 14日Review Due
- Written / Case Guard
- 13 Generic Unit Hub
- Action-first Home
- Glossary Navigation
- Backup / Restore
- Accessible Mobile Drawer

### `validate-glossary.mjs`

r17で追加。

検証:

- `html/glossary.html`
- `css/glossary.css`
- `js/glossary.js`
- 旧6Manifest
- 全Term File count
- Total **1,422**
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
- BUILD r17

## Browser Smoke

`tests/e2e-smoke.mjs`

Playwright Chromiumで実ブラウザ操作する。

現在の対象:

1. Action-first Homeを開く
2. 13Unit Cardが13枚ある
3. 主要Actionが8個ある
4. Home Searchへ`OAuth`入力
5. Glossary検索導線が出る
6. `glossary.html?q=OAuth`を開く
7. OAuth検索Resultを確認
8. 詳しい解説をLazy Open
9. Security Generic Hubを開く
10. Unit内Glossary Linkが`domain=security`であること
11. Lessonを全問誤答しMasteredにならないこと
12. Written Practiceの空欄Guard
13. Long Caseの空欄Guard
14. 390px Mobile Drawerの`inert`
15. Menu Open / Escape Close
16. Backup Export / Import UI
17. Browser console / page errorがないこと

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
13. Runtime Quality
14. **Unified Glossary / Action Home**
15. Install Playwright Chromium
16. **Browser Smoke**

## CIで完全には保証しないもの

Browser Smokeを導入したが、以下は総当たりではない。

- 118Lesson全表示
- 全Lesson Check
- 91問全操作
- 16Case / 48設問全操作
- Mock 150分の実時間経過
- 時間切れ自動提出の150分実待機
- 全Table / Diagramの全Viewport
- Dark Mode全画面
- 旧互換ページ全1,422カード
- すべての外部IPA PDF Link

CI successだけでこれらを全確認済みとは扱わない。

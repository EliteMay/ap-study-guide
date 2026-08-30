# AP Study Notes

応用情報技術者試験（AP）の個人学習用・静的Webアプリです。

- 正本: GitHub `EliteMay/ap-study-notes`
- 公開: `https://elitemay.github.io/ap-study-notes/`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 技術: HTML / CSS / JavaScript / JSON / PDF
- Server必須機能・秘密情報なし
- Build / Project Profile正本: `json/project-meta.json`
- 制作Guide: `EliteMay/web-project-guide`

## Project Profile

`STATIC + DATA + TOOL + PUBLIC-CONTENT`

このサイトでは、GitHub Pages相対Path、大量教材JSONのManifest/ID/Lazy Load、localStorageの保存互換・Backup、公開教材の出典と安全性を重点確認します。

## 目的

AP学習を次の流れで1サイトにつなげます。

**範囲を選ぶ → Lessonで理解する → 短問で取り出す → 長文Caseで説明する → 模試で時間配分を確認する → 公開公式問題へ進む → 弱点を復習する**

分からない用語は主教材とは分離した「単語辞書」で検索します。

優先順位は **操作性 → 分かりやすさ → 安定性 → 軽量化 → 保守性 → 見た目** です。

## 利用方法

GitHub PagesのHomeを開き、目的から選びます。

- **Lessonで学ぶ** — 13学習ユニットから構造化Lessonへ進む
- **単語を調べる** — 旧6分野の用語資産を横断検索
- **短問を解く** — 4択・記述の総合演習
- **長文Caseを解く** — 科目Bを意識した記述Case
- **150分模試をする** — 科目A / 科目Bの時間配分練習
- **公式問題へ進む** — IPA公開問題とLessonを往復
- **進捗・弱点を見る** — 復習期限と現在の理解状態を確認
- **学習データを管理** — Backup / Restore

Home上部の検索欄は、機能名・分野名・用語検索の入口を兼ねます。

## 現在の教材構成

件数のRuntime正本は各Manifest / Indexです。以下はREADME更新時点の概要で、UI側では可能な限りDataから算出します。

| 項目 | 概要 |
|---|---:|
| IPA大分類 | 9 |
| IPA中分類 | 23 |
| 学習ユニット | 13 |
| 構造化Lesson | 118 |
| 短問 | 91 |
| 長文Case | 16 / 48設問 |
| 旧用語資産 | 1,422語 |
| 2025春・秋 公開午後問題Mapping | 22大問 |

`23/23` の教材入口があることは、IPA全小分類・全出題パターンの完全Coverageを意味しません。

## 主なページ

| 用途 | Page |
|---|---|
| Home | `index.html` |
| 13ユニット | `html/roadmap.html` |
| Unit Hub | `html/unit.html?unit=<UNIT_ID>` |
| Lesson | `html/lesson.html?id=<LESSON_ID>` |
| 単語辞書 | `html/glossary.html` |
| 短問 | `html/practice.html` |
| 長文Case | `html/cases.html` |
| 模試 | `html/mock.html` |
| 公式公開問題 | `html/official-past.html` |
| 学習進捗 | `html/progress.html` |
| Backup / Restore | `html/data.html` |

## Dataの正本

### Project metadata

`json/project-meta.json`

- Build
- 採用Guide Version
- Project Profile
- Deployment
- Backup Schema Version

表示BuildをHTMLや各Validatorへ個別に直書きしません。

### Lesson

- `json/lessons/lesson-index.json`
- `json/lessons/lesson-index-expansion.json`
- Loader: `js/lesson-data.js`

### Practice

- `json/practice/practice-index.json`
- Loader: `js/practice-data.js`

### Case

- `json/cases/case-index.json`
- Loader: `js/case-data.js`

### Mock

- `json/mock/mock-config.json`
- Loader: `js/mock-data.js`

### Curriculum

- `json/curriculum/ap-2026-map.json`
- `json/curriculum/ap-2026-coverage.json`

### Official public exams

- `json/past/ap-public-exams.json`

### Glossary

旧6分野のTerms ManifestとDetails Manifestを再利用します。

通常の用語検索入口は `html/glossary.html` です。旧 `security.html` / `network.html` / `database.html` / `algorithm.html` / `system.html` / `management.html` は、既存URL・ID・保存互換のため残すLegacy Compatibility Layerであり、通常導線では主教材として扱いません。

## 学習状態

判定の正本: `js/study-state.js`

- Lesson: 全確認問題回答 + 75%以上で理解確認
- 4択短問: 最近の結果を重視
- 記述短問: 最低文字数を満たしてから模範解答を確認
- 長文Case: 回答後に自己採点
- 理解確認後は一定期間で復習期限として扱う
- Best Scoreと現在の理解状態を分離

## 保存方法

教材DataはGitHub上のJSON、個人学習履歴はBrowser `localStorage` です。

主要Keyは `js/study-state.js` の `KEYS` / `LEGACY_KEYS` を正本とします。

`html/data.html` からJSON Backup / Restoreができます。

Restoreでは次を行います。

1. Backup Schema確認
2. 認識済みKey確認
3. KeyごとのJSON / Theme形式確認
4. 現在データがある場合は復元直前Backupを自動Download
5. 書き込み失敗時は可能な範囲でRollback
6. 検証成功時だけ現在データへ反映

Import JSONの文字列をraw `innerHTML`へ入れません。

## GitHub Pages

静的構成のためGitHub Pagesでそのまま利用します。

- 相対Pathを維持する
- `localhost` / PC固有絶対Pathへ依存しない
- `fetch()`を使うため正式利用はGitHub PagesまたはHTTP Server経由
- 公開HTML / JS / JSONへ秘密情報を入れない

## Navigation / Accessibility

Shared Shell: `js/shell.js`

- Desktop Sidebar
- Mobile Drawer
- 閉じたMobile Navは `inert` + `aria-hidden`
- Escapeで閉じてMenu ButtonへFocusを戻す
- Skip Link
- `:focus-visible`
- `prefers-reduced-motion`
- Dark Mode

Homeは全機能説明を並べるDashboardではなく、今やる行動を選ぶLauncherとして扱います。詳細な学習分析は `progress.html` の責務です。

## 崩してはいけない仕様

- 既存用語IDを不用意に変更・再利用・削除しない。
- 既存localStorage Keyを変更する場合はMigrationを用意する。
- 旧6用語ページはLegacy Compatibilityの役割を明示して維持する。
- 通常用語検索入口は統合Glossaryへ集約する。
- Lesson / Practice / Case / MockのRuntime正本を分岐させない。
- 13Unit通常入口はGeneric Unit Hubを利用する。
- GitHub Pagesのサブパスで壊れない相対Pathを維持する。
- Import前Validationを外さない。
- Backup / Restoreで元データを先に破壊しない。
- 2026 CBT非公開実問題を公開問題として扱わない。
- 模試得点をIPA公式得点へ直接換算しない。
- `23/23`を試験対策の完全性と表現しない。

## 自動検証

Workflow: `.github/workflows/validate.yml`

主な確認:

- JavaScript構文
- JSON / Manifest / ID / 参照
- Curriculum / Audit
- Lesson / Practice / Case / Mock
- Official problem mapping
- Runtime architecture
- Glossary
- Project metadata / Guide Profile
- Playwright Chromium Smoke

Browser Smokeでは主要導線に加えて、320px幅の横overflow、壊れたBackupの拒否、安全なImport Preview、検証済みBackupのRestoreも確認します。

## Documentation

- 現在仕様: `README.md` / `docs/仕様書.md`
- 変更履歴・今回作業: `docs/作業報告書.md`
- Test説明: `tests/README.md`

READMEへVersionごとの長い作業履歴を積み上げません。

## 既知の不足

- 全Lesson確認問題の難易度再監査は継続課題。
- 短問が直接参照するLessonはまだ全Lessonではない。
- 2025午前および2024以前の公式公開問題Mappingは未完了。
- Legacy用語ページ自体は大規模DOMの旧構造を残す。通常導線では使用しない。
- Browser Smokeは主要導線のみで、全Lesson・全問題・150分実時間の総当たりではない。
- 実利用者による長時間のUser Validationは自動CIでは代替しない。

## 完成の考え方

「コードを書いた」「Static CIが通った」だけでは完成扱いにしません。

主要機能が通常利用でき、保存互換を壊さず、重大な既知バグがなく、README / 仕様 / 作業報告が現行実装と一致し、必要なBrowser SmokeとGitHub Pages公開が同一最終HEADで成功し、未確認事項が明記されている状態を完成基準とします。

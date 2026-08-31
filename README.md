# AP Study Notes

応用情報技術者試験（AP）の個人学習用・静的Webアプリです。

- 正本: GitHub `EliteMay/ap-study-notes`
- 公開: `https://elitemay.github.io/ap-study-notes/`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 技術: HTML / CSS / JavaScript / JSON / PDF
- Server必須機能・秘密情報なし
- Build / Project Profile正本: `json/project-meta.json`
- 制作Guide: `EliteMay/web-project-guide`
- Project Memory: `PROJECT_LEARNINGS.md`

## Project Profile

`STATIC + DATA + TOOL + PUBLIC-CONTENT`

このサイトでは、GitHub Pages相対Path、大量教材JSONのManifest / ID / Lazy Load、localStorageの保存互換・Backup、公開教材の出典と安全性、Interactive Runtimeのローカル診断を重点確認します。

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
| 短問 | 139 |
| Lesson→短問直接Coverage | 118 / 118 |
| 長文Case | 16 / 48設問 |
| 旧用語資産 | 1,422語 |
| 2025春・秋 公開午後問題Mapping | 22大問 |

`23/23` の教材入口や `118/118` の短問直接参照は、IPA全小分類・全出題パターン・全難易度の完全Coverageを意味しません。今後も問題品質と深さを監査します。

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
| Development Diagnostics | `html/diagnostics.html` |
| 404 Recovery | `404.html` |

## Dataの正本

### Project metadata

`json/project-meta.json`

- Build
- 採用Guide Version
- Project Profile
- Deployment
- Backup Schema Version
- Diagnostics Schema / Storage Key / Buffer上限

表示BuildをHTMLや各Validatorへ個別に直書きしません。

### Lesson

- `json/lessons/lesson-index.json`
- `json/lessons/lesson-index-expansion.json`
- Loader: `js/lesson-data.js`

### Practice

- Manifest: `json/practice/practice-index.json`
- Lesson直接Coverage追加Bank: `json/practice/ap-lesson-coverage-v1.json`
- Loader: `js/practice-data.js`

全118 Lessonが少なくとも1つの短問から直接参照されます。Coverage追加Bankは **1 Lesson = 1問** を基本とし、複数Lessonを形式的に1問へまとめてCoverageだけ埋めません。

追加Bankの4択は `mockEligible:false` とし、短問全体を増やしても150分模試の科目A構成が勝手に増えないよう分離します。

### Case

- `json/cases/case-index.json`
- Loader: `js/case-data.js`

### Mock

- `json/mock/mock-config.json`
- Loader: `js/mock-data.js`

科目Aの短問由来Poolは `type === 'choice' && mockEligible !== false` を対象にし、Mock Configで指定した件数を維持します。

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

## Development Diagnostics / Project Memory

最新 `web-project-guide` のInteractive Project方針に合わせ、原因調査用のDiagnosticsを**Local-first**で持ちます。本番AnalyticsやTelemetryではありません。

### Runtime Diagnostics

Core: `js/shell.js`  
View: `html/diagnostics.html` / `js/diagnostics-view.js`  
Storage Key: `json/project-meta.json` の `diagnostics.storageKey`

記録対象:

- App Build / Backup Schema
- Session開始時刻 / Current route
- Viewport / Online状態 / 最小限のPlatform情報
- 主要初期化Step
- JavaScript Error / Unhandled Promise Rejection
- Fetch / Network Failure
- Storage read / write Failure
- Import / Restore結果
- Link / Button等の重要操作Breadcrumb

Breadcrumbは最大100件のRing Bufferとして保持します。Error / Network / Initializationにも個別上限があります。

### 記録しないもの

- Password / API Key / Token / Authorization Header
- 学習回答・記述問題の入力本文
- Backup JSON本体
- File本文
- URL Query / Fragment
- 学習localStorageの全dump

`html/diagnostics.html` から、Sanitize済み診断情報のJSON Export / Copy / Clearができます。外部Serverへ自動送信しません。

Diagnostics Storageは学習Backupの`recognizedKeys()`とは分離し、通常のBackup / Restore / 学習履歴初期化で診断履歴まで混ぜません。

### Project Learnings

長期的な失敗・成功・Regression GuardはRepository Rootの `PROJECT_LEARNINGS.md` を正本とします。

作業報告は「その回で何を変更したか」、Project Learningsは「次回も使うべき知識」を記録します。

## GitHub Pages / PUBLIC-CONTENT

静的構成のためGitHub Pagesでそのまま利用します。

- 相対Pathを維持する
- `localhost` / PC固有絶対Pathへ依存しない
- `fetch()`を使うため正式利用はGitHub PagesまたはHTTP Server経由
- 公開HTML / JS / JSONへ秘密情報を入れない
- Homeは `lang=ja`、意味の分かる`title`、description、canonicalを持つ
- `404.html` からHome / 13Unit / Glossaryへ復帰できる
- Analytics / Form / Third-party Telemetryは現在使用しない
- Diagnosticsは端末内だけに保存し、自動送信しない

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
- Development Diagnosticsへの管理導線

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
- `23/23`や`118/118`を試験対策の完全性と表現しない。
- Lesson Coverage用4択を、意図せず150分模試の科目A Poolへ混入させない。
- Diagnosticsへ秘密情報・学習回答本文・URL Query / Fragmentを保存しない。
- Diagnostics自身を無制限保存しない。
- Development Diagnosticsを学習Backup本体へ無断で混ぜない。

## 自動検証

Workflow: `.github/workflows/validate.yml`

主な確認:

- JavaScript構文
- JSON / Manifest / ID / 参照
- Curriculum / Audit
- 118/118 Lesson→Practice直接参照
- Lesson Coverage用4択のMock除外
- Lesson / Practice / Case / Mock
- Official problem mapping
- Runtime architecture
- Glossary
- Project metadata / Guide Profile
- `PROJECT_LEARNINGS.md`
- Local Diagnostics Contract / Privacy / Buffer上限
- PUBLIC-CONTENT Metadata / 404 Recovery
- Playwright Chromium Smoke

Browser Smokeでは主要導線に加えて、Lesson→Coverage問題への実遷移、DiagnosticsのError / Network / Import / Restore記録、Query Sanitization、320px幅の横overflow、壊れたBackupの拒否、安全なImport Preview、検証済みBackupのRestore、404復帰ページも確認します。

## Documentation

- 現在仕様: `README.md` / `docs/仕様書.md`
- 変更履歴・今回作業: `docs/作業報告書.md`
- 長期Project Memory: `PROJECT_LEARNINGS.md`
- Test説明: `tests/README.md`

READMEへVersionごとの長い作業履歴を積み上げません。

## 最新Guide適用方針

採用Guide Versionは `json/project-meta.json` を正本とします。

Guide 1.7.0ではVisual Design ReviewやAI Agent向け`AGENTS.md`も拡張されましたが、既存ProjectへVisual Layout変更や`AGENTS.md`追加を強制しないCompatibility方針があります。そのためr21では既存UIを全面変更せず、このProjectに直接必要なDiagnostics / Project Memory / PUBLIC-CONTENT / Final-state Validationを適用しています。

## 既知の不足

- 118/118 Lessonへ短問の直接入口はあるが、全問題の難易度・質・本番類似度の再監査は継続課題。
- IPA小分類 / 学習項目単位Coverageの可視化は未完了。
- 2025午前および2024以前の公式公開問題Mappingは未完了。
- Legacy用語ページ自体は大規模DOMの旧構造を残す。通常導線では使用しない。
- Browser SmokeはChromium主要導線のみで、全Lesson・全139問・150分実時間・Firefoxの総当たりではない。
- Diagnosticsは`js/shell.js`が起動した後のRuntime失敗を対象とし、Shell自体の構文エラー等はStatic CI / Browser Console確認で補う。
- 実利用者による長時間のUser Validationは自動CIでは代替しない。

## 完成の考え方

「コードを書いた」「Static CIが通った」だけでは完成扱いにしません。

主要機能が通常利用でき、保存互換を壊さず、重大な既知バグがなく、README / 仕様 / 作業報告 / Project Learningsが現行実装と一致し、必要なBrowser SmokeとGitHub Pages公開が同一最終HEADで成功し、未確認事項が明記されている状態を完成基準とします。
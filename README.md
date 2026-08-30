# AP Study Notes

応用情報技術者試験（AP）の個人学習用・静的Webアプリです。

**BUILD `2026.08.30-r16`**

- 正本: GitHub `EliteMay/ap-study-notes`
- GitHub Pages: `https://elitemay.github.io/ap-study-notes/`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 技術: HTML / CSS / JavaScript / JSON / PDF
- APIキー・Server必須機能なし

## 目的

AP学習を **範囲把握 → Lesson理解 → 直後確認 → 短問 → 長文Case → 150分模試 → 公開公式問題 → 弱点復習** まで一つのサイトでつなげます。

優先順位は **操作性 → 分かりやすさ → 軽量性 → 保守性 → 見た目** です。

## 現在の状態

| 項目 | 状態 |
|---|---:|
| IPA大分類 | 9 / 9 |
| IPA中分類 Lesson Coverage | 23 / 23 |
| 学習ユニット | 13 / 13 |
| 構造化Lesson | 118本 |
| 短問総合演習 | 91問 |
| 長文Case | 16本 / 48設問 |
| 科目Aオリジナル模試 | 80問4択 / 150分 |
| 科目Bオリジナル模試 | 11問提示 → 5問解答 / 150分 |
| 2025春・秋 公開午後問題Mapping | 22 / 22大問 |
| 旧教材監査 | 1,422 / 1,422語 |
| 既存Security過去問Mapping | 7 / 7 |

`23/23` は「全中分類に教材・演習の入口がある」という意味で、各小項目や過去問Coverageまで完全という意味ではありません。

## r16で変えた重要仕様

### 習得判定

以前の「一度正解すれば永久に理解済み」「Lessonを全問クリックすれば完了」を廃止しました。

- Lesson: 全確認問題回答 + **75%以上**で理解確認。
- 4択短問: 最新結果を重視し、最近の結果から状態を判定。
- 記述短問: **12文字以上**回答しないと模範解答を開けない。
- 長文Case: **20文字以上**回答しないと模範解答を開けない。
- 理解確認後 **14日**を目安に復習期限として扱う。
- Best Scoreは履歴として保持するが、現在の理解状態とは分離する。

共通判定: `js/study-state.js`

### 13ユニットの入口統一

全13ユニットの通常学習入口を以下へ統一しました。

`html/unit.html?unit=<UNIT_ID>`

旧 `security.html` / `network.html` / `database.html` / `algorithm.html` / `system.html` / `management.html` などは削除せず、旧用語検索・Bookmark・既存進捗互換用の辞書として残します。

### Loader統一

- Lesson: `js/lesson-data.js`
- Practice: `js/practice-data.js`
- Case: `js/case-data.js`
- Mock: `js/mock-data.js`

旧37問SnapshotをRuntimeから直接読まず、Manifestを正本として読みます。同一画面での重複Fetchを避けるためLoader内でmemoizeします。

### 学習データBackup / Restore

`html/data.html`

- 学習履歴をJSON Export
- AP Study Notes Backup JSONをImport
- 認識済みlocalStorage Keyのみ復元
- 全学習データ削除は二重確認

Browser Data削除や別環境への移行に備えられます。

## 13学習ユニット

1. 基礎理論・数学
2. アルゴリズム・プログラミング
3. コンピュータシステム
4. UI・情報メディア
5. データベース
6. ネットワーク
7. セキュリティ
8. システム開発
9. プロジェクト管理
10. サービス管理・監査
11. システム戦略・企画
12. 経営・会計・ビジネス
13. 法務・標準化

公式分類正本: `json/curriculum/ap-2026-map.json`  
教材Coverage Overlay: `json/curriculum/ap-2026-coverage.json`

## 構造化Lesson

共通URL:

`html/lesson.html?id=<LESSON_ID>`

- Base: `json/lessons/lesson-index.json` — 87本
- Expansion: `json/lessons/lesson-index-expansion.json` — 31本
- 合計: **118本**

主なsection type:

- text
- comparison
- diagram
- code-trace
- worked-example
- steps
- mistakes

Lesson進捗: `ap-study-lesson-progress-v1`

## 短問総合演習

- Page: `html/practice.html`
- Runtime正本: `json/practice/practice-index.json`
- 91問
- 4択57問 + 記述34問
- 13/13 Unit、23/23中分類Coverage
- 履歴: `ap-study-practice-history-v1`

旧37問JSONは移行前Snapshotとして残しますが、通常Runtimeから直接読みません。

## 長文Case

- Page: `html/cases.html`
- Runtime正本: `json/cases/case-index.json`
- 16Case / 48記述設問
- 13/13 Unit、23/23中分類Coverage
- 履歴: `ap-study-case-history-v1`

## 150分オリジナル模試

Page: `html/mock.html`

### 科目A

- 80問 / 80問解答 / 150分
- 既存Practice choice 57 + 模試専用23 = 80問
- Navigator / Flag / 自動保存 / Reload復帰 / 時間切れ自動提出

### 科目B

- 11問提示 / 5問解答 / 150分
- Security 1問必須
- 10選択分野から4問選択
- 5Case × 3設問 = 15記述設問
- 試験中Model Answer非表示
- 提出後に自己採点

保存:

- `ap-study-mock-history-v1`
- `ap-study-mock-active-a-v1`
- `ap-study-mock-active-b-v1`

この模試は公開仕様の問題数・時間配分を使った独自教材で、IPA公式問題の再現ではありません。

## 2026年度CBTと公開問題

2026年度からAPはCBT方式です。

- 旧「午前」→ 科目A
- 旧「午後」→ 科目B
- 2026年度CBTの実問題は非公開

そのため本サイトでは最新公開済みフル問題として2025年度春期・秋期を扱います。

- Data: `json/past/ap-public-exams.json`
- Page: `html/official-past.html`
- Lesson逆引き: `js/lesson-official-past.js`
- 2025春・秋 午後22大問をLessonへMapping

問題全文はRepoへ転載せず、IPA公式PDFへリンクします。

## 学習進捗Dashboard

`html/progress.html`

表示:

- 現在のLesson理解確認数
- 短問の理解済み / 要復習 / 復習期限
- 長文Caseの理解済み / 要復習 / 復習期限
- 13Unit別進捗
- 23中分類別進捗
- 模試履歴
- Next Action

Next Actionは、復習期限・要復習を未着手より優先します。

## Home / Navigation

Homeは「機能一覧」ではなく、次の3層へ整理しています。

1. 今日やること
2. 13ユニット
3. 演習・本番・管理

Sidebarも「学習 / 演習 / 本番・管理」にグループ化しました。

Mobile Drawerでは閉じたNavigationを `inert` + `aria-hidden` にし、Escapeで閉じてMenu buttonへFocusを戻します。Skip Linkも実装しています。

## 保存方法

教材DataはGitHub上のJSON、個人履歴はBrowser localStorageです。

主要Key:

- 旧6分野の `*-terms-checked`
- `ap-study-bookmarks-v1`
- `ap-study-recent-v1`
- `ap-study-test-history-v1`
- `ap-study-lesson-progress-v1`
- `ap-study-practice-history-v1`
- `ap-study-case-history-v1`
- `ap-study-mock-history-v1`
- `ap-study-mock-active-a-v1`
- `ap-study-mock-active-b-v1`
- `ap-study-theme`

Backupは `html/data.html` から行います。

## 崩してはいけない仕様

- 既存用語IDを不用意に変更・削除しない。
- localStorage Key変更時は移行処理を用意する。
- 過去問PDF / 問題JSON / 解説JSONの対応を壊さない。
- GitHub Pagesで動く相対Pathを維持する。
- 秘密情報を公開Repoへ入れない。
- Practiceは`practice-index.json`、Caseは`case-index.json`をRuntime正本とする。
- Lesson Indexは`APLessonData`経由でBase + Expansionを結合する。
- 習得判定は`APStudyState`を正本とする。
- 13ユニットの通常入口は`unit.html?unit=...`に統一する。
- 旧用語ページは互換辞書として維持する。
- 2026 CBT非公開問題を再現・転載したものとして扱わない。
- 模試正答率をIPA公式得点へ直接換算しない。
- `23/23`を試験対策の完全性と表現しない。

## 自動検証

Workflow: `.github/workflows/validate.yml`

主Validator:

- `tests/validate.mjs`
- `tests/validate-audits.mjs`
- `tests/validate-security-audit.mjs`
- `tests/validate-computer-systems.mjs`
- `tests/validate-curriculum-expansion.mjs`
- `tests/validate-practice.mjs`
- `tests/validate-cases.mjs`
- `tests/validate-mock.mjs`
- `tests/validate-official-past.mjs`
- `tests/validate-past-lesson-map.mjs`
- `tests/validate-progress.mjs`
- `tests/validate-runtime-quality.mjs`

さらにPlaywright Chromiumによる `tests/e2e-smoke.mjs` を実行します。

Smoke対象:

- Home
- 13Unit Hub
- Lessonの誤答時にMasteredにならないこと
- 短問記述の空欄Guard
- Case記述の空欄Guard
- Mobile Drawer / inert / Escape
- Backup / Import page

これは全118Lesson・全91問・150分実時間の総当たりではありません。

## GitHub Pages

静的構成のためGitHub Pagesで利用できます。ローカルで直接`file://`を開くのではなく、GitHub PagesまたはHTTP Server経由を推奨します。

## 既知の不足

- 118Lesson中、91短問が直接参照するLessonはまだ全件ではない。
- 118Lessonの確認4択には難易度再監査が必要なものが残る。
- 旧用語辞書は大規模DOMを生成する互換層が残る。
- 模試問題の多くは通常演習Bankと共有しており、独立Formを増やす余地がある。
- 23中分類より細かい小分類・学習項目単位Coverageは未実装。
- 2025午前および2024以前の公式公開問題Mappingは未完了。
- Playwright Smokeは主要導線のみで、全画面総当たりではない。

## 完成条件

要求された主要機能が実装され、README / 仕様書 / 作業報告が同期し、CI・主要Browser Smoke・GitHub Pagesが成功し、通常利用を妨げる重大な既知不具合がない状態を完成扱いとします。

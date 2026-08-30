# AP Study Notes

応用情報技術者試験（AP）の個人学習用・静的Webアプリです。

**BUILD `2026.08.30-r17`**

- 正本: GitHub `EliteMay/ap-study-notes`
- GitHub Pages: `https://elitemay.github.io/ap-study-notes/`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 技術: HTML / CSS / JavaScript / JSON / PDF
- APIキー・Server必須機能なし

## 目的

AP学習を **範囲把握 → Lesson理解 → 直後確認 → 短問 → 長文Case → 150分模試 → 公開公式問題 → 弱点復習** まで一つのサイトでつなげます。

Homeは教材の説明ページではなく、**今やりたいことを1〜2クリックで始める入口**です。

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
| 統合単語辞書 | 1,422語 / 6分野 |
| 既存Security過去問Mapping | 7 / 7 |

`23/23` は「全中分類に教材・演習の入口がある」という意味で、各小項目や過去問Coverageまで完全という意味ではありません。

## r17: Homeを「行動選択ランチャー」へ変更

`index.html`

Home上部から以下へ直接入れます。

- Lessonで学ぶ
- 単語を調べる
- 短問を解く
- 長文Caseを解く
- 150分模試をする
- 公式公開問題へ進む
- 進捗・弱点を見る
- 学習データを管理する

上部には `home-quick-search` があり、機能名・13分野・任意の単語を入力できます。

- `模試` → 模試へ
- `セキュリティ` → Security Unitへ
- `OAuth` → 統合単語辞書でOAuth検索

というように、サイト構造を覚えていなくても目的地へ移動できます。

詳細な進捗表はHomeへ詰め込まず `html/progress.html` に分離し、Homeには「今日の優先項目」と最低限の学習状態だけを表示します。

## r17: 旧1,422語を1つの単語辞書へ統合

正規入口:

`html/glossary.html`

昔メインだった旧6分野の単語解説は削除せず、現在は**補助辞書**として1ページへ集約しました。

内訳:

- Algorithm 65語
- Database 229語
- Network 480語
- Security 501語
- System 75語
- Management 72語
- 合計 **1,422語**

機能:

- 全文検索
- 6分野Filter
- Category Filter
- ☆復習Filter
- チェック済み / 未チェックFilter
- URL検索 `glossary.html?q=OAuth`
- 分野指定 `glossary.html?domain=security`
- 用語Direct Link `glossary.html?term=<TERM_ID>`
- 60件ずつ表示
- 既存 `*-terms-checked` をそのまま利用
- 既存 `ap-study-bookmarks-v1` をそのまま利用

Security / Network / Databaseの既存詳細解説JSONは、用語の「詳しい解説」を開いた時だけ該当CategoryファイルをLazy Loadします。1,422件の詳細を初回に読んだり、1,422カードを一度にDOM生成したりしません。

旧 `security.html` / `network.html` / `database.html` / `algorithm.html` / `system.html` / `management.html` は**URL・ID・既存進捗互換用**として残しますが、通常のUnit HubやHomeからは統合辞書を使います。

## r16以降の習得判定

共通判定: `js/study-state.js`

- Lesson: 全確認問題回答 + **75%以上**で理解確認。
- 4択短問: 最新・最近の結果を重視。
- 記述短問: **12文字以上**回答しないと模範解答を開けない。
- 長文Case: **20文字以上**回答しないと模範解答を開けない。
- 理解確認後 **14日**を目安に復習期限。
- Best Scoreは履歴として保持し、現在理解状態とは分離。

## 13学習ユニット

通常入口はすべて:

`html/unit.html?unit=<UNIT_ID>`

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

各Unit HubからLesson、短問、長文Case、単語辞書へ移動できます。

公式分類正本: `json/curriculum/ap-2026-map.json`  
教材Coverage Overlay: `json/curriculum/ap-2026-coverage.json`

## 構造化Lesson

共通URL: `html/lesson.html?id=<LESSON_ID>`

- Base 87本: `json/lessons/lesson-index.json`
- Expansion 31本: `json/lessons/lesson-index-expansion.json`
- 合計 **118本**
- Loader: `js/lesson-data.js`
- 進捗: `ap-study-lesson-progress-v1`

主なsection type: text / comparison / diagram / code-trace / worked-example / steps / mistakes。

## 短問総合演習

- Page: `html/practice.html`
- Runtime正本: `json/practice/practice-index.json`
- **91問** = 4択57 + 記述34
- 13/13 Unit、23/23中分類Coverage
- 履歴: `ap-study-practice-history-v1`

旧37問JSONは移行前Snapshotとして残しますが通常Runtimeでは直接読みません。

## 長文Case

- Page: `html/cases.html`
- Runtime正本: `json/cases/case-index.json`
- **16Case / 48記述設問**
- 13/13 Unit、23/23中分類Coverage
- 履歴: `ap-study-case-history-v1`

## 150分オリジナル模試

Page: `html/mock.html`

### 科目A

- 80問 / 80問解答 / 150分
- Practice Choice 57 + 模試専用23 = 80
- Navigator / Flag / 自動保存 / Reload復帰 / 時間切れ自動提出

### 科目B

- 11問提示 / 5問解答 / 150分
- Security 1問必須
- 10選択分野から4問選択
- 5Case × 3設問 = 15記述設問
- 試験中Model Answer非表示
- 提出後自己採点

この模試は公開仕様の問題数・時間配分を使った独自教材で、IPA公式問題の再現ではありません。

## 2026年度CBTと公開問題

2026年度からAPはCBT方式です。2026年度CBTの実問題は非公開のため、最新公開済みフル問題として2025年度春期・秋期を扱います。

- Data: `json/past/ap-public-exams.json`
- Page: `html/official-past.html`
- Lesson逆引き: `js/lesson-official-past.js`
- 2025春・秋 午後22大問をLessonへMapping

問題全文はRepoへ転載せず、IPA公式PDFへリンクします。

## 学習進捗Dashboard

`html/progress.html`

- 現在のLesson理解確認数
- 短問 / Caseの理解済み・要復習・復習期限
- 13Unit別進捗
- 23中分類別進捗
- 模試履歴
- Next Action

Next Actionは復習期限・要復習を未着手より優先します。

## 学習データBackup / Restore

`html/data.html`

- localStorage学習履歴をJSON Export
- AP Study Notes BackupをImport
- 認識済みKeyのみ復元
- 全削除は二重確認

## Shared Navigation

`js/shell.js` / BUILD `2026.08.30-r17`

Navigationは以下へ整理しています。

- 学習: Home / 13Unit / Progress
- 調べる: **単語辞書 / 公式問題**
- 演習: 短問 / 長文Case / 模試
- 管理・互換: Security過去問 / 学習データ / 旧用語Test

Mobile Drawerは閉じた時 `inert` + `aria-hidden`。Escapeで閉じてMenu ButtonへFocusを戻します。Skip Linkも実装済みです。

## 保存方法

教材DataはGitHub上のJSON、個人履歴はBrowser localStorageです。

主なKey:

- `security-terms-checked`
- `network-terms-checked`
- `database-terms-checked`
- `algorithm-terms-checked`
- `system-terms-checked`
- `management-terms-checked`
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

## 崩してはいけない仕様

- 既存1,422用語IDを不用意に変更・削除しない。
- 旧6分野のチェックKey、Bookmark Keyを統合辞書でも共有する。
- localStorage Key変更時は移行処理を用意する。
- 旧用語ページは互換用として維持する。
- 通常の用語検索入口は `glossary.html` に統一する。
- GitHub Pagesで動く相対Pathを維持する。
- 秘密情報を公開Repoへ入れない。
- Practiceは`practice-index.json`、Caseは`case-index.json`をRuntime正本とする。
- Lessonは`APLessonData`、習得判定は`APStudyState`を正本とする。
- 2026 CBT非公開問題を再現・転載したものとして扱わない。
- 模試正答率をIPA公式得点へ直接換算しない。
- `23/23`を試験対策の完全性と表現しない。

## 自動検証

Workflow: `.github/workflows/validate.yml`

既存Validatorに加えて:

- `tests/validate-runtime-quality.mjs`
- `tests/validate-glossary.mjs`
- `tests/e2e-smoke.mjs`（Playwright Chromium）

Glossary Validatorは1,422語合計、旧Storage Key、60件分割、詳細Lazy Load、Unit→Glossary、新Home、r17 Navigationを検査します。

Browser SmokeはHome検索、OAuth辞書検索、詳細解説Open、Unit→辞書、Lesson閾値、記述Guard、Mobile Drawer、Backup画面まで実操作します。

## GitHub Pages

静的構成のためGitHub Pagesで利用できます。`file://`直開きではなくGitHub PagesまたはHTTP Server経由を推奨します。

## 既知の不足

- 118Lesson中、91短問が直接参照するLessonはまだ全件ではない。
- 118Lessonの確認4択には難易度再監査が必要なものが残る。
- 旧6互換ページ自体は大量DOMを生成するが、通常導線からは外れている。
- 模試問題の多くは通常演習Bankと共有しており、独立Formを増やす余地がある。
- 23中分類より細かい小分類・学習項目単位Coverageは未実装。
- 2025午前および2024以前の公式公開問題Mappingは未完了。
- Playwright Smokeは主要導線のみで、全118Lesson・全問題・150分実時間の総当たりではない。

## 完成条件

要求された主要機能が実装され、README / 仕様書 / 作業報告が同期し、CI・主要Browser Smoke・GitHub Pagesが成功し、通常利用を妨げる重大な既知不具合がない状態を完成扱いとします。

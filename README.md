# AP Study Notes

応用情報技術者試験（AP）の個人学習用・静的Webアプリです。

**BUILD `2026.08.30-r12` / IPA中分類23/23に教材 + 短問演習あり / 長文Case追加済み**

- 正本: GitHub `EliteMay/ap-study-notes`
- GitHub Pages: `https://elitemay.github.io/ap-study-notes/`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 構成: HTML / CSS / JavaScript / JSON / PDF

## 目的

単語暗記だけで終わらず、**範囲把握 → Lessonで理解 → 直後確認 → 短問演習 → 長文Case → 弱点復習 → 過去問**へつなげる。

操作性・分かりやすさ・軽量性・保守性を優先し、計算、図、状態遷移、擬似言語、SQL、Network/Security Case、会計等を内容に合う形式で学習する。

## 現在の状態

- IPA大分類: **9/9**
- IPA中分類: **23/23に構造化Lessonあり**
- 学習UI: **13ユニット**
- 構造化Lesson: **118本**
  - Base index: 87本
  - Expansion index: 31本
- オリジナル短問総合演習: **91問**
  - 13ユニット別基本問題65問
  - Cross-unit Expansion 26問
  - 13/13ユニット、23/23中分類をCoverage
- Subject B型オリジナル長文Case: **6Case / 18設問**
- 旧6教材: **1,422/1,422語を監査済み**
- 既存Security過去問: **7/7を構造化Lessonへ対応付け済み**

> 「23/23に教材あり」は全分野に学習の入口と主要骨格があるという意味です。各Lessonの深度、長文Case量、公式過去問量まで十分という意味ではありません。

## 主要画面

- `index.html` — 13ユニット中心のHome Dashboard
- `html/roadmap.html` — IPA 9大分類 / 23中分類 / 13ユニットの学習マップ
- `html/progress.html` — **Lesson + 短問 + 長文Caseの学習進捗Dashboard**
- `html/unit.html?unit=<unitId>` — 汎用Unit Hub
- `html/lesson.html?id=<LESSON_ID>` — 構造化Lesson
- `html/practice.html` — オリジナル短問総合演習91問
- `html/cases.html` — Subject B型オリジナル長文Case
- `html/security-past.html` — 既存Security過去問
- `html/test.html` — 旧用語4択テスト

Algorithm / Computer Systems / Database / Network / Security / System Development / Project Managementには既存専用Hubも維持する。

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

共有Sidebarは `js/shell.js` が毎回正式Navigationへ再構築する。古いHTML内のNavigation差分を正本にしない。

## Curriculum / Lesson Data

### 公式分類正本

`json/curriculum/ap-2026-map.json`

### 教材Coverage Overlay

`json/curriculum/ap-2026-coverage.json`

公式シラバス定義と現在の教材整備状態を分離する。

### Lesson Index

- `json/lessons/lesson-index.json` — Base 87
- `json/lessons/lesson-index-expansion.json` — Expansion 31
- Runtime/CI合計: **118Lesson**

Lesson section type:

- `text`
- `comparison`
- `diagram`
- `code-trace`
- `worked-example`
- `steps`
- `mistakes`

## Lesson進捗

localStorage:

`ap-study-lesson-progress-v1`

保存内容:

- 最新回答数 / 正答数
- Best score
- 完了状態
- 完了回数
- 最終学習日時

確認問題を1回分すべて回答するとLesson完了として記録する。

## 短問総合演習

Runtime:

- `html/practice.html`
- `js/practice-data.js`
- `js/practice.js`
- `css/practice.css`

Data:

- `json/practice/practice-index.json` — Runtime正本Manifest
- `json/practice/units/*.json` — 13ユニット × 5問 = 65問
- `json/practice/ap-original-practice-expansion-v1.json` — 追加26問
- `json/practice/ap-original-practice-v1.json` — **旧37問Snapshot。Runtimeでは読まない**

現在 **91問**。

問題形式:

- 選択式 — 自動採点 + 解説
- 記述式 — 自分で回答 → Model Answer / 採点観点 → 自己評価

Filter:

- 学習ユニット
- 問題形式
- 難易度
- 未挑戦 / 要復習 / 理解済み

Practice進捗:

`ap-study-practice-history-v1`

Lessonから、そのLessonを参照する短問へ直接移動できる。

## Subject B型 長文Case

Files:

- `json/cases/ap-subject-b-cases-v1.json`
- `html/cases.html`
- `js/cases.js`
- `css/cases.css`

現在 **6Case / 18設問**。

対象:

- Security: Credential Stuffing / Incident Response
- Network: VPN / Route障害切り分け
- Database: 在庫競合 / Lock / Transaction
- System Development: Requirement変更 / Traceability / Regression
- Project + Service: EVM / Release判断 / SLA
- Business Strategy: NPV / Strategic Risk / VRIO

各Caseは状況文 + 3記述設問。自分で回答後にModel Answer/採点観点を開き、0/1/2で自己評価する。

Case進捗:

`ap-study-case-history-v1`

保存:

- 設問別attempts
- latest/best score
- latest answer
- Case completion
- updatedAt

## 学習進捗Dashboard

`html/progress.html`

入力:

- 118Lesson
- 短問91問
- 長文Case6本
- Lesson / Practice / Case localStorage
- 13 Unit / 23 Middle Category

表示:

- 全体Lesson完了率
- 短問の挑戦数 / 理解済み / 要復習
- 長文Case理解済み数
- 13ユニット別Lesson / 短問 / Case進捗
- IPA23中分類別の教材・短問・Case Coverage
- Case途中 → 短問要復習 → 未完了Lessonの順でNext Action候補

旧用語の「チェック済み」と構造化教材の理解進捗は混同しない。

## 旧1,422語の互換層

| 旧教材 | 語数 | 状態 |
|---|---:|---|
| Algorithm | 65 | 監査・再配置済み |
| Database | 229 | 監査・Lesson移行済み |
| Network | 480 | 監査・Lesson移行済み |
| Security | 501 | 監査・Cross-domain再分類済み |
| System | 75 | 監査・Lesson移行済み |
| Management | 72 | 監査・Lesson移行済み |
| **合計** | **1,422** | **1,422/1,422** |

旧ページ・旧ID・旧localStorageは検索、☆復習、既存進捗の互換用として維持する。

## 過去問

既存Security過去問7問を `json/past/lesson-past-map.json` で **7/7構造化Lessonへ対応付け済み**。

今後はSecurity以外の公式過去問と118Lessonの対応を増やす。

## 保存方法

教材DataはGitHub上のJSON。個人進捗はBrowser localStorage。

主なKey:

- `<domain>-terms-checked`
- `ap-study-bookmarks-v1`
- `ap-study-recent-v1`
- `ap-study-test-history-v1`
- `ap-study-lesson-progress-v1`
- `ap-study-practice-history-v1`
- `ap-study-case-history-v1`
- `ap-study-theme`

## 崩してはいけない仕様

- 既存用語IDを不用意に削除・変更しない。
- localStorage key変更時は移行処理を用意する。
- 過去問PDF / 問題JSON / 解説JSON対応を壊さない。
- GitHub Pagesで壊れない相対Pathを維持する。
- 秘密情報を公開Repoへ置かない。
- 監査済みIDの主Lesson割当を根拠なく変えない。
- Base/Expansion Lesson indexをRuntime/CI双方で結合する。
- Practiceは `practice-index.json` をRuntime正本とし、旧37問Snapshotへ戻さない。
- 「23/23にLessonあり」と「試験対策として完成」を混同しない。

## 自動検証

`.github/workflows/validate.yml`

- JavaScript syntax
- `tests/validate.mjs`
- `tests/validate-audits.mjs`
- `tests/validate-security-audit.mjs`
- `tests/validate-computer-systems.mjs`
- `tests/validate-curriculum-expansion.mjs`
- `tests/validate-practice.mjs`
- `tests/validate-cases.mjs`
- `tests/validate-past-lesson-map.mjs`
- `tests/validate-progress.mjs`

主な保証:

- 旧1,422語Audit
- 118Lesson整合
- 13/13 Unit・23/23 Lesson Coverage
- 短問91問・13 Unit各7問以上・23/23 Practice Coverage
- 長文6Case / 18設問 / 関連Lesson整合
- Security過去問7/7 Mapping
- Progress DashboardのLesson + Practice + Case配線

## GitHub Pages

`https://elitemay.github.io/ap-study-notes/`

静的構成のためGitHub Pagesでそのまま利用可能。

## 注意点・既知の問題

現在の主な不足は**深度と公式本番接続**。

- Subject B型長文Caseは6本で、分野全体としてはまだ少ない
- Security以外の公式過去問Mapping不足
- 91短問でも118Lesson全てに十分な演習密度ではない
- 旧用語ページの生成詳細は互換層に残る
- 118Lesson + 91短問 + 6Case + 全Hubの実Browser総当たりE2Eは未実施

CI successを実Browser確認済みとは扱わない。

## 完成条件

- 23中分類すべてを追跡可能
- Template文章の水増しを主教材に使わない
- 計算 / 図 / Code / SQL / Network / Security / Business Caseを扱える
- Lesson→短問→長文Case→過去問へ接続できる
- 結果から弱点を再学習できる
- 公式過去問/Subject Bへ体系的に接続する
- CI/Pagesが成功
- 重大な既知不具合がなく通常利用可能
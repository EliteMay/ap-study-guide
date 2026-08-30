# AP Study Notes

応用情報技術者試験（AP）の個人学習用・静的Webアプリです。

**BUILD `2026.08.30-r13`**

- 正本: GitHub `EliteMay/ap-study-notes`
- GitHub Pages: `https://elitemay.github.io/ap-study-notes/`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 技術: HTML / CSS / JavaScript / JSON / PDF
- Server必須機能・秘密情報なし

## 目的

単語暗記だけで終わらず、次のFlowでAPの知識を使える状態へ持っていく。

1. 学習マップで範囲を把握
2. 構造化Lessonで仕組みを理解
3. Lesson内確認問題で直後確認
4. 短問総合演習で知識を取り出す
5. 長文Caseで複数情報を組み合わせる
6. 学習進捗Dashboardで弱点を確認
7. 公式過去問へ接続
8. 必要に応じて旧用語索引で細部を検索

優先順位は **操作性 → 分かりやすさ → 軽量性 → 保守性 → 見た目**。

## 現在の状態

| 項目 | 状態 |
|---|---:|
| IPA大分類 | **9 / 9** |
| IPA中分類 Lesson Coverage | **23 / 23** |
| 学習ユニット | **13 / 13** |
| 構造化Lesson | **118本** |
| 短問総合演習 | **91問** |
| 短問の中分類Coverage | **23 / 23** |
| 長文Case | **14本** |
| 長文Case設問 | **42問** |
| 長文Caseの学習Unit Coverage | **13 / 13** |
| 長文Caseの中分類Coverage | **23 / 23** |
| 旧教材監査 | **1,422 / 1,422語** |
| 既存Security過去問Lesson対応 | **7 / 7** |

ここでいう23/23は「全中分類に学習・演習の入口がある」という意味で、最近の公式過去問量や各Lessonの深度まで完全という意味ではない。

## カリキュラム

公式分類の正本:

`json/curriculum/ap-2026-map.json`

教材Coverage Overlay:

`json/curriculum/ap-2026-coverage.json`

Navigation上は13学習ユニットにまとめる。

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

## 構造化Lesson

共通URL:

`html/lesson.html?id=<LESSON_ID>`

Index:

- `json/lessons/lesson-index.json` — Base 87本
- `json/lessons/lesson-index-expansion.json` — Expansion 31本
- 合計 **118本**

主なsection type:

- `text`
- `comparison`
- `diagram`
- `code-trace`
- `worked-example`
- `steps`
- `mistakes`

内容に応じて、計算・結果表・状態遷移・構成図・SQL・擬似言語・Case判断を使う。

### 主なLesson群

- Foundation: FND-01〜07
- Algorithm / Programming: ALG-01〜11, PROG-01〜04
- Computer Systems: CMP-01〜12
- UI / Media: UIM-01〜03, MED-01〜03
- Database: DB-01〜14
- Network: NET-01〜14
- Security: SEC-01〜12
- System Development: SYS-01〜08, DEV-01
- Project Management: PM-01〜06
- Service / Audit: SVC-01〜03, AUD-01〜02
- Strategy / Planning: STR-01〜05
- Business / Accounting: BUS-01〜09
- Law / Standards: LAW-01〜04

## 短問総合演習

画面:

`html/practice.html`

Manifest:

`json/practice/practice-index.json`

構成:

- 13学習ユニット × 基本5問 = 65問
- Expansion = 26問
- 合計 **91問**

機能:

- 選択式自動採点
- 記述式: 自分で回答 → Model Answer / 採点観点 → 自己評価
- Unit / 問題形式 / 難易度 / 学習状況Filter
- ランダム出題
- Lessonから関連問題へ直接移動
- `question=` Queryで直接問題を開く

履歴:

`ap-study-practice-history-v1`

旧37問JSONは移行前Snapshotとして残すがRuntime正本にはしない。

## 長文Case

画面:

`html/cases.html`

Manifest:

`json/cases/case-index.json`

構成:

- Base: 6Case / 18設問
- Expansion: 8Case / 24設問
- 合計 **14Case / 42設問**

現在は**13学習ユニットすべて、IPA中分類1〜23すべてに長文Case Coverageあり**。

主なCase:

- Credential Stuffing / Incident Response
- VPN / Routing障害切り分け
- DB在庫競合 / Lock
- 要件変更 / Traceability / Regression Test
- EVM / Release / SLA
- NPV / 経営判断
- IoT計測 / 待ち行列 / Sampling
- Hash / Binary Search / BFS
- CPU / DMA / Process / A-D変換
- Accessibility / UX / Media配信
- Incident / Problem / Change / Audit Evidence
- BPR / RFP / Pilot KPI
- SaaS契約 / OSS / 個人情報
- Technology Roadmap / Open Innovation / SCM

機能:

- Unit / 学習状況Filter
- 条件内Random Case
- 1Case 3設問
- 自分で回答 → Model Answer / 採点観点 → 自己評価
- 関連Lessonへの戻りLink

履歴:

`ap-study-case-history-v1`

## 学習進捗Dashboard

`html/progress.html`

118Lesson、91短問、14長文Caseを統合して表示する。

確認可能項目:

- 全体Lesson完了率
- 短問の挑戦数 / 理解済み / 要復習
- 長文Case理解済み数
- 13ユニット別 Lesson / 短問 / Case進捗
- IPA23中分類別 Coverage / 完了状態
- 次にやる候補

次Actionは概ね、

1. 途中・要復習の長文Case
2. 要復習短問
3. 未完了Lesson

の順で提示する。

## 旧1,422語の監査

| 旧教材 | 語数 | 状態 |
|---|---:|---|
| Algorithm | 65 | 65/65監査・再配置済み |
| Database | 229 | 229/229監査・Lesson移行済み |
| Network | 480 | 480/480監査・Lesson移行済み |
| Security | 501 | 501/501監査・公式分野へ再分類済み |
| System | 75 | 75/75監査・Lesson移行済み |
| Management | 72 | 72/72監査・Lesson移行済み |
| **合計** | **1,422** | **1,422/1,422** |

旧用語ページは削除せず、検索・☆復習・既存localStorageとの互換索引として残す。

## 過去問

既存Security過去問7問を維持し、

`json/past/lesson-past-map.json`

で構造化Lessonへ対応付ける。

現在の大きな課題は、**Security以外も含む最近の公式AP問題と118Lessonの体系的な対応付け**。

## 保存方法

教材DataはGitHub上のJSON。個人学習履歴はBrowser localStorage。

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
- `ap-study-theme`

## 崩してはいけない仕様

- 既存用語IDを不用意に変更・削除しない。
- localStorage Key変更時は移行処理を用意する。
- 過去問PDF / 問題JSON / 解説JSONの対応を壊さない。
- GitHub Pagesで動く相対Pathを維持する。
- API Key・Password・秘密情報を公開Repoへ入れない。
- 監査済みIDとLesson割当を根拠なく変更しない。
- LessonはBase/Expansion indexをRuntimeとCIの双方で結合する。
- Practiceは`practice-index.json`をRuntime正本とする。
- Caseは`case-index.json`をRuntime正本とする。
- 「23/23に教材あり」を「試験対策として完全」と表現しない。

## 自動検証

`.github/workflows/validate.yml`

主なValidator:

- `tests/validate.mjs`
- `tests/validate-audits.mjs`
- `tests/validate-security-audit.mjs`
- `tests/validate-computer-systems.mjs`
- `tests/validate-curriculum-expansion.mjs`
- `tests/validate-practice.mjs`
- `tests/validate-cases.mjs`
- `tests/validate-past-lesson-map.mjs`
- `tests/validate-progress.mjs`

CIで主に保証するもの:

- JS構文
- 全JSONと主要参照
- 旧1,422語監査整合
- 118Lesson
- 13/13学習Unit
- Lessonの23/23中分類Coverage
- 91短問・13/13 Unit・23/23中分類Coverage
- 14Case / 42設問・13/13 Unit・23/23中分類Coverage
- 既存Security過去問7/7 Lesson Mapping
- 学習進捗DashboardのData接続

## GitHub Pages

`https://elitemay.github.io/ap-study-notes/`

静的構成のため、URLを開くだけで利用できる。

## 既知の未完了

- Security以外の最近の公式AP問題を体系的にLessonへMappingできていない。
- 118Lessonすべてに同量の演習があるわけではない。
- 公式問題に近い長文Caseはさらに増やせる。
- 旧用語ページの生成詳細は互換層として残っている。
- PC / Mobile / Dark Mode / 全Lesson / 91短問 / 42Case設問の実Browser総当たりE2Eは未実施。

## 完成条件

- 23中分類すべてを追跡できる。
- 主教材でテンプレ長文水増しを使わない。
- 内容に適した計算・図・Code・SQL・Network・Security・Business Caseがある。
- 弱点からLesson/短問/長文Caseへ戻れる。
- 最近の公式過去問へ体系的に接続できる。
- CI / Pagesが通る。
- 重大な既知不具合なく通常利用できる。
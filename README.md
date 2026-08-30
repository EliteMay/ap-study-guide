# AP Study Notes

応用情報技術者試験（AP）の個人学習用Webアプリです。

**BUILD `2026.08.30-r10` / 教材骨格23中分類対応済み**

- 正本: GitHub `EliteMay/ap-study-notes`
- GitHub Pages: `https://elitemay.github.io/ap-study-notes/`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 構成: 静的HTML / CSS / JavaScript / JSON / PDF

## 目的

単語を増やすのではなく、APで必要な知識を **理解 → 直後確認 → 総合演習 → 過去問** へつなげます。

教材内容に応じて次を使います。

- 図 / 構成図 / 状態遷移
- 擬似言語 / Code trace
- SQL / E-R図 / 正規化
- CPU / Cache / Subnet / PERT / EVM / 会計等の計算
- 通信Flow / 障害切り分け
- Securityの攻撃 → 成立条件 → 観測 → 影響 → 対策
- UI / Accessibility / Multimedia
- 経営戦略 / Marketing / Accounting / Law
- 選択式 + 記述式のオリジナル総合演習

## 現在の状態

### シラバスCoverage

- IPA大分類: **9 / 9**
- IPA中分類: **23 / 23 に構造化Lessonあり**
- 学習UI: **13学習ユニット**
- 構造化Lesson: **118本**
  - Base index: 87本
  - Expansion index: 31本
- オリジナル総合演習: **37問**
  - 13 / 13学習ユニットをCoverage
  - 23 / 23中分類をCoverage

ここでの「23/23」は、全中分類に学習の入口と主要教材が存在するという意味です。過去問量、長文Case量、各Lessonの深度まで十分という意味ではありません。

### 旧教材監査

旧6教材の **1,422 / 1,422語を全件監査済み**です。

| 旧教材 | 語数 | 状態 |
|---|---:|---|
| Algorithm | 65 | 65/65 監査・再配置済み |
| Database | 229 | 229/229 監査・Lesson移行済み |
| Network | 480 | 480/480 監査・Lesson移行済み |
| Security | 501 | 501/501 監査・公式分野へ再分類済み |
| System | 75 | 75/75 監査・Lesson移行済み |
| Management | 72 | 72/72 監査・Lesson移行済み |

旧用語ページは削除せず、検索・☆復習・既存localStorage進捗の互換索引として維持します。

## カリキュラム設計

### 正式分類

`json/curriculum/ap-2026-map.json`

- IPA 9大分類 / 23中分類
- 13学習ユニットへの対応

### 現在の教材Coverage

`json/curriculum/ap-2026-coverage.json`

シラバス定義と制作進捗を分離しています。Coverageを更新するために公式分類の正本を書き換えません。

### 学習マップ

`html/roadmap.html`

13ユニット・23中分類・現在の教材状態を確認できます。

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

共有Sidebarは `js/shell.js` がこの正式13ユニットを毎回再構築します。古いHTML内のNavigation差分を正本にしません。

## 構造化Lesson

共通URL:

`html/lesson.html?id=<LESSON_ID>`

主ファイル:

- `html/lesson.html`
- `js/lesson.js`
- `css/lesson.css`
- `json/lessons/lesson-index.json` — Base 87本
- `json/lessons/lesson-index-expansion.json` — Expansion 31本
- `json/lessons/<unit>/*.json`

対応section:

- `text`
- `comparison`
- `diagram`
- `code-trace`
- `worked-example`
- `steps`
- `mistakes`

Lessonには原則として、学習目標・本文section・確認問題を持たせます。

### Lesson進捗

localStorage:

`ap-study-lesson-progress-v1`

保存内容:

- 最新の回答数 / 正答数
- Best score
- Lesson完了状態
- 完了回数
- 最終学習日時

確認問題を最後まで回答すると完了として記録し、トップと共通Unit Hubへ反映します。

## 共通Unit Hub

- `html/unit.html`
- `js/unit.js`
- `css/unit.css`

`html/unit.html?unit=foundation-theory` のように利用します。

同一HTMLから、基礎理論・UI/Media・Service/Audit・Strategy・Business・Law等を表示できます。

Hubでは:

- IPA中分類ごとのLesson
- 完了Lesson数
- 各LessonのBest score
- 未完了Lessonの続き
- **そのユニットだけの総合演習への導線**

を表示します。

## 主なLesson群

### 基礎理論

- FND-01〜07
- Bit演算 / 数値表現 / 集合論理 / 確率統計 / 情報量 / 待ち行列 / 計測制御

### Algorithm / Programming

- ALG-01〜11
- PROG-01〜04

### Computer Systems

- CMP-01〜12
- CPU / Memory / Cache / Virtual Memory / I/O / OS
- System構成 / 性能 / MTBF・MTTR / RAID
- Middleware / OSS / Hardware / Cloud / Container

### UI / Media

- UIM-01〜03
- MED-01〜03
- UI/UX / Accessibility / 情報設計
- Raster/Vector / 色 / Audio Sampling / Video / Codec

### Database

- DB-01〜14
- E-R / 正規化 / SQL / JOIN / 集計 / Subquery
- Transaction / Recovery / Index / NoSQL / DWH / OLAP

### Network

- NET-01〜14
- OSI/TCP-IP / IPv4・IPv6 / Subnet
- VLAN/STP / Wi-Fi / Routing / NAT / VPN
- TCP/UDP / DNS / HTTP / Mail / 障害切り分け / QoS / Cloud Network

### Security

- SEC-01〜12
- CIA / Risk / Cryptography / PKI / TLS
- Authentication / Authorization / MFA / OIDC
- Web攻撃 / Mail攻撃 / Malware
- FW / IDS/IPS / WAF / EDR / SIEM
- Incident Response / ISMS / Cloud Security / Zero Trust

### System / Project

- SYS-01〜08
- DEV-01
- PM-01〜06
- Requirement / Design / UML / CI/CD / Test / Maintenance / Agile
- WBS / PERT / EVM / Quality / Risk / Procurement

### Service / Audit

- SVC-01〜03
- AUD-01〜02
- SLA / ITSM / Incident・Problem / Change・Release / Continuity
- Facility Management / System Audit / Internal Control / Audit Evidence / CAAT

### Strategy / Planning

- STR-01〜05
- Feasibility / RFP / IT Strategy / BPR・BPM・EA / Outsourcing / Adoption / Effect Measurement

### Business / Accounting

- BUS-01〜09
- PEST / 5 Forces / SWOT / Ansoff / PPM
- STP / 4P / KPI / BSC / Technology Roadmap
- ERP / CRM / SCM / IoT / Digital Twin
- Organization / Financial Statements / Break-even / ROI / NPV

### Law / Standards

- LAW-01〜04
- Security関連法規 / Privacy
- Intellectual Property / OSS License / Contract
- Labor / Transaction / Compliance / Ethics
- ISO / IEC / JIS / IEEE / Open Standard

## オリジナル総合演習

- `html/practice.html`
- `js/practice.js`
- `css/practice.css`
- `json/practice/ap-original-practice-v1.json`

現在 **37問**。

公式過去問の問題文を転載せず、シラバスVer.7.2と本サイトLessonを基に作成しています。

### 問題形式

- 選択式: 自動採点
- 記述式: 自分で回答 → Model Answer / 採点観点 → 自己評価

### Filter

- 学習ユニット
- 問題形式
- 難易度
- 未挑戦 / 要復習 / 理解済み

URL queryでも絞り込めます。

例:

`html/practice.html?unit=network`

Lessonから関連する問題へ `question=` 付きで直接移動できます。

### Practice進捗

localStorage:

`ap-study-practice-history-v1`

保存内容:

- 挑戦回数
- Latest score
- Best score
- Latest answer
- 最終挑戦日時

トップページにも「理解済み / 要復習」を表示します。

## 学習Flow

1. 学習マップで範囲を確認
2. Lessonで仕組みを理解
3. Lesson内確認問題を最後まで解く
4. 関連する総合演習で知識を使う
5. 要復習だけ再挑戦
6. 公式過去問・長文Caseへ接続
7. 必要なら旧用語索引で細部を検索

## 過去問

既存Security過去問7問を維持しています。

総合演習37問は公式過去問とは別物です。

今後の主課題は、**最近のAP過去問と118Lessonの体系的な対応付け**、およびSubject Bを意識した長文Case増強です。

## 保存方法

教材データはGitHub上のJSON。個人進捗はブラウザlocalStorageです。

主なキー:

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
- `ap-study-theme`

更新でこれらを意図せず消さないこと。

## 崩してはいけない仕様

- 既存用語IDを不用意に変更・削除しない。
- localStorageキー変更時は移行処理を用意する。
- 過去問PDF / 問題JSON / 解説JSONの対応を壊さない。
- GitHub Pagesの相対パスを維持する。
- 秘密情報/APIキーを公開リポジトリへ置かない。
- 監査済み移行表とLesson割当を根拠なく変更しない。
- Base/Expansion Lesson indexをRuntime・CIの双方で統合する。
- 「23/23にLessonあり」と「試験対策として完全」を混同しない。

## 自動検証

`.github/workflows/validate.yml` でmain / PRごとに実行します。

- JavaScript構文
- `tests/validate.mjs`
- `tests/validate-audits.mjs`
- `tests/validate-security-audit.mjs`
- `tests/validate-computer-systems.mjs`
- `tests/validate-curriculum-expansion.mjs`
- `tests/validate-practice.mjs`

主要保証:

- 旧1,422語の監査整合
- Base 87 + Expansion 31 = 118Lesson
- Lesson ID / order重複禁止
- 13学習ユニット整合
- IPA中分類1〜23のLesson Coverage
- Practice 37問
- Practice 13/13 unit Coverage
- Practice 23/23 middle Coverage
- Practiceの関連Lesson実在

## GitHub Pages

`https://elitemay.github.io/ap-study-notes/`

静的構成のためGitHub Pagesでそのまま利用できます。

## 注意点・既知の問題

現在の大きな未完了は、教材の「分野が存在しない」ことではなく**深さと本番接続**です。

- 最近のAP過去問と118Lessonの体系的対応表は未完成
- Subject Bを意識した長文Caseが不足
- 37問では1Lessonごとの十分な演習量には達していない
- 旧用語ページの生成詳細は互換層に残っている
- 118Lesson + Practice全操作の実ブラウザE2E総当たりは未実施

## 完成条件

- 23中分類すべてを追跡できる。
- テンプレ文章による水増しを主教材に使わない。
- 内容に合う教材形式がある。
- 計算 / 図 / Code / SQL / Network / Security / Business Case演習がある。
- 最近の過去問へ体系的に接続できる。
- 問題結果から弱点を再学習できる。
- CIとPages buildが通る。
- 重大な既知不具合がなく通常利用できる。

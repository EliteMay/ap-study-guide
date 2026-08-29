# AP Study Notes

応用情報技術者試験（AP）の個人学習用Webアプリです。

**教材再設計中 / BUILD `2026.08.30-r6`**

正本: GitHub `EliteMay/ap-study-notes`  
GitHub Pages: `https://elitemay.github.io/ap-study-notes/`

## 目的

単語数を増やすことではなく、APで必要な知識を **理解 → 適用 → 演習** までつなげることを目的にします。

教材形式は内容に合わせます。

- 用語・比較
- 図・構成図
- 擬似言語 / コードトレース
- SQL / E-R図 / 正規化
- サブネット計算 / 通信フロー
- 障害切り分け
- ケース判断
- 過去問

## 現在の状態

Webアプリ基盤は利用できますが、**AP教材全体としてはまだ完成扱いにしません**。

旧6教材は合計1,422語あります。検索・復習・既存進捗の互換索引として維持し、主教材を構造化Lessonへ移行しています。

| 旧教材 | 語数 | 状態 |
|---|---:|---|
| アルゴリズム | 65 | **65/65 全件監査・Lesson割当済み** |
| データベース | 229 | **229/229 全件監査・Lesson割当済み** |
| ネットワーク | 480 | **480/480 全件監査・Lesson割当済み** |
| システム開発 | 75 | **75/75 全件監査・Lesson割当済み** |
| プロジェクト管理 | 72 | **72/72 全件監査・Lesson割当済み** |
| セキュリティ | 501 | 要監査 |

**921語を全件監査し、921/921を実装済みLessonへ一意割当済みです。**

現在の構造化Lessonは **63本** です。

## カリキュラム基準

2026年度現行制度は IPA「応用情報技術者試験 シラバス Ver.7.2」を分類基準にします。

- 内部: 9大分類 / 23中分類
- 学習UI: 13学習ユニット
- 定義: `json/curriculum/ap-2026-map.json`
- 表示: `html/roadmap.html`

2027年度以降の新制度は別マップとして管理し、2026年度定義を上書きしません。

---

# 構造化Lesson

共通URL:

`html/lesson.html?id=<LESSON_ID>`

主な構成:

- `html/lesson.html`
- `js/lesson.js`
- `css/lesson.css`
- `json/lessons/lesson-index.json`
- `json/lessons/<unit>/*.json`

表示形式:

- `text`
- `comparison`
- `diagram`
- `code-trace`
- `steps`
- `mistakes`

## アルゴリズム・プログラミング

- ALG-01〜ALG-11
- PROG-01〜PROG-04
- FND-01 論理演算・ビットシフト

旧65語は **65/65** 一意割当済み。

監査: `json/curriculum/audits/algorithm-audit.json`

## データベース

DB-01〜DB-14へ再構成し、旧229語を **229/229** 一意割当済み。

主な教材:

- DBMS / 3層スキーマ / 関係モデル
- E-R図 / キー / 参照整合性
- 正規化 / 関数従属性
- SELECT / JOIN / GROUP BY / 副問合せ
- トランザクション / 分離レベル
- WAL / UNDO / REDO / バックアップ
- 索引 / 実行計画
- 分散DB / CAP / NoSQL
- DWH / ETL / OLAP

監査: `json/curriculum/audits/database-audit.json`

## ネットワーク

旧12カテゴリ×40語を正式学習構造とはみなさず、14Lessonへ再構成しました。

| Lesson | 内容 |
|---|---|
| NET-01 | OSI/TCP-IPと通信の全体像 |
| NET-02 | IPv4・CIDR・サブネット計算 |
| NET-03 | IPv6・SLAAC・NDP |
| NET-04 | Ethernet・VLAN・STP |
| NET-05 | 無線LAN・Wi-Fi |
| NET-06 | ルーティング・NAT・WAN・VPN |
| NET-07 | TCP・UDP・ポートと信頼性制御 |
| NET-08 | DNSと名前解決 |
| NET-09 | HTTP・HTTPS・Web通信 |
| NET-10 | メール・ファイル転送・リモート接続 |
| NET-11 | ネットワーク機器と構成図 |
| NET-12 | DHCP・ARP・監視・障害切り分け |
| NET-13 | 可用性・性能・QoS |
| NET-14 | クラウド・仮想ネットワーク |

監査: `json/curriculum/audits/network-audit.json`

再分類:

- 478語 → NET-01〜NET-14
- `net-availability-performance-015` SLA → SVC-01 / 中分類15
- `net-ops-troubleshoot-039` インシデント管理 → SVC-01 / 中分類15

Securityと重複するTLS、DNSSEC、FW、IDS/IPS/WAF、SPF/DKIM/DMARC、ZTNA等は、Security 501語監査前に削除・二重移動せず、現在はNetworkの通信文脈で保持します。

### `legacyTermRanges`

Networkは478個のIDをLesson JSONへベタ書きせず、連続IDを範囲で保持します。

```json
{
  "legacyTermRanges": [
    {"prefix":"net-dns-","from":1,"to":40}
  ]
}
```

`tests/validate-audits.mjs` が実IDへ展開し、480語すべての未割当・重複・誤Lesson・誤中分類を検証します。

## システム開発・PM・サービス管理

実装済み:

- SYS-01〜SYS-08
- DEV-01 Agile / Scrum
- PM-01〜PM-06
- SVC-01 サービスマネジメント / SLA
- AUD-01 システム監査 / 内部統制
- STR-01 システム化計画 / RFP
- CMP-01 コンテナ / 仮想化

System 75語 + Management 72語 = **147/147** 一意割当済み。

---

# 崩してはいけない仕様

- 既存用語IDを不用意に変更・削除しない。
- localStorageキーを変更する場合は移行処理を用意する。
- 過去問PDF / 問題JSON / 解説JSONの対応を壊さない。
- GitHub Pagesで動く相対パスを維持する。
- 秘密情報やAPIキーを公開リポジトリへ置かない。
- 監査前の大量削除をしない。
- 「語数が多い = 教材完成」と扱わない。

# データ構成

```text
index.html
html/
css/
js/
json/
  curriculum/
    ap-2026-map.json
    audits/
  lessons/
  terms/
  details/
docs/
tests/
```

教材本文・用語・監査結果はJSONへ分離し、大量データをHTMLへ直書きしません。

# 保存方法

教材データはGitHub上のJSON。個人進捗はブラウザのlocalStorageへ保存します。

| 用途 | localStorageキー |
|---|---|
| Security習得 | `security-terms-checked` |
| Network習得 | `network-terms-checked` |
| Database習得 | `database-terms-checked` |
| Algorithm習得 | `algorithm-terms-checked` |
| System習得 | `system-terms-checked` |
| Management習得 | `management-terms-checked` |
| 復習リスト | `ap-study-bookmarks-v1` |
| 最近見た用語 | `ap-study-recent-v1` |
| 用語テスト履歴 | `ap-study-test-history-v1` |
| テーマ | `ap-study-theme` |

Lesson理解度の永続保存は未実装です。

# GitHub Pages

公開URL:

`https://elitemay.github.io/ap-study-notes/`

main更新後にGitHub Pagesがデプロイされます。静的HTML/CSS/JS/JSON構成です。

# 自動検証

`.github/workflows/validate.yml` でmain / PRごとに検証します。

主な検査:

- JavaScript構文 / 全JSON構文
- manifest件数 / ID / category
- 9大分類 / 23中分類 / 13ユニット
- Lesson ID / order / unit / IPA中分類
- section / diagram / checks / next参照
- Algorithm 65/65完全割当
- System 75/75完全割当
- Management 72/72完全割当
- Database 229/229完全割当
- **Network 480/480完全割当**
- `legacyTermRanges` の範囲展開
- 監査JSONと実装Lessonの割当一致
- セキュリティ過去問targets
- 主要HTML参照

監査専用: `tests/validate-audits.mjs`

# 注意点・既知の問題

- **Security 501語が最後の巨大旧教材として大規模監査前です。**
- NetworkとSecurityの重複語はSecurity監査後に主所属・横断参照を最終整理します。
- UI/情報メディア、経営・会計、法務など独立教材が未整備のユニットがあります。
- 現行 `html/test.html` は用語・定義中心の4択で、本番力測定としては未完成です。
- Lessonの正答履歴を永続化する理解度システムは未実装です。
- 最近のAP過去問とLesson単位の対応付けは不足しています。
- 公開Pagesを通常ブラウザで63Lessonすべて操作するE2E総当たり確認は未実施です。

# 次の大バッチ

最後の巨大旧教材 **Security 501語** を全件監査します。

Network側との重複も同時に整理し、暗号・認証・PKI・攻撃・マルウェア・Web・ネットワーク防御・リスク管理・法規接点を、攻撃→成立条件→影響→検知→対策までつながるLessonへ再構成します。

# 完成条件

- 対象シラバス全範囲を追跡できる。
- テンプレ文章による水増しがない。
- 各内容に適した教材形式がある。
- 必要な計算 / 図 / コード / SQL / 通信フロー / ケース演習がある。
- 最近の過去問へ接続できる。
- 問題結果から理解度を確認できる。
- CIとPages buildが通る。
- 重大な既知不具合がなく通常利用できる。

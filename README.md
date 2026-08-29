# AP Study Notes

応用情報技術者試験（AP）の個人学習用Webアプリです。

**教材再設計中 / BUILD `2026.08.30-r7`**

- 正本: GitHub `EliteMay/ap-study-notes`
- GitHub Pages: `https://elitemay.github.io/ap-study-notes/`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」

## 目的

単語数を増やすのではなく、APで必要な知識を **理解 → 適用 → 演習** までつなげます。

内容に合わせて、用語・比較だけでなく以下を使います。

- 図 / 構成図
- 擬似言語 / コードトレース
- SQL / E-R図 / 正規化
- 計算
- 通信フロー / 障害切り分け
- 攻撃 → 成立条件 → 観測 → 影響 → 対策
- ケース判断
- 過去問

## 現在の状態

Webアプリ基盤は利用可能ですが、**AP全範囲の完成教材ではありません**。

旧6教材の合計 **1,422語は全件監査済み**です。既存ID・検索・☆復習・localStorage進捗との互換を保ちながら、主教材を構造化Lessonへ移しています。

| 旧教材 | 語数 | 状態 |
|---|---:|---|
| アルゴリズム | 65 | **65/65 監査・移行済み** |
| データベース | 229 | **229/229 監査・移行済み** |
| ネットワーク | 480 | **480/480 監査・移行済み** |
| セキュリティ | 501 | **501/501 監査・再分類済み** |
| システム開発 | 75 | **75/75 監査・移行済み** |
| プロジェクト管理 | 72 | **72/72 監査・移行済み** |

**旧1,422 / 1,422語の監査が完了しています。**

現在の構造化Lessonは **77本** です。

## カリキュラム

- 内部: 9大分類 / 23中分類
- 学習UI: 13学習ユニット
- 定義: `json/curriculum/ap-2026-map.json`
- 表示: `html/roadmap.html`

2027年度以降の新制度は別マップとして管理し、2026年度定義を上書きしません。

## 構造化Lesson

共通URL:

`html/lesson.html?id=<LESSON_ID>`

主なファイル:

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
- `worked-example` renderer

## 主な移行済み教材

### Algorithm / Programming

- ALG-01〜11
- PROG-01〜04
- FND-01

監査: `json/curriculum/audits/algorithm-audit.json`

### Database

- DB-01〜14
- E-R図 / 正規化 / SQL / JOIN / 集計 / 副問合せ
- Transaction / Lock / Isolation
- WAL / UNDO / REDO / Backup
- Index / Execution Plan
- NoSQL / CAP / DWH / OLAP

監査: `json/curriculum/audits/database-audit.json`

### Network

- NET-01〜14
- OSI/TCP-IP
- IPv4/CIDR/Subnet計算 / IPv6
- Ethernet/VLAN/STP / Wi-Fi
- Routing/NAT/WAN/VPN
- TCP/UDP
- DNS / HTTP / Mail
- 構成図 / DHCP / ARP / 障害切り分け
- 可用性/QoS / Cloud Network

監査: `json/curriculum/audits/network-audit.json`

Security旧教材からも純粋な通信基礎 **104語** をNetworkへ再配置し、DNS/HTTP/TCP等の二重主教材を解消しました。

### Security

- SEC-01 情報セキュリティの目的・資産・脅威・設計原則
- SEC-02 暗号・ハッシュ・パスワード保護
- SEC-03 PKI・証明書・TLS・鍵管理
- SEC-04 認証・認可・MFA・SSO・ID管理
- SEC-05 Webアプリ攻撃と安全な実装
- SEC-06 メール認証・フィッシング・ソーシャルエンジニアリング
- SEC-07 マルウェア・標的型攻撃・侵入後行動
- SEC-08 認証・ネットワーク・実装への攻撃パターン
- SEC-09 防御機構・ハードニング・アクセス制御
- SEC-10 監視・インシデント対応・フォレンジック・復旧
- SEC-11 ISMS・リスクアセスメント・脆弱性管理
- SEC-12 クラウドセキュリティ・ゼロトラスト

監査: `json/curriculum/audits/security-audit.json`

旧501語の再分類:

- **369語 → SEC-01〜12**
- **104語 → Network**
- **13語 → Computer Systems**
- **10語 → Law / Standards**
- **2語 → System Development**
- **3語 → Service / Audit**

純粋な通信や法規をSecurityへ重複保持せず、公式中分類へ主所属を戻しています。

### その他

- CMP-01 コンテナと仮想化
- CMP-02 クラウドサービスモデルと責任分界
- SYS-01〜08
- DEV-01 Agile / Scrum
- PM-01〜06
- SVC-01 サービスマネジメント / SLA
- AUD-01 システム監査 / 内部統制
- STR-01 システム化計画 / RFP
- LAW-01 セキュリティ関連法規・個人情報・知的財産

## 旧用語ページの扱い

旧6ページは削除しません。

維持する機能:

- 検索
- 旧カテゴリ絞込
- ☆復習
- 既存localStorage習得状態
- 既存詳細JSON

移行済み分野では、旧用語カードを主教材ではなく**互換用索引**として扱います。

## 崩してはいけない仕様

- 既存用語IDを不用意に変更・削除しない。
- localStorageキー変更時は移行処理を用意する。
- 過去問PDF / 問題JSON / 解説JSONの対応を壊さない。
- GitHub Pagesの相対パスを維持する。
- 秘密情報/APIキーを公開リポジトリへ置かない。
- 監査済み移行表とLesson割当を勝手にずらさない。
- 「語数が多い = 教材完成」と扱わない。

## データ構成

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

教材本文・旧用語・監査結果はJSONへ分離します。

## 保存方法

教材データはGitHub上のJSON。個人進捗はブラウザのlocalStorageへ保存します。

- `security-terms-checked`
- `network-terms-checked`
- `database-terms-checked`
- `algorithm-terms-checked`
- `system-terms-checked`
- `management-terms-checked`
- `ap-study-bookmarks-v1`
- `ap-study-recent-v1`
- `ap-study-test-history-v1`
- `ap-study-theme`

Lesson理解度の永続保存は未実装です。

## GitHub Pages

公開URL:

`https://elitemay.github.io/ap-study-notes/`

main更新後にPagesがデプロイされます。静的HTML/CSS/JS/JSON構成です。

## 自動検証

`.github/workflows/validate.yml` でmain / PRごとに検証します。

- JavaScript構文
- 全JSON構文
- manifest件数 / ID / category
- 9大分類 / 23中分類 / 13ユニット
- Lesson ID / order / unit / IPA中分類
- section / diagram / checks / next参照
- Algorithm 65/65
- System 75/75
- Management 72/72
- Database 229/229
- Network 480/480
- Security 501/501
- `legacyTermRanges` 範囲展開
- 監査JSONとLesson割当の一致
- Securityでは369語のSEC Lesson meta一致と132語のcross-domain再配置
- セキュリティ過去問targets
- 主要HTML参照

監査:

- `tests/validate-audits.mjs`
- `tests/validate-security-audit.mjs`

## 注意点・既知の問題

旧1,422語の監査は終わりましたが、**AP全体はまだ完成ではありません**。

主な不足:

- UI・情報メディア
- CPU / Memory / OS / HardwareなどComputer Systemsの大部分
- 経営戦略 / Marketing / Accounting / Business
- 労働・取引法規 / 倫理 / 標準化
- 最近のAP過去問と各Lessonの体系的な紐付け
- 本番型の長文Case / 計算 / 構成図問題
- Lesson正答履歴の永続保存と理解度判定

公開Pagesを通常ブラウザで77Lessonすべて操作するE2E総当たり確認は未実施です。

## 次の段階

今後は旧用語監査ではなく、**シラバス上まだ不足している中分類を新規教材として埋める段階**です。

優先候補:

1. Computer SystemsのCPU / Memory / OS / 性能計算
2. UI・情報メディア
3. 経営・会計・ビジネス
4. 法務の未整備領域
5. 過去問・本番型演習の増強

## 完成条件

- 対象シラバス全範囲を追跡できる。
- テンプレ文章による水増しがない。
- 各内容に適した教材形式がある。
- 必要な計算 / 図 / コード / SQL / 通信 / Security Case演習がある。
- 最近の過去問へ接続できる。
- 問題結果から理解度を確認できる。
- CIとPages buildが通る。
- 重大な既知不具合がなく通常利用できる。

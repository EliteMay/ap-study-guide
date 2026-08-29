# AP Study Notes — 保守仕様書 / AI引き継ぎ書

この `README.md` は、この学習サイトを今後も壊さず改修するための**最重要仕様書**です。
新しいZIPを作るたびに、READMEの名前を変えたり、`README_年度修正.txt` のような別ファイルを増やしたりしないでください。

**固定ルール：READMEは必ず `README.md` だけにする。**

**作業ログの固定ルール：改修した内容は必ず `docs/作業報告書.md` に追記する。**

**仕様優先順位：`README.md` を最上位仕様、`docs/仕様書.md` を補助仕様とする。矛盾がある場合は `README.md` を優先し、`docs/仕様書.md` 側を `README.md` に合わせて更新する。**

**AI依頼の入口：ChatGPTへ依頼する場合は、まず `docs/ai/AI最重要ルール.md` の本文を Project instructions または依頼文の冒頭に設定する。README全文を毎回読んだと仮定しない。**

---

## 0. このREADMEの目的

このサイトは、応用情報技術者試験（AP）の学習用サイトです。現在は、**情報セキュリティ分野**と**ネットワーク分野**を中心に、次の3つをつなげて学習できるように作っています。

1. **用語辞書**  
   セキュリティ・ネットワーク・暗号・認証・攻撃・防御などの用語を調べるページ。

2. **用語の深掘り解説**  
   単なる定義だけでなく、「中学生でも分かる例え」「試験での出方」「午後問題での使い方」まで説明するページ。

3. **午後過去問の解説**  
   実際の午後問題を、設問単位で「どこを見るか」「なぜその答えになるか」「どう記述すればいいか」まで解説するページ。

このREADMEは、別のAIや未来の自分にZIPを渡すだけで、**サイトの構造・こだわり・崩してはいけない仕様・修正手順・品質チェック方法が全部分かる**ようにするためのものです。

---

## 1. 絶対に守ること

### 1-1. READMEの扱い

- READMEのファイル名は **必ず `README.md`** にする。
- `README_v2.txt`、`README_修正内容.txt`、`README_年度修正.txt` のような別READMEを作らない。
- 変更履歴も注意事項も、すべてこの `README.md` に追記する。
- ユーザーは毎回ZIPの中身を上書きコピーするため、READMEが増えると管理不能になる。

### 1-1-1. 作業報告書の扱い

- サイトを修正したら、毎回 `docs/作業報告書.md` に「何を確認したか」「何を直したか」「何を残したか」を追記する。
- `作業報告書_v2.md` や `修正報告.txt` のような別ファイルを増やさない。
- READMEは保守ルール、作業報告書は実作業ログとして分けて管理する。
- 解説内容を見直した場合は、正確性をどこまで確認したかも作業報告書に書く。
- ChatGPTなど別AIから成果物を受け取って確認した場合は、採用した点だけでなく、良くなかった点、危なかった点、採用しなかった点、次回防止策を必ず `docs/作業報告書.md` に残す。
- 同じ失敗を繰り返さないため、必要なら `docs/ai/ChatGPT作業ルール.md` と `docs/ai/ChatGPT依頼用プロンプト.md` も更新する。

### 1-2. HTMLに単語カードを直書きしない

`html/security.html` に大量の単語カードを手書きしてはいけない。

理由：

- 500語、1000語と増えたときにHTMLが重くなる。
- AIの出力文字数制限で途中で切れる。
- 1語だけ直したいときにHTML全体が壊れやすい。
- 検索・カテゴリ・進捗処理の保守が難しくなる。

**単語データはJSON、表示システムはHTML/JavaScriptに分離する。**

### 1-3. 問題文と解説を混ぜない

過去問では、以下を必ず分ける。

- 問題文・設問・選択肢・表の起こし → `json/past-problems/`
- 解説・答案の考え方・設問別の説明 → `json/past/`
- PDF原本 → `sources/`

問題文を解説JSONに混ぜると、長くなりすぎて保守しにくい。

### 1-4. 設問単位で管理する

午後問題は、必ず `sections` 配列で設問ごとに分ける。

悪い例：

```json
{
  "ultraExplanation": ["この問題はメールセキュリティの問題です。..."]
}
```

良い例：

```json
{
  "meta": {
    "version": "v9-integrity"
  },
  "pastQuestions": [
    {
      "id": "ap-h27-s-pm-q01",
      "sections": [
        {
          "label": "設問1",
          "answerTargets": ["a", "e"],
          "expectedAnswers": ["a=送信ドメイン認証", "e=ログ"],
          "answerGuide": "...",
          "why": "...",
          "trap": "..."
        }
      ]
    }
  ]
}
```

`sections` は `json/past/*.json` のルート直下ではなく、`pastQuestions[]` の各問題オブジェクト内に置く。

設問単位にしないと、「設問3だけ解説がない」「aだけ答えてeが抜けている」などのミスが起こる。

---

## 2. 現在のフォルダ構成

```text
AP Study Notes/
├── index.html
├── README.md
│
├── html/
│   ├── security.html
│   ├── security-past.html
│   ├── database.html
│   ├── network.html
│   ├── algorithm.html
│   ├── system.html
│   ├── management.html
│   ├── test.html
│   └── template.html
│
├── css/
│   └── style.css
│
├── docs/
│   ├── 仕様書.md
│   ├── 作業報告書.md
│   └── ai/
│       ├── AI最重要ルール.md
│       ├── ChatGPT依頼用プロンプト.md
│       └── ChatGPT作業ルール.md
│
├── security-terms-manifest.json
├── security-details-manifest.json
├── security-past-index.json
├── network-terms-manifest.json
├── network-details-manifest.json
├── database-terms-manifest.json
├── database-details-manifest.json
│
├── json/
│   ├── terms/
│   │   ├── security-terms-basic.json
│   │   ├── security-terms-network-dns.json
│   │   ├── security-terms-crypto-pki.json
│   │   ├── security-terms-auth-id.json
│   │   ├── security-terms-web-mail-app.json
│   │   ├── security-terms-attacks-malware.json
│   │   ├── security-terms-defense-monitoring.json
│   │   ├── security-terms-management-risk.json
│   │   ├── security-terms-cloud-zero-trust.json
│   │   ├── network-terms-*.json
│   │   └── database-terms-*.json
│   │
│   ├── details/
│   │   ├── security-details-basic.json
│   │   ├── security-details-network-dns.json
│   │   ├── security-details-crypto-pki.json
│   │   ├── security-details-auth-id.json
│   │   ├── security-details-web-mail-app.json
│   │   ├── security-details-attacks-malware.json
│   │   ├── security-details-defense-monitoring.json
│   │   ├── security-details-management-risk.json
│   │   ├── security-details-cloud-zero-trust.json
│   │   ├── network-details-*.json
│   │   └── database-details-*.json
│   │
│   ├── past/
│   │   ├── security-past-h24-s-incident.json
│   │   ├── security-past-h25-s-pc-malware.json
│   │   ├── security-past-h25-a-web-https.json
│   │   ├── security-past-h26-s.json
│   │   ├── security-past-h27-s.json
│   │   ├── security-past-h26-a-fw-waf.json
│   │   └── security-past-h29-s-malware.json
│   │
│   └── past-problems/
│       ├── security-problem-h24-s-incident.json
│       ├── security-problem-h25-s-pc-malware.json
│       ├── security-problem-h25-a-web-https.json
│       ├── security-problem-h26-s.json
│       ├── security-problem-h27-s.json
│       ├── security-problem-h26-a-fw-waf.json
│       └── security-problem-h29-s-malware.json
│
├── sources/
│   ├── pm09-h24s-incident.pdf
│   ├── pm09-h25s-pc-malware.pdf
│   ├── pm08-h25a-web-https.pdf
│   ├── pm01-h26s.pdf
│   ├── pm01-h27s.pdf
│   ├── pm01-h26a-fw-waf.pdf
│   └── pm01-h29s-malware.pdf
│
└── tools/
    └── check-json.html
```

---

## 3. 各ファイルの役割

| ファイル | 役割 | 触る頻度 |
|---|---|---:|
| `index.html` | ホーム。単元一覧・入口。 | 低 |
| `html/security.html` | セキュリティ用語辞書ページ。JSONを読み込んで表示する。 | 中 |
| `html/security-past.html` | 過去問解説ページ。過去問一覧・設問別解説を表示する。 | 中 |
| `html/network.html` | ネットワーク用語辞書ページ。JSONを読み込んで表示する。 | 中 |
| `css/style.css` | 全ページ共通デザイン。 | 低〜中 |
| `security-terms-manifest.json` | 用語の軽量JSON一覧。 | 低 |
| `security-details-manifest.json` | 詳細解説JSON一覧。 | 低 |
| `security-past-index.json` | 過去問解説の索引。年度、問番号、JSONファイル、PDFを対応付ける。 | 高 |
| `network-terms-manifest.json` | ネットワーク用語の軽量JSON一覧。 | 低 |
| `network-details-manifest.json` | ネットワーク詳細解説JSON一覧。 | 低 |
| `json/terms/*.json` | 検索・分類用の軽量辞書。短い定義だけ。セキュリティとネットワークで共通の置き場。 | 高 |
| `json/details/*.json` | 用語の深掘り解説。長文OK。セキュリティとネットワークで共通の置き場。 | 高 |
| `json/past/*.json` | 午後過去問の設問別解説。長文OK。 | 高 |
| `json/past-problems/*.json` | 問題文・設問・選択肢・表の起こし。 | 高 |
| `sources/*.pdf` | 原本PDF。年度確認・問題文確認用。 | 中 |
| `tools/check-json.html` | JSON品質チェックツール。 | 中 |
| `README.md` | 最上位仕様書。必ず固定名。 | 高 |
| `docs/仕様書.md` | サイト全体の画面仕様・データ仕様を整理した説明書。 | 中 |
| `docs/作業報告書.md` | 改修時に毎回更新する作業ログ。確認内容、修正内容、残課題を残す。 | 高 |
| `docs/ai/AI最重要ルール.md` | ChatGPTのProject instructionsへ貼る短い必須ルールと作業前確認手順。 | 高 |
| `docs/ai/ChatGPT依頼用プロンプト.md` | ChatGPTにZIP一式を渡して文章改善を依頼するためのテンプレート集。 | 中 |
| `docs/ai/ChatGPT作業ルール.md` | ChatGPTに最初に読ませる禁止事項・作業範囲・出力前チェックの指示書。 | 高 |

---

## 4. セキュリティ用語辞書の設計

### 4-1. 軽量用語JSON `json/terms/*.json`

検索やカテゴリ絞り込みを高速にするため、ここには短い情報だけを入れる。

```json
{
  "id": "sec-network-dns-001",
  "term": "DNS",
  "aliases": ["Domain Name System", "ドメインネームシステム", "名前解決"],
  "category": "ネットワーク・DNS・境界防御",
  "definition": "ドメイン名とIPアドレスを対応付ける仕組み。"
}
```

#### 必須フィールド

| フィールド | 説明 |
|---|---|
| `id` | 一意のID。変更すると進捗やリンクが壊れる。 |
| `term` | 表示する用語名。 |
| `aliases` | 略称・英語・表記揺れ。検索対象にする。 |
| `category` | 分類。カテゴリ絞り込みに使う。 |
| `definition` | 一言の短い定義。長文を書かない。 |

#### 禁止事項

- `beginner` や `examPoint` のような長文を入れない。
- HTMLタグを直接入れない。
- 同じ `id` を使わない。
- 同じ `term` を別IDで乱立させない。必要なら `aliases` に入れる。

---

### 4-2. 詳細解説JSON `json/details/*.json`

用語カードで「解説を見る」を押したときに出す長文データ。

```json
{
  "meta": {
    "title": "詳細解説",
    "version": "v13-explanation-enrichment"
  },
  "details": [
    {
      "id": "sec-network-dns-001",
      "term": "DNS",
      "category": "ネットワーク基礎・DNS・通信",
      "level": "基礎",
      "tags": ["DNS", "名前解決"],
      "beginner": "DNSは、ドメイン名をIPアドレスへ変換する仕組みです。",
      "example": "ブラウザで example.com を開くと、まずDNSに問い合わせてWebサーバのIPアドレスを調べます。",
      "examPoint": "DNSは、名前解決、キャッシュDNS、権威DNS、DNSキャッシュポイズニング、DNSSECとセットで問われやすい。",
      "trap": "DNSは通信内容を暗号化する仕組みではない。暗号化はTLSなどが担当する。",
      "deepDive": [
        {
          "heading": "午後問題で見る場所",
          "body": [
            "DNSサーバがDMZにあるか、内部LANにあるかを見る。",
            "外部向けDNSと内部向けDNSを分ける理由を確認する。"
          ]
        }
      ],
      "relatedConcepts": ["IPアドレス", "DNSSEC", "DNSキャッシュポイズニング"],
      "commonMistakes": [
        "DNSとARPを混同する。DNSは名前からIP、ARPはIPからMACアドレス。"
      ],
      "afternoonUse": "午後問題では、DNS問い合わせの向き、公開DNSの配置、内部DNSとの分離理由を本文と構成図から読む。",
      "howToRemember": "DNSはネット上の電話帳。名前から住所を調べる。"
    }
  ]
}
```

#### 正式フィールド

| フィールド | 役割 |
|---|---|
| `id` | `json/terms` のIDと一致させる。 |
| `term` | 表示名。`json/terms` と一致させる。 |
| `category` | カテゴリ名。`json/terms` と一致させる。 |
| `level` | 基礎、標準などのレベル。 |
| `tags` | 補助タグ。 |
| `beginner` | 初心者向け説明。中学生でも分かるレベル。 |
| `example` | 具体例。実際の場面にする。 |
| `examPoint` | 午前問題で問われる形。 |
| `trap` | ひっかけ。 |
| `deepDive` | 見出し付きの深掘り解説。 |
| `relatedConcepts` | 関連用語。 |
| `commonMistakes` | よくある誤解。 |
| `afternoonUse` | 午後問題で使う読み方。 |
| `howToRemember` | 覚え方。 |

`mechanism`, `afternoonPoint`, `memoryHook`, `usedInPastQuestions` は古い例に出ていた名前です。現在の画面側では主に上表の正式フィールドを使うため、新規追加では使わないでください。

#### 解説品質のルール

悪い解説：

> DNSは名前解決に使う。試験で出る。重要。

良い解説：

> DNSは、人間が覚えやすいドメイン名を、通信に使うIPアドレスへ変換する仕組みです。ブラウザにURLを入れた時点では、まだ相手サーバのIPアドレスが分かりません。そこでPCは、設定されたDNSサーバへ問い合わせます。DNSの問題では、DNSそのものよりも、キャッシュDNSサーバ、権威DNSサーバ、DNSキャッシュポイズニング、DNSSEC、内部DNSと外部DNSの分離が狙われます。

**長いだけで中身がない解説は禁止。**  
各用語ごとに、必ずその用語固有の仕組み・例・ひっかけを書く。

---

## 5. 過去問解説の設計

### 5-1. 過去問索引 `security-past-index.json`

過去問ページに表示する一覧。

```json
{
  "meta": {
    "title": "AP Study Notes セキュリティ過去問解説インデックス",
    "version": "v9-integrity"
  },
  "files": [
    {
      "id": "h27-s",
      "examRound": "平成27年 春期",
      "label": "AP H27 春",
      "file": "json/past/security-past-h27-s.json",
      "count": 1,
      "theme": "情報セキュリティ：メールシステム、IMAP、送信ドメイン認証、S/MIME、電子署名、標的型攻撃メール",
      "problemFile": "json/past-problems/security-problem-h27-s.json",
      "sourcePdf": "sources/pm01-h27s.pdf",
      "sourceCheck": {
        "userConfirmedRound": "平成27年 春期",
        "confidence": "user-confirmed"
      }
    }
  ]
}
```

#### 必須フィールド

| フィールド | 説明 |
|---|---|
| `id` | 過去問ID。解説・問題文・用語リンクで使う。 |
| `examRound` | 平成○年 春期/秋期。年度ズレ防止のため必須。 |
| `label` | 一覧表示用の短い表示名。 |
| `file` | `json/past/` の解説JSON。 |
| `count` | そのファイル内の過去問件数。 |
| `theme` | 一覧に出すテーマ説明。 |
| `problemFile` | `json/past-problems/` の問題文JSON。インデックス側ではこの名前を使う。 |
| `sourcePdf` | `sources/` のPDF原本。 |
| `sourceCheck` | 年度・根拠・信頼度。 |

`security-past-index.json` 側は `problemFile` を使います。一方、`json/past/*.json` 側は `sourceProblemFile` を使います。混同しないでください。

---

### 5-2. 問題文JSON `json/past-problems/*.json`

問題文・表・設問・選択肢を保存する。

目的：

- 解説が問題とズレるのを防ぐ。
- `a` と `e` のような複数空欄を見落とさない。
- AIが後から見ても、どの設問を解説すべきか分かる。

```json
{
  "meta": {
    "version": "v9-integrity",
    "sourcePdf": "sources/pm01-h27s.pdf",
    "transcriptionLevel": "重要本文・図表・設問をPDF画像から起こした下書き。"
  },
  "problem": {
    "id": "ap-h27-s-pm-q01-problem",
    "examRound": "平成27年 春期",
    "questionNumber": "午後 問1",
    "title": "メールシステム更新とセキュリティ対策",
    "sourcePages": ["PDF内 p.4", "PDF内 p.5"],
    "opening": [],
    "body": [],
    "questions": [
      {
        "label": "設問1",
        "targets": ["a", "e"],
        "instruction": "本文中の空欄a、eに入る適切な字句を解答群から選ぶ。",
        "choices": [
          {"key": "ア", "text": "OP25B"},
          {"key": "イ", "text": "送信ドメイン認証"},
          {"key": "カ", "text": "ログ"}
        ]
      ]
    ]
  }
}
```

#### 重要ルール

- 設問が空欄 `a` と `e` を問うなら、`targets: ["a", "e"]` と必ず両方書く。
- ここに書かれた `targets` と、解説側の `answerTargets` が一致する必要がある。
- 問題文がPDF画像からの起こしで未確定なら、`problemTextStatus: "draft-from-pdf-image"` と書く。
- 完全確認済みなら、`problemTextStatus: "verified"` にする。

---

### 5-3. 解説JSON `json/past/*.json`

設問ごとに、答案・理由・ひっかけ・読み方を書く。

```json
{
  "meta": {
    "version": "v9-integrity",
    "yearFixNote": "ユーザー確認により、表示年度は平成27年春期のまま維持。"
  },
  "pastQuestions": [
    {
      "id": "ap-h27-s-pm-q01",
      "examRound": "平成27年 春期",
      "questionNumber": "午後 問1",
      "title": "情報セキュリティ：メールシステム、送信ドメイン認証、S/MIME、標的型攻撃メール",
      "themeSummary": "メールシステム更新を題材に、POP/IMAP、送信ドメイン認証、S/MIME、電子署名、標的型攻撃メール対応を問う問題。",
      "relatedTerms": ["送信ドメイン認証", "SPF", "DKIM", "ログ"],
      "sourceProblemFile": "json/past-problems/security-problem-h27-s.json",
      "sourcePdf": "sources/pm01-h27s.pdf",
      "sections": [
        {
          "label": "設問1",
          "answerTargets": ["a", "e"],
          "status": "解説済み",
          "expectedAnswers": ["a=送信ドメイン認証", "e=ログ"],
          "answerGuide": "本文中の技術説明と設問対象を対応させ、a/eの両方を確認する。",
          "why": "SPFやDKIMをまとめた上位概念が送信ドメイン認証である。",
          "trap": "設問対象がaだけでなくeもあることを見落とさない。"
        }
      ]
    }
  ]
}
```

#### 必須フィールド

| フィールド | 説明 |
|---|---|
| `label` | 設問1、設問2など。 |
| `answerTargets` | 答える対象。空欄a/e、選択肢、記述など。 |
| `status` | 解説済み / 要確認 / 未解説。 |
| `expectedAnswers` | 予想答案・答案方向。 |
| `answerGuide` | 答案の書き方。 |
| `why` | なぜそうなるか。 |
| `trap` | 間違いやすい点。 |
| `relatedTerms` | 自動リンク・復習用語。 |
| `sourceProblemFile` | `json/past-problems/` の問題文JSON。解説JSON側ではこの名前を使う。 |

`json/past/*.json` のルートは `meta` と `pastQuestions` です。ルート直下に `id` や `sections` を置かないでください。

#### 解説の品質ルール

設問解説には、最低でも次を入れる。

1. **この設問で何を聞かれているか**
2. **本文・表・図のどこを見ればよいか**
3. **なぜその答えになるか**
4. **他の選択肢がなぜ違うか**
5. **記述式なら何文字以内でどう削るか**
6. **次に同じ問題が出たらどう判断するか**
7. **関連用語へのリンク**

悪い解説：

> aは送信ドメイン認証。SPFとDKIMが出ているから。

良い解説：

> 空欄aは、SPFとDKIMをまとめる上位概念を聞いている。本文では「送信IPアドレスを基にチェックする技術（SPF）、又は受信メール中の電子署名を基にチェックする技術（DKIM）」と説明されている。SPFだけでもDKIMだけでもなく、これらをまとめて送信元ドメインの正当性を確認する仕組みなので、aは送信ドメイン認証になる。ここでOP25Bを選ばない理由は、OP25Bは迷惑メール送信対策として25番ポートの外向き通信を制限する仕組みであり、受信メールの送信元ドメイン確認ではないから。

---

## 6. 年度対応・PDF対応

現在の対応は以下。

| PDFファイル | 年度 | 問題 | テーマ |
|---|---|---|---|
| `sources/pm01-h26s.pdf` | 平成26年 春期 | 午後 問1 | SSL/TLS、クライアント証明書、DMZ、リバースプロキシ、FW設定 |
| `sources/pm01-h27s.pdf` | 平成27年 春期 | 午後 問1 | メール、IMAP、送信ドメイン認証、S/MIME、電子署名、標的型攻撃メール |
| `sources/pm01-h26a-fw-waf.pdf` | 平成26年 秋期 | 午後 問1 | FW、IDS、IPS、WAF、ホワイトリスト |

この対応は、ユーザーがスクリーンショットで「上から26春、27春、26秋」と確認したものに基づく。

### 年度を変更するとき

年度・期・ファイル対応を直す場合は、必ず次を同時に直す。

1. `security-past-index.json`
2. `json/past/*.json`
3. `json/past-problems/*.json`
4. `sources/*.pdf` のファイル名が変わるなら参照パス
5. `sourceCheck` の根拠メモ
6. このREADMEの年度対応表

---

## 7. `html/security.html` の仕組み

`html/security.html` は、セキュリティ用語辞書ページ。

### 読み込みの流れ

1. `security-terms-manifest.json` を読む。
2. そこに書かれた `json/terms/*.json` を全部読む。
3. `security-details-manifest.json` を読む。
4. そこに書かれた `json/details/*.json` を全部読む。
5. 軽量用語データで、カテゴリ・単語一覧・カードを生成する。
6. 詳細解説は、ユーザーが「解説を見る」を押したときに表示する。
7. 用語リンク化も、開いた解説部分だけに実行する。

### 維持すべき機能

- リアルタイム検索
- カテゴリ絞り込み
- 単語一覧ジャンプ
- 解説を見る / 隠して確認
- 習得済みチェック
- localStorage保存
- 進捗バー
- 用語リンクの遅延生成
- ID重複・term重複のconsole警告

### localStorageキー

localStorageのキーを変えると、ユーザーの進捗が消える可能性がある。変更する場合はREADMEに理由を書く。

### `html/network.html` の仕組み

`html/network.html` は、ネットワーク用語辞書ページ。セキュリティ用語ページと同じく、HTMLに大量の単語カードを直書きせず、軽量用語JSONと詳細解説JSONを分けて読み込む。

読み込みの流れ：

1. `network-terms-manifest.json` を読む。
2. そこに書かれた `json/terms/network-terms-*.json` を全部読む。
3. `network-details-manifest.json` を読む。
4. そこに書かれた `json/details/network-details-*.json` を全部読む。
5. 軽量用語データで、カテゴリ・単語一覧・カードを生成する。
6. 詳細解説は、ユーザーが「解説を見る」を押したときに表示する。

現在のネットワーク単元は12カテゴリ、軽量用語480件、詳細解説480件で構成する。localStorageキーは `network-terms-checked` を使う。

---

## 8. `html/security-past.html` の仕組み

`html/security-past.html` は、午後過去問解説ページ。

### 読み込みの流れ

1. `security-past-index.json` を読む。
2. 各項目の `explanationFile` を必要に応じて読む。
3. 各項目の `problemFile` を必要に応じて読む。
4. 問題カードを一覧表示する。
5. ユーザーが「解説を開く」を押した問題だけ、設問別解説を展開する。
6. 展開した文章だけ、自動リンク化する。
7. 設問ごとにチェック表を表示する。

### 過去問ページで必ず出す情報

- 年度・期
- 午後問番号
- 元PDFファイル名
- テーマ
- 問題の概要
- 設問別チェック表
- 設問ごとの答案方向
- 理由
- ひっかけ
- 関連用語
- 問題文JSONにある設問対象

---

## 9. 自動リンク化の仕様

用語解説や過去問解説に出てくる用語は、自動で辞書カードへリンクする。

例：

```html
<a href="html/security.html#sec-network-dns-001" class="term-link">DNS</a>
```

### 重要ルール

- ページ全体を一括で置換しない。
- 開いた解説だけに対して遅延置換する。
- 先に長い語を置換する。例：`DNSキャッシュポイズニング` を `DNS` より先に処理する。
- HTMLエスケープを必ず行い、JSON内の文字列をそのままHTMLとして信用しない。
- 過去問解説から `html/security.html#用語ID` へ移動した場合は、`html/security.html` 側でJSON描画後にハッシュを再処理し、該当カードまでスクロールして詳細解説を開く。
- 関連語が辞書に存在しない場合は `href="#"` にしない。未登録表示にして、単語一覧へ誤移動させない。

---

## 10. 品質チェックツール

Live Serverで次を開く。

```text
tools/check-json.html
```

チェック対象：

- 用語ID重複
- 用語名重複
- セキュリティ用語とネットワーク用語の、軽量用語JSONと詳細解説JSONの件数一致
- マニフェストの `count` / `totalTerms` / `totalDetails` と実データ件数の一致
- 過去問JSONの `sections` 漏れ
- `answerTargets` 漏れ
- `expectedAnswers` 漏れ
- `problemFile` の読み込み可否
- 問題文JSONの `targets` と解説JSONの `answerTargets` の不一致
- `relatedTerms` に存在しない用語がないか
- README.md以外のREADMEが増えていないか

合格条件：

- 画面上の出力に `ERROR` が0件である。
- JSON読み込み失敗がない。
- 用語ID、詳細解説ID、過去問IDの重複がない。
- セキュリティ用語501件・詳細解説501件、ネットワーク用語480件・詳細解説480件が対応している。
- `security-past-index.json` の `problemFile` が実在する。
- `json/past/*.json` の `sourceProblemFile` が実在する。
- 問題文JSONの `targets` と解説JSONの `answerTargets` に不一致がない。
- ブラウザのconsoleに、JSON読み込み失敗、ID不一致、targets不一致の警告が出ていない。

`WARN` は内容を確認し、意図した未確定メモ以外は修正する。特にID不一致、ファイル不存在、targets不一致に関する警告は完了前に直す。

※今後改修するAIは、このチェックツールも必要に応じて強化すること。

---

## 11. よく起きたミスと対策

### ミス1：設問対象の一部だけ解説する

例：H27春 午後問1の設問1は、本来 `a` と `e` を答える問題だったのに、`a` だけ解説していた。

対策：

- 問題文JSONに `targets` を書く。
- 解説JSONに `answerTargets` を書く。
- チェックツールで `targets` と `answerTargets` を比較する。

### ミス2：年度がズレる

対策：

- `sourceCheck` を必ず書く。
- ユーザー確認済みなら `confidence: user-confirmed` にする。
- READMEの年度対応表を更新する。

### ミス3：用語解説がテンプレの使い回しになる

対策：

- 各用語に固有の例を入れる。
- 午後問題での使われ方を入れる。
- 「何を守るか」「どの層の話か」「防げないもの」を明記する。
- 重要語から優先して完全手書き化する。

### ミス4：検索が重くなる

対策：

- `json/terms` は短い定義だけにする。
- 長文は `json/details` に逃がす。
- 検索は `term / aliases / category / definition` だけを見る。

### ミス5：READMEが増殖する

対策：

- READMEは `README.md` だけ。
- 新しい変更履歴もこのファイルに追記。

---

## 12. 新しい用語を追加する手順

1. 該当ジャンルを決める。
2. `json/terms/security-terms-ジャンル.json` に短いデータを追加する。
3. `json/details/security-details-ジャンル.json` に同じ `id` の詳細解説を追加する。
4. 必要なら `relatedConcepts`, `deepDive`, `afternoonUse` に過去問や関連用語との接続を書く。
5. Live Serverで `html/security.html` を開いて検索できるか確認する。
6. `tools/check-json.html` を実行する。

### 追加例

`json/terms/...`

```json
{
  "id": "sec-defense-utm-001",
  "term": "UTM",
  "aliases": ["Unified Threat Management", "統合脅威管理"],
  "category": "防御・監視・運用",
  "definition": "複数のセキュリティ機能を一台にまとめた統合型の防御機器。"
}
```

`json/details/...`

```json
{
  "meta": {
    "title": "詳細解説",
    "version": "v13-explanation-enrichment"
  },
  "details": [
    {
      "id": "sec-defense-utm-001",
      "term": "UTM",
      "category": "防御・監視・運用",
      "level": "基礎",
      "tags": ["防御", "監視"],
      "beginner": "UTMは、ファイアウォール、IPS、アンチウイルス、URLフィルタなどをまとめた統合型の防御機器です。",
      "example": "小規模拠点で、1台のUTMに通信の許可・遮断、ウイルス検査、不正アクセス検知をまとめて任せる。",
      "examPoint": "UTMは単体機能ではなく、複数機能を統合した機器として問われる。",
      "trap": "UTMを入れれば全て防げるわけではない。設定、ログ監視、運用が必要。",
      "deepDive": [
        {
          "heading": "午後問題での見方",
          "body": ["FWだけでは防げない攻撃への追加対策として登場することがある。"]
        }
      ],
      "relatedConcepts": ["ファイアウォール", "IPS", "URLフィルタリング"],
      "commonMistakes": ["UTMを入れれば運用が不要になると考えない。"],
      "afternoonUse": "構成図では、どの通信を検査し、どのログを残すかを確認する。",
      "howToRemember": "UTMは複数の防御機能をまとめた箱。"
    }
  ]
}
```

---

## 13. 新しい過去問を追加する手順

### 13-1. PDFを保存する

`sources/` に入れる。

ファイル名は以下の形式を推奨。

```text
pm01-h28s.pdf
pm01-h28a.pdf
```

- `h28s` = 平成28年 春期
- `h28a` = 平成28年 秋期
- 午後問1以外なら必要に応じて `pm02` などにする。

### 13-2. 問題文JSONを作る

`json/past-problems/security-problem-h28-s.json`

最低限、以下を入れる。

- 年度
- 問番号
- PDFパス
- ページ番号
- 問題概要
- 表や図の要約
- 設問一覧
- 各設問の `targets`
- 選択肢があれば選択肢

### 13-3. 解説JSONを作る

`json/past/security-past-h28-s.json`

最低限、以下を入れる。

- 年度
- 問番号
- テーマ
- problemFile
- sections
- 各sectionの answerTargets
- expectedAnswers
- answerGuide
- why
- trap
- relatedTerms

### 13-4. 索引に登録する

`security-past-index.json` に追加する。

### 13-5. チェックする

`tools/check-json.html` を開いて、エラーがないか確認する。

---

## 14. 重要語の解説品質を上げる優先順位

全501語を一気に完璧にするより、午後問題で使う重要語から順に完全手書き化する。

最優先：

```text
SSL/TLS
サーバ証明書
クライアント証明書
認証局
ディジタル証明書
電子署名
ハッシュ関数
S/MIME
SPF
DKIM
送信ドメイン認証
IMAP
POP
標的型攻撃メール
ファイアウォール
ステートフルインスペクション
DMZ
リバースプロキシ
IDS
IPS
WAF
ホワイトリスト
ブラックリスト
DNS
DNSサーバ
DNSキャッシュポイズニング
```

---

## 15. AIに改修を依頼するときの固定プロンプト

今後、ChatGPTにZIPを渡して修正させる場合は、まず `docs/ai/AI最重要ルール.md` の「Project instructions に貼り付ける本文」をプロジェクトの instructions 欄へ設定する。プロジェクトを使わない場合は、その本文を依頼文の冒頭へ貼る。

相談、整理、説明、調査だけを依頼する場合は、作業前確認表を必須にしない。既存サイトへ取り込む文章、JSON、HTML/CSS、README・仕様書などの成果物案を作らせる場合は、最初に対象範囲を確認させてから作成を指示する。
成果物案の作成開始後は、ChatGPTが指定範囲の案を最後まで作成する。毎回Codexへ途中確認させるのではなく、仕様解釈、複数ファイル連携、ID・リンク・索引、HTML/CSS/JavaScript、PDF照合など採用判断に影響する不確実性がある場合だけ、回答末尾に `Codex確認推奨` を付けさせる。最終採用、既存ファイルへの反映、検証はCodexで行う。

```text
docs/ai/AI最重要ルール.md の必須ルールに従ってください。
今回はまだ編集を始めないでください。まず作業前確認表を返してください。

今回の目的:
【ここに目的を書く】

今回変更してよい範囲:
【ここにファイル名またはIDを書く】

今回変更してはいけない範囲:
【ここに対象外ファイルを書く】

確認表が正しければ、次のメッセージで作業開始と伝えます。
```

---

## 16. 完了条件

新しい改修をしたら、完了前に次を確認する。

- [ ] READMEは `README.md` だけか。
- [ ] HTMLに大量の単語カードを直書きしていないか。
- [ ] 用語の短い情報は `json/terms` にあるか。
- [ ] 用語の長い解説は `json/details` にあるか。
- [ ] 過去問の問題文は `json/past-problems` にあるか。
- [ ] 過去問の解説は `json/past` にあるか。
- [ ] 過去問は `sections` で設問単位になっているか。
- [ ] `answerTargets` に空欄や対象が全部入っているか。
- [ ] `expectedAnswers` があるか。
- [ ] 年度・期・PDF対応が `sourceCheck` に書かれているか。
- [ ] H27春の設問1のような複数対象問題を片方だけ解説していないか。
- [ ] `security-past-index.json` が正しいファイルを指しているか。
- [ ] `tools/check-json.html` を開いて確認できるか。
- [ ] `tools/check-json.html` の出力で `ERROR` が0件か。
- [ ] ブラウザconsoleにJSON読み込み失敗、ID不一致、targets不一致が出ていないか。
- [ ] 既存の検索、カテゴリ絞り込み、進捗、解説トグルが壊れていないか。
- [ ] READMEの変更履歴を更新したか。
- [ ] `docs/作業報告書.md` に今回の確認内容、修正内容、残課題を追記したか。
- [ ] ChatGPTに取り込み前提の成果物案を依頼した場合は、`docs/ai/AI最重要ルール.md` の本文を Project instructions または依頼冒頭に設定し、作業前確認表で範囲を確認したか。
- [ ] ChatGPTが `Codex確認推奨` を付けた場合は、採用前に理由と確認事項を確認したか。

---

## 17. 変更履歴

### v9 integrity

- H27春 午後問1の設問1を、`a` だけでなく `a/e` を答える問題として修正。
- `a=送信ドメイン認証`, `e=ログ` を明記。
- 問題文保存用の `json/past-problems/` を追加。
- PDF原本保存用の `sources/` を追加。
- 過去問ページに設問別チェック表を追加。
- JSON品質チェック用の `tools/check-json.html` を追加。
- README名を `README.md` に固定。

### v10 readme full

- READMEを大幅拡張。
- ファイルを渡すだけで別AIが構造を理解できるように、各JSONの役割、必須フィールド、禁止事項、追加手順、品質基準を明文化。
- 問題文JSONと解説JSONの分離ルールを詳細化。
- 設問漏れ・複数空欄漏れ・年度ズレ・README増殖を防ぐルールを明文化。
- AI依頼用の固定プロンプトと完了条件を追加。

### v11 docs and consistency cleanup

- `仕様書.md` を追加し、画面仕様、JSON仕様、状態管理、保守ルールを整理。
- `作業報告書.md` を追加し、今後の改修で毎回更新する運用に変更。
- ホーム画面のセキュリティ用語数取得先を `security-terms-manifest.json` に修正。
- ホーム画面の過去問件数を実データ3件に合わせ、`security-past-index.json` から同期できるように修正。
- `security.html` の重複ナビリンクを削除。
- 詳細解説JSONの不自然なテンプレート表現を整理。
- 過去問JSON内の古い「問題文はJSONに保存しない」説明を、現在の `json/past-problems/` 分離構成に合わせて修正。

### v12 chatgpt prompt workflow

- `ChatGPT依頼用プロンプト.md` を追加。
- ChatGPTにZIP一式を渡しても、1カテゴリ・1過去問・ID指定など作業範囲を絞る運用を明文化。
- ChatGPTは文章改善、Codexは取り込み・検証・全体整合確認を担当する流れを追加。

### v13 chatgpt guardrails

- `ChatGPT作業ルール.md` を追加。
- ChatGPTにMarkdownを読ませずに作業させないため、作業前確認と出力前チェックを必須化。
- 汎用テンプレ文、二重句点、作業範囲外編集を禁止事項として明文化。

### v14 documentation alignment

- README内の詳細解説JSONサンプルを、実データの `meta` + `details` 構造に修正。
- README内の問題文JSONサンプルを、実データの `meta` + `problem` 構造に修正。
- README内の過去問解説JSONサンプルを、実データの `meta` + `pastQuestions` 構造に修正。
- 詳細解説JSONの正式フィールドを、`beginner`, `example`, `examPoint`, `trap`, `deepDive`, `relatedConcepts`, `commonMistakes`, `afternoonUse`, `howToRemember` に整理。
- `problemFile` は `security-past-index.json` 側、`sourceProblemFile` は `json/past/*.json` 側で使うことを明記。
- `tools/check-json.html` の合格条件を明文化。

### v15 network phase1

- `network.html` を公開中のネットワーク用語辞書ページとして追加。
- `network-terms-manifest.json` と `network-details-manifest.json` を追加。
- `json/terms/network-terms-*.json` 12ファイル、`json/details/network-details-*.json` 12ファイルを追加。
- ネットワーク単元を12カテゴリ、軽量用語240件、詳細解説240件のJSON分離構成にした。
- `index.html` のネットワークカードを公開状態にし、`network-terms-checked` の進捗を表示できるようにした。
- 既存ページのナビゲーションからネットワークの準備中扱いを外した。
- `tools/check-json.html` を、セキュリティ用語とネットワーク用語の両方を検査する仕様に更新。

### v16 network expanded 480

- ネットワーク単元に各カテゴリ20語ずつ、合計240語を追加。
- ネットワーク単元を12カテゴリ、軽量用語480件、詳細解説480件のJSON分離構成に更新。
- `network-terms-manifest.json` と `network-details-manifest.json` の各カテゴリ件数を40件、総数を480件に更新。
- `index.html` のネットワーク進捗表示とフォールバック件数を480語へ更新。


### v18 past questions h24/h29 addition

- ユーザー添付の `pm09.pdf` を `sources/pm09-h24s-incident.pdf` として追加し、平成24年春期 午後問9「セキュリティインシデントへの対応」の問題文JSONと解説JSONを追加。
- ユーザー添付の `pm01(2).pdf` を `sources/pm01-h29s-malware.pdf` として追加し、平成29年春期 午後問1「マルウェア対策」の問題文JSONと解説JSONを追加。
- `security-past-index.json` を5問構成に更新。
- `index.html` の過去問件数フォールバック表示を5問へ更新。
- 問題文JSONの `targets` と解説JSONの `answerTargets` を対応させ、`sections` で設問別確認できるようにした。


## 2026-05-25 v19 過去問2件追加

- ユーザー提供PDF `pm09 (1).pdf` を、平成25年春期 午後問9「PCのマルウェア対策」として追加した。
- ユーザー提供PDF `pm08.pdf` を、平成25年秋期 午後問8「Webサイトのセキュリティ強化策」として追加した。
- `sources/`、`json/past-problems/`、`json/past/`、`security-past-index.json` を更新し、セキュリティ過去問を5問から7問に増やした。
- 問題文は全文OCRではなく、PDF画像・IPA公式解答例・公開解説ページを照合した学習用要約起こしとして保存した。
- 追加過去問も `sections.answerTargets` と問題文JSON側 `targets` を対応させる。

### v20 AI instruction entrypoint

- `AI最重要ルール.md` を追加し、ChatGPTへ毎回与える必須ルールを短く分離した。
- 長いREADMEを読んだと仮定せず、Project instructions または依頼冒頭へ短い必須ルールを設定する運用へ変更した。
- 作業前確認表を返させ、対象範囲を確認してから成果物生成を始める手順を追加した。

### v21 folder organization

- `README.md` はルートに残し、仕様書と作業ログを `docs/`、AI向け文書を `docs/ai/` に整理した。
- 現行サイトが参照しない過去取込スナップショットを、サイト外の `../応用_旧取込バックアップ/import-snapshots/` へ移した。
- 索引にも他ファイルにも参照されていない旧過去問解説JSON 2件を、`../応用_旧取込バックアップ/legacy-json/past/` に保管した。

### v22 selective Codex consultation

- ChatGPTは、作業範囲確認の後は指定範囲の改善案を通常どおり作成する運用にした。
- 仕様解釈、複数ファイル連携、ID・リンク・索引・実装・PDF照合に不確実性がある場合だけ `Codex確認推奨` を出すルールを追加した。
- ChatGPTの案を本番へ採用する最終判断と反映は、引き続きCodexで行う。

### v23 custom instruction alignment

- 全体のChatGPTカスタム指示に合わせ、相談・整理・説明・調査だけの依頼では作業前確認表を不要にした。
- 取り込み前提の成果物案では確認表を維持し、ChatGPTがJSONに加えてHTML/CSS、README・仕様書などの修正案も作成できることを明記した。
- ChatGPT案の最終採用、既存ファイルへの反映、検証、READMEとの整合確認はCodexが担当する境界を維持した。

### v24 html and css folder organization

- `index.html` はサイト入口としてルートに残し、単元ページとテスト・テンプレートを `html/` にまとめた。
- 共通スタイルシートを `css/style.css` に移し、ホーム・各ページ・JSON検査ツールの参照を更新した。
- `html/security.html`、`html/network.html`、`html/security-past.html` は、ルートに残るJSON・PDFを `../` 経由で読み込むよう更新した。

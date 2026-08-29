# ChatGPT依頼用プロンプト

このファイルは、ChatGPTにこのサイトの相談や成果物案の作成を依頼するときのテンプレート集です。既存サイトへ取り込む成果物案は、対象ページ・文書・カテゴリ・過去問・IDのいずれかで範囲を絞って依頼してください。Codexは、その後の取り込み、検証、README・docs/仕様書・docs/作業報告書との整合確認を担当します。

## 1. 基本方針

ChatGPTで作業する前に、`docs/ai/AI最重要ルール.md` の「Project instructions に貼り付ける本文」を対象プロジェクトの instructions 欄へ設定してください。プロジェクトを使わない場合は、本文を毎回の依頼文の冒頭へ貼ります。

ChatGPTに任せる作業:

- 構成や学習内容についての相談、整理、説明
- 解説文の下書き
- 初学者向け説明の改善
- 具体例の追加
- 試験での出方、ひっかけ、覚え方の改善
- 過去問解説の文章改善
- 指定範囲のJSON、HTML/CSS、README・仕様書、テンプレートの改善案作成
- 必要に応じた成果物案のZIP化とCodex向け引き継ぎ整理

Codexに任せる作業:

- ファイル全体の読み込み
- JSON構造の検証
- ID重複、件数ズレ、リンク切れ確認
- HTML/CSS/JS、設定、ファイル構成への最終反映
- `README.md`, `docs/仕様書.md`, `docs/作業報告書.md` の更新

ChatGPTは通常、指定範囲の成果物案を最後まで作り、途中でCodex確認を要求しません。仕様解釈、複数ファイル影響、ID・リンク・索引・HTML/CSS/JS・PDF照合などに不確実性がある場合だけ、案の末尾に `Codex確認推奨` と理由・質問・暫定案を付けます。相談や説明だけの場合は、作業前確認表やこの表示は不要です。

## 2. ChatGPTへ渡すもの

基本は、サイト一式をZIPで渡します。

```text
応用_XXXX.zip
```

ZIPで全ファイルを渡す場合でも、依頼文では必ず次を明記してください。

```text
常時適用する指示:
- docs/ai/AI最重要ルール.md の本文を Project instructions に設定済み

今回必要なら参照する資料:
- README.md の関連章
- docs/仕様書.md の関連章
- docs/ai/ChatGPT作業ルール.md の関連章

今回触ってよい範囲:
- 【例】json/details/security-details-crypto-pki.json だけ
- 【例】json/past/security-past-h27-s.json だけ
- 【例】sec-101 から sec-120 まで
```

全ファイルを渡しても、ChatGPTに既存サイト全体の置換案を一括で作らせないでください。ZIPは参照資料、`docs/ai/AI最重要ルール.md` の本文は常時守らせる指示、作業範囲指定は今回の成果物案の境界です。

## 2-1. 相談や説明だけを依頼する場合

既存サイトへ入れる成果物案をまだ作らない場合は、確認表を要求せず、次のように依頼できます。

```text
このサイトについて相談したいです。今回は成果物案の作成や既存ファイルへの反映は不要です。

相談内容:
【例: 過去問解説を今後どの順で増やすのが学習しやすいか】

必要であれば README.md の関連章だけを参照し、結論と理由を簡潔に整理してください。
```

## 2-2. HTMLや文書の改善案を依頼する場合

```text
このサイトに取り込む改善案を作成してください。まず作業前確認表を返してください。

対象ファイル:
【例: index.html / html/security.html / css/style.css / README.md / docs/仕様書.md】

目的:
【例: 初めて開いた人が学習の始め方を理解しやすくする】

禁止:
- README.md の固定ルールや既存仕様に反しない。
- `index.html` はルート、各画面HTMLは `html/`、共通CSSは `css/style.css` の配置を維持する。
- 指定した対象以外の変更を前提にしない。
- 実ファイルへの反映や検証を完了したとは書かない。

確認表が正しければ、次のメッセージで案の作成を指示します。
```

## 3. カテゴリ対応表

| カテゴリ | terms JSON | details JSON |
|---|---|---|
| セキュリティ基礎・超基礎 | `json/terms/security-terms-basic.json` | `json/details/security-details-basic.json` |
| ネットワーク基礎・DNS・通信 | `json/terms/security-terms-network-dns.json` | `json/details/security-details-network-dns.json` |
| 暗号・証明書・PKI | `json/terms/security-terms-crypto-pki.json` | `json/details/security-details-crypto-pki.json` |
| 認証・認可・ID管理 | `json/terms/security-terms-auth-id.json` | `json/details/security-details-auth-id.json` |
| Web・メール・アプリ防御 | `json/terms/security-terms-web-mail-app.json` | `json/details/security-details-web-mail-app.json` |
| 攻撃手法・マルウェア | `json/terms/security-terms-attacks-malware.json` | `json/details/security-details-attacks-malware.json` |
| 防御・監視・運用 | `json/terms/security-terms-defense-monitoring.json` | `json/details/security-details-defense-monitoring.json` |
| 管理・制度・リスク | `json/terms/security-terms-management-risk.json` | `json/details/security-details-management-risk.json` |
| クラウド・仮想化・ゼロトラスト | `json/terms/security-terms-cloud-zero-trust.json` | `json/details/security-details-cloud-zero-trust.json` |

## 4. 用語詳細改善プロンプト

以下をChatGPTに貼り付けて、対象カテゴリの `terms JSON` と `details JSON` を添付します。

```text
この応用情報技術者試験向け学習サイトの、情報セキュリティ用語解説を改善してください。

対象カテゴリ:
【ここにカテゴリ名を書く】

目的:
初学者が読んで「意味」「試験での使い方」「ひっかけ」「午後問題でどう読むか」まで理解できるようにする。

絶対に守ること:
- id は変更しない。
- term は変更しない。
- category は変更しない。
- JSON構造を壊さない。
- terms JSON は短い定義のままにする。
- details JSON の説明だけを改善する。
- 全件を一気に薄く直すより、重要語を優先して濃く直す。
- 「万能な対策」「名前だけで判断しない」などの汎用テンプレを使い回さない。
- その用語固有の目的、使う場面、限界、似た用語との違いを書く。

改善してほしいフィールド:
- beginner
- example
- examPoint
- trap
- deepDive
- commonMistakes
- afternoonUse
- howToRemember

出力形式:
- 修正後の details JSON 全体を返してください。
- 変更した内容の要約も最後に短く書いてください。
- Codex確認が必要な不確実性がある場合だけ、末尾に `Codex確認推奨` を付けてください。

品質基準:
- 中学生にも伝わる具体例がある。
- 応用情報の午前・午後でどう問われるかが分かる。
- 似た用語との違いが分かる。
- 暗記だけでなく、問題文のどこを見ればよいかが分かる。
- 説明が長いだけで中身が薄い文章にしない。
```

## 5. 用語を一部だけ改善するプロンプト

ファイルが大きい場合は、20件程度に区切って依頼します。

```text
この details JSON のうち、次のIDだけ改善してください。

対象ID:
- 【例】sec-101
- 【例】sec-102
- 【例】sec-103

守ること:
- id, term, category は変更しない。
- 対象ID以外は変更しない。
- JSONとして壊れない形で返す。
- 返答は「対象IDの修正後オブジェクト配列」だけでよい。

改善観点:
- beginner は初学者向けに具体化する。
- example は日常例または試験問題の場面にする。
- examPoint は午前・午後で問われるポイントを書く。
- trap は似た用語との混同や失点理由を書く。
- afternoonUse は午後問題で本文のどこを見るかを書く。
```

## 6. 過去問解説改善プロンプト

対象の `json/past/*.json` と `json/past-problems/*.json` を添付して使います。

```text
この応用情報技術者試験向けサイトの、セキュリティ午後過去問解説を改善してください。

対象:
【例】平成27年 春期 午後 問1

目的:
問題文を読んだ学習者が、「どこを見れば答えにたどり着くか」「なぜその答えになるか」「記述式でどう書くか」を理解できるようにする。

絶対に守ること:
- id は変更しない。
- examRound, questionNumber, title は、根拠がない限り変更しない。
- 問題文と解説を混ぜない。
- 問題文は json/past-problems/ 側、解説は json/past/ 側に分ける。
- sections の answerTargets と expectedAnswers を消さない。
- 分からない箇所は断定せず、「要原本確認」と明記する。

改善してほしい点:
- answerGuide を設問ごとに分かりやすくする。
- why に「なぜその答えか」を書く。
- howToRead に「本文のどこを見るか」を書く。
- trap に「間違えやすい選択肢・記述」を書く。
- fullWalkthrough を、問題全体の読み方として整理する。
- reviewChecklist を、解いた後に確認しやすい形にする。

出力形式:
- 修正後の json/past 側JSON全体を返してください。
- 必要なら json/past-problems 側で直すべき箇所も別に指摘してください。
- PDF照合や索引変更などCodexの判断が必要な場合は、末尾に `Codex確認推奨` と理由を付けてください。
```

## 7. ChatGPTから戻ってきた後にCodexへ頼む文

JSON改善案をCodexへ戻すときは、以下のように依頼します。

```text
ChatGPTが作ったこのJSON改善案を取り込んでください。

やってほしいこと:
- 対象ファイルに反映する。
- JSONとして壊れていないか確認する。
- id, term, category が勝手に変わっていないか確認する。
- 件数が変わっていないか確認する。
- 必要なら README.md と docs/仕様書.md を更新する。
- docs/作業報告書.md に今回の作業内容を追記する。
- 残課題があれば報告する。
```

HTML、CSS、README、仕様書などの改善案をCodexへ戻すときは、以下のように依頼します。

```text
ChatGPTが作った成果物案です。既存サイトへ反映できるか確認してください。

やってほしいこと:
- README.md、docs/仕様書.md、今回の目的と矛盾しないか確認する。
- 採用できる変更だけ既存ファイルへ反映する。
- HTML/CSS案の場合は、既存リンクや表示、データ読み込みへの影響を確認する。
- 文書案の場合は、既存ルールの重複や矛盾が増えないか確認する。
- 必要なら docs/作業報告書.md に判断内容を追記する。

ChatGPT案はそのまま入れる前提ではなく、整合する部分だけ採用してください。
```

## 8. 依頼時の注意

- ZIPで全ファイルを渡してよい。
- 既存サイトへ取り込む成果物案では、1回の作業範囲を対象ページ、文書、1カテゴリ、1過去問、またはID指定の一部に絞る。
- 最初に `docs/ai/AI最重要ルール.md` の本文を Project instructions または依頼冒頭へ設定する。取り込み前提の成果物案を作る場合だけ、作業前確認表を返させる。
- `README.md`, `docs/仕様書.md`, `docs/作業報告書.md` は、今回の作業に必要な部分だけ参照させる。
- JSON全体が長すぎる場合は、IDを20件程度に分ける。
- ChatGPTが返したJSONは、そのまま信用せずCodexで検証する。
- 重要な過去問の答案や年度は、PDFや公式情報と照合する。
- ChatGPTは通常は改善案を作成し、採用判断へ影響する不確実性がある場合だけ `Codex確認推奨` を付ける。

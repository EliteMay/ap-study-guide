# ChatGPT依頼用プロンプト

このファイルは、GitHubリポジトリ `EliteMay/ap-study-notes` をChatGPTで直接確認・修正するときの依頼例です。GitHubへ接続できる場合は、ZIPを毎回渡す必要はありません。

## 1. 通常の修正依頼

```text
GitHubの EliteMay/ap-study-notes を確認して修正してください。

目的:
【例: データベース用語ページの検索を使いやすくする】

主な対象:
【例: html/database.html / database-terms-manifest.json】

守ること:
- README.md を最上位仕様として確認する
- docs/仕様書.md と docs/作業報告書.md の関連箇所も確認する
- 既存ID、localStorageキー、JSON分割方針を勝手に変更しない
- 必要な関連ファイルと文書も整合させる
- 確認できない実ブラウザ動作は確認済みと書かない
```

## 2. 相談だけする場合

```text
EliteMay/ap-study-notes について相談したいです。今回はまだGitHubのファイル変更は不要です。

相談内容:
【ここに内容を書く】

必要なREADME・仕様書だけ確認して、2〜3案とおすすめを教えてください。
```

## 3. 用語詳細を改善する場合

```text
GitHubの EliteMay/ap-study-notes を確認して、次の用語解説を改善してください。

対象カテゴリ:
【カテゴリ名】

対象ファイル:
【json/details/...】

対象ID:
【必要ならID範囲】

目的:
初学者が「意味」「具体例」「試験での出方」「ひっかけ」「午後問題でどう使うか」を理解できるようにする。

守ること:
- id, term, category は変更しない
- 対象外IDは内容変更しない
- JSON構造を維持する
- 汎用テンプレ文を使い回さない
- 修正後にJSON構文と関連マニフェストを確認する
- docs/作業報告書.md を更新する
```

## 4. 過去問解説を改善する場合

```text
GitHubの EliteMay/ap-study-notes を確認して、次の過去問解説を改善してください。

対象:
【例: 平成27年 春期 午後 問1】

主な解説JSON:
【json/past/...】

目的:
どこを見れば答えにたどり着くか、なぜその答えになるか、記述式でどう書くかが分かるようにする。

守ること:
- 問題文は json/past-problems/、解説は json/past/ に分ける
- インデックス側は problemFile、解説側は sourceProblemFile を使う
- answerTargets と expectedAnswers を消さない
- PDF原本や問題文JSONを未確認なら断定しない
- 必要なら security-past-index.json との整合も確認する
- docs/作業報告書.md を更新する
```

## 5. 新しい単元を追加する場合

```text
GitHubの EliteMay/ap-study-notes に新しい単元を追加したいです。

単元:
【例: アルゴリズム】

まず要件定義として、目的、必要機能、画面構成、JSON構成、保存方法、崩してはいけない仕様、完成条件を整理してください。
重要な曖昧さがなければ、そのままGitHubへ実装してください。

守ること:
- index.html はルートに維持
- 単元ページは html/
- 共通CSSは css/style.css
- 大量データはJSON分離
- localStorageを使う場合はキーをREADME/仕様書に記録
- README、仕様書、作業報告書も更新
- GitHub Pagesで動く静的構成を優先
```

## 6. 不具合修正

```text
GitHubの EliteMay/ap-study-notes で次の不具合を直してください。

症状:
【ここに症状】

再現条件:
【分かる範囲で書く】

やってほしいこと:
- README・仕様書・作業報告書を確認
- 原因を対象コードから特定
- 関連機能を壊さない最小限の修正
- 構文、JSON、参照パスを確認
- 実ブラウザでしか確認できない部分は未確認として明記
- 作業報告書を更新
```

## 7. GitHub Pages確認

```text
EliteMay/ap-study-notes のGitHub Pages対応を確認してください。

確認項目:
- index.html がルートにある
- .nojekyll がある
- HTML/CSS/JS/JSON/PDFの相対パス
- fetch() の参照先
- ルート絶対パスを使っていないか
- GitHub Pages URLで致命的に壊れる箇所がないか

必要な修正があればGitHubへ直接反映し、README・仕様書・作業報告書も更新してください。
```

## 8. Codexへ渡す場合

GitHub上の静的確認だけで十分でない場合だけ使います。

```text
EliteMay/ap-study-notes の現在のGitHub内容を基準に、次を実行確認してください。

確認したいこと:
【例: 実ブラウザで検索・カテゴリ絞り込み・進捗保存が正常か】

README.md と docs/仕様書.md を守り、問題があれば原因と変更ファイルを報告してください。
GitHub側へ修正が必要な場合は、関連文書の更新も含めてください。
```

## 9. ZIPが必要な場合

ZIPを使うのは、バックアップ、GitHubを使わない新規成果物、または明示的にZIPが欲しい場合です。

```text
現在の EliteMay/ap-study-notes を基準にバックアップZIPを作ってください。
ZIP名は apstudy_vXX.zip のように短くしてください。
```

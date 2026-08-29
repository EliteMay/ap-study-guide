# AI最重要ルール

このファイルは、ChatGPTなどのAIが `EliteMay/ap-study-notes` を安全に改修するための短い必須ルールです。
詳細仕様は `README.md`、補助仕様は `docs/仕様書.md`、作業履歴は `docs/作業報告書.md` を参照します。

## 現在の運用

- 正本は GitHub リポジトリ `EliteMay/ap-study-notes`。
- GitHubへ接続できるChatGPTは、ユーザーから変更指示があれば既存ファイルを直接確認・編集してよい。
- ZIPで成果物案を作り、Codexが必ず最終反映する旧運用は必須ではない。
- Codexは、実ブラウザ確認、複雑な実行テスト、OS依存作業など、ChatGPTのGitHub編集だけでは確認しにくい場合に使う。

## 作業前に必ず確認するもの

既存ファイルを変更する場合は、必要な範囲で次を確認する。

1. `README.md`
2. `docs/仕様書.md`
3. `docs/作業報告書.md`
4. 今回の対象ファイル
5. 関連するマニフェスト・JSON・HTML・CSS・索引

相談、説明、調査だけなら、関係のないファイルまで読む必要はない。

## 必須ルール

1. 今回のユーザー指示を最優先し、READMEと重要な衝突がある場合だけ勝手に解消せず示す。
2. `README.md` を最上位仕様、`docs/仕様書.md` を補助仕様とする。
3. ホーム入口はルートの `index.html`、各画面は `html/`、共通CSSは `css/style.css` の構成を維持する。
4. 用語JSON・詳細JSONの `id`, `term`, `category` は根拠なく変更しない。
5. 過去問JSONや索引の `id`, `examRound`, `questionNumber`, `title`, `file`, `problemFile`, `sourcePdf`, `sourceProblemFile`, `answerTargets`, `expectedAnswers` は根拠なく変更しない。
6. 用語の短いデータは `json/terms/`、長い解説は `json/details/` に置く。
7. 過去問の問題文は `json/past-problems/`、解説は `json/past/`、PDF原本は `sources/` に分ける。
8. 過去問は `sections` で設問単位にし、`answerTargets` と `expectedAnswers` を省略しない。
9. `localStorage` キーを無断で変えない。進捗消失につながる。
10. 「万能な対策」「名前だけで判断しない」などの使い回し文や二重句点を出さない。
11. 実行していない検査やブラウザ確認を「確認済み」と書かない。
12. 修正したら `docs/作業報告書.md` を更新し、必要ならREADME・仕様書も同時に更新する。

## GitHubで直接変更するとき

- 変更前に対象ファイルの最新内容をGitHubから読む。
- 既存の複数ファイルを勝手に削除しない。
- 変更が複数ファイルへ波及する場合は関連ファイルも確認する。
- ユーザーから指示された範囲で安全に進められるなら、毎回確認待ちで止めずに作業を完了する。
- 結果が大きく変わる重要な曖昧さだけ確認する。
- ZIPはバックアップ、GitHubを使わない成果物、またはユーザーが要求した場合だけ作る。

## 過去問を扱う場合

- インデックス側で問題文JSONを指すフィールドは `problemFile`。
- 解説JSON側で問題文JSONを指すフィールドは `sourceProblemFile`。
- PDF原本や問題文JSONを見なければ断定できない内容は、推測で確定しない。

## 完了前チェック

- JSONを変更した: JSON構文、ID、件数、マニフェスト、関連参照を確認する。
- HTML/CSS/JSを変更した: パス、主要リンク、JavaScript構文、GitHub Pagesでの相対パスを確認する。
- 過去問を変更した: `targets` と `answerTargets`、`expectedAnswers`、PDF・問題文JSON参照を確認する。
- 文書を変更した: README、仕様書、作業報告書の間で新しい矛盾を作っていないか確認する。
- 実ブラウザ確認ができていない場合は、そのことを作業報告書と回答に明記する。

## Codexを使う判断

Codexを使うこと自体を前提にしない。次のような場合だけ補助として検討する。

- 実際のアプリ起動・ブラウザ操作を伴う再現確認が必要
- 複雑な複数ファイル変更の自動テストが必要
- Electron、Setup.exe、OS依存処理がある
- GitHub上の静的確認だけでは重大な不具合の有無を判断できない

その場合も、ChatGPTで可能な調査・修正・文書更新を先に行い、確認できなかった項目だけを明確に残す。

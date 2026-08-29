# AP Study Notes tests

このフォルダは、サイト本体とは分けて壊れやすいデータ構造を検査するためのブラウザテスト置き場です。

ASMRTubeの `tests/` 構成を参考にしています。

## data-integrity.test.html

GitHub PagesまたはLive Server経由で開くと自動実行します。

検査対象:

- 情報セキュリティ terms / details
- ネットワーク terms / details
- データベース terms / details
- 各manifestの件数と実JSON件数
- 用語ID重複
- 用語名重複
- termとdetailのID対応
- term / categoryの一致
- セキュリティ過去問の解説JSONと問題文JSON
- `sections[].answerTargets` と `problem.questions[].targets` の設問単位一致
- 解説済み設問の答案情報

## 利用URL

GitHub Pages公開後は次の形で開けます。

`https://<user>.github.io/<repo>/tests/data-integrity.test.html`

## 注意

このHTMLはデータ整合性を検査するもので、実際のUIクリック操作や全ブラウザ互換性まで保証するものではありません。

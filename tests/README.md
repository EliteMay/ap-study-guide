# AP Study Notes tests

品質確認をサイト本体から分離して管理するフォルダです。

## `data-integrity.test.html`

GitHub PagesまたはLive Serverで開くブラウザ検査。

現行6教材のterms/details/過去問データを中心に確認します。

## `validate.mjs`

GitHub ActionsとローカルNode用のCI検証。

実行:

```bash
node tests/validate.mjs
```

検査対象:

- 全JSON構文
- 既存6教材のterms manifest / JSON件数
- 用語ID重複
- 必須フィールド
- manifest category対応
- 情報セキュリティ / ネットワーク / DBのterms/details対応
- セキュリティ過去問の問題文 / 解説 / targets
- 主要HTMLの相対href/src
- `json/curriculum/ap-2026-map.json`
- IPA大分類9件
- IPA中分類23件
- 学習ユニット13件
- 中分類1〜23が13ユニットへ重複なく全て割り当てられていること

`.github/workflows/validate.yml` ではさらに全 `js/*.js` へ `node --check` を実行します。

古いJSONに存在するUTF-8 BOMは検証時に正規化してからJSON.parseします。

## 注意

この検証はデータ・構文・内部参照を確認するもので、実機ブラウザでの全クリックや見た目を完全保証するものではありません。

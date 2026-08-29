# AP Study Notes tests

品質確認をサイト本体から分離して管理するフォルダです。

## `data-integrity.test.html`

GitHub PagesまたはLive Serverで開くブラウザ検査。

対象:

- 6分野のterms manifest / JSON件数
- 用語ID重複
- 必須フィールド
- manifest category対応
- 情報セキュリティ / ネットワーク / DBのterms/details対応
- アルゴリズム / システム開発 / プロジェクト管理の共通生成詳細方式
- 主要HTML / JS / CSSの取得
- セキュリティ過去問の問題文 / 解説 / targets / 答案情報

## `validate.mjs`

GitHub ActionsとローカルNode用のCI検証。

実行:

```bash
node tests/validate.mjs
```

`.github/workflows/validate.yml` ではさらに全 `js/*.js` へ `node --check` を実行します。

古いJSONに存在するUTF-8 BOMは検証時に正規化してからJSON.parseします。

## 完成時確認

2026-08-29 v1.0で `Validate AP Study Notes` run #2 が成功することを確認済みです。

このテストはデータ・構文・内部参照を確認するもので、実機ブラウザでの全クリックや見た目を完全保証するものではありません。

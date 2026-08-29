# AP Study Notes tests

品質確認をサイト本体から分離して管理するフォルダです。

## `data-integrity.test.html`

GitHub PagesまたはLive Serverで開くブラウザ検査。

旧6教材のterms/details/過去問データを中心に確認します。

## `validate.mjs`

GitHub ActionsとローカルNode用の共通CI検証。

実行:

```bash
node tests/validate.mjs
```

主な検査:

- 全JSON構文
- 既存6教材のmanifest / JSON件数
- 用語ID重複・必須フィールド・category
- Security / Network / Databaseのterms/details対応
- セキュリティ過去問の問題文 / 解説 / targets
- 主要HTMLの相対href/src
- IPA大分類9 / 中分類23 / 学習ユニット13
- Lesson indexのID / order / unit / 中分類
- 個別Lesson JSON存在
- objectives / sections / checks / next
- renderer対応section type
- diagram構造
- 旧Algorithm 65語が65/65ちょうど1回ずつLessonへ割り当てられていること

## `validate-audits.mjs`

System 75語とManagement 72語の監査・実Lesson移行専用検証。

実行:

```bash
node tests/validate-audits.mjs
```

検査:

- System 75/75 decision
- Management 72/72 decision
- 監査ID重複なし
- action値とsummary件数
- officialMiddleCode存在
- move-primary-unit先の13学習ユニット存在
- 非move項目の監査target Lessonが実装済みであること
- 全Lessonの`meta.legacyTermIds[]`を集計
- System 75/75の未割当・重複割当禁止
- Management 72/72の未割当・重複割当禁止
- 非move項目は監査指定Lesson IDと一致
- move項目は監査指定unitIdと一致
- 割当LessonのofficialMiddleCodesが監査中分類を含むこと

成功時は、System 75語 + Management 72語の **147/147が監査結果どおり実Lessonへ一意に着地している** と判断できます。

## GitHub Actions

`.github/workflows/validate.yml` では次を実行します。

1. 全`js/*.js`へ`node --check`
2. `node tests/validate.mjs`
3. `node tests/validate-audits.mjs`

古いJSONに存在するUTF-8 BOMは検証時に正規化してからJSON.parseします。

## 注意

これらはデータ・構文・内部参照の検証です。

実ブラウザでの以下は別途確認が必要です。

- PC/スマホレイアウト
- 全ボタンクリック
- ダークモード
- 表/図の横スクロール
- 実際の学習導線の使いやすさ

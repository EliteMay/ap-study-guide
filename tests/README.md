# AP Study Notes tests

品質確認をサイト本体から分離して管理するフォルダです。

## `data-integrity.test.html`

GitHub PagesまたはLive Serverで開くブラウザ検査。

旧6教材のterms/details/過去問データを中心に確認します。

## `validate.mjs`

GitHub ActionsとローカルNode用の基本CI検証。

```bash
node tests/validate.mjs
```

主な検査:

- 全JSON構文
- 旧6教材のmanifest / JSON件数
- 用語ID重複
- 必須フィールド / category
- Security / Network / Databaseのterms/details対応
- セキュリティ過去問の問題文 / 解説 / targets
- 主要HTMLの相対href/src
- IPA大分類9件
- IPA中分類23件
- 学習ユニット13件
- 23中分類の重複なし全割当
- Lesson ID / order / unit / middle code
- section type / diagram / checks / next
- Algorithm 65/65 Lesson完全割当

GitHub Actionsでは全 `js/*.js` へ `node --check` も実行します。

## `validate-audits.mjs`

監査結果と実際のLesson移行を突き合わせる厳格チェック。

```bash
node tests/validate-audits.mjs
```

現在の対象:

### System

- 75/75を監査
- 75/75を実Lessonへちょうど1回割当
- auditのtarget lesson/unitと実装を一致させる

### Management

- 72/72を監査
- 72/72を実Lessonへちょうど1回割当
- Agile/Scrum・ITSMの移動先unitも検証

### Database

- 229/229を監査
- `assignmentGroups[]` のcore / supporting / mergeを集計
- 229 IDを監査上ちょうど1回割当
- 229 IDを実Lessonへちょうど1回割当
- audit指定のDB-01〜14と実装Lessonを一致させる
- `unitId=database`
- IPA中分類9
- 未割当 / 重複 / extra ID禁止
- summary件数一致

Databaseの初回厳格チェックでは `term-db-018` のLessonメタデータ登録漏れを実際に検出し、DB-02へ修正済みです。

## 注意

この検証はデータ・構文・内部参照を確認するもので、実機ブラウザでの全クリックや見た目を完全保証するものではありません。

公開PagesのPC/スマホ表示、ダークモード、表の横スクロール、全確認問題クリックは別途E2E確認が必要です。

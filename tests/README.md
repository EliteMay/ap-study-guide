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
- IPA大分類9件 / 中分類23件 / 学習ユニット13件
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
- 229 IDを監査上・実Lesson上ともにちょうど1回割当
- DB-01〜14 / unit `database` / IPA中分類9を検証
- 未割当 / 重複 / extra ID禁止

Database初回厳格チェックでは `term-db-018` のLessonメタデータ登録漏れを実際に検出し、DB-02へ修正済みです。

### Network

- **480/480を監査**
- 監査の `ranges[]` / `ids[]` を実IDへ展開
- Lesson metaの `legacyTermIds[]` と `legacyTermRanges[]` を統合して展開
- 480 IDを監査上・実Lesson上ともにちょうど1回割当
- 478語がNET-01〜14 / unit `network` / IPA中分類10であることを検証
- SLAとインシデント管理の2語がSVC-01 / unit `service-audit` / IPA中分類15へ移動していることを検証
- `mappedToNetworkLessons=478`
- `movedPrimaryUnit=2`
- `networkLessons=14`
- 未割当 / 重複 / extra ID禁止

`legacyTermRanges` 例:

```json
{
  "prefix": "net-dns-",
  "from": 1,
  "to": 40
}
```

CI内で `net-dns-001`〜`net-dns-040` へ展開します。

## 注意

この検証はデータ・構文・内部参照を確認するもので、実機ブラウザでの全クリックや見た目を完全保証するものではありません。

公開PagesのPC/スマホ表示、ダークモード、表の横スクロール、全確認問題クリックは別途E2E確認が必要です。

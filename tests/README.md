# AP Study Notes tests

品質確認をサイト本体から分離して管理するフォルダです。

## `validate.mjs`

基本CI検証。

```bash
node tests/validate.mjs
```

主な検査:

- 全JSON構文
- 旧6教材のmanifest / JSON件数
- 用語ID重複 / 必須field / category
- Security / Network / Databaseのterms/details対応
- セキュリティ過去問の問題文 / 解説 / targets
- 主要HTMLの相対href/src
- IPA大分類9 / 中分類23 / 学習ユニット13
- 23中分類の重複なし全割当
- Lesson ID / order / unit / middle code
- section type / diagram / checks / next
- Algorithm 65/65 Lesson完全割当

GitHub Actionsでは全 `js/*.js` に `node --check` も実行します。

## `validate-audits.mjs`

既存domain監査と実Lesson移行を突き合わせる厳格チェック。

```bash
node tests/validate-audits.mjs
```

対象:

- System 75/75
- Management 72/72
- Database 229/229
- Network 480/480

Networkでは `legacyTermRanges` を展開し、478語→NET-01〜14、2語→SVC-01の移行を検証します。

## `validate-security-audit.mjs`

Security 501語専用のcross-domain監査Validator。

```bash
node tests/validate-security-audit.mjs
```

検査:

- Security sourceが501件
- IDが正確に `sec-001`〜`sec-501`
- duplicate / missing / extra ID禁止
- `security-audit.json` のassignmentが501件をちょうど一度ずつカバー
- destination Lessonが実装済み
- destination `unitId` / IPA中分類がauditと一致
- Security主所属369語がSEC-01〜12のLesson metaと完全一致
- SEC Lesson間のlegacy ID重複禁止
- cross-domain 132語の再配置
- summary件数一致

期待集計:

| 移行先 | 語数 |
|---|---:|
| Security | 369 |
| Network | 104 |
| Computer Systems | 13 |
| Law / Standards | 10 |
| System Development | 2 |
| Service / Audit | 3 |
| 合計 | 501 |

Securityから他分野へ移動したIDは `security-audit.json` を中央の移行表として扱います。既存の成熟したNET/SYS/SVC LessonへSecurity IDを大量追記しません。

## `data-integrity.test.html`

GitHub PagesまたはLive Serverで開くブラウザ検査。

旧6教材のterms/details/過去問データを中心に確認します。

## GitHub Actions

`.github/workflows/validate.yml`

実行順:

1. JavaScript syntax
2. `validate.mjs`
3. `validate-audits.mjs`
4. `validate-security-audit.mjs`

## 注意

CIはデータ・構文・内部参照を確認するもので、実ブラウザの見た目や全クリックを完全保証しません。

別途E2E確認が必要:

- PC / mobile
- dark mode
- 表/図のhorizontal scroll
- 全Lesson check button
- Security Hub / Network Hub / Database Hub

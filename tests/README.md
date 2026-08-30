# AP Study Notes tests

品質確認をサイト本体から分離して管理するフォルダです。

CIは構文・Data・内部参照を保証します。実Browserの見た目や全Clickを完全保証するものではありません。

## `validate.mjs`

基本Data / 既存機能検証。

```bash
node tests/validate.mjs
```

主な検査:

- 全JSON構文
- 旧6教材manifest / JSON件数
- 用語ID / category / required fields
- Security / Network / Database terms-details対応
- Security過去問target
- 主要HTML参照
- IPA大分類9 / 中分類23 / 学習Unit13
- Base Lessonのsection / diagram / checks / next
- Algorithm 65/65割当

## `validate-audits.mjs`

旧教材監査と実Lesson移行の厳格検証。

```bash
node tests/validate-audits.mjs
```

対象:

- System 75/75
- Management 72/72
- Database 229/229
- Network 480/480

`legacyTermRanges` も展開し、未割当 / 重複 / extra IDを検出する。

## `validate-security-audit.mjs`

Security 501語のcross-domain再分類専用。

```bash
node tests/validate-security-audit.mjs
```

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

検査:

- sec-001〜501
- duplicate / missing / extra禁止
- Security 369語とSEC Lesson meta一致
- Cross-domain移動先Lesson実在
- unitId / IPA中分類一致

## `validate-computer-systems.mjs`

CMP-01〜12専用。

```bash
node tests/validate-computer-systems.mjs
```

検査:

- CMP-01〜12が実在
- JSON / index / meta / unit一致
- objectives / sections / checks
- 中分類3 / 4 / 5 / 6 Coverage
- `html/computer.html` から全LessonへLink

## `validate-curriculum-expansion.mjs`

118Lessonと23中分類Coverageを検証。

```bash
node tests/validate-curriculum-expansion.mjs
```

期待:

- Base index: **87**
- Expansion index: **31**
- Total: **118**

検査:

- ID重複なし
- order重複なし
- Expansion Lesson JSON実在
- index / meta / unit / middle code整合
- Expansion各Lessonの最低教材密度
- RuntimeがBase + Expansionを読む
- 13学習Unitに有効Hubあり
- **IPA中分類1〜23すべてに構造化Lessonあり**

## `validate-practice.mjs`

オリジナル総合演習専用。

```bash
node tests/validate-practice.mjs
```

現在の期待:

- **37問**
- **13 / 13学習Unit Coverage**
- **23 / 23 IPA中分類Coverage**

検査:

- `meta.questionCount` と実数一致
- Question ID重複なし
- valid unitId / middleCodes
- difficulty 2/3/4
- Choice: 4択以上 / answerIndex / explanation
- Written: modelAnswer / 採点観点2件以上
- `lessonRefs[]` が実Lessonを参照
- Practice HTMLがCSS / JS / status filterを持つ
- canonical Shellに総合演習が存在
- BUILD r10
- Practice localStorage / Filter / Lesson link / Next control

今後、Lesson→`question=` direct linkとHome Practice progressもこのValidatorへ追加して固定する。

## `data-integrity.test.html`

GitHub PagesまたはLive Serverで開くBrowser検査。

旧6教材のterms/details/過去問Dataを中心に確認する。

## GitHub Actions

`.github/workflows/validate.yml`

現在の実行順:

1. JavaScript syntax
2. `validate.mjs`
3. `validate-audits.mjs`
4. `validate-security-audit.mjs`
5. `validate-computer-systems.mjs`
6. `validate-curriculum-expansion.mjs`
7. `validate-practice.mjs`

## E2Eとして別途必要な確認

- PC / Mobile
- Dark Mode
- 118Lesson全表示
- 全Lesson check button
- Table / Diagram horizontal scroll
- 13Unit Hub
- Practice 37問全操作
- Practice written self-grade
- Lesson ↔ Practice direct link
- GitHub Pages上のcanonical Navigation

未確認項目をCI successだけで「確認済み」としない。

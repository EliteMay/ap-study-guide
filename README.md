# AP Study Guide

応用情報技術者試験（AP）を、**仕組みを理解する → 問題で取り出す → 弱点を復習する → 公開公式問題へ接続する**流れで学ぶ静的Webアプリです。

- Repository: `EliteMay/ap-study-guide`
- Public: `https://elitemay.github.io/ap-study-guide/`
- 正式要件: `REQUIREMENTS.md`
- 制作Guide: `EliteMay/web-project-guide` 1.17.1
- Build / Project Profile正本: `json/project-meta.json`
- Project Memory: `PROJECT_LEARNINGS.md`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 技術: HTML / CSS / JavaScript / JSON
- Deployment: GitHub Pages

## Project Profile

`STATIC + DATA + LEARNING + TOOL + PUBLIC-CONTENT`

教材の分かりやすさ、学習導線、Data参照整合、保存互換、GitHub Pages相対Path、公開情報の扱いを重点確認します。

## 現在の開発Phase

`REQUIREMENTS.md` を正本とし、現在は **Phase 1（進行中）** です。

1. **Phase 1** — 教材品質、Lesson / Unit再編、学習導線、関連問題、図解、横断検索、必要なUI改善
2. **Phase 2** — 5段階理解状態、適応型復習、弱点分析、診断テスト
3. **Phase 3** — 効果の高いLessonへのインタラクティブ教材・実践Tool

### Phase 1 Pilot

現在Phase 1 Contractへ引き上げ済みの分野:

| Unit | Lesson | 主な状態 |
|---|---:|---|
| 基礎理論 | FND-01〜07 | 重要度 / 頻出度 / Learning Map / Inline Check |
| アルゴリズム・プログラミング | ALG-01〜11 / PROG-01〜04 | Companion Data + Lazy Overlay |
| コンピュータシステム | CMP-01〜12 | 中分類3〜6再監査 / 12/12 Direct Practice |
| UI・情報メディア | UIM-01〜04 / MED-01〜04 | 中分類7〜8再監査 / 8/8 Direct Practice |
| データベース | DB-01〜14 | 中分類9再監査 / 14/14 Direct Practice |

Database r30では既存 `DB-01〜DB-14` の本文・ID・URL・Storageを維持し、`json/phase1/database-r30.json` からPhase 1補助Contractを遅延Overlayします。旧 `database-audit.json` で不足扱いだった関係代数、SQL論理評価順、正規化、分離レベル、UNDO/REDO、索引、2相コミット、OLAP操作の8学習目標は、現在のDB Lesson本文へ反映済みであることを `database-phase1-r30.json` で再監査しています。

2025公開午後問6への直接Mappingは次の5 Lessonです。

- DB-02
- DB-03
- DB-04
- DB-05
- DB-06

存在しないMappingは作りません。

**各Pilotは完成扱いではありません。** Foundation / Algorithm / Computer Systems / UI・情報メディア / Databaseはいずれも公開公式問題Mapping、科目A型演習Variation、補助範囲またはCross-unit責務ReviewなどのBlockerが残るため `pilot / in-progress` を維持します。Phase 1全体も未完了です。

## 学習の基本導線

**Home → Lessonで理解 → 途中確認 → 末尾確認 → 関連短問 → Case / Mock → 公開公式問題 → 弱点復習**

分からない内容は `html/search.html` の横断検索からLesson・用語・短問・Unit・公開公式問題へ戻れます。

## 主なページ

| 用途 | Page |
|---|---|
| Home | `index.html` |
| 学習分野 | `html/roadmap.html` |
| Unit Hub | `html/unit.html?unit=<UNIT_ID>` |
| Lesson | `html/lesson.html?id=<LESSON_ID>` |
| 横断検索 | `html/search.html?q=<QUERY>` |
| 単語辞書 | `html/glossary.html` |
| 短問 | `html/practice.html` |
| 長文Case | `html/cases.html` |
| 模試 | `html/mock.html` |
| 公開公式問題 | `html/official-past.html` |
| 学習進捗 | `html/progress.html` |
| Backup / Restore | `html/data.html` |
| Development Diagnostics | `html/diagnostics.html` |

## 現在の教材Snapshot

件数のRuntime正本は各Manifest / Indexです。次は固定仕様ではなく現在状態のSnapshotです。

| 項目 | 現在状態 |
|---|---:|
| IPA大分類 | 9 |
| IPA中分類 | 23 |
| 学習ユニット | 13 |
| 構造化Lesson | 120 |
| 短問 | 141 |
| Lesson→短問直接Coverage | 120 / 120 |
| 長文Case | 16 / 48設問 |
| 旧用語資産 | 1,422語 |
| 2025春・秋 公開午後問題Mapping | 22大問 |

`13 Unit / 120 Lesson` は要件上固定ではありません。Lesson / Unitをmerge・split・追加・移動する場合は、旧ID・URL・学習進捗・Practice / Case / Mock / Official mappingを確認し、Migrationなしで既存Dataを破壊しません。

## Dataの正本

### Project metadata

`json/project-meta.json`

- Product名
- Build
- 採用Guide Version
- Project Profile
- Active Phase
- Deployment
- Backup Schema Version
- Diagnostics Contract

### Lesson / Phase 1

- Base Index: `json/lessons/lesson-index.json`
- Expansion Index: `json/lessons/lesson-index-expansion.json`
- Loader: `js/lesson-data.js`
- Phase 1 Manifest: `json/phase1/index.json`
- Phase 1 Runtime: `js/lesson-phase1.js`

Companion Data:

- Algorithm / Programming: `json/phase1/algorithm-programming-r27.json`
- Computer Systems: `json/phase1/computer-systems-r28.json`
- UI・情報メディア: `json/phase1/ui-media-r29.json`
- Database: `json/phase1/database-r30.json`

Foundationは各Lesson JSONへPhase 1 Metadataを保持します。それ以外の既存本文が成熟しているPilotでは、同じMetadataを本文へ大量複製せず必要Unitだけ遅延Overlayします。

### Practice

- Manifest: `json/practice/practice-index.json`
- Loader: `js/practice-data.js`

全120 Lessonに少なくとも1つの直接Practiceがあります。Database r30では新規問題を増やさず、既存Practiceで14/14 Direct Coverageを維持しています。

### Case / Mock / Official

- Case: `json/cases/case-index.json`
- Mock: `json/mock/mock-config.json`
- 公開公式問題: `json/past/ap-public-exams.json`

2026年度CBTの非公開実問題を公開問題として扱いません。

### Migration

- Foundation: `json/migrations/lesson-phase1-r26.json`
- Algorithm / Programming: `json/migrations/lesson-phase1-algorithm-r27.json`
- Computer Systems: `json/migrations/lesson-phase1-computer-systems-r28.json`
- UI・情報メディア: `json/migrations/lesson-phase1-ui-media-r29.json`
- Database: `json/migrations/lesson-phase1-database-r30.json`

Database `DB-01〜14` はすべてIdentity Migrationです。Lesson ID、Unit ID、`lesson.html?id=<ID>`、既存学習Storage Keyを変更していません。

## 学習状態 / 保存互換

現行判定の正本は `js/study-state.js` です。

- Lesson: 全確認問題回答 + 75%以上で理解確認
- 理解確認後: 現行Runtimeでは14日後に再確認対象
- 4択短問: 最近の結果を重視
- 記述短問: 最低文字数を満たしてから模範解答確認
- 長文Case: 回答後に自己採点
- 個人学習履歴: Browser `localStorage`
- Backup / Restore: `html/data.html`

Guide 1.17.1のReset/Delete lifecycle Ruleは確認済みですが、r30ではStorage削除処理自体を変更していません。

Phase 2の5段階理解状態・適応型復習は、Phase 1完了前に現行保存Contractを破壊して先行実装しません。

## 崩してはいけない仕様

- `REQUIREMENTS.md` を正式要件のSource of Truthとする。
- 既存Lesson / Term / Question IDを不用意に変更・再利用・削除しない。
- 既存localStorage Keyを変更する場合はMigrationを用意する。
- Product名変更だけを理由にStorage Keyを変更しない。
- Lesson / Practice / Case / MockのRuntime正本を分岐させない。
- GitHub Pagesのサブパスで壊れない相対Pathを維持する。
- Import前Validationを外さない。
- Backup / Restoreで元Dataを先に破壊しない。
- 公式問題と独自問題を混同しない。
- 2026 CBT非公開実問題を公開問題として扱わない。
- Snapshot件数を試験対策の完全性と表現しない。
- 未完成のPhase 1分野を完成扱いしない。

## Validation

Workflow: `.github/workflows/validate.yml`

主な確認:

- JavaScript Syntax
- JSON / Manifest / ID / Reference
- Curriculum / Audit
- Lesson→Practice直接Coverage
- Case / Mock / Official Mapping
- Runtime architecture
- Search wiring
- Project Metadata / LEARNING Profile / Guide 1.17.1
- Foundation / Algorithm / Computer Systems / UI・情報メディア / Database Phase 1 Contract
- Migration / Backup compatibility
- Playwright Product Smoke
- Unit別Phase 1 Browser Smoke
- Desktop / Mobile Visual Review

Database専用:

- `tests/validate-phase1-database.mjs`
- `tests/e2e-phase1-database.mjs`
- `json/curriculum/audits/database-phase1-r30.json`

Static Testでは14 LessonのIdentity、学習順、中分類9、14/14 Practice、5/14 Official、2 Inline Checks、旧Audit8項目の解消、Migration、Pilot Blockerを確認します。Browser TestではDB-03 / DB-05 / DB-09 / DB-14、Cross Search、Unit Hub順序・番号、320px Overflowを確認します。

## Documentation

- 正式要件: `REQUIREMENTS.md`
- 現行概要: `README.md`
- 現行仕様: `docs/仕様書.md`
- 作業履歴: `docs/作業報告書.md`
- 長期Project Memory: `PROJECT_LEARNINGS.md`
- Test説明: `tests/README.md`

## 完成の考え方

「コードを書いた」「Commitした」「Static CIが通った」だけでは完成扱いにしません。

分野単位で教材・問題・検索・Migration・PC / Smartphone表示・Validationを揃え、最終CommitでCI / Visual / GitHub Pagesを確認します。Phase全体の完成条件は `REQUIREMENTS.md` と最新版 `web-project-guide` をSource of Truthとします。

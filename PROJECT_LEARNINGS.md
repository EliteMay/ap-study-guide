# PROJECT LEARNINGS

このファイルは、AP Study Notesで発生した再発防止価値の高い失敗と、今後も再利用したい成功パターンを長期的に残す正本です。

`docs/作業報告書.md` は「今回何を変更したか」、このファイルは「このProjectから何を学んだか」を記録します。

## Failure

### PL-F-001 Backup ImportはTop-level確認だけでは安全にならない

- Date: 2026-08-30
- Status: resolved
- Severity: high
- Cost: high
- Symptom: 認識済みStorage Keyに壊れたJSONが含まれていても、Import開始後に現在データを上書きできる余地があった。
- Expected: 全payloadを検証し、現在データを保護してから置換する。
- Actual: Top-level形式の確認だけではKeyごとの破損を止められず、途中失敗時のRollbackも弱かった。
- Trigger / Reproduction: Backup JSONへ壊れた認識済みStorage JSONを入れてRestoreする。
- Root Cause: Import Pipelineを「parseできるか」中心に考え、KeyごとのSchema・Backup・Rollbackを一体で設計していなかった。
- Final Fix: KeyごとのValidation、Restore直前Backup、Memory退避、途中失敗時Rollback、安全なPreviewを実装した。
- Affected files / systems: `js/data-tools.js`, `html/data.html`, Backup / Restore
- Detection method: Guide監査 + Browser Smoke
- Regression Guard: malformed Backup拒否、HTML文字列非実行、Validated RestoreをPlaywrightで確認。
- Prevention: `parse → 全体Validation → 現在Backup → replace → verify → rollback` を破壊的Importの標準順序にする。
- Related Issue / PR / Commit: r18
- Guide candidate: yes
- Guide note: `web-project-guide` 1.2系のImport / Rollback強化へ対応済み。

### PL-F-002 教材件数Coverageと学習導線Coverageは別に検証する

- Date: 2026-08-30
- Status: resolved
- Severity: medium
- Cost: high
- Symptom: 118 Lessonが存在していても、短問から直接参照されるLessonは70/118に留まり、一部Lesson末尾の演習導線が弱かった。
- Expected: 各Lessonから関連短問へ直接進める。
- Actual: Unitや中分類Coverageは満たしていたため、Lesson単位の参照Gapを見落としていた。
- Trigger / Reproduction: Practice Manifestの全`lessonRefs`とLesson Indexを集合比較する。
- Root Cause: Coverage指標がUnit / 中分類中心で、Lesson単位の直接参照をContract化していなかった。
- Final Fix: 不足48 Lessonを機械抽出し、1 Lesson = 1問のCoverage Bankを追加して118/118にした。
- Affected files / systems: Practice Manifest / Lesson Practice / Mock Pool
- Detection method: ValidatorでLesson集合差分を算出。
- Regression Guard: `validate-practice.mjs`で118/118を必須化し、Playwrightで`ALG-01 → PC-ALG-01`を実遷移確認。
- Prevention: 「Dataが存在する」と「利用導線から到達できる」を別Contractとして検証する。
- Related Issue / PR / Commit: r20
- Guide candidate: yes
- Guide note: Coverage / Oracle設計のProject Evidenceとして再利用可能。

### PL-F-003 Static CI成功だけでは最終状態を保証しない

- Date: 2026-08-30
- Status: resolved
- Severity: medium
- Cost: medium
- Symptom: Data変更後に旧Browser Smokeが「未対応Lessonが存在すること」を前提として失敗した。
- Expected: 最終仕様の118/118 CoverageをBrowser Smokeも検証する。
- Actual: Static Validatorは新仕様へ追従したが、E2Eの古い前提が残った。
- Trigger / Reproduction: 118/118化後のPlaywright実行。
- Root Cause: 実装・Static Contract・Browser Oracleを同時に更新していなかった。
- Final Fix: E2Eを「全Lesson直接Coverage + 実遷移」へ更新し、最終HEADで再検証した。
- Affected files / systems: `tests/e2e-smoke.mjs`
- Detection method: GitHub Actions Browser Smoke
- Regression Guard: Final-state CI / Pages確認を完成条件へ明記。
- Prevention: 仕様変更時はValidatorだけでなくBrowser Oracleの前提も確認する。
- Related Issue / PR / Commit: r20
- Guide candidate: yes
- Guide note: Final-state Validation / Oracle-driven Testの具体例。

---

## Success

### PL-S-001 Runtime件数とBuildをSource of Truthから算出する

- Date: 2026-08-30
- Goal / Problem: 教材追加のたびにHomeや説明文の固定件数が古くなる問題を防ぐ。
- Adopted Pattern: Buildは`json/project-meta.json`、教材件数は各Manifest / Indexを正本とし、Runtime表示はDataから算出する。
- Why it worked: 教材追加と表示更新を別作業にせず、ValidatorでもMagic Countの再混入を検出できる。
- Trade-off: 初期表示にLoading Stateが必要になる。
- Reuse when: JSON / Manifestを持つDATA Profileのサイト。
- Avoid when: 完全固定の1Page説明サイトでRuntime Dataが存在しない場合。
- Related files / tests: `json/project-meta.json`, `js/home.js`, `tests/validate-runtime-quality.mjs`
- Guide candidate: yes
- Guide note: Single Source of Truth / Magic Count防止の成功例。

### PL-S-002 Legacy互換層と通常導線を分離する

- Date: 2026-08-30
- Goal / Problem: 旧6分野ページのID・保存互換を維持しながら、通常学習導線を統合したい。
- Adopted Pattern: Legacy PageはCompatibility Layerとして残し、通常入口はGeneric Unit Hub / Unified Glossaryへ集約した。
- Why it worked: 既存URL・localStorage互換を壊さず、新しいNavigationを単純化できた。
- Trade-off: Repository内に旧DOM構造が残るため保守対象は完全には減らない。
- Reuse when: 古いURL / Storage互換を守りながらUIを再構成するとき。
- Avoid when: 互換要件がなく、旧Runtimeを安全に削除できる場合。
- Related files / tests: `js/shell.js`, `html/unit.html`, `html/glossary.html`, Runtime Quality Validator
- Guide candidate: yes
- Guide note: Compatibility Layerの成功例。

---

## Guide Feedback Queue

| ID | Type | Summary | Evidence | Next action |
|---|---|---|---|---|
| PL-F-002 | failure | Coverageは分類単位と利用導線単位を分けて検証する | 70/118 → 118/118 | 他の学習Projectでも同型事故があるか確認 |
| PL-S-002 | success | Legacy互換層と通常導線の分離 | 旧URL維持 + Unified Hub | 複数Projectで再利用後に共通化判断 |
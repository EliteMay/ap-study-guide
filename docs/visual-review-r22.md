# r22 Visual Design Review

## Scope

AP Study Notes / `EliteMay/ap-study-guide` のUser-facing UIを、`web-project-guide` 1.11.0のVisual Quality BaselineとVisual Design Review方針に合わせて再設計した。

Build: `2026.09.01-r22`

Visual ambition: **high**

Direction: **Study Console / Technical Handbook**

## Design direction

### Purpose / task

このサイトの主目的は、応用情報技術者試験の学習を「今日やることを決める → Lessonを読む → 演習する → 弱点へ戻る」という反復作業として短時間で開始できること。

### Adopted structure

- Desktop: 左の固定Study Rail + Content Surface
- Home first view: 学習開始・検索を左、現在進捗を右のScoreboardへ分離
- Main actions: 8枚の同強度Cardではなく、番号付きの操作List
- Units: `UNIT 01`〜の学習索引として表示
- Lesson / Roadmap: Shadow/Card依存を減らし、罫線・Section・Table・Callout中心
- Mobile: Top bar + Drawerへ切替し、主要Actionを縦方向へ再構成

### Visual language

- Ink navyのStudy Rail
- Blue accentをPrimary Action / Current stateへ限定
- White / cool-grayの紙面Surface
- Border / spacing / typographyでHierarchyを作る
- Radiusを小さく統一し、Shadowを常設Cardの主要表現に使わない
- HeroはGradient landing pageではなくTechnical handbook headerとして扱う
- EmojiはHomeのVisual iconとして表示せず番号Markerへ置換。SidebarもCSS上でText labelへ置換する

## Why this direction

AP Study NotesはMarketing Siteではなく、長時間繰り返し使う学習Tool / Knowledge Siteである。巨大Hero・Gradient・Card Gridを増やすより、Navigation・検索・今日の学習・教材本文を素早く識別できる高密度寄りのProduct UIが適している。

`web-project-guide` のValidated Visual Directionでは `VD-002 Tarkov Field Manual Knowledge Manual` の「学習順をRailとContent hierarchyへ反映」「全情報をCard化しない」という原則を参考にした。ただし軍用Theme・Olive色・具体Layoutはコピーしていない。

## Visual Quality Baseline check

### Hierarchy

- Primary: 今日の優先項目 / Primary Action
- Secondary: Quick Start / 13 Unit
- Tertiary: Reference / Diagnostics / Legacy tools
- Home progressは独立Scoreboardへ分離し、本文と同強度にしない

### Typography

- System fontのみで外部依存なし
- Japanese bodyの可読性を優先
- Mono fontはBuild / Unit number / Eyebrow等の局所Labelに限定
- Homeの大見出しは日本語の孤立1文字折返しを避け、「何をするか / 選ぶだけ。」の意味境界で折り返す

### Spacing / alignment

- `--ap-content` と共通Container幅を導入
- Section / panel / listで一貫した境界と余白を使用
- Card radiusを7〜9px中心へ整理

### Component consistency

- Button / Input / Focus / Sidebar item / Surfaceのshape languageを統一
- Quick StartはCardではなくList semanticsへ変更
- Table / Code / Calloutは内容に応じて別Surfaceを維持

### Responsive

- 920px以下でSidebarをDrawer化
- 1040px以下でHome Heroを1列化
- 700px以下でQuick Startを1列化
- 320px horizontal overflowをE2Eで継続検証

### Accessibility

- 既存Skip Link / `focus-visible` / inert drawer / reduced-motionを維持
- Accent色だけで重要Stateを表現しない
- Navigation labelはEmojiだけに依存しない
- 濃紺Home HeroのHeading / Leadを高コントラストの白・淡色Textへ修正

## Anti-pattern review

- AP-026 Palette-Swap Clone: **回避** — Palette変更だけでなくHome composition / navigation density / card semanticsを変更
- AP-027 Decorative Cardification: **改善** — Quick Startと主要本文のCard依存を削減
- AP-028 AI Landing Page Default: **改善** — Gradient巨大Hero + equal cards構成を廃止

## Screenshot review findings

最終PRでGitHub Actions Artifact `visual-review` のHome Desktop / Home Mobile / Lesson Desktopを確認した。

### Finding 1 — Home Hero contrast

- Severity: **Blocking**
- Initial state: 濃紺Heroに対してHeading / Leadが暗く、可読性が不足していた。
- Fix: Home Hero専用の高Specificity color ruleを追加し、Headingを白、Leadを淡いBlue-grayへ変更。
- Final: **resolved**

### Finding 2 — Empty search result surface

- Severity: **Major**
- Initial state: `hidden` な `.home-quick-results` に `display:grid` が勝ち、検索欄下へ空の白い細線が見えていた。
- Fix: `.home-quick-results[hidden]{display:none!important}` を追加。
- Final: **resolved**

### Finding 3 — Japanese heading orphan wrap

- Severity: **Minor**
- Initial state: Desktop / Mobileで「選ぶだ / け。」のように1文字だけ孤立する折返しが発生。
- Fix: `word-break:keep-all` と `wbr` を使い、意味境界「何をするか / 選ぶだけ。」で折り返す。
- Final: **resolved**

## Verification

Automated acceptance:

- Static ValidatorでVisual direction metadata / key CSS contractを確認
- PlaywrightでDesktop Homeの2-column Study Console、Quick Startの非Card化、Sidebar幅を確認
- Lesson blockのradius / shadow contractを確認
- 320px overflowを確認
- Home desktop / Home mobile / Lesson desktopのScreenshotをGitHub Actions Artifact `visual-review` として保存

Manual review:

- Desktop Home: reviewed
- Mobile Home: reviewed
- Desktop Lesson: reviewed
- Blocking findings: **0 unresolved**
- Major findings: **0 unresolved**
- Visual Review Result: **PASS**

## Compatibility

変更しない:

- Lesson / Practice / Case / Mock Data
- localStorage Key / Backup Schema
- 118/118 Lesson Practice Coverage
- Mock 80問構成
- Diagnostics data contract
- GitHub Pages deployment方式

## Visual review status

- Functional / Static validation: **passed on PR HEAD before documentation-only finalization**
- Browser validation: **passed on PR HEAD before documentation-only finalization**
- Screenshot visual review: **PASS**
- User validation: **pending**

最終Documentation Commit後も同一PRでStatic / Browser / Screenshot Artifactを再実行し、最終HEADの結果を完成判定に使用する。

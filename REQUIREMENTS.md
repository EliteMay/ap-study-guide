# AP Study Guide 要件定義

## 0. Guide / Project Profile

- 正式名称: `AP Study Guide`
- Repository: `EliteMay/ap-study-guide`
- Adopted Guide Version: `1.16.0`
- Profiles: `STATIC + DATA + LEARNING + TOOL + PUBLIC-CONTENT`
- Deployment: GitHub Pages
- Requirements Source of Truth: この `REQUIREMENTS.md`
- Current implementation / detailed runtime specification: `README.md` / `docs/仕様書.md`
- Project Memory: `PROJECT_LEARNINGS.md`
- 要件確定日: 2026-09-05

### 0.1 要件定義の決定モード

- Recommendation-by-default: Yes
- Core DecisionはUserが確定する。
- 保存互換、公開範囲、外部DB/Auth/API、主要Navigation、Lesson/Unit再編等のHigh-cost DecisionはUser確認を優先する。
- 細かなJSON構造、CSS値、関数名、内部Component分割、標準的Error handling等は実装時のDefault Decisionとする。

## 1. Productの核 / 目的

APをほぼ初めて学ぶ人でも、用語暗記だけでなく**仕組み・理由から理解し、その理解を問題演習へつなげ、応用情報技術者試験で安定して合格圏へ到達できる一般公開学習サイト**とする。

中心体験は次の通り。

```text
分野を選ぶ
↓
Lessonで「何か / なぜ必要か / どう動くか」を理解する
↓
Lesson途中の小確認 + Lesson末の総合確認
↓
関連短問 / 公式公開問題で取り出す
↓
Case / 模試で複数知識を組み合わせる
↓
弱点を分析する
↓
必要なLesson・問題へ戻って復習する
```

### 1.1 学習目標

- 最低合格点だけを狙うのではなく、**複数回の演習・模試でも安定して合格圏へ入れる理解**を目標とする。
- サイト独自の学習目安として、模試70%以上を「安定合格圏」、80%以上を「かなり安定」、60〜69%を「合格圏付近」と表示してよい。
- 上記はIPA公式得点への換算ではなく、合格を保証しないサイト独自指標であることを明示する。
- 安定性は原則として直近3回程度の結果を見る。科目A / 科目Bは別々に評価する。

## 2. 使用者・公開範囲

- 公開範囲: 一般公開
- Target learner: AP初心者全般
- Starting Knowledge: 基本情報レベルの知識が曖昧でも利用可能
- 主な端末: PC中心
- Smartphone: 主要機能はすべて利用可能にする
- Offline: 現時点ではオンライン前提
- Login: 不要
- Analytics / third-party telemetry: 導入しない
- 学習データ: 原則として利用端末内に保存

### 2.1 初心者対応

- 基礎説明を本文へ無制限に混ぜず、必要な場所で「そもそも○○とは？」等の補足を提供する。
- 基礎を知っている利用者は補足を飛ばせる。
- 英語だけを並べる説明にしない。日本語を基本とし、試験・実務で必要な正式英語名・略語を初出時等に併記する。

## 3. 試験制度 / 教材情報の正本

### 3.1 2026年度

2026年度の正式教材はIPAの現行正式情報を正本とする。

- 応用情報技術者試験シラバス: Ver.7.2
- 2026年度: CBT方式
- 科目A: 150分 / 80問 / 80問解答 / 四肢択一
- 科目B: 150分 / 11問 / 5問解答 / 記述式
- 現行制度は2026年度実施をもって終了予定

公式確認先:

- https://www.ipa.go.jp/shiken/kubun/ap.html
- https://www.ipa.go.jp/shiken/syllabus/gaiyou.html
- https://www.ipa.go.jp/shiken/2026/ap_koudo_sc_kikan.html

### 3.2 2027年度以降

- 2027年度から新試験制度へ移行予定。
- 2026-09-05時点で公開されている2027年度向けシラバスは「案」であり、変更可能性がある。
- 未確定情報を2026年度の正式教材へ混ぜない。
- 基本知識は共通教材として持ち、年度差分をmetadataで管理できる構造にする。
- 受験年度は最新正式年度を標準とし、必要なら設定から切り替え可能にする。
- 年度によりLessonの対象、重要度 / 頻出度、公式問題、模試構成、注意事項を切り替えられるようにする。

### 3.3 教材の情報源

- 試験範囲・制度・用語の基準はIPA公式を優先する。
- 技術仕様はRFC、標準仕様、製品・言語の公式Documentation等の一次情報を優先する。
- 初心者向け説明・例・図は独自に分かりやすく作成する。
- 他サイト・参考書の文章をそのまま転載しない。
- 変化し得る制度・仕様は対象年度を明確にする。

## 4. Phase構成

実装・公開は段階的に進めるが、**サイト全体の完成はPhase 1〜3の完了を必要とする**。

### Phase 1 — 教材品質 / 学習導線

- 全Lessonの監査・再編
- Lesson本文のContent Depth改善
- 重要度 / 頻出度
- 図解
- Lesson途中の小確認
- Lesson末の総合確認
- 関連短問
- 関連用語
- 関連公式公開問題
- 前提 / 関連Lesson
- 横断検索
- 教材改善に必要なUI再設計
- PC / Smartphone表示
- Data / Link / 内容品質Validation

### Phase 2 — 学習状態 / 弱点分析 / 復習

- 5段階のLesson理解状態
- 適応型復習
- 複数履歴を使った弱点分析
- 手動苦手指定
- 診断テスト
- 最近の結果を重視した傾向分析
- 模試結果から復習先への導線

### Phase 3 — 高度な教材

- 理解効果が高いLessonだけインタラクティブ教材を追加
- アルゴリズムのステップ実行
- SQL / 表変化の実践教材
- ネットワーク通信フロー
- CPU / Memory等の状態可視化
- セキュリティの攻撃・防御フロー
- 計算問題の値変更・確認等

全Lessonへインタラクティブ要素を機械的に付けない。

## 5. Lesson / Curriculum

### 5.1 Unit / Lesson再編

- 既存13Unit、118Lessonという数は固定しない。
- 既存教材を全件監査し、正確で分かりやすい内容は再利用する。
- 説明不足、重複、古い内容は書き直す。
- 必要ならUnit / Lessonを統合・分割する。
- 基本単位は **1 Lesson = 1つの理解テーマ**。
- 単純な内容は短く、一連の仕組みとして理解した方が良い内容はまとめる。
- 長すぎるLessonは分割を検討するが、前後関係が強い内容を無理に分断しない。
- IPA分類をそのまま画面上の学習Unitへ機械的に変換しない。初心者が理解しやすいまとまりを優先する。

### 5.2 学習順

- 分野から自由に選んで学べる。
- 全体を一本道にロックしない。
- Lessonごとに前提Lesson、関連Lesson、次に理解しやすいLessonを表示可能にする。
- 前提未学習でも移動自体は禁止しない。

### 5.3 Lesson Content Depth Contract

主要Lessonは最低限、次を満たす。

1. まず一言で「何なのか」
2. 必要な前提知識
3. Why — なぜ必要か / なぜそうなるか
4. How — 仕組み / 考え方 / 処理の流れ
5. 具体例
6. 必要な図解
7. APではどう問われるか
8. 間違いやすい点 / よくある誤解
9. Lesson途中の小さな理解確認
10. Lesson末の総合確認
11. 関連短問 / 用語 / Lesson / 公式問題への導線

用語の定義だけで終わるLessonは完成扱いにしない。

### 5.4 Lesson本文の表示

- 本文は読みやすい参考書寄りのSurfaceとする。
- 長いLessonは見出しで明確に区切り、必要ならページ内目次を提供する。
- カードを大量に並べて本文の流れを壊さない。
- 基礎補足・深掘りは必要に応じて展開可能にする。

### 5.5 Lesson学習補助

Lesson画面には必要な補助だけを置く。

- 苦手に登録
- あとで復習
- 現在の理解状態
- 関連用語
- 関連Lesson
- 関連問題 / 公式問題

自由入力メモ等は現時点で必須にしない。

## 6. 重要度 / 頻出度 / 難易度

### 6.1 Lesson

各Lessonに次を持たせる。

- 重要度: 高 / 中 / 低
- 頻出度: 高 / 中 / 低

全範囲を最低品質でカバーしつつ、頻出・難しい・他分野の前提・応用されやすい内容を厚くする。

### 6.2 問題

問題難易度は3段階とする。

- 基礎
- 標準
- 応用

難易度と重要度 / 頻出度は別概念として管理する。

## 7. 図解 / Code / 計算教材

### 7.1 図解

- 文章より図の方が理解しやすい内容は図解を積極的に使う。
- HTML / CSS / SVG等、レスポンシブ・Dark Mode・修正に強い形式を基本とする。
- 固定画像はWeb図解で表現しづらい場合の補助とする。
- ネットワーク通信、Memory、DB関係、Algorithm状態、Security Flow等を対象にする。

### 7.2 Code / SQL / 疑似Code

- Codeを貼るだけで終わらせない。
- 各行・構文が何をしているか初心者向けに説明する。
- Algorithmでは変数や配列等の状態変化を追えるようにする。
- SQLでは入力表、Query、結果表の対応を理解できるようにする。

### 7.3 計算問題

計算解説は原則として次を示す。

1. 何を求める問題か
2. 使う式
3. なぜその式を使うか
4. 数値代入
5. 途中計算
6. 答え
7. 単位・桁・選択肢等の確認
8. よくある計算ミス
9. 必要なら本番向けの時短の考え方

## 8. 問題演習

### 8.1 Lesson理解確認

- Lesson途中: 内容の区切りごとに小さな確認を入れる。
- Lesson末: 原則3〜5問程度の総合確認を置く。
- 重要・頻出Lessonは内容に応じて5問以上でもよい。
- 単純な内容で問題数を水増ししない。
- 理解基準未達でも次Lessonをロックしない。
- 基準未達時は不足ポイント、戻るべきSection、再挑戦導線を示し、理解済み扱いにはしない。

### 8.2 段階式演習

- 基本確認 → 標準問題 → 応用問題の順を基本とする。
- 初学習は基礎中心。
- 基礎が安定すれば標準を増やす。
- 標準も安定すれば応用を増やす。
- 苦手化・連続誤答時は基礎 / 標準へ戻す。
- 自由演習ではユーザーが難易度を指定できる余地を持つ。

### 8.3 再挑戦 / 類題

- 同じ問題の答え暗記だけで理解済みにならないようにする。
- 復習では同じ知識を別の聞き方、選択肢、具体例で確認できる類題を使う。
- 毎回完全別問題を要求して問題数を無意味に増やさない。

### 8.4 短問モード

#### 学習モード

- 1問ごとに即採点
- 正解理由
- 誤答選択肢が違う理由
- 必要だった知識
- 関連Lesson / 用語

#### 演習モード

- 複数問をまとめて解答
- 最後に採点・解説

## 9. 記述 / Case

- 記述問題を単純なKeyword一致だけで完全自動採点しない。
- 回答後に次を表示する。
  - 模範解答
  - 必須ポイント
  - 加点ポイント
  - よくある不足
  - 関連Lesson
- 最終的な自己評価は原則3段階。
  - 理解できた
  - 一部不足
  - 理解できていない
- 自己評価結果は弱点分析へ利用可能にする。

## 10. 科目A / 科目B

- 知識Lessonそのものは科目A / 科目Bで重複させない。
- Lessonから「科目Aでどう問われるか」「科目Bでどう使われるか」を確認可能にする。
- 演習段階では科目A / 科目Bを明確に分ける。

### 10.1 科目B分野支援

- 全対象分野を学習可能にする。
- 診断、Case、模試履歴等から得点源にしやすい分野候補を提示する。
- 自動で固定せず、重点対策分野はユーザーが自由に変更可能にする。
- 「苦手だから捨てる」だけでなく、実績から得意・相性の良い分野を探す。

## 11. 公式公開問題

### 11.1 掲載方針

IPAが公表している過去問題は、IPAの利用条件を守ってサイト内教材として利用可能とする。

必須条件:

- 出典を年度、期、試験区分、時間区分、問番号等まで明記する。
- 問題を改変・抜粋した場合はその旨を明記する。
- IPA公式解答とサイト独自の解説を区別する。
- 公式問題と独自問題をUI上も明確に区別する。
- 元のIPA公式ページ / PDFへの導線を用意する。
- 非公開のCBT実問題、漏えい情報等は絶対に扱わない。

公式確認先:

- https://www.ipa.go.jp/shiken/faq.html
- https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html

### 11.2 収録範囲

- 直近10年程度を中心に収録する。
- それ以前でも現在の学習価値が高い良問は採用可能。
- 古い仕様・制度依存問題は通常教材から除外するか「参考 / 旧仕様」表示を行う。
- 同型の類似問題だけを無制限に増やさない。

### 11.3 Lesson連携

- Lesson → 関連公式問題へ進める。
- 公式問題 → 必要知識 / 関連Lessonへ戻れる。
- 公式問題を単なる外部リンク集にしない。

## 12. 模試

### 12.1 モード

#### 本番モード

- 途中で正解・解説を表示しない。
- 時間を測る。
- 本番に近い分野バランス・構成を優先する。
- 終了後にまとめて採点・分析する。

#### 学習モード

- 問題ごとに解説確認可能。
- 苦手分野を適度に多めに出題してよい。
- 間違いから関連Lessonへ戻れる。

### 12.2 問題Pool

- 公式公開問題と独自問題の両方を利用可能にする。
- 公式 / 独自を明確に区別する。
- 未出題・最近解いていない問題を優先する。
- 学習モードでは誤答問題・苦手分野を再出題しやすくしてよい。
- 本番モードでは苦手補正より試験に近い分野バランスを優先する。
- 古い仕様の問題を通常Poolへ混ぜない。

### 12.3 結果

模試結果は点数だけで終わらせず、次を表示可能にする。

- 総合結果
- 分野別正答率
- 苦手分野
- 間違えた問題
- 失点原因
- 関連Lesson
- 次に解く短問
- 関連公式問題
- 復習優先度

サイト模試結果をIPA公式得点へ直接換算しない。

### 12.4 間違い原因

任意入力で次のような原因を記録可能にする。

- 知識不足
- 理解不足
- 読み間違い
- 計算・手順ミス

毎回答で入力を強制しない。

## 13. Lesson理解状態 / 復習

### 13.1 Lesson状態

5段階を基本とする。

1. 未学習
2. 学習中
3. 理解確認済み
4. 定着
5. 要復習

「その場で解けた」と「時間が経っても定着している」を分ける。

### 13.2 復習タイミング

固定14日だけで全Lessonを判定しない。

- 誤答・理解不足 → 早めに再確認
- ぎりぎり理解 → 数日後等、短め
- 安定正解 → 復習間隔を延ばす
- 複数回安定 → 頻度を下げる
- 久しぶりに誤答 → 再び頻度を上げる

具体的なinterval値・Algorithmは実装時にValidationしながら決めるDefault Decisionとする。

## 14. 弱点分析 / 進捗

進捗画面は「今日やること」よりも**弱点分析を中心**にする。

### 14.1 分析対象

- 最近の正答率
- 間違い回数
- 繰り返し誤答
- Lesson理解状態
- 記述自己採点
- Case結果
- 模試結果
- 復習後の変化
- 最終学習日時
- 手動苦手指定
- 任意入力の誤答原因

### 14.2 表示

- 分野別理解度
- 正答率の低いLesson
- 苦手分野ランキング
- 復習対象
- 模試推移
- 最近改善している / 悪化している分野
- 未学習 / 学習中 / 理解済み等の状態
- 苦手 / 要復習 / 普通 / 安定等の分かりやすい分類
- なぜその判定になったかの理由

各分析結果から該当Lesson / 問題へ直接移動できること。

### 14.3 手動苦手指定

自動判定に加え、「これは苦手」とユーザー自身で指定可能にする。

## 15. 診断テスト

- 任意機能。受験しないとLessonへ進めない仕様にしない。
- 20〜30問程度を基本とする。
- 基礎＋標準を中心に、一部応用を含む。
- 主要分野を広く確認する。
- 必要なら特定分野の追加診断へ進める。
- 結果は点数だけでなく次を示す。
  - 分野別スコア
  - 弱点理由
  - 基礎不足 / 標準不足 / 応用不足等の傾向
  - おすすめLesson
  - 必要なら先に確認する用語
- 自動で一本道の学習コースへ固定しない。

## 16. 検索 / Glossary

### 16.1 横断検索

用語だけでなくサイト全体を検索可能にする。

対象:

- Lesson
- 用語
- 問題
- 分野
- 公式問題

検索結果は完全一致を優先しつつ、学習に役立つ順に整理する。

例:

1. 直接一致するLesson
2. 直接一致する用語
3. 関連Lesson
4. 関連問題
5. 公式問題

将来、質問文等による文章検索へ拡張可能な余地を残すが、現時点ではAIや外部APIを前提としない。

### 16.2 単語辞書

GlossaryはLesson代替ではなく補助教材とする。

各用語で必要に応じて次を表示する。

- 一言で意味
- 初心者向け説明
- 具体例
- 関連用語
- 関連Lesson
- APでのポイント

詳しい理解が必要な場合はLessonへ誘導する。

## 17. Home / Navigation / Settings

### 17.1 Home

Homeは**学習メニュー中心**とする。

主要入口:

- 分野 / Lesson
- 単語辞書
- 短問
- 科目B Case
- 公式過去問
- 模試
- 学習進捗 / 弱点分析
- 診断テスト
- 設定 / 学習データ管理

詳細な弱点分析をHomeへ詰め込みすぎない。

### 17.2 Navigation

学習機能を次のようにグループ化する。

- 学ぶ
  - 分野 / Lesson
  - 単語辞書
- 解く
  - 短問
  - 科目B Case
  - 公式過去問
  - 模試
- 分析
  - 進捗
  - 弱点分析
  - 実力診断
- 管理
  - 設定
  - Backup / Restore

具体的なMenu UIは実装時に最適化してよい。

### 17.3 Settings

1か所で主に次を管理する。

- 受験年度
- Light / Dark Theme
- 文字サイズ
- 復習 / 弱点表示の基本設定
- 模試の標準モード
- Backup / Restore
- 学習データ初期化

細かすぎるCustomizationは追加しない。

## 18. Visual Direction / Responsive

- Visual Ambition: high
- Direction: `friendly-study-dashboard`を維持・改善
- 学習サイトとして親しみやすいが、子どもっぽくしない。
- 色は情報のHierarchy・分野・状態理解に使う。
- 不要な巨大Hero、Gradient、Glass、カード乱用等のAI Template感を避ける。
- Lesson本文は装飾を抑えた読みやすい参考書寄りの表示。
- Phase 1では新要件の利用に必要な画面構造は再設計してよい。
- 問題のない画面まで理由なく全面リニューアルしない。
- 大きなVisual変更は最新`web-project-guide`のDomain-first Visual Researchを行う。
- PC中心だがSmartphoneでも主要機能をすべて利用可能にする。
- SmartphoneはPC画面の単純縮小ではなく、必要に応じて1column等へ再配置する。

## 19. Data / Storage

### 19.1 教材Data

- GitHub上のJSON / Manifestを正本とする。
- 大量教材を初期表示で一括読込しない。
- Home / Search用の軽量Indexと、Lesson本文・問題本文・詳細Dataを分離可能にする。
- Lesson / 問題 / Glossary詳細は必要時Loadを基本とする。
- Loading / Empty / Error / Success状態を用意する。

### 19.2 学習Data

現時点ではBrowser localStorage主体を維持する。

保存対象例:

- Lesson理解状態
- 問題履歴
- 復習履歴
- Case履歴
- 模試履歴
- 診断結果
- 手動苦手指定
- 誤答原因
- 設定

### 19.3 履歴保持

- 最近の結果を弱点判定で強く重視する。
- 長期推移を確認できる情報は残す。
- 詳細履歴を無制限に保存しない。
- 古い詳細履歴を整理しても、必要な累計・傾向は残せる構造にする。
- 具体的な件数 / 保持期間はStorage実測と品質検証後に決める。

### 19.4 Cloud

- 現時点では外部DB / Auth / Cloud Syncを必須にしない。
- 将来クラウド同期を追加しやすいData設計を目指す。
- 現行のローカル単独利用を壊してまで将来拡張を優先しない。

## 20. Backup / Migration

### 20.1 Backup / Restore

既存の安全方針を維持する。

- 認識済みKeyだけを対象にする。
- Import前にValidationする。
- 現在データを先に破壊しない。
- Restore前Backupを可能にする。
- 途中失敗時は可能な範囲でRollbackする。
- Import文字列をraw HTMLとして描画しない。

### 20.2 Lesson / Unit再編Migration

Unit / Lesson再編時は旧IDとの対応を管理する。

- 1対1対応: 可能なら進捗をそのまま移行
- 複数旧Lesson → 新Lesson統合: 旧結果から安全に判定
- 1旧Lesson → 複数新Lesson分割: 全新Lessonを自動完了にしない
- 判断が曖昧: 要確認 / 要復習等の安全側へ
- 旧DataはMigration確認前に破壊しない
- Migration前Backupを用意
- 失敗時Rollbackを可能な範囲で行う
- 旧URLも可能な限り救済する

## 21. Development Diagnostics / Project Memory

既存のLocal-first Diagnostics方針を維持する。

- 外部Telemetryとして使わない。
- 学習回答本文、Backup本文、秘密情報、Token、URL Query / Fragment等を記録しない。
- 学習Backup本体とDiagnostics Storageを分離する。
- Logは上限を持ち、無制限保存しない。
- `PROJECT_LEARNINGS.md`へ再発防止価値の高い成功 / 失敗を記録する。

## 22. 外部依存 / AI / Media

- External API: 現時点で必須なし
- DB / Auth: 現時点で必須なし
- AI API: 現時点で導入しない
- API Key: 不要
- AIがなくても教材だけで理解できることを必須とする。
- 将来「追加解説・類題・質問」等のAI機能を追加できる余地は残してよい。
- 動画教材は基本的に導入しない。
- 動きを理解する必要がある内容は図解・Step表示・Interactive教材を優先する。

## 23. ゲーミフィケーション / 通知

### 23.1 ゲーミフィケーション

原則として導入しない。

- XP
- Level
- Badge
- Daily Mission
- 学習連続日数を主目的とした仕組み

等を中心機能にしない。

実際の理解度、弱点、進捗、模試結果、復習状態を学習成果として表示する。

### 23.2 Notification

- Browser Push / 外部Notification / Reminderを導入しない。
- サイトを開いたときに要復習・苦手状態を確認できればよい。

## 24. 更新公開方針

大規模教材再編は分野単位で完成させ、順次切り替える。

1分野を新版へ切り替える前に最低限次を揃える。

- Lesson構成
- 重要度 / 頻出度
- 図解
- 理解確認
- 関連短問
- 関連用語
- 公式問題
- 検索
- 進捗Migration
- PC / Smartphone表示
- Data / Link / 内容品質Validation

未完成の新版分野を完成版として公開しない。

更新内容は、分野・主な改善・追加内容・必要なら変更日程度を軽く表示してよい。学習を遮るPop-up更新通知は使わない。

## 25. 崩してはいけない仕様

1. 既存学習データを理由なく削除・Resetしない。
2. Lesson / Unit再編時はMigrationを用意する。
3. 旧URLは可能な限り救済する。
4. GitHub PagesのSubpathで動く相対Pathを維持する。
5. Login / 外部DBを必須化しない。
6. API Key / Token / Secretを公開Repositoryへ置かない。
7. JSON Backup / Restoreを維持する。
8. Restore前Validationと安全な置換手順を外さない。
9. 公式問題と独自問題を明確に区別する。
10. 非公開CBT実問題・漏えい問題を扱わない。
11. サイト模試得点をIPA公式得点へ直接換算しない。
12. 教材件数・Coverage数が揃っただけで完成扱いしない。
13. PC中心でもSmartphoneの主要機能を壊さない。
14. 正式名称を`AP Study Guide`へ変更しても既存Storage Keyを理由なく変更しない。
15. Legacy URL / ID / Storage互換を壊す変更はMigration / Redirect / Compatibility方針なしに行わない。
16. Diagnosticsへ学習回答本文・秘密情報・Backup本文を保存しない。

## 26. 高コスト設計判断

### 26.1 確定済み

- Platform: Static Web / GitHub Pages
- 公開範囲: 一般公開
- Login / Auth: なし
- Primary Storage: localStorage
- Backup: JSON Export / Restore
- Analytics: なし
- Offline: 現時点では必須にしない
- AI: 現時点では実装しない
- Unit / Lesson: 必要なら再編可能
- Migration: 必須
- Navigation: 学ぶ / 解く / 分析 / 管理のGroupを基本
- Visual: friendly study site、Lessonは読みやすさ重視
- Learning order: 分野自由選択 + 前提関係を案内、強制Lockなし
- Content Depth: What / Why / How / Example / AP / Mistake / Checkを要求

### 26.2 今後User確認が必要な変更

- 外部DB / Auth / Cloud Syncの本導入
- Login必須化
- GitHub Pages以外への主要Platform変更
- 保存Schemaを破壊する変更
- 既存進捗をMigrationできない大規模ID変更
- 主要機能削除
- Navigationの全面変更
- 一般公開範囲の変更
- 有料Service導入
- AI APIの本導入

## 27. 性能 / Reliability / Accessibility

具体的な数値・実装は最新`web-project-guide`を正本とし、実装段階で決める。

最低要件:

- 初期表示で全教材を一括Loadしない。
- Loading / Empty / Error / Success Stateを用意する。
- Fetch失敗時に画面全体を無言で停止させない。
- 大量DOM生成を避ける。
- PC / Smartphoneで重大な横Overflowを出さない。
- Keyboard操作、Focus表示、Skip Link、Mobile Navigation等の基本Accessibilityを維持する。
- `prefers-reduced-motion`等、既存Accessibility Contractを壊さない。
- Dynamic Pageは機能Smokeだけでなく実表示Screenshotも確認する。

## 28. 教材品質 / Validation

### 28.1 自動Validation

最低限、可能な範囲で次を検証する。

- JSON Schema / 必須項目
- ID重複
- Manifest整合
- Lesson / Problem / Glossary / Official mapping
- Link切れ / 存在しない参照
- Legacy mapping / Migration contract
- GitHub Pages相対Path
- Runtime件数のSource of Truth

### 28.2 内容品質Review

機械Validationとは別に次を確認する。

- 説明が用語定義だけで終わっていないか
- 初心者に必要な前提が欠けていないか
- Why / Howが説明されているか
- 抽象説明だけでなく具体例があるか
- 図解が必要な内容に図があるか
- APでの問われ方が分かるか
- 誤答理由・間違いやすい点が正しいか
- 問題とLesson内容が一致しているか
- 重要Lessonに必要な深さがあるか
- 日本語 / 英語 / 略語表記が一貫しているか
- 公式・一次資料と矛盾していないか

## 29. Phase完成条件

### 29.1 Phase 1

再編後の全対象Lessonについて次が揃うこと。

- Content Depth Contractを満たす
- 重要度 / 頻出度
- 必要な図解
- 3〜5問程度を基本とする総合確認
- 関連短問
- 関連用語
- 関連公式問題
- 前提 / 関連Lesson
- 横断検索から到達可能
- PC / Smartphone表示
- Data / Link / 内容品質Validation

### 29.2 Phase 2

- 5段階理解状態
- 適応型復習
- 最近を重視した弱点判定
- 複数種類の学習履歴統合
- 手動苦手指定
- 判定理由表示
- 診断テスト
- 模試 / Case / Lessonから弱点へ反映
- 弱点から該当教材へ戻れる

### 29.3 Phase 3

- Interactive化候補を理解効果で選定
- 選定した教材がPC / Smartphoneで実用可能
- 操作しなくても最低限の説明を理解可能
- 操作教材がLesson内容と矛盾しない
- Error / Reset等の状態を処理する

## 30. サイト全体の完成条件

次をすべて満たして初めて全体完成扱いとする。

- [ ] Phase 1〜3を完了
- [ ] 主要利用フローが最後まで通る
- [ ] 主要機能に重大な既知Bugがない
- [ ] 全対象LessonがContent Quality基準を満たす
- [ ] Lesson / 用語 / 問題 / 公式問題の関連が正常
- [ ] Unit / Lesson再編Migrationを検証済み
- [ ] 既存学習Dataを不用意に失わない
- [ ] Backup / Restoreを検証済み
- [ ] PC主要画面を実表示確認
- [ ] Smartphone主要画面を実表示確認
- [ ] Loading / Empty / Error Stateを確認
- [ ] Keyboard / Focus等の基本Accessibilityを確認
- [ ] 大量教材でも初期表示が極端に重くない
- [ ] 必要な自動Validationが成功
- [ ] Dynamic主要RouteのVisual Reviewを実施
- [ ] GitHub Pages上の最終状態を確認
- [ ] README / REQUIREMENTS / 仕様書 / 作業報告等が最終実装と一致
- [ ] `PROJECT_LEARNINGS.md`へ再発防止価値の高い知見を反映
- [ ] 未確認事項があれば明記

「Codeを書いた」「Commitした」「CIの一部が通った」「教材件数が揃った」だけでは完成扱いにしない。

## 31. 未実装 / 未確認事項

この要件定義完了時点では、上記は**実装要件**であり、Phase 1〜3の新要件が実装済みであることを意味しない。

実装開始時に最低限確認する。

- 現在の全Unit / Lesson内容と再編候補
- 旧Lesson ID / URL / Storage進捗のMigration設計
- 現在のPractice / Case / Mock / Official mapping
- 現在のBrowser Screenshot / Responsive状態
- 2027年度正式制度が確定した時点で年度差分を再確認
- 公式過去問収録時は出典・改変表示を個別検証
- 現在の`README.md` / `docs/仕様書.md` / `json/project-meta.json`には旧名称`AP Study Notes`、旧Repository表記、`LEARNING`未採用等の実装前状態が残る。実装会話で現行コードと整合させながら更新する。

## 32. Implementation Handoff

- Status: Ready for implementation
- Requirements updated: 2026-09-05
- GitHub save verified: Yes
- Unresolved Core Decisions: None
- Unresolved High-cost Decisions: None
- Implementation conversation: `ap-study-guide（実装）`

実装会話では、過去会話の記憶を正本にせず、最新版 `EliteMay/web-project-guide` の `README.md` / `START_HERE.md` を確認した後、このRepositoryの `REQUIREMENTS.md`、`README.md`、`docs/仕様書.md`、`PROJECT_LEARNINGS.md`、関連実装を確認して進める。
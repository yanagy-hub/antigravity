# ループエンジニアリング定義ファイル群の作成実装計画

本計画は、`Loop_Engineering.md` に基づき、ループエンジニアリング（観察・評価・意思決定・実行の循環型自己改善プロセスの制御・運用）を実施するために必要な各種定義ファイルおよび実行サポートスクリプトを構築するためのものです。

ユーザー定義ルールに従い、**Johnny.Decimal形式（`NN_Name`）** を厳守して各種ファイルを配置します。

---

## ユーザーレビューが必要な事項

> [!IMPORTANT]
> - **配置ディレクトリ**: プロジェクトルート `/Users/tatsuya/Antigravity/` 直下に Johnny.Decimal ディレクトリ（`00_Config`, `10_Loop_Definitions`, `90_System`）を新設し定義ファイルを配置します。
> - **ルール準拠**: ディレクトリ追加に伴い、`00_Config/Vault_Structure.md` を作成・最新化します。またスクリプトは `90_System/91_Scripts/` に配置します。

---

## 提案する変更内容

### 1. 構成管理・基本設定 (`00_Config/`)

#### [NEW] [Vault_Structure.md](file:///Users/tatsuya/Antigravity/00_Config/Vault_Structure.md)
Johnny.Decimal 構造の定義書。各フォルダの番号、プレフィックス、役割の説明を記録します。

#### [NEW] [Loop_Config.json](file:///Users/tatsuya/Antigravity/00_Config/Loop_Config.json)
ループエンジニアリング全般で利用するグローバル設定・制御パラメータ（最大試行回数 `max_retries`、トークン・コスト予算 `max_budget`、タイムアウト `timeout_seconds`、評価閾値など）の定義ファイル。

---

### 2. ループ構造・評価・ガードレール定義 (`10_Loop_Definitions/`)

#### [NEW] [Loop_Definition_Template.md](file:///Users/tatsuya/Antigravity/10_Loop_Definitions/Loop_Definition_Template.md)
新しいループ処理（Observe / Evaluate / Decide / Act）を定義する際の標準テンプレート仕様書。

#### [NEW] [Auto_BugFix_Loop_Def.md](file:///Users/tatsuya/Antigravity/10_Loop_Definitions/Auto_BugFix_Loop_Def.md)
「自動バグ修正＆テスト検証ループ」の具体的実践定義ファイル（入力・観察データ・評価器条件・意思決定プロンプト・実行コマンド・終了条件・ログ管理方針を明確化）。

#### [NEW] [Evaluator_Rules.md](file:///Users/tatsuya/Antigravity/10_Loop_Definitions/Evaluator_Rules.md)
評価（Evaluate）ステップで用いる「決定論的評価（テスト、Linter、型チェック）」および「確率論的評価（LLM評価、スコアリングルーブリック）」の判定ルール・スコア閾値の定義ファイル。

#### [NEW] [Guardrails_Config.md](file:///Users/tatsuya/Antigravity/10_Loop_Definitions/Guardrails_Config.md)
無限ループ検知、同じエラーの連続発生時の対応、回帰テスト必須化、安全停止条件などのガバナンスルール定義ファイル。

---

### 3. システム・スクリプト (`90_System/91_Scripts/`)

#### [NEW] [loop_runner.py](file:///Users/tatsuya/Antigravity/90_System/91_Scripts/loop_runner.py)
`Loop_Config.json` および定義ファイルを読み込み、ループの終了条件判定やステータス管理、ログ記録をシミュレーション/制御するためのサポートスクリプト（日本語コメント付き）。

---

## 依存関係および内部リンクへの影響

- `Loop_Engineering.md` から各定義ファイル（`00_Config/Loop_Config.json`, `10_Loop_Definitions/Auto_BugFix_Loop_Def.md` 等）へリンク参照が可能な構造とします。
- ディレクトリ構成を変更したため、直ちに `00_Config/Vault_Structure.md` を作成・更新して整合性を維持します。

---

## 検証計画

### 自動検証・動作確認
- `90_System/91_Scripts/loop_runner.py` を zsh 環境下で実行（サンドボックス）し、`Loop_Config.json` の構文検証およびループ判定シミュレーションが正常動作することを確認します。

### 手動確認
- 作成した各 Markdown および JSON 定義ファイルの整合性、フォーマット、内部リンクが正しく機能しているかを確認します。

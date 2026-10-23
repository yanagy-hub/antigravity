# Vault ディレクトリ構造定義書 (Vault_Structure.md)

本ドキュメントは、Johnny.Decimal (`NN_Name`) 形式に基づく Vault のディレクトリ構造および各種フォルダの役割を定義する構成管理ファイルです。

---

## ディレクトリ一覧と役割定義

| プレフィックス | フォルダ名 / ファイル名 | 役割・説明 |
| :--- | :--- | :--- |
| **`00`** | `00_Config/` | Vault全体の設定ファイル、構成管理ドキュメント、グローバルパラメータの格納場所 |
| | ├── `Vault_Structure.md` | Vault全体のディレクトリ構造定義・構成管理ファイル |
| | └── `Loop_Config.json` | ループエンジニアリング全般の共通設定・パラメータ定義ファイル |
| **`00`** | `00_System/` | システム一次領域および一時ファイル格納場所（AI憲法ルール準拠） |
| | └── `Temporary/` | 一時的なコード・リスト・中間成果物の格納ディレクトリ |
| **`10`** | `10_Loop_Definitions/` | ループエンジニアリングに必要な仕様定義ファイルおよびドキュメントの格納場所 |
| | ├── `Loop_Engineering.md` | ループエンジニアリング完全ガイド・総合ドキュメント |
| | ├── `Loop_Definition_Template.md` | 新規ループ作成用の標準テンプレート |
| | ├── `Auto_BugFix_Loop_Def.md` | 自動バグ修正＆テスト検証ループの具体的定義書 |
| | ├── `Evaluator_Rules.md` | 評価器（決定論的・確率論的評価）の判定基準・スコアリングルール |
| | ├── `Guardrails_Config.md` | ループ実行の暴走・品質低下を防ぐガバナンス規定書 |
| | ├── `Loop_Engineering_Implementation_Plan.md` | ループエンジニアリング定義ファイル群作成の実装計画書 |
| | └── `Loop_Engineering_Walkthrough.md` | ループエンジニアリング定義ファイル群作成の完了報告書 |
| **`20`** | `20_Workspace/` | 開発レイヤー（ソースコード、Webアプリケーション、実験的コード等のワークスペース） |
| | ├── `Dev/` | メイン開発プロジェクト領域（アプリケーション実装） |
| | ├── `journal-app/` | 簡易ジャーナルWebアプリケーション（Modern Journal App） |
| | ├── `graph-studio/` | Graph Engineering 実行・可視化Webアプリケーション（Graph Studio） |
| | ├── `english-coach-app/` | 英語学習支援Webアプリケーション（English Coach App） |
| | └── `bq-vector-visualizer/` | BigQueryベクトル情報可視化・探索Webアプリケーション（BQ Vector Visualizer） |
| **`30`** | `30_Document/` | 文章管理レイヤー（プロジェクトのルール、仕様書、ナレッジ、ノート管理） |
| | ├── `01_Rules/` | 運用ルール・コーディング規約（`01_Directory_Structure.md`, `04_Custom_Agents_Guide.md` 等） |
| | ├── `GCP_AI_Agent_Environment_Guide.md` | GCPでのAI Agent環境構築・費用試算・Docsチケット駆動運用設計書 |
| | ├── `Graph_Engineering/` | グラフエンジニアリング総合ガイド・5ステージ技術探究ノート群 |
| | ├── `Journal/` | ジャーナルWebアプリと双方向同期されたObsidian互換Markdownノート群 |
| | ├── `English_Learning/` | 英語学習支援アプリと双方向同期された学習ノート・フレーズ集・添削ログ群 |
| | └── `93_Temporary/` | 一時作業用ドキュメント保管場所 |
| **`40`** | `40_Management/` | プロジェクト・タスク管理、ロードマップ、ミーティング議事録の格納場所 |
| | ├── `41_Plans/` | プラン・エージェントが策定した要件定義・実装計画書（`PLAN-*.md`） |
| | ├── `42_Tasks/` | スーパーバイズが発行した個別タスク仕様書（`TASK-*.md`）およびタスク進捗ボード（`Task_Board.md`） |
| | ├── `43_Plan_Reviews/` | プランレビュー・エージェントの検証記録・最高3回反復およびエスカレーション履歴（`PREV-*.md`, 旧 `REV-*.md`） |
| | └── `44_Work_Reviews/` | ワークレビュー・エージェントの成果物合致性審査・差し戻し記録（`WREV-*.md`） |
| **`50`** | `50_Library/` | 外部の参考資料、論文、技術記事アーカイブ（AI原則読み取り専用） |
| **`60`** | `60_Assets/` | ドキュメント・Webアプリ用の画像、図表、メディア素材の格納場所 |
| **`70`** | `70_Templates/` | 定型ドキュメント用Markdownテンプレートの格納場所 |
| | ├── `TPL_Implementation_Plan.md` | プラン・エージェント用要件・計画書標準テンプレート |
| | ├── `TPL_Plan_Review.md` | プランレビュー用厳格評価テンプレート（最高3回反復・エスカレーション規定） |
| | ├── `TPL_Work_Review.md` | ワークレビュー用成果物合致性審査テンプレート（差し戻しループ・最大5回ガードレール） |
| | ├── `TPL_Supervision_Task.md` | スーパーバイズ・エージェント用タスク仕様・アサインテンプレート |
| | ├── `TPL_Task_Board.md` | カンバン形式タスク進捗管理ボードテンプレート |
| | └── `TPL_Review_Report.md` | レガシー互換用レビュー報告書テンプレート |
| **`90`** | `90_System/` | システム管理用ディレクトリ |
| `90` -> `91` | `90_System/91_Scripts/` | ループ処理や検証を行う実行スクリプト・自動化コードの格納場所 |
| | ├── `graph_engine/` | StateGraphコア実行エンジン、ナレッジ解析、Canvas出力パッケージ |
| | ├── `vault_governance.py` | Johnny.Decimal規約・リンク切れ・Vault構成整合性診断スクリプト |
| | ├── `knowledge_curator.py` | 外部情報・論文からテンプレート準拠ナレッジノートを生成するスクリプト |
| | ├── `agent_manager.py` | 5大エージェント（プラン、プランレビュー、スーパーバイズ、ワーク、ワークレビュー）＋専門群を管理するCLIモジュール |
| | ├── `journal_sync.py` | Obsidian VaultとJournal Webアプリの双方向同期・Markdown変換CLI |
| | ├── `english_coach_sync.py` | Obsidian VaultとEnglish Coach Appの双方向同期・Markdown変換CLI |
| | ├── `loop_runner.py` | 定義パラメータの読み込みとループ判定ロジックを検証するPythonスクリプト |
| | ├── `test_output_parser.py` | テスト失敗ログの構造化解析スクリプト |
| | ├── `reflection_generator.py` | 過去の修正試行から反省プロンプトを生成するスクリプト |
| | ├── `regression_checker.py` | テスト結果比較とデグレ時のロールバック判定スクリプト |
| | ├── `loop_guardrail.py` | ループ試行回数上限・安全ガードレール監視スクリプト |
| | └── `git_sync.py` | Gitステータス・差分を取得・整理する一括同期ヘルパースクリプト |
| `90` -> `93` | `90_System/93_Temporary/` | 一時的な作業ファイルや実行ログ、中間データの格納場所 |

---

## 変更履歴
- **2026-07-31**: ループエンジニアリング定義ファイル群の構築に伴い、初期構成（`00_Config`, `10_Loop_Definitions`, `90_System`）を定義・作成。
- **2026-08-04**: ディレクトリ構造のルール定義改定に伴い、`20_Workspace`（開発）、`30_Document`（文章管理）、`40_Management`（タスク管理）、`50_Library`（参考資料）、`60_Assets`（素材）、`70_Templates`（テンプレート）を追加・整理して最新化。ルート直下の `Loop_Engineering*.md` を `10_Loop_Definitions/` へ集約。
- **2026-08-04**: 各種開発内容を `20_Workspace/<アプリ名>/` 配下に作成する運用規則および各ディレクトリの作成・管理ルールを `01_Directory_Structure.md` および `Vault_Structure.md` に明記・最新化。
- **2026-08-04**: Git一括同期スキル（`git-sync`）およびヘルパースクリプト（`git_sync.py`）の追加、Loop開発時のルール参照義務を明記し最新化。
- **2026-08-04**: 簡易ジャーナルWebアプリ（`20_Workspace/journal-app/`）を新規構築し、構成定義に追記・最新化。
- **2026-08-25**: Graph Engineering 実行・可視化環境の構築・移設に伴い、`20_Workspace/graph-studio/`、`30_Document/Graph_Engineering/`、`90_System/91_Scripts/graph_engine/`、およびエージェントスキルを追加・最新化。
- **2026-08-25**: ワークスペース特化の6大カスタムエージェント（スキル群）、支援スクリプト群（`vault_governance.py`, `knowledge_curator.py`, `agent_manager.py`）、および運用ガイド（`04_Custom_Agents_Guide.md`）を追加・最新化。
- **2026-09-05**: 4層サブエージェント協調モデル（Plan-Review-Supervise-Specialist）の構築に伴い、`40_Management/` 配下に `41_Plans/`, `42_Tasks/`, `43_Reviews/` を新設。`70_Templates/` に標準テンプレート群を追加し、エージェント定義（`agent_manager.py`）を最新化。
- **2026-09-05**: Journal Web App のリファクタリングおよび3大機能拡張に伴い、`30_Document/Journal/`（Obsidianノート同期先）および `90_System/91_Scripts/journal_sync.py`（同期CLI）を定義に追加・最新化。
- **2026-09-08**: GCP上のAI Agent環境構築、月額費用試算、およびGoogle Docsチケット駆動運用設計書（`30_Document/GCP_AI_Agent_Environment_Guide.md`）を追加・構成定義を最新化。
- **2026-09-22**: 5役2ループ構成の開発サブエージェント体制（Plan, Plan Review, Supervisor, Work, Work Review）の導入に伴い、`40_Management/` 配下に `43_Plan_Reviews/`, `44_Work_Reviews/` を整備。`70_Templates/` に `TPL_Plan_Review.md` および `TPL_Work_Review.md` を新設し、構成管理ドキュメントを最新化。
- **2026-09-22**: 英語学習支援Webアプリケーション構築（`PLAN-20260922-01`）に伴い、`20_Workspace/english-coach-app/`、`30_Document/English_Learning/`、および同期CLI `90_System/91_Scripts/english_coach_sync.py` を定義に追加・最新化。
- **2026-10-19**: BigQueryベクトル情報可視化・探索Webアプリケーション構築（`PLAN-20261019-01`）に伴い、`20_Workspace/bq-vector-visualizer/` を定義に追加・最新化。

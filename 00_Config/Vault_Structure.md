# Vault ディレクトリ構造定義書 (Vault_Structure.md)

本ドキュメントは、Johnny.Decimal (`NN_Name`) 形式に基づく Vault のディレクトリ構造および各種フォルダの役割を定義する構成管理ファイルです。

---

## ディレクトリ一覧と役割定義

| プレフィックス | フォルダ名 / ファイル名 | 役割・説明 |
| :--- | :--- | :--- |
| **`00`** | `00_Config/` | Vault全体の設定ファイル、構成管理ドキュメント、グローバルパラメータの格納場所 |
| | ├── `Vault_Structure.md` | Vault全体のディレクトリ構造定義・構成管理ファイル |
| | └── `Loop_Config.json` | ループエンジニアリング全般の共通設定・パラメータ定義ファイル |
| **`10`** | `10_Loop_Definitions/` | ループエンジニアリングに必要な仕様定義ファイルおよびドキュメントの格納場所 |
| | ├── `Loop_Definition_Template.md` | 新規ループ作成用の標準テンプレート |
| | ├── `Auto_BugFix_Loop_Def.md` | 自動バグ修正＆テスト検証ループの具体的定義書 |
| | ├── `Evaluator_Rules.md` | 評価器（決定論的・確率論的評価）の判定基準・スコアリングルール |
| | ├── `Guardrails_Config.md` | ループ実行の暴走・品質低下を防ぐガバナンス規定書 |
| | ├── `Loop_Engineering_Implementation_Plan.md` | ループエンジニアリング定義ファイル群作成の実装計画書 |
| | └── `Loop_Engineering_Walkthrough.md` | ループエンジニアリング定義ファイル群作成の完了報告書（検証結果含む） |
| **`90`** | `90_System/` | システム管理用ディレクトリ |
| `90` -> `91` | `90_System/91_Scripts/` | ループ処理や検証を行う実行スクリプト・自動化コードの格納場所（コード作成の指定先） |
| | └── `loop_runner.py` | 定義パラメータの読み込みとループ判定ロジックを検証するPythonスクリプト |
| `90` -> `93` | `90_System/93_Temporary/` | 一時的な作業ファイルや実行ログ、中間データの格納場所 |

---

## 変更履歴
- **2026-07-31**: ループエンジニアリング定義ファイル群の構築に伴い、初期構成（`00_Config`, `10_Loop_Definitions`, `90_System`）を定義・作成。
- **2026-07-31**: 実装計画書 (`Loop_Engineering_Implementation_Plan.md`) および完了報告書 (`Loop_Engineering_Walkthrough.md`) を `10_Loop_Definitions/` 配下にドキュメント資産として追記保存。

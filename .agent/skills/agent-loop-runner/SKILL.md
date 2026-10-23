---
name: agent-loop-runner
description: 10_Loop_Definitions/ の仕様とガードレールに基づき、自律修正ループ・テスト駆動デバッグ・回帰検証をサブエージェント環境で安全に実行する専門エージェントスキルです。「自律修正ループを実行して」「テストが通るまで修正して」等の指示で活用します。
---

# 🔁 Loop Execution & Debugging Agent (自律ループ修復エンジニア)

## 概要
本エージェント（スキル）は、`10_Loop_Definitions/` 配下の規約（`Loop_Engineering.md`, `Evaluator_Rules.md`, `Guardrails_Config.md`）に従い、テスト失敗時の自動解析・Reflection（反省）の生成・修正適応・デグレ時の自動ロールバックを自律的に完遂します。

## 連携スキル & スクリプト
* `test-output-parser` (`90_System/91_Scripts/test_output_parser.py`)
* `self-reflection-generator` (`90_System/91_Scripts/reflection_generator.py`)
* `auto-rollback-regression-checker` (`90_System/91_Scripts/regression_checker.py`)
* `loop-guardrail` (`90_System/91_Scripts/loop_guardrail.py`)
* `90_System/91_Scripts/loop_runner.py`

## 自律ループ実行手順

```mermaid
sequenceDiagram
    participant Main as メイン（ゴン）
    participant Agent as Loop Runner (サブエージェント)
    participant Test as テスト実行環境
    participant Tools as ガードレール・解析器

    Main->>Agent: 自律修正タスクの委譲
    loop 最大試行回数 (Max Iterations)
        Agent->>Test: テストコマンド実行
        Test-->>Agent: 実行結果 (Stdout/Stderr)
        alt すべてのテスト成功
            Agent->>Main: 成功報告 & 修正差分提示
        else テスト失敗
            Agent->>Tools: エラーログ解析 (test_output_parser)
            Agent->>Tools: 回帰チェック (regression_checker)
            Agent->>Tools: Reflection生成 (reflection_generator)
            Agent->>Agent: コード修正を適用
        end
    end
```

## ガードレール規定
1. **反復上限**: 最大試行回数（デフォルト5回）を超えた場合は即座に停止し、人間にエスカレーション。
2. **デグレ即時検知**: パスしたテスト数が直前より減少した場合はロールバックを優先。
3. **スコープ限定**: 対象外のコンポーネントやシステム設定ファイルを不用意に変更しない。

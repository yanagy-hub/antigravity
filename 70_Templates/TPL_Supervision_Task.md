---
id: TASK-{{DATE}}-{{ID}}-{{SEQ}}
title: "{{TASK_TITLE}}"
plan_ref: "[[40_Management/41_Plans/PLAN-{{DATE}}-{{ID}}]]"
parent_task_board: "[[40_Management/42_Tasks/Task_Board]]"
status: ToDo # ToDo | In Progress | In Review | Done | Blocked
priority: High # High | Medium | Low
assigned_agent: {{SPECIALIST_AGENT}} # app_developer | vault_governance | graph_architect | knowledge_curator | loop_runner | git_operations | other
created_at: {{DATETIME}}
completed_at: 
tags:
  - task
  - execution
---

# 🛠️ タスク仕様書: {{TASK_TITLE}}

## 1. 基本情報
- **親計画書**: [[40_Management/41_Plans/PLAN-{{DATE}}-{{ID}}]]
- **担当スペシャリスト**: `{{SPECIALIST_AGENT}}`
- **優先度**: `{{PRIORITY}}`
- **現在ステータス**: `{{STATUS}}`

## 2. タスク概要・目的
- 

## 3. 前提条件と依存タスク
- **事前完了が必要なタスク**:
  - [ ] [[40_Management/42_Tasks/TASK-{{DATE}}-{{ID}}-XX]] (未着手/完了)
- **環境・前提条件**: 

## 4. 完了定義 (Definition of Done: DoD)
担当スペシャリストは、以下の条件をすべて満たした時点で完了とみなします：
- [ ] 指定されたファイル群の作成・修正が完了していること
- [ ] ビルドまたはテスト検証コマンドがエラーなく成功すること
- [ ] ガバナンス規約（Johnny.Decimal、ディレクトリ分離等）を遵守していること
- [ ] 完了報告（成果物一覧と確認結果）を本ドキュメントに追記すること

## 5. 作業手順・ステップ
1. **Step 1**: 
2. **Step 2**: 
3. **Step 3**: 

## 6. 検証方法
- 実行コマンド:
```bash
# 検証用コマンド
```
- 期待される結果:

---

## 7. 担当スペシャリスト作業ログ・完了報告
※ スペシャリスト実行後に記載

- **作業実施日**: 
- **変更ファイル一覧**:
  - `path/to/file`
- **検証結果**:
  - 
- **特記事項・次タスクへの引き継ぎ**:
  - 

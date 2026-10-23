---
id: TASK-BOARD-{{DATE}}-{{ID}}
title: "タスク進捗ボード: {{PLAN_TITLE}}"
plan_ref: "[[40_Management/41_Plans/PLAN-{{DATE}}-{{ID}}]]"
supervisor: Supervisor Agent
updated_at: {{DATETIME}}
tags:
  - taskboard
  - management
---

# 📊 タスク進捗ボード: {{PLAN_TITLE}}

- **対象計画書**: [[40_Management/41_Plans/PLAN-{{DATE}}-{{ID}}]]
- **統括スーパーバイザー**: Supervisor Agent
- **最終更新日時**: {{DATETIME}}

---

## 全体進捗サマリー
- **進捗率**: `0% (0 / 0 Done)`
- **アクティブブロッカー**: なし

| 区分 | 件数 | 備考 |
| :--- | :--- | :--- |
| ⏳ **ToDo** | 0 | 着手待ち |
| 🚧 **In Progress** | 0 | スペシャリスト作業中 |
| 🧪 **In Verification** | 0 | 動作検証中 |
| ✅ **Done** | 0 | 完了基準（DoD）達成 |
| 🛑 **Blocked** | 0 | 前提待ち・エラー等 |

---

## タスクカンバン

### ⏳ ToDo (未着手)
- [ ] [[40_Management/42_Tasks/TASK-{{DATE}}-{{ID}}-01]] - タスク1概要 (担当: `{{SPECIALIST}}`, 優先度: `High`)

### 🚧 In Progress (作業中)
- [ ] [[40_Management/42_Tasks/TASK-{{DATE}}-{{ID}}-02]] - タスク2概要 (担当: `{{SPECIALIST}}`)

### 🧪 In Verification (検証中)
- [ ] [[40_Management/42_Tasks/TASK-{{DATE}}-{{ID}}-03]] - タスク3概要 (担当: `{{SPECIALIST}}`)

### ✅ Done (完了)
- [x] [[40_Management/42_Tasks/TASK-{{DATE}}-{{ID}}-00]] - 完了タスク概要 (担当: `{{SPECIALIST}}`)

### 🛑 Blocked (中断・障害)
- *現在ブロックされているタスクはありません。*

---

## スペシャリスト稼働状況
| スペシャリスト | 担当領域 | 割当タスク数 | 稼働状態 |
| :--- | :--- | :--- | :--- |
| `app_developer` | Webアプリ開発 | 0 | アイドル |
| `vault_governance` | 規約・リンク整合性 | 0 | アイドル |
| `graph_architect` | トポロジー・Canvas | 0 | アイドル |
| `knowledge_curator` | 外部リサーチ・文献整理 | 0 | アイドル |
| `loop_runner` | 自律デバッグ・修正ループ | 0 | アイドル |
| `git_operations` | Git同期・コミット | 0 | アイドル |

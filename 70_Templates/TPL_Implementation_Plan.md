---
id: PLAN-{{DATE}}-{{ID}}
title: "{{TITLE}}"
status: Draft # Draft | In Review | Review Approved | User Approved | Rejected | Escalated
created_at: {{DATETIME}}
updated_at: {{DATETIME}}
author: Planner Agent
reviewer: Reviewer Agent
review_round: 0 # 現在のレビュー回数 (0-5)
review_file: "[[40_Management/43_Reviews/REV-{{DATE}}-{{ID}}]]"
supervisor_task_file: "[[40_Management/42_Tasks/TASK-{{DATE}}-{{ID}}]]"
tags:
  - plan
  - management
---

# 📋 計画書: {{TITLE}}

## 1. 概要・背景
- **目的**: 
- **背景・現状の課題**: 
- **達成目標 (ゴール)**: 

## 2. 要件定義
### 2.1 機能要件 (Must / Should / Want)
- [ ] **FR-01**: 
- [ ] **FR-02**: 

### 2.2 非機能要件 (制約・セキュリティ・品質)
- **Johnny.Decimal規約**: フォルダ構成・ファイル配置が規約に準拠しているか
- **破壊的変更の防止**: 既存資産・他アプリへの影響を局所化できているか
- **セキュリティ・権限**: ワークスペース外へのアクセスや危険な操作がないか

## 3. スコープ
### 3.1 今回対応すること (In Scope)
- 

### 3.2 今回対応しないこと (Out of Scope)
- 

## 4. 変更対象ファイルおよび影響範囲
| 操作種別 | 対象パス | 変更概要 | 波及影響 |
| :--- | :--- | :--- | :--- |
| `[NEW]` | `パス` | 新規作成 | なし |
| `[MODIFY]` | `パス` | 一部修正 | 関連スクリプト確認要 |
| `[DELETE]` | `パス` | 削除 | 参照元リンク要更新 |

## 5. 前提条件と依存関係
- **前提条件**: 
- **依存する他タスク/資産**: 

## 6. テスト・検証戦略
### 6.1 自動テスト・コマンド検証
- 実行コマンド: `npm test` または `python3 ...`
- 期待結果: 

### 6.2 目視・動作確認
- 確認手順: 
- 判定基準: 

## 7. リスクと対策
| 想定リスク | 影響度 (高/中/低) | 対策・回避策 |
| :--- | :--- | :--- |
| 例: 既存リンクの破損 | 中 | vault_governance によるリンク整合性診断を実施 |

---

## 8. レビュー履歴
- **第1回**: [[40_Management/43_Reviews/REV-{{DATE}}-{{ID}}#Round-1]] - 結果: 
- **第2回**: [[40_Management/43_Reviews/REV-{{DATE}}-{{ID}}#Round-2]] - 結果: 

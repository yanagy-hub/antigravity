---
id: WREV-{{DATE}}-{{ID}}
title: "ワークレビュー報告書: {{TITLE}}"
task_ref: "[[40_Management/42_Tasks/TASK-{{DATE}}-{{ID}}]]"
plan_ref: "[[40_Management/41_Plans/PLAN-{{DATE}}-{{ID}}]]"
status: Under Review # Under Review | Approved | Rejected (Rework) | Escalated
current_iteration: 1 # 現在の差し戻し回数 (最大5回)
final_decision: Pending # Approved | Rejected | Escalated
reviewed_at: {{DATETIME}}
reviewer: Work Reviewer Agent
tags:
  - review
  - work-review
  - quality-gate
  - delivery
---

# 🧐 ワークレビュー報告書: {{TITLE}}

- **対象タスク**: [[40_Management/42_Tasks/TASK-{{DATE}}-{{ID}}]]
- **対象計画書**: [[40_Management/41_Plans/PLAN-{{DATE}}-{{ID}}]]
- **担当ワーカー**: `{{WORKER_NAME}}`
- **現在の差し戻し回数**: {{ITERATION}} / 5 （最大5回ガードレール）
- **総合判定**: `{{STATUS}}` (APPROVED / REJECTED_FOR_REWORK / ESCALATED)

> [!IMPORTANT]
> **【原則】ワークレビューが OK (APPROVED) を出すまで、納品は許可されず、ワークに差し戻します。**
> ワークが作成した成果物（コード、設定、ドキュメント、動作検証ログ）が、計画書およびタスク仕様に厳密に合致しているかを細かくレビューします。

---

## 成果物検証チェックリスト (計画合致性 ＆ 実装品質)

### 1. 計画・仕様合致性 (Specification Conformity)
- [ ] 計画書（PLAN-*.md）およびタスク仕様（TASK-*.md）の要件が漏れなく網羅されているか
- [ ] 仕様と異なる独自実装や勝手な機能省略・仕様変更が行われていないか
- [ ] エッジケース（例外処理・境界値・データ0件時等）が正しく実装されているか

### 2. コード品質・ディレクトリ規約 (Code Quality & Governance)
- [ ] 開発資産は `20_Workspace/<アプリ名>/` 内に閉じており、ルート汚染がないか
- [ ] スクリプトは `90_System/91_Scripts/` 配下に配置されているか
- [ ] 一時ファイルは `90_System/93_Temporary/` 配下に格納されているか
- [ ] コードコメントは原則「日本語」で記述され、保守性が確保されているか
- [ ] ディレクトリ新設・変更があった場合、`00_Config/Vault_Structure.md` が更新されているか

### 3. テスト通過・動作検証 (Verification & No Regression)
- [ ] ビルドコマンド（`npm run build`, `tsc` 等）がエラー・警告ゼロで正常通過しているか
- [ ] 単体・結合テスト（`npm test`, `pytest` 等）がすべて PASS しているか
- [ ] 既存機能に対するデグレ（リグレッション）が発生していないか
- [ ] 動作確認ログやスクリーンショット等のエビデンスが提示されているか

---

## 審査履歴・差し戻し記録

### 試行 {{ITERATION}} 回目 ({{DATETIME}})
- **判定**: `{{ITERATION_DECISION}}` (合格: PASS / 差し戻し: REWORK / エスカレーション: ESCALATE)
- **合致性・品質の検証結果**:
  - 計画合致度: `{{CONFORMITY_RATE}}%`
  - テスト結果: `{{TEST_RESULTS}}`
- **未達・不適合事項**:
  1. **[仕様不一致/品質不足/テスト未達] 指摘1**:
     - *計画書の要求*: 
     - *成果物の実態*: 
     - *差し戻し修正要求*: 
  2. **[仕様不一致/品質不足/テスト未達] 指摘2**:
     - *計画書の要求*: 
     - *成果物の実態*: 
     - *差し戻し修正要求*: 
- **ワーク（Worker）へのアクション指示**:
  - 上記の不適合事項を修正の上、再度ビルド・テスト検証を実行し、成果物を再提出すること。

---

## 🚨 5回超過時エスカレーション記録 (Escalation to User)
※ 5回差し戻しても合格基準を満たさない場合のみ記入

- **エスカレーション発生日時**: {{ESCALATION_DATETIME}}
- **エスカレーション理由**: ワークへの5回差し戻し後も合格基準を満たさず
- **解決困難な課題・原因**:
  - 課題内容: 
  - ワーク側の困難理由: 
- **タツヤさんへの判断仰ぎ事項**:
  - [ ] 方針変更・技術選定の見直し
  - [ ] 仕様の緩和・スコープ調整

---
name: agent-git-operations
description: Gitの変更差分分析、Conventional Commits準拠の日本語コミットメッセージ自動生成、および安全な一括同期（add/commit/push）を実行する専門エージェントスキルです。「gitをお願い」「git同期」「コミットして」等の指示で活用します。
---

# 🚀 Git Sync & Operations Agent (Git運用・リリースエージェント)

## 概要
本エージェント（スキル）は、Git操作に伴う細かい確認ステップを自動化し、変更ステータスと差分を瞬時に整理して、明快な日本語コミットメッセージとともに「一括承認依頼」を提示・実行します。

## 動作フロー

```mermaid
sequenceDiagram
    participant User as タツヤさん
    participant Agent as Git Operations Agent
    participant Git as Gitリポジトリ

    User->>Agent: 「gitをお願い」「git同期」
    Agent->>Git: git status & git diff 解析 (git_sync.py)
    Git-->>Agent: 変更差分
    Agent->>User: 変更概要・提案コミットメッセージ・実行予定コマンドの一括提示
    User->>Agent: 「OK」「実行して」
    Agent->>Git: git add / git commit / git push
    Git-->>Agent: 完了
    Agent->>User: コミットID・プッシュ完了報告
```

## 実行支援コマンド
```bash
python3 "90_System/91_Scripts/git_sync.py"
```

## コミットメッセージ規約（Conventional Commits 日本語形式）
- `feat`: 新機能や新規エージェント/スキルの追加
- `fix`: バグ修正、リンク切れ修正、エラー解消
- `docs`: ドキュメント作成・更新、ルール改定
- `refactor`: リファクタリング、構成整理
- `test`: テストコードの追加・修正
- `chore`: 設定ファイル更新、細かなメンテナンスタスク

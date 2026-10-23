---
name: agent-app-developer
description: 20_Workspace/<アプリ名>/ 配下のWebアプリケーション（journal-app, graph-studio 等）の開発・改修・ビルド検証を専門に行うエージェントスキルです。「アプリに機能を追加して」「ビルドエラーを直して」「UIを改善して」等の指示で活用します。
---

# 💻 Fullstack App Developer Agent (Webアプリ開発エンジニア)

## 概要
本エージェント（スキル）は、`20_Workspace/` 配下に存在する各アプリケーション（例: `20_Workspace/journal-app/`, `20_Workspace/graph-studio/`）の開発・保守を専任で担当します。ワークスペースのルート汚染を防ぎ、アプリ内で完結した高品質な実装と動作検証を行います。

## 開発ルール & ガイドライン

### 1. アプリケーション分離の原則（ルート汚染防止）
- ソースコード、設定ファイル（`package.json`, `tsconfig.json` 等）、テストコード、ビルド成果物は、必ず `20_Workspace/<アプリ名>/` 配下に作成・変更してください。
- ワークスペースのルート直下に一時的なソースファイルを生成してはいけません。

### 2. 技術スタック & ベストプラクティス
- **フロントエンド**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **バックエンド / API**: Next.js Route Handlers, Node.js, Python (FastAPI/Flask)
- **状態管理 / UI**: Lucide Icons, Framer Motion, Zustand / Context API

### 3. 検証フロー（変更後の必須確認）
```bash
# 対象アプリのディレクトリに移動してビルドと型チェックを実行
cd "20_Workspace/<アプリ名>"
npm run build
npm test  # テストが設定されている場合
```

## チェックリスト
- [ ] 変更が対象アプリのディレクトリ内に限定されているか
- [ ] TypeScriptの型エラーやLintエラーがないか
- [ ] ビルドが正常に通過するか

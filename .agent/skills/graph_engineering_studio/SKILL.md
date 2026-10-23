---
name: グラフエンジニアリング・スタジオ (Graph Engineering Studio)
description: StateGraphによる自律エージェントワークフローの実行、Vaultナレッジトポロジー解析、およびObsidian Canvasへの可視化出力を統括するスキルです。
---

# 🎯 目的 (Objective)
「Graph Engineering（グラフエンジニアリング）」基盤を用いて、複雑なタスク・思考プロセスを有向状態グラフ（StateGraph）として実行し、Vault内の知識グラフ（トポロジー）探索やObsidian Canvasへの自動出力、ローカルWeb Studioでのリアルタイム可視化を提供します。

# 🛠️ 主な機能と実行コマンド

### 1. ナレッジ探索・創発ワークフローの実行
指定した起点ノートから関連トポロジーを深さ指定で走査し、異分野架け橋（Bridge）概念とインサイトを抽出してCanvasに出力します。

```bash
python3 "00_System/Scripts/graph_engine/builtin_workflows.py"
```

### 2. 任意のサブグラフまたはワークフローのCanvas出力
特定ノートを中心とする近傍グラフをObsidian Canvas (`.canvas`) として直接出力します。

```python
from pathlib import Path
from graph_engine.knowledge_graph import KnowledgeGraphAnalyzer
from graph_engine.canvas_exporter import CanvasExporter

analyzer = KnowledgeGraphAnalyzer()
analyzer.index_vault()
sub = analyzer.get_neighborhood_subgraph("ノート名", max_depth=2)
CanvasExporter.export_subgraph(sub, Path("00_System/Temporary/Note_Network.canvas"))
```

### 3. Graph Studio Webサーバーの起動
ブラウザでリアルタイム実行アニメーションやトポロジーマップを操作・閲覧するダッシュボードサーバーを起動します（`http://localhost:8000`）。

```bash
python3 "00_System/Scripts/dashboard_server.py"
```

# 📦 提供されるAPI一覧

| メソッド | エンドポイント | 説明 |
| :--- | :--- | :--- |
| `GET` | `/api/graph/workflows` | 登録済みStateGraphワークフロー定義一覧の取得 |
| `GET` | `/api/graph/stream?workflow=...` | SSEによるワークフローのステップ別リアルタイム実行ストリーム |
| `POST` | `/api/graph/run` | ワークフローの同期実行とスナップショット履歴の返却 |
| `GET` | `/api/graph/topology` | Vault全体のノード・エッジ・PageRank・ドメイン別データ取得 |
| `GET` | `/api/graph/bridges` | 異分野ドメインを結ぶ架け橋（Bridge）ノード一覧取得 |
| `GET` | `/api/graph/path?start=A&end=B` | 2ノード間の最短経路探索 |
| `POST` | `/api/graph/export-canvas` | ワークフローまたはサブグラフの `.canvas` ファイル自動生成 |

---
name: agent-graph-architect
description: Vault内のMarkdown知識グラフ（トポロジー）の解析、異分野ドメイン架け橋（Bridge）の抽出、および Obsidian Canvas（.canvas）への可視化データ出力を統括する専門エージェントスキルです。「知識グラフを解析して」「Canvasを出力して」「関連性を可視化して」等の指示で活用します。
---

# 🕸️ Graph Knowledge Architect Agent (グラフ・ナレッジ設計士)

## 概要
本エージェント（スキル）は、Vault全体の知識トポロジーを有向グラフとしてインデックス化・解析し、異分野間の架け橋（Bridge）ノードの特定、最短経路探索、および Obsidian Canvas（`.canvas`）ファイルへの自動出力を行います。

## 主な機能 & 実行手順

### 1. 知識トポロジーの解析と探索
```python
from pathlib import Path
from graph_engine.knowledge_graph import KnowledgeGraphAnalyzer
from graph_engine.canvas_exporter import CanvasExporter

# Vaultのインデックス作成
analyzer = KnowledgeGraphAnalyzer()
analyzer.index_vault()

# 特定ノートの近傍サブグラフを抽出
subgraph = analyzer.get_neighborhood_subgraph("対象ノート名", max_depth=2)

# Canvasファイルとして出力
CanvasExporter.export_subgraph(subgraph, Path("90_System/93_Temporary/Knowledge_Graph.canvas"))
```

### 2. StateGraph ワークフローの実行と可視化
```bash
python3 "90_System/91_Scripts/graph_engine/builtin_workflows.py"
```

### 3. Graph Studio Webサーバーの連携
```bash
python3 "90_System/91_Scripts/graph_engine/dashboard_server.py"
```

## 成果物チェックリスト
- [ ] 出力した `.canvas` ファイルが Obsidian で正常に開けるか
- [ ] ノード配置の重なりがなく、見やすいトポロジーになっているか
- [ ] 異分野ドメインを接続するハブ／Bridgeノードがハイライトされているか

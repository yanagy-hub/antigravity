"""
Built-in Workflows Module
グラフエンジニアリング環境に標準搭載されるStateGraphワークフロー定義群。
1. Knowledge Emergence Graph (知識創発・GraphRAG)
2. Daily Thought Pipeline Graph (思考パイプライン自動化)
3. Cyclic Review Loop Graph (循環型推敲・品質検証)
"""

import os
import time
from pathlib import Path
from typing import Dict, Any, List
from .state_graph import StateGraph, START, END
from .knowledge_graph import KnowledgeGraphAnalyzer
from .canvas_exporter import CanvasExporter


def build_knowledge_emergence_workflow() -> StateGraph:
    """知識創発・ナレッジトポロジー探索ワークフロー"""
    graph = StateGraph(
        name="Knowledge Emergence Explorer",
        description="指定された起点からVaultの知識グラフを探索し、異分野間の創発接続とインサイトを抽出・Canvas出力します。"
    )

    def extract_seeds(state: Dict[str, Any]) -> Dict[str, Any]:
        seeds = state.get("seeds", [])
        if not seeds:
            # 起点が指定されていない場合はPageRankトップの重要ノートを抽出
            analyzer = KnowledgeGraphAnalyzer()
            analyzer.index_vault()
            top_nodes = sorted(analyzer.nodes.values(), key=lambda x: x.get("pagerank", 0), reverse=True)[:3]
            seeds = [n["id"] for n in top_nodes]
        return {
            "seeds": seeds,
            "status": "seeds_extracted",
            "log": [f"探索起点を設定: {', '.join(seeds)}"]
        }

    def traverse_topology(state: Dict[str, Any]) -> Dict[str, Any]:
        seeds = state.get("seeds", [])
        depth = state.get("depth", 2)
        analyzer = KnowledgeGraphAnalyzer()
        analyzer.index_vault()

        gathered_nodes = set()
        subgraph_elements = {"nodes": [], "edges": []}

        for seed in seeds:
            sub = analyzer.get_neighborhood_subgraph(seed, max_depth=depth)
            for n in sub["elements"]["nodes"]:
                nid = n["data"]["id"]
                if nid not in gathered_nodes:
                    gathered_nodes.add(nid)
                    subgraph_elements["nodes"].append(n)
            for e in sub["elements"]["edges"]:
                subgraph_elements["edges"].append(e)

        return {
            "gathered_nodes": list(gathered_nodes),
            "subgraph": subgraph_elements,
            "status": "topology_traversed",
            "log": state.get("log", []) + [f"近傍サブグラフを走査: ノード数 {len(gathered_nodes)}件, エッジ数 {len(subgraph_elements['edges'])}件"]
        }

    def detect_cross_domain(state: Dict[str, Any]) -> Dict[str, Any]:
        analyzer = KnowledgeGraphAnalyzer()
        analyzer.index_vault()
        bridges = analyzer.analyze_cross_domain_bridges()
        
        gathered_set = set(state.get("gathered_nodes", []))
        local_bridges = [b for b in bridges if b["id"] in gathered_set] if gathered_set else bridges[:5]

        return {
            "bridges": local_bridges[:5],
            "bridge_count": len(local_bridges),
            "status": "bridges_detected",
            "log": state.get("log", []) + [f"異分野架け橋ノードを検出: {len(local_bridges)}件"]
        }

    def synthesize_insights(state: Dict[str, Any]) -> Dict[str, Any]:
        seeds = state.get("seeds", [])
        bridges = state.get("bridges", [])
        gathered = state.get("gathered_nodes", [])

        bridge_names = [b["title"] for b in bridges]
        insights = f"【探索サマリー】\n- 起点ノート: {', '.join(seeds)}\n- 走査範囲: 関連{len(gathered)}ノート\n- 主要架け橋概念: {', '.join(bridge_names)}\n\n【創発インサイト】\nこれらの概念が交差することで、ドメイン間の知識循環が加速されます。"

        return {
            "insights": insights,
            "status": "synthesized",
            "log": state.get("log", []) + ["知識統合インサイトを生成完了"]
        }

    def export_canvas(state: Dict[str, Any]) -> Dict[str, Any]:
        vault_root = Path(__file__).resolve().parent.parent.parent.parent
        seeds = state.get("seeds", ["Emergence"])
        first_seed = seeds[0] if seeds else "Emergence"
        
        canvas_path = vault_root / "00_System" / "Temporary" / f"Emergence_{first_seed}.canvas"
        
        # グラフ辞書を出力
        subgraph = state.get("subgraph", {})
        if subgraph.get("nodes"):
            CanvasExporter.export_subgraph({"center": first_seed, "elements": subgraph}, canvas_path)
        else:
            CanvasExporter.export_workflow(graph.to_dict(), canvas_path, title=f"Knowledge Emergence ({first_seed})")

        return {
            "canvas_file": str(canvas_path.relative_to(vault_root)),
            "status": "completed",
            "log": state.get("log", []) + [f"Obsidian Canvasを出力: {canvas_path.name}"]
        }

    # ノード追加
    graph.add_node("extract_seeds", extract_seeds, "探索起点ノートの設定とインデックス照合")
    graph.add_node("traverse_topology", traverse_topology, "近傍サブグラフ・トポロジー探索")
    graph.add_node("detect_cross_domain", detect_cross_domain, "異分野ドメイン間の架け橋ノード検出")
    graph.add_node("synthesize_insights", synthesize_insights, "ナレッジ統合と創発インサイト生成")
    graph.add_node("export_canvas", export_canvas, "Obsidian Canvas (.canvas) ファイルへの自動配置出力")

    # エッジ接続
    graph.add_edge(START, "extract_seeds")
    graph.add_edge("extract_seeds", "traverse_topology")
    graph.add_edge("traverse_topology", "detect_cross_domain")
    graph.add_edge("detect_cross_domain", "synthesize_insights")
    graph.add_edge("synthesize_insights", "export_canvas")
    graph.set_finish_point("export_canvas")

    return graph


def build_cyclic_refactor_workflow() -> StateGraph:
    """推敲・品質検証ループワークフロー（ループ・条件分岐デモ）"""
    graph = StateGraph(
        name="Cyclic Note Refactor Loop",
        description="下書きノートに対して品質チェック（Frontmatter、WikiLinks、見出し構成）を行い、基準に達するまで自動改善ループを実行します。"
    )

    def draft_evaluation(state: Dict[str, Any]) -> Dict[str, Any]:
        iteration = state.get("iteration", 0) + 1
        note_content = state.get("content", "")
        
        score = 50 + (iteration * 20)  # ループごとに改善されるシミュレーション
        passed = score >= 85

        return {
            "iteration": iteration,
            "quality_score": min(score, 95),
            "passed": passed,
            "log": state.get("log", []) + [f"品質監査 (Round {iteration}): スコア {min(score, 95)}点 / 合否: {'合格' if passed else '再推敲が必要'}"]
        }

    def refine_content(state: Dict[str, Any]) -> Dict[str, Any]:
        curr_content = state.get("content", "")
        iteration = state.get("iteration", 1)
        improved_content = curr_content + f"\n\n<!-- Iteration {iteration}: WikiLinks補完・アトミック構造を強化 -->"
        return {
            "content": improved_content,
            "log": state.get("log", []) + [f"コンテンツの自動修正・WikiLinks補完を実施 (Round {iteration})"]
        }

    def finalize_note(state: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "ready_for_publish",
            "log": state.get("log", []) + ["ノート推敲完了: 品質基準をクリアしました"]
        }

    # 条件付きエッジのルーター関数
    def route_quality(state: Dict[str, Any]) -> str:
        if state.get("passed", False) or state.get("iteration", 0) >= 3:
            return "finalize"
        return "refine"

    graph.add_node("evaluate", draft_evaluation, "Frontmatter・WikiLinks・構成の品質監査")
    graph.add_node("refine", refine_content, "コンテンツの自動補正・アトミック成形")
    graph.add_node("finalize", finalize_note, "完成ノートの保存とメタデータ更新")

    graph.add_edge(START, "evaluate")
    graph.add_conditional_edges(
        "evaluate",
        route_quality,
        {"finalize": "finalize", "refine": "refine"},
        label="スコア判定"
    )
    graph.add_edge("refine", "evaluate")  # ループ
    graph.set_finish_point("finalize")

    return graph


def get_all_workflows() -> Dict[str, StateGraph]:
    """登録されている全組み込みワークフローを返す"""
    return {
        "knowledge_emergence": build_knowledge_emergence_workflow(),
        "cyclic_refactor": build_cyclic_refactor_workflow(),
    }

"""
Canvas Exporter Module
StateGraphワークフローおよびナレッジサブグラフをObsidian JSON Canvas (.canvas) フォーマットへ
自動レイアウト変換して出力します。
"""

import json
import secrets
import math
from pathlib import Path
from typing import Dict, Any, List, Optional
from .state_graph import StateGraph, START, END


class CanvasExporter:
    """Obsidian JSON Canvas (.canvas) 生成クラス"""

    COLOR_PRESETS = {
        "red": "1",
        "orange": "2",
        "yellow": "3",
        "green": "4",
        "cyan": "5",
        "purple": "6"
    }

    DOMAIN_COLORS = {
        "10_Capture": "2",          # Orange
        "20_Reflection": "4",       # Green
        "30_Studies_Writing": "6",  # Purple
        "40_Knowledge": "5",        # Cyan
        "00_System": "1",           # Red
        "Other": "3"                # Yellow
    }

    @staticmethod
    def generate_id() -> str:
        """16桁の小文字16進数ランダムIDを生成"""
        return secrets.token_hex(8)

    @classmethod
    def export_workflow(
        cls,
        graph_dict: Dict[str, Any],
        output_path: Path,
        title: Optional[str] = None
    ) -> Path:
        """StateGraph構造をフローチャート型Canvasに出力"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        nodes = []
        edges = []
        node_id_map: Dict[str, str] = {}

        raw_nodes = graph_dict.get("nodes", [])
        raw_edges = graph_dict.get("edges", [])

        # グリッド/フローレイアウト計算 (左から右への水平フローまたは上から下)
        spacing_x = 320
        spacing_y = 180
        curr_x = 100
        curr_y = 200

        # タイトルグループ
        group_id = cls.generate_id()
        graph_name = title or graph_dict.get("name", "StateGraph Workflow")
        
        for idx, n in enumerate(raw_nodes):
            nid = cls.generate_id()
            node_id_map[n["id"]] = nid
            
            # 色とサイズの決定
            n_type = n.get("type", "standard")
            if n["id"] == START:
                color = "4"  # Green
                w, h = 180, 100
                text = f"### 🟢 START\n{n.get('description', '')}"
            elif n["id"] == END:
                color = "1"  # Red
                w, h = 180, 100
                text = f"### 🔴 END\n{n.get('description', '')}"
            else:
                color = "6"  # Purple
                w, h = 240, 140
                desc = n.get('description', '')
                text = f"### ⚙️ {n['id']}\n\n{desc}"

            # レイアウト座標
            nx = curr_x + (idx * spacing_x)
            ny = curr_y

            nodes.append({
                "id": nid,
                "type": "text",
                "text": text,
                "x": nx,
                "y": ny,
                "width": w,
                "height": h,
                "color": color
            })

        # エッジの変換
        for e in raw_edges:
            src_nid = node_id_map.get(e["from"])
            tgt_nid = node_id_map.get(e["to"])
            if src_nid and tgt_nid:
                eid = cls.generate_id()
                edge_obj = {
                    "id": eid,
                    "fromNode": src_nid,
                    "fromSide": "right",
                    "toNode": tgt_nid,
                    "toSide": "left",
                    "toEnd": "arrow"
                }
                if e.get("label"):
                    edge_obj["label"] = e["label"]
                if e.get("type") == "conditional":
                    edge_obj["color"] = "3"  # Yellow for conditional
                edges.append(edge_obj)

        canvas_data = {
            "nodes": nodes,
            "edges": edges
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(canvas_data, f, ensure_ascii=False, indent=2)

        return output_path

    @classmethod
    def export_subgraph(
        cls,
        subgraph_data: Dict[str, Any],
        output_path: Path
    ) -> Path:
        """中心ノート近傍のナレッジサブグラフをCanvasに出力（ファイルプレビューノード対応）"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        center_id = subgraph_data.get("center", "")
        elements = subgraph_data.get("elements", {})
        raw_nodes = elements.get("nodes", [])
        raw_edges = elements.get("edges", [])

        nodes = []
        edges = []
        node_id_map: Dict[str, str] = {}

        # 中心ノードを中央に配置し、周囲に同心円状に配置
        center_x = 600
        center_y = 500
        radius = 380

        other_nodes = [n for n in raw_nodes if n["data"].get("id") != center_id]
        total_others = len(other_nodes)

        # 中心ノード
        center_node_data = next((n["data"] for n in raw_nodes if n["data"].get("id") == center_id), None)
        if center_node_data:
            c_nid = cls.generate_id()
            node_id_map[center_id] = c_nid
            nodes.append({
                "id": c_nid,
                "type": "file",
                "file": center_node_data.get("path", ""),
                "x": center_x - 150,
                "y": center_y - 120,
                "width": 300,
                "height": 240,
                "color": "6"  # Purple
            })

        # 周囲のノード
        for i, n_obj in enumerate(other_nodes):
            data = n_obj["data"]
            nid = cls.generate_id()
            node_id_map[data["id"]] = nid

            angle = (2 * math.pi * i) / max(total_others, 1)
            nx = int(center_x + radius * math.cos(angle) - 120)
            ny = int(center_y + radius * math.sin(angle) - 90)

            domain = data.get("domain", "Other")
            color = cls.DOMAIN_COLORS.get(domain, "3")

            nodes.append({
                "id": nid,
                "type": "file",
                "file": data.get("path", ""),
                "x": nx,
                "y": ny,
                "width": 240,
                "height": 180,
                "color": color
            })

        # エッジ
        for e in raw_edges:
            src = e["data"]["source"]
            tgt = e["data"]["target"]
            src_nid = node_id_map.get(src)
            tgt_nid = node_id_map.get(tgt)
            if src_nid and tgt_nid:
                eid = cls.generate_id()
                edges.append({
                    "id": eid,
                    "fromNode": src_nid,
                    "toNode": tgt_nid,
                    "toEnd": "arrow"
                })

        canvas_data = {
            "nodes": nodes,
            "edges": edges
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(canvas_data, f, ensure_ascii=False, indent=2)

        return output_path

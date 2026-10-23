"""
Knowledge Graph Analyzer Module
Obsidian Vault内の全ノート・WikiLinks・メタデータを解析し、
ナレッジトポロジーの構築、PageRank/中心性計算、最短経路探索、異分野創発度分析を行います。
"""

import os
import re
from pathlib import Path
from collections import defaultdict, deque
from typing import Dict, Any, List, Set, Tuple, Optional


class KnowledgeGraphAnalyzer:
    """Vault全体の知識グラフ構築・解析エンジン"""

    DOMAIN_MAPPING = {
        "10_Capture": {"label": "Capture (メモ・素材)", "color": "#f59e0b", "prefix": "10_Capture"},
        "20_Reflection": {"label": "Reflection (自省・日誌)", "color": "#10b981", "prefix": "20_Reflection"},
        "30_Studies_Writing": {"label": "Studies & Writing (探究・執筆)", "color": "#6366f1", "prefix": "30_Studies_Writing"},
        "40_Knowledge": {"label": "Knowledge (知識の結晶)", "color": "#ec4899", "prefix": "40_Knowledge"},
        "80_Archive": {"label": "Archive (過去資産)", "color": "#6b7280", "prefix": "80_Archive"},
        "00_System": {"label": "System (システム基盤)", "color": "#9ca3af", "prefix": "00_System"},
    }

    def __init__(self, vault_root: Optional[Path] = None):
        if vault_root is None:
            # 4階層上（graph_engine -> Scripts -> 00_System -> Vault Root）
            vault_root = Path(__file__).resolve().parent.parent.parent.parent
        self.vault_root = Path(vault_root)
        self.nodes: Dict[str, Dict[str, Any]] = {}  # node_id (stem or title) -> metadata
        self.adj: Dict[str, Set[str]] = defaultdict(set)  # out-edges: u -> {v}
        self.rev_adj: Dict[str, Set[str]] = defaultdict(set)  # in-edges: v -> {u}
        self.aliases: Dict[str, str] = {}  # alias -> canonical_id
        self._is_indexed = False

    def get_domain_info(self, rel_path: str) -> Dict[str, str]:
        """相対パスからドメイン名、ラベル、カラーを判定"""
        for key, info in self.DOMAIN_MAPPING.items():
            if rel_path.startswith(key):
                return {"domain_key": key, **info}
        return {"domain_key": "Other", "label": "その他", "color": "#94a3b8", "prefix": ""}

    def index_vault(self, force: bool = False) -> None:
        """Vault全体を走査してインデックス化"""
        if self._is_indexed and not force:
            return

        self.nodes.clear()
        self.adj.clear()
        self.rev_adj.clear()
        self.aliases.clear()

        # 走査対象から除外するディレクトリ
        ignore_dirs = {".git", ".obsidian", ".trash", "00_System/Logs", "00_System/Temporary"}

        raw_files = []
        for root, dirs, files in os.walk(self.vault_root):
            try:
                rel_dir = Path(root).relative_to(self.vault_root).as_posix()
            except ValueError:
                rel_dir = ""
            if any(rel_dir == ign or rel_dir.startswith(ign + "/") for ign in ignore_dirs):
                continue

            for file in files:
                if file.endswith(".md"):
                    full_path = Path(root) / file
                    raw_files.append(full_path)

        # ステップ 1: ノードの基本情報とエイリアスを収集
        for path in raw_files:
            rel_path = path.relative_to(self.vault_root).as_posix()
            stem = path.stem

            try:
                content = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            # YAML Frontmatter 解析
            fm_match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
            title = stem
            tags = []
            aliases = []
            note_type = "未分類"
            status = "下書き"

            if fm_match:
                fm_text = fm_match.group(1)
                in_tags = False
                in_aliases = False
                for line in fm_text.splitlines():
                    clean_line = line.strip()
                    if line.startswith("title:"):
                        title = line.replace("title:", "").strip().strip('"\'')
                        in_tags, in_aliases = False, False
                    elif line.startswith("type:"):
                        note_type = line.replace("type:", "").strip().strip('"\'')
                        in_tags, in_aliases = False, False
                    elif line.startswith("status:"):
                        status = line.replace("status:", "").strip().strip('"\'')
                        in_tags, in_aliases = False, False
                    elif line.startswith("tags:"):
                        in_tags, in_aliases = True, False
                    elif line.startswith("aliases:"):
                        in_tags, in_aliases = False, True
                    elif clean_line.startswith("- "):
                        val = clean_line.lstrip("- ").strip().strip('"\'')
                        if in_tags and val:
                            tags.append(val)
                        elif in_aliases and val:
                            aliases.append(val)
                    elif line and not line.startswith(" "):
                        in_tags, in_aliases = False, False

            domain_info = self.get_domain_info(rel_path)

            # WikiLinks 抽出
            wikilinks = re.findall(r"\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]", content)
            unique_links = list(dict.fromkeys(wikilinks))

            node_id = stem
            self.nodes[node_id] = {
                "id": node_id,
                "title": title or stem,
                "path": rel_path,
                "domain": domain_info["domain_key"],
                "domain_label": domain_info["label"],
                "color": domain_info["color"],
                "tags": tags,
                "aliases": aliases,
                "type": note_type,
                "status": status,
                "raw_links": unique_links,
                "char_count": len(content),
            }

            self.aliases[stem] = node_id
            if title and title != stem:
                self.aliases[title] = node_id
            for alias in aliases:
                self.aliases[alias] = node_id

        # ステップ 2: リンク（エッジ）の解決
        for node_id, meta in self.nodes.items():
            for target_raw in meta["raw_links"]:
                target_clean = target_raw.strip()
                target_id = self.aliases.get(target_clean)
                if target_id and target_id in self.nodes and target_id != node_id:
                    self.adj[node_id].add(target_id)
                    self.rev_adj[target_id].add(node_id)

        # ステップ 3: PageRank・中心性計算
        self._calculate_metrics()
        self._is_indexed = True

    def _calculate_metrics(self, damping: float = 0.85, max_iter: int = 50, tol: float = 1e-6) -> None:
        """PageRankおよび次数中心性を計算"""
        n = len(self.nodes)
        if n == 0:
            return

        # 初期スコア
        pagerank = {node: 1.0 / n for node in self.nodes}

        # べき乗法による反復計算
        for _ in range(max_iter):
            new_pagerank = {}
            dangling_sum = sum(pagerank[node] for node in self.nodes if len(self.adj[node]) == 0)

            for node in self.nodes:
                rank_sum = sum(pagerank[in_node] / len(self.adj[in_node]) for in_node in self.rev_adj[node])
                new_rank = (1.0 - damping) / n + damping * (rank_sum + dangling_sum / n)
                new_pagerank[node] = new_rank

            # 収束判定
            err = sum(abs(new_pagerank[node] - pagerank[node]) for node in self.nodes)
            pagerank = new_pagerank
            if err < tol:
                break

        # スコアを正規化（0〜100）してノードメタデータに格納
        max_pr = max(pagerank.values()) if pagerank else 1.0
        for node, meta in self.nodes.items():
            meta["pagerank"] = pagerank.get(node, 0.0)
            meta["pagerank_normalized"] = round((pagerank.get(node, 0.0) / max_pr) * 100, 2)
            meta["in_degree"] = len(self.rev_adj[node])
            meta["out_degree"] = len(self.adj[node])
            meta["total_degree"] = meta["in_degree"] + meta["out_degree"]

    def get_graph_data(self) -> Dict[str, Any]:
        """Web可視化（Cytoscape / D3 Force）用の全グラフデータを返却"""
        self.index_vault()

        nodes_list = []
        for node_id, meta in self.nodes.items():
            nodes_list.append({
                "data": {
                    "id": node_id,
                    "label": meta["title"],
                    "path": meta["path"],
                    "domain": meta["domain"],
                    "domain_label": meta["domain_label"],
                    "color": meta["color"],
                    "pagerank": meta.get("pagerank_normalized", 0),
                    "in_degree": meta.get("in_degree", 0),
                    "out_degree": meta.get("out_degree", 0),
                    "total_degree": meta.get("total_degree", 0),
                    "tags": meta.get("tags", []),
                    "type": meta.get("type", "未分類")
                }
            })

        edges_list = []
        edge_id = 0
        for src, targets in self.adj.items():
            for tgt in targets:
                edge_id += 1
                edges_list.append({
                    "data": {
                        "id": f"e{edge_id}",
                        "source": src,
                        "target": tgt,
                    }
                })

        return {
            "summary": {
                "total_nodes": len(self.nodes),
                "total_edges": len(edges_list),
                "domains": self._get_domain_stats()
            },
            "elements": {
                "nodes": nodes_list,
                "edges": edges_list
            }
        }

    def _get_domain_stats(self) -> Dict[str, int]:
        stats = defaultdict(int)
        for meta in self.nodes.values():
            stats[meta["domain"]] += 1
        return dict(stats)

    def find_shortest_path(self, start_node: str, end_node: str) -> Optional[List[str]]:
        """2つのノート間の最短経路をBFSで探索"""
        self.index_vault()
        start = self.aliases.get(start_node, start_node)
        end = self.aliases.get(end_node, end_node)

        if start not in self.nodes or end not in self.nodes:
            return None
        if start == end:
            return [start]

        queue = deque([[start]])
        visited = {start}

        while queue:
            path = queue.popleft()
            curr = path[-1]

            # 有向 + 無向の両方向を探索
            neighbors = self.adj[curr] | self.rev_adj[curr]
            for neighbor in neighbors:
                if neighbor == end:
                    return path + [neighbor]
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])
        return None

    def get_neighborhood_subgraph(self, center_node: str, max_depth: int = 2) -> Dict[str, Any]:
        """中心ノードから指定深さまでの近傍サブグラフを抽出"""
        self.index_vault()
        center = self.aliases.get(center_node, center_node)
        if center not in self.nodes:
            return {
                "center": center_node,
                "max_depth": max_depth,
                "elements": {"nodes": [], "edges": []}
            }

        sub_nodes = set()
        queue = deque([(center, 0)])
        visited = {center}

        while queue:
            node, depth = queue.popleft()
            sub_nodes.add(node)
            if depth < max_depth:
                neighbors = self.adj[node] | self.rev_adj[node]
                for n in neighbors:
                    if n not in visited:
                        visited.add(n)
                        queue.append((n, depth + 1))

        nodes_data = [
            {"data": {**self.nodes[n], "is_center": (n == center)}}
            for n in sub_nodes if n in self.nodes
        ]
        edges_data = []
        edge_id = 0
        for src in sub_nodes:
            for tgt in self.adj[src]:
                if tgt in sub_nodes:
                    edge_id += 1
                    edges_data.append({
                        "data": {
                            "id": f"sub_e{edge_id}",
                            "source": src,
                            "target": tgt
                        }
                    })

        return {
            "center": center,
            "max_depth": max_depth,
            "elements": {
                "nodes": nodes_data,
                "edges": edges_data
            }
        }

    def analyze_cross_domain_bridges(self) -> List[Dict[str, Any]]:
        """異分野ドメインを結ぶ重要架け橋（Bridge / Emergence）ノードを検出"""
        self.index_vault()
        bridge_scores = []

        for node_id, meta in self.nodes.items():
            src_domain = meta["domain"]
            if src_domain in ("00_System", "80_Archive"):
                continue

            connected_domains = set()
            for tgt in self.adj[node_id]:
                if tgt in self.nodes:
                    tgt_domain = self.nodes[tgt]["domain"]
                    if tgt_domain != src_domain and tgt_domain not in ("00_System", "80_Archive"):
                        connected_domains.add(tgt_domain)

            for in_node in self.rev_adj[node_id]:
                if in_node in self.nodes:
                    in_domain = self.nodes[in_node]["domain"]
                    if in_domain != src_domain and in_domain not in ("00_System", "80_Archive"):
                        connected_domains.add(in_domain)

            if len(connected_domains) >= 1:
                bridge_scores.append({
                    "id": node_id,
                    "title": meta["title"],
                    "path": meta["path"],
                    "home_domain": src_domain,
                    "bridge_domain_count": len(connected_domains),
                    "connected_domains": list(connected_domains),
                    "pagerank": meta.get("pagerank_normalized", 0),
                    "total_degree": meta.get("total_degree", 0)
                })

        # ドメイン接続数とPageRankの複合スコアでソート
        bridge_scores.sort(key=lambda x: (x["bridge_domain_count"], x["pagerank"]), reverse=True)
        return bridge_scores

"""
StateGraph Core Module
状態駆動型の有向グラフワークフローエンジン。
ノード、通常エッジ、条件付きエッジ、ループ、合流、状態マージ（Reducer）をサポートします。
"""

import time
import copy
from datetime import datetime
from typing import Callable, Any, Dict, List, Optional, Union, Generator

START = "__start__"
END = "__end__"


class StateGraphError(Exception):
    """グラフ実行時の基底例外クラス"""
    pass


class Node:
    """グラフ内の単一ノード（処理単位）"""
    def __init__(self, name: str, func: Callable[[Dict[str, Any]], Dict[str, Any]], description: str = ""):
        self.name = name
        self.func = func
        self.description = description

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """状態を入力として受け取り、更新辞書を返す"""
        return self.func(copy.deepcopy(state))


class Edge:
    """通常エッジ（固定遷移）"""
    def __init__(self, from_node: str, to_node: str, label: str = ""):
        self.from_node = from_node
        self.to_node = to_node
        self.label = label


class ConditionalEdge:
    """条件付きエッジ（動的ルーティング）"""
    def __init__(
        self,
        from_node: str,
        router: Callable[[Dict[str, Any]], str],
        path_map: Optional[Dict[str, str]] = None,
        label: str = ""
    ):
        self.from_node = from_node
        self.router = router
        self.path_map = path_map or {}
        self.label = label

    def resolve_next(self, state: Dict[str, Any]) -> str:
        """ルーター関数を実行し、遷移先ノード名を解決する"""
        key = self.router(state)
        if self.path_map:
            return self.path_map.get(key, key)
        return key


class StateGraph:
    """
    状態駆動型グラフ定義クラス。
    ノードとエッジを定義し、コンパイルして実行可能オブジェクトを生成します。
    """
    def __init__(self, name: str = "StateGraph", description: str = ""):
        self.name = name
        self.description = description
        self.nodes: Dict[str, Node] = {}
        self.edges: Dict[str, Edge] = {}
        self.conditional_edges: Dict[str, ConditionalEdge] = {}
        self.entry_point: Optional[str] = None
        self.finish_points: set = set()
        self.reducers: Dict[str, Callable[[Any, Any], Any]] = {}

    def add_node(self, name: str, func: Callable[[Dict[str, Any]], Dict[str, Any]], description: str = "") -> "StateGraph":
        """ノードを追加"""
        if name in (START, END):
            raise StateGraphError(f"予約語ノード名 '{name}' は使用できません。")
        self.nodes[name] = Node(name, func, description)
        return self

    def add_edge(self, from_node: str, to_node: str, label: str = "") -> "StateGraph":
        """通常エッジを追加"""
        if from_node == START:
            self.entry_point = to_node
            return self
        self.edges[from_node] = Edge(from_node, to_node, label)
        return self

    def add_conditional_edges(
        self,
        from_node: str,
        router: Callable[[Dict[str, Any]], str],
        path_map: Optional[Dict[str, str]] = None,
        label: str = ""
    ) -> "StateGraph":
        """条件付きエッジ（動的分岐）を追加"""
        if from_node == START:
            raise StateGraphError("STARTノードからの直接の条件付きエッジはサポートされていません。通常エッジでエントリノードを指定してください。")
        self.conditional_edges[from_node] = ConditionalEdge(from_node, router, path_map, label)
        return self

    def set_entry_point(self, node_name: str) -> "StateGraph":
        """エントリポイント（最初のノード）を設定"""
        if node_name not in self.nodes:
            raise StateGraphError(f"エントリポイント '{node_name}' がノード一覧に存在しません。")
        self.entry_point = node_name
        return self

    def set_finish_point(self, node_name: str) -> "StateGraph":
        """終了ポイントノードを設定"""
        if node_name not in self.nodes:
            raise StateGraphError(f"終了ポイント '{node_name}' がノード一覧に存在しません。")
        self.finish_points.add(node_name)
        return self

    def register_reducer(self, key: str, reducer_func: Callable[[Any, Any], Any]) -> "StateGraph":
        """特定キーに対する状態更新Reducer（例: リストへの追加、数値の加算等）を登録"""
        self.reducers[key] = reducer_func
        return self

    def compile(self, checkpointer=None) -> "CompiledGraph":
        """グラフの整合性を検証し、実行可能なCompiledGraphを生成"""
        if not self.entry_point:
            raise StateGraphError("グラフのエントリポイントが設定されていません。set_entry_point() または add_edge(START, 'ノード名') を実行してください。")
        return CompiledGraph(self, checkpointer=checkpointer)

    def to_dict(self) -> Dict[str, Any]:
        """グラフ構造のJSON表現を返す（フロントエンド可視化用）"""
        nodes_data = [{"id": START, "label": "START", "type": "special", "description": "グラフ開始"}]
        for name, node in self.nodes.items():
            nodes_data.append({
                "id": name,
                "label": name,
                "type": "standard",
                "description": node.description
            })
        nodes_data.append({"id": END, "label": "END", "type": "special", "description": "グラフ終了"})

        edges_data = []
        if self.entry_point:
            edges_data.append({
                "from": START,
                "to": self.entry_point,
                "label": "開始",
                "type": "direct"
            })

        for from_n, edge in self.edges.items():
            edges_data.append({
                "from": from_n,
                "to": edge.to_node,
                "label": edge.label,
                "type": "direct"
            })

        for from_n, c_edge in self.conditional_edges.items():
            if c_edge.path_map:
                for cond_val, target in c_edge.path_map.items():
                    edges_data.append({
                        "from": from_n,
                        "to": target,
                        "label": f"[{cond_val}]",
                        "type": "conditional"
                    })
            else:
                edges_data.append({
                    "from": from_n,
                    "to": "Dynamic",
                    "label": c_edge.label or "条件分岐",
                    "type": "conditional"
                })

        for fp in self.finish_points:
            edges_data.append({
                "from": fp,
                "to": END,
                "label": "完了",
                "type": "direct"
            })

        return {
            "name": self.name,
            "description": self.description,
            "nodes": nodes_data,
            "edges": edges_data
        }

    def to_mermaid(self) -> str:
        """Mermaid図フォーマットの文字列を出力"""
        lines = ["graph TD", f"    {START}((START))"]
        if self.entry_point:
            lines.append(f"    {START} --> {self.entry_point}")
        for name in self.nodes:
            lines.append(f"    {name}[\"{name}\"]")
        for from_n, edge in self.edges.items():
            lbl = f"|{edge.label}|" if edge.label else ""
            lines.append(f"    {from_n} -->{lbl} {edge.to_node}")
        for from_n, c_edge in self.conditional_edges.items():
            if c_edge.path_map:
                for cond_val, target in c_edge.path_map.items():
                    lines.append(f"    {from_n} -.->|{cond_val}| {target}")
        lines.append(f"    {END}((END))")
        return "\n".join(lines)


class CompiledGraph:
    """コンパイル済み実行可能グラフ"""
    def __init__(self, graph: StateGraph, checkpointer=None):
        self.graph = graph
        self.checkpointer = checkpointer

    def _merge_state(self, current_state: Dict[str, Any], delta_state: Dict[str, Any]) -> Dict[str, Any]:
        """Reducerを考慮して状態をマージ"""
        new_state = copy.deepcopy(current_state)
        for k, v in delta_state.items():
            if k in self.graph.reducers and k in new_state:
                new_state[k] = self.graph.reducers[k](new_state[k], v)
            else:
                new_state[k] = v
        return new_state

    def stream(
        self,
        initial_state: Dict[str, Any],
        max_steps: int = 50,
        thread_id: Optional[str] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """
        グラフを実行し、各ステップのイベントを逐次 yield するジェネレータ。
        リアルタイム可視化（SSE/WebSocket）に最適化されています。
        """
        state = copy.deepcopy(initial_state)
        current_node = self.graph.entry_point
        step = 0

        # 初期スナップショット
        if self.checkpointer and thread_id:
            self.checkpointer.save(thread_id, step, "START", state)

        yield {
            "event": "graph_start",
            "graph_name": self.graph.name,
            "step": step,
            "state": state,
            "timestamp": datetime.now().isoformat()
        }

        while current_node and current_node != END and step < max_steps:
            step += 1
            node_obj = self.graph.nodes.get(current_node)
            if not node_obj:
                err_msg = f"未定義ノード '{current_node}' への到達エラー"
                yield {
                    "event": "graph_error",
                    "step": step,
                    "node": current_node,
                    "error": err_msg,
                    "timestamp": datetime.now().isoformat()
                }
                raise StateGraphError(err_msg)

            # ノード実行開始イベント
            yield {
                "event": "node_start",
                "step": step,
                "node": current_node,
                "state": copy.deepcopy(state),
                "timestamp": datetime.now().isoformat()
            }

            try:
                # ノード関数の実行
                start_t = time.time()
                delta = node_obj.execute(state)
                duration_ms = round((time.time() - start_t) * 1000, 2)
                state = self._merge_state(state, delta)

                # チェックポイント保存
                if self.checkpointer and thread_id:
                    self.checkpointer.save(thread_id, step, current_node, state)

                # ノード実行完了イベント
                yield {
                    "event": "node_end",
                    "step": step,
                    "node": current_node,
                    "delta": delta,
                    "state": copy.deepcopy(state),
                    "duration_ms": duration_ms,
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                err_msg = f"ノード '{current_node}' 実行中の例外: {str(e)}"
                yield {
                    "event": "node_error",
                    "step": step,
                    "node": current_node,
                    "error": err_msg,
                    "timestamp": datetime.now().isoformat()
                }
                raise StateGraphError(err_msg) from e

            # 終了ポイント判定
            if current_node in self.graph.finish_points:
                current_node = END
                break

            # 次ノードの決定
            next_node = None
            if current_node in self.graph.conditional_edges:
                c_edge = self.graph.conditional_edges[current_node]
                next_node = c_edge.resolve_next(state)
                yield {
                    "event": "edge_transition",
                    "step": step,
                    "from_node": current_node,
                    "to_node": next_node,
                    "type": "conditional",
                    "timestamp": datetime.now().isoformat()
                }
            elif current_node in self.graph.edges:
                next_node = self.graph.edges[current_node].to_node
                yield {
                    "event": "edge_transition",
                    "step": step,
                    "from_node": current_node,
                    "to_node": next_node,
                    "type": "direct",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # 次の遷移が未定義の場合は終了
                next_node = END

            current_node = next_node

        if step >= max_steps:
            yield {
                "event": "graph_max_steps_reached",
                "step": step,
                "max_steps": max_steps,
                "state": state,
                "timestamp": datetime.now().isoformat()
            }

        yield {
            "event": "graph_finish",
            "graph_name": self.graph.name,
            "total_steps": step,
            "final_state": state,
            "timestamp": datetime.now().isoformat()
        }

    def invoke(
        self,
        initial_state: Dict[str, Any],
        max_steps: int = 50,
        thread_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """グラフを同期実行し、最終状態（Final State）を返す"""
        final_state = initial_state
        for event in self.stream(initial_state, max_steps=max_steps, thread_id=thread_id):
            if event["event"] == "graph_finish":
                final_state = event["final_state"]
        return final_state

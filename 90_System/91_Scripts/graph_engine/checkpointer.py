"""
Checkpointer Module
StateGraph実行履歴のスナップショット保存とタイムトラベル（Time-Travel）デバッグ機能を提供します。
"""

import json
import copy
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod


class StateCheckpointer(ABC):
    """チェックポインタの抽象基底クラス"""

    @abstractmethod
    def save(self, thread_id: str, step: int, node: str, state: Dict[str, Any]) -> None:
        """指定スレッドのステップ実行後状態を保存"""
        pass

    @abstractmethod
    def get_history(self, thread_id: str) -> List[Dict[str, Any]]:
        """指定スレッドの全履歴ステップを取得"""
        pass

    @abstractmethod
    def get_step(self, thread_id: str, step: int) -> Optional[Dict[str, Any]]:
        """指定スレッドの特定ステップの状態を取得"""
        pass

    @abstractmethod
    def list_threads(self) -> List[str]:
        """保存されている全スレッドID一覧を取得"""
        pass


class InMemoryCheckpointer(StateCheckpointer):
    """インメモリ保持の軽量チェックポインタ"""

    def __init__(self):
        self._storage: Dict[str, List[Dict[str, Any]]] = {}

    def save(self, thread_id: str, step: int, node: str, state: Dict[str, Any]) -> None:
        if thread_id not in self._storage:
            self._storage[thread_id] = []
        
        snapshot = {
            "thread_id": thread_id,
            "step": step,
            "node": node,
            "state": copy.deepcopy(state),
            "timestamp": datetime.now().isoformat()
        }
        self._storage[thread_id].append(snapshot)

    def get_history(self, thread_id: str) -> List[Dict[str, Any]]:
        return copy.deepcopy(self._storage.get(thread_id, []))

    def get_step(self, thread_id: str, step: int) -> Optional[Dict[str, Any]]:
        history = self._storage.get(thread_id, [])
        for item in history:
            if item["step"] == step:
                return copy.deepcopy(item)
        return None

    def list_threads(self) -> List[str]:
        return list(self._storage.keys())


class FileCheckpointer(StateCheckpointer):
    """ファイルシステム（JSON）に永続化するチェックポインタ"""

    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is None:
            # デフォルトは Vault内 00_System/Temporary/graph_checkpoints
            vault_root = Path(__file__).resolve().parent.parent.parent
            base_dir = vault_root / "Temporary" / "graph_checkpoints"
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _get_thread_file(self, thread_id: str) -> Path:
        safe_id = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in thread_id)
        return self.base_dir / f"{safe_id}.json"

    def save(self, thread_id: str, step: int, node: str, state: Dict[str, Any]) -> None:
        file_path = self._get_thread_file(thread_id)
        history = self.get_history(thread_id)

        snapshot = {
            "thread_id": thread_id,
            "step": step,
            "node": node,
            "state": copy.deepcopy(state),
            "timestamp": datetime.now().isoformat()
        }
        history.append(snapshot)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)

    def get_history(self, thread_id: str) -> List[Dict[str, Any]]:
        file_path = self._get_thread_file(thread_id)
        if not file_path.exists():
            return []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def get_step(self, thread_id: str, step: int) -> Optional[Dict[str, Any]]:
        history = self.get_history(thread_id)
        for item in history:
            if item["step"] == step:
                return item
        return None

    def list_threads(self) -> List[str]:
        return [f.stem for f in self.base_dir.glob("*.json")]

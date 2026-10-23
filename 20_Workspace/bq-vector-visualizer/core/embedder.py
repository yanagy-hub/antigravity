"""
Gemini埋め込み生成 & コサイン類似度計算モジュール
Gemini APIによる自然言語テキストの埋め込み取得と、ベクトル間の高速類似度計算を提供します。
APIキー未設定時でも動作するデモ用フォールバック機能を備えています。
"""
import hashlib
import os
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

# Gemini API のインポート試行
GEMINI_CLIENT_AVAILABLE = False
try:
    from google import genai
    from google.genai import types
    GEMINI_CLIENT_AVAILABLE = True
except ImportError:
    try:
        import google.generativeai as genai_legacy
        GEMINI_LEGACY_AVAILABLE = True
    except ImportError:
        GEMINI_LEGACY_AVAILABLE = False


def generate_embedding(
    text: str,
    api_key: Optional[str] = None,
    model_name: str = "text-embedding-004",
    target_dim: int = 768,
) -> Tuple[Optional[List[float]], bool, str]:
    """
    指定されたテキストの埋め込みベクトルを取得します。

    Args:
        text: 埋め込みを生成するテキスト
        api_key: Gemini APIキー（Noneの場合は環境変数 GEMINI_API_KEY を参照）
        model_name: 埋め込みモデル名
        target_dim: ベクトルの期待次元数（フォールバック用）

    Returns:
        (埋め込みベクトルリスト, 実API呼出成功フラグ, ステータスメッセージ)
    """
    active_key = api_key or os.environ.get("GEMINI_API_KEY")

    if not text or not text.strip():
        return None, False, "テキストが空です。"

    # APIキーが提供されている場合、実API呼び出しを試行
    if active_key:
        # 新しい google-genai SDK
        if GEMINI_CLIENT_AVAILABLE:
            try:
                client = genai.Client(api_key=active_key)
                response = client.models.embed_content(
                    model=model_name,
                    contents=text,
                )
                if hasattr(response, "embedding") and response.embedding:
                    vec = response.embedding.values
                    return list(vec), True, "Gemini API (google-genai) により埋め込みを生成しました。"
                if hasattr(response, "embeddings") and response.embeddings:
                    vec = response.embeddings[0].values
                    return list(vec), True, "Gemini API (google-genai) により埋め込みを生成しました。"
            except Exception as e:
                print(f"google-genai API呼出エラー: {e}")

        # レガシー google.generativeai SDK
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=active_key)
            result = legacy_genai.embed_content(
                model=f"models/{model_name}",
                content=text,
                task_type="retrieval_query",
            )
            if "embedding" in result:
                return result["embedding"], True, "Gemini API により埋め込みを生成しました。"
        except Exception as e:
            print(f"google.generativeai API呼出エラー: {e}")

    # APIキー未設定またはエラー時のシミュレーション用決定論的フォールバック
    # 文字列ハッシュをシードにして、同じ文字列には常に同じ疑似埋め込みを生成
    seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)
    mock_vec = rng.normal(size=target_dim)
    mock_norm = np.linalg.norm(mock_vec)
    if mock_norm > 0:
        mock_vec = mock_vec / mock_norm

    msg = "【デモモード】APIキー未設定のため、デモ用疑似埋め込みを生成しました。"
    return mock_vec.tolist(), False, msg


def calculate_cosine_similarities(
    query_vector: List[float],
    dataset_vectors: List[List[float]],
) -> np.ndarray:
    """
    クエリベクトルとデータセット全体のベクトル群とのコサイン類似度を一括計算します。

    Args:
        query_vector: D次元のクエリベクトル
        dataset_vectors: N x D のデータセットベクトルリスト

    Returns:
        長さNのコサイン類似度配列 (-1.0 〜 1.0)
    """
    q = np.asarray(query_vector, dtype=np.float32)
    X = np.asarray(dataset_vectors, dtype=np.float32)

    q_norm = np.linalg.norm(q)
    if q_norm == 0:
        return np.zeros(len(dataset_vectors), dtype=np.float32)

    # 各データセットベクトルのノルムを計算
    X_norms = np.linalg.norm(X, axis=1)
    # ゼロ除算防止
    X_norms[X_norms == 0] = 1e-10

    # 内積計算
    dot_products = np.dot(X, q)
    similarities = dot_products / (X_norms * q_norm)
    return np.clip(similarities, -1.0, 1.0)

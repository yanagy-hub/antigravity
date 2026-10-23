"""
次元削減 & クラスタリングモジュール
高次元ベクトルを2D/3D空間に投影し、K-Meansクラスタリングを行います。
UMAP環境依存ライブラリのインポートに失敗した場合は、自動的にPCAにフォールバックします。
"""
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans

# UMAPのオプショナルインポート
try:
    import umap
    UMAP_AVAILABLE = True
except (ImportError, Exception):
    UMAP_AVAILABLE = False


def reduce_dimensions(
    vectors: List[List[float]],
    method: str = "UMAP",
    n_components: int = 2,
    random_state: int = 42,
) -> Tuple[np.ndarray, str]:
    """
    高次元ベクトル群を指定されたアルゴリズムで2Dまたは3Dに次元削減します。

    Args:
        vectors: N x D のベクトルリスト
        method: "UMAP", "PCA", または "t-SNE"
        n_components: 2 または 3
        random_state: 乱数シード

    Returns:
        (N x n_components の座標配列, 実際に適用されたアルゴリズム名)
    """
    X = np.asarray(vectors, dtype=np.float32)
    n_samples, n_features = X.shape

    actual_method = method.upper()

    # サンプル数が次元数より極端に少ない場合の調整
    if n_samples < n_components:
        raise ValueError(f"データ件数 ({n_samples}) が削減後次元数 ({n_components}) 未満です。")

    # UMAP処理
    if actual_method == "UMAP":
        if UMAP_AVAILABLE:
            try:
                # n_neighbors はサンプル数に応じて調整
                n_neighbors = min(15, max(2, n_samples - 1))
                reducer = umap.UMAP(
                    n_components=n_components,
                    n_neighbors=n_neighbors,
                    min_dist=0.1,
                    metric="cosine",
                    random_state=random_state,
                )
                coords = reducer.fit_transform(X)
                return coords, "UMAP"
            except Exception as e:
                print(f"UMAP実行エラー、PCAへ自動フォールバック: {e}")
                actual_method = "PCA"
        else:
            print("UMAPが利用不可のため、PCAへ自動フォールバック")
            actual_method = "PCA"

    # t-SNE処理
    if actual_method in ["TSNE", "T-SNE"]:
        perplexity = min(30.0, max(2.0, (n_samples - 1) / 3.0))
        # 高次元の場合はまずPCAで前処理（50次元以下に圧縮）して安定化
        if n_features > 50:
            pca_pre = PCA(n_components=min(50, n_samples), random_state=random_state)
            X_pre = pca_pre.fit_transform(X)
        else:
            X_pre = X

        tsne = TSNE(
            n_components=n_components,
            perplexity=perplexity,
            metric="euclidean",
            random_state=random_state,
            max_iter=1000,
        )
        coords = tsne.fit_transform(X_pre)
        return coords, "t-SNE"

    # PCA処理（デフォルト・安定フォールバック）
    pca = PCA(n_components=n_components, random_state=random_state)
    coords = pca.fit_transform(X)
    return coords, "PCA"


def perform_clustering(
    vectors: List[List[float]],
    n_clusters: int = 5,
    random_state: int = 42,
) -> np.ndarray:
    """
    ベクトルデータに対してK-Meansクラスタリングを実行し、クラスタラベルを返します。
    """
    X = np.asarray(vectors, dtype=np.float32)
    n_samples = len(X)
    effective_k = min(n_clusters, max(1, n_samples))

    kmeans = KMeans(
        n_clusters=effective_k,
        random_state=random_state,
        n_init=10,
    )
    labels = kmeans.fit_predict(X)
    return labels

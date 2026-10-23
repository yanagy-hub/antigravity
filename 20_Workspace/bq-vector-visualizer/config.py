"""
BigQuery Vector Visualizer 設定定数モジュール
"""
import os
from typing import Dict, Any

# デフォルトのGCPプロジェクトID（ローカル環境の設定を優先、フォールバック値あり）
DEFAULT_PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "vocal-affinity-476201-j5")

# デフォルトのデータ取得件数制限
DEFAULT_ROW_LIMIT = 500
MAX_ROW_LIMIT = 5000
MIN_ROW_LIMIT = 50

# 次元削減手法の定義
REDUCTION_METHODS = {
    "UMAP": "トポロジー構造（局所・大局のバランス）を忠実に保持する高速な非線形アルゴリズム（推奨）",
    "PCA": "分散が最大となる直交軸を抽出する線形アルゴリズム（超高速・大局把握）",
    "t-SNE": "局所的なクラスタ構造を強調して分離する確率的アルゴリズム",
}

# デフォルトのクラスタ数（K-Means）
DEFAULT_K_CLUSTERS = 5

# Gemini Embeddingモデル名
DEFAULT_EMBEDDING_MODEL = "text-embedding-004"

# アプリケーションメタデータ
APP_TITLE = "BigQuery Vector Visualizer"
APP_ICON = "🧭"
APP_SUBTITLE = "BigQuery上の高次元埋め込みベクトルを2D/3Dで対話的に探索・可視化"

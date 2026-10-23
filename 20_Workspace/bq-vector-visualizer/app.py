"""
BigQuery Vector Visualizer メインアプリケーション
Streamlit + Plotly + Gemini による高次元ベクトル情報の対話型可視化ダッシュボード
"""
import streamlit as st
import numpy as np
import pandas as pd

from config import APP_TITLE, APP_ICON, APP_SUBTITLE
from components.sidebar import render_sidebar
from components.scatter_plot import render_scatter_plot
from components.search_panel import render_search_panel
from components.metrics_panel import render_metrics_panel
from core.reducer import reduce_dimensions, perform_clustering


# ページ基本設定
st.set_page_config(
    page_title=APP_TITLE,
    page_icon=APP_ICON,
    layout="wide",
    initial_sidebar_state="expanded",
)


@st.cache_data(show_spinner="次元削減座標を計算中...")
def get_cached_reduced_coords(
    vectors_tuple: tuple,
    method: str,
    n_components: int,
) -> tuple:
    """
    次元削減の計算結果をキャッシュし、無駄な再計算を抑制します。
    """
    vectors_list = [list(v) for v in vectors_tuple]
    coords, actual_method = reduce_dimensions(
        vectors=vectors_list,
        method=method,
        n_components=n_components,
    )
    return coords, actual_method


def main():
    # サイドバーの描画と設定値の取得
    settings = render_sidebar()
    df = settings["df"]
    reduction_method = settings["reduction_method"]
    n_components = settings["n_components"]
    color_by = settings["color_by"]
    k_clusters = settings["k_clusters"]
    gemini_key = settings["gemini_key"]

    # ヘッダーエリア
    st.title(f"{APP_ICON} {APP_TITLE}")
    st.caption(f"{APP_SUBTITLE} | 現在のデータ: `{settings['dataset_info']}`")

    if df is None or df.empty or "vector" not in df.columns:
        st.warning("👈 左側のサイドバーから「デモ用サンプルデータをロード」または「BigQueryに接続」を選択してください。")
        st.info(
            "💡 **このツールでできること**:\n"
            "- BigQuery上の高次元埋め込みベクトル（768次元、1536次元など）を2D/3D散布図で可視化\n"
            "- UMAP / PCA / t-SNE による次元圧縮と K-Means クラスタリング\n"
            "- 自然言語クエリを入力して Gemini で埋め込みを生成し、空間上の類似Top-Nアイテムを星型ハイライト\n"
            "- アイテム間のコサイン類似度マトリクスや個別ベクトルの生データインスペクト"
        )
        return

    # 次元削減の実行（キャッシュ活用）
    vectors = df["vector"].tolist()
    # キャッシュキー用にタプルのタプルに変換
    vectors_tuple = tuple(tuple(v) for v in vectors)

    try:
        coords, applied_method = get_cached_reduced_coords(
            vectors_tuple=vectors_tuple,
            method=reduction_method,
            n_components=n_components,
        )
    except Exception as e:
        st.error(f"次元削減の計算中にエラーが発生しました: {e}")
        return

    if applied_method != reduction_method:
        st.warning(f"⚠️ 指定された '{reduction_method}' の依存環境が利用できないため、自動的に '{applied_method}' で描画しました。")

    # クラスタリング / 色分け系列の準備
    if color_by == "K-Means クラスタリング":
        cluster_labels = perform_clustering(vectors, n_clusters=k_clusters)
        color_series = pd.Series([f"Cluster {c+1}" for c in cluster_labels], index=df.index)
        color_label = "Cluster"
    else:
        color_series = df["category"] if "category" in df.columns else pd.Series(["Default"] * len(df))
        color_label = "Category"

    # タブレイアウト（メイン可視化 / 統計・インスペクタ / 生データ一覧）
    tab_viz, tab_metrics, tab_raw = st.tabs([
        "🌌 ベクトル空間散布図 & 自然言語検索",
        "📊 類似度マトリクス & インスペクタ",
        "📋 データテーブル一覧",
    ])

    with tab_viz:
        # Gemini自然言語検索パネル
        hi_indices, hi_scores, q_text = render_search_panel(df, gemini_key=gemini_key)

        st.markdown("---")

        # インタラクティブ散布図の描画
        render_scatter_plot(
            df=df,
            coords=coords,
            color_series=color_series,
            color_label=color_label,
            n_components=n_components,
            highlight_indices=hi_indices,
            similarity_scores=hi_scores,
        )

    with tab_metrics:
        render_metrics_panel(df, highlight_indices=hi_indices)

    with tab_raw:
        st.subheader("📋 取得済みデータ一覧")
        show_df = df.copy()
        # ベクトル配列は長すぎるのでプレビュー表示
        show_df["vector_preview"] = show_df["vector"].apply(
            lambda v: f"[{', '.join(f'{x:.3f}' for x in v[:5])}, ... ({len(v)} dims)]"
        )
        display_cols = [c for c in ["id", "category", "text", "vector_preview"] if c in show_df.columns]
        st.dataframe(show_df[display_cols], use_container_width=True, hide_index=True)


if __name__ == "__main__":
    main()

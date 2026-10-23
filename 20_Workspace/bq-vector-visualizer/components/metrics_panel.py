"""
メトリクス & コサイン類似度ヒートマップコンポーネント
データセットの統計情報、クラスタ分布、上位アイテム間のコサイン類似度マトリクスを描画します。
"""
from typing import Dict, List, Optional, Any
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st


def render_metrics_panel(
    df: pd.DataFrame,
    highlight_indices: Optional[List[int]] = None,
) -> None:
    """
    データセットの統計KPIおよび類似度ヒートマップを描画します。
    """
    st.subheader("📊 データ統計 & ベクトルインスペクタ")

    vectors = df["vector"].tolist()
    n_samples = len(vectors)
    dim = len(vectors[0]) if vectors else 0
    categories = df["category"].nunique() if "category" in df.columns else 1

    # KPIカード
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    with kpi1:
        st.metric("総レコード数", f"{n_samples:,} 件")
    with kpi2:
        st.metric("ベクトル次元数", f"{dim} 次元")
    with kpi3:
        st.metric("カテゴリ / クラスタ数", f"{categories}")
    with kpi4:
        st.metric("平均ベクトルノルム", f"{np.mean([np.linalg.norm(v) for v in vectors[:50]]):.2f}")

    # 上位アイテムまたはサンプルの類似度ヒートマップ
    st.markdown("---")
    st.markdown("##### 🌡️ アイテム間コサイン類似度マトリクス")

    # 対象アイテムの選定（検索結果Top-Nがあればそれを優先、なければ先頭8件）
    if highlight_indices and len(highlight_indices) >= 2:
        target_indices = highlight_indices[:10]
        matrix_title = "検索結果 Top-N アイテム間のコサイン類似度"
    else:
        target_indices = list(range(min(8, n_samples)))
        matrix_title = "サンプルアイテム間のコサイン類似度 (先頭8件)"

    target_vectors = [vectors[i] for i in target_indices]
    target_labels = [f"#{i+1} {df['id'].iloc[idx]}" for i, idx in enumerate(target_indices)]

    # マトリクス計算
    X = np.asarray(target_vectors, dtype=np.float32)
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms[norms == 0] = 1e-10
    sim_matrix = np.dot(X, X.T) / np.dot(norms, norms.T)
    sim_matrix = np.clip(sim_matrix, -1.0, 1.0)

    fig_heat = px.imshow(
        sim_matrix,
        x=target_labels,
        y=target_labels,
        color_continuous_scale="Viridis",
        labels=dict(x="Item", y="Item", color="Cosine Sim"),
        title=matrix_title,
        text_auto=".2f",
    )
    fig_heat.update_layout(
        template="plotly_dark",
        height=450,
        margin=dict(l=40, r=40, b=40, t=50),
    )
    st.plotly_chart(fig_heat, use_container_width=True)

    # 個別ベクトルインスペクタ（アコーディオン）
    with st.expander("🔬 個別ベクトルの生データ・詳細インスペクタ"):
        selected_idx = st.selectbox(
            "インスペクトするアイテムを選択",
            options=target_indices,
            format_func=lambda i: f"[{df['id'].iloc[i]}] {df['text'].iloc[i][:50]}...",
        )
        if selected_idx is not None:
            vec = np.asarray(vectors[selected_idx], dtype=np.float32)
            c1, c2, c3 = st.columns(3)
            with c1:
                st.write(f"**L2 ノルム**: {np.linalg.norm(vec):.4f}")
            with c2:
                st.write(f"**最小値 / 最大値**: {np.min(vec):.4f} / {np.max(vec):.4f}")
            with c3:
                st.write(f"**平均 / 標準偏差**: {np.mean(vec):.4f} / {np.std(vec):.4f}")

            # 先頭30次元の棒グラフ
            first_n = min(30, len(vec))
            fig_bar = px.bar(
                x=[f"D{i+1}" for i in range(first_n)],
                y=vec[:first_n],
                labels={"x": "次元", "y": "値"},
                title=f"生ベクトル先頭 {first_n} 次元の値分布 ({df['id'].iloc[selected_idx]})",
                template="plotly_dark",
            )
            fig_bar.update_layout(height=280, margin=dict(l=20, r=20, b=30, t=40))
            st.plotly_chart(fig_bar, use_container_width=True)

"""
Plotly 2D/3D インタラクティブ散布図コンポーネント
高次元ベクトルの削減座標（2D/3D）を描画し、検索クエリに対するTop-N類似アイテムをハイライトします。
"""
from typing import Dict, List, Optional, Any
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st


def render_scatter_plot(
    df: pd.DataFrame,
    coords: np.ndarray,
    color_series: pd.Series,
    color_label: str,
    n_components: int = 2,
    highlight_indices: Optional[List[int]] = None,
    similarity_scores: Optional[List[float]] = None,
) -> None:
    """
    Plotlyによる2Dまたは3D散布図を描画します。

    Args:
        df: メタデータを含むDataFrame (id, text, category等)
        coords: N x 2 または N x 3 の座標配列
        color_series: 色分けに使用する系列（クラスタIDまたはカテゴリ名）
        color_label: 色分けの凡例ラベル
        n_components: 2 または 3
        highlight_indices: 検索結果Top-Nの行インデックスリスト
        similarity_scores: highlight_indices に対応するコサイン類似度スコア
    """
    plot_df = df.copy()
    plot_df["x"] = coords[:, 0]
    plot_df["y"] = coords[:, 1]
    if n_components == 3:
        plot_df["z"] = coords[:, 2]

    plot_df["color_group"] = color_series.astype(str)

    # ホバーテキストの成形
    hover_texts = []
    for i in range(len(plot_df)):
        item_id = plot_df["id"].iloc[i]
        text_snip = plot_df["text"].iloc[i]
        if len(text_snip) > 80:
            text_snip = text_snip[:80] + "..."
        group_val = plot_df["color_group"].iloc[i]

        info = f"<b>ID:</b> {item_id}<br><b>{color_label}:</b> {group_val}<br><b>Text:</b> {text_snip}"
        hover_texts.append(info)

    plot_df["hover_info"] = hover_texts

    highlight_set = set(highlight_indices) if highlight_indices else set()

    # 2D 散布図の場合
    if n_components == 2:
        fig = go.Figure()

        # 各グループごとにトレースを追加（凡例・フィルタリング可能）
        for group_name in sorted(plot_df["color_group"].unique()):
            group_mask = (plot_df["color_group"] == group_name) & (~plot_df.index.isin(highlight_set))
            sub_df = plot_df[group_mask]

            if not sub_df.empty:
                fig.add_trace(
                    go.Scatter(
                        x=sub_df["x"],
                        y=sub_df["y"],
                        mode="markers",
                        name=f"{group_name}",
                        text=sub_df["hover_info"],
                        hoverinfo="text",
                        marker=dict(
                            size=8,
                            opacity=0.75,
                            line=dict(width=0.5, color="white"),
                        ),
                    )
                )

        # 検索Top-Nのハイライト描画
        if highlight_indices:
            hi_df = plot_df.loc[highlight_indices].copy()
            hi_hover = []
            for rank, (orig_idx, row) in enumerate(hi_df.iterrows(), start=1):
                sim = similarity_scores[rank - 1] if similarity_scores else 0.0
                text_snip = row["text"]
                if len(text_snip) > 80:
                    text_snip = text_snip[:80] + "..."
                hi_hover.append(
                    f"⭐ <b>Rank #{rank} (類似度: {sim:.4f})</b><br>"
                    f"<b>ID:</b> {row['id']}<br>"
                    f"<b>Text:</b> {text_snip}"
                )

            fig.add_trace(
                go.Scatter(
                    x=hi_df["x"],
                    y=hi_df["y"],
                    mode="markers+text",
                    name="⭐ 検索Top-N近傍",
                    text=[f"#{r}" for r in range(1, len(hi_df) + 1)],
                    textposition="top center",
                    textfont=dict(color="#FF4B4B", size=12, family="Arial Black"),
                    hovertext=hi_hover,
                    hoverinfo="text",
                    marker=dict(
                        symbol="star",
                        size=18,
                        color="#FF4B4B",
                        line=dict(width=2, color="#FFFFFF"),
                    ),
                )
            )

        fig.update_layout(
            title=f"高次元ベクトル 2D 空間分布 (投影点数: {len(plot_df):,} 件)",
            xaxis_title="Dimension 1",
            yaxis_title="Dimension 2",
            template="plotly_dark",
            height=650,
            hovermode="closest",
            legend=dict(orientation="h", yanchor="bottom", y=-0.2, xanchor="center", x=0.5),
            margin=dict(l=40, r=40, b=80, t=50),
        )

    # 3D 散布図の場合
    else:
        fig = go.Figure()

        for group_name in sorted(plot_df["color_group"].unique()):
            group_mask = (plot_df["color_group"] == group_name) & (~plot_df.index.isin(highlight_set))
            sub_df = plot_df[group_mask]

            if not sub_df.empty:
                fig.add_trace(
                    go.Scatter3d(
                        x=sub_df["x"],
                        y=sub_df["y"],
                        z=sub_df["z"],
                        mode="markers",
                        name=f"{group_name}",
                        text=sub_df["hover_info"],
                        hoverinfo="text",
                        marker=dict(
                            size=5,
                            opacity=0.8,
                            line=dict(width=0.5, color="white"),
                        ),
                    )
                )

        if highlight_indices:
            hi_df = plot_df.loc[highlight_indices].copy()
            hi_hover = []
            for rank, (orig_idx, row) in enumerate(hi_df.iterrows(), start=1):
                sim = similarity_scores[rank - 1] if similarity_scores else 0.0
                text_snip = row["text"]
                if len(text_snip) > 80:
                    text_snip = text_snip[:80] + "..."
                hi_hover.append(
                    f"⭐ <b>Rank #{rank} (類似度: {sim:.4f})</b><br>"
                    f"<b>ID:</b> {row['id']}<br>"
                    f"<b>Text:</b> {text_snip}"
                )

            fig.add_trace(
                go.Scatter3d(
                    x=hi_df["x"],
                    y=hi_df["y"],
                    z=hi_df["z"],
                    mode="markers+text",
                    name="⭐ 検索Top-N近傍",
                    text=[f"#{r}" for r in range(1, len(hi_df) + 1)],
                    textposition="top center",
                    textfont=dict(color="#FF4B4B", size=13),
                    hovertext=hi_hover,
                    hoverinfo="text",
                    marker=dict(
                        symbol="diamond",
                        size=12,
                        color="#FF4B4B",
                        line=dict(width=2, color="#FFFFFF"),
                    ),
                )
            )

        fig.update_layout(
            title=f"高次元ベクトル 3D 空間分布 (投影点数: {len(plot_df):,} 件)",
            scene=dict(
                xaxis_title="Dim 1",
                yaxis_title="Dim 2",
                zaxis_title="Dim 3",
            ),
            template="plotly_dark",
            height=700,
            margin=dict(l=20, r=20, b=20, t=50),
        )

    st.plotly_chart(fig, use_container_width=True)

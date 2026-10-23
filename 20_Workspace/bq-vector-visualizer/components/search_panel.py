"""
Gemini自然言語検索 & 類似度ランキングパネルコンポーネント
ユーザーの自然言語クエリから埋め込みを生成し、BigQueryデータ内の近傍Top-Nベクトルを特定します。
"""
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
import streamlit as st

from core.embedder import generate_embedding, calculate_cosine_similarities


def render_search_panel(
    df: pd.DataFrame,
    gemini_key: Optional[str] = None,
) -> Tuple[Optional[List[int]], Optional[List[float]], Optional[str]]:
    """
    自然言語ベクトル検索パネルを描画します。

    Returns:
        (Top-Nのインデックスリスト, 類似度スコアリスト, 検索クエリテキスト)
    """
    st.subheader("🔍 Gemini 自然言語ベクトル検索")
    st.caption("自然言語で探したい内容を入力すると、Geminiでベクトル化して最も近いアイテムを探索・ハイライトします。")

    col1, col2 = st.columns([4, 1])
    with col1:
        query_text = st.text_input(
            "検索クエリ (日本語・英語対応)",
            placeholder="例: トランスフォーマーの注意機構、クラウドのIAMセキュリティ、BigQueryのパーティショニング...",
            key="search_query_input",
        )
    with col2:
        top_k = st.number_input("Top-K", min_value=1, max_value=20, value=5, step=1)

    search_btn = st.button("🚀 ベクトル類似検索を実行", type="primary", use_container_width=True)

    # 検索実行または過去の検索結果維持
    if search_btn and query_text.strip():
        with st.spinner("クエリ埋め込み生成 & コサイン類似度計算中..."):
            vectors = df["vector"].tolist()
            dim = len(vectors[0]) if vectors else 768

            q_vec, is_real_api, msg = generate_embedding(
                text=query_text.strip(),
                api_key=gemini_key,
                target_dim=dim,
            )

            if q_vec is None:
                st.error(f"埋め込み生成に失敗しました: {msg}")
                return None, None, None

            if not is_real_api:
                st.info(f"ℹ️ {msg}")

            # コサイン類似度計算
            similarities = calculate_cosine_similarities(q_vec, vectors)

            # Top-K インデックス取得（降順ソート）
            top_indices = np.argsort(similarities)[::-1][:top_k].tolist()
            top_scores = [float(similarities[i]) for i in top_indices]

            # セッションに保存
            st.session_state["search_results"] = {
                "indices": top_indices,
                "scores": top_scores,
                "query": query_text.strip(),
            }

    # セッション内の検索結果を描画
    if "search_results" in st.session_state:
        res = st.session_state["search_results"]
        top_indices = res["indices"]
        top_scores = res["scores"]
        q_text = res["query"]

        st.markdown(f"#### 🎯 検索結果: 「**{q_text}**」 (Top {len(top_indices)} 件)")

        # 結果テーブルの作成
        result_rows = []
        for rank, (idx, score) in enumerate(zip(top_indices, top_scores), start=1):
            row = df.iloc[idx]
            result_rows.append({
                "Rank": f"#{rank}",
                "ID": row["id"],
                "コサイン類似度": f"{score:.4f} ({score*100:.1f}%)",
                "カテゴリ": row.get("category", "-"),
                "テキスト": row.get("text", "-"),
            })

        result_df = pd.DataFrame(result_rows)

        st.dataframe(
            result_df,
            use_container_width=True,
            hide_index=True,
            column_config={
                "Rank": st.column_config.TextColumn("順位", width="small"),
                "ID": st.column_config.TextColumn("ID", width="small"),
                "コサイン類似度": st.column_config.TextColumn("類似度", width="medium"),
                "カテゴリ": st.column_config.TextColumn("カテゴリ", width="medium"),
                "テキスト": st.column_config.TextColumn("内容", width="large"),
            },
        )

        if st.button("クリア", key="clear_search_btn"):
            del st.session_state["search_results"]
            st.rerun()

        return top_indices, top_scores, q_text

    return None, None, None

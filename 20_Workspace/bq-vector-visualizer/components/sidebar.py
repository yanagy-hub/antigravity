"""
サイドバー設定UIコンポーネント
データソース（BigQuery / デモデータ）の選択、カラムマッピング、
次元削減パラメータ、クラスタリング設定、Gemini APIキー管理を提供します。
"""
import os
from typing import Dict, Any, Optional
import streamlit as st

from config import (
    DEFAULT_PROJECT_ID,
    DEFAULT_ROW_LIMIT,
    MAX_ROW_LIMIT,
    MIN_ROW_LIMIT,
    REDUCTION_METHODS,
    DEFAULT_K_CLUSTERS,
    DEFAULT_EMBEDDING_MODEL,
)
from core.bq_client import (
    get_bq_client,
    list_datasets,
    list_tables,
    get_table_schema,
    fetch_vector_data,
)
from core.sample_data import generate_sample_dataset


def render_sidebar() -> Dict[str, Any]:
    """
    サイドバーを描画し、設定パラメータとロード済みDataFrameを含む辞書を返します。
    """
    st.sidebar.title("🧭 BQ Vector Settings")

    # 1. データソース選択
    st.sidebar.subheader("1. データソース選択")
    data_source = st.sidebar.radio(
        "モードを選択",
        options=["デモ用サンプルデータ (すぐ試す)", "BigQueryに接続"],
        index=0,
        help="BigQueryにテーブルがない場合でも、デモデータですぐに全機能を探索できます。",
    )

    loaded_df = None
    data_source_info = ""

    if data_source == "デモ用サンプルデータ (すぐ試す)":
        st.sidebar.info("💡 4カテゴリ・200件の高次元埋め込み（768次元）デモデータを生成します。")
        n_samples = st.sidebar.slider("トピック別サンプル件数", 20, 100, 50, step=10)
        if st.sidebar.button("🔄 デモデータをロード / 再生成", use_container_width=True):
            with st.spinner("デモデータを生成中..."):
                loaded_df = generate_sample_dataset(n_samples_per_topic=n_samples)
                st.session_state["dataset"] = loaded_df
                st.session_state["dataset_info"] = f"デモデータ ({len(loaded_df)} 件, 768次元)"
        elif "dataset" in st.session_state and "デモ" in st.session_state.get("dataset_info", ""):
            loaded_df = st.session_state["dataset"]
        else:
            # 初回ロード
            loaded_df = generate_sample_dataset(n_samples_per_topic=n_samples)
            st.session_state["dataset"] = loaded_df
            st.session_state["dataset_info"] = f"デモデータ ({len(loaded_df)} 件, 768次元)"

    else:
        # BigQuery接続モード
        project_id = st.sidebar.text_input("GCP Project ID", value=DEFAULT_PROJECT_ID)
        client = get_bq_client(project_id)

        if client is None:
            st.sidebar.error("⚠️ BigQueryクライアントを初期化できませんでした。gcloud auth application-default login を確認してください。")
        else:
            st.sidebar.success(f"✅ GCP接続OK: {project_id}")

            # データセット一覧
            datasets = list_datasets(client)
            if datasets:
                selected_dataset = st.sidebar.selectbox("データセットを選択", options=datasets)
            else:
                selected_dataset = st.sidebar.text_input("データセットIDを入力")

            # テーブル一覧
            tables = list_tables(client, selected_dataset) if selected_dataset else []
            if tables:
                selected_table = st.sidebar.selectbox("テーブルを選択", options=tables)
            else:
                selected_table = st.sidebar.text_input("テーブルIDを入力")

            # スキーマ確認 & カラム選択
            if selected_dataset and selected_table:
                schema = get_table_schema(client, selected_dataset, selected_table)
                col_names = [f["name"] for f in schema] if schema else []

                # ベクトル列の候補（ARRAY型やvectorを含むカラムを優先）
                vector_candidates = [
                    f["name"] for f in schema
                    if "ARRAY" in f["field_type"] or f["mode"] == "REPEATED" or "vector" in f["name"].lower() or "embedding" in f["name"].lower()
                ] or col_names

                vector_col = st.sidebar.selectbox(
                    "ベクトルカラム (ARRAY<FLOAT64>等)",
                    options=vector_candidates or ["vector"],
                    help="埋め込みベクトルが格納されている配列またはJSON文字列カラム",
                )

                text_col = st.sidebar.selectbox(
                    "テキスト/タイトルカラム (ホバー・詳細表示)",
                    options=["(なし)"] + col_names,
                    index=1 if col_names else 0,
                )
                text_col_val = None if text_col == "(なし)" else text_col

                id_col = st.sidebar.selectbox(
                    "IDカラム",
                    options=["(自動採番)"] + col_names,
                    index=0,
                )
                id_col_val = None if id_col == "(自動採番)" else id_col

                cat_col = st.sidebar.selectbox(
                    "カテゴリ/ラベルカラム (色分け用)",
                    options=["(なし)"] + col_names,
                    index=0,
                )
                cat_col_val = None if cat_col == "(なし)" else cat_col

                row_limit = st.sidebar.slider(
                    "取得上限行数 (LIMIT)",
                    min_value=MIN_ROW_LIMIT,
                    max_value=MAX_ROW_LIMIT,
                    value=DEFAULT_ROW_LIMIT,
                    step=50,
                )

                if st.sidebar.button("🚀 BigQueryからデータ取得", type="primary", use_container_width=True):
                    with st.spinner("BigQueryからベクトルデータを取得・クレンジング中..."):
                        df, err = fetch_vector_data(
                            client=client,
                            dataset_id=selected_dataset,
                            table_id=selected_table,
                            vector_col=vector_col,
                            id_col=id_col_val,
                            text_col=text_col_val,
                            category_col=cat_col_val,
                            limit=row_limit,
                        )
                        if err:
                            st.sidebar.error(err)
                        else:
                            dim = len(df["vector"].iloc[0]) if not df.empty else 0
                            st.session_state["dataset"] = df
                            st.session_state["dataset_info"] = f"BQ: {selected_dataset}.{selected_table} ({len(df)} 件, {dim}次元)"
                            st.sidebar.success(f"取得成功! {len(df)} 件 (次元: {dim})")

        if "dataset" in st.session_state and "BQ:" in st.session_state.get("dataset_info", ""):
            loaded_df = st.session_state["dataset"]

    # 2. 可視化 & アルゴリズム設定
    st.sidebar.markdown("---")
    st.sidebar.subheader("2. 可視化 & 次元削減設定")

    reduction_method = st.sidebar.selectbox(
        "次元削減アルゴリズム",
        options=list(REDUCTION_METHODS.keys()),
        index=0,
        help="UMAP: トポロジー重視 / PCA: 高速・線形 / t-SNE: 局所クラスタ強調",
    )

    dimensions = st.sidebar.radio("表示次元", options=["2D 散布図", "3D 散布図"], index=0, horizontal=True)
    n_components = 3 if "3D" in dimensions else 2

    # 色分け基準
    has_categories = loaded_df is not None and "category" in loaded_df.columns and loaded_df["category"].nunique() > 1
    color_options = ["K-Means クラスタリング"]
    if has_categories:
        color_options.append("データの既存カテゴリ列")

    color_by = st.sidebar.selectbox("ポイントの色分け", options=color_options)

    k_clusters = DEFAULT_K_CLUSTERS
    if color_by == "K-Means クラスタリング":
        k_clusters = st.sidebar.slider("クラスタ数 (K)", 2, 10, DEFAULT_K_CLUSTERS)

    # 3. Gemini API設定
    st.sidebar.markdown("---")
    st.sidebar.subheader("3. Gemini API設定 (自然言語検索)")
    gemini_key = st.sidebar.text_input(
        "Gemini API Key",
        value=os.environ.get("GEMINI_API_KEY", ""),
        type="password",
        help="自然言語検索でテキストから埋め込みベクトルを生成する際に使用します（未入力時はデモ検索モード）。",
    )
    if gemini_key:
        os.environ["GEMINI_API_KEY"] = gemini_key

    return {
        "df": loaded_df,
        "dataset_info": st.session_state.get("dataset_info", "未ロード"),
        "reduction_method": reduction_method,
        "n_components": n_components,
        "color_by": color_by,
        "k_clusters": k_clusters,
        "gemini_key": gemini_key,
    }

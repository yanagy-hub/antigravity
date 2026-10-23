"""
BigQueryクライアント & データ取得モジュール
BigQueryからのスキーマ取得、データ抽出、ベクトル配列パースおよびクレンジングを行います。
"""
import json
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

try:
    from google.cloud import bigquery
    from google.api_core.exceptions import GoogleAPIError
    BQ_AVAILABLE = True
except ImportError:
    BQ_AVAILABLE = False
    bigquery = None


def get_bq_client(project_id: Optional[str] = None) -> Optional[Any]:
    """
    BigQueryクライアントインスタンスを初期化して返します。
    ADC（Application Default Credentials）を使用します。
    """
    if not BQ_AVAILABLE:
        return None
    try:
        return bigquery.Client(project=project_id)
    except Exception as e:
        print(f"BigQueryクライアント初期化エラー: {e}")
        return None


def list_datasets(client: Any) -> List[str]:
    """プロジェクト内のデータセットID一覧を取得します。"""
    if client is None:
        return []
    try:
        datasets = list(client.list_datasets())
        return [ds.dataset_id for ds in datasets]
    except Exception as e:
        print(f"データセット一覧取得エラー: {e}")
        return []


def list_tables(client: Any, dataset_id: str) -> List[str]:
    """指定データセット内のテーブルID一覧を取得します。"""
    if client is None or not dataset_id:
        return []
    try:
        tables = list(client.list_tables(dataset_id))
        return [table.table_id for table in tables]
    except Exception as e:
        print(f"テーブル一覧取得エラー: {e}")
        return []


def get_table_schema(client: Any, dataset_id: str, table_id: str) -> List[Dict[str, str]]:
    """
    指定テーブルのスキーマ（カラム名とデータ型、モード）を取得します。
    """
    if client is None or not dataset_id or not table_id:
        return []
    try:
        table_ref = f"{client.project}.{dataset_id}.{table_id}"
        table = client.get_table(table_ref)
        schema_info = []
        for field in table.schema:
            schema_info.append({
                "name": field.name,
                "field_type": field.field_type,
                "mode": field.mode,
            })
        return schema_info
    except Exception as e:
        print(f"テーブルスキーマ取得エラー: {e}")
        return []


def estimate_query_cost(client: Any, query: str) -> Optional[int]:
    """
    クエリのDRY RUNを実行し、スキャン推定バイト数を返します（課金発生なし）。
    """
    if client is None:
        return None
    try:
        job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
        query_job = client.query(query, job_config=job_config)
        return query_job.total_bytes_processed
    except Exception as e:
        print(f"DRY RUN見積もりエラー: {e}")
        return None


def parse_vector_value(raw_val: Any) -> Optional[np.ndarray]:
    """
    様々な形式（List, ndarray, JSON文字列, カンマ区切り文字列）の生データを
    float32のnumpy配列に変換・クレンジングします。失敗時はNoneを返します。
    """
    if raw_val is None:
        return None

    # すでに ndarray または list の場合
    if isinstance(raw_val, (list, tuple, np.ndarray)):
        try:
            arr = np.asarray(raw_val, dtype=np.float32)
            if arr.ndim == 1 and arr.size > 0 and not np.isnan(arr).any():
                return arr
        except Exception:
            return None

    # 文字列形式の場合（JSON配列 "[0.1, 0.2, ...]" や "0.1, 0.2, ..."）
    if isinstance(raw_val, str):
        val_str = raw_val.strip()
        if not val_str:
            return None
        # JSONパースを試行
        if val_str.startswith("[") and val_str.endswith("]"):
            try:
                parsed = json.loads(val_str)
                arr = np.asarray(parsed, dtype=np.float32)
                if arr.ndim == 1 and arr.size > 0 and not np.isnan(arr).any():
                    return arr
            except Exception:
                pass
        # カンマ区切りパースを試行
        try:
            parts = [float(x.strip()) for x in val_str.replace("[", "").replace("]", "").split(",") if x.strip()]
            arr = np.asarray(parts, dtype=np.float32)
            if arr.ndim == 1 and arr.size > 0 and not np.isnan(arr).any():
                return arr
        except Exception:
            return None

    return None


def fetch_vector_data(
    client: Any,
    dataset_id: str,
    table_id: str,
    vector_col: str,
    id_col: Optional[str] = None,
    text_col: Optional[str] = None,
    category_col: Optional[str] = None,
    limit: int = 500,
) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
    """
    BigQueryテーブルからベクトルデータとメタデータを取得し、クレンジング済みDataFrameを返します。

    Returns:
        (DataFrame, エラーメッセージ文字列)
    """
    if client is None:
        return None, "BigQueryクライアントが初期化されていません（ライブラリまたは認証を確認してください）。"

    # カラムの組み立て
    cols_to_select = [f"`{vector_col}`"]
    if id_col and id_col != vector_col:
        cols_to_select.append(f"`{id_col}`")
    if text_col and text_col not in cols_to_select and text_col != vector_col:
        cols_to_select.append(f"`{text_col}`")
    if category_col and category_col not in cols_to_select and category_col != vector_col:
        cols_to_select.append(f"`{category_col}`")

    table_ref = f"`{client.project}.{dataset_id}.{table_id}`"
    query = f"SELECT {', '.join(cols_to_select)} FROM {table_ref} LIMIT {int(limit)}"

    try:
        df = client.query(query).to_dataframe()
    except Exception as e:
        return None, f"クエリ実行に失敗しました: {str(e)}"

    if df.empty:
        return None, "クエリ結果が0件でした。"

    # ベクトルデータのパースとクレンジング
    parsed_vectors = []
    valid_indices = []
    expected_dim = None

    for idx, raw_vec in enumerate(df[vector_col]):
        vec = parse_vector_value(raw_vec)
        if vec is not None:
            if expected_dim is None:
                expected_dim = len(vec)
            # 次元数が一致するもののみ採用
            if len(vec) == expected_dim:
                parsed_vectors.append(vec.tolist())
                valid_indices.append(idx)

    if not parsed_vectors:
        return None, f"カラム '{vector_col}' から有効な浮動小数点ベクトルを抽出できませんでした。"

    # 有効行のみフィルタ
    clean_df = df.iloc[valid_indices].copy().reset_index(drop=True)
    clean_df["vector"] = parsed_vectors

    # ID列の標準化
    if id_col and id_col in clean_df.columns:
        clean_df["id"] = clean_df[id_col].astype(str)
    else:
        clean_df["id"] = [f"ROW-{i+1:04d}" for i in range(len(clean_df))]

    # テキスト列の標準化
    if text_col and text_col in clean_df.columns:
        clean_df["text"] = clean_df[text_col].astype(str)
    else:
        clean_df["text"] = clean_df["id"]

    # カテゴリ列の標準化
    if category_col and category_col in clean_df.columns:
        clean_df["category"] = clean_df[category_col].astype(str)
    else:
        clean_df["category"] = "Default"

    return clean_df, None

"""
デモ用サンプルデータ生成モジュール
BigQuery接続なしでも即座に高次元ベクトルの可視化と検索を体験可能にします。
"""
from typing import Dict, List, Any
import numpy as np
import pandas as pd


# 4つのトピックと代表的な日本語テキストサンプル
SAMPLE_TOPICS = {
    "AI & 機械学習": [
        "トランスフォーマーモデルの自己注意機構（Self-Attention）の理論的解析",
        "強化学習における報酬関数設計と方策勾配法（PPO）の実装",
        "大規模言語モデルの量子化（FP16からINT4）と推論高速化技術",
        "拡散モデル（Diffusion Model）を用いた画像生成とノイズ除去プロセス",
        "ファインチューニングにおけるLoRA（Low-Rank Adaptation）のパラメータ効率",
        "Few-shot学習におけるプロンプトエンジニアリングと文脈内学習の仕組み",
        "敵対的生成ネットワーク（GAN）による異常検知と潜在空間探索",
        "自律型AIエージェントの計画立案アルゴリズムとReActフレームワーク",
        "マルチモーダルAIにおけるテキストと画像の共通埋め込み空間学習",
        "グラフニューラルネットワーク（GNN）による分子構造と物性予測",
    ],
    "クラウド & インフラ": [
        "Kubernetesクラスタにおけるオートスケーリング（HPA/KEDA）の設定運用",
        "Terraformによるマルチクラウドインフラの宣言的プロビジョニング",
        "Google Cloud PlatformにおけるVPC Service Controlsとセキュリティ境界設計",
        "Dockerコンテナのマルチステージビルドによるイメージサイズ軽量化",
        "マイクロサービスアーキテクチャにおけるIstioサービスメッシュと分散トレーシング",
        "CI/CDパイプライン（GitHub Actions）による自動テストとゼロダウンタイムデプロイ",
        "Cloud Runにおけるサーバーレスコンテナのコールドスタート対策と最小インスタンス設定",
        "クラウドネイティブな可観測性（OpenTelemetryとPrometheus/Grafana）の構築",
        "IAM最小権限の原則に基づくサービスアカウントのロール設計と監査ログ分析",
        "エッジコンピューティングとCDNキャッシュ戦略による低レイテンシ配信",
    ],
    "データ分析 & BigQuery": [
        "BigQueryにおけるパーティショニングとクラスタリングによるクエリコスト最適化",
        "dbtを用いたELTデータモデリングとデータ品質テストの自動化",
        "BigQuery MLによるSQL完結型の需要予測時系列モデル構築",
        "データレイクハウス（BigLake）によるIceberg形式オープンデータの統合管理",
        "Streaming Ingestionによるリアルタイムログ分析基盤の設計",
        "探索的データ分析（EDA）における欠損値補完と特徴量エンジニアリング",
        "BigQueryのVECTOR_SEARCH関数を用いた高次元ベクトルの類似検索",
        "データリネージトラッキングとData Catalogによるメタデータガバナンス",
        "PandasとBigFramesを用いた大規模データフレーム処理の並列分散実行",
        "A/Bテストにおける統計的有意差検定（カイ二乗検定・t検定）と検出力分析",
    ],
    "自然言語処理 & 知識グラフ": [
        "BERTとRoBERTaによる文書分類および固有表現抽出（NER）タスク",
        "コサイン類似度とユークリッド距離を用いた文ベクトル類似性比較",
        "知識グラフ（Knowledge Graph）のエンティティリンキングと関係抽出",
        "Obsidian Vaultを活用した双方向リンク型PKM（個人知識管理）システム",
        "埋め込みベクトルインデックス（HNSW / ScaNN）の近似最近傍探索アルゴリズム",
        "形態素解析エンジン（MeCab/Sudachi）による日本語テキストのトークン化",
        "ベクトルデータベース（Pinecone, Milvus, Qdrant）とBigQueryの比較検証",
        "RAGにおけるチャンク分割戦略（RecursiveCharacter / Semantic Chunking）の評価",
        "テキスト要約タスクにおけるBLEUスコアとROUGEスコアの自動評価指標",
        "意味検索（Semantic Search）による表記揺れを吸収した高精度情報検索",
    ],
}


def generate_sample_dataset(
    n_samples_per_topic: int = 50,
    embedding_dim: int = 768,
    random_seed: int = 42,
) -> pd.DataFrame:
    """
    リアルなクラスタ構造を持つデモ用埋め込みベクトルデータセットを生成します。

    Args:
        n_samples_per_topic: トピックごとのサンプル件数（合計 n_samples_per_topic * 4 件）
        embedding_dim: ベクトルの次元数（デフォルト: 768次元）
        random_seed: 乱数シード

    Returns:
        pd.DataFrame: id, title, category, vector, text を含むデータフレーム
    """
    rng = np.random.default_rng(random_seed)
    records = []

    # 各カテゴリの潜在中心ベクトル（直交に近い分離された中心）を生成
    n_topics = len(SAMPLE_TOPICS)
    topic_names = list(SAMPLE_TOPICS.keys())

    # トピックごとの中心ベクトルをランダム生成し正規化
    center_vectors = rng.normal(size=(n_topics, embedding_dim))
    center_vectors = center_vectors / np.linalg.norm(center_vectors, axis=1, keepdims=True)

    item_id = 1
    for topic_idx, (topic_name, sample_texts) in enumerate(SAMPLE_TOPICS.items()):
        center_vec = center_vectors[topic_idx]

        for i in range(n_samples_per_topic):
            # サンプルテキストを循環選択＋バリエーション付与
            base_text = sample_texts[i % len(sample_texts)]
            variant_num = (i // len(sample_texts)) + 1
            text = f"{base_text} (Case #{variant_num})" if variant_num > 1 else base_text

            # 中心ベクトルにガウスノイズを加えて個々のベクトルを生成（クラスタ性を保持）
            noise = rng.normal(scale=0.35, size=embedding_dim)
            vec = center_vec + noise
            # L2正規化（単位ベクトル化: コサイン類似度計算用）
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm

            records.append({
                "id": f"DEMO-{item_id:04d}",
                "category": topic_name,
                "text": text,
                "vector": vec.tolist(),
            })
            item_id += 1

    df = pd.DataFrame(records)
    return df

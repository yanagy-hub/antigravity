# 🧭 BigQuery Vector Visualizer (BQ Vector Explorer)

BigQuery上に格納された高次元埋め込みベクトル（Text Embeddings, Multimodal Embeddings等）を、2D/3D空間で対話的に探索・分析・検索するためのStreamlitダッシュボードアプリケーションです。

---

## 🌟 主な特徴

1. **BigQuery 汎用接続 & スキーマ自動検出**:
   - 画面サイドバーから任意の GCP プロジェクト、データセット、テーブル、ベクトルカラム（`ARRAY<FLOAT64>` 等）を指定可能。
   - LIMIT句による取得上限設定と、DRY RUN による推定スキャンバイト数確認で安全・低コストに運用。
2. **ワンクリック即時デモモード**:
   - BigQueryテーブルが手元にない場合でも、「デモデータをロード」ボタンで4カテゴリ・200件の埋め込みサンプル（768次元）を即座に生成し、全機能を体験可能。
3. **高次元ベクトルの2D/3D対話型散布図 (Plotly)**:
   - **UMAP**（トポロジー保持）、**PCA**（高速・大局線形）、**t-SNE**（局所クラスタ強調）の3つの次元削減アルゴリズムに対応。
   - 2D / 3D 表示のシームレスな切り替え。
   - K-Means クラスタリング（クラスタ数 $K$ 調整）または既存カテゴリによる色分け。
   - ホバー時にID、カテゴリ、元テキスト抜粋、クラスタ番号をツールチップ表示。
4. **Gemini 自然言語ベクトル検索 & 近傍ハイライト**:
   - 検索ボックスに「トランスフォーマーの注意機構」などの自然言語を入力すると、Gemini API で埋め込みを生成し、空間上の類似Top-N（近傍アイテム）を**星型マーカーで強調表示**。
   - コサイン類似度ランキングテーブルとメタデータ詳細を並行表示。
5. **コサイン類似度マトリクス & 生ベクトルインスペクタ**:
   - 上位アイテム間のコサイン類似度ヒートマップ表示。
   - 個別ベクトルの L2 ノルム、統計値、生次元値（先頭30次元）の棒グラフ表示。

---

## 🚀 起動方法

### ワンクリック起動（推奨）

```bash
cd 20_Workspace/bq-vector-visualizer
./run.sh
```

`run.sh` スクリプトは、`uv` を用いて `.python-version` と `uv.lock` に基づく仮想環境の同期を行い、Streamlit サーバーを起動します。

ブラウザで `http://localhost:8501` が開きます。

---

## 📂 ディレクトリ構成

```text
20_Workspace/bq-vector-visualizer/
├── app.py                     # Streamlit メインアプリケーション
├── config.py                  # 設定定数・デフォルト値
├── run.sh                     # ワンクリック起動スクリプト
├── pyproject.toml             # uv プロジェクト・依存定義ファイル
├── uv.lock                    # 依存パッケージロックファイル
├── .python-version            # 固定Pythonバージョン (3.12.5)
├── README.md                  # 本ドキュメント
├── core/                      # コアロジックパッケージ
│   ├── bq_client.py           # BigQuery接続・スキーマ取得・データ抽出
│   ├── reducer.py             # UMAP / PCA / t-SNE 次元削減・K-Means
│   ├── embedder.py            # Gemini 埋め込み生成 & コサイン類似度計算
│   └── sample_data.py         # デモ用サンプルデータ生成
├── components/                # Streamlit UIコンポーネント
│   ├── sidebar.py             # サイドバー設定UI
│   ├── scatter_plot.py        # Plotly 2D/3D 散布図
│   ├── search_panel.py        # Gemini自然言語検索 & ランキングテーブル
│   └── metrics_panel.py       # データ統計 & 類似度ヒートマップ
└── tests/                     # 単体テスト群
    ├── test_reducer.py
    ├── test_embedder.py
    └── test_sample_data.py
```

---

## 🧪 テストの実行

```bash
cd 20_Workspace/bq-vector-visualizer
uv run python -m unittest discover -s tests
```

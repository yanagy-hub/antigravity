# Python 環境・依存関係運用ルール

本ドキュメントは、`Dev_workspace` 配下における Python インタプリタ・仮想環境・パッケージ管理の統一ルールを定義します。
複数の Python 処理系（`pyenv`, `Anaconda`, `Homebrew` 等）による環境の分裂や依存関係の衝突を防ぐため、すべての開発・スクリプト運用は本ルールに従うものとします。

---

## 1. 環境分離の原則（どこに `.venv` を作るか）

`Dev_workspace` 内の Python コードは、性質に応じて以下の 2 パターンで運用します。**ワークスペースルート直下に全アプリ共通の巨大な `.venv` を作成することは禁止**します。

| 対象領域 | 外部パッケージ | 仮想環境 (`.venv`) | 実行方法 |
| :--- | :--- | :--- | :--- |
| `90_System/91_Scripts/` 等のシステムスクリプト・標準ライブラリ製ツール | **原則不要**（標準ライブラリのみ） | **作成しない** | `python3 <script.py>` |
| `20_Workspace/<アプリ名>/` 等の外部依存を持つアプリケーション | **あり** | **アプリ直下に個別作成** | `uv run ...` |

---

## 2. パッケージ・仮想環境管理の標準ツール（`uv` 一本化）

外部パッケージを使用するプロジェクトでは、パッケージマネージャとして **`uv`** を標準採用します。

### 禁止事項
- グローバル環境やシステム Python への直接の `pip install`
- `requirements.txt` と `pyproject.toml` の二重管理（原則として `pyproject.toml` + `uv.lock` に統一）
- `Anaconda`（`/opt/anaconda3/bin`）など別系統の Python を暗黙的に参照する運用

### 基本コマンド
- **パッケージの追加・削除**:
  ```bash
  uv add <package_name>
  uv remove <package_name>
  ```
- **環境同期（ロックファイルに基づく再現）**:
  ```bash
  uv sync
  ```
- **アプリ・テストの実行（手動 `activate` 不要）**:
  ```bash
  uv run streamlit run app.py
  uv run python -m unittest discover -s tests
  ```

---

## 3. Python バージョンの固定ルール

環境によって `pyenv` と `Anaconda` / `Homebrew` の Python が切り替わる事故を防ぐため、`.venv` を持つプロジェクト直下には必ず **`.python-version`** を配置します。

```bash
# 例: Python 3.12.5 に固定する場合
uv python pin 3.12.5
```

- 仮想環境が別バージョンの Python を参照していないか確認する場合は、`.venv/pyvenv.cfg` の `home` および `version_info` を確認してください。

---

## 4. 新規 Python アプリ立ち上げ時の手順

`20_Workspace/<新規アプリ名>/` を作成する際は、以下の手順で初期化します。

```bash
cd 20_Workspace/<新規アプリ名>
uv init --no-workspace
uv python pin 3.12.5
uv add <必要なパッケージ>
```

※ `Dev_workspace` 全体を uv workspace として扱わないよう、プロジェクト単位で独立させます。

---

## 5. Git 管理ルール

- **コミット対象（必須）**:
  - `pyproject.toml`
  - `uv.lock`
  - `.python-version`
- **コミット除外（`.gitignore` 管理）**:
  - `.venv/`（`**/.venv/`）
  - `__pycache__/`（`**/__pycache__/`）
  - `*.py[cod]`

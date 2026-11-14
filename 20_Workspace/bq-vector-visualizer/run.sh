#!/usr/bin/env bash
# ==============================================================================
# BigQuery Vector Visualizer 起動スクリプト (macOS / Linux)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "=========================================================="
echo "🧭 Starting BigQuery Vector Visualizer..."
echo "Directory: ${SCRIPT_DIR}"
echo "=========================================================="

if ! command -v uv >/dev/null 2>&1; then
    echo "❌ 'uv' が見つかりません。'brew install uv' 等でインストールしてください。"
    exit 1
fi

echo "⚡ Syncing dependencies via uv..."
uv sync

echo "=========================================================="
echo "🚀 Launching Streamlit Dashboard on http://localhost:8501"
echo "=========================================================="
uv run streamlit run app.py --server.port=8501 --server.headless=false

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

# uv が利用可能かチェック
if command -v uv >/dev/null 2>&1; then
    echo "⚡ Using 'uv' package manager..."
    if [ ! -d ".venv" ]; then
        echo "Creating virtual environment via uv..."
        uv venv .venv
    fi
    source .venv/bin/activate
    echo "Installing/verifying dependencies..."
    uv pip install -r requirements.txt
else
    echo "🐍 Using standard python3 / pip..."
    if [ ! -d ".venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    echo "Installing/verifying dependencies..."
    pip install -r requirements.txt
fi

echo "=========================================================="
echo "🚀 Launching Streamlit Dashboard on http://localhost:8501"
echo "=========================================================="
streamlit run app.py --server.port=8501 --server.headless=false

#!/usr/bin/env bash
# English Coach App 起動スクリプト (ワンクリックVault直接同期対応サーバー)
cd "$(dirname "$0")" || exit
echo "🚀 English Coach App をローカルサーバーで起動します..."
echo "📍 URL: http://localhost:3000"
(sleep 1 && open "http://localhost:3000") &
python3 server.py 3000

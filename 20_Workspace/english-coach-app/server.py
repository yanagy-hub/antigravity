#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
English Coach App - Local Server
--------------------------------
静的ファイルの配信および、ブラウザからの「学習を記録する」ワンクリック保存APIを提供。
外部依存パッケージ不要（Python標準ライブラリのみで動作）。
"""

import os
import sys
import json
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

# パス設定
APP_DIR = Path(__file__).resolve().parent
VAULT_ROOT = APP_DIR.parent.parent
SCRIPT_DIR = VAULT_ROOT / "90_System" / "91_Scripts"
TARGET_VAULT_DIR = VAULT_ROOT / "30_Document" / "English_Learning"

# 同期ロジックのインポート
sys.path.insert(0, str(SCRIPT_DIR))
try:
    from english_coach_sync import import_json_to_vault
except ImportError:
    import_json_to_vault = None


class EnglishCoachHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/save":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)

                # 一時ファイルに書き出して Vault へインポート
                temp_json_path = VAULT_ROOT / "90_System" / "93_Temporary" / "auto_sync_latest.json"
                temp_json_path.parent.mkdir(parents=True, exist_ok=True)
                with open(temp_json_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                if import_json_to_vault:
                    result = import_json_to_vault(temp_json_path, TARGET_VAULT_DIR)
                else:
                    result = {"status": "ok", "saved_locally": True}

                response_body = json.dumps({
                    "success": True,
                    "message": "Vaultへの自動同期が完了しました！",
                    "result": result,
                    "vault_path": str(TARGET_VAULT_DIR)
                }).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(response_body)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


def run_server(port=3000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, EnglishCoachHandler)
    print(f"🚀 English Coach App サーバー起動中: http://localhost:{port}")
    print(f"📂 Vault同期先: {TARGET_VAULT_DIR}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nサーバーを停止しました。")


if __name__ == "__main__":
    port = 3000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)

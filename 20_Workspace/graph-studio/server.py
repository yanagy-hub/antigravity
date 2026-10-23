"""
Obsidian Dashboard & Graph Studio Server
Vaultのモニタリング、モーニングルーティン、およびGraph Engineering（ワークフロー実行・ナレッジトポロジー可視化）を提供する統合ローカルサーバー。
"""

import os
import re
import json
import glob
import time
import urllib.request
import urllib.parse
import threading
import subprocess
from pathlib import Path
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

PORT = 8000
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
SRC_DIR = os.path.join(SCRIPT_DIR, "src")
SCRIPTS_DIR = os.path.join(WORKSPACE_DIR, "90_System", "91_Scripts")

# Obsidian Vault のデフォルトパス
OBSIDIAN_VAULT_DIR = "/Users/tatsuya/Library/CloudStorage/GoogleDrive-yanagy8721@gmail.com/マイドライブ/PC共有用/obsidian"
VAULT_DIR = OBSIDIAN_VAULT_DIR if os.path.exists(OBSIDIAN_VAULT_DIR) else WORKSPACE_DIR

DAILY_DIR = os.path.join(VAULT_DIR, "20_Reflection/Daily")
NEWS_DIR = os.path.join(VAULT_DIR, "10_Capture/Agent/News")
TERMS_DIR = os.path.join(VAULT_DIR, "40_Knowledge/Terms")

# どこから実行されても 91_Scripts 配下のモジュールを読めるようにsys.pathに追加
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

# Graph Engine モジュールのインポート
from graph_engine.knowledge_graph import KnowledgeGraphAnalyzer
from graph_engine.builtin_workflows import get_all_workflows
from graph_engine.canvas_exporter import CanvasExporter
from graph_engine.checkpointer import FileCheckpointer

# 共有インスタンス
KG_ANALYZER = KnowledgeGraphAnalyzer(vault_root=Path(VAULT_DIR))
CHECKPOINTER = FileCheckpointer(base_dir=Path(WORKSPACE_DIR) / "90_System" / "93_Temporary" / "graph_checkpoints")

# モーニングルーティンのステータス管理
ROUTINE_STATUS = {
    "active": False,
    "steps": [
        {"id": 0, "name": "ニュースの取得と整理", "status": "pending"},
        {"id": 1, "name": "天候情報の自動記入", "status": "pending"},
        {"id": 2, "name": "自動内部リンクの生成", "status": "pending"},
        {"id": 3, "name": "週次・月次サマリーの作成", "status": "pending"},
        {"id": 4, "name": "リンク切れのクリーンアップ", "status": "pending"},
        {"id": 5, "name": "用語集のメンテナンスと拡充", "status": "pending"},
        {"id": 6, "name": "Gitリポジトリの更新", "status": "pending"}
    ]
}

# WMO天気コード変換
def get_weather_desc(weather_code):
    if weather_code in [0, 1]: return "晴れ"
    elif weather_code in [2, 3, 45, 48]: return "曇り"
    elif weather_code in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]: return "雨"
    elif weather_code in [71, 73, 75, 77, 85, 86]: return "雪"
    elif weather_code in [95, 96, 99]: return "雷雨"
    return "不明"

def fetch_online_weather(date_str):
    lat = 35.6895
    lon = 139.6917
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&start_date={date_str}&end_date={date_str}&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=surface_pressure&timezone=Asia/Tokyo"
    try:
        req = urllib.request.urlopen(url)
        res = json.loads(req.read())
        if "daily" not in res or not res["daily"].get("weathercode"):
            archive_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={date_str}&end_date={date_str}&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=surface_pressure&timezone=Asia/Tokyo"
            req = urllib.request.urlopen(archive_url)
            res = json.loads(req.read())
    except Exception:
        try:
            archive_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={date_str}&end_date={date_str}&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=surface_pressure&timezone=Asia/Tokyo"
            req = urllib.request.urlopen(archive_url)
            res = json.loads(req.read())
        except Exception:
            return None

    if "daily" not in res: return None
    daily = res["daily"]
    hourly = res.get("hourly", {})
    if not daily.get("weathercode") or daily["weathercode"][0] is None: return None

    weather_code = daily["weathercode"][0]
    weather_desc = get_weather_desc(weather_code)
    temp_max = round(daily["temperature_2m_max"][0]) if daily["temperature_2m_max"][0] is not None else None
    temp_min = round(daily["temperature_2m_min"][0]) if daily["temperature_2m_min"][0] is not None else None
    
    press_max, press_min = None, None
    if "surface_pressure" in hourly and hourly["surface_pressure"]:
        pressures = [p for p in hourly["surface_pressure"] if p is not None]
        if pressures:
            press_max = round(max(pressures))
            press_min = round(min(pressures))
            
    return {
        "weather": weather_desc,
        "temp_max": temp_max,
        "temp_min": temp_min,
        "press_max": press_max,
        "press_min": press_min,
        "source": "online"
    }

def get_vault_weather(date_str):
    files = glob.glob(os.path.join(DAILY_DIR, "**", f"{date_str}.md"), recursive=True)
    if not files: return None
    try:
        with open(files[0], "r", encoding="utf-8") as f:
            content = f.read()
        fm_match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
        if not fm_match: return None
        fm_text = fm_match.group(1)
        data = {}
        for line in fm_text.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                data[k.strip()] = v.strip().strip("'\"")
        
        weather = data.get("weather")
        if weather and weather not in ["", "null", "None"]:
            return {
                "weather": weather,
                "temp_max": int(data["temp_max"]) if data.get("temp_max") else None,
                "temp_min": int(data["temp_min"]) if data.get("temp_min") else None,
                "press_max": int(data["press_max"]) if data.get("press_max") else None,
                "press_min": int(data["press_min"]) if data.get("press_min") else None,
                "source": "vault"
            }
    except Exception:
        pass
    return None

def run_weather_script():
    global ROUTINE_STATUS
    ROUTINE_STATUS["steps"][1]["status"] = "running"
    script_path = os.path.join(SCRIPT_DIR, "get_weather_info.py")
    try:
        res = subprocess.run(["python3", script_path], capture_output=True, text=True)
        if res.returncode == 0:
            ROUTINE_STATUS["steps"][1]["status"] = "done"
        else:
            ROUTINE_STATUS["steps"][1]["status"] = "error"
    except Exception:
        ROUTINE_STATUS["steps"][1]["status"] = "error"


class DashboardHTTPRequestHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def _send_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        
        try:
            body = json.loads(post_data) if post_data else {}
        except Exception:
            body = {}

        # API: ワークフロー実行（同期）
        if path == "/api/graph/run":
            wf_key = body.get("workflow", "knowledge_emergence")
            inputs = body.get("inputs", {})
            workflows = get_all_workflows()
            if wf_key not in workflows:
                self._send_json({"error": f"ワークフロー '{wf_key}' は存在しません。"}, 404)
                return

            wf = workflows[wf_key]
            thread_id = f"run_{wf_key}_{int(time.time())}"
            compiled = wf.compile(checkpointer=CHECKPOINTER)
            
            try:
                res = compiled.invoke(inputs, thread_id=thread_id)
                history = CHECKPOINTER.get_history(thread_id)
                self._send_json({
                    "workflow": wf_key,
                    "thread_id": thread_id,
                    "result": res,
                    "history": history
                })
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        # API: Canvas出力
        elif path == "/api/graph/export-canvas":
            target_type = body.get("type", "workflow")  # "workflow" or "subgraph"
            wf_key = body.get("workflow")
            center_node = body.get("node")
            
            vault_root = Path(VAULT_DIR)
            temp_dir = vault_root / "00_System" / "Temporary"
            temp_dir.mkdir(parents=True, exist_ok=True)
            
            if target_type == "workflow" and wf_key:
                workflows = get_all_workflows()
                if wf_key in workflows:
                    wf = workflows[wf_key]
                    out_path = temp_dir / f"Workflow_{wf_key}.canvas"
                    CanvasExporter.export_workflow(wf.to_dict(), out_path)
                    self._send_json({"success": True, "file": str(out_path.relative_to(vault_root))})
                    return
            elif target_type == "subgraph" and center_node:
                sub = KG_ANALYZER.get_neighborhood_subgraph(center_node, max_depth=body.get("depth", 2))
                out_path = temp_dir / f"SubGraph_{center_node}.canvas"
                CanvasExporter.export_subgraph(sub, out_path)
                self._send_json({"success": True, "file": str(out_path.relative_to(vault_root))})
                return

            self._send_json({"error": "不正なパラメータです"}, 400)
            return

        self.send_error(404, "Not Found")

    def do_GET(self):
        global ROUTINE_STATUS
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # ----------------------------------------------------
        # Graph Engineering APIs
        # ----------------------------------------------------

        # API: 利用可能なワークフロー一覧
        if path == "/api/graph/workflows":
            workflows = get_all_workflows()
            result = {}
            for k, wf in workflows.items():
                result[k] = wf.to_dict()
            self._send_json(result)
            return

        # API: Vaultナレッジグラフデータ（Cytoscape / D3用）
        elif path == "/api/graph/topology":
            force_refresh = query.get("refresh", ["0"])[0] == "1"
            if force_refresh:
                KG_ANALYZER.index_vault(force=True)
            graph_data = KG_ANALYZER.get_graph_data()
            self._send_json(graph_data)
            return

        # API: 異分野架け橋（Bridge / Emergence）ノード
        elif path == "/api/graph/bridges":
            bridges = KG_ANALYZER.analyze_cross_domain_bridges()
            self._send_json(bridges)
            return

        # API: 近傍サブグラフ
        elif path == "/api/graph/subgraph":
            center = query.get("node", [""])[0]
            depth = int(query.get("depth", [2])[0])
            sub = KG_ANALYZER.get_neighborhood_subgraph(center, max_depth=depth)
            self._send_json(sub)
            return

        # API: 最短経路探索
        elif path == "/api/graph/path":
            start_node = query.get("start", [""])[0]
            end_node = query.get("end", [""])[0]
            path_result = KG_ANALYZER.find_shortest_path(start_node, end_node)
            self._send_json({"start": start_node, "end": end_node, "path": path_result})
            return

        # API: ワークフローリアルタイムストリーミング (SSE: Server-Sent Events)
        elif path == "/api/graph/stream":
            wf_key = query.get("workflow", ["knowledge_emergence"])[0]
            seeds_raw = query.get("seeds", [""])[0]
            seeds = [s.strip() for s in seeds_raw.split(",") if s.strip()]
            depth = int(query.get("depth", [2])[0])

            workflows = get_all_workflows()
            if wf_key not in workflows:
                self.send_error(404, f"Workflow '{wf_key}' not found")
                return

            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()

            wf = workflows[wf_key]
            thread_id = f"stream_{wf_key}_{int(time.time())}"
            compiled = wf.compile(checkpointer=CHECKPOINTER)
            inputs = {"seeds": seeds, "depth": depth, "content": "Sample Note Content"}

            try:
                for event in compiled.stream(inputs, thread_id=thread_id):
                    sse_msg = f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                    self.wfile.write(sse_msg.encode("utf-8"))
                    self.wfile.flush()
                    time.sleep(0.3)  # 視覚的なアニメーションのための適度なディレイ
            except Exception as e:
                err_msg = f"data: {json.dumps({'event': 'error', 'error': str(e)}, ensure_ascii=False)}\n\n"
                self.wfile.write(err_msg.encode("utf-8"))
                self.wfile.flush()
            return

        # ----------------------------------------------------
        # Routine & Stats APIs
        # ----------------------------------------------------

        # API: 天気情報
        elif path == "/api/weather":
            date_str = query.get("date", [datetime.now().strftime("%Y-%m-%d")])[0]
            data = get_vault_weather(date_str)
            if not data:
                data = fetch_online_weather(date_str)
            if not data:
                data = {
                    "date": date_str, "weather": "データなし",
                    "temp_max": None, "temp_min": None, "press_max": None, "press_min": None, "source": "none"
                }
            else:
                data["date"] = date_str
            self._send_json(data)
            return

        # API: 最新ニュース
        elif path == "/api/news":
            news_files = glob.glob(os.path.join(NEWS_DIR, "*.md"))
            news_by_date = {}
            for file_path in news_files:
                filename = os.path.basename(file_path)
                m = re.match(r"^(\d{4}-\d{2}-\d{2})_(.+)\.md$", filename)
                if m:
                    d_str, topic = m.groups()
                    news_by_date.setdefault(d_str, []).append((file_path, topic))
            latest_date = sorted(news_by_date.keys(), reverse=True)[0] if news_by_date else None
            target_news = news_by_date.get(latest_date, [])
            response_data = []
            for file_path, topic in target_news:
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    content_clean = re.sub(r"^---\n.*?\n---\n*", "", content, flags=re.DOTALL)
                    response_data.append({
                        "topic": topic, "date": latest_date, "content": content_clean.strip()
                    })
                except Exception:
                    pass
            self._send_json(response_data)
            return

        # API: 基本統計
        elif path == "/api/stats":
            daily_notes = glob.glob(os.path.join(DAILY_DIR, "**", "*.md"), recursive=True)
            news_current = glob.glob(os.path.join(NEWS_DIR, "*.md"))
            terms = glob.glob(os.path.join(TERMS_DIR, "**", "*.md"), recursive=True)
            KG_ANALYZER.index_vault()
            self._send_json({
                "daily_notes_count": len(daily_notes),
                "news_count": len(news_current),
                "terms_count": len(terms),
                "total_vault_nodes": len(KG_ANALYZER.nodes),
                "total_vault_edges": sum(len(v) for v in KG_ANALYZER.adj.values())
            })
            return

        # API: ルーティン開始
        elif path == "/api/routine/start":
            ROUTINE_STATUS["active"] = True
            for step in ROUTINE_STATUS["steps"]:
                step["status"] = "pending"
            ROUTINE_STATUS["steps"][0]["status"] = "running"
            t = threading.Thread(target=run_weather_script)
            t.start()
            self._send_json({"status": "started"})
            return

        # API: ルーティンステータス取得
        elif path == "/api/routine/status":
            self._send_json(ROUTINE_STATUS)
            return

        # API: ルーティンステータス更新
        elif path == "/api/routine/update":
            step_id = int(query.get("step", [-1])[0])
            status = query.get("status", ["pending"])[0]
            updated = False
            if 0 <= step_id < len(ROUTINE_STATUS["steps"]):
                ROUTINE_STATUS["steps"][step_id]["status"] = status
                updated = True
                if all(step["status"] == "done" for step in ROUTINE_STATUS["steps"]):
                    ROUTINE_STATUS["active"] = False
            self._send_json({"updated": updated})
            return

        # ----------------------------------------------------
        # 静的ファイルの配信
        # ----------------------------------------------------
        else:
            if path == "/":
                path = "/index.html"
            clean_path = path.lstrip("/")
            file_path = os.path.abspath(os.path.join(SRC_DIR, clean_path))
            
            if not file_path.startswith(SRC_DIR):
                self.send_error(403, "Access Denied")
                return
            
            if os.path.exists(file_path) and os.path.isfile(file_path):
                ext = os.path.splitext(file_path)[1].lower()
                mime_types = {
                    ".html": "text/html; charset=utf-8",
                    ".css": "text/css; charset=utf-8",
                    ".js": "application/javascript; charset=utf-8",
                    ".png": "image/png",
                    ".jpg": "image/jpeg",
                    ".svg": "image/svg+xml",
                    ".ico": "image/x-icon",
                    ".json": "application/json; charset=utf-8"
                }
                content_type = mime_types.get(ext, "application/octet-stream")
                try:
                    with open(file_path, "rb") as f:
                        file_data = f.read()
                    self.send_response(200)
                    self.send_header("Content-Type", content_type)
                    self.end_headers()
                    self.wfile.write(file_data)
                except Exception as e:
                    self.send_error(500, f"Internal Server Error: {str(e)}")
            else:
                self.send_error(404, "File Not Found")

def run(server_class=HTTPServer, handler_class=DashboardHTTPRequestHandler, port=PORT):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting Graph Studio & Dashboard server on http://localhost:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == "__main__":
    run()

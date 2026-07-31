import sys
import argparse
import json
import re

def parse_pytest_output(lines):
    result = {
        "status": "passed",
        "errors": []
    }
    
    # 簡易的なpytestのエラー解析ロジック（FAILED を探す）
    # 例: "FAILED tests/test_main.py::test_func - AssertionError: ..."
    error_pattern = re.compile(r"FAILED\s+(.*?)::(.*?)\s+-\s+(.*)")
    
    current_error = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if "FAILED" in line and "::" in line:
            result["status"] = "failed"
            match = error_pattern.search(line)
            if match:
                result["errors"].append({
                    "file": match.group(1).strip(),
                    "test_name": match.group(2).strip(),
                    "message": match.group(3).strip()
                })
            else:
                # 正規表現にマッチしなかった場合のフォールバック
                result["errors"].append({"raw": line})
                
        elif line.startswith("E   ") or line.startswith("E "):
            # トレースバックの詳細エラー行
            if result["errors"]:
                last_error = result["errors"][-1]
                if "traceback" not in last_error:
                    last_error["traceback"] = []
                last_error["traceback"].append(line.replace("E   ", "").replace("E ", ""))

    return result

def main():
    parser = argparse.ArgumentParser(description="Parse test output into JSON")
    parser.add_argument("--file", type=str, help="Path to the log file (reads from stdin if not provided)")
    args = parser.parse_args()

    lines = []
    if args.file:
        try:
            with open(args.file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}))
            sys.exit(1)
    else:
        # タイムアウト等でブロックしないよう標準入力を読む
        if not sys.stdin.isatty():
            lines = sys.stdin.readlines()
            
    if not lines:
        print(json.dumps({"status": "unknown", "message": "No input provided"}))
        sys.exit(0)

    parsed_result = parse_pytest_output(lines)
    print(json.dumps(parsed_result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()

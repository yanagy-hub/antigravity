import argparse
import json
import os
import sys

HISTORY_FILE = "Antigravity_Doc/93_Temporary/test_history.json"

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return None
    return None

def save_history(passed, failed):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, "w") as f:
        json.dump({"passed": passed, "failed": failed}, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description="Check for test regressions and suggest rollback")
    parser.add_argument("--passed", type=int, required=True, help="Number of passed tests")
    parser.add_argument("--failed", type=int, required=True, help="Number of failed tests")
    parser.add_argument("--files-changed", type=str, default="", help="Comma separated list of changed files")
    parser.add_argument("--reset", action="store_true", help="Reset test history")
    args = parser.parse_args()

    if args.reset:
        save_history(args.passed, args.failed)
        print(json.dumps({"status": "ok", "message": "History reset."}))
        sys.exit(0)

    history = load_history()
    
    # 初回実行時は記録のみ
    if not history:
        save_history(args.passed, args.failed)
        print(json.dumps({"status": "ok", "message": "First run recorded."}))
        sys.exit(0)

    prev_passed = history.get("passed", 0)
    current_passed = args.passed

    # 履歴を更新（常に最新の状態を保存するかどうかは要件によるが、今回は保存する）
    save_history(args.passed, args.failed)

    if current_passed < prev_passed:
        # 成功数が減っている = 他の箇所を壊した可能性が高い（デグレ）
        result = {
            "status": "regression_detected",
            "message": f"Regression! Passed tests decreased from {prev_passed} to {current_passed}.",
            "action_required": "Rollback the recent changes.",
            "rollback_commands": []
        }
        
        if args.files_changed:
            files = [f.strip() for f in args.files_changed.split(",")]
            for file in files:
                result["rollback_commands"].append(f"git checkout -- {file}")
        else:
            result["rollback_commands"].append("git restore .")
            
        print(json.dumps(result, indent=2))
        # デグレ検知として終了コード1を返す
        sys.exit(1)
        
    else:
        print(json.dumps({
            "status": "ok", 
            "message": "No regression detected.",
            "prev_passed": prev_passed,
            "current_passed": current_passed
        }, indent=2))
        sys.exit(0)

if __name__ == "__main__":
    main()

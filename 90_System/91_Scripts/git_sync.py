#!/usr/bin/env python3
"""
Git Sync Helper Script
リポジトリのステータスおよび差分を取得し、一括コミット・プッシュ用の情報を整理します。
"""

import subprocess
import sys

def run_command(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def get_git_status():
    stdout, stderr, code = run_command("git status --porcelain")
    if code != 0:
        print(f"Error getting git status: {stderr}", file=sys.stderr)
        return []
    lines = stdout.splitlines() if stdout else []
    return lines

def get_git_diff():
    stdout, stderr, code = run_command("git diff")
    if code != 0:
        return ""
    return stdout

def main():
    status_lines = get_git_status()
    if not status_lines:
        print("NO_CHANGES")
        return

    print("=== CHANGED FILES ===")
    for line in status_lines:
        print(line)

    print("\n=== GIT DIFF SUMMARY ===")
    diff = get_git_diff()
    if diff:
        # 最初の100行程度に制限して出力
        diff_lines = diff.splitlines()
        summary = "\n".join(diff_lines[:100])
        print(summary)
        if len(diff_lines) > 100:
            print(f"\n... ({len(diff_lines) - 100} lines truncated)")
    else:
        print("Untracked files only or no staged diff.")

if __name__ == "__main__":
    main()

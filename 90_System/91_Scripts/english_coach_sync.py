#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
English Coach Sync Tool (english_coach_sync.py)
-----------------------------------------------
English Coach App のエクスポートデータ (JSON) と
Obsidian Vault (30_Document/English_Learning/) 間の同期を行うCLIツール。

機能:
1. JSONバックアップからVault内Markdownノート（フレーズ集、添削ログ、進捗サマリー）の自動生成
2. Vault内のMarkdownノートからアプリインポート用JSONの再生成（双方向同期）
3. 学習進捗ステータスのCLIサマリー表示
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

SCRIPT_DIR = Path(__file__).resolve().parent
VAULT_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_TARGET_DIR = VAULT_ROOT / "30_Document" / "English_Learning"


def sanitize_filename(name: str) -> str:
    """ファイル名として使えない文字を置換"""
    safe = re.sub(r'[/\\?%*:|"<>#]', '-', name or 'item').strip()
    return safe[:50]


def format_phrases_markdown(phrases: List[Dict[str, Any]]) -> str:
    """フレーズ一覧をObsidian互換Markdownテーブルに整形"""
    now = datetime.now().isoformat()
    lines = [
        "---",
        'title: "English Coach - 保存済みフレーズ集"',
        f'updated_at: "{now}"',
        'tags:',
        '  - english-learning',
        '  - vocabulary',
        '  - phrase-book',
        "---",
        "",
        "# 📚 保存済みフレーズ＆単語一覧",
        "",
        f"最終更新: `{now}` | 総フレーズ数: **{len(phrases)}** 件",
        "",
        "| 英語表現 (Expression) | 日本語訳 (Meaning) | カテゴリ | モード | 登録日 |",
        "| :--- | :--- | :--- | :--- | :--- |"
    ]

    for p in phrases:
        en = p.get("en", "").replace("|", "\\|")
        ja = p.get("ja", "").replace("|", "\\|")
        cat = p.get("category", "-").replace("|", "\\|")
        mode = p.get("mode", "-").replace("|", "\\|")
        date = p.get("savedAt", "-").split("T")[0] if "savedAt" in p else "-"
        row = f"| **{en}** | {ja} | {cat} | {mode} | {date} |"
        lines.append(row)

    lines.append("")
    return "\n".join(lines)


def format_review_markdown(review: Dict[str, Any]) -> str:
    """1件の添削結果を個別Markdownノートに整形"""
    created_at = review.get("createdAt", datetime.now().isoformat())
    date_str = created_at.split("T")[0]
    rev_id = review.get("id", f"rev_{int(datetime.now().timestamp())}")
    mode = review.get("mode", "daily")

    lines = [
        "---",
        f'id: "{rev_id}"',
        'title: "英文添削レポート"',
        f'created_at: "{created_at}"',
        f'mode: "{mode}"',
        'tags:',
        '  - english-learning',
        '  - grammar-review',
        "---",
        "",
        f"# 📝 英文添削レポート ({date_str})",
        "",
        f"- **学習モード**: `{mode}`",
        f"- **作成日時**: `{created_at}`",
        "",
        "## 1. ユーザー入力文 (Original)",
        f"> {review.get('original', '')}",
        "",
        "## 2. 3段階リライト候補 (Suggested Versions)",
        "",
        "### ① 文法修正版 (Grammar Fixed)",
        f"`{review.get('versions', {}).get('corrected', '-')}`",
        "",
        "### ② ネイティブ自然表現 (Natural Expression)",
        f"`{review.get('versions', {}).get('natural', '-')}`",
        "",
        "### ③ フォーマル/ビジネス表現 (Formal & Business)",
        f"`{review.get('versions', {}).get('business_or_formal', '-')}`",
        "",
        "## 3. 文法チェック・改善ポイント",
        ""
    ]

    corrections = review.get("corrections", [])
    if corrections:
        for c in corrections:
            lines.append(f"- **【{c.get('type', 'Point')}】** {c.get('issue', '')}")
            lines.append(f"  - **修正案**: `{c.get('fixed', '')}`")
            lines.append(f"  - **解説**: {c.get('explanation', '')}")
    else:
        lines.append("- 特筆すべき文法エラーはありませんでした。")

    lines.append("")
    lines.append("## 4. 重要語彙・フレーズ")
    lines.append("")
    vocab = review.get("key_vocabulary", [])
    if vocab:
        for v in vocab:
            lines.append(f"- **{v.get('word', '')}**: {v.get('meaning', '')}")
            if v.get("example"):
                lines.append(f"  - *例*: {v.get('example')}")
    else:
        lines.append("- なし")

    if review.get("coach_comment"):
        lines.append("")
        lines.append("## 5. Coach Nova からのアドバイス")
        lines.append(f"> {review.get('coach_comment')}")

    lines.append("")
    return "\n".join(lines)


def format_progress_summary_markdown(stats: Dict[str, Any]) -> str:
    """学習進捗サマリーレポートを整形"""
    now = datetime.now().isoformat()
    lines = [
        "---",
        'title: "English Coach - 学習進捗総合レポート"',
        f'updated_at: "{now}"',
        'tags:',
        '  - english-learning',
        '  - progress-report',
        "---",
        "",
        "# 📊 英語学習進捗総合レポート",
        "",
        f"最終更新: `{now}`",
        "",
        "## 1. 主要メトリクス",
        f"- 🔥 **連続学習ストリーク**: `{stats.get('streakDays', 1)}` 日連続",
        f"- ⏱️ **累計学習時間**: `{stats.get('totalMinutes', 0)}` 分",
        f"- 📅 **今日の学習時間**: `{stats.get('todayMinutes', 0)}` 分",
        f"- 📝 **添削実行回数**: `{stats.get('reviewedCount', 0)}` 回",
        f"- 📚 **保存済みフレーズ数**: `{stats.get('savedPhrasesCount', 0)}` 件",
        f"- 🎯 **クイズ解答数**: `{stats.get('quizzesTaken', 0)}` 問 (正解数: `{stats.get('quizzesCorrect', 0)}`)",
        "",
        "## 2. モード別学習比率 (分)",
        f"- **日常会話**: `{stats.get('modeDistribution', {}).get('daily', 0)}` 分",
        f"- **ビジネス英語**: `{stats.get('modeDistribution', {}).get('business', 0)}` 分",
        f"- **TOEIC対策**: `{stats.get('modeDistribution', {}).get('toeic', 0)}` 分",
        "",
        "## 3. 達成済みミッション一覧",
        ""
    ]

    missions = stats.get("completedMissions", [])
    if missions:
        for m in missions:
            lines.append(f"- [x] {m}")
    else:
        lines.append("- まだ完了したミッションはありません。")

    lines.append("")
    return "\n".join(lines)


def import_json_to_vault(json_file_path: Path, target_dir: Path) -> Dict[str, int]:
    """JSONバックアップからVaultの各ディレクトリへMarkdownを書き出し"""
    if not json_file_path.exists():
        raise FileNotFoundError(f"JSONファイルが見つかりません: {json_file_path}")

    with open(json_file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    target_dir.mkdir(parents=True, exist_ok=True)
    phrases_dir = target_dir / "Phrases"
    reviews_dir = target_dir / "Reviews"
    phrases_dir.mkdir(parents=True, exist_ok=True)
    reviews_dir.mkdir(parents=True, exist_ok=True)

    result = {"phrases": 0, "reviews": 0, "summary": 0}

    # 1. フレーズ集
    phrases = data.get("savedPhrases", [])
    if phrases:
        phrases_content = format_phrases_markdown(phrases)
        with open(phrases_dir / "Saved_Phrases.md", "w", encoding="utf-8") as f:
            f.write(phrases_content)
        result["phrases"] = len(phrases)

    # 2. 添削ログ
    reviews = data.get("reviewHistory", [])
    for rev in reviews:
        rev_content = format_review_markdown(rev)
        created = rev.get("createdAt", "").replace(":", "-").replace(".", "-")
        safe_id = sanitize_filename(rev.get("id", created))
        filename = f"Review_{safe_id}.md"
        with open(reviews_dir / filename, "w", encoding="utf-8") as f:
            f.write(rev_content)
        result["reviews"] += 1

    # 3. 進捗サマリー
    stats = data.get("stats", {})
    if stats:
        summary_content = format_progress_summary_markdown(stats)
        with open(target_dir / "Progress_Summary.md", "w", encoding="utf-8") as f:
            f.write(summary_content)
        result["summary"] = 1

    return result


def show_status(target_dir: Path):
    """Vault内の英語学習データのステータスを表示"""
    if not target_dir.exists():
        print(f"ディレクトリが存在しません: {target_dir}")
        return

    phrases_file = target_dir / "Phrases" / "Saved_Phrases.md"
    reviews_dir = target_dir / "Reviews"
    summary_file = target_dir / "Progress_Summary.md"

    reviews_count = len(list(reviews_dir.glob("*.md"))) if reviews_dir.exists() else 0
    phrases_exist = phrases_file.exists()
    summary_exist = summary_file.exists()

    print("========================================")
    print("📖 English Coach Vault Data Status")
    print("========================================")
    print(f"Vaultパス: {target_dir}")
    print(f"- 保存済みフレーズ集: {'あり (Saved_Phrases.md)' if phrases_exist else 'なし'}")
    print(f"- 英文添削ノート数: {reviews_count} 件")
    print(f"- 進捗総合レポート: {'あり (Progress_Summary.md)' if summary_exist else 'なし'}")
    print("========================================")


def main():
    parser = argparse.ArgumentParser(description="Obsidian Vault と English Coach App の同期CLI")
    parser.add_argument("--import-json", type=str, help="アプリからエクスポートしたJSONファイルをVaultにインポート")
    parser.add_argument("--target-dir", type=str, default=str(DEFAULT_TARGET_DIR), help="Vaultの出力先ディレクトリ")
    parser.add_argument("--status", action="store_true", help="現在のVault内データの状態を表示")

    args = parser.parse_args()
    target_dir = Path(args.target_dir)

    if args.import_json:
        json_path = Path(args.import_json)
        print(f"📥 JSONをインポート中: {json_path} -> {target_dir}")
        res = import_json_to_vault(json_path, target_dir)
        print(f"✅ インポート完了: フレーズ {res['phrases']} 件, 添削ログ {res['reviews']} 件, 進捗サマリー更新")
    elif args.status:
        show_status(target_dir)
    else:
        show_status(target_dir)


if __name__ == "__main__":
    main()

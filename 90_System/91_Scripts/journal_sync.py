#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Journal Sync Tool (journal_sync.py)
-----------------------------------
Obsidian Vault (30_Document/Journal/) と Journal Web App (JSON) 間の
双方向データ同期・Markdown変換を行うCLIツール。
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

# デフォルトパス設定 (Vaultルート相対)
SCRIPT_DIR = Path(__file__).resolve().parent
VAULT_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_JOURNAL_DIR = VAULT_ROOT / "30_Document" / "Journal"


def sanitize_filename(name: str) -> str:
    """ファイル名として使えない文字を置換し、安全なファイル名を生成"""
    safe = re.sub(r'[/\\?%*:|"<>#]', '-', name or 'journal').strip()
    return safe[:60]


def parse_frontmatter(content: str) -> Tuple[Dict[str, Any], str]:
    """
    MarkdownテキストからYAML Frontmatterと本文を分離して解析する。
    """
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)
    if not match:
        return {}, content

    yaml_text = match.group(1)
    body = match.group(2)

    metadata: Dict[str, Any] = {}
    current_key = None
    is_list_mode = False

    for line in yaml_text.splitlines():
        line_str = line.rstrip()
        if not line_str or line_str.strip().startswith('#'):
            continue

        # リスト項目の処理 (例: "  - tag1")
        list_match = re.match(r'^\s*-\s+(.*)$', line_str)
        if list_match and current_key and is_list_mode:
            val = list_match.group(1).strip().strip('"').strip("'")
            metadata[current_key].append(val)
            continue

        # キーバリューの処理 (例: 'title: "hello"')
        kv_match = re.match(r'^([a-zA-Z0-9_-]+):\s*(.*)$', line_str)
        if kv_match:
            key = kv_match.group(1).strip()
            raw_val = kv_match.group(2).strip()

            if raw_val == '' or raw_val == '[]':
                metadata[key] = []
                current_key = key
                is_list_mode = True
            elif raw_val.lower() == 'true':
                metadata[key] = True
                is_list_mode = False
            elif raw_val.lower() == 'false':
                metadata[key] = False
                is_list_mode = False
            else:
                # クォート除去
                cleaned_val = raw_val
                if (cleaned_val.startswith('"') and cleaned_val.endswith('"')) or \
                   (cleaned_val.startswith("'") and cleaned_val.endswith("'")):
                    cleaned_val = cleaned_val[1:-1]
                metadata[key] = cleaned_val
                current_key = key
                is_list_mode = False

    return metadata, body


def entry_to_markdown(entry: Dict[str, Any]) -> str:
    """
    ジャーナルエントリー辞書をYAML Frontmatter付きMarkdown文字列に変換。
    特殊文字（: や "）を含むタイトルも安全にJSONシリアライズしてクォート。
    """
    entry_id = entry.get("id", f"entry-{int(datetime.now().timestamp()*1000)}")
    title = entry.get("title", "無題のジャーナル")
    safe_title = json.dumps(title, ensure_ascii=False)
    date = entry.get("date", datetime.now().strftime("%Y-%m-%d"))
    mood = entry.get("mood", "neutral")
    is_fav = str(bool(entry.get("isFavorite", False))).lower()
    created_at = entry.get("createdAt", datetime.now().isoformat())
    updated_at = entry.get("updatedAt", created_at)
    
    tags = entry.get("tags", [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    tags_yaml = ""
    if tags:
        tags_yaml = "\n" + "\n".join([f"  - {t}" for t in tags])
    else:
        tags_yaml = " []"

    content = entry.get("content", "").strip()

    md = f"""---
id: "{entry_id}"
title: {safe_title}
date: "{date}"
mood: "{mood}"
favorite: {is_fav}
created_at: "{created_at}"
updated_at: "{updated_at}"
tags:{tags_yaml}
---

{content}
"""
    return md


def markdown_file_to_entry(file_path: Path) -> Optional[Dict[str, Any]]:
    """
    Markdownファイルからジャーナルエントリー辞書を復元
    """
    try:
        content = file_path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(content)
        if not meta:
            # Frontmatterなしの場合はファイル名や本文から推定
            return None

        entry_id = meta.get("id") or f"file-{file_path.stem}"
        title = meta.get("title") or file_path.stem
        date = meta.get("date") or datetime.now().strftime("%Y-%m-%d")
        mood = meta.get("mood") or "neutral"
        favorite = bool(meta.get("favorite", False))
        created_at = meta.get("created_at") or datetime.now().isoformat()
        updated_at = meta.get("updated_at") or created_at
        tags = meta.get("tags") if isinstance(meta.get("tags"), list) else []

        return {
            "id": str(entry_id),
            "title": str(title),
            "date": str(date),
            "mood": str(mood),
            "isFavorite": favorite,
            "createdAt": str(created_at),
            "updatedAt": str(updated_at),
            "tags": tags,
            "content": body.strip()
        }
    except Exception as e:
        print(f"Error reading {file_path.name}: {e}", file=sys.stderr)
        return None


def export_json_to_markdowns(json_path: Path, output_dir: Path) -> int:
    """
    JSONバックアップからObsidian Markdownファイル群を生成
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    with open(json_path, "r", encoding="utf-8") as f:
        entries = json.load(f)

    if not isinstance(entries, list):
        print(f"Error: {json_path} does not contain a JSON list.", file=sys.stderr)
        return 0

    count = 0
    for entry in entries:
        date_str = entry.get("date", "unknown-date")
        title_str = sanitize_filename(entry.get("title", "entry"))
        md_filename = f"{date_str}_{title_str}.md"
        target_path = output_dir / md_filename

        md_content = entry_to_markdown(entry)
        target_path.write_text(md_content, encoding="utf-8")
        count += 1

    print(f"✅ Successfully exported {count} entries to {output_dir}")
    return count


def import_markdowns_to_json(input_dir: Path, output_json: Path) -> int:
    """
    Obsidian Markdownファイル群をパースして単一JSONを生成
    """
    if not input_dir.exists():
        print(f"Error: Directory {input_dir} does not exist.", file=sys.stderr)
        return 0

    entries = []
    for file in sorted(input_dir.glob("*.md")):
        if file.name.startswith("."):
            continue
        entry = markdown_file_to_entry(file)
        if entry:
            entries.append(entry)

    # 日付降順でソート
    entries.sort(key=lambda x: x.get("date", ""), reverse=True)

    output_json.parent.mkdir(parents=True, exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print(f"✅ Successfully imported {len(entries)} entries into {output_json}")
    return len(entries)


def show_status(journal_dir: Path):
    """Vault内のジャーナルノート状況を表示"""
    if not journal_dir.exists():
        print(f"📁 Journal directory does not exist: {journal_dir}")
        return

    md_files = [f for f in journal_dir.glob("*.md") if not f.name.startswith(".")]
    print("=" * 60)
    print(f" 📖 Obsidian Journal Vault Status")
    print(f" Directory: {journal_dir}")
    print(f" Total Notes: {len(md_files)}")
    print("=" * 60)

    if not md_files:
        print("  (No markdown notes found)")
        return

    for f in sorted(md_files, reverse=True)[:10]:
        entry = markdown_file_to_entry(f)
        if entry:
            fav = "★" if entry.get("isFavorite") else " "
            mood = entry.get("mood", "neutral")
            tags = ", ".join(entry.get("tags", []))
            print(f" [{fav}] {entry.get('date')} | {mood:<7} | {entry.get('title')} (#{tags})")

    if len(md_files) > 10:
        print(f"  ... and {len(md_files) - 10} more notes.")


def main():
    parser = argparse.ArgumentParser(description="Journal App <-> Obsidian Vault Sync Tool")
    parser.add_argument("--status", action="store_true", help="Show Obsidian Journal status")
    parser.add_argument("--export-json", type=str, help="Path to input JSON file to export to Markdown")
    parser.add_argument("--import-md", action="store_true", help="Import Markdown files to JSON")
    parser.add_argument("--output-dir", type=str, default=str(DEFAULT_JOURNAL_DIR), help="Output directory for Markdown")
    parser.add_argument("--output-json", type=str, help="Output JSON path when importing Markdown")

    args = parser.parse_args()

    journal_dir = Path(args.output_dir)

    if args.status or (len(sys.argv) == 1):
        show_status(journal_dir)
    elif args.export_json:
        json_path = Path(args.export_json)
        export_json_to_markdowns(json_path, journal_dir)
    elif args.import_md:
        out_json = Path(args.output_json) if args.output_json else (VAULT_ROOT / "90_System" / "93_Temporary" / "journal_import_latest.json")
        import_markdowns_to_json(journal_dir, out_json)


if __name__ == "__main__":
    main()

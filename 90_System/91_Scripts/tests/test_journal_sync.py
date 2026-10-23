#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Unit Tests for journal_sync.py
"""

import os
import tempfile
import unittest
from pathlib import Path

# Add parent directory to sys.path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from journal_sync import (
    parse_frontmatter,
    entry_to_markdown,
    markdown_file_to_entry,
    export_json_to_markdowns,
    import_markdowns_to_json,
    sanitize_filename
)


class TestJournalSync(unittest.TestCase):

    def test_sanitize_filename(self):
        self.assertEqual(sanitize_filename("タイトル:テスト/ファイル"), "タイトル-テスト-ファイル")
        self.assertEqual(sanitize_filename(""), "journal")

    def test_entry_to_markdown_and_parse(self):
        entry = {
            "id": "test-123",
            "title": "タイトル: 「引用」とコロンを含む検証",
            "date": "2026-09-05",
            "mood": "happy",
            "isFavorite": True,
            "createdAt": "2026-09-05T10:00:00.000Z",
            "tags": ["テスト", "開発", "Obsidian"],
            "content": "# 見出し1\n\n本文のテストです。\n- リスト1\n- リスト2"
        }

        md_text = entry_to_markdown(entry)
        self.assertIn('id: "test-123"', md_text)
        self.assertIn('favorite: true', md_text)
        self.assertIn('mood: "happy"', md_text)
        self.assertIn('- テスト', md_text)

        meta, body = parse_frontmatter(md_text)
        self.assertEqual(meta["id"], "test-123")
        self.assertEqual(meta["title"], "タイトル: 「引用」とコロンを含む検証")
        self.assertEqual(meta["mood"], "happy")
        self.assertTrue(meta["favorite"])
        self.assertIn("開発", meta["tags"])
        self.assertIn("# 見出し1", body)

    def test_export_and_import_cycle(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            json_file = tmp_path / "test_input.json"
            out_dir = tmp_path / "journals"
            out_json = tmp_path / "restored.json"

            sample_data = [
                {
                    "id": "entry-01",
                    "title": "第1回投稿",
                    "date": "2026-09-01",
                    "mood": "good",
                    "isFavorite": False,
                    "tags": ["日記"],
                    "content": "散歩に行った。"
                },
                {
                    "id": "entry-02",
                    "title": "第2回投稿: 大切なメモ",
                    "date": "2026-09-02",
                    "mood": "happy",
                    "isFavorite": True,
                    "tags": ["アイデア", "仕事"],
                    "content": "新しい企画の骨子。"
                }
            ]

            import json
            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(sample_data, f, ensure_ascii=False)

            # Export JSON to Markdown files
            exported_count = export_json_to_markdowns(json_file, out_dir)
            self.assertEqual(exported_count, 2)

            # Check markdown files generated
            md_files = list(out_dir.glob("*.md"))
            self.assertEqual(len(md_files), 2)

            # Import Markdown back to JSON
            imported_count = import_markdowns_to_json(out_dir, out_json)
            self.assertEqual(imported_count, 2)

            with open(out_json, "r", encoding="utf-8") as f:
                restored = json.load(f)

            # ID verification
            restored_ids = {r["id"] for r in restored}
            self.assertIn("entry-01", restored_ids)
            self.assertIn("entry-02", restored_ids)

            # Verify favorite flag
            e2 = next(r for r in restored if r["id"] == "entry-02")
            self.assertTrue(e2["isFavorite"])
            self.assertEqual(e2["mood"], "happy")
            self.assertIn("アイデア", e2["tags"])


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
test_english_coach_sync.py - english_coach_sync.py の単体テスト
"""

import os
import sys
import json
import shutil
import tempfile
import unittest
from pathlib import Path

# テスト対象スクリプトのパス追加
SCRIPT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCRIPT_DIR))

from english_coach_sync import (
    sanitize_filename,
    format_phrases_markdown,
    format_review_markdown,
    format_progress_summary_markdown,
    import_json_to_vault
)


class TestEnglishCoachSync(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_sanitize_filename(self):
        self.assertEqual(sanitize_filename("valid_name"), "valid_name")
        self.assertEqual(sanitize_filename("invalid/name:with*bad?chars"), "invalid-name-with-bad-chars")
        self.assertEqual(sanitize_filename(""), "item")

    def test_format_phrases_markdown(self):
        phrases = [
            {"en": "Could I get a latte?", "ja": "ラテをもらえますか？", "category": "カフェ", "mode": "daily", "savedAt": "2026-09-22T10:00:00Z"},
            {"en": "Let's touch base on Friday.", "ja": "金曜に連絡を取り合いましょう。", "category": "ビジネス", "mode": "business"}
        ]
        md = format_phrases_markdown(phrases)
        self.assertIn("---", md)
        self.assertIn("title: \"English Coach - 保存済みフレーズ集\"", md)
        self.assertIn("Could I get a latte?", md)
        self.assertIn("Let's touch base on Friday.", md)
        self.assertIn("| **Could I get a latte?** |", md)

    def test_format_review_markdown(self):
        review = {
            "id": "rev_test_123",
            "mode": "business",
            "createdAt": "2026-09-22T11:00:00Z",
            "original": "I want report tomorrow.",
            "versions": {
                "corrected": "I want the report tomorrow.",
                "natural": "Could you send me the report by tomorrow?",
                "business_or_formal": "I would appreciate it if you could provide the report by tomorrow."
            },
            "corrections": [
                {
                    "type": "Politeness",
                    "issue": "やや直接的すぎる",
                    "fixed": "Could you please...",
                    "explanation": "助動詞を使うと丁寧になります"
                }
            ],
            "key_vocabulary": [
                {
                    "word": "appreciate",
                    "meaning": "感謝する",
                    "example": "I would appreciate your feedback."
                }
            ],
            "coach_comment": "素晴らしいアウトプットです！"
        }
        md = format_review_markdown(review)
        self.assertIn('id: "rev_test_123"', md)
        self.assertIn("I want report tomorrow.", md)
        self.assertIn("Could you send me the report by tomorrow?", md)
        self.assertIn("助動詞を使うと丁寧になります", md)
        self.assertIn("appreciate", md)
        self.assertIn("Coach Nova からのアドバイス", md)

    def test_format_progress_summary_markdown(self):
        stats = {
            "streakDays": 5,
            "totalMinutes": 120,
            "todayMinutes": 25,
            "reviewedCount": 3,
            "savedPhrasesCount": 10,
            "quizzesTaken": 15,
            "quizzesCorrect": 13,
            "modeDistribution": {"daily": 60, "business": 40, "toeic": 20},
            "completedMissions": ["5文型の復習", "カフェで注文ロールプレイ"]
        }
        md = format_progress_summary_markdown(stats)
        self.assertIn("5` 日連続", md)
        self.assertIn("120` 分", md)
        self.assertIn("- [x] 5文型の復習", md)
        self.assertIn("- [x] カフェで注文ロールプレイ", md)

    def test_import_json_to_vault(self):
        sample_data = {
            "stats": {
                "streakDays": 2,
                "totalMinutes": 45,
                "todayMinutes": 15
            },
            "savedPhrases": [
                {"en": "Hello world", "ja": "こんにちは世界", "mode": "daily"}
            ],
            "reviewHistory": [
                {
                    "id": "rev_001",
                    "original": "This is test.",
                    "versions": {"corrected": "This is a test."}
                }
            ]
        }
        json_file = self.temp_dir / "backup.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(sample_data, f)

        res = import_json_to_vault(json_file, self.temp_dir / "English_Learning")
        self.assertEqual(res["phrases"], 1)
        self.assertEqual(res["reviews"], 1)
        self.assertEqual(res["summary"], 1)

        # ファイル生成確認
        phrases_path = self.temp_dir / "English_Learning" / "Phrases" / "Saved_Phrases.md"
        review_path = self.temp_dir / "English_Learning" / "Reviews" / "Review_rev_001.md"
        summary_path = self.temp_dir / "English_Learning" / "Progress_Summary.md"

        self.assertTrue(phrases_path.exists())
        self.assertTrue(review_path.exists())
        self.assertTrue(summary_path.exists())


if __name__ == "__main__":
    unittest.main()

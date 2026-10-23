#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ナレッジキュレーション支援スクリプト
外部文献・リサーチ結果から、VaultのMarkdown規約・テンプレートに沿った構造化ナレッジノートを生成・検証します。
"""

import os
import re
import sys
import argparse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional


class KnowledgeCurator:
    def __init__(self, vault_root: Path):
        self.vault_root = vault_root.resolve()
        self.doc_dir = self.vault_root / "30_Document"
        self.templates_dir = self.vault_root / "70_Templates"

    def list_existing_topics(self) -> List[str]:
        """Vault内の既存Markdownノートのタイトル（トピック）一覧を取得"""
        topics = []
        for root, dirs, files in os.walk(self.doc_dir):
            for file in files:
                if file.endswith(".md"):
                    topics.append(Path(file).stem)
        return sorted(topics)

    def suggest_wiki_links(self, text: str) -> List[str]:
        """テキスト内に含まれる単語から、既存ノートへのWikiリンク候補をサジェスト"""
        topics = self.list_existing_topics()
        suggested = []
        for topic in topics:
            if len(topic) > 2 and topic.lower() in text.lower():
                suggested.append(topic)
        return suggested

    def generate_note_template(
        self,
        title: str,
        category: str = "Research",
        summary: str = "",
        sources: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> str:
        """標準的なナレッジノートのMarkdownコンテンツを生成"""
        now_str = datetime.now().strftime("%Y-%m-%d")
        tags_list = tags or ["knowledge", category.lower()]
        sources_list = sources or []

        frontmatter = [
            "---",
            f"title: \"{title}\"",
            f"date: {now_str}",
            f"category: {category}",
            f"tags: [{', '.join(tags_list)}]",
            f"status: Seed",
            "---",
            "",
            f"# {title}",
            "",
            "## 📌 概要・エグゼクティブサマリー",
            summary if summary else "ここに概要を記述します。",
            "",
            "## 🔬 詳細解説・キーコンセプト",
            "- 主要な論点や技術的メカニズムを箇条書きで整理します。",
            "- 関連する理論やコード実装例を記載します。",
            "",
            "## 🔗 関連ノート・トポロジー",
        ]

        # 関連ノートのサジェスト
        suggested_links = self.suggest_wiki_links(f"{title} {summary}")
        if suggested_links:
            for link in suggested_links:
                frontmatter.append(f"- [[{link}]]")
        else:
            frontmatter.append("- 関連ノートはまだ指定されていません。")

        frontmatter.extend([
            "",
            "## 📚 参考資料・出典",
        ])

        if sources_list:
            for src in sources_list:
                frontmatter.append(f"- {src}")
        else:
            frontmatter.append("- 出典未指定")

        frontmatter.append("")
        return "\n".join(frontmatter)


def main():
    parser = argparse.ArgumentParser(description="Knowledge Curator CLI")
    parser.add_argument("--root", type=str, default=".", help="Vaultルートパス")
    parser.add_argument("--title", type=str, help="ノートタイトル")
    parser.add_argument("--category", type=str, default="Research", help="カテゴリー")
    parser.add_argument("--summary", type=str, default="", help="概要")
    parser.add_argument("--sources", nargs="*", help="参考URLや出典")
    parser.add_argument("--tags", nargs="*", help="タグ一覧")
    parser.add_argument("--output", type=str, help="出力先ファイルパス（省略時は標準出力）")

    args = parser.parse_args()
    curator = KnowledgeCurator(Path(args.root))

    if not args.title:
        print("💡 利用例:")
        print("python3 knowledge_curator.py --title 'Graph_Neural_Networks' --category 'AI' --summary 'GNNの基礎概念とVaultトポロジー応用'")
        return

    content = curator.generate_note_template(
        title=args.title,
        category=args.category,
        summary=args.summary,
        sources=args.sources,
        tags=args.tags
    )

    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(content, encoding="utf-8")
        print(f"✅ ナレッジノートを生成しました: {out_path}")
    else:
        print(content)


if __name__ == "__main__":
    main()

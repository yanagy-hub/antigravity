#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vault 構造およびガバナンス整合性検査スクリプト
Johnny.Decimal規約、内部リンクの健全性、孤立ノート、Vault_Structure.md との実体差分を検査します。
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple

# Johnny.Decimal形式の正規表現 (例: 00_Config, 91_Scripts)
JD_PATTERN = re.compile(r"^\d{2}_[A-Za-z0-9_\-]+$")

# Wikiリンクの正規表現 (例: [[Note Name]], [[Note Name|Alias]], [[Note Name#Header]])
WIKI_LINK_PATTERN = re.compile(r"\[\[([^\]\|#]+)(?:#[^\]\|]+)?(?:\|[^\]]+)?\]\]")

# Markdownリンクの正規表現 (例: [text](path/to/file.md))
MD_LINK_PATTERN = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

# 検査から除外するディレクトリ
EXCLUDE_DIRS = {".git", ".agent", ".agents", ".vscode", ".vercel", "node_modules", ".next", ".gemini"}


class VaultGovernanceChecker:
    def __init__(self, vault_root: Path):
        self.vault_root = vault_root.resolve()
        self.config_dir = self.vault_root / "00_Config"
        self.structure_file = self.config_dir / "Vault_Structure.md"

    def run_all_checks(self) -> Dict:
        """すべての統制・整合性チェックを実行します"""
        results = {
            "vault_root": str(self.vault_root),
            "johnny_decimal_violations": self.check_johnny_decimal(),
            "structure_doc_sync": self.check_structure_doc_sync(),
            "link_integrity": self.check_link_integrity(),
        }
        return results

    def check_johnny_decimal(self) -> List[Dict]:
        """トップレベルディレクトリのJohnny.Decimal形式をチェック"""
        violations = []
        for item in self.vault_root.iterdir():
            if item.is_dir() and item.name not in EXCLUDE_DIRS:
                if not JD_PATTERN.match(item.name):
                    violations.append({
                        "path": str(item.relative_to(self.vault_root)),
                        "reason": f"フォルダ名 '{item.name}' が Johnny.Decimal形式 ('NN_Name') に違反しています。"
                    })
        return violations

    def check_structure_doc_sync(self) -> Dict:
        """Vault_Structure.md に記載されたディレクトリと実ディレクトリの整合性をチェック"""
        if not self.structure_file.exists():
            return {
                "status": "error",
                "message": f"構成管理ファイルが見つかりません: {self.structure_file}"
            }

        content = self.structure_file.read_text(encoding="utf-8")
        
        # 実在するトップレベルディレクトリ
        actual_dirs = {
            item.name for item in self.vault_root.iterdir()
            if item.is_dir() and item.name not in EXCLUDE_DIRS and not item.name.startswith(".")
        }

        # ドキュメントに記載されているディレクトリを抽出 (00_Config/, 41_Plans/ 等)
        documented_dirs = set(re.findall(r"`(\d{2}_[A-Za-z0-9_\-]+)/?`", content))

        # 実在するすべてのJDディレクトリ（トップレベルおよびサブディレクトリ）
        all_actual_jd_dirs = set()
        for root, dirs, _ in os.walk(self.vault_root):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            for d in dirs:
                if JD_PATTERN.match(d):
                    all_actual_jd_dirs.add(d)

        # トップレベルの記載漏れチェック
        missing_in_doc = list(actual_dirs - documented_dirs)
        # ドキュメント記載のディレクトリが実在（サブディレクトリ含む）するかチェック
        missing_in_disk = [d for d in documented_dirs if d not in all_actual_jd_dirs]

        return {
            "status": "ok" if not missing_in_doc and not missing_in_disk else "warning",
            "actual_dirs": sorted(list(actual_dirs)),
            "documented_dirs": sorted(list(documented_dirs)),
            "missing_in_doc": sorted(missing_in_doc),
            "missing_in_disk": sorted(missing_in_disk)
        }

    def check_link_integrity(self) -> Dict:
        """内部リンクの破損および孤立ノート（In-degree 0）の検出"""
        all_md_files: Dict[str, Path] = {}
        all_files_relative: Set[str] = set()

        for root, dirs, files in os.walk(self.vault_root):
            # 除外ディレクトリのスキップ
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            for file in files:
                rel_path = str(Path(root, file).relative_to(self.vault_root))
                all_files_relative.add(rel_path)
                if file.endswith(".md"):
                    # ファイル名（拡張子なし）とフルパスをマッピング
                    stem = Path(file).stem
                    all_md_files[stem] = Path(root, file)

        broken_links = []
        incoming_links: Dict[str, int] = {stem: 0 for stem in all_md_files.keys()}

        for stem, path in all_md_files.items():
            try:
                content = path.read_text(encoding="utf-8")
            except Exception as e:
                continue

            rel_path = str(path.relative_to(self.vault_root))

            # Wikiリンクの検査
            for match in WIKI_LINK_PATTERN.findall(content):
                target_name = match.strip()
                if target_name in incoming_links:
                    incoming_links[target_name] += 1
                elif not any(target_name == Path(f).stem for f in all_files_relative):
                    # 拡張子付きや直接パス指定でないか確認
                    if target_name not in all_files_relative:
                        broken_links.append({
                            "source_file": rel_path,
                            "target_link": target_name,
                            "type": "wiki_link"
                        })

            # Markdownリンクの検査 (ローカル相対パスの場合)
            for text, link in MD_LINK_PATTERN.findall(content):
                link = link.strip()
                if link.startswith("http://") or link.startswith("https://") or link.startswith("#") or link.startswith("file://") or link.startswith("conversation://"):
                    continue
                # 相対パス解決
                target_path = (path.parent / link.split("#")[0]).resolve()
                if not target_path.exists():
                    broken_links.append({
                        "source_file": rel_path,
                        "target_link": link,
                        "type": "markdown_link"
                    })

        # 孤立ノート（ルールやシステム定義以外のノートで被参照0件）
        orphan_notes = [
            str(all_md_files[stem].relative_to(self.vault_root))
            for stem, count in incoming_links.items()
            if count == 0 and not str(all_md_files[stem].relative_to(self.vault_root)).startswith("00_Config")
        ]

        return {
            "total_md_files": len(all_md_files),
            "broken_links_count": len(broken_links),
            "broken_links": broken_links,
            "orphan_notes_count": len(orphan_notes),
            "orphan_notes": sorted(orphan_notes)
        }


def main():
    parser = argparse.ArgumentParser(description="Vault Governance & Integrity Checker")
    parser.add_argument("--root", type=str, default=".", help="Vaultのルートディレクトリパス")
    parser.add_argument("--json", action="store_true", help="JSON形式で出力")
    args = parser.parse_args()

    vault_root = Path(args.root).resolve()
    checker = VaultGovernanceChecker(vault_root)
    results = checker.run_all_checks()

    if args.json:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        print("=" * 60)
        print("🛡️  Vault ガバナンス＆構造整合性 診断レポート")
        print("=" * 60)
        print(f"Vaultルート: {results['vault_root']}")
        
        # 1. Johnny.Decimal
        jd_violations = results["johnny_decimal_violations"]
        print(f"\n【1. Johnny.Decimal 命名規則チェック】")
        if not jd_violations:
            print("  ✅ すべての主要ディレクトリが 'NN_Name' 形式に準拠しています。")
        else:
            print(f"  ⚠️ 違反件数: {len(jd_violations)}件")
            for v in jd_violations:
                print(f"    - {v['path']}: {v['reason']}")

        # 2. Vault_Structure.md
        struct_sync = results["structure_doc_sync"]
        print(f"\n【2. 構成管理ファイル (Vault_Structure.md) 整合性】")
        if struct_sync.get("status") == "ok":
            print("  ✅ 実ディレクトリと定義書の記載が完全に一致しています。")
        else:
            print(f"  ⚠️ 実ディレクトリとの差分があります:")
            if struct_sync.get("missing_in_doc"):
                print(f"    - 定義書に未記載のディレクトリ: {struct_sync['missing_in_doc']}")
            if struct_sync.get("missing_in_disk"):
                print(f"    - 実在しない定義済みディレクトリ: {struct_sync['missing_in_disk']}")

        # 3. リンク整合性
        links = results["link_integrity"]
        print(f"\n【3. リンク・トポロジー健全性】")
        print(f"  - 総Markdownファイル数: {links['total_md_files']}")
        if links["broken_links_count"] == 0:
            print("  ✅ リンク切れ（Broken Links）はありません。")
        else:
            print(f"  ⚠️ リンク切れ件数: {links['broken_links_count']}件")
            for bl in links["broken_links"][:10]:
                print(f"    - {bl['source_file']} -> {bl['target_link']} ({bl['type']})")
        
        print(f"  - 被参照ゼロ（孤立可能性）ノート: {links['orphan_notes_count']}件")
        print("=" * 60)


if __name__ == "__main__":
    main()

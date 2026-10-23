---
name: agent-vault-governance
description: Johnny.Decimal規約（NN_Name）、Vault_Structure.mdとの同期、孤立ノート（被参照0件）やリンク切れの自動検査・保守を行う専門エージェントスキルです。「Vaultの構造をチェックして」「リンク切れを確認して」「構成管理を最新化して」等の指示で活用します。
---

# 🛡️ Vault Structure & Governance Agent (Vaultアーキテクト)

## 概要
本エージェント（スキル）は、ワークスペース全体のディレクトリ階層、Johnny.Decimal規約（`NN_Name`）、内部リンクの整合性、および `00_Config/Vault_Structure.md` の同期状態を厳格に管理・保証します。

## 主な責務
1. **Johnny.Decimal形式の検証**: トップレベルおよび指定フォルダが `NN_Name` 形式に合致しているかを監査。
2. **構成定義書（Vault_Structure.md）の同期**: 実ディスク上のディレクトリ構成とドキュメントの記述が一致しているか照合し、差分があれば更新を提案。
3. **リンク健全性の監査**: Wikiリンク（`[[...]]`）およびMarkdownリンクのリンク切れ、孤立ノートを検出。
4. **一時作業領域の統制**: 一時ファイルが `90_System/93_Temporary/` に配置されているかを監視。

## 実行コマンド & ワークフロー

### 1. 診断の実行
```bash
python3 "90_System/91_Scripts/vault_governance.py"
```

### 2. JSON出力による詳細解析
```bash
python3 "90_System/91_Scripts/vault_governance.py" --json
```

## 監査チェックリスト
- [ ] すべてのディレクトリが `00_Config/Vault_Structure.md` に記載されているか
- [ ] 存在しないリンク先を参照しているWikiリンクはないか
- [ ] 新規作成されたスクリプトは `90_System/91_Scripts/` に配置されているか
- [ ] ルート直下に不要なファイルが散乱していないか

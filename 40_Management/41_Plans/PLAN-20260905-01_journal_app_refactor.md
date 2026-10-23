---
id: PLAN-20260905-01
title: "Journal App 動作検証・コードリファクタリングおよび3大機能拡張計画書"
status: Completed
created_at: 2026-09-05T14:25:00+09:00
updated_at: 2026-09-05T14:26:30+09:00
author: Planner Agent
reviewer: Reviewer Agent
review_round: 2
review_file: "[[40_Management/43_Reviews/REV-20260905-01_journal_app_refactor]]"
supervisor_task_file: "[[40_Management/42_Tasks/TASK-20260905-01_journal_app_refactor]]"
tags:
  - plan
  - management
  - journal-app
  - refactor
---

# 📋 計画書: Journal App 動作検証・コードリファクタリングおよび3大機能拡張計画書

## 1. 概要・背景
- **目的**: 
  `20_Workspace/journal-app/` に構築された既存のジャーナルアプリ（HTML/CSS/Vanilla JS）の現状動作検証とコードレビューを実施し、単一肥大化したコードのモジュール分割リファクタリングを行った上で、タツヤさんよりご指定いただいた「Obsidian Vault連携」「Markdown記法＆リアルタイムプレビュー」「気分推移グラフ・統計ダッシュボード」の3大機能拡張を段階的・安全に実装する。
- **背景・現状の課題**: 
  - 現状の `js/app.js`（約570行）は単一のIIFE内にDOM操作、状態管理、LocalStorage制御、フィルタ検索、インポート/エクスポートが一体化しており、機能追加に伴う複雑化や保守性の低下が懸念される。
  - 入力本文はプレーンテキストのみで、装飾やコードブロック等の表現力がない。
  - データはブラウザのLocalStorage内に孤立しており、Obsidian Vault内のMarkdown知識ネットワークとの相互運用性がない。
  - 気分（Mood）データが記録されているが、過去の推移や感情の傾向を俯瞰できる可視化機能（ダッシュボード）がない。
- **達成目標 (ゴール)**: 
  1. 既存コードの動作検証完了およびES Modulesへのクリーンなモジュール分割リファクタリング。
  2. Markdownプレビュー対応（リアルタイムプレビュー＆カード詳細ビューワー）。
  3. Obsidian互換のYAML Frontmatter付きMarkdown双方向エクスポート・ローカル連携スクリプトの整備。
  4. 気分の時系列推移チャートおよびタグ・投稿統計ダッシュボードの実装。
  5. 新規ディレクトリ新設に伴う `00_Config/Vault_Structure.md` の同期・完全整合性担保。

---

## 2. 要件定義

### 2.1 機能要件 (Must / Should / Want)
- [x] **FR-01 (Must - リファクタリング)**: `js/app.js` をES Modules（`state.js`, `storage.js`, `ui.js`, `events.js`, `constants.js` 等）に責務分離し、可読性と保守性を劇的に向上させる。
- [x] **FR-02 (Must - Markdown対応)**:
  - 記事作成・編集モーダルに「入力」と「リアルタイムプレビュー」の切り替えタブを設置。
  - 軽量Markdownパーサー（marked.js CDN利用）を導入し、見出し、リスト、太字、コードブロック、リンクを美しくレンダリング。
  - エントリーカードクリックで、Markdown全文を快適に読める詳細モーダル（Reader View）を提供。
- [x] **FR-03 (Must - Obsidian Vault連携)**:
  - エントリーをObsidian標準のYAML Frontmatter形式（`title`, `date`, `mood`, `tags`, `isFavorite`, `created` 等）を含む `.md` ファイルとして単体/一括エクスポートできる機能。タイトルにコロンやダブルクォートが含まれてもYAMLが破損しない安全なクォート処理を実装。
  - `90_System/91_Scripts/journal_sync.py` を新設し、Vault内の `30_Document/Journal/` ディレクトリとジャーナルアプリのJSON/Markdownデータを双方向で相互同期できるCLIツールを提供。
- [x] **FR-04 (Must - 気分推移グラフ・統計ダッシュボード)**:
  - ヘッダーに「統計ダッシュボード」表示ボタンを追加。
  - Chart.js（CDN）を活用した「過去7日間/30日間の気分推移折れ線グラフ」および「気分の内訳円グラフ」「週間投稿統計」を表示する専用モーダルを実装。
  - データが0件の場合でもエラーにならず「データがありません」という親切なフォールバック表示（Empty State）を実装。
- [x] **FR-05 (Should - UI/UX改善)**:
  - 既存の洗練されたダークテーマを踏襲しつつ、ダッシュボードやMarkdownプレビューのスタイリングを統一。

### 2.2 非機能要件 (制約・セキュリティ・品質)
- **Johnny.Decimal規約**: 
  - アプリケーション本体は `20_Workspace/journal-app/` 配下に厳格に限定（ルート汚染厳禁）。
  - ノート同期先ディレクトリ `30_Document/Journal/` の新設に合わせて `00_Config/Vault_Structure.md` を最新化。
  - 同期スクリプトは `90_System/91_Scripts/journal_sync.py` に配置し、一時ファイルは `90_System/93_Temporary/` を使用。
- **後方互換性**: 
  - 既存の `localStorage` キー（`modern_journal_entries_v1`）のデータ構造との完全な互換性を維持し、既存データが破損・消失しないこと。
- **セキュリティ・権限**: 
  - ワークスペース外へのアクセスなし。Markdownレンダリング時のHTMLサニタイズ処理徹底（XSS防止）。

---

## 3. スコープ

### 3.1 今回対応すること (In Scope)
1. 現状の動作検証（CRUD、検索、フィルタ、LocalStorage永続化）の網羅的チェック。
2. `js/` 配下のES Modules化リファクタリング。
3. marked.js によるMarkdown記法対応・リアルタイムプレビュー＆詳細閲覧ビューの実装。
4. YAML Frontmatter付きMarkdownエクスポートおよび `90_System/91_Scripts/journal_sync.py` によるObsidian Vault連携。
5. Chart.js による気分推移グラフ・統計ダッシュボードの実装。
6. `00_Config/Vault_Structure.md` の構成管理更新。
7. 単体動作確認および総合結合テストの実施。

### 3.2 今回対応しないこと (Out of Scope)
- 外部クラウドデータベース（Supabase/Firebase等）へのオンライン同期。
- Next.js等へのフルスタックフレームワーク刷新（Vanilla JS + モジュール構成で軽量・堅牢に進化）。

---

## 4. 変更対象ファイルおよび影響範囲

| 操作種別 | 対象パス | 変更概要 | 波及影響 |
| :--- | :--- | :--- | :--- |
| `[MODIFY]` | `00_Config/Vault_Structure.md` | `30_Document/Journal/` 新設に伴う構成管理ファイルの更新 | Vault整合性担保 |
| `[MODIFY]` | `20_Workspace/journal-app/index.html` | marked.js / Chart.js のCDN追加、プレビュータブ、ダッシュボード用モーダルの追加 | UIの崩れがないかCSSと整合確認 |
| `[MODIFY]` | `20_Workspace/journal-app/css/style.css` | Markdownレンダリングスタイル、タブ切り替え、ダッシュボード用グリッドスタイルの追加 | 既存スタイルとの競合防止 |
| `[MODIFY]` | `20_Workspace/journal-app/js/app.js` | メインエントリーポイントとして再構成（モジュール呼び出し） | 全体オーケストレーション |
| `[NEW]` | `20_Workspace/journal-app/js/modules/constants.js` | 定数定義（ストレージキー、気分絵文字・ラベル定義、カラーパレット等） | 全モジュール共通参照 |
| `[NEW]` | `20_Workspace/journal-app/js/modules/state.js` | アプリケーション状態管理・イベント通知 | 既存stateの移行 |
| `[NEW]` | `20_Workspace/journal-app/js/modules/storage.js` | LocalStorage操作・マイグレーション・JSON/MDエクスポート | 既存データの整合性担保 |
| `[NEW]` | `20_Workspace/journal-app/js/modules/markdown.js` | Markdownパースおよびサニタイズ処理 | XSS防止 |
| `[NEW]` | `20_Workspace/journal-app/js/modules/analytics.js` | 気分推移データ集計およびChart.js描画制御 | 統計精度 |
| `[NEW]` | `20_Workspace/journal-app/js/modules/ui.js` | DOMレンダリング、モーダル制御、イベントバインド | UI操作系 |
| `[NEW]` | `90_System/91_Scripts/journal_sync.py` | Obsidian Vault (`30_Document/Journal/`) との双方向同期CLI | 規約準拠 |
| `[NEW]` | `90_System/91_Scripts/tests/test_journal_sync.py` | 同期スクリプトのテストコード | 品質担保 |

---

## 5. 前提条件と依存関係
- **前提条件**:
  - Webブラウザ（Chrome/Safari/Edge等）でローカルHTTPサーバー（`python3 -m http.server` 等）経由でES Modulesが動作すること。
  - Python 3.10+（`journal_sync.py` 実行用）。
- **依存ライブラリ**:
  - `marked.js` (CDN: `https://cdn.jsdelivr.net/npm/marked/marked.min.js`)
  - `chart.js` (CDN: `https://cdn.jsdelivr.net/npm/chart.js`)
  - `lucide` (既存CDN利用中)

---

## 6. テスト・検証戦略

### 6.1 自動テスト・コマンド検証
- Python同期スクリプトの単体テスト:
  ```bash
  python3 -m unittest 90_System/91_Scripts/tests/test_journal_sync.py
  ```
- Vault整合性診断:
  ```bash
  python3 90_System/91_Scripts/vault_governance.py --check-all
  ```

### 6.2 手動・ブラウザ動作確認手順
1. **動作検証＆リファクタリング検証**:
   - 初期ロードで既存エントリーが正常に表示されるか。
   - 新規作成、編集、削除、お気に入りトグルが正常に動作するか。
   - 検索、気分フィルタ、タグフィルタが即座に反映されるか。
2. **Markdown検証**:
   - モーダルでMarkdown記法を入力し、プレビュータブで正しくレンダリングされるか。
   - カードをクリックした際に詳細ビューワーでMarkdownが美しく表示されるか。
3. **Obsidian連携検証**:
   - エクスポート機能でYAML Frontmatter付き `.md` が生成されるか。
   - `journal_sync.py` を実行し、`30_Document/Journal/` にObsidianノートが同期されるか。
4. **ダッシュボード検証**:
   - ダッシュボードを開き、過去の気分推移がチャートとして正しくプロットされるか（データ0件時も崩れないか）。

---

## 7. リスクと対策

| 想定リスク | 影響度 | 対策・回避策 |
| :--- | :---: | :--- |
| ES Modules化によるfile://プロトコル制限（CORSエラー） | 中 | ローカルHTTPサーバー（`python3 -m http.server`）を標準案内し、ワンライナー起動コマンドを用意する。 |
| Markdown導入に伴うXSS脆弱性 | 高 | marked.js のサニタイズ処理を適用し、HTMLタグエスケープを徹底する。 |
| 既存LocalStorageデータの破損・消失 | 高 | 既存キー構造を完全互換とし、リファクタリング前に自動バックアップ機構を組み込む。 |
| Obsidianノート同期時のファイル競合 | 中 | エントリーIDをFrontmatterの `id` に保持し、一意性を保証して差分更新する。 |

---

## 8. レビュー履歴
- **第1回 (2026-09-05T14:25:30)**: [[40_Management/43_Reviews/REV-20260905-01_journal_app_refactor#Round-1]] - 結果: REVISE（Vault_Structure.md更新計画、YAMLエスケープ、エンプティステートの明記要求）
- **第2回 (2026-09-05T14:26:00)**: [[40_Management/43_Reviews/REV-20260905-01_journal_app_refactor#Round-2]] - 結果: APPROVED（すべての指摘事項を反映完了し承認）

---
id: PLAN-20260922-01
title: "英語学習支援アプリケーション（English Coach App）構築計画書"
status: Completed
created_at: 2026-09-22T11:35:00+09:00
updated_at: 2026-09-22T11:41:30+09:00
author: Planner Agent
reviewer: Plan Reviewer Agent
review_round: 1
review_file: "[[40_Management/43_Plan_Reviews/PREV-20260922-01_english_coach_app]]"
supervisor_task_file: "[[40_Management/42_Tasks/Task_Board]]"
work_review_file: "[[40_Management/44_Work_Reviews/WREV-20260922-01_english_coach_app]]"
tags:
  - plan
  - management
  - english-coach-app
  - gemini-api
  - language-learning
---

# 📋 計画書: 英語学習支援アプリケーション（English Coach App）構築計画書

## 1. 概要・背景
- **目的**: 
  タツヤさんの英語力向上（日常会話・ビジネス英語・TOEIC対策を基礎から網羅、グラマーとオーラルの両立、6〜12ヶ月ロードマップ）を実現するため、学習計画の設計、日々の進捗管理、およびGemini APIを活用した4大指導スタイル（ロールプレイ会話、英文添削・文法解説、音声対話、デイリークイズ）を備えた個人向けWebアプリケーション `English Coach App` を構築する。
- **背景・現状の課題**: 
  - 英語学習において「計画倒れになりやすい」「話す・書くのアウトプット機会が不足する」「学習ログが散乱して継続モチベーションが維持しにくい」という課題がある。
  - タツヤさんの学習ニーズは「日常会話」「ビジネス英語」「TOEIC」の3領域にまたがり、基礎文法の確実な理解とオーラル（発音・対話）の双方が必須。
  - Obsidian Vaultによるナレッジ管理と有機的に連携し、学んだ重要フレーズやAI講師の添削ログをMarkdownノートとして蓄積・再利用できる環境が求められている。
- **達成目標 (ゴール)**: 
  1. `20_Workspace/english-coach-app/` 配下に、直感的かつ洗練されたSPA構成の英語学習Webアプリを新規構築。
  2. 日常会話・ビジネス・TOEICの3大モードの即時切り替えUIおよび6〜12ヶ月対応の体系的カリキュラム・デイリーミッション機能の実装。
  3. Gemini API連携によるAI講師エンジン（シチュエーション会話、3段階英文添削・文法解説、クイズ自動生成）の実装。
  4. Web Speech APIによる音声認識（発音練習）および音声合成（リスニング練習）機能の統合。
  5. Chart.js による学習進捗ダッシュボード（学習時間、単語・表現習得数、連続学習ストリーク）の実装。
  6. Obsidian Vault連携スクリプト `90_System/91_Scripts/english_coach_sync.py` および同期ディレクトリ `30_Document/English_Learning/` の整備。
  7. `00_Config/Vault_Structure.md` との完全同期・ガバナンス担保。

---

## 2. 要件定義

### 2.1 機能要件 (Must / Should / Want)
- [x] **FR-01 (Must - 3大モード切り替え & カリキュラム設計)**:
  - 「日常会話 (Daily)」「ビジネス英語 (Business)」「TOEIC対策 (TOEIC)」の3モードをヘッダー等で瞬時に切り替え可能。
  - 各モードごとに、基礎（1〜3ヶ月）、中級（4〜6ヶ月）、応用（7〜12ヶ月）の学習ロードマップと「Today's Mission（今日の推奨タスク）」を動的に提示。
- [x] **FR-02 (Must - AI講師: チャット英会話 & ロールプレイ [スタイルA])**:
  - Gemini API（Gemini 1.5 Flash / 2.0 Flash等）とストリーミング対応連携（モデル選択設定UIを提供）。
  - モードに応じたリアルなシチュエーション設定（カフェ注文、日常の雑談、ビジネス交渉・会議、TOEIC Part 3/4風対話など）。
  - ユーザーの発言に対して自然な返答を行い、必要に応じて「ワンポイントアドバイス（発音・語彙）」を付記。
- [x] **FR-03 (Must - AI講師: 英文添削 & 文法解説 [スタイルB])**:
  - ユーザーが書いた英文を入力すると、①文法エラーの修正、②より自然なネイティブ表現、③ビジネス/フォーマル表現の3パターンを提示。
  - なぜその修正が必要か、基礎文法ルールに基づいた丁寧な日本語解説を提供。
- [x] **FR-04 (Must - 音声機能: オーラル対話 & 発音支援 [スタイルC])**:
  - Web Speech API（SpeechRecognition）による音声入力（マイク波形アニメーション付き発話練習）。
  - Web Speech API（SpeechSynthesis）によるネイティブ発音の自動/ワンクリック再生（速度調整・発話中アニメーション機能付き）。
  - 音声認識非対応ブラウザ時の安全なフォールバックUI。
- [x] **FR-05 (Must - デイリークイズ [スタイルD])**:
  - 選択中モードと現在のレベルに応じた4択クイズ（ボキャブラリ・文法・リスニング・穴埋め）を自動生成またはプリセット（各モード10問以上搭載）から出題。
  - 即時採点、正解/不正解理由の詳細解説、間違えた問題の「要復習リスト」への自動登録。
- [x] **FR-06 (Must - 学習進捗管理 & ダッシュボード)**:
  - 今日の学習時間タイマー、累計学習時間、習得単語数・フレーズ数の自動集計。
  - 連続学習日数（Streak）トラッカー。
  - Chart.js による過去7日・30日の学習時間推移グラフ、モード別学習比率グラフ。
- [x] **FR-07 (Must - Obsidian Vault連携 & Markdown出力)**:
  - 学習したフレーズ、添削結果、重要単語、会話履歴をYAML Frontmatter付きMarkdownとして単体/一括エクスポート。
  - `90_System/91_Scripts/english_coach_sync.py` による `30_Document/English_Learning/` への自動同期CLI。
- [x] **FR-08 (Must - APIキー＆データ管理・プリセットオフライン学習)**:
  - Gemini APIキーのLocalStorage安全保存（UI上で設定・変更・削除可能、マスク表示、モデル選択）。
  - APIキー未設定時でも、基本文法ガイドや頻出フレーズ集（各モード20選以上）、プリセットクイズが即時利用可能なオフライン学習機能。
  - 全学習データのJSONバックアップおよびインポート機能（データ消失防止）。

### 2.2 非機能要件 (制約・セキュリティ・品質)
- **Johnny.Decimal規約**: 
  - アプリケーション配置: `20_Workspace/english-coach-app/`（Vault直下汚染の完全防止）。
  - ノート保存先: `30_Document/English_Learning/`。
  - 同期スクリプト: `90_System/91_Scripts/english_coach_sync.py`。
  - 構成定義更新: `00_Config/Vault_Structure.md` の即時更新。
- **セキュリティ & プライバシー**:
  - APIキーはローカル環境（ブラウザLocalStorage）にのみ保持し、外部送信はGoogle Gemini API公式エンドポイント宛てのみ。
  - ワークスペース外へのアクセス厳禁。
  - MarkdownレンダリングやHTML挿入時のXSSエスケープ処理徹底。
- **パフォーマンス & 互換性**:
  - 外部重厚フレームワークに依存せず、軽量Vanilla JS (ES Modules) + モダンCSSで構成し、ブラウザですぐ高速起動。
  - レスポンシブデザイン（PC・タブレット対応）。

---

## 3. スコープ

### 3.1 今回対応すること (In Scope)
1. `20_Workspace/english-coach-app/` 配下のフロントエンド完全実装（HTML, CSS, ES Modules）。
2. Gemini API連携クライアントモジュール（ストリーミング・プロンプトテンプレート・JSON解析・フォールバック）。
3. 3大モード（日常・ビジネス・TOEIC）別カリキュラム＆プリセット学習データ。
4. 4大AI講師機能（ロールプレイ会話、英文添削、音声STT/TTS、デイリークイズ）。
5. 進捗管理・統計ダッシュボード（Chart.js、ストリーク計算、LocalStorage永続化）。
6. Obsidian同期用Python CLI（`90_System/91_Scripts/english_coach_sync.py`）およびテストコードの作成。
7. `00_Config/Vault_Structure.md` の構成管理更新。
8. 総合動作検証および完了報告（Walkthrough）。

### 3.2 今回対応しないこと (Out of Scope)
- クラウドデータベース（Firebase/Supabase等）による外部クラウドへの常時同期（ローカル完結・Obsidian連携を優先）。
- 有料商用音声API（Google Cloud Text-to-Speech有料枠等）の有料課金契約連携（標準のブラウザWeb Speech APIおよびGemini標準を利用）。

---

## 4. 変更対象ファイルおよび影響範囲

| 操作種別 | 対象パス | 変更概要 | 波及影響 |
| :--- | :--- | :--- | :--- |
| `[MODIFY]` | `00_Config/Vault_Structure.md` | `english-coach-app` と `English_Learning/` の構成定義追記 | Vault構成管理の最新化 |
| `[NEW]` | `20_Workspace/english-coach-app/index.html` | アプリケーションメインHTML（ヘッダー、モード切替、タブナビ、メインコンテンツ） | 新規作成 |
| `[NEW]` | `20_Workspace/english-coach-app/css/style.css` | スタイリング（モダンダーク/ライトUI、ダッシュボードグリッド、チャット吹き出し） | 新規作成 |
| `[NEW]` | `20_Workspace/english-coach-app/js/app.js` | メインエントリーポイント・ルーティング・イベント初期化 | 新規作成 |
| `[NEW]` | `20_Workspace/english-coach-app/js/modules/constants.js` | 定数（カリキュラム定義、モード定義、プリセット問題、システムプロンプト等） | 新規作成 |
| `[NEW]` | `20_Workspace/english-coach-app/js/modules/state.js` | アプリケーション状態管理（現在モード、学習進捗、ストリーク、セッション） | 新規作成 |
| `[NEW]` | `20_Workspace/english-coach-app/js/modules/storage.js` | LocalStorage保存・読込・JSON/Markdownエクスポート | 新規作成 |
| `[NEW]` | `20_Workspace/english-coach-app/js/modules/gemini.js` | Gemini APIクライアント（ストリーミング対話、添削、クイズ生成） | 新規作成 |
| `[NEW]` | `20_Workspace/english-coach-app/js/modules/speech.js` | Web Speech API（音声認識STT、音声合成TTS）ラッパー | 新規作成 |
| `[NEW]` | `20_Workspace/english-coach-app/js/modules/analytics.js` | Chart.js による学習時間・モード比率・進捗グラフ描画 | 新規作成 |
| `[NEW]` | `20_Workspace/english-coach-app/js/modules/ui.js` | DOM操作、タブ切り替え、チャットUI、添削結果表示、モーダル制御 | 新規作成 |
| `[NEW]` | `90_System/91_Scripts/english_coach_sync.py` | LocalStorageエクスポートデータと `30_Document/English_Learning/` の双方向同期CLI | 新規作成 |
| `[NEW]` | `90_System/91_Scripts/tests/test_english_coach_sync.py` | 同期スクリプトの単体テスト | 新規作成 |
| `[NEW]` | `30_Document/English_Learning/.gitkeep` | Obsidian学習ノート格納先ディレクトリの初期化 | 新規作成 |

---

## 5. 前提条件と依存関係
- **前提条件**: 
  - ブラウザ: Google Chrome / Safari / Edge（Web Speech APIおよびモダンJavaScriptサポート）。
  - Gemini APIキー: Google AI Studioから取得したAPIキー（アプリ内で簡単に入力可能）。
  - Python: 3.10+（同期スクリプト実行用）。
- **依存ライブラリ（CDN利用）**:
  - `marked.js` (Markdownレンダリング)
  - `Chart.js` (ダッシュボードグラフ描画)
  - `lucide` (アイコン表示)

---

## 6. テスト・検証戦略

### 6.1 自動テスト・コマンド検証
- 同期スクリプトテスト:
  `python3 -m unittest 90_System/91_Scripts/tests/test_english_coach_sync.py`
  - 期待結果: 全テストパス、YAML FrontmatterおよびMarkdownファイルが整合性を保って生成されること。
- Vaultガバナンス整合性チェック:
  `python3 90_System/91_Scripts/vault_governance.py`
  - 期待結果: ディレクトリ規約エラーゼロ、リンク切れゼロ。

### 6.2 動作確認・UI検証
1. **アプリ起動確認**: ローカルWebサーバーまたはブラウザ直接表示でUIエラー（コンソールエラー）がないこと。
2. **モード切り替え検証**: 日常会話 / ビジネス / TOEIC の切り替えにより、カリキュラムとプロンプトが適切に変化すること。
3. **AI講師（4大スタイル）検証**:
   - 会話ロールプレイ: 適切な英語の返答とアドバイスが得られること。
   - 英文添削: ユーザー入力文に対して、文法修正・自然な表現・ビジネス表現の3パターンと日本語解説が正しく返ること。
   - 音声入出力: マイク認識（STT）と発話読み上げ（TTS）が正常に機能すること。
   - クイズ: クイズが出題され、正誤判定・スコア加算・解説が表示されること。
4. **進捗ダッシュボード検証**: 学習時間や学習完了タスクが記録され、Chart.js で美しくグラフ表示されること。
5. **Obsidian連携検証**: エクスポートされたMarkdownファイルが `30_Document/English_Learning/` に正しく同期され、Obsidianで綺麗に閲覧できること。

---

## 7. リスクと対策
| 想定リスク | 影響度 (高/中/低) | 対策・回避策 |
| :--- | :--- | :--- |
| Gemini APIキーの未設定またはレート制限 | 中 | APIキー未設定時でもプリセットの学習データやローカルクイズ・単語帳が利用できる親切なUIガイドとフォールバックを実装 |
| Web Speech APIのブラウザ差異 | 低 | 音声認識非対応ブラウザ環境ではテキスト入力モードへ自動フォールバックし、エラーで停止しないよう安全弁を配置 |
| 大量の学習ログによるストレージ圧迫 | 低 | LocalStorageの容量上限を考慮し、重要フレーズや会話要約をObsidian Markdownへ適宜外部退避・同期できる設計とする |

---

## 8. レビュー履歴
- **第1回 (2026-09-22)**: [[40_Management/43_Plan_Reviews/PREV-20260922-01_english_coach_app]] - 結果: **APPROVED (合格)**
  - 指摘反映: Gemini APIモデル選択UIの追加、オフライン初期プリセットデータ（文法・フレーズ・クイズ）拡充、音声UIアニメーション・フォールバック強化。


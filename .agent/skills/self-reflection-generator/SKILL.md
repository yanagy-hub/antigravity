---
name: self-reflection-generator
description: 現在のエラーログと直前の修正アプローチをもとに、サブエージェントに渡すための「反省と別案の検討」を促す構造化プロンプトを生成します。
---

# Self-Reflection Generator Skill

## 概要
AIが同じ失敗を繰り返さないようにするため、単にエラー文を渡すのではなく「前回はこういう意図でAという修正をしたが、結果Bというエラーになった。根本原因は別にあるかもしれないので、CやDのアプローチを検討してほしい」というような、深い反省を促すプロンプトを自動生成します。

## 使用タイミング
* ループの「意思決定（Decide）」フェーズ。
* 特に2回目以降のイテレーションで、サブエージェント（Bug Analyzer等）を呼び出して解決策を練り直す直前に使用します。

## 使用方法
以下のスクリプトにエラー内容や前回のアプローチ内容を渡して実行します。

```bash
python 90_System/91_Scripts/reflection_generator.py \
  --error-msg "AssertionError: expected 5 but got 4" \
  --prev-action "1行目の return x + 1 を return x + 2 に変更した"
```

### 引数
* `--error-msg`: 発生したエラーメッセージ（または `test-output-parser` で抽出したJSON文字列）。
* `--prev-action`: 直前に実行した修正やアプローチの概要（省略可）。

### 出力
標準出力に、サブエージェント向けの強力なプロンプトテキスト（Markdown形式）が出力されます。これをそのまま `invoke_subagent` の `Prompt` 引数などに利用できます。

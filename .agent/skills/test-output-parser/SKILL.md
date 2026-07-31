---
name: test-output-parser
description: テストフレームワーク（pytest等）やリンターの出力テキストを解析し、エラー内容をJSON形式で構造化して抽出する。
---

# Test Output Parser Skill

## 概要
`run_command` で実行したテストやビルドの標準出力を解析し、「どのファイルの、何行目で、どのようなエラーが起きたか」をJSON形式で構造化して出力するスキルです。これにより、サブエージェントがエラー内容を理解しやすくなります。

## 使用タイミング
* ループエンジニアリングの「観察（Observe）」フェーズにおいて、コマンドの生ログを取得した後。
* 評価（Evaluate）や意思決定（Decide）を行う直前。

## 使用方法
以下のようにパイプラインでテキストを渡すか、ファイルパスを指定して実行します。

```bash
# パイプを利用して標準入力をパースする例
cat output.log | python 90_System/91_Scripts/test_output_parser.py

# またはファイル引数を利用する
python 90_System/91_Scripts/test_output_parser.py --file output.log
```

### 出力例
```json
{
  "status": "failed",
  "errors": [
    {
      "file": "tests/test_main.py",
      "line": "42",
      "message": "AssertionError: expected 5 but got 4"
    }
  ]
}
```

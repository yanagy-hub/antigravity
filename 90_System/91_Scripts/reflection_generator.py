import argparse
import sys

def generate_prompt(error_msg, prev_action):
    prompt = f"""あなたは熟練のデバッグ専門エージェントです。
現在、以下のエラーが発生してテスト（または処理）が失敗しています。

### 発生しているエラー
```text
{error_msg}
```
"""

    if prev_action:
        prompt += f"""
### 直前に行ったアプローチ（失敗）
直前のイテレーションで、以下の修正を試みましたが解決しませんでした。
```text
{prev_action}
```

### あなたへの指示（深い反省と別視点の探索）
直前のアプローチは失敗に終わりました。同じ方向性の微修正（パラメータを少し変えるだけなど）は**絶対に避けてください**。
代わりに、以下の観点でエラーの根本原因を再評価してください：
1. そもそも前提としている仕様や型の理解が間違っていないか？
2. 修正すべきファイルは本当にここか？（呼び出し元や設定ファイル側に原因はないか）
3. 全く別のアプローチ（アルゴリズムの変更、ライブラリの利用見直しなど）は考えられないか。

上記を踏まえ、**最も可能性の高い真の原因**と、**具体的かつ新しい修正コード**を提示してください。
"""
    else:
        prompt += """
### あなたへの指示
上記のエラーログを分析し、エラーの根本原因と修正すべきコード（ファイル名、修正内容）を具体的に提示してください。
局所的な対症療法ではなく、なぜそのエラーが起きたのかを論理的に説明した上で修正案を出してください。
"""

    return prompt

def main():
    parser = argparse.ArgumentParser(description="Generate self-reflection prompt for subagents")
    parser.add_argument("--error-msg", required=True, help="The current error message or log")
    parser.add_argument("--prev-action", default="", help="Description of the previous failed action")
    args = parser.parse_args()

    prompt = generate_prompt(args.error_msg, args.prev_action)
    print(prompt)
    sys.exit(0)

if __name__ == "__main__":
    main()

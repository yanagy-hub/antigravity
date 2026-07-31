#!/usr/bin/env python3
"""
ループエンジニアリング実行・評価制御スクリプト (loop_runner.py)

本スクリプトは、ループエンジニアリングの定義パラメータ (Loop_Config.json) を読み込み、
観察 (Observe) -> 評価 (Evaluate) -> 意思決定 (Decide) -> 実行 (Act) の
サイクル制御およびガードレール判定をシミュレーション・実行するためのクラスを提供します。
"""

import json
import os
import sys
from typing import Dict, Any, List, Tuple


class LoopRunner:
    """ループエンジニアリングの制御を行うクラス"""

    def __init__(self, config_path: str):
        """
        初期化メソッド
        :param config_path: Loop_Config.json のファイルパス
        """
        self.config_path = config_path
        self.config = self._load_config()
        self.settings = self.config.get("settings", {})
        self.max_retries = self.settings.get("max_retries", 3)
        self.iteration = 0
        self.error_history: List[str] = []
        
    def _load_config(self) -> Dict[str, Any]:
        """設定ファイル (JSON) を読み込む"""
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"設定ファイルが見つかりません: {self.config_path}")
        with open(self.config_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def evaluate_step(self, exit_code: int, error_log: str = "") -> Tuple[str, str]:
        """
        評価 (Evaluate) ステップの判定を行う

        :param exit_code: コマンド実行等の終了コード (0 で成功)
        :param error_log: エラーログメッセージ
        :return: (判定ステータス, メッセージ)
        """
        self.iteration += 1

        # 1. 決定論的評価 (Exit Code Check)
        if exit_code == 0:
            return "SUCCESS", f"イテレーション {self.iteration}: 全件パスしました。ループを正常終了します。"

        # 2. ガードレール: 最大試行回数オーバーのチェック
        if self.iteration >= self.max_retries:
            return "FAILED_MAX_RETRIES", f"イテレーション {self.iteration}: 最大試行回数 ({self.max_retries}) に達しました。"

        # 3. ガードレール: 同一エラー連続発生のチェック
        stop_on_repeat = self.settings.get("guardrails", {}).get("stop_on_repeated_error_count", 2)
        if error_log:
            self.error_history.append(error_log)
            if len(self.error_history) >= stop_on_repeat:
                # 直近 N 回のログが一致しているか確認
                recent_errors = self.error_history[-stop_on_repeat:]
                if len(set(recent_errors)) == 1:
                    return "WARNING_REPEATED_ERROR", (
                        f"イテレーション {self.iteration}: 同一のエラーが {stop_on_repeat} 回連続発生しました。"
                        "アプローチの変更が必要です。"
                    )

        return "CONTINUE", f"イテレーション {self.iteration}: テスト失敗。修正ループを継続します。"


def main():
    """動作確認・シミュレーション用のメイン関数"""
    print("=== ループエンジニアリング Runner シミュレーション開始 ===")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.abspath(os.path.join(script_dir, "../../00_Config/Loop_Config.json"))
    
    try:
        runner = LoopRunner(config_path)
        print(f"設定読み込み成功: max_retries = {runner.max_retries}")
    except Exception as e:
        print(f"設定読み込みエラー: {e}")
        sys.exit(1)

    # 擬似シミュレーション (失敗2回 -> 成功1回)
    simulated_outputs = [
        (1, "AssertionError: expected 10 but got 5"),
        (1, "AssertionError: expected 10 but got 5"),
        (0, "")
    ]

    for exit_code, log_msg in simulated_outputs:
        status, msg = runner.evaluate_step(exit_code, log_msg)
        print(f"[{status}] {msg}")
        if status in ["SUCCESS", "FAILED_MAX_RETRIES"]:
            break

    print("=== シミュレーション終了 ===")


if __name__ == "__main__":
    main()

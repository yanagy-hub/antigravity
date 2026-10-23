"""
デモ用サンプルデータ生成の単体テスト
"""
import unittest
import numpy as np
import pandas as pd
from core.sample_data import generate_sample_dataset, SAMPLE_TOPICS


class TestSampleData(unittest.TestCase):
    def test_generate_sample_dataset_structure(self):
        df = generate_sample_dataset(n_samples_per_topic=10, embedding_dim=128)
        self.assertIsInstance(df, pd.DataFrame)
        expected_rows = len(SAMPLE_TOPICS) * 10
        self.assertEqual(len(df), expected_rows)

        # 必須カラムの確認
        for col in ["id", "category", "text", "vector"]:
            self.assertIn(col, df.columns)

        # ベクトル次元数の確認
        first_vec = df["vector"].iloc[0]
        self.assertEqual(len(first_vec), 128)

        # 正規化（L2ノルムが約1.0）の確認
        norm = np.linalg.norm(first_vec)
        self.assertAlmostEqual(norm, 1.0, places=4)

    def test_reproducibility_with_seed(self):
        df1 = generate_sample_dataset(n_samples_per_topic=5, embedding_dim=64, random_seed=123)
        df2 = generate_sample_dataset(n_samples_per_topic=5, embedding_dim=64, random_seed=123)
        np.testing.assert_array_almost_equal(
            np.array(df1["vector"].tolist()),
            np.array(df2["vector"].tolist()),
        )


if __name__ == "__main__":
    unittest.main()

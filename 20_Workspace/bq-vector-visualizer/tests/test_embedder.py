"""
埋め込み生成 & コサイン類似度計算の単体テスト
"""
import unittest
import numpy as np
from core.embedder import generate_embedding, calculate_cosine_similarities


class TestEmbedder(unittest.TestCase):
    def test_mock_embedding_generation(self):
        vec, is_real, msg = generate_embedding("AIの自律エージェント設計", api_key=None, target_dim=128)
        self.assertIsNotNone(vec)
        self.assertEqual(len(vec), 128)
        self.assertFalse(is_real)
        # 決定論的ハッシュによる再現性
        vec2, _, _ = generate_embedding("AIの自律エージェント設計", api_key=None, target_dim=128)
        self.assertEqual(vec, vec2)

    def test_empty_text_embedding(self):
        vec, is_real, msg = generate_embedding("", api_key=None)
        self.assertIsNone(vec)
        self.assertFalse(is_real)

    def test_cosine_similarity_calculation(self):
        # 直交ベクトル (類似度 0)
        q = [1.0, 0.0]
        dataset = [
            [1.0, 0.0],   # 同一 (類似度 1.0)
            [0.0, 1.0],   # 直交 (類似度 0.0)
            [-1.0, 0.0],  # 逆 (類似度 -1.0)
        ]
        sims = calculate_cosine_similarities(q, dataset)
        self.assertEqual(len(sims), 3)
        self.assertAlmostEqual(sims[0], 1.0, places=4)
        self.assertAlmostEqual(sims[1], 0.0, places=4)
        self.assertAlmostEqual(sims[2], -1.0, places=4)


if __name__ == "__main__":
    unittest.main()

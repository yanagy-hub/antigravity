"""
次元削減 & クラスタリングの単体テスト
"""
import unittest
import numpy as np
from core.reducer import reduce_dimensions, perform_clustering


class TestReducer(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(42)
        # 30サンプル x 50次元 のダミーデータ
        self.vectors = rng.normal(size=(30, 50)).tolist()

    def test_pca_2d(self):
        coords, method = reduce_dimensions(self.vectors, method="PCA", n_components=2)
        self.assertEqual(method, "PCA")
        self.assertEqual(coords.shape, (30, 2))
        self.assertFalse(np.isnan(coords).any())

    def test_pca_3d(self):
        coords, method = reduce_dimensions(self.vectors, method="PCA", n_components=3)
        self.assertEqual(method, "PCA")
        self.assertEqual(coords.shape, (30, 3))
        self.assertFalse(np.isnan(coords).any())

    def test_tsne_2d(self):
        coords, method = reduce_dimensions(self.vectors, method="t-SNE", n_components=2)
        self.assertEqual(method, "t-SNE")
        self.assertEqual(coords.shape, (30, 2))
        self.assertFalse(np.isnan(coords).any())

    def test_clustering_kmeans(self):
        labels = perform_clustering(self.vectors, n_clusters=4)
        self.assertEqual(len(labels), 30)
        self.assertTrue(set(labels).issubset({0, 1, 2, 3}))

    def test_insufficient_samples_error(self):
        tiny_vectors = [[1.0, 2.0]]
        with self.assertRaises(ValueError):
            reduce_dimensions(tiny_vectors, method="PCA", n_components=2)


if __name__ == "__main__":
    unittest.main()

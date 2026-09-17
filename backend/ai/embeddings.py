from sentence_transformers import SentenceTransformer
import numpy as np


class EmbeddingManager:
    """
    Handles conversion of text into vector embeddings.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def embed_documents(self, texts: list[str]) -> np.ndarray:
        """
        Convert multiple text chunks into embeddings.
        """

        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=True
        )

        return embeddings.astype("float32")

    def embed_query(self, query: str) -> np.ndarray:
        """
        Convert a user query into an embedding.
        """

        embedding = self.model.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        return embedding.astype("float32")
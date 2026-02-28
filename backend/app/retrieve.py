"""Retrieve relevant chunks from FAISS for a query."""

from app.config import EMBEDDING_MODEL_NAME
from app.ingest import get_index_and_docstore
from sentence_transformers import SentenceTransformer


def retrieve(query: str, top_k: int = 5) -> list[dict]:
    """
    Embed the query and return top_k most similar chunks.
    Each item is {"text": chunk content, "source": metadata source}.
    """
    if not query.strip():
        return []
    index, docstore = get_index_and_docstore()
    if index is None or len(docstore) == 0:
        return []
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    q_emb = model.encode([query.strip()], normalize_embeddings=True).astype("float32")
    k = min(top_k, index.ntotal)
    scores, indices = index.search(q_emb, k)
    out = []
    for idx in indices[0]:
        if 0 <= idx < len(docstore):
            out.append({"text": docstore[idx]["text"], "source": docstore[idx].get("source", "unknown")})
    return out

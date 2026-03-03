"""Retrieve and re-rank relevant chunks from FAISS for a query."""

from app.config import EMBEDDING_MODEL_NAME
from app.ingest import get_index_and_docstore
from sentence_transformers import SentenceTransformer

# Lazy-loaded cross-encoder — downloaded on first use, then cached in memory.
_reranker = None


def _get_reranker():
    global _reranker
    if _reranker is None:
        from sentence_transformers import CrossEncoder
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _reranker


def retrieve(query: str, top_k: int = 5) -> list[dict]:
    """
    Embed the query, retrieve candidate chunks from FAISS, then re-rank using
    a cross-encoder for improved relevance.

    Pipeline:
      1. FAISS bi-encoder search → top (top_k * 2) candidates  (fast, approximate)
      2. CrossEncoder re-ranking → scored against the exact query  (slower, accurate)
      3. Return top_k after re-ranking

    Each returned item is {"text": chunk content, "source": metadata source}.
    """
    if not query.strip():
        return []

    index, docstore = get_index_and_docstore()
    if index is None or len(docstore) == 0:
        return []

    # --- Stage 1: FAISS bi-encoder retrieval ---
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    q_emb = model.encode([query.strip()], normalize_embeddings=True).astype("float32")
    candidate_k = min(top_k * 2, index.ntotal)
    _, indices = index.search(q_emb, candidate_k)

    candidates = []
    for idx in indices[0]:
        if 0 <= idx < len(docstore):
            candidates.append({
                "text": docstore[idx]["text"],
                "source": docstore[idx].get("source", "unknown"),
            })

    if not candidates:
        return []

    # --- Stage 2: CrossEncoder re-ranking ---
    try:
        reranker = _get_reranker()
        pairs = [(query.strip(), c["text"]) for c in candidates]
        rerank_scores = reranker.predict(pairs)

        ranked = sorted(zip(rerank_scores, candidates), key=lambda x: x[0], reverse=True)
        return [c for _, c in ranked[:top_k]]
    except Exception:
        # Fall back to FAISS order if re-ranking fails
        return candidates[:top_k]

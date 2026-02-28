"""Chunk text and store in FAISS with sentence-transformers embeddings."""

import json
from pathlib import Path

import faiss
from sentence_transformers import SentenceTransformer

from app.config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    DATA_DIR,
    EMBEDDING_MODEL_NAME,
)


def _chunk_text(text: str, source: str = "unknown") -> list[tuple[str, dict]]:
    """Split text into overlapping chunks. Returns list of (chunk_text, metadata)."""
    chunks: list[tuple[str, dict]] = []
    start = 0
    text = text.strip()
    if not text:
        return chunks
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end]
        chunks.append((chunk, {"source": source}))
        start = end - CHUNK_OVERLAP
        if start >= len(text):
            break
    return chunks


def _get_paths():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return DATA_DIR / "index.faiss", DATA_DIR / "docstore.json"


def _get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(EMBEDDING_MODEL_NAME)


def _load_docstore(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_docstore(path: Path, docs: list[dict]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=0)


def ingest_text(text: str, source: str = "pasted") -> dict:
    """
    Ingest raw text: chunk it, embed with sentence-transformers, store in FAISS.
    Returns count of chunks added.
    """
    chunks_with_meta = _chunk_text(text, source=source)
    if not chunks_with_meta:
        return {"chunks_added": 0, "message": "No content to ingest"}

    index_path, docstore_path = _get_paths()
    model = _get_embedding_model()
    documents = [c[0] for c in chunks_with_meta]
    embeddings = model.encode(documents, normalize_embeddings=True)

    docstore = _load_docstore(docstore_path)
    dim = embeddings.shape[1]

    if index_path.exists():
        index = faiss.read_index(str(index_path))
    else:
        index = faiss.IndexFlatIP(dim)

    index.add(embeddings.astype("float32"))
    for (doc, meta) in chunks_with_meta:
        docstore.append({"text": doc, "source": meta.get("source", "unknown")})

    faiss.write_index(index, str(index_path))
    _save_docstore(docstore_path, docstore)
    return {"chunks_added": len(chunks_with_meta), "source": source}


def ingest_file(path: str) -> dict:
    """Ingest a plain-text file from path."""
    p = path.strip()
    with open(p, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()
    source = p.split("/")[-1].split("\\")[-1]
    return ingest_text(text, source=source)


def clear_index() -> dict:
    """Remove the FAISS index and docstore so the next ingest starts fresh."""
    index_path, docstore_path = _get_paths()
    removed = []
    if index_path.exists():
        index_path.unlink()
        removed.append(str(index_path))
    if docstore_path.exists():
        docstore_path.unlink()
        removed.append(str(docstore_path))
    return {"ok": True, "message": "Index cleared", "removed": removed}


def get_index_and_docstore():
    """Load FAISS index and docstore for retrieval. Returns (index, docstore) or (None, []) if empty."""
    index_path, docstore_path = _get_paths()
    if not index_path.exists() or not docstore_path.exists():
        return None, []
    index = faiss.read_index(str(index_path))
    docstore = _load_docstore(docstore_path)
    if len(docstore) == 0:
        return None, []
    return index, docstore

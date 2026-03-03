"""Tools available to the RAG agent."""

from app.retrieve import retrieve

# Stores chunks from the most recent search_documents call.
# Uses clear/extend (not reassignment) so the imported reference stays valid.
_last_chunks: list[dict] = []

# Injected by the /api/chat/stream endpoint so tool calls emit SSE events.
# None when using the regular /api/chat endpoint.
_event_queue = None


def search_documents(query: str) -> str:
    """Search the user's ingested documents for information relevant to the query.

    Call this before answering any question. If the first result is not helpful,
    call again with a more specific or rephrased query.
    """
    if _event_queue is not None:
        _event_queue.put({"type": "tool_call", "tool": "search_documents", "query": query})

    chunks = retrieve(query, top_k=5)
    _last_chunks.clear()
    _last_chunks.extend(chunks)

    if _event_queue is not None:
        _event_queue.put({"type": "tool_done", "tool": "search_documents", "found": len(chunks)})

    if not chunks:
        return "No relevant content found in the documents for this query."

    parts = [f"[Source: {c['source']}]\n{c['text']}" for c in chunks]
    return "\n\n---\n\n".join(parts)

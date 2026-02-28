"""Build context and call Anthropic (Claude) for the answer."""

from app.config import ANTHROPIC_API_KEY, ANTHROPIC_CHAT_MODEL
from anthropic import Anthropic


def build_prompt(query: str, chunks: list[dict]) -> str:
    """Format context and question for the LLM."""
    if not chunks:
        return (
            "You have no retrieved context. Say you don't have enough information to answer.\n\n"
            f"User question: {query}"
        )
    context = "\n\n---\n\n".join(
        f"[Source: {c.get('source', 'unknown')}]\n{c['text']}" for c in chunks
    )
    return f"""Use only the following context to answer the question.

Instructions:
- If the answer is not in the context, say so clearly and do not guess.
- When possible, mention which source (the label in brackets) the information comes from.
- Keep answers concise and clear; use bullet points when listing multiple items.

Context:
{context}

Question: {query}

Answer:"""


def chat(query: str, chunks: list[dict]) -> str:
    """Call Claude with the query and retrieved chunks. Returns the assistant reply."""
    if not ANTHROPIC_API_KEY:
        return "Error: ANTHROPIC_API_KEY is not set. Add it to .env (get a key at https://console.anthropic.com)."
    prompt = build_prompt(query, chunks)
    api = Anthropic(api_key=ANTHROPIC_API_KEY)
    message = api.messages.create(
        model=ANTHROPIC_CHAT_MODEL,
        max_tokens=1024,
        temperature=0.2,
        messages=[{"role": "user", "content": prompt}],
    )
    if not message.content or len(message.content) == 0:
        return ""
    first = message.content[0]
    # Handle both dict-style and object-style content blocks
    text = getattr(first, "text", None) or (first.get("text") if isinstance(first, dict) else None)
    return text or ""

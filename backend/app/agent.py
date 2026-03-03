"""Agno agent definition for RAG chat."""

from agno.agent import Agent
from agno.models.anthropic import Claude

from app.config import ANTHROPIC_API_KEY, ANTHROPIC_CHAT_MODEL
from app.tools import search_documents

# Singleton — created once, reused across requests.
_agent: Agent | None = None


def get_agent() -> Agent:
    """Return the singleton Agent instance, creating it on first call."""
    global _agent
    if _agent is None:
        _agent = Agent(
            model=Claude(id=ANTHROPIC_CHAT_MODEL, api_key=ANTHROPIC_API_KEY),
            tools=[search_documents],
            instructions=[
                "You are a document assistant. Your ONLY job is to answer questions using the content retrieved from the user's uploaded documents.",
                "Always call search_documents before answering any factual question.",
                "If the first search does not return relevant results, call search_documents again with a rephrased or more specific query.",
                "STRICT RULE: Base your answer ONLY on the text returned by search_documents. Do NOT add, expand, or supplement with any knowledge from your training. If a detail is not present in the retrieved chunks, do not include it.",
                "Always cite the source label (shown as [Source: ...]) when giving an answer.",
                "If after two searches you still cannot find the answer, say clearly: 'This information is not in the uploaded documents.' Do not guess or infer.",
                "Keep answers concise and faithful to the source text. Do not paraphrase beyond what is needed for readability.",
                "Do NOT invent structure. Do not add 'Key Highlights', 'Summary', 'Overview' sections, emojis, or bullet-point breakdowns unless that exact structure appears in the retrieved source text. Present information in plain prose as it appears in the document.",
            ],
            # Conversation memory: include last 5 exchanges as context
            add_history_to_context=True,
            num_history_runs=5,
            debug_mode=False,
            markdown=True,
        )
    return _agent

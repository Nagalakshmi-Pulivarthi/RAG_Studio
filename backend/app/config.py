import os
from pathlib import Path

from dotenv import load_dotenv

# Load single .env from project root (parent of backend/)
_ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT_DIR / ".env")

CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "600"))
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "75"))

# Vector store: FAISS + sentence-transformers
DATA_DIR: Path = Path(os.getenv("VECTOR_DATA_DIR", str(Path(__file__).resolve().parent.parent / "vector_data")))
EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")

# Chat: Claude only
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_CHAT_MODEL: str = os.getenv("ANTHROPIC_CHAT_MODEL", "claude-sonnet-4-6")

# RAG Studio

A full-stack **Retrieval-Augmented Generation (RAG)** application that lets you ingest documents (text, PDF, Word, HTML, or URLs), index them with vector embeddings, and chat with an AI agent that answers **only** from your uploaded content.

## Features

- **Ingest content** via:
  - Pasted text
  - File upload (PDF, Word `.docx`, HTML)
  - URL (fetch and extract text from web pages)
  - Server file path (plain text or XML)
- **Smart PDF parsing** — tables are extracted row-by-row and converted to natural-language sentences using `pdfplumber`, preserving structure that plain text extraction loses
- **Two-stage retrieval**:
  1. FAISS bi-encoder search (fast, approximate) — retrieves 10 candidates
  2. CrossEncoder re-ranking — scores each candidate against the exact query and returns the top 5 most relevant chunks
- **Agentic chat** powered by Agno + Anthropic Claude — the agent decides when and how many times to search, then synthesises an answer grounded strictly in retrieved content
- **Streaming responses** via SSE — see the agent's search activity live as it works
- **Conversation memory** — each browser tab gets its own session; the agent remembers the last 5 exchanges so follow-up questions like "what about its fat content?" work naturally
- **Strict grounding** — the agent is instructed never to add facts, expand, or invent formatting beyond what the retrieved chunks contain
- **Source citations** shown under every answer
- **Index status panel** — the Ingest tab always shows what is currently indexed, even after switching tabs
- **Clear index** to reset and start fresh

## Architecture

| Layer | Stack |
|-------|--------|
| **Frontend** | React 19, Vite 7, Tailwind CSS, react-markdown |
| **Backend** | FastAPI, Python 3.x |
| **Agent** | Agno (agentic loop, session memory, SSE streaming) |
| **Embeddings** | sentence-transformers `all-MiniLM-L6-v2`, FAISS (CPU) |
| **Re-ranking** | sentence-transformers CrossEncoder `ms-marco-MiniLM-L-6-v2` |
| **LLM** | Anthropic Claude (e.g. `claude-sonnet-4-6`) |

### Retrieval pipeline

```
Question
   │
   ▼
FAISS bi-encoder search  →  10 candidate chunks
   │
   ▼
CrossEncoder re-ranking  →  top 5 chunks (re-ordered by true relevance)
   │
   ▼
Agno agent  →  synthesises answer from retrieved chunks only
```

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Anthropic API key** ([console.anthropic.com](https://console.anthropic.com))

## Quick Start

### 1. Clone and configure

```bash
cd RAG_Studio
cp .env.example .env
```

Edit `.env` and set:

- `ANTHROPIC_API_KEY` — required for chat
- `VITE_API_URL` — only if the API is not at `http://127.0.0.1:8000`

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
.\venv\Scripts\python.exe run.py
```

The API runs at **http://127.0.0.1:8000** (or the next free port 8001, 8002, …). Use `PORT=8005` to force a port.

> **Windows note:** Always start the server with `.\venv\Scripts\python.exe run.py` so `faiss` and `sentence_transformers` are found in the venv. Avoid `--reload`; the reloader may spawn a worker using system Python.

> **First startup:** The embedding model and CrossEncoder are downloaded on first use — this can take a minute or two. Subsequent starts are instant (models are cached).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

### 4. Use the app

1. **Ingest tab** — upload a PDF, Word doc, HTML file, paste text, or provide a URL. The "Currently Indexed" panel shows everything in the index.
2. **Chat tab** — type a question. The agent searches your documents, shows its activity live, then returns an answer with source snippets. Follow-up questions use the conversation history automatically.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/api/index-status` | List all indexed sources and chunk counts |
| POST | `/api/ingest` | Ingest pasted text or server file path (JSON) |
| POST | `/api/ingest-upload` | Upload PDF / Word / HTML (multipart) |
| POST | `/api/ingest-url` | Ingest from URL (JSON `url`) |
| POST | `/api/clear-index` | Clear FAISS index and docstore |
| POST | `/api/chat` | Chat — returns full answer + sources (JSON) |
| POST | `/api/chat/stream` | Chat — streams SSE events (tool calls, answer, sources) |

Interactive docs: **http://127.0.0.1:8000/docs**

## Configuration

Single `.env` at the **project root** (parent of `backend/` and `frontend/`).

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | **Required** for chat |
| `ANTHROPIC_CHAT_MODEL` | `claude-sonnet-4-6` | Claude model |
| `EMBEDDING_MODEL_NAME` | `all-MiniLM-L6-v2` | Bi-encoder model for FAISS |
| `CHUNK_SIZE` | 600 | Character size of text chunks |
| `CHUNK_OVERLAP` | 75 | Overlap between consecutive chunks |
| `VECTOR_DATA_DIR` | `backend/vector_data` | Directory for `index.faiss` + `docstore.json` |
| `VITE_API_URL` | `http://127.0.0.1:8000` | Backend URL used by the frontend |
| `PORT` | 8000 (auto 8000–8010) | Backend server port |

## Project Structure

```
RAG_Studio/
├── .env                 # Copy from .env.example; not committed
├── .env.example         # Environment variable template
├── backend/
│   ├── app/
│   │   ├── main.py      # FastAPI routes (ingest, chat, index-status)
│   │   ├── config.py    # Settings loaded from .env
│   │   ├── ingest.py    # Chunking, FAISS indexing, docstore
│   │   ├── retrieve.py  # FAISS bi-encoder search + CrossEncoder re-ranking
│   │   ├── agent.py     # Agno agent definition (instructions, memory, model)
│   │   └── tools.py     # search_documents tool used by the agent
│   ├── vector_data/     # index.faiss + docstore.json (runtime, not committed)
│   ├── requirements.txt
│   ├── run.py           # Start server with venv check + auto port detection
│   ├── run.ps1          # PowerShell shortcut (direct uvicorn)
│   ├── start-server.ps1 # PowerShell shortcut (via run.py)
│   └── kill-port-8000.ps1
└── frontend/
    ├── src/
    │   ├── api.js            # Backend API client (chat, chatStream, ingest, etc.)
    │   ├── App.jsx           # Tab layout (Chat / Ingest)
    │   ├── components/
    │   │   ├── Chat.jsx      # Chat UI — bubbles, streaming, session memory
    │   │   └── Ingest.jsx    # Upload UI + currently-indexed panel
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js        # envDir: '..' so root .env is picked up
    └── tailwind.config.js
```

## Known Limitations

- Session memory is **in-process only** — restarting the backend clears all conversation history. A database storage backend is needed for persistence across restarts.
- `_event_queue` and `_last_chunks` in `tools.py` are module-level globals — not thread-safe for concurrent multi-user load.
- CORS is open (`allow_origins=["*"]`) — restrict this before any public deployment.
- Images embedded in PDFs (charts, diagrams with no text label) are silently skipped — this is a known limitation of text-only RAG pipelines.
- LLM grounding relies on prompt instructions only; there is no post-answer verification that every claim traces back to a retrieved chunk.

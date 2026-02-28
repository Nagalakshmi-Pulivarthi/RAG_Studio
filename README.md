# RAG Studio

A full-stack **Retrieval-Augmented Generation (RAG)** application that lets you ingest documents (text, PDF, Word, HTML, or URLs), index them with vector embeddings, and chat with an AI that answers from your content.

## Features

- **Ingest content** via:
  - Pasted text
  - File upload (PDF, Word `.docx`, HTML)
  - URL (fetch and extract text from web pages)
  - Server file path (plain text or XML)
- **Vector search** using FAISS and sentence-transformers (e.g. `all-MiniLM-L6-v2`)
- **Chat** powered by Anthropic Claude; answers are grounded in retrieved chunks with source citations
- **Clear index** to reset and ingest only new content

## Architecture

| Layer | Stack |
|-------|--------|
| **Frontend** | React 19, Vite 7, Tailwind CSS |
| **Backend** | FastAPI, Python 3.x |
| **Embeddings** | sentence-transformers, FAISS (CPU) |
| **LLM** | Anthropic Claude (e.g. `claude-sonnet-4-6`) |

- **Backend** (`backend/`): FastAPI app with ingest, retrieval, and chat endpoints. Loads `.env` from project root.
- **Frontend** (`frontend/`): React SPA that talks to the backend; loads `.env` from project root (e.g. `VITE_API_URL`).

## Prerequisites

- **Python 3.10+** (for backend)
- **Node.js 18+** (for frontend)
- **Anthropic API key** ([console.anthropic.com](https://console.anthropic.com))

## Quick Start

### 1. Clone and configure environment

```bash
cd RAG_Studio
cp .env.example .env
```

Edit `.env` and set:

- `ANTHROPIC_API_KEY` — required for chat
- Optionally `VITE_API_URL` if the API is not at `http://127.0.0.1:8000`

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

**Important:** Start the server with the **venv Python** so `faiss` and `sentence_transformers` are available. On Windows, use:

```bash
.\venv\Scripts\python.exe run.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is at **http://localhost:3000**. It will call the backend using `VITE_API_URL` (default `http://127.0.0.1:8000`).

### 4. Use the app

1. Open the **Ingest** tab: paste text, upload PDF/Word/HTML, ingest a URL, or (if applicable) a server file path. Optionally **Clear index** first to start from a clean index.
2. Open the **Chat** tab: ask questions; answers are based on ingested content and include source snippets.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info and links |
| GET | `/health` | Health check |
| GET | `/api/info` | List of main endpoints |
| GET | `/api/check-deps` | Verify faiss/sentence_transformers are available |
| POST | `/api/ingest` | Ingest `text` or file `path` (JSON body) |
| POST | `/api/ingest-upload` | Upload PDF/Word/HTML (multipart `file`) |
| POST | `/api/ingest-url` | Ingest from URL (JSON `url`) |
| POST | `/api/clear-index` | Clear FAISS index and docstore |
| POST | `/api/chat` | Send `message`, get answer + sources |

Interactive docs: **http://127.0.0.1:8000/docs**

## Configuration

Use a single `.env` at the **project root** (parent of `backend/` and `frontend/`).

| Variable | Default | Description |
|----------|---------|-------------|
| `CHUNK_SIZE` | 600 | Character size of text chunks for embedding |
| `CHUNK_OVERLAP` | 75 | Overlap between consecutive chunks |
| `VECTOR_DATA_DIR` | `backend/vector_data` | Directory for `index.faiss` and `docstore.json` |
| `EMBEDDING_MODEL_NAME` | `all-MiniLM-L6-v2` | sentence-transformers model name |
| `ANTHROPIC_API_KEY` | — | **Required** for chat |
| `ANTHROPIC_CHAT_MODEL` | `claude-sonnet-4-6` | Claude model for chat |
| `VITE_API_URL` | `http://127.0.0.1:8000` | Backend URL for the frontend |
| `PORT` | 8000 (or first free 8000–8010) | Backend server port |

## Project Structure

```
RAG_Studio/
├── .env                 # Copy from .env.example; not committed
├── .env.example         # Template for environment variables
├── backend/
│   ├── app/
│   │   ├── main.py      # FastAPI app, routes, file/URL ingest
│   │   ├── config.py    # Settings from env
│   │   ├── ingest.py    # Chunking, FAISS, docstore
│   │   ├── retrieve.py  # Query embedding and FAISS search
│   │   └── llm.py       # Claude prompt and API call
│   ├── vector_data/     # index.faiss, docstore.json (created at runtime)
│   ├── requirements.txt
│   └── run.py           # Start server (use venv Python)
└── frontend/
    ├── src/
    │   ├── api.js       # Backend API client
    │   ├── App.jsx      # Tabs: Chat, Ingest
    │   ├── components/
    │   │   ├── Chat.jsx
    │   │   └── Ingest.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js   # envDir: '..' for root .env
    └── tailwind.config.js
```

## Development Notes

- **First upload** can take 1–2 minutes while the embedding model loads; the frontend uses a long timeout for the first request.
- **CORS:** Backend allows all origins; tighten for production.
- **Windows:** Run the backend with `.\venv\Scripts\python.exe run.py` so the correct venv (with faiss/sentence_transformers) is used. Avoid `--reload` if the reloader uses a different Python.

## License

MIT License. See [LICENSE](LICENSE) for terms.

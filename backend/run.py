"""
Run the RAG API server.

  cd backend
  .\\venv\\Scripts\\python.exe run.py

Must use the venv Python (faiss, sentence_transformers are in the venv).
Uses port 8000; if in use, tries 8001, 8002, ... Set PORT=8005 to force a port.
"""
import os
import sys
import socket
import uvicorn


def _check_venv():
    """Ensure we're running with the venv so faiss/sentence_transformers are available."""
    try:
        import faiss  # noqa: F401
    except ModuleNotFoundError:
        print(
            "RAG dependencies not found. Run with the backend venv:\n\n"
            "  cd backend\n"
            "  .\\venv\\Scripts\\python.exe run.py\n",
            file=sys.stderr,
        )
        sys.exit(1)


def free_port(start=8000, end=8010):
    """Return the first port in [start, end] that is free to bind."""
    for port in range(start, end + 1):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("127.0.0.1", port))
                return port
        except OSError:
            continue
    return start


if __name__ == "__main__":
    _check_venv()
    port = int(os.environ.get("PORT", 0)) or free_port()
    url = f"http://127.0.0.1:{port}"
    print(f"\n  RAG API → {url}")
    print(f"  Docs    → {url}/docs\n")
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=False)

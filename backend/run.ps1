# Run the RAG API with the venv's Python (ensures faiss + sentence-transformers are found).
# On Windows, do NOT use --reload: the reloader spawns a worker that may use system Python and miss the venv.
Set-Location $PSScriptRoot
& .\venv\Scripts\python.exe -m uvicorn app.main:app

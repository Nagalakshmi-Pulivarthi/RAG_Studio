import { useState, useEffect, useCallback } from 'react';
import { ingestText, ingestFile, ingestUpload, ingestUrl, clearIndex, getIndexStatus } from '../api';

export default function Ingest() {
  const [text, setText] = useState('');
  const [filePath, setFilePath] = useState('');
  const [ingestUrlValue, setIngestUrlValue] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [indexStatus, setIndexStatus] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await getIndexStatus();
      setIndexStatus(s);
    } catch { /* silently ignore — index may not exist yet */ }
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  async function handleIngestText(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await ingestText(text.trim());
      setResult(data);
      setText('');
      refreshStatus();
    } catch (err) {
      setError(err.message || 'Ingest failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleIngestFile(e) {
    e.preventDefault();
    const path = filePath.trim();
    if (!path) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await ingestFile(path);
      setResult(data);
      setFilePath('');
      refreshStatus();
    } catch (err) {
      setError(err.message || 'Ingest failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleClearIndex(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setClearSuccess(false);
    setLoading(true);
    try {
      await clearIndex();
      setClearSuccess(true);
      refreshStatus();
    } catch (err) {
      setError(err.message || 'Clear failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadFile(e) {
    e.preventDefault();
    if (!uploadFile) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await ingestUpload(uploadFile);
      setResult(data);
      setUploadFile(null);
      if (e.target && e.target.reset) {
        e.target.reset();
      }
      refreshStatus();
    } catch (err) {
      setError(err.message || 'Ingest failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleIngestUrl(e) {
    e.preventDefault();
    const url = ingestUrlValue.trim();
    if (!url) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await ingestUrl(url);
      setResult(data);
      setIngestUrlValue('');
      refreshStatus();
    } catch (err) {
      setError(err.message || 'URL ingest failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">

      {/* Index status + Clear index — combined in one section */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-stone-200/80 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-stone-700 mb-1">Index status</h2>
        <p className="text-sm text-stone-500 mb-4">Documents in the RAG index, available for chat. Remove all content with Clear index if you want answers based only on new uploads or pasted text.</p>
        {indexStatus === null ? (
          <p className="text-sm text-stone-400">Loading…</p>
        ) : indexStatus.total_chunks === 0 ? (
          <p className="text-sm text-stone-400 italic">No documents indexed yet. Upload or paste content below.</p>
        ) : (
          <>
            <ul className="space-y-2 mb-3">
              {indexStatus.sources.map((s, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-stone-50 px-4 py-2.5 text-sm">
                  <span className="font-medium text-stone-700">{s.source}</span>
                  <span className="text-stone-400 text-xs">{s.chunks} chunk{s.chunks !== 1 ? 's' : ''}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-stone-400 mb-4">{indexStatus.total_chunks} total chunks across {indexStatus.sources.length} source{indexStatus.sources.length !== 1 ? 's' : ''}</p>
          </>
        )}
        <form onSubmit={handleClearIndex} className="flex items-center gap-3 pt-2 border-t border-stone-200/80">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? 'Clearing…' : 'Clear index'}
          </button>
          {clearSuccess && (
            <span className="text-sm text-emerald-600">Index cleared.</span>
          )}
        </form>
      </div>

      {/* Add content — Upload, URL, Paste merged into one card */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-stone-200/80 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-stone-700 mb-1">Add content</h2>
        <p className="text-sm text-stone-500 mb-5">Upload a file, fetch a URL, or paste text. First upload may take 1–2 minutes while the model loads.</p>

        <div className="space-y-5">
          <form onSubmit={handleUploadFile} className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-stone-600 shrink-0 w-20">Upload</label>
            <input
              type="file"
              accept=".pdf,.docx,.html,.htm"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="text-sm text-stone-700"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !uploadFile}
              className="rounded-xl bg-sage-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Ingesting…' : 'Upload & ingest'}
            </button>
          </form>

          <form onSubmit={handleIngestUrl} className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-stone-600 shrink-0 w-20">URL</label>
            <input
              type="url"
              value={ingestUrlValue}
              onChange={(e) => setIngestUrlValue(e.target.value)}
              placeholder="https://example.com/page.html"
              className="flex-1 min-w-[180px] rounded-xl border border-stone-200 bg-cream-50/50 px-4 py-2.5 text-sm text-stone-700 placeholder-stone-400 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !ingestUrlValue.trim()}
              className="rounded-xl bg-sage-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Ingesting…' : 'Ingest URL'}
            </button>
          </form>

          <form onSubmit={handleIngestText} className="space-y-2">
            <label className="text-sm font-medium text-stone-600 block">Paste text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here..."
              rows={4}
              className="w-full rounded-xl border border-stone-200 bg-cream-50/50 px-4 py-3 text-sm text-stone-700 placeholder-stone-400 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="rounded-xl bg-sage-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Ingesting…' : 'Ingest text'}
            </button>
          </form>
        </div>
      </div>

      {/* Advanced — server file path (collapsible) */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-stone-200/80 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50/80 transition-colors"
        >
          <span className="text-sm font-medium text-stone-600">Advanced</span>
          <span className="text-stone-400">{showAdvanced ? '▼' : '▶'}</span>
        </button>
        {showAdvanced && (
          <div className="px-6 pb-6 pt-0 border-t border-stone-200/80">
            <p className="text-sm text-stone-500 mb-3">Ingest from a full path to a text or XML file on the server.</p>
            <form onSubmit={handleIngestFile} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="C:\...\data\filings\file.xml"
                  className="w-full rounded-xl border border-stone-200 bg-cream-50/50 px-4 py-2.5 text-sm text-stone-700 placeholder-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !filePath.trim()}
                className="rounded-xl bg-stone-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? 'Ingesting…' : 'Ingest file'}
              </button>
            </form>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50/90 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-xl bg-emerald-50/90 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          <strong>Done.</strong> Chunks added: {result.chunks_added}, source: {result.source || 'pasted'}
        </div>
      )}
    </div>
  );
}

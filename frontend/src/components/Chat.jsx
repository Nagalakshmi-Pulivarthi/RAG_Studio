import { useState } from 'react';
import { chat } from '../api';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const q = message.trim();
    if (!q) return;
    setError(null);
    setResponse(null);
    setLoading(true);
    try {
      const data = await chat(q);
      setResponse(data);
      setMessage('');
    } catch (err) {
      setError(err.message || 'Chat failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-700 mb-1">Ask your documents</h2>
        <p className="text-sm text-stone-500">Ask a question; the answer is based on ingested content.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. How many days of annual leave do full-time employees get?"
          className="flex-1 min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-700 placeholder-stone-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-shadow shadow-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors shadow-sm"
        >
          {loading ? 'Asking…' : 'Ask'}
        </button>
      </form>

      {error && (
        <div className="rounded-xl bg-rose-50/90 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {response && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-medium text-stone-500 mb-2">Answer</h3>
            <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{response.answer}</p>
          </div>
          {Array.isArray(response.sources) && response.sources.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-500 mb-2">Sources</h3>
              <ul className="space-y-2">
                {response.sources.map((s, i) => (
                  <li key={i} className="rounded-xl border border-stone-200/80 bg-cream-50/50 px-4 py-3 text-sm">
                    <span className="font-medium text-stone-600">{s?.source ?? 'unknown'}</span>
                    <p className="text-stone-600 mt-1 truncate" title={s?.text}>{s?.text ?? ''}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatStream } from '../api';

const md = {
  h1: ({ children }) => <h1 className="text-lg font-bold text-stone-800 mt-3 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold text-stone-800 mt-3 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-stone-800 mt-2 mb-1">{children}</h3>,
  p:  ({ children }) => <p className="text-stone-700 leading-relaxed mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-stone-700">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-stone-700">{children}</ol>,
  li: ({ children }) => <li className="text-stone-700">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-stone-800">{children}</strong>,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3">
      <table className="text-sm border-collapse w-full">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-stone-100">{children}</thead>,
  th: ({ children }) => <th className="border border-stone-200 px-3 py-1.5 text-left font-medium text-stone-700">{children}</th>,
  td: ({ children }) => <td className="border border-stone-200 px-3 py-1.5 text-stone-600">{children}</td>,
  code: ({ inline, children }) =>
    inline
      ? <code className="bg-stone-100 text-stone-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
      : <pre className="bg-stone-100 text-stone-800 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-2"><code>{children}</code></pre>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-stone-200 pl-4 text-stone-500 italic mb-2">{children}</blockquote>
  ),
};

export default function Chat() {
  const sessionId   = useRef(crypto.randomUUID());
  const bottomRef   = useRef(null);

  const [message, setMessage]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [toolEvents, setToolEvents] = useState([]);
  const [error, setError]           = useState(null);
  const [history, setHistory]       = useState([]);
  const [pendingQ, setPendingQ]     = useState('');

  // Auto-scroll to bottom whenever history or loading state changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    const q = message.trim();
    if (!q) return;

    setPendingQ(q);
    setMessage('');
    setError(null);
    setToolEvents([]);
    setLoading(true);

    let answerText = '';
    let answerSources = [];

    try {
      await chatStream(q, sessionId.current, (event) => {
        if (event.type === 'tool_call') {
          setToolEvents(prev => [...prev, { kind: 'call', query: event.query }]);
        } else if (event.type === 'tool_done') {
          setToolEvents(prev => [...prev, { kind: 'done', found: event.found }]);
        } else if (event.type === 'answer') {
          answerText    = event.content;
          answerSources = event.sources || [];
        } else if (event.type === 'error') {
          setError(event.message);
        }
      });

      if (answerText) {
        setHistory(prev => [...prev, { question: q, answer: answerText, sources: answerSources }]);
      }
    } catch (err) {
      setError(err.message || 'Chat failed');
    } finally {
      setPendingQ('');
      setLoading(false);
    }
  }

  const isEmpty = history.length === 0 && !loading;

  return (
    <div className="flex flex-col flex-1 min-h-0 p-4">

      {/* ── Conversation area (scrollable) ── */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4 min-h-0">

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-2xl font-semibold text-stone-300 mb-2">Ask your documents</p>
            <p className="text-sm text-stone-400">Type a question below. Answers come only from your ingested content.</p>
          </div>
        )}

        {/* Completed Q&A turns */}
        {history.map((item, idx) => (
          <div key={idx} className="space-y-3">
            {/* Question bubble — right-aligned */}
            <div className="flex justify-end">
              <div className="rounded-2xl bg-sky-500 px-4 py-2.5 text-sm text-white max-w-[80%]">
                {item.question}
              </div>
            </div>

            {/* Answer card */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <div className="text-stone-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                  {item.answer}
                </ReactMarkdown>
              </div>
            </div>

            {/* Sources */}
            {item.sources.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Sources</p>
                <ul className="space-y-1.5">
                  {item.sources.map((s, i) => (
                    <li key={i} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs">
                      <span className="font-medium text-stone-600">{s?.source ?? 'unknown'}</span>
                      <p className="text-stone-400 mt-0.5 truncate" title={s?.text}>{s?.text ?? ''}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* In-flight: show question bubble + agent activity */}
        {loading && (
          <div className="space-y-3">
            {pendingQ && (
              <div className="flex justify-end">
                <div className="rounded-2xl bg-sky-500 px-4 py-2.5 text-sm text-white max-w-[80%]">
                  {pendingQ}
                </div>
              </div>
            )}
            <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3">
              <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-2">Agent Activity</p>
              <ul className="space-y-1.5">
                {toolEvents.map((evt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {evt.kind === 'call' ? (
                      <>
                        <span className="text-sky-400 mt-px select-none">↳</span>
                        <span className="text-stone-600">
                          Searching documents for{' '}
                          <span className="font-medium text-stone-700">"{evt.query}"</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-emerald-500 mt-px select-none">✓</span>
                        <span className="text-stone-600">
                          Found <span className="font-medium text-stone-700">{evt.found} chunk{evt.found !== 1 ? 's' : ''}</span>
                        </span>
                      </>
                    )}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-stone-400 mt-1">
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                  Working…
                </li>
              </ul>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50/90 border border-rose-200 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Pinned input bar at the bottom ── */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-stone-100 pt-4 pb-2">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={history.length > 0 ? 'Ask a follow-up question…' : 'e.g. What is the primary purpose of Python?'}
            className="flex-1 min-w-0 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-700 placeholder-stone-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-shadow shadow-sm"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors shadow-sm"
          >
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </form>
      </div>

    </div>
  );
}

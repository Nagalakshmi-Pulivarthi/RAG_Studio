import Ingest from './components/Ingest'
import Chat from './components/Chat'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50/50">
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-sm shadow-sm shrink-0">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-stone-800">RAG Studio</h1>
          <p className="text-sm text-stone-500 mt-1">Turn any document into a conversation. Upload reports, filings, or articles — then ask anything.</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 mx-auto w-full max-w-[1600px] overflow-y-auto lg:overflow-hidden min-h-0">
        {/* Ingest — left, more space */}
        <section className="lg:w-[55%] lg:min-w-0 flex flex-col overflow-y-auto">
          <Ingest />
        </section>

        {/* Divider on large screens */}
        <div className="hidden lg:block w-px bg-stone-200/80 shrink-0" />

        {/* Chat — right, adequate space; min-h when stacked on small screens */}
        <section className="lg:w-[45%] lg:min-w-[400px] min-h-[420px] lg:min-h-0 flex flex-col rounded-2xl border border-stone-200/80 bg-white/90 shadow-sm overflow-hidden">
          <Chat />
        </section>
      </main>
    </div>
  )
}

export default App

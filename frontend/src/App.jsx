import { useState } from 'react'
import Ingest from './components/Ingest'
import Chat from './components/Chat'

function App() {
  const [tab, setTab] = useState('chat')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <h1 className="text-lg font-semibold text-stone-700">RAG</h1>
          <nav className="mt-2 flex gap-6">
            <button
              onClick={() => setTab('chat')}
              className={`text-sm font-medium transition-colors pb-1 border-b-2 -mb-px ${
                tab === 'chat'
                  ? 'text-sky-600 border-sky-500'
                  : 'text-stone-500 border-transparent hover:text-stone-700'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setTab('ingest')}
              className={`text-sm font-medium transition-colors pb-1 border-b-2 -mb-px ${
                tab === 'ingest'
                  ? 'text-sage-500 border-sage-500'
                  : 'text-stone-500 border-transparent hover:text-stone-700'
              }`}
            >
              Ingest
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {tab === 'chat' && <Chat />}
        {tab === 'ingest' && <Ingest />}
      </main>
    </div>
  )
}

export default App

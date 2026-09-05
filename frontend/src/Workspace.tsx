import { AppHeader } from './components/AppHeader'
import { ChatPanel } from './components/ChatPanel'
import { MobileNav } from './components/MobileNav'
import { SourcesPanel } from './components/SourcesPanel'

export function Workspace({ onHome }: { onHome: () => void }) {
  return (
    <div className="app-shell">
      <AppHeader onHome={onHome} />

      <main className="workspace">
        <SourcesPanel />
        <ChatPanel />
      </main>

      <MobileNav />

      <p className="app-footer">
        Vault AI — Private document Q&A assistant, running fully local via Ollama
      </p>
    </div>
  )
}
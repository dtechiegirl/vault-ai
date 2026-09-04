import { AppHeader } from './components/AppHeader'
import { ChatPanel } from './components/ChatPanel'
import { MobileNav } from './components/MobileNav'
import { SourcesPanel } from './components/SourcesPanel'
import { StudioPanel } from './components/StudioPanel'
import { VaultProvider } from './context/VaultContext'

export function Workspace({ onHome }: { onHome: () => void }) {
  return (
    <VaultProvider>
      <div className="app-shell">
        <div className="app-card">
          <AppHeader onHome={onHome} />
          <main className="workspace">
            <SourcesPanel />
            <ChatPanel />
            <StudioPanel />
          </main>
          <MobileNav />
        </div>
        <p className="app-footer">
          Vault AI — Private document Q&A assistant, running fully local via Ollama
        </p>
      </div>
    </VaultProvider>
  )
}

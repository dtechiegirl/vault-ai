import { AppHeader } from './components/AppHeader'
import { ChatPanel } from './components/ChatPanel'
import { MobileNav } from './components/MobileNav'
import { SourcesPanel } from './components/SourcesPanel'
import { StudioPanel } from './components/StudioPanel'
import { VaultProvider } from './context/VaultContext'

export default function App() {
  return (
    <VaultProvider>
      <div className="app-shell">
        <AppHeader />
        <main className="workspace">
          <SourcesPanel />
          <ChatPanel />
          <StudioPanel />
        </main>
        <MobileNav />
      </div>
    </VaultProvider>
  )
}

import { useVault } from '../context/VaultContext'
import { IconVault } from './Icons'

export function AppHeader() {
  const { connection, previewMode } = useVault()

  return (
    <header className="app-header">
      <div className="brand">
        <IconVault />
        <div>
          <p className="brand-name">
            Vault <span>AI</span>
          </p>
          <p className="brand-sub">Private local document intelligence</p>
        </div>
      </div>
      <div className="header-status">
        <span className="offline-pill">
          <span className="pulse" />
          100% Local &amp; Offline
        </span>
        <span className="model-tag">Ollama · Llama 3.2</span>
        {connection === 'checking' ? <span className="api-tag">Checking API</span> : null}
        {connection === 'online' ? <span className="api-tag is-live">API live</span> : null}
        {connection === 'offline' ? <span className="api-tag">API idle</span> : null}
        {previewMode ? <span className="api-tag">Sample vault</span> : null}
      </div>
    </header>
  )
}

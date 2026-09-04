export function AppHeader({ onHome }: { onHome?: () => void }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" />
        <p className="brand-name">Vault AI</p>
      </div>
      <div className="header-tools">
        {onHome ? (
          <button type="button" className="register-link" onClick={onHome}>
            Home
          </button>
        ) : null}
        <span className="offline-pill">100% local</span>
      </div>
    </header>
  )
}

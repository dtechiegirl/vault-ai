import { useVault } from '../context/VaultContext'
import type { MobilePanel } from '../types'

const TABS: Array<{ id: MobilePanel; label: string }> = [
  { id: 'sources', label: 'Documents' },
  { id: 'chat', label: 'Chat' },
]

export function MobileNav() {
  const { mobilePanel, setMobilePanel } = useVault()

  return (
    <nav className="mobile-nav" aria-label="Workspace">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={mobilePanel === tab.id ? 'is-active' : undefined}
          onClick={() => setMobilePanel(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
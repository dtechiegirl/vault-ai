import { useVault } from '../context/VaultContext'
import type { MobilePanel } from '../types'
import { IconChat, IconSources, IconStudio } from './Icons'

const TABS: Array<{ id: MobilePanel; label: string; icon: typeof IconChat }> = [
  { id: 'sources', label: 'Sources', icon: IconSources },
  { id: 'chat', label: 'Q&A', icon: IconChat },
  { id: 'studio', label: 'Studio', icon: IconStudio },
]

export function MobileNav() {
  const { mobilePanel, setMobilePanel } = useVault()

  return (
    <nav className="mobile-nav" aria-label="Workspace">
      {TABS.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            type="button"
            className={mobilePanel === tab.id ? 'is-active' : undefined}
            onClick={() => setMobilePanel(tab.id)}
          >
            <Icon />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

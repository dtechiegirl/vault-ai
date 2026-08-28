import { useVault } from '../context/VaultContext'
import type { StudioAction } from '../types'
import { CitationBar } from './CitationDrawer'
import { IconClose } from './Icons'
import { MarkdownBody } from './MarkdownBody'

const ACTIONS: Array<{ id: StudioAction; title: string }> = [
  { id: 'summary', title: 'Executive summary' },
  { id: 'entities', title: 'Keywords' },
  { id: 'faq', title: 'Auto FAQ' },
]

export function StudioPanel() {
  const { runAction, studioResult, studioLoading, clearStudio, documents, mobilePanel } = useVault()
  const ready = documents.some((doc) => doc.status === 'indexed')

  return (
    <aside className={mobilePanel === 'studio' ? 'panel panel-studio is-active' : 'panel panel-studio'}>
      <p className="eyebrow">Quick actions</p>
      <div className="action-stack">
        {ACTIONS.map((item) => {
          const selected = studioResult?.action === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={selected ? 'action-card is-selected' : 'action-card'}
              disabled={!ready || studioLoading}
              onClick={() => {
                void runAction(item.id)
              }}
            >
              <span className="action-dot" />
              {item.title}
            </button>
          )
        })}
      </div>
      <div className="studio-output">
        {studioLoading ? (
          <div className="studio-pending">
            <div className="typing" aria-label="Running action">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}
        {studioResult && !studioLoading ? (
          <article className="studio-card">
            <header>
              <h3>{studioResult.title}</h3>
              <button type="button" className="ghost-icon" aria-label="Clear result" onClick={clearStudio}>
                <IconClose />
              </button>
            </header>
            <MarkdownBody content={studioResult.content} />
            {studioResult.citations?.length ? <CitationBar citations={studioResult.citations} /> : null}
          </article>
        ) : null}
      </div>
    </aside>
  )
}

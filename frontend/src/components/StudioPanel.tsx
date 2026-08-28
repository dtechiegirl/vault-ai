import { useVault } from '../context/VaultContext'
import type { StudioAction } from '../types'
import { CitationDrawer } from './CitationDrawer'
import { IconCalendar, IconClose, IconFaq, IconSpark } from './Icons'
import { MarkdownBody } from './MarkdownBody'

const ACTIONS: Array<{
  id: StudioAction
  title: string
  copy: string
  icon: typeof IconSpark
}> = [
  {
    id: 'summary',
    title: 'Generate executive summary',
    copy: 'Five-bullet overview of the vault, no prompt required.',
    icon: IconSpark,
  },
  {
    id: 'entities',
    title: 'Extract key entities & dates',
    copy: 'Parties, deadlines, amounts, and named officers.',
    icon: IconCalendar,
  },
  {
    id: 'faq',
    title: 'Auto-generate FAQ',
    copy: 'Frequent diligence questions with source-backed answers.',
    icon: IconFaq,
  },
]

export function StudioPanel() {
  const { runAction, studioResult, studioLoading, clearStudio, documents, mobilePanel } = useVault()
  const ready = documents.some((doc) => doc.status === 'indexed')

  return (
    <aside className={mobilePanel === 'studio' ? 'panel panel-studio is-active' : 'panel panel-studio'}>
      <header className="panel-head">
        <div>
          <p className="eyebrow">Document studio</p>
          <h2>Quick actions</h2>
        </div>
      </header>
      <div className="action-stack">
        {ACTIONS.map((item) => {
          const Icon = item.icon
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
              <span className="action-icon">
                <Icon />
              </span>
              <span>
                <strong>{item.title}</strong>
                <em>{item.copy}</em>
              </span>
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
            <p>Running locally on Ollama…</p>
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
            {studioResult.citations ? <CitationDrawer citations={studioResult.citations} /> : null}
          </article>
        ) : null}
        {!studioResult && !studioLoading ? (
          <p className="studio-placeholder">
            Run a one-click action to draft a summary, pull entities, or build an FAQ from the current vault.
          </p>
        ) : null}
      </div>
    </aside>
  )
}

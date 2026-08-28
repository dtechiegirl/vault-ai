import { useState } from 'react'
import type { Citation } from '../types'
import { IconChevron } from './Icons'

export function CitationDrawer({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false)

  if (!citations.length) return null

  const pages = [...new Set(citations.map((item) => item.page))].join(', ')
  const label =
    citations.length === 1
      ? `1 source · p. ${citations[0].page}`
      : `${citations.length} sources · p. ${pages}`

  return (
    <div className="citation-drawer">
      <button
        type="button"
        className="citation-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="citation-dot" />
        <span>{label}</span>
        <IconChevron className={open ? 'chevron is-open' : 'chevron'} />
      </button>
      {open ? (
        <ul className="citation-list">
          {citations.map((item) => (
            <li key={`${item.source}-${item.page}-${item.snippet.slice(0, 24)}`}>
              <div className="citation-meta">
                <strong>{item.source}</strong>
                <span>Page {item.page}</span>
              </div>
              <p>“{item.snippet}”</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

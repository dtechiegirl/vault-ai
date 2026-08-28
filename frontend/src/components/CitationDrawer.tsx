import { useState } from 'react'
import type { Citation } from '../types'

export function CitationBar({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false)
  const primary = citations[0]
  if (!primary) return null

  return (
    <div className="citation-drawer">
      <button
        type="button"
        className="citation-bar"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {primary.source} · page {primary.page}
      </button>
      {open ? (
        <ul className="citation-list">
          {citations.map((item) => (
            <li key={`${item.source}-${item.page}-${item.snippet.slice(0, 24)}`}>
              <button type="button" className="citation-bar">
                {item.source} · page {item.page}
                <p>“{item.snippet}”</p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

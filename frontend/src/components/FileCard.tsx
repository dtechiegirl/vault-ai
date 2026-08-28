import type { DocumentStatus } from '../types'
import { IconTrash } from './Icons'

export function FileCard({
  filename,
  status,
  error,
  onRemove,
}: {
  filename: string
  status: DocumentStatus
  error?: string
  onRemove: () => void
}) {
  return (
    <article className={`file-card status-${status}`}>
      <span className="file-glyph" />
      <div className="file-copy">
        <h3 title={filename}>{filename}</h3>
        {error ? <p className="file-error">{error}</p> : null}
      </div>
      <button type="button" className="ghost-icon" aria-label={`Remove ${filename}`} onClick={onRemove}>
        <IconTrash />
      </button>
    </article>
  )
}

export function EmptyFileHint() {
  return <p className="file-hint">No documents yet.</p>
}

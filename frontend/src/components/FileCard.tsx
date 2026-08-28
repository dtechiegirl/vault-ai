import type { DocumentStatus, FileKind } from '../types'
import { formatBytes } from '../utils'
import { IconFile, IconTrash } from './Icons'

const STATUS_LABEL: Record<DocumentStatus, string> = {
  uploading: 'Uploading',
  parsing: 'Parsing',
  indexed: 'Indexed',
  empty: 'Empty text',
  error: 'Failed',
}

export function FileCard({
  filename,
  fileType,
  status,
  sizeBytes,
  error,
  onRemove,
}: {
  filename: string
  fileType: FileKind
  status: DocumentStatus
  sizeBytes?: number
  error?: string
  onRemove: () => void
}) {
  return (
    <article className={`file-card status-${status}`}>
      <div className={`file-glyph type-${fileType}`}>{fileType.toUpperCase()}</div>
      <div className="file-copy">
        <h3 title={filename}>{filename}</h3>
        <p>
          <span className={`status-badge status-${status}`}>{STATUS_LABEL[status]}</span>
          {sizeBytes ? <span className="file-size">{formatBytes(sizeBytes)}</span> : null}
        </p>
        {error ? <p className="file-error">{error}</p> : null}
      </div>
      <button type="button" className="ghost-icon" aria-label={`Remove ${filename}`} onClick={onRemove}>
        <IconTrash />
      </button>
    </article>
  )
}

export function EmptyFileHint() {
  return (
    <div className="file-hint">
      <IconFile />
      <p>No sources yet. Drop a text-native PDF, PowerPoint, or TXT file to keep it on this machine.</p>
    </div>
  )
}

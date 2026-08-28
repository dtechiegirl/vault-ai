import { useVault } from '../context/VaultContext'
import { DropZone } from './DropZone'
import { EmptyFileHint, FileCard } from './FileCard'

export function SourcesPanel() {
  const { documents, removeDocument, loadPreview, mobilePanel } = useVault()

  return (
    <aside className={mobilePanel === 'sources' ? 'panel panel-sources is-active' : 'panel panel-sources'}>
      <p className="eyebrow">Documents</p>
      <DropZone />
      <div className="file-list">
        {documents.length === 0 ? <EmptyFileHint /> : null}
        {documents.map((doc) => (
          <FileCard
            key={doc.id}
            filename={doc.filename}
            status={doc.status}
            error={doc.error}
            onRemove={() => {
              void removeDocument(doc.id)
            }}
          />
        ))}
      </div>
      {documents.length === 0 ? (
        <footer className="panel-foot">
          <button type="button" className="text-link" onClick={loadPreview}>
            Load sample documents
          </button>
        </footer>
      ) : null}
    </aside>
  )
}

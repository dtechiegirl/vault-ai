import { useVault } from '../context/VaultContext'
import { DropZone } from './DropZone'
import { EmptyFileHint, FileCard } from './FileCard'

export function SourcesPanel() {
  const { documents, removeDocument, loadPreview, previewMode, mobilePanel } = useVault()
  const indexed = documents.filter((doc) => doc.status === 'indexed').length

  return (
    <aside className={mobilePanel === 'sources' ? 'panel panel-sources is-active' : 'panel panel-sources'}>
      <header className="panel-head">
        <div>
          <p className="eyebrow">Sources</p>
          <h2>Document hub</h2>
        </div>
        <span className="count-chip">{indexed} indexed</span>
      </header>
      <DropZone />
      <div className="file-list">
        {documents.length === 0 ? <EmptyFileHint /> : null}
        {documents.map((doc) => (
          <FileCard
            key={doc.id}
            filename={doc.filename}
            fileType={doc.fileType}
            status={doc.status}
            sizeBytes={doc.sizeBytes}
            error={doc.error}
            onRemove={() => {
              void removeDocument(doc.id)
            }}
          />
        ))}
      </div>
      <footer className="panel-foot">
        {previewMode ? (
          <p className="foot-note">Sample workspace is loaded for interface preview. Uploading a file switches to your vault.</p>
        ) : (
          <button type="button" className="text-link" onClick={loadPreview}>
            Load sample workspace
          </button>
        )}
      </footer>
    </aside>
  )
}

import { useState } from 'react'
import { useVault } from '../context/VaultContext'
import type { StudioAction } from '../types'

const ACTIONS: Array<{ id: StudioAction; title: string }> = [
  { id: 'summary', title: 'Executive summary' },
  { id: 'entities', title: 'Keywords' },
  { id: 'faq', title: 'Auto FAQ' },
]

export function QuickActions({ onOpen }: { onOpen: () => void }) {
  const {
    documents,
    selectedDocumentIds,
    runAction,
    studioLoading,
  } = useVault()

  const [activeAction, setActiveAction] = useState<StudioAction | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedDocumentIds)

  const indexedDocuments = documents.filter(
    (doc) => doc.status === 'indexed',
  )

  const ready = indexedDocuments.length > 0

  function toggleDocument(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    )
  }

  function openAction(action: StudioAction) {
    setActiveAction(action)
    setSelectedIds(
      selectedDocumentIds.filter((id) =>
        indexedDocuments.some((doc) => doc.id === id),
      ),
    )
  }

  async function generate() {
    if (!activeAction || !selectedIds.length || studioLoading) return

    await runAction(activeAction, selectedIds)
    onOpen()
  }

  return (
    <section className="quick-actions">
      <div className="quick-actions-header">
        <p className="eyebrow">Quick actions</p>

        <p className="quick-actions-description">
          Get useful information from your indexed documents without writing a
          query.
        </p>
      </div>

      <div className="action-stack">
        {ACTIONS.map((item) => {
          const selected = activeAction === item.id

          return (
            <button
              key={item.id}
              type="button"
              className={selected ? 'action-card is-selected' : 'action-card'}
              disabled={!ready || studioLoading}
              onClick={() => openAction(item.id)}
            >
              <span className="action-dot" />

              <span>{item.title}</span>
            </button>
          )
        })}
      </div>

      {activeAction ? (
        <div className="action-document-picker">
          <div className="action-picker-header">
            <div>
              <p className="eyebrow">Choose documents</p>
              <p>
                Select one or more indexed documents for this action.
              </p>
            </div>

            <button
              type="button"
              className="text-link"
              onClick={() => setActiveAction(null)}
              disabled={studioLoading}
            >
              Cancel
            </button>
          </div>

          <div className="action-document-list">
            {indexedDocuments.map((doc) => {
              const checked = selectedIds.includes(doc.id)

              return (
                <label
                  key={doc.id}
                  className={
                    checked
                      ? 'action-document is-selected'
                      : 'action-document'
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDocument(doc.id)}
                    disabled={studioLoading}
                  />

                  <span className="action-document-info">
                    <strong>{doc.filename}</strong>
                    <small>{doc.fileType.toUpperCase()}</small>
                  </span>
                </label>
              )
            })}
          </div>

          <button
            type="button"
            className="hero-cta action-generate"
            disabled={!selectedIds.length || studioLoading}
            onClick={() => {
              void generate()
            }}
          >
            {studioLoading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      ) : null}
    </section>
  )
}
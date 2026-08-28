import { useEffect, useRef, useState } from 'react'
import { useVault } from '../context/VaultContext'
import { formatClock } from '../utils'
import { CitationDrawer } from './CitationDrawer'
import { IconSend } from './Icons'
import { MarkdownBody } from './MarkdownBody'

export function ChatPanel() {
  const { messages, sendQuery, prompts, documents, previewMode, mobilePanel } = useVault()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const ready = documents.some((doc) => doc.status === 'indexed')

  useEffect(() => {
    const node = listRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages])

  async function submit() {
    const value = draft.trim()
    if (!value) return
    setDraft('')
    await sendQuery(value)
  }

  return (
    <section className={mobilePanel === 'chat' ? 'panel panel-chat is-active' : 'panel panel-chat'}>
      <header className="panel-head">
        <div>
          <p className="eyebrow">Verification stream</p>
          <h2>Ask the vault</h2>
        </div>
        {previewMode ? <span className="preview-chip">Sample answers</span> : null}
      </header>
      <div className="thread" ref={listRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <h3>Grounded answers. Page-level proof.</h3>
            <p>
              Questions are answered only from indexed files. If the fact is missing, Vault AI will say so rather
              than invent it.
            </p>
            <div className="prompt-row">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="prompt-chip"
                  disabled={!ready}
                  onClick={() => {
                    void sendQuery(prompt)
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={`bubble role-${message.role}`}>
              <div className="bubble-meta">
                <span>{message.role === 'user' ? 'You' : 'Vault AI'}</span>
                <time>{formatClock(message.createdAt)}</time>
              </div>
              {message.pending ? (
                <div className="typing" aria-label="Generating">
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <div className={message.error ? 'bubble-error' : undefined}>
                  <MarkdownBody content={message.content} />
                </div>
              )}
              {message.citations ? <CitationDrawer citations={message.citations} /> : null}
            </article>
          ))
        )}
      </div>
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <label className="sr-only" htmlFor="vault-query">
          Ask a question
        </label>
        <textarea
          id="vault-query"
          rows={2}
          value={draft}
          placeholder={ready ? 'Ask about the indexed documents…' : 'Add a source to begin…'}
          disabled={!ready}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void submit()
            }
          }}
        />
        <button type="submit" className="send-btn" disabled={!ready || !draft.trim()} aria-label="Send">
          <IconSend />
        </button>
      </form>
    </section>
  )
}

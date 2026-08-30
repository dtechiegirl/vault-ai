import { useEffect, useRef, useState } from 'react'
import { useVault } from '../context/VaultContext'
import { CitationBar } from './CitationDrawer'
import { MarkdownBody } from './MarkdownBody'

export function ChatPanel() {
  const { messages, sendQuery, prompts, documents, mobilePanel } = useVault()
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
      <div className="thread" ref={listRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Ask a question about your documents.</p>
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
            <article key={message.id} className={`turn role-${message.role}`}>
              <div className="bubble">
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
              </div>
              {message.citations?.length ? <CitationBar citations={message.citations} /> : null}
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
          Ask a question about your documents
        </label>
        <input
          id="vault-query"
          value={draft}
          placeholder="Ask a question about your documents"
          disabled={!ready}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!ready || !draft.trim()}>
          Send
        </button>
      </form>
    </section>
  )
}

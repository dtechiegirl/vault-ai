import { useRef, useState } from 'react'
import { useVault } from '../context/VaultContext'
import { IconUpload } from './Icons'

export function DropZone() {
  const { ingestFiles } = useVault()
  const inputRef = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState(false)

  function handleFiles(list: FileList | null) {
    if (!list?.length) return
    void ingestFiles(list)
  }

  return (
    <div
      className={active ? 'dropzone is-active' : 'dropzone'}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        setActive(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setActive(true)
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault()
        setActive(false)
        handleFiles(event.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".pdf,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
        multiple
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.currentTarget.value = ''
        }}
      />
      <IconUpload />
      <p>Drop your PDFs here</p>
    </div>
  )
}

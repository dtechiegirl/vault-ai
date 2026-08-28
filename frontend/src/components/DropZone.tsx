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
        onChange={(event) => {
          handleFiles(event.target.files)
          event.currentTarget.value = ''
        }}
      />
      <IconUpload />
      <p>
        <button type="button" className="text-link" onClick={() => inputRef.current?.click()}>
          Choose files
        </button>{' '}
        or drop PDF, PPTX, TXT
      </p>
      <span>Parsed and indexed locally. Scanned images are not supported.</span>
    </div>
  )
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  askQuestion,
  checkHealth,
  deleteDocument,
  listDocuments,
  runStudioAction,
  uploadDocument,
} from '../api/client'
import {
  PREVIEW_PROMPTS,
  previewAnswer,
  previewStudio,
  SAMPLE_DOCUMENTS,
} from '../data/sampleWorkspace'
import type {
  ChatMessage,
  ConnectionState,
  MobilePanel,
  StudioAction,
  StudioResult,
  VaultDocument,
} from '../types'
import { fileKindFromName, isAllowedFile, uid } from '../utils'

type VaultContextValue = {
  documents: VaultDocument[]
  messages: ChatMessage[]
  studioResult: StudioResult | null
  studioLoading: boolean
  connection: ConnectionState
  previewMode: boolean
  mobilePanel: MobilePanel
  setMobilePanel: (panel: MobilePanel) => void
  ingestFiles: (files: FileList | File[]) => Promise<void>
  removeDocument: (id: string) => Promise<void>
  sendQuery: (query: string) => Promise<void>
  runAction: (action: StudioAction) => Promise<void>
  loadPreview: () => void
  clearStudio: () => void
  prompts: string[]
}

const VaultContext = createContext<VaultContextValue | null>(null)

const ACTION_TITLES: Record<StudioAction, string> = {
  summary: 'Executive summary',
  entities: 'Key entities & dates',
  faq: 'Auto-generated FAQ',
}

function liveIds(documents: VaultDocument[]): string[] {
  return documents.filter((doc) => doc.status === 'indexed').map((doc) => doc.id)
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<VaultDocument[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [studioResult, setStudioResult] = useState<StudioResult | null>(null)
  const [studioLoading, setStudioLoading] = useState(false)
  const [connection, setConnection] = useState<ConnectionState>('checking')
  const [previewMode, setPreviewMode] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('chat')

  useEffect(() => {
    let cancelled = false

    async function boot() {
      const healthy = await checkHealth()
      if (cancelled) return
      setConnection(healthy ? 'online' : 'offline')
      if (!healthy) return
      try {
        const remote = await listDocuments()
        if (!cancelled && remote.length) {
          setDocuments(remote)
        }
      } catch {
        return
      }
    }

    void boot()
    const timer = window.setInterval(async () => {
      const healthy = await checkHealth()
      if (!cancelled) setConnection(healthy ? 'online' : 'offline')
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const ingestFiles = useCallback(
    async (files: FileList | File[]) => {
      const incoming = Array.from(files)
      for (const file of incoming) {
        if (!isAllowedFile(file)) {
          setDocuments((current) => [
            ...current,
            {
              id: uid(),
              filename: file.name,
              fileType: 'txt',
              status: 'error',
              sizeBytes: file.size,
              createdAt: new Date().toISOString(),
              error: 'Unsupported format. Use PDF, PPTX, or TXT.',
            },
          ])
          continue
        }

        const kind = fileKindFromName(file.name) ?? 'txt'
        const localId = uid()
        setPreviewMode(false)
        setDocuments((current) => [
          ...current,
          {
            id: localId,
            filename: file.name,
            fileType: kind,
            status: 'uploading',
            sizeBytes: file.size,
            createdAt: new Date().toISOString(),
          },
        ])

        try {
          setDocuments((current) =>
            current.map((doc) =>
              doc.id === localId ? { ...doc, status: 'parsing' } : doc,
            ),
          )
          const saved = await uploadDocument(file)
          setDocuments((current) =>
            current.map((doc) =>
              doc.id === localId
                ? { ...saved, sizeBytes: file.size, status: 'indexed' }
                : doc,
            ),
          )
        } catch {
          setDocuments((current) =>
            current.map((doc) =>
              doc.id === localId
                ? {
                    ...doc,
                    status: connection === 'online' ? 'error' : 'indexed',
                    error:
                      connection === 'online'
                        ? 'Upload failed on the local API.'
                        : undefined,
                  }
                : doc,
            ),
          )
        }
      }
    },
    [connection],
  )

  const removeDocument = useCallback(
    async (id: string) => {
      setDocuments((current) => current.filter((doc) => doc.id !== id))
      if (connection === 'online' && !previewMode) {
        try {
          await deleteDocument(id)
        } catch {
          return
        }
      }
    },
    [connection, previewMode],
  )

  const sendQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) return

      const userMessage: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      }
      const pendingId = uid()
      setMessages((current) => [
        ...current,
        userMessage,
        {
          id: pendingId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ])

      const indexed = documents.filter((doc) => doc.status === 'indexed')
      if (!indexed.length) {
        setMessages((current) =>
          current.map((message) =>
            message.id === pendingId
              ? {
                  ...message,
                  pending: false,
                  content:
                    'No indexed documents are available. Upload a PDF, PPTX, or TXT file, or load the sample workspace.',
                }
              : message,
          ),
        )
        return
      }

      if (!previewMode && connection !== 'online') {
        setMessages((current) =>
          current.map((message) =>
            message.id === pendingId
              ? {
                  ...message,
                  pending: false,
                  error: true,
                  content:
                    'The local API is offline. Start FastAPI on port 8000, or load the sample workspace to preview grounded answers and citations.',
                }
              : message,
          ),
        )
        return
      }

      try {
        const result = previewMode
          ? previewAnswer(trimmed)
          : await askQuestion(trimmed, liveIds(documents))

          setMessages((current) =>
            current.map((message) =>
              message.id === pendingId
                ? {
                    ...message,
                    pending: false,
                    content: result.answer || 'Not found in provided documents',
                    citations: result.citations,
                  }
                : message,
            ),
          )
        } catch {
          setMessages((current) =>
            current.map((message) =>
              message.id === pendingId
                ? {
                    ...message,
                    pending: false,
                    error: true,
                    content:
                      'The local model did not respond. Confirm Ollama is running on localhost:11434 and that the FastAPI /chat endpoint is available.',
                  }
                : message,
            ),
          )
        }
    },
    [connection, documents, previewMode],
  )

  const runAction = useCallback(
    async (action: StudioAction) => {
      const indexed = documents.filter((doc) => doc.status === 'indexed')
      if (!indexed.length) {
        setStudioResult({
          action,
          title: ACTION_TITLES[action],
          content:
            'Index at least one document before running studio actions.',
        })
        return
      }

      if (!previewMode && connection !== 'online') {
        setStudioResult({
          action,
          title: ACTION_TITLES[action],
          content:
            'The local API is offline. Start FastAPI on port 8000, or load the sample workspace to preview studio actions.',
        })
        return
      }

      setStudioLoading(true)
      setStudioResult(null)
      try {
        const payload = previewMode
          ? previewStudio(action)
          : await runStudioAction(action, liveIds(documents))

        setStudioResult({
          action,
          title: ACTION_TITLES[action],
          content: payload.content,
          citations: payload.citations,
        })
      } catch {
        setStudioResult({
          action,
          title: ACTION_TITLES[action],
          content:
            'Studio endpoint is not available on the local API yet. Load the sample workspace to preview this panel, or expose /summary, /entities, and /faq on FastAPI.',
        })
      } finally {
        setStudioLoading(false)
      }
    },
    [connection, documents, previewMode],
  )

  const loadPreview = useCallback(() => {
    setPreviewMode(true)
    setDocuments(SAMPLE_DOCUMENTS)
    setMessages([])
    setStudioResult(null)
    setMobilePanel('chat')
  }, [])

  const clearStudio = useCallback(() => setStudioResult(null), [])

  const value = useMemo<VaultContextValue>(
    () => ({
      documents,
      messages,
      studioResult,
      studioLoading,
      connection,
      previewMode,
      mobilePanel,
      setMobilePanel,
      ingestFiles,
      removeDocument,
      sendQuery,
      runAction,
      loadPreview,
      clearStudio,
      prompts: PREVIEW_PROMPTS,
    }),
    [
      documents,
      messages,
      studioResult,
      studioLoading,
      connection,
      previewMode,
      mobilePanel,
      ingestFiles,
      removeDocument,
      sendQuery,
      runAction,
      loadPreview,
      clearStudio,
    ],
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault(): VaultContextValue {
  const value = useContext(VaultContext)
  if (!value) {
    throw new Error('useVault must be used within VaultProvider')
  }
  return value
}

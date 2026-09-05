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
  SAMPLE_THREAD,
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
  selectedDocumentIds: string[]
  messages: ChatMessage[]
  studioResult: StudioResult | null
  studioLoading: boolean
  connection: ConnectionState
  previewMode: boolean
  mobilePanel: MobilePanel
  setMobilePanel: (panel: MobilePanel) => void
  toggleDocumentSelection: (id: string) => void
  ingestFiles: (files: FileList | File[]) => Promise<void>
  removeDocument: (id: string) => Promise<void>
  sendQuery: (query: string) => Promise<void>
  runAction: (action: StudioAction, documentIds: string[]) => Promise<void>
  loadPreview: () => void
  clearStudio: () => void
  prompts: string[]
}

const VaultContext = createContext<VaultContextValue | null>(null)

const ACTION_TITLES: Record<StudioAction, string> = {
  summary: 'Executive summary',
  entities: 'Keywords',
  faq: 'Auto FAQ',
}

function liveIds(documents: VaultDocument[]): string[] {
  return documents.filter((doc) => doc.status === 'indexed').map((doc) => doc.id)
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<VaultDocument[]>(SAMPLE_DOCUMENTS)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_THREAD)
  const [studioResult, setStudioResult] = useState<StudioResult | null>(null)
  const [studioLoading, setStudioLoading] = useState(false)
  const [connection, setConnection] = useState<ConnectionState>('checking')
  const [previewMode, setPreviewMode] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('chat')

  useEffect(() => {
    let cancelled = false

    async function boot() {
      const healthy = await checkHealth()
      if (cancelled) return
      setConnection(healthy ? 'online' : 'offline')
      if (!healthy) return
      setPreviewMode(false)
      try {
        const remote = await listDocuments()
        if (cancelled) return
        setDocuments(remote)
        setMessages([])
      } catch {
        if (!cancelled) {
          setDocuments([])
          setMessages([])
        }
      }
    }

    void boot()
    const timer = window.setInterval(async () => {
      const healthy = await checkHealth()
      if (cancelled) return
      setConnection(healthy ? 'online' : 'offline')
      if (healthy) setPreviewMode(false)
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const toggleDocumentSelection = useCallback((id: string) => {
    setSelectedDocumentIds((current) =>
      current.includes(id)
        ? current.filter((documentId) => documentId !== id)
        : [...current, id],
    )
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
        setMessages([])
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
    [connection, previewMode],
  )

  const removeDocument = useCallback(
    async (id: string) => {
      setDocuments((current) => current.filter((doc) => doc.id !== id))
      setSelectedDocumentIds((current) =>
            current.filter((documentId) => documentId !== id),
            )
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

      if (connection !== 'online' && !previewMode) {
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
        const result =
          connection === 'online'
            ? await askQuestion(
                trimmed,
                selectedDocumentIds.length > 0
                  ? selectedDocumentIds
                  : liveIds(documents),
                messages
                  .filter(
                    (message) =>
                      (message.role === 'user' || message.role === 'assistant') &&
                      !message.pending &&
                      !message.error,
                  )
                  .map((message) => ({
                    role: message.role,
                    content: message.content,
                  })),
              )
            : previewAnswer(trimmed)

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
    [connection, documents, messages, previewMode, selectedDocumentIds],
  )

  const runAction = useCallback(
    async (action: StudioAction, documentIds: string[]) => {
      const indexed = documents.filter((doc) => doc.status === 'indexed')

      const selectedIds = documentIds.filter((id) =>
        indexed.some((doc) => doc.id === id),
      )

      if (!selectedIds.length) {
       setStudioResult({
          action,
          title: ACTION_TITLES[action],
          content:
            'Select at least one indexed document before running this action.',
        })
        return
      }

      if (connection !== 'online' && !previewMode) {
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
        const payload =
          connection === 'online'
            ? await runStudioAction(action, selectedIds)
            : previewStudio(action)

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
    setMessages(SAMPLE_THREAD)
    setStudioResult(null)
    setMobilePanel('chat')
  }, [])

  const clearStudio = useCallback(() => setStudioResult(null), [])

  const value = useMemo<VaultContextValue>(
    () => ({
      documents,
      selectedDocumentIds,
      messages,
      studioResult,
      studioLoading,
      connection,
      previewMode,
      mobilePanel,
      setMobilePanel,
      toggleDocumentSelection,
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
      selectedDocumentIds,
      messages,
      studioResult,
      studioLoading,
      connection,
      previewMode,
      mobilePanel,
      toggleDocumentSelection,
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

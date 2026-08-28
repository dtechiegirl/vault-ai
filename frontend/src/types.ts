export type FileKind = 'pdf' | 'pptx' | 'txt'

export type DocumentStatus = 'uploading' | 'parsing' | 'indexed' | 'empty' | 'error'

export type ConnectionState = 'checking' | 'online' | 'offline'

export type StudioAction = 'summary' | 'entities' | 'faq'

export type MobilePanel = 'sources' | 'chat' | 'studio'

export type VaultDocument = {
  id: string
  filename: string
  fileType: FileKind
  status: DocumentStatus
  sizeBytes?: number
  createdAt: string
  error?: string
}

export type Citation = {
  source: string
  page: number
  snippet: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  createdAt: string
  pending?: boolean
  error?: boolean
}

export type StudioResult = {
  action: StudioAction
  title: string
  content: string
  citations?: Citation[]
}

export type ChatPayload = {
  answer: string
  citations: Citation[]
}

export type StudioPayload = {
  content: string
  citations?: Citation[]
}

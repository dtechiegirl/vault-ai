import type {
  ChatPayload,
  Citation,
  FileKind,
  StudioAction,
  StudioPayload,
  VaultDocument,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

type DocumentResponse = {
  id: string
  filename: string
  file_type: string
  status: string
  created_at: string
  storage_path?: string
}

type ChatResponse = {
  answer: string
  citations: Citation[]
}

type StudioResponse = {
  content: string
  citations?: Citation[]
}

const STUDIO_PATHS: Record<StudioAction, string> = {
  summary: '/summary',
  entities: '/entities',
  faq: '/faq',
}

function asFileKind(value: string): FileKind {
  const normalized = value.replace('.', '').toLowerCase()
  if (normalized === 'pdf' || normalized === 'pptx' || normalized === 'txt') {
    return normalized
  }
  return 'txt'
}

function mapStatus(value: string): VaultDocument['status'] {
  if (value === 'indexed' || value === 'ready' || value === 'parsed') return 'indexed'
  if (value === 'parsing' || value === 'processing') return 'parsing'
  if (value === 'empty' || value === 'empty_text') return 'empty'
  if (value === 'error' || value === 'failed') return 'error'
  if (value === 'uploading') return 'uploading'
  return 'indexed'
}

function mapDocument(record: DocumentResponse): VaultDocument {
  return {
    id: record.id,
    filename: record.filename,
    fileType: asFileKind(record.file_type),
    status: mapStatus(record.status),
    createdAt: record.created_at,
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; message?: string }
    if (typeof body.detail === 'string') return body.detail
    if (typeof body.message === 'string') return body.message
  } catch {
    return response.statusText || 'Request failed'
  }
  return response.statusText || 'Request failed'
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}

export async function uploadDocument(file: File): Promise<VaultDocument> {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const payload = (await response.json()) as DocumentResponse
  return mapDocument(payload)
}

export async function listDocuments(): Promise<VaultDocument[]> {
  const response = await fetch(`${API_BASE}/documents`)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  const payload = (await response.json()) as DocumentResponse[]
  return payload.map(mapDocument)
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) {
    throw new Error(await parseError(response))
  }
}

export async function askQuestion(
  query: string,
  documentIds: string[],
): Promise<ChatPayload> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      document_ids: documentIds,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const payload = (await response.json()) as ChatResponse
  if (typeof payload.answer !== 'string' || !Array.isArray(payload.citations)) {
    throw new Error('Unexpected /chat response shape.')
  }

  return {
    answer: payload.answer,
    citations: payload.citations,
  }
}

export async function runStudioAction(
  action: StudioAction,
  documentIds: string[],
): Promise<StudioPayload> {
  const response = await fetch(`${API_BASE}${STUDIO_PATHS[action]}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_ids: documentIds,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const payload = (await response.json()) as StudioResponse
  if (typeof payload.content !== 'string') {
    throw new Error(`Unexpected ${STUDIO_PATHS[action]} response shape.`)
  }

  return {
    content: payload.content,
    citations: payload.citations,
  }
}

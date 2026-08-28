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
  answer?: string
  content?: string
  citations?: Citation[]
  sources?: Citation[]
}

type StudioResponse = {
  content?: string
  summary?: string
  bullets?: string[]
  markdown?: string
  citations?: Citation[]
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
  const payload = (await response.json()) as DocumentResponse[] | { documents?: DocumentResponse[] }
  const records = Array.isArray(payload) ? payload : (payload.documents ?? [])
  return records.map(mapDocument)
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
      question: query,
      document_ids: documentIds,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const payload = (await response.json()) as ChatResponse
  return {
    answer: payload.answer ?? payload.content ?? '',
    citations: payload.citations ?? payload.sources ?? [],
  }
}

const STUDIO_PATHS: Record<StudioAction, string[]> = {
  summary: ['/summary', '/studio/summary'],
  entities: ['/entities', '/extract', '/studio/entities'],
  faq: ['/faq', '/studio/faq'],
}

export async function runStudioAction(
  action: StudioAction,
  documentIds: string[],
): Promise<StudioPayload> {
  const body = JSON.stringify({
    document_ids: documentIds,
    action,
  })

  let lastError = 'Studio action failed'

  for (const path of STUDIO_PATHS[action]) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (response.status === 404) {
        continue
      }

      if (!response.ok) {
        lastError = await parseError(response)
        continue
      }

      const payload = (await response.json()) as StudioResponse
      const fromBullets = payload.bullets?.map((item) => `- ${item}`).join('\n')
      return {
        content:
          payload.content ??
          payload.markdown ??
          payload.summary ??
          fromBullets ??
          '',
        citations: payload.citations,
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
    }
  }

  throw new Error(lastError)
}

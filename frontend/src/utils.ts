import type { FileKind } from './types'

const ALLOWED = new Set(['pdf', 'pptx', 'txt'])

export function fileKindFromName(name: string): FileKind | null {
  const extension = name.split('.').pop()?.toLowerCase()
  if (extension === 'pdf' || extension === 'pptx' || extension === 'txt') {
    return extension
  }
  return null
}

export function isAllowedFile(file: File): boolean {
  return fileKindFromName(file.name) !== null
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function uid(): string {
  return crypto.randomUUID()
}

export { ALLOWED }

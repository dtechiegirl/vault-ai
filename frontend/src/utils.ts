import type { FileKind } from './types'

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

export function uid(): string {
  return crypto.randomUUID()
}

const STORAGE_KEY = 'protoc3-manual-doc-attachments'
const USED_LIBRARY_KEY = 'protoc3-used-library-ids'

export type ManualDocAttachment = {
  docKey: string
  imageSrc: string
  libraryId?: string
  label: string
}

export function readManualDocAttachments(): Record<string, ManualDocAttachment> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, ManualDocAttachment>
  } catch {
    return {}
  }
}

export function writeManualDocAttachment(attachment: ManualDocAttachment): Record<string, ManualDocAttachment> {
  const next = { ...readManualDocAttachments(), [attachment.docKey]: attachment }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function clearManualDocAttachments(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function readUsedLibraryIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(USED_LIBRARY_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function writeUsedLibraryId(id: string): Set<string> {
  const next = new Set(readUsedLibraryIds())
  next.add(id)
  try {
    sessionStorage.setItem(USED_LIBRARY_KEY, JSON.stringify([...next]))
  } catch {
    /* ignore */
  }
  return next
}

/** Unified annotation kinds — notes vs follow-up flags at increasing severity. */
export type AnnotationType = 'note' | 'flag' | 'critical' | 'blocking'

export const ANNOTATION_TYPE_OPTIONS: { value: AnnotationType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'flag', label: 'Flag' },
  { value: 'critical', label: 'Critical' },
  { value: 'blocking', label: 'Blocking flag' },
]

export function formatAnnotationNote(type: AnnotationType, text: string): string {
  const trimmed = text.trim()
  if (type === 'note') return trimmed
  const prefix =
    type === 'flag' ? '[Flag]' : type === 'critical' ? '[Critical]' : '[Blocking]'
  return trimmed ? `${prefix} ${trimmed}` : prefix
}

export function parseAnnotationType(note: string, isFlagged = false): AnnotationType {
  if (note.startsWith('[Blocking]')) return 'blocking'
  if (note.startsWith('[Critical]')) return 'critical'
  if (isFlagged || note.startsWith('[Flag]')) return 'flag'
  return 'note'
}

export function stripAnnotationPrefix(note: string): string {
  return note.replace(/^\[(Flag|Critical|Blocking)\]\s?/, '')
}

export function annotationTypeLabel(type: AnnotationType): string {
  return ANNOTATION_TYPE_OPTIONS.find(o => o.value === type)?.label ?? 'Note'
}

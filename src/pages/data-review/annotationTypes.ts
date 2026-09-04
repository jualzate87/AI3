/** Unified annotation kinds - notes and flags at increasing severity. */
export type AnnotationType = 'note' | 'flag' | 'efile-critical'

export const ANNOTATION_TYPE_OPTIONS: { value: AnnotationType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'flag', label: 'Flag' },
  { value: 'efile-critical', label: 'E-file critical flag' },
]

/** @deprecated use ANNOTATION_TYPE_OPTIONS */
export const ANNOTATION_NOTE_TYPE_OPTIONS = ANNOTATION_TYPE_OPTIONS.filter(o => o.value === 'note')
export const ANNOTATION_FLAG_TYPE_OPTIONS = ANNOTATION_TYPE_OPTIONS.filter(o => o.value !== 'note')

export function getAnnotationTypeOptions(_allowFlagTypes = true): { value: AnnotationType; label: string }[] {
  return ANNOTATION_TYPE_OPTIONS
}

export function isNoteLikeAnnotation(type: AnnotationType): boolean {
  return type === 'note'
}

export function isFlagLikeAnnotation(type: AnnotationType): boolean {
  return type === 'flag' || type === 'efile-critical'
}

const ANNOTATION_PREFIX: Partial<Record<AnnotationType, string>> = {
  flag: '[Flag]',
  'efile-critical': '[E-file critical]',
}

export function formatAnnotationNote(type: AnnotationType, text: string): string {
  const trimmed = text.trim()
  if (type === 'note') return trimmed
  const prefix = ANNOTATION_PREFIX[type] ?? '[Note]'
  return trimmed ? `${prefix} ${trimmed}` : prefix
}

export function parseAnnotationType(note: string, isFlagged = false): AnnotationType {
  if (note.startsWith('[E-file critical]') || note.startsWith('[Blocking]') || note.startsWith('[Critical]')) {
    return 'efile-critical'
  }
  if (isFlagged || note.startsWith('[Flag]')) return 'flag'
  return 'note'
}

export function stripAnnotationPrefix(note: string): string {
  return note.replace(/^\[(Flag|E-file critical|Blocking|Critical)\]\s?/, '')
}

export function annotationTypeLabel(type: AnnotationType): string {
  return ANNOTATION_TYPE_OPTIONS.find(o => o.value === type)?.label ?? 'Note'
}


export function annotationTypeDotColor(type: AnnotationType): string {
  switch (type) {
    case 'note':
      return 'var(--color-action-standard)'
    case 'flag':
      return 'var(--color-data-attention)'
    case 'efile-critical':
      return 'var(--color-action-negative)'
    default:
      return 'var(--color-action-standard)'
  }
}

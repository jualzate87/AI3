/** Unified annotation kinds — notes vs follow-up flags at increasing severity. */
export type AnnotationType =
  | 'note'
  | 'question'
  | 'follow-up'
  | 'client-question'
  | 'flag'
  | 'critical'
  | 'blocking'

export const ANNOTATION_NOTE_TYPE_OPTIONS: { value: AnnotationType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'question', label: 'Question for reviewer' },
  { value: 'follow-up', label: 'Follow-up needed' },
  { value: 'client-question', label: 'Client question' },
]

export const ANNOTATION_FLAG_TYPE_OPTIONS: { value: AnnotationType; label: string }[] = [
  { value: 'flag', label: 'Flag' },
  { value: 'critical', label: 'Critical' },
  { value: 'blocking', label: 'Blocking flag' },
]

/** @deprecated use getAnnotationTypeOptions */
export const ANNOTATION_TYPE_OPTIONS = [
  ...ANNOTATION_NOTE_TYPE_OPTIONS,
  ...ANNOTATION_FLAG_TYPE_OPTIONS,
]

export function getAnnotationTypeOptions(allowFlagTypes: boolean): { value: AnnotationType; label: string }[] {
  return allowFlagTypes
    ? [...ANNOTATION_NOTE_TYPE_OPTIONS, ...ANNOTATION_FLAG_TYPE_OPTIONS]
    : [...ANNOTATION_NOTE_TYPE_OPTIONS]
}

export function isNoteLikeAnnotation(type: AnnotationType): boolean {
  return type === 'note' || type === 'question' || type === 'follow-up' || type === 'client-question'
}

export function isFlagLikeAnnotation(type: AnnotationType): boolean {
  return !isNoteLikeAnnotation(type)
}

const ANNOTATION_PREFIX: Partial<Record<AnnotationType, string>> = {
  question: '[Question]',
  'follow-up': '[Follow-up]',
  'client-question': '[Client]',
  flag: '[Flag]',
  critical: '[Critical]',
  blocking: '[Blocking]',
}

export function formatAnnotationNote(type: AnnotationType, text: string): string {
  const trimmed = text.trim()
  if (type === 'note') return trimmed
  const prefix = ANNOTATION_PREFIX[type] ?? '[Note]'
  return trimmed ? `${prefix} ${trimmed}` : prefix
}

export function parseAnnotationType(note: string, isFlagged = false): AnnotationType {
  if (note.startsWith('[Blocking]')) return 'blocking'
  if (note.startsWith('[Critical]')) return 'critical'
  if (note.startsWith('[Question]')) return 'question'
  if (note.startsWith('[Follow-up]')) return 'follow-up'
  if (note.startsWith('[Client]')) return 'client-question'
  if (isFlagged || note.startsWith('[Flag]')) return 'flag'
  return 'note'
}

export function stripAnnotationPrefix(note: string): string {
  return note.replace(/^\[(Flag|Critical|Blocking|Question|Follow-up|Client)\]\s?/, '')
}

export function annotationTypeLabel(type: AnnotationType): string {
  return getAnnotationTypeOptions(true).find(o => o.value === type)?.label ?? 'Note'
}

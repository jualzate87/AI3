import type { AiDiagnosticCategoryId } from './aiDiagnosticCategories'

/** Machine-readable activity type for feeds, APIs, and filters. */
export type ActivityEntryType =
  | 'field-edited'
  | 'form-line-checked'
  | 'document-verified'
  | 'import-diagnostic-fixed'
  | 'compliance-diagnostic-fixed'
  | 'planning-diagnostic-fixed'
  | 'return-sign-off'

/** Coarse filter bucket shown in the activity feed dropdown. */
export type ActivityFilterCategory =
  | 'field-edited'
  | 'document-verified'
  | 'form-line-checked'
  | 'diagnostic-fixed'

export type ActivityDeepLink =
  | { target: 'form'; formLabel: string }
  | {
      target: 'ai-diagnostics'
      categoryId: AiDiagnosticCategoryId
      subNavId: string
    }
  | { target: 'federal-summary' }
  | {
      target: 'source-document'
      docId: string
      detailFieldId?: string
      focus?: 'document' | 'input'
    }

/** Legacy Review log chip grouping. */
export type ReviewLogKind = 'edit' | 'document' | 'form-check' | 'diagnostic'

export function entryTypeToFilterCategory(
  entryType: ActivityEntryType,
): ActivityFilterCategory {
  if (entryType === 'field-edited') return 'field-edited'
  if (entryType === 'document-verified') return 'document-verified'
  if (entryType === 'form-line-checked') return 'form-line-checked'
  return 'diagnostic-fixed'
}

export function entryTypeToReviewLogKind(entryType: ActivityEntryType): ReviewLogKind {
  if (entryType === 'field-edited') return 'edit'
  if (entryType === 'document-verified') return 'document'
  if (entryType === 'form-line-checked') return 'form-check'
  return 'diagnostic'
}

export const ACTIVITY_ENTRY_BADGE: Record<
  ActivityEntryType,
  { label: string; status: 'warning' | 'info' | 'success' | 'pending' }
> = {
  'field-edited': { label: 'Field edited', status: 'warning' },
  'form-line-checked': { label: 'Form line checked', status: 'pending' },
  'document-verified': { label: 'Document verified', status: 'info' },
  'import-diagnostic-fixed': { label: 'Import mismatch fixed', status: 'warning' },
  'compliance-diagnostic-fixed': { label: 'Compliance fixed', status: 'success' },
  'planning-diagnostic-fixed': { label: 'Planning reviewed', status: 'info' },
  'return-sign-off': { label: 'Return sign-off', status: 'success' },
}

export const ACTIVITY_ENTRY_DOT_CLASS: Record<ActivityEntryType, string> = {
  'field-edited': 'dotAttention',
  'form-line-checked': 'dotNeutral',
  'document-verified': 'dotInfo',
  'import-diagnostic-fixed': 'dotAttention',
  'compliance-diagnostic-fixed': 'dotPositive',
  'planning-diagnostic-fixed': 'dotInfo',
  'return-sign-off': 'dotPositive',
}

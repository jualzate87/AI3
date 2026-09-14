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

/** Visual family for activity feed badges — matches Review activity legend. */
export type ActivityBadgeCategory = 'verification' | 'modification'

export const ACTIVITY_ENTRY_BADGE: Record<
  ActivityEntryType,
  {
    label: string
    category: ActivityBadgeCategory
  }
> = {
  'field-edited': { label: 'Field edited', category: 'modification' },
  'form-line-checked': { label: 'Form line checked', category: 'verification' },
  'document-verified': { label: 'Document verified', category: 'verification' },
  'import-diagnostic-fixed': { label: 'Import mismatch fixed', category: 'modification' },
  'compliance-diagnostic-fixed': { label: 'Compliance fixed', category: 'verification' },
  'planning-diagnostic-fixed': { label: 'Planning reviewed', category: 'modification' },
  'return-sign-off': { label: 'Return sign-off', category: 'verification' },
}

import type { Phase2IssueKey } from '../data-review/phase2FlagSync'
import {
  getActiveDiagnosticKeys,
  getOutstandingImportMismatches,
  type DiagnosticSyncContext,
} from '../data-review/phase2FlagSync'

export type AiDiagnosticCategoryId = 'import-mismatches' | 'compliance' | 'optimization'

export type AiDiagnosticCategory = {
  id: AiDiagnosticCategoryId
  navLabel: string
  title: string
  badgeLabel: string
  badgeStatus: 'warning' | 'success' | 'info'
  /** Label for the overview summary pill, e.g. "Import mismatches". */
  metricLabel: string
  description: string
  issueKeys: readonly Phase2IssueKey[]
}

export const AI_DIAGNOSTIC_CATEGORIES: readonly AiDiagnosticCategory[] = [
  {
    id: 'import-mismatches',
    navLabel: 'Import mismatches',
    title: 'Import mismatches detected',
    badgeLabel: 'IMPORT MISMATCHES',
    badgeStatus: 'warning',
    metricLabel: 'Import mismatches',
    description:
      '6 fields don\u2019t match source documents. Some were marked correct during import without fixing amounts, and I found gaps the import missed.',
    issueKeys: ['importMismatches', 'qualifiedDivClassification'],
  },
  {
    id: 'compliance',
    navLabel: 'Withholding falls short',
    title: 'Withholding falls short',
    badgeLabel: 'COMPLIANCE CHECK',
    badgeStatus: 'warning',
    metricLabel: 'Compliance checks',
    description:
      'Withholding on the return is below the safe-harbor threshold, which can trigger an underpayment penalty even when the client owes less than expected.',
    issueKeys: ['underpaymentRisk'],
  },
  {
    id: 'optimization',
    navLabel: 'Missing Schedule A expenses',
    title: 'Missing Schedule A expenses',
    badgeLabel: 'OPTIMIZATION',
    badgeStatus: 'success',
    metricLabel: 'Optimization',
    description:
      'Jessica confirmed mortgage interest in the questionnaire, but Form 1098 is missing from the import packet. Itemizing could lower tax versus the standard deduction.',
    issueKeys: ['optItemize'],
  },
] as const

/** Active Phase 2 keys that belong to the AI diagnostics overview (excludes study-only cards). */
export function getCategoryScopedActiveKeys(ctx: DiagnosticSyncContext): Phase2IssueKey[] {
  const activeKeys = getActiveDiagnosticKeys(ctx)
  const categoryKeySet = new Set(
    AI_DIAGNOSTIC_CATEGORIES.flatMap(category => category.issueKeys),
  )
  return activeKeys.filter(key => categoryKeySet.has(key))
}

export function categoryForIssueKey(key: Phase2IssueKey): AiDiagnosticCategory | undefined {
  return AI_DIAGNOSTIC_CATEGORIES.find(cat => cat.issueKeys.includes(key))
}

export function primaryIssueKeyForCategory(
  categoryId: AiDiagnosticCategoryId,
  activeKeys: readonly Phase2IssueKey[],
): Phase2IssueKey | null {
  const category = AI_DIAGNOSTIC_CATEGORIES.find(c => c.id === categoryId)
  if (!category) return null
  return category.issueKeys.find(k => activeKeys.includes(k)) ?? category.issueKeys[0] ?? null
}

/**
 * Active items in one category. Import mismatches count individual input↔source
 * rows (from getOutstandingImportMismatches); other categories count active diagnostics.
 */
export function getCategoryDiagnosticCount(
  categoryId: AiDiagnosticCategoryId,
  ctx: DiagnosticSyncContext,
): number {
  const category = AI_DIAGNOSTIC_CATEGORIES.find(c => c.id === categoryId)
  if (!category) return 0
  const activeKeys = getActiveDiagnosticKeys(ctx)
  const categoryActive = category.issueKeys.some(k => activeKeys.includes(k))
  if (!categoryActive) return 0

  if (categoryId === 'import-mismatches') {
    return getOutstandingImportMismatches(ctx.amounts).length
  }

  return category.issueKeys.filter(k => activeKeys.includes(k)).length
}

/**
 * Single source for AI Diagnostics overview counts (intro, pills, review status,
 * collapsed cards, nav badge). Summary pills use field-level import rows; progress
 * and the nav badge count active diagnostic cards (issue keys), not row totals.
 */
export function getDiagnosticOverviewCounts(ctx: DiagnosticSyncContext) {
  const activeKeys = getCategoryScopedActiveKeys(ctx)
  const byCategory = {
    'import-mismatches': getCategoryDiagnosticCount('import-mismatches', ctx),
    compliance: getCategoryDiagnosticCount('compliance', ctx),
    optimization: getCategoryDiagnosticCount('optimization', ctx),
  } as Record<AiDiagnosticCategoryId, number>
  const reviewed = activeKeys.filter(key => ctx.reviewedFields.has(key)).length
  const total = activeKeys.length
  return {
    activeKeys,
    total,
    reviewed,
    remaining: total - reviewed,
    complete: total > 0 && reviewed >= total,
    byCategory,
  }
}

import type { Phase2IssueKey } from '../data-review/phase2FlagSync'
import {
  getActiveDiagnosticKeys,
  getPhase2Progress,
  type DiagnosticSyncContext,
} from '../data-review/phase2FlagSync'

export type AiDiagnosticCategoryId = 'import-mismatches' | 'compliance' | 'optimization'

export type AiDiagnosticCategory = {
  id: AiDiagnosticCategoryId
  navLabel: string
  title: string
  badgeLabel: string
  badgeStatus: 'warning' | 'success' | 'info'
  /** Noun used in the overview count pills, e.g. "3 planning items". */
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
    metricLabel: 'import',
    description:
      'Fields that still disagree with the source documents, each priced by what it costs the return. Includes a dividend classification the totals check cannot catch, because Box 1a is correct while Box 1b is not.',
    issueKeys: ['importMismatches', 'qualifiedDivClassification'],
  },
  {
    id: 'compliance',
    navLabel: 'Compliance checks',
    title: 'Compliance and completeness',
    badgeLabel: 'COMPLIANCE CHECK',
    badgeStatus: 'warning',
    metricLabel: 'compliance',
    description:
      'Income the IRS already has a copy of, tax the return has not computed yet, and source amounts that never made it across. Each item names its cause so you can tell an import artifact from a client behavior.',
    issueKeys: ['underpaymentRisk', 'necScheduleC', 'niitForm8960', 'w2Box12Missing'],
  },
  {
    id: 'optimization',
    navLabel: 'Planning opportunities',
    title: 'Deduction and planning opportunities',
    badgeLabel: 'OPTIMIZATION',
    badgeStatus: 'info',
    metricLabel: 'planning',
    description:
      'Deductions the client confirmed but the return never claimed, plus contribution room still open before the filing deadline. Every item is quantified so you can decide what is worth a follow-up call.',
    issueKeys: ['optItemize', 'schCExpenses', 'sepIra'],
  },
] as const

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

/** Active diagnostics in one category (one diagnostic = one overview item). */
export function getCategoryDiagnosticCount(
  categoryId: AiDiagnosticCategoryId,
  ctx: DiagnosticSyncContext,
): number {
  const category = AI_DIAGNOSTIC_CATEGORIES.find(c => c.id === categoryId)
  if (!category) return 0
  const activeKeys = getActiveDiagnosticKeys(ctx)
  return category.issueKeys.filter(k => activeKeys.includes(k)).length
}

/**
 * Single source for AI Diagnostics overview counts (intro, pills, review status,
 * collapsed cards, nav badge). Cleared checked-no-action rules are excluded.
 */
export function getDiagnosticOverviewCounts(ctx: DiagnosticSyncContext) {
  const progress = getPhase2Progress(ctx)
  return {
    ...progress,
    byCategory: {
      'import-mismatches': getCategoryDiagnosticCount('import-mismatches', ctx),
      compliance: getCategoryDiagnosticCount('compliance', ctx),
      optimization: getCategoryDiagnosticCount('optimization', ctx),
    } as Record<AiDiagnosticCategoryId, number>,
  }
}

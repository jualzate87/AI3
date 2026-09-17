import type { Phase2IssueKey } from '../data-review/phase2FlagSync'
import {
  getActiveDiagnosticKeys,
  getOutstandingImportMismatches,
  type DiagnosticSyncContext,
} from '../data-review/phase2FlagSync'

export type AiDiagnosticCategoryId = 'import-mismatches' | 'compliance' | 'optimization'

export type DiagnosticBadgeMeta = {
  badgeLabel: string
  badgeStatus: 'warning' | 'success' | 'info' | 'pending'
  badgePriority: 'primary' | 'secondary'
  badgeCapitalization: 'caps'
  showBadgeIcon: boolean
}

export type AiDiagnosticCategory = {
  id: AiDiagnosticCategoryId
  navLabel: string
  title: string
  badgeLabel: string
  badgeStatus: 'warning' | 'success' | 'info'
  badgePriority: 'primary' | 'secondary'
  /** Label for the overview summary pill, e.g. "Import mismatches". */
  metricLabel: string
  description: string
  issueKeys: readonly Phase2IssueKey[]
}

export const DIAGNOSTIC_BADGE_BY_CATEGORY_ID: Record<AiDiagnosticCategoryId, DiagnosticBadgeMeta> =
  {
    'import-mismatches': {
      badgeLabel: 'IMPORT MISMATCHES',
      badgeStatus: 'warning',
      badgePriority: 'primary',
      badgeCapitalization: 'caps',
      showBadgeIcon: true,
    },
    compliance: {
      badgeLabel: 'COMPLIANCE CHECK',
      badgeStatus: 'warning',
      badgePriority: 'primary',
      badgeCapitalization: 'caps',
      showBadgeIcon: true,
    },
    optimization: {
      badgeLabel: 'OPTIMIZATION',
      badgeStatus: 'info',
      badgePriority: 'secondary',
      badgeCapitalization: 'caps',
      showBadgeIcon: true,
    },
  }

export const AI_DIAGNOSTIC_CATEGORIES: readonly AiDiagnosticCategory[] = [
  {
    id: 'import-mismatches',
    navLabel: 'Import mismatches',
    title: 'Import mismatches detected',
    badgeLabel: DIAGNOSTIC_BADGE_BY_CATEGORY_ID['import-mismatches'].badgeLabel,
    badgeStatus: DIAGNOSTIC_BADGE_BY_CATEGORY_ID['import-mismatches'].badgeStatus,
    badgePriority: DIAGNOSTIC_BADGE_BY_CATEGORY_ID['import-mismatches'].badgePriority,
    metricLabel: 'Import mismatches',
    description:
      '6 fields don\u2019t match source documents. Some were marked correct during import without fixing amounts, and I found gaps the import missed.',
    issueKeys: ['importMismatches', 'qualifiedDivClassification'],
  },
  {
    id: 'compliance',
    navLabel: 'Withholding falls short',
    title: 'Withholding falls short',
    badgeLabel: DIAGNOSTIC_BADGE_BY_CATEGORY_ID.compliance.badgeLabel,
    badgeStatus: DIAGNOSTIC_BADGE_BY_CATEGORY_ID.compliance.badgeStatus,
    badgePriority: DIAGNOSTIC_BADGE_BY_CATEGORY_ID.compliance.badgePriority,
    metricLabel: 'Compliance checks',
    description:
      'Withholding on the return is below the safe-harbor threshold, which can trigger an underpayment penalty even when the client owes less than expected.',
    issueKeys: ['underpaymentRisk', 'necScheduleC', 'niitForm8960', 'w2Box12Missing'],
  },
  {
    id: 'optimization',
    navLabel: 'Missing Schedule A expenses',
    title: 'Missing Schedule A expenses',
    badgeLabel: DIAGNOSTIC_BADGE_BY_CATEGORY_ID.optimization.badgeLabel,
    badgeStatus: DIAGNOSTIC_BADGE_BY_CATEGORY_ID.optimization.badgeStatus,
    badgePriority: DIAGNOSTIC_BADGE_BY_CATEGORY_ID.optimization.badgePriority,
    metricLabel: 'Optimization',
    description:
      'Jordan confirmed mortgage interest in the questionnaire, but Form 1098 is missing from the import packet. Itemizing could lower tax versus the standard deduction.',
    issueKeys: ['optItemize', 'schCExpenses', 'sepIra'],
  },
] as const

/** Badge metadata for a diagnostic issue card — matches overview category badges. */
export function badgeMetaForIssueKey(issueKey: Phase2IssueKey): DiagnosticBadgeMeta {
  const category = categoryForIssueKey(issueKey)
  if (category) return DIAGNOSTIC_BADGE_BY_CATEGORY_ID[category.id]
  return {
    badgeLabel: 'DIAGNOSTIC',
    badgeStatus: 'warning',
    badgePriority: 'primary',
    badgeCapitalization: 'caps',
    showBadgeIcon: true,
  }
}

/** Issue keys shown in agent mode diagnosis (Import / Compliance / Optimization). */
export const AGENT_SCOPED_ISSUE_KEYS: readonly Phase2IssueKey[] =
  AI_DIAGNOSTIC_CATEGORIES.flatMap(category => category.issueKeys)

/** Phase 1 flag keys that auto-dismiss agent-scoped diagnostics when marked reviewed. */
export const AGENT_LINKED_PHASE1_REVIEW_KEYS = ['fedTaxWithheld'] as const

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

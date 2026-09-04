import type { Phase2IssueKey } from '../data-review/phase2FlagSync'

export type AiDiagnosticCategoryId = 'import-mismatches' | 'compliance' | 'optimization'

export type AiDiagnosticCategory = {
  id: AiDiagnosticCategoryId
  navLabel: string
  title: string
  badgeLabel: string
  badgeStatus: 'warning' | 'success' | 'info'
  description: string
  issueKeys: readonly Phase2IssueKey[]
}

export const AI_DIAGNOSTIC_CATEGORIES: readonly AiDiagnosticCategory[] = [
  {
    id: 'import-mismatches',
    navLabel: 'Diagnostic 1',
    title: 'Import mismatches detected',
    badgeLabel: 'import mismatches',
    badgeStatus: 'warning',
    description:
      '6 fields don\'t match source documents. Some were marked correct during import without fixing amounts, and I found gaps the import missed.',
    issueKeys: ['importMismatches'],
  },
  {
    id: 'compliance',
    navLabel: 'Diagnostic 2',
    title: 'State filing requirements',
    badgeLabel: 'COMPLIANCE CHECK',
    badgeStatus: 'warning',
    description:
      'Compliance checks surfaced during review — confirm withholding, filing requirements, and related forms before filing.',
    issueKeys: ['underpaymentRisk', 'necScheduleC', 'niitForm8960'],
  },
  {
    id: 'optimization',
    navLabel: 'Diagnostic 3',
    title: 'Retirement contribution opportunity',
    badgeLabel: 'OPTIMIZATION',
    badgeStatus: 'success',
    description:
      'Planning opportunity identified — review deduction strategy and client-provided details before finalizing the return.',
    issueKeys: ['optItemize'],
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

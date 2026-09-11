import {
  ESTIMATED_MORTGAGE_INTEREST,
  NEC_SOURCE_AMOUNT,
  type LiveAmounts,
} from '../data/liveReturn'
import {
  SOURCE_AMOUNTS,
  type Phase2IssueKey,
} from '../pages/data-review/phase2FlagSync'
import { buildAllDiagnosticIssues } from '../pages/data-review/AgentReportPane'
import { computeLiveReturn } from '../data/liveReturn'
import type { DiagnosticSyncContext } from '../pages/data-review/phase2FlagSync'
import { getCategoryScopedActiveKeys } from '../pages/check-return/aiDiagnosticCategories'

/** Demo auto-fix patch per active diagnostic issue. */
export function getAutoFixPatchForIssue(
  issueKey: Phase2IssueKey,
  amounts: LiveAmounts,
): Partial<LiveAmounts> {
  switch (issueKey) {
    case 'importMismatches':
      return {
        wages: SOURCE_AMOUNTS.wages,
        divWithholding: SOURCE_AMOUNTS.divWithholding,
        rWithholding: SOURCE_AMOUNTS.rWithholding,
        taxablePension: SOURCE_AMOUNTS.taxablePension,
        qualifiedDivsToken: SOURCE_AMOUNTS.qualifiedDivsToken,
      }
    case 'qualifiedDivClassification':
      return { qualifiedDivsToken: SOURCE_AMOUNTS.qualifiedDivsToken }
    case 'underpaymentRisk':
      return {
        divWithholding: SOURCE_AMOUNTS.divWithholding,
        rWithholding: SOURCE_AMOUNTS.rWithholding,
      }
    case 'necScheduleC':
      return { necIncome: NEC_SOURCE_AMOUNT, necOnReturn: true }
    case 'optItemize':
      return { mortgageInterest: ESTIMATED_MORTGAGE_INTEREST }
    case 'schCExpenses':
      return { schCExpenses: 4_500 }
    case 'w2Box12Missing': {
      const rows = { ...amounts.box12Rows }
      ;(['a', 'b', 'c', 'd'] as const).forEach(slot => {
        if (rows[slot].code && rows[slot].amount === 0) {
          rows[slot] = { ...rows[slot], amount: 3_000 }
        }
      })
      return { box12Rows: rows }
    }
    default:
      return {}
  }
}

export type AgentFixPlanItem = {
  issueKey: Phase2IssueKey
  title: string
  thinkingSteps: string[]
  fixSummary: string
  amountPatch: Partial<LiveAmounts>
}

/** Build ordered fix plan from active AI-scoped diagnostics. */
export function buildAgentFixPlan(ctx: DiagnosticSyncContext): AgentFixPlanItem[] {
  const live = ctx.live
  const amounts = ctx.amounts
  const activeKeys = getCategoryScopedActiveKeys(ctx)
  const issues = buildAllDiagnosticIssues(live, amounts)
  const issueByKey = new Map(issues.map(i => [i.issueKey, i]))

  return activeKeys.map(key => {
    const issue = issueByKey.get(key)
    const title = issue?.title ?? key
    const thinkingSteps = buildThinkingSteps(key, issue?.summary)
    const amountPatch = getAutoFixPatchForIssue(key, amounts)
    return {
      issueKey: key,
      title,
      thinkingSteps,
      fixSummary: issue?.suggestedActions[0] ?? `Resolved ${title.toLowerCase()}.`,
      amountPatch,
    }
  })
}

function buildThinkingSteps(issueKey: Phase2IssueKey, summary?: string): string[] {
  const base = summary ? [`Reviewing: ${summary}`] : ['Scanning return inputs and source documents…']
  switch (issueKey) {
    case 'importMismatches':
      return [
        ...base,
        'Comparing W-2, 1099-DIV, and 1099-R amounts against source PDFs…',
        'Calculating tax impact for each mismatch…',
        'Applying corrected values to the return…',
      ]
    case 'qualifiedDivClassification':
      return [
        ...base,
        'Checking Box 1b on Token 1099-DIV against return classification…',
        'Reclassifying ordinary vs qualified dividends…',
      ]
    case 'underpaymentRisk':
      return [
        ...base,
        'Running safe-harbor withholding check for 2024…',
        'Restoring missing withholding from source documents…',
      ]
    case 'optItemize':
      return [
        ...base,
        'Reading questionnaire mortgage interest confirmation…',
        'Projecting Schedule A vs standard deduction…',
        'Entering estimated Form 1098 mortgage interest…',
      ]
    default:
      return [...base, 'Validating fix against compliance rules…', 'Updating return amounts…']
  }
}

/** Merge all patches from a fix plan into one amounts update. */
export function mergeFixPatches(plans: AgentFixPlanItem[]): Partial<LiveAmounts> {
  return plans.reduce<Partial<LiveAmounts>>((acc, plan) => {
    const next = { ...acc, ...plan.amountPatch }
    if (plan.amountPatch.box12Rows && acc.box12Rows) {
      next.box12Rows = {
        a: { ...acc.box12Rows.a, ...plan.amountPatch.box12Rows.a },
        b: { ...acc.box12Rows.b, ...plan.amountPatch.box12Rows.b },
        c: { ...acc.box12Rows.c, ...plan.amountPatch.box12Rows.c },
        d: { ...acc.box12Rows.d, ...plan.amountPatch.box12Rows.d },
      }
    }
    return next
  }, {})
}

export function getAgentFixContext(amounts: LiveAmounts, reviewedFields: Map<string, unknown>) {
  const live = computeLiveReturn(amounts)
  return { amounts, live, reviewedFields }
}

import {
  ESTIMATED_MORTGAGE_INTEREST,
  NEC_SOURCE_AMOUNT,
  type LiveAmounts,
} from '../data/liveReturn'
import {
  SOURCE_AMOUNTS,
  getOutstandingImportMismatches,
  type DiagnosticSyncContext,
  type Phase2IssueKey,
} from '../pages/data-review/phase2FlagSync'
import {
  buildAllDiagnosticIssues,
  type DiagnosticIssueCard,
} from '../pages/data-review/AgentReportPane'
import { computeLiveReturn } from '../data/liveReturn'
import type { OutputFormId } from '../pages/data-review/outputForms'
import type { QuestionnaireResponseId } from '../pages/data-review/questionnaireData'
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

export type AgentViewLink = {
  label: string
  tab?: string
  field?: string
  formId?: OutputFormId
  questionnaireResponseId?: QuestionnaireResponseId
  schAInterest?: boolean
  inputScreens?: boolean
  diagnostic?: Phase2IssueKey
}

/** Common source destinations for agent-mode exploration (chat quick nav). */
export function buildStandardSourceLinks(): AgentViewLink[] {
  return [
    { label: 'W-2 Tech Circle', tab: 'w2s', field: 'wages' },
    { label: '1099-DIV Token', tab: '1099-divs', field: 'qualifiedDivs' },
    { label: '1099-R Meridian', tab: '1099-rs', field: 'taxablePension' },
    { label: 'Questionnaire', tab: 'questionnaire', field: 'mortgageInterest' },
    { label: 'Schedule A inputs', schAInterest: true, field: 'mortgage1098' },
    { label: 'Form 1040', formId: '1040' },
    { label: 'Input screens', inputScreens: true },
  ]
}

export type AgentFixPlanItem = {
  issueKey: Phase2IssueKey
  title: string
  thinkingSteps: string[]
  fixSummary: string
  amountPatch: Partial<LiveAmounts>
  viewLinks: AgentViewLink[]
}

/** Deep links to review where each auto-fix landed (source doc, input, or 1040). */
export function buildViewLinksForIssue(
  issue: DiagnosticIssueCard,
  amounts: LiveAmounts,
): AgentViewLink[] {
  const links: AgentViewLink[] = []
  const seen = new Set<string>()

  const push = (link: AgentViewLink) => {
    if (seen.has(link.label)) return
    seen.add(link.label)
    links.push(link)
  }

  if (issue.issueKey === 'importMismatches') {
    for (const gap of getOutstandingImportMismatches(amounts)) {
      push({
        label: `View ${gap.label}`,
        tab: gap.tab,
        field: gap.field,
      })
    }
    push({
      label: 'View on Form 1040',
      formId: '1040',
      diagnostic: 'importMismatches',
    })
    return links.slice(0, 6)
  }

  for (const row of issue.tableRows) {
    if (row.fixTab === 'sch-a-interest' && row.fixField) {
      push({
        label: row.actionLabel ?? 'View on input screen',
        schAInterest: true,
        field: row.fixField,
      })
    } else if (row.fixTab === 'questionnaire') {
      push({
        label: row.actionLabel ?? 'View source',
        tab: 'questionnaire',
        field: row.fixField,
        questionnaireResponseId: row.questionnaireResponseId,
      })
    } else if (row.fixField && row.fixTab) {
      push({
        label: row.actionLabel ?? `View ${row.label}`,
        tab: row.fixTab,
        field: row.fixField,
      })
    }
    if (row.viewForm && row.viewFormLabel) {
      push({
        label: row.actionLabel ?? `View ${row.viewFormLabel}`,
        formId: row.viewForm as OutputFormId,
        diagnostic: issue.issueKey,
      })
    }
  }

  for (const action of issue.actions) {
    if (action.type === 'goToInput' && action.menuItems) continue
    if (action.type === 'goToInput' && action.tab === 'sch-a-interest') {
      push({
        label: action.label,
        schAInterest: true,
        field: action.field,
      })
    } else if (action.type === 'goToInput' && action.tab && action.field) {
      push({ label: action.label, tab: action.tab, field: action.field })
    } else if (action.type === 'openForm') {
      const formMap: Record<string, OutputFormId> = {
        'Open Form 8960': 'f8960',
        'Open Form 2210': 'f2210',
        'Open Schedule C': 'schC',
        'Open Schedule A': 'schA',
        'Open Schedule 1': 'sch1',
      }
      const formId = formMap[action.label]
      if (formId) {
        push({
          label: action.label.replace(/^Open /, 'View '),
          formId,
          diagnostic: issue.issueKey,
        })
      }
    }
  }

  return links.slice(0, 5)
}

/** Build ordered fix plan from active AI-scoped diagnostics. */
export function buildAgentFixPlan(ctx: DiagnosticSyncContext): AgentFixPlanItem[] {
  const live = ctx.live
  const amounts = ctx.amounts
  const activeKeys = getCategoryScopedActiveKeys(ctx).filter(
    key => !ctx.reviewedFields.has(key),
  )
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
      viewLinks: issue ? buildViewLinksForIssue(issue, amounts) : [],
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

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
import { INPUT_FIELD_PARAM, writeInputReturnParams } from '../data/inputDocTabs'
import {
  buildHashRouteUrl,
  buildReviewReturnPopoutRoute,
  buildSourceDocumentPopoutRoute,
  PREPARER_DATA_REVIEW_PATH,
} from './prototypeRoutes'

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

const FORM_VIEW_LABELS: Record<string, string> = {
  '1040': 'Form 1040',
  schA: 'Schedule A',
  schC: 'Schedule C',
  sch1: 'Schedule 1',
  f8960: 'Form 8960',
  f2210: 'Form 2210',
}

const TAB_SOURCE_LABELS: Record<string, string> = {
  w2s: 'W-2 · Tech Circle',
  '1099-divs': '1099-DIV · Token',
  '1099-ints': '1099-INT · Harborline',
  '1099-rs': '1099-R · Meridian',
  '1099-necs': '1099-NEC · Summit',
  questionnaire: 'Questionnaire',
}

/** Strip "View"/"Open" prefixes — the new-window icon conveys the action. */
export function stripViewLinkPrefix(label: string): string {
  return label
    .replace(/^View on /i, '')
    .replace(/^View /i, '')
    .replace(/^Open /i, '')
    .trim()
}

export function formatImportMismatchViewLabel(gap: {
  id: string
  label: string
  tab?: string
}): string {
  if (gap.tab) return formatSourceTabViewLabel(gap.tab)
  return stripViewLinkPrefix(gap.label)
}

export function formatFormViewLabel(formId: OutputFormId | string): string {
  return FORM_VIEW_LABELS[formId] ?? stripViewLinkPrefix(String(formId))
}

export function formatSourceTabViewLabel(tab: string): string {
  return TAB_SOURCE_LABELS[tab] ?? 'Source'
}

type ViewLinkLabelContext = {
  tab?: string
  formId?: OutputFormId | string
  schAInterest?: boolean
  inputScreens?: boolean
}

/** Resolve concise, scannable labels for agent view links. */
export function resolveViewLinkLabel(
  raw: string | undefined,
  ctx?: ViewLinkLabelContext,
): string {
  if (ctx?.inputScreens) return 'Input screens'
  if (ctx?.schAInterest) return 'Schedule A inputs'
  if (ctx?.formId) {
    const fromForm = formatFormViewLabel(ctx.formId)
    if (raw) {
      const stripped = stripViewLinkPrefix(raw)
      if (stripped === fromForm || stripped.toLowerCase().includes('form')) return fromForm
    }
    return fromForm
  }
  if (raw) {
    const stripped = stripViewLinkPrefix(raw)
    if (stripped.toLowerCase() === 'source' && ctx?.tab) {
      return formatSourceTabViewLabel(ctx.tab)
    }
    if (stripped.toLowerCase() === 'on input screen') return 'Schedule A inputs'
    return stripped
  }
  if (ctx?.tab) return formatSourceTabViewLabel(ctx.tab)
  return 'Source'
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

export type AgentThinkingStep = {
  title: string
  description: string
}

/** Slice of a batch fix-all stepper — one subsection per diagnostic. */
export type AgentThinkingSection = {
  title: string
  startStep: number
  endStep: number
}

export type AgentFixPlanItem = {
  issueKey: Phase2IssueKey
  title: string
  category: string
  summary: string
  taxImpact: string
  dotColor: 'red' | 'orange' | 'blue'
  thinkingSteps: AgentThinkingStep[]
  outcomeLabel: string
  fixSummary: string
  amountPatch: Partial<LiveAmounts>
  viewLinks: AgentViewLink[]
}

/** Hash URL for embedding evidence in the in-app panel (iframe). */
export function buildAgentViewLinkUrl(link: AgentViewLink): string {
  if (link.inputScreens) {
    return buildHashRouteUrl(PREPARER_DATA_REVIEW_PATH)
  }
  if (link.schAInterest) {
    const params = new URLSearchParams()
    writeInputReturnParams(params, 'sch-a-interest')
    params.set(INPUT_FIELD_PARAM, link.field ?? 'mortgage1098')
    return buildHashRouteUrl(`/input-return?${params.toString()}`)
  }
  if (link.formId) {
    return buildHashRouteUrl(
      buildReviewReturnPopoutRoute({ form: link.formId, diagnostic: link.diagnostic }),
    )
  }
  if (link.tab === 'questionnaire') {
    return buildHashRouteUrl(
      buildSourceDocumentPopoutRoute({
        tab: 'questionnaire',
        field: link.field ?? link.questionnaireResponseId,
      }),
    )
  }
  if (link.tab && link.field) {
    return buildHashRouteUrl(buildSourceDocumentPopoutRoute({ tab: link.tab, field: link.field }))
  }
  return buildHashRouteUrl(buildSourceDocumentPopoutRoute())
}

export function openAgentViewLinkInWindow(link: AgentViewLink): void {
  window.open(buildAgentViewLinkUrl(link), '_blank', 'noopener,noreferrer')
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
        label: formatImportMismatchViewLabel(gap),
        tab: gap.tab,
        field: gap.field,
      })
    }
    push({
      label: formatFormViewLabel('1040'),
      formId: '1040',
      diagnostic: 'importMismatches',
    })
    return links.slice(0, 6)
  }

  for (const row of issue.tableRows) {
    if (row.fixTab === 'sch-a-interest' && row.fixField) {
      push({
        label: resolveViewLinkLabel(row.actionLabel, { schAInterest: true }),
        schAInterest: true,
        field: row.fixField,
      })
    } else if (row.fixTab === 'questionnaire') {
      push({
        label: resolveViewLinkLabel(row.actionLabel, { tab: 'questionnaire' }),
        tab: 'questionnaire',
        field: row.fixField,
        questionnaireResponseId: row.questionnaireResponseId,
      })
    } else if (row.fixField && row.fixTab) {
      push({
        label: resolveViewLinkLabel(row.actionLabel, { tab: row.fixTab }),
        tab: row.fixTab,
        field: row.fixField,
      })
    }
    if (row.viewForm && row.viewFormLabel) {
      push({
        label: resolveViewLinkLabel(row.actionLabel, {
          formId: row.viewForm as OutputFormId,
        }),
        formId: row.viewForm as OutputFormId,
        diagnostic: issue.issueKey,
      })
    }
  }

  for (const action of issue.actions) {
    if (action.type === 'goToInput' && action.menuItems) continue
    if (action.type === 'goToInput' && action.tab === 'sch-a-interest') {
      push({
        label: resolveViewLinkLabel(action.label, { schAInterest: true }),
        schAInterest: true,
        field: action.field,
      })
    } else if (action.type === 'goToInput' && action.tab && action.field) {
      push({
        label: resolveViewLinkLabel(action.label, { tab: action.tab }),
        tab: action.tab,
        field: action.field,
      })
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
          label: formatFormViewLabel(formId),
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
      category: issue?.category ?? 'Diagnostic',
      summary: issue?.summary ?? title,
      taxImpact: issue?.taxImpact ?? '',
      dotColor: issue?.dotColor ?? 'orange',
      thinkingSteps,
      outcomeLabel: getFixOutcomeLabel(key),
      fixSummary: issue?.suggestedActions[0] ?? `Resolved ${title.toLowerCase()}.`,
      amountPatch,
      viewLinks: issue ? buildViewLinksForIssue(issue, amounts) : [],
    }
  })
}

function getFixOutcomeLabel(issueKey: Phase2IssueKey): string {
  switch (issueKey) {
    case 'importMismatches':
      return 'Import mismatches fixed'
    case 'qualifiedDivClassification':
      return 'Dividend classification corrected'
    case 'underpaymentRisk':
      return 'Withholding gap corrected'
    case 'necScheduleC':
      return 'Schedule C income entered'
    case 'optItemize':
      return 'Form 1098 mortgage interest entered'
    case 'schCExpenses':
      return 'Schedule C expenses updated'
    case 'w2Box12Missing':
      return 'W-2 Box 12 amounts restored'
    default:
      return 'Diagnostic resolved'
  }
}

/** Combined stepper for fix-all — one Response generation block instead of one per issue. */
export function buildBatchThinkingSteps(items: AgentFixPlanItem[]): AgentThinkingStep[] {
  if (items.length === 0) return []
  if (items.length === 1) return items[0].thinkingSteps

  const steps: AgentThinkingStep[] = [
    {
      title: 'Review all diagnostics',
      description: `Analyzing ${items.length} open issues across source documents, questionnaire answers, and return inputs before applying coordinated fixes.`,
    },
  ]

  items.forEach((item, index) => {
    const issueSteps = item.thinkingSteps.filter(step => step.title !== 'Context assessment')
    issueSteps.forEach((step, stepIndex) => {
      const isApply = step.title === 'Apply corrections'
      steps.push({
        title: isApply ? `Apply fix ${index + 1} of ${items.length}` : step.title,
        description: isApply
          ? `${step.description} (${item.title})`
          : `${step.description} — ${item.title}`,
      })
      if (stepIndex === 0 && issueSteps.length > 1) {
        steps[steps.length - 1].title = `Analyze: ${item.title}`
      }
    })
  })

  steps.push({
    title: 'Recalculate and verify',
    description:
      'Updating linked forms, recalculating tax totals, and confirming all diagnostics are cleared on the return.',
  })

  return steps
}

/** Section boundaries for progressive disclosure during fix-all. */
export function buildBatchThinkingSections(items: AgentFixPlanItem[]): AgentThinkingSection[] {
  if (items.length <= 1) return []

  const sections: AgentThinkingSection[] = [
    { title: 'Review all diagnostics', startStep: 0, endStep: 1 },
  ]

  let idx = 1
  for (const item of items) {
    sections.push({
      title: item.title,
      startStep: idx,
      endStep: idx + 2,
    })
    idx += 2
  }

  sections.push({
    title: 'Recalculate and verify',
    startStep: idx,
    endStep: idx + 1,
  })

  return sections
}

function buildThinkingSteps(issueKey: Phase2IssueKey, summary?: string): AgentThinkingStep[] {
  const contextDescription =
    summary ??
    'Reviewing return inputs, source documents, and questionnaire answers to confirm scope.'

  switch (issueKey) {
    case 'importMismatches':
      return [
        {
          title: 'Context assessment',
          description: contextDescription,
        },
        {
          title: 'Source comparison',
          description:
            'Comparing W-2, 1099-DIV, and 1099-R amounts against imported PDFs to find fields that disagree with source documents.',
        },
        {
          title: 'Apply corrections',
          description:
            'Updating return inputs with source-document values and recalculating tax impact for each corrected field.',
        },
      ]
    case 'qualifiedDivClassification':
      return [
        {
          title: 'Context assessment',
          description: contextDescription,
        },
        {
          title: 'Classification check',
          description:
            'Checking Box 1b on the Token 1099-DIV against how ordinary and qualified dividends are reported on the return.',
        },
        {
          title: 'Apply corrections',
          description: 'Reclassifying dividends to match the source document and updating downstream totals.',
        },
      ]
    case 'underpaymentRisk':
      return [
        {
          title: 'Context assessment',
          description: contextDescription,
        },
        {
          title: 'Safe harbor review',
          description:
            'Running the 2024 safe-harbor withholding check and identifying missing federal withholding from source documents.',
        },
        {
          title: 'Apply corrections',
          description: 'Restoring dropped withholding amounts and updating estimated tax calculations on the return.',
        },
      ]
    case 'optItemize':
      return [
        {
          title: 'Context assessment',
          description: contextDescription,
        },
        {
          title: 'Deduction projection',
          description:
            'Reading the mortgage interest questionnaire response and comparing Schedule A against the standard deduction.',
        },
        {
          title: 'Apply corrections',
          description:
            'Entering estimated Form 1098 mortgage interest on Schedule A and updating the deduction strategy.',
        },
      ]
    default:
      return [
        {
          title: 'Context assessment',
          description: contextDescription,
        },
        {
          title: 'Validation',
          description: 'Checking the proposed fix against compliance rules and return dependencies.',
        },
        {
          title: 'Apply corrections',
          description: 'Updating return amounts and linked forms with the corrected values.',
        },
      ]
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

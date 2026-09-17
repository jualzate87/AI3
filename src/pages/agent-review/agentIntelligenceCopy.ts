import {
  issueCardToReviewModel,
  type AgentReviewCardModel,
} from '../../lib/agentDiagnosisReview'
import { computeLiveReturn, type LiveAmounts, type LiveReturnTotals, SEED_AMOUNTS } from '../../data/liveReturn'
import { REVIEWER_NAME } from '../../hooks/useSyncedReviewState'
import { buildPhase2Issues, type IssueCard } from '../data-review/AgentReportPane'
import {
  getOutstandingImportMismatches,
  getPhase2Progress,
  PHASE2_DIAGNOSTIC_ORDER,
  SAFE_HARBOR_2024,
  type Phase2IssueKey,
} from '../data-review/phase2FlagSync'

/** Client on the return under review (not the signed-in preparer). */
const CLIENT_NAME = 'Jordan Wells'
const TAX_YEAR = '2025'
const FORM_1040 = 'Form 1040'

const fmtUsd = (n: number) => `$${n.toLocaleString()}`

/* ── Shell & navigation ── */

export const INTELLIGENCE_SHELL_TITLE = 'Return review by Intuit Intelligence'

/** Panel header in DataReviewPage / AgentReportPane side rail */
export const INTELLIGENCE_PANEL_LABEL = 'Intuit Intelligence'

/** Toolbar / left-nav label paired with the Intelligence wordmark */
export const INTELLIGENCE_NAV_LABEL = 'AI review'

export const INTELLIGENCE_STEP2_TITLE = 'Intuit Intelligence'

export const INTELLIGENCE_STEP2_BANNER_TITLE = 'Step 2: Intuit Intelligence'

export const INTELLIGENCE_STEP2_WELCOME_TITLE = 'Intuit Intelligence'

export const INTELLIGENCE_CONTINUE_CTA = 'Continue to Intuit Intelligence'

export const INTELLIGENCE_READY_COACH_TITLE = 'Ready for Intuit Intelligence'

export const INTELLIGENCE_CLOSE_ARIA = 'Close AI review'

export function intelligenceToolbarAriaLabel(
  reviewed?: number,
  total?: number,
  remaining?: number,
): string {
  if (remaining != null && remaining > 0 && reviewed != null && total != null) {
    return `${INTELLIGENCE_NAV_LABEL}, ${reviewed} of ${total} reviewed, ${remaining} remaining`
  }
  return INTELLIGENCE_NAV_LABEL
}

export function intelligenceBannerProgressAriaLabel(
  reviewed: number,
  total: number,
  remaining: number,
): string {
  return `Open ${INTELLIGENCE_PANEL_LABEL} — ${reviewed} of ${total} diagnostics reviewed, ${remaining} remaining`
}

export const INTELLIGENCE_SUBHEADER_CTA = 'Review return'

export const INTELLIGENCE_CHAT_PLACEHOLDER = 'Ask about this return'

export const INTELLIGENCE_LEGAL_DISCLAIMER =
  'Important information about how we use generative AI'

/* ── Welcome ── */

export const STARTER_PROMPT_FULL_REVIEW = 'Review this return'
export const STARTER_PROMPT_CATCH_UP = 'Get me caught up on this return'

export const STARTER_PROMPTS = [
  STARTER_PROMPT_FULL_REVIEW,
  STARTER_PROMPT_CATCH_UP,
] as const

/** Preparer first name — Jordan Lee reviewing Jordan Wells's return. */
export const WELCOME_GREETING_NAME = REVIEWER_NAME.split(' ')[0] ?? 'Jordan'
export const WELCOME_GREETING_PROMPT = 'How can I help?'

/* ── CTAs & chips ── */

export const CTA_FIX_ISSUE = 'Fix issue'
export const CTA_ACCEPT_ALL_FIXES = 'Accept all fixes'
export const CTA_FIX_ONE_BY_ONE = 'Fix issues one by one'
export const CTA_VIEW_SOURCE = 'View source'

export const CTA_VIEW_UPDATED_RETURN = 'View updated return'
export const CTA_VIEW_SOURCE_DOCUMENTS = 'View source documents'
export const CTA_VIEW_RETURN_SUMMARY = 'View return summary'

export const CTA_SHOW_THINKING = 'Show thinking'

export const LABEL_SUGGESTED_NEXT_STEPS = 'Recommended next steps'
export const LABEL_NEED_ACTION = 'NEED ACTION'

/* ── Loading ── */

export const INTELLIGENCE_LOADING_TITLE = 'Reviewing the return…'
export const INTELLIGENCE_LOADING_SUBTEXT =
  'Checking source documents, Tax Organizer answers, and return entries.'

/* ── Data helpers ── */

export function getActiveIntelligenceIssues(): {
  issues: IssueCard[]
  issueCount: number
  totalWithholding: number
  live: LiveReturnTotals
} {
  const live = computeLiveReturn(SEED_AMOUNTS)
  const allIssues = buildPhase2Issues(live, SEED_AMOUNTS)
  const progress = getPhase2Progress({
    reviewedFields: new Map(),
    live,
    amounts: SEED_AMOUNTS,
  })
  const issues = PHASE2_DIAGNOSTIC_ORDER.filter(key => progress.activeKeys.includes(key))
    .map(key => allIssues.find(i => i.issueKey === key))
    .filter((i): i is IssueCard => i != null)

  return {
    issues,
    issueCount: issues.length,
    totalWithholding: live.totalWithholding,
    live,
  }
}

export function intelligenceCardTitle(issue: IssueCard, totalWithholding: number): string {
  if (issue.issueKey === 'importMismatches') {
    return 'Import mismatches found'
  }
  if (issue.issueKey === 'underpaymentRisk') {
    const shortfall = Math.max(0, SAFE_HARBOR_2024 - totalWithholding)
    return `Withholding is ${fmtUsd(shortfall)} below safe harbor`
  }
  if (issue.issueKey === 'necScheduleC') {
    return '1099-NEC income missing Schedule C'
  }
  if (issue.issueKey === 'niitForm8960') {
    return 'Confirm Form 8960 NIIT amounts'
  }
  if (issue.issueKey === 'optItemize') {
    return 'Mortgage interest may support itemizing'
  }
  return issue.title
}

export function intelligenceBadge(issue: IssueCard): { label: string; tone: 'orange' | 'green' | 'blue' } {
  switch (issue.issueKey) {
    case 'importMismatches':
      return { label: 'IMPORT MISMATCHES', tone: 'orange' }
    case 'underpaymentRisk':
      return { label: 'DEDUCTIONS', tone: 'green' }
    case 'optItemize':
      return { label: 'DEDUCTIONS', tone: 'green' }
    case 'necScheduleC':
    case 'niitForm8960':
      return { label: 'COMPLIANCE', tone: 'orange' }
    default:
      return { label: issue.category.toUpperCase(), tone: 'blue' }
  }
}

export function intelligenceIntro(issueCount: number): string {
  const issuePhrase =
    issueCount === 1 ? '1 issue' : `${issueCount} issues`
  return (
    `I found ${issuePhrase} on ${CLIENT_NAME}'s ${TAX_YEAR} ${FORM_1040} after comparing source documents, Tax Organizer answers, and return entries. ` +
    `Review each issue below, then tell me how you'd like to proceed.`
  )
}

export function intelligenceSummary(
  issueKey: Phase2IssueKey,
  live: LiveReturnTotals,
  amounts: LiveAmounts,
): string {
  const gapCount = getOutstandingImportMismatches(amounts).length
  const shortfall = Math.max(0, SAFE_HARBOR_2024 - live.totalWithholding)

  switch (issueKey) {
    case 'importMismatches':
      return gapCount === 0
        ? 'Source documents and return entries match.'
        : `${gapCount} field${gapCount === 1 ? '' : 's'} on the return ${gapCount === 1 ? "doesn't" : "don't"} match source documents. Some were marked correct during import without updating amounts, and I flagged gaps the import missed.`
    case 'underpaymentRisk':
      return (
        `Federal withholding on the return is ${fmtUsd(live.totalWithholding)}, about ${fmtUsd(shortfall)} below the ${fmtUsd(SAFE_HARBOR_2024)} safe harbor. ` +
        `${CLIENT_NAME} confirmed no estimated payments were made in the Tax Organizer, so Form 2210 penalty risk is likely until withholding is restored.`
      )
    case 'necScheduleC':
      return (
        `Summit Advisory Partners 1099-NEC income is on the return, but Schedule C and business expenses are missing. ` +
        `${CLIENT_NAME} reported software, supplies, and travel costs in the Tax Organizer.`
      )
    case 'niitForm8960':
      return (
        `Investment income is high enough that Form 8960 (Net Investment Income Tax) is on the return. ` +
        `Confirm the 3.8% NIIT calculation matches taxable interest and dividends from the 1099s before filing.`
      )
    case 'optItemize':
      return (
        `The return uses the standard deduction. ${CLIENT_NAME} reported mortgage interest in the Tax Organizer, but Form 1098 isn't uploaded yet. ` +
        `Itemizing may lower tax once you have the certificate amount.`
      )
    default:
      return ''
  }
}

export function intelligenceSuggestedFixes(issueKey: Phase2IssueKey): string[] {
  switch (issueKey) {
    case 'importMismatches':
      return [
        'Update mismatched fields to match each source document.',
        'Restore Meridian 1099-R federal withholding if Box 4 is missing on the return.',
        'Reconcile Tech Circle W-2 Box 1 wages against the uploaded PDF.',
      ]
    case 'underpaymentRisk':
      return [
        'Post 1099-R and 1099-DIV withholding shown on source documents.',
        'Compare total withholding to total tax and safe-harbor thresholds.',
        'Review Form 2210 for underpayment penalty exposure.',
      ]
    case 'necScheduleC':
      return [
        'Add Schedule C for Summit Advisory nonemployee compensation.',
        'Apply supported business expenses from the Tax Organizer.',
        'Review self-employment tax after net profit is updated.',
      ]
    case 'niitForm8960':
      return [
        'Verify Form 8960 lines against taxable interest and dividend entries.',
        'Confirm qualified vs. ordinary dividend treatment on the 1099-DIVs.',
        'Mark complete once NIIT math matches the return summary.',
      ]
    case 'optItemize':
      return [
        `Request Form 1098 from ${CLIENT_NAME} and compare itemized total to the standard deduction.`,
        'Move mortgage interest to Schedule A if itemizing reduces tax.',
        "Keep the standard deduction if itemized total doesn't exceed the threshold.",
      ]
    default:
      return []
  }
}

export function intelligenceTableRows(issue: IssueCard): IssueCard['tableRows'] {
  if (issue.issueKey !== 'importMismatches') return issue.tableRows
  return issue.tableRows.map(row => ({
    ...row,
    cols: row.cols.map((col, i) =>
      i === row.cols.length - 1 && col === 'Fix' ? CTA_VIEW_SOURCE : col,
    ),
  }))
}

export function intelligenceTableHeaders(issue: IssueCard): string[] {
  if (issue.issueKey !== 'importMismatches') return issue.tableHeaders
  const headers = [...issue.tableHeaders]
  if (headers.length > 0) headers[headers.length - 1] = 'Action'
  return headers
}

function intelligenceBadgeMeta(issue: IssueCard): Pick<
  AgentReviewCardModel,
  'badgeLabel' | 'badgeStatus' | 'badgePriority' | 'badgeCapitalization' | 'showBadgeIcon'
> {
  const badge = intelligenceBadge(issue)
  return {
    badgeLabel: badge.label,
    badgeStatus:
      badge.tone === 'orange' ? 'warning' : badge.tone === 'green' ? 'success' : 'info',
    badgePriority: 'secondary',
    badgeCapitalization: 'caps',
    showBadgeIcon: false,
  }
}

/** Figma-aligned card model — same table/layout as Check return agent feed. */
export function buildIntelligenceReviewModel(
  issue: IssueCard,
  live: LiveReturnTotals,
  amounts: LiveAmounts,
  totalWithholding: number,
): AgentReviewCardModel {
  const model = issueCardToReviewModel(issue)
  model.title = intelligenceCardTitle(issue, totalWithholding)
  model.summary = intelligenceSummary(issue.issueKey, live, amounts) || issue.summary
  model.suggestedActions = intelligenceSuggestedFixes(issue.issueKey)
  Object.assign(model, intelligenceBadgeMeta(issue))

  if (issue.issueKey === 'importMismatches') {
    model.tableHeaders = intelligenceTableHeaders(issue)
    const rows = intelligenceTableRows(issue)
    model.tableRows = rows.map((row, index) => ({
      ...model.tableRows[index],
      id: `${issue.issueKey}-${index}`,
      label: row.label,
      cols: row.cols,
      total: row.total,
    }))
  }

  return model
}

export const INTELLIGENCE_REASONING_TITLE = 'Applying fixes'

export const INTELLIGENCE_REASONING_STEPS = [
  {
    title: 'Reviewing the return',
    body: `Checking ${CLIENT_NAME}'s filing profile, which forms apply, and which updates need your sign-off.`,
  },
  {
    title: 'Planning updates',
    body: 'Matching each issue to source documents, Tax Organizer answers, and the lines or schedules to change.',
  },
  {
    title: 'Applying fixes',
    body: 'Updating return entries and preparing a summary of anything that still needs confirmation before filing.',
  },
] as const

export function intelligenceResultsLead(fixedCount: number): string {
  return fixedCount === 1
    ? "1 update applied. Here's what changed on the return."
    : `${fixedCount} updates applied. Here's what changed on the return.`
}

export const CATCH_UP_PRIOR_PREPARER = 'Sarah Chen'

export function catchUpReturnSummaryTitle(clientName: string = CLIENT_NAME): string {
  return `Return Summary — ${clientName}`
}

export const CATCH_UP_PRIOR_NOTES =
  '"Return is in good shape. I ran the AI review and resolved all flagged items — the W-2 variance was just a mid-year raise, and the qualified dividend classification has been corrected. Withholding looks adequate. Main thing to double-check is the 1099-DIV split since the broker statement formatting was a little unusual. Everything else ties out. All source docs are in the Documents tab."'

export const CATCH_UP_HANDOFF_PARAGRAPH =
  `${CATCH_UP_PRIOR_PREPARER} completed the initial data entry and ran the AI-assisted review on this return. She resolved all items flagged by Intuit Intelligence before handing off. Employer: Tech Circle Inc. Income includes W-2 wages, 1099-INT, and 1099-DIV.`

export const CATCH_UP_AI_REVIEW_INTRO =
  `${CATCH_UP_PRIOR_PREPARER} ran the Intuit Intelligence review and resolved every flagged item:`

export const CATCH_UP_AI_REVIEW_BULLETS = [
  'W-2 income variance — Resolved',
  'Box 1 wages from Tech Circle Inc differed from prior year due to a mid-year raise; confirmed with source document',
  '1099-DIV qualified dividend classification — Resolved',
  'Qualified vs. ordinary split was reclassified and corrected; amounts now match broker statement',
  'State withholding adequacy — Resolved',
  'Withholding elections reviewed against projected liability; no adjustment needed',
] as const

export const CATCH_UP_AI_REVIEW_CALLOUT =
  'All three items were flagged by Intuit Intelligence and resolved by Sarah during the initial review. No open flags remain.'

export const CATCH_UP_DOCUMENTS_INTRO =
  `${CATCH_UP_PRIOR_PREPARER} imported and verified the following source documents:`

export const CATCH_UP_DOCUMENTS_BULLETS = [
  'W-2 from Tech Circle Inc — verified (checked twice)',
  'Form 1040, line 25d — checked and reconciled',
  '1099-INT — imported',
  '1099-DIV — updated with corrected amounts',
] as const

export const CATCH_UP_CALCULATIONS_INTRO = 'Federal and state calculations are complete:'

export const CATCH_UP_CALCULATIONS_BULLETS = [
  'Federal income tax calculation — confirmed, no variances',
  'All lines tie out',
  'Return is ready for final review',
] as const

export const CATCH_UP_REVIEWER_FOCUS_INTRO = "Sarah's note calls out one area to double-check:"

export const CATCH_UP_REVIEWER_FOCUS_BULLETS = [
  '1099-DIV qualified vs. ordinary split — Sarah corrected the classification, but flagged the broker statement formatting as unusual. Verify the final amounts look right against the source PDF.',
  'Confirm all resolved AI review items look correct — spot-check that the W-2 variance explanation (mid-year raise) and withholding adequacy hold up.',
  'Review source documents in the Documents tab before approving.',
] as const

export const CATCH_UP_RETURN_STATUS_ITEMS = [
  'AI review: Complete — all items resolved by Sarah Chen',
  'Data entry: Complete — all documents imported and reconciled',
  'Calculations: Confirmed — federal and state tie out',
  'Open items: None',
  'Ready for: Final reviewer sign-off',
] as const

export const CATCH_UP_RETURN_STATUS_CALLOUT =
  "This return has been through initial prep and AI-assisted review. As the final reviewer, confirm Sarah's work is accurate and approve for filing."

export const CATCH_UP_CHECKLIST_INTRO = 'Confirm before approving:'

export const CATCH_UP_CHECKLIST_ITEMS = [
  '1099-DIV split verified against broker PDF',
  'AI review resolutions confirmed',
  'Source documents reviewed',
] as const

export const CATCH_UP_FOOTER_QUESTION =
  'Would you like to view the source documents or the full review log?'

export const CATCH_UP_CHIP_VIEW_DOCUMENTS = 'View documents'
export const CATCH_UP_CHIP_SHOW_REVIEW_LOG = 'Show review log'
export const CATCH_UP_CHIP_APPROVE_RETURN = 'Approve return'

export function intelligenceProcessingIntro(issueCount: number): string {
  const issuePhrase =
    issueCount === 1 ? '1 issue' : `${issueCount} issues`
  return (
    `You chose to accept all fixes. I'm working through ${issuePhrase} on ${CLIENT_NAME}'s ${TAX_YEAR} return now. ` +
    `Track progress on the right. I'll share a summary when I'm done.`
  )
}

export const INTELLIGENCE_PROGRESS_ITEMS = [
  { id: 'import', label: 'Match source documents' },
  { id: 'withholding', label: 'Update withholding' },
  { id: 'schedules', label: 'Update schedules' },
  { id: 'final', label: 'Prepare summary' },
] as const

export const INTELLIGENCE_SUMMARY_SECTIONS = [
  {
    title: 'Import mismatches fixed',
    items: [
      { doc: 'W-2 Tech Circle.pdf', detail: 'Wages updated to $148,940 to match source' },
      { doc: '1099-DIV Token.pdf', detail: 'Qualified dividends aligned with source' },
      { doc: '1099-R Meridian.pdf', detail: 'Federal withholding restored to $30,000' },
    ],
  },
  {
    title: 'Withholding updated',
    items: [
      { doc: '1099-R Meridian.pdf', detail: 'Withholding posted to Form 1040' },
      { doc: 'Form 2210', detail: 'Safe harbor shortfall recalculated' },
    ],
  },
  {
    title: 'Schedule A mortgage interest (estimate)',
    items: [
      { doc: 'Form 1098 (pending)', detail: 'Estimated amount added pending client certificate' },
    ],
  },
] as const

export const INTELLIGENCE_NEED_ACTION_COPY =
  `Upload or confirm ${CLIENT_NAME}'s Form 1098 before filing. The Schedule A amount is an estimate until the source certificate is on file.`

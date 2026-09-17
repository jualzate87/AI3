import type { DiagnosticIssueCard } from '../pages/data-review/AgentReportPane'
import {
  badgeMetaForIssueKey,
  getCategoryScopedActiveKeys,
} from '../pages/check-return/aiDiagnosticCategories'
import type { DiagnosticSyncContext } from '../pages/data-review/phase2FlagSync'
import type { Phase2IssueKey } from '../pages/data-review/phase2FlagSync'
import type { OutputFormId } from '../pages/data-review/outputForms'
import {
  resolveTableActionLinkLabelFromLink,
  resolveViewLinkLabel,
  type AgentViewLink,
} from './agentAutoFix'

const fmtUsd = (n: number) => `$${n.toLocaleString()}`

export type AgentReviewTableRow = {
  id: string
  label: string
  cols: string[]
  total?: boolean
  viewLink?: AgentViewLink
  /** Needs-your-review rows can be checked off by the preparer (local UI state). */
  checklist?: boolean
}

export type AgentReviewBadgePriority = 'primary' | 'secondary'

export type AgentReviewCardModel = {
  id: string
  variant: 'issue' | 'verified' | 'needs-review'
  title: string
  badgeLabel: string
  badgeStatus: 'warning' | 'success' | 'info' | 'pending' | 'neutral'
  badgePriority: AgentReviewBadgePriority
  badgeCapitalization: 'caps' | 'sentence'
  /** When true, render InfoBadgeIcon alongside text badge (Figma issue severity badges). */
  showBadgeIcon?: boolean
  summary: string
  rootCause?: string
  tableHeaders: string[]
  tableRows: AgentReviewTableRow[]
  suggestedActions?: string[]
  suggestedActionLinks?: AgentViewLink[]
  issueKey?: Phase2IssueKey
}

export function buildViewLinkFromDiagnosticRow(
  issue: DiagnosticIssueCard,
  row: DiagnosticIssueCard['tableRows'][number],
): AgentViewLink | null {
  const hasDestination =
    (row.fixTab === 'sch-a-interest' && row.fixField) ||
    row.fixTab === 'questionnaire' ||
    (row.fixField && row.fixTab) ||
    row.viewForm

  if (!hasDestination) return null

  if (row.fixTab === 'sch-a-interest' && row.fixField) {
    return {
      label: resolveViewLinkLabel(row.actionLabel, { schAInterest: true }),
      schAInterest: true,
      field: row.fixField,
      diagnostic: issue.issueKey,
    }
  }
  if (row.fixTab === 'questionnaire') {
    return {
      label: resolveViewLinkLabel(row.actionLabel, { tab: 'questionnaire' }),
      tab: 'questionnaire',
      field: row.fixField,
      questionnaireResponseId: row.questionnaireResponseId,
      diagnostic: issue.issueKey,
    }
  }
  if (row.fixField && row.fixTab) {
    return {
      label: resolveViewLinkLabel(row.actionLabel, { tab: row.fixTab }),
      tab: row.fixTab,
      field: row.fixField,
      diagnostic: issue.issueKey,
    }
  }
  if (row.viewForm) {
    return {
      label: resolveViewLinkLabel(row.actionLabel, {
        formId: row.viewForm as OutputFormId,
      }),
      formId: row.viewForm as OutputFormId,
      diagnostic: issue.issueKey,
    }
  }
  return null
}

export function issueCardToReviewModel(issue: DiagnosticIssueCard): AgentReviewCardModel {
  const tableRows: AgentReviewTableRow[] = issue.tableRows.map((row, index) => ({
    id: `${issue.issueKey}-${index}`,
    label: row.label,
    cols: row.cols,
    total: row.total,
    viewLink: buildViewLinkFromDiagnosticRow(issue, row) ?? undefined,
  }))

  const badge = badgeMetaForIssueKey(issue.issueKey)

  return {
    id: issue.issueKey,
    variant: 'issue',
    title: stripTaxImpactFromTitle(issue.title),
    ...badge,
    summary: issue.summary,
    rootCause: issue.rootCause,
    tableHeaders: issue.tableHeaders,
    tableRows,
    suggestedActions: issue.suggestedActions.slice(0, 3),
    issueKey: issue.issueKey,
  }
}

function stripTaxImpactFromTitle(title: string): string {
  if (title.startsWith('Import accuracy:')) return 'Import mismatches detected'
  return title
}

/** Checks the agent ran that passed — grouped for preparer confidence. */
export function buildVerifiedReviewCard(ctx: DiagnosticSyncContext): AgentReviewCardModel {
  const live = ctx.live

  return {
    id: 'verified-checks',
    variant: 'verified',
    title: 'Checks passed — no fixes needed',
    badgeLabel: 'VERIFIED',
    badgeStatus: 'success',
    badgePriority: 'primary',
    badgeCapitalization: 'caps',
    showBadgeIcon: false,
    summary:
      'These inputs matched source documents, prior-year patterns, or compliance rules. I did not flag them because nothing needs to change on the return.',
    rootCause:
      'What I verified: wage and withholding identity on Tech Circle W-2, Harborline 1099-INT interest, filing status consistency, SALT cap handling on Schedule A, and Form 8960 net investment income math against the 1040 totals.',
    tableHeaders: ['Verified', 'Details', 'Action'],
    tableRows: [
      {
        id: 'v-w2-wh',
        label: 'W-2 federal withholding matches Tech Circle source',
        cols: ['Box 2 on return equals $34,840 on the PDF.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ tab: 'w2s' }),
          tab: 'w2s',
          field: 'fedWithholding',
        },
      },
      {
        id: 'v-int',
        label: '1099-INT taxable interest matches Harborline source',
        cols: [`${fmtUsd(live.taxableInterest)} on return and on the 1099-INT.`, ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ tab: '1099-ints' }),
          tab: '1099-ints',
          field: 'taxableInterest',
        },
      },
      {
        id: 'v-status',
        label: 'Filing status is consistent across the return',
        cols: ['Form 1040, questionnaire, and W-2 all use Single.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ formId: '1040' }),
          formId: '1040',
        },
      },
      {
        id: 'v-salt',
        label: 'SALT cap applied correctly on Schedule A',
        cols: ['$10,000 state and local tax limit enforced on Schedule A.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ formId: 'schA' }),
          formId: 'schA',
        },
      },
      {
        id: 'v-niit',
        label: 'Net investment income tax calculates correctly on Form 8960',
        cols: [`NIIT base ${fmtUsd(live.netInvestmentIncome)} at 3.8% = ${fmtUsd(live.niitTax)}.`, ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ formId: 'f8960' }),
          formId: 'f8960',
        },
      },
      {
        id: 'v-charity',
        label: 'Charitable contributions are documented in the packet',
        cols: ['Cash gifts match organizer worksheet — no amount conflict.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ tab: 'questionnaire' }),
          tab: 'questionnaire',
          field: 'charitable',
        },
      },
      {
        id: 'v-div-1a',
        label: '1099-DIV ordinary dividends match Token source',
        cols: ['Ordinary dividend total agrees with the imported PDF.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ tab: '1099-divs' }),
          tab: '1099-divs',
          field: 'ordinaryDivs',
        },
      },
      {
        id: 'v-prior',
        label: 'Prior-year AGI matches the archived return',
        cols: ['2024 AGI on the rollover matches the archived return.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ formId: '1040' }),
          formId: '1040',
        },
      },
    ],
  }
}

/** Verified + needs-review cards — always shown for preparer/reviewer sign-off. */
export function buildPersistentReviewCallouts(ctx: DiagnosticSyncContext): AgentReviewCardModel[] {
  return [buildVerifiedReviewCard(ctx), buildNeedsUserReviewCard(ctx)]
}

/** Items the agent could not fully resolve — preparer checklist. */
export function buildNeedsUserReviewCard(_ctx: DiagnosticSyncContext): AgentReviewCardModel {
  return {
    id: 'needs-user-review',
    variant: 'needs-review',
    title: 'Needs your review',
    badgeLabel: 'YOUR REVIEW',
    badgeStatus: 'pending',
    badgePriority: 'secondary',
    badgeCapitalization: 'caps',
    showBadgeIcon: false,
    summary:
      'I could not confirm these from the packet alone. Work through the checklist with Jordan before sign-off — none of these will auto-fix.',
    rootCause:
      'Why these are open: missing documents, client-estimated amounts, or rules that need professional judgment beyond what OCR and the questionnaire captured.',
    tableHeaders: ['Item', 'Status', 'Why I flagged it', 'Action'],
    tableRows: [
      {
        id: 'r-1098',
        label: 'Form 1098 mortgage interest',
        cols: ['Document missing', 'Jordan confirmed ~$28,400 interest but no 1098 is in the import packet.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ tab: 'questionnaire' }),
          tab: 'questionnaire',
          field: 'mortgage',
        },
        checklist: true,
      },
      {
        id: 'r-schc-exp',
        label: 'Schedule C expense substantiation',
        cols: ['Needs receipts', 'Client mentioned software, home office, and travel — nothing posted yet.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ tab: 'questionnaire' }),
          tab: 'questionnaire',
          field: 'necExpenses',
        },
        checklist: true,
      },
      {
        id: 'r-charity',
        label: 'Charitable gift substantiation',
        cols: ['Review receipts', 'Gifts over $250 need written acknowledgment per IRS rules.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ tab: 'questionnaire' }),
          tab: 'questionnaire',
          field: 'charitable',
        },
        checklist: true,
      },
      {
        id: 'r-est-2026',
        label: '2026 estimated tax payments',
        cols: ['Planning conversation', 'Safe-harbor shortfall may require quarterly vouchers next year.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ formId: 'f2210' }),
          formId: 'f2210',
        },
        checklist: true,
      },
      {
        id: 'r-state',
        label: 'California residency / sourcing',
        cols: ['Not in scope', 'W-2 shows CA wages but I did not run a state return comparison.', ''],
        viewLink: {
          label: resolveTableActionLinkLabelFromLink({ inputScreens: true }),
          inputScreens: true,
        },
        checklist: true,
      },
    ],
    suggestedActions: [
      'Request the Form 1098 from Jordan before finalizing Schedule A.',
      'Collect expense receipts before claiming Schedule C deductions.',
      'Confirm charitable acknowledgments are on file for any gift over $250.',
    ],
  }
}

export type BuildAgentReviewModelsOptions = {
  /** When true, show all active agent-scoped issues regardless of reviewed state (initial diagnosis feed). */
  forDisplay?: boolean
}

export function buildAgentReviewModels(
  ctx: DiagnosticSyncContext,
  issues: DiagnosticIssueCard[],
  options?: BuildAgentReviewModelsOptions,
): AgentReviewCardModel[] {
  const activeKeys = getCategoryScopedActiveKeys(ctx)
  const openKeys = new Set(
    options?.forDisplay
      ? activeKeys
      : activeKeys.filter(key => !ctx.reviewedFields.has(key)),
  )

  const issueModels = issues
    .filter(i => openKeys.has(i.issueKey))
    .map(issue => {
      const model = issueCardToReviewModel(issue)
      if (issue.issueKey === 'importMismatches') {
        model.title = 'Import mismatches detected'
      }
      return model
    })

  return [...issueModels, buildVerifiedReviewCard(ctx)]
}

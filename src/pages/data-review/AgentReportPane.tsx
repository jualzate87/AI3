import { useState, useEffect, useRef } from 'react'
import { Close, Plus, ChevronDown, ChevronRight, CircleCheck, Send } from '@design-systems/icons'
import { Badge, SuccessBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import { ProgressBar } from '@ids-ts/progress-bar'
import '@ids-ts/progress-bar/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import compareOthersIcon from '../../assets/icons/compare-others.svg'
import federalTaxesIcon from '../../assets/icons/federal-taxes.svg'
import scannerIcon from '../../assets/icons/scanner.svg'
import IssueDetailPane, { type IssueAction, type IssueSourceCard } from './IssueDetailPane'
import Tooltip from './Tooltip'
import type { LiveAmounts, LiveReturnTotals } from '../../data/liveReturn'
import {
  NEC_SOURCE_AMOUNT,
  SEED_AMOUNTS,
  ESTIMATED_MORTGAGE_INTEREST,
  computeLiveReturn,
  computeQualifiedDivOverstatement,
  computeSepIraCeiling,
  getBlankBox12Rows,
  projectItemizedDeduction,
} from '../../data/liveReturn'
import {
  getPhase2Progress,
  getImportMismatchTaxImpact,
  getOutstandingImportMismatches,
  PHASE2_DIAGNOSTIC_ORDER,
  SAFE_HARBOR_2024,
  SOURCE_AMOUNTS,
  type Phase2IssueKey,
} from './phase2FlagSync'
import type { QuestionnaireResponseId } from './questionnaireData'
import type { TopTab } from './ReviewTab'
import styles from '../../styles/data-review/AgentReportPane.module.css'

export const TOTAL_REVIEW_ITEMS = PHASE2_DIAGNOSTIC_ORDER.length
export const GUIDED_ORDER = PHASE2_DIAGNOSTIC_ORDER
type IssueKey = Phase2IssueKey

type NavigateTab = TopTab | undefined

interface AgentReportPaneProps {
  onClose?: () => void
  onYoyToggle?: (expanded: boolean) => void
  onViewW2?: (fromSubView?: 'overview' | 'yoyDetail') => void
  onReviewSource?: () => void
  onMarkReviewed?: (fieldName: string) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  closing?: boolean
  initialSubView?: 'overview' | 'yoyDetail'
  onSubViewChange?: (subView: 'overview' | 'yoyDetail') => void
  embedded?: boolean
  total1a?: number
  wages?: { techCircle: number }
  onNavigateToTab?: (
    tab?: NavigateTab,
    subTab?: 'techCircle',
    field?: string,
    questionnaireResponseId?: QuestionnaireResponseId,
    /** preview = document source panel; details = focus/highlight Details input */
    focus?: 'preview' | 'details',
  ) => void
  onHighlightField?: (field: string | null, issueKey?: IssueKey | null) => void
  /** Fired when a diagnostic detail pane opens or closes (for output highlight sync). */
  onDiagnosticFocus?: (issueKey: IssueKey | null) => void
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
  liveTotals?: LiveReturnTotals
  amounts?: LiveAmounts
  /** Open an output form / schedule in the left panel (Sch C, 8960, …) */
  onOpenForm?: (formLabel: string) => void
  /** Primary CTA when all diagnostics reviewed - opens sign-off summary */
  onSignOff?: () => void
}

const REPORT_CARDS = [
  { label: 'Import accuracy', keys: ['importMismatches', 'qualifiedDivClassification'], badgeColor: 'red' as const, position: 'first' },
  { label: 'Compliance', keys: ['underpaymentRisk', 'necScheduleC', 'niitForm8960', 'w2Box12Missing'], badgeColor: 'orange' as const, position: 'middle' },
  { label: 'Planning opportunities', keys: ['optItemize', 'schCExpenses', 'sepIra'], badgeColor: 'blue' as const, position: 'last' },
]

const CARD_ICONS = [
  <img src={compareOthersIcon} alt="" width={20} height={20} />,
  <img src={scannerIcon} alt="" width={20} height={20} />,
  <img src={federalTaxesIcon} alt="" width={20} height={20} />,
]

const fmtUsd = (n: number) => `$${n.toLocaleString()}`

export type DiagnosticIssueCard = {
  issueKey: IssueKey
  dotColor: 'red' | 'orange' | 'blue'
  title: string
  category: string
  summary: string
  taxImpact: string
  rootCause: string
  clientResponseNote?: string
  questionnaireResponseId?: QuestionnaireResponseId
  tableRows: {
    label: string
    cols: string[]
    total?: boolean
    badge?: 'red' | 'orange' | 'grey' | 'green' | 'blue'
    fixField?: string
    fixTab?: string
    /** Override the default action link label in check-return AI review. */
    actionLabel?: string
    questionnaireResponseId?: QuestionnaireResponseId
    /** Output form holding this number, when it lives on the return rather than a source doc. */
    viewForm?: string
    viewFormLabel?: string
  }[]
  tableHeaders: string[]
  suggestedActions: string[]
  actions: IssueAction[]
  sources: IssueSourceCard[]
  /** Default destination for reviewSource / goToInput when action omits overrides */
  viewSourceTab?: NavigateTab
  viewSourceSubTab?: 'techCircle'
  viewSourceField?: string
  /** When true, goToInput highlights Summary only (no source-tab switch) */
  summaryOnlyGoToInput?: boolean
}

function buildImportMismatchesIssue(amounts: LiveAmounts): DiagnosticIssueCard {
  const gaps = getOutstandingImportMismatches(amounts)
  const first = gaps[0]
  const totalImpact = getImportMismatchTaxImpact(amounts)
  return {
    issueKey: 'importMismatches',
    dotColor: 'red',
    title:
      gaps.length === 0
        ? 'Import accuracy: no remaining input↔source gaps'
        : `${gaps.length} import mismatch${gaps.length === 1 ? '' : 'es'} worth ${fmtUsd(totalImpact)} in tax`,
    category: 'Import accuracy',
    summary:
      gaps.length === 0
        ? 'Source-document amounts and input fields match. No outstanding import accuracy gaps.'
        : `These fields still disagree with the source documents. Each row is priced so you can start with the ones that move the return most: the largest single item is ${fmtUsd(Math.round(gaps[0]?.taxImpact ?? 0))}.`,
    taxImpact:
      `Left uncorrected, these six rows change the balance due by about ${fmtUsd(totalImpact)}. Dropped withholding is dollar for dollar, missing income is taxed at 35%, and the misclassified dividends carry the ordinary-versus-qualified rate spread.`,
    rootCause:
      'Import mapped some values incorrectly and dropped others entirely. Two of these were marked correct during the import review without changing the amount, so they carried forward into the return.',
    tableRows: gaps.slice(0, 6).map((g, i) => ({
      label: g.label,
      cols: [g.returnValue, g.sourceValue, fmtUsd(Math.round(g.taxImpact)), 'Fix'],
      fixField: g.field,
      fixTab: g.tab,
      total: i === gaps.length - 1 || i === 5,
    })),
    tableHeaders: ['Field', 'On return', 'On source', 'Tax impact', ''],
    suggestedActions: [
      'Start at the top: rows are ordered by what they cost the return, not by form.',
      'Correct amounts that disagree with the source, or enter missing identity fields.',
      ...(gaps.some(g => g.id === 'taxablePension' || g.id === 'rWithholding')
        ? [
            'IRA / 1099-R tip: Box 1 is the gross distribution; Box 2a is the taxable amount that flows to Form 1040 line 4b - they often differ when basis or rollovers apply.',
            'IRA / 1099-R tip: Confirm Box 4 federal withholding is on the return; missing withholding is a common underpayment trigger.',
            'IRA / 1099-R tip: Check Box 7 distribution code (e.g. 7 = normal distribution). Early-withdrawal codes may need Form 5329.',
          ]
        : []),
    ],
    actions: gaps.length > 0
      ? [
          {
            type: 'goToInput',
            label: 'Go to mismatch',
            menuItems: gaps.map(g => ({
              label: g.label,
              tab: g.tab,
              field: g.field,
            })),
          },
        ]
      : [{ type: 'goToInput', label: 'Go to wages', tab: 'w2s', field: 'wages' }],
    sources: [
      {
        id: 'irs-accuracy',
        sourceName: 'IRS.gov',
        title: 'Check your return carefully',
        description:
          'Compare every imported amount to the paper or PDF source before filing. Common gaps include wages, withholding, and state boxes that do not belong on the form.',
        meta: 'Import accuracy',
        href: 'https://www.irs.gov/individuals/check-your-tax-return',
      },
    ],
    viewSourceTab: (first?.tab as DiagnosticIssueCard['viewSourceTab']) ?? 'w2s',
    viewSourceField: first?.field ?? 'wages',
  }
}

function buildNiitForm8960Issue(live: LiveReturnTotals): DiagnosticIssueCard {
  const nii = live.netInvestmentIncome
  const niit = live.niitTax
  return {
    issueKey: 'niitForm8960',
    dotColor: 'orange',
    title: `Net investment income tax adds ${fmtUsd(niit)}`,
    category: 'Compliance',
    summary: `${fmtUsd(nii)} of interest and dividends is subject to the 3.8% net investment income tax, which adds ${fmtUsd(niit)} on Form 8960. Worth confirming the form picks up the full base before you sign off.`,
    taxImpact: `NIIT applies to the smaller of net investment income or the amount by which modified AGI exceeds $200,000 for a single filer. Here AGI clears the threshold by a wide margin, so the full ${fmtUsd(nii)} is in the base and the tax is ${fmtUsd(nii)} × 3.8% = ${fmtUsd(niit)}.`,
    rootCause: `The base is ${fmtUsd(live.taxableInterest)} of taxable interest plus ${fmtUsd(live.ordinaryDivs)} of ordinary dividends. Note that Form 8960 uses the Box 1a ordinary dividend total, so the qualified dividend classification issue does not change this number.`,
    tableRows: [
      {
        label: 'Taxable interest',
        cols: [
          fmtUsd(live.taxableInterest),
          'Interest income that feeds the net investment income base on Form 8960.',
        ],
        fixField: 'taxableInterest',
        fixTab: '1099-ints',
      },
      {
        label: 'Ordinary dividends',
        cols: [
          fmtUsd(live.ordinaryDivs),
          'Box 1a ordinary dividends from the 1099-DIVs. Form 8960 uses this total, not the qualified portion.',
        ],
        fixField: 'ordinaryDivs',
        fixTab: '1099-divs',
      },
      {
        label: 'Net investment income',
        cols: [
          fmtUsd(nii),
          'Sum of interest and ordinary dividends that Form 8960 line 8 should match.',
        ],
        viewForm: 'f8960',
        viewFormLabel: 'Form 8960',
      },
      {
        label: 'NIIT at 3.8%',
        cols: [
          fmtUsd(niit),
          'Additional tax on net investment income because modified AGI exceeds the $200,000 single filer threshold.',
        ],
        viewForm: 'f8960',
        viewFormLabel: 'Form 8960',
        total: true,
      },
    ],
    tableHeaders: ['Item', 'Amount', 'What this means', 'Action'],
    suggestedActions: [
      'Open Form 8960 and confirm line 8 equals the interest and ordinary dividend totals on the 1040.',
      'Watch the interaction: any deductible retirement contribution lowers AGI and can reduce the NIIT base as well.',
      'Confirm no investment interest expense or state tax allocation is available to reduce line 9.',
    ],
    actions: [
      {
        type: 'openForm',
        label: 'Open Form 8960',
      },
      {
        type: 'goToInput',
        label: 'Go to investment income',
        field: 'ordinaryDivs',
        menuItems: [
          { label: 'Taxable interest (1099-INT)', tab: '1099-ints', field: 'taxableInterest' },
          { label: 'Ordinary dividends (1099-DIV)', tab: '1099-divs', field: 'ordinaryDivs' },
          { label: 'Qualified dividends (1099-DIV)', tab: '1099-divs', field: 'qualifiedDivs' },
          { label: 'Summary - investment lines', field: 'ordinaryDivs', summaryOnly: true },
        ],
      },
    ],
    sources: [
      {
        id: 'irs-form-8960',
        sourceName: 'Form 8960',
        title: 'Net Investment Income Tax (NIIT)',
        description:
          'Individuals with modified AGI above the filing-status threshold may owe an additional 3.8% tax on net investment income. Form 8960 computes that tax when interest, dividends, and other NII apply.',
        meta: 'IRS.gov · About Form 8960',
        href: 'https://www.irs.gov/forms-pubs/about-form-8960',
      },
    ],
    // Summary CY investment lines only - never prior-1040
    viewSourceField: 'ordinaryDivs',
    summaryOnlyGoToInput: false,
  }
}

function buildUnderpaymentRiskIssue(live: LiveReturnTotals): DiagnosticIssueCard {
  const shortfall = Math.max(0, SAFE_HARBOR_2024 - live.totalWithholding)
  return {
    issueKey: 'underpaymentRisk',
    dotColor: 'orange',
    title: `Withholding falls ${fmtUsd(shortfall)} short of safe harbor`,
    category: 'Compliance',
    summary: `Most of this gap is an import artifact, not a client behavior problem: the Meridian 1099-R reports $30,000 of federal withholding in Box 4 and none of it reached the return. Fix that first, then decide what remains.`,
    taxImpact: `Safe harbor for 2025 is ${fmtUsd(SAFE_HARBOR_2024)}, which is 110% of last year's tax. The return shows ${fmtUsd(live.totalWithholding)}. Restoring the dropped ${fmtUsd(30_000)} and correcting the dividend withholding still leaves ${fmtUsd(Math.max(0, shortfall - 31_438))} uncovered, so Form 2210 is required to calculate the underpayment penalty before filing.`,
    rootCause: `Two separate causes stack here. Import dropped the entire 1099-R Box 4 withholding, and separately Jessica made no quarterly 1040-ES payments because she assumed withholding would cover the year as usual. Her income rose sharply, so it did not.`,
    clientResponseNote:
      'Jessica Drake (Mar 2, 2025): "No. I didn\'t make any estimated payments this year. I figured my W-2 and 1099 withholding would cover everything like usual."',
    questionnaireResponseId: 'estimatedPayments',
    tableRows: [
      {
        label: 'Safe harbor required (110% of 2024 tax)',
        cols: [
          fmtUsd(SAFE_HARBOR_2024),
          'Minimum total payments for 2025 to avoid an underpayment penalty when last year\'s tax was high.',
        ],
        viewForm: '1040',
        viewFormLabel: 'Form 1040',
      },
      {
        label: 'Withholding on return today',
        cols: [
          fmtUsd(live.totalWithholding),
          'Federal income tax withheld currently on lines 25a and 25b. This is what the return credits against the year\'s tax.',
        ],
        viewForm: '1040',
        viewFormLabel: 'Form 1040',
      },
      {
        label: '1099-R Box 4 dropped on import',
        cols: [
          fmtUsd(30_000),
          'The Meridian 1099-R reports this federal withholding in Box 4, but import never posted it to the return.',
        ],
        fixField: 'withholding1099',
        fixTab: '1099-rs',
      },
      {
        label: '2025 estimated payments',
        cols: [
          '$0',
          'Jessica confirmed she made no quarterly estimated payments and expected withholding to cover the year.',
        ],
        fixTab: 'questionnaire',
      },
      {
        label: 'Shortfall after both corrections',
        cols: [
          fmtUsd(Math.max(0, shortfall - 31_438)),
          'Remaining gap after restoring the dropped 1099-R withholding and fixing dividend withholding. Form 2210 is required to calculate the penalty.',
        ],
        viewForm: 'f2210',
        viewFormLabel: 'Form 2210',
        total: true,
      },
    ],
    tableHeaders: ['Item', 'Amount', 'What this means', 'Action'],
    suggestedActions: [
      'Restore the Meridian 1099-R Box 4 withholding first: it is the single largest correction and it is already on the source document.',
      `Complete Form 2210: the ${fmtUsd(Math.max(0, shortfall - 31_438))} shortfall after corrections requires an underpayment penalty calculation before filing.`,
      'Then set up 2026 quarterly payments with Jessica so this does not repeat at the higher income level.',
    ],
    actions: [
      { type: 'goToInput', label: 'Go to DIV withholding', tab: '1099-divs', field: 'fedTaxWithheld' },
      { type: 'goToInput', label: 'Go to 1099-R withholding', tab: '1099-rs', field: 'withholding1099' },
      { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'estimatedPayments' },
      {
        type: 'openForm',
        label: 'Open Form 2210',
      },
    ],
    sources: [
      {
        id: 'irs-form-2210',
        sourceName: 'Form 2210',
        title: 'Underpayment of Estimated Tax by Individuals',
        description:
          'Taxpayers generally must pay tax as they earn income through withholding or estimated payments. Form 2210 figures the underpayment penalty when payments fall short of safe-harbor rules.',
        meta: 'IRS.gov · About Form 2210',
        href: 'https://www.irs.gov/forms-pubs/about-form-2210',
      },
    ],
    viewSourceTab: '1099-divs',
    viewSourceField: 'fedTaxWithheld',
  }
}

function buildNecScheduleCIssue(): DiagnosticIssueCard {
  return {
    issueKey: 'necScheduleC',
    dotColor: 'orange',
    title: `${fmtUsd(NEC_SOURCE_AMOUNT)} of 1099-NEC income is not on the return`,
    category: 'Compliance',
    summary: `The Summit Advisory Partners 1099-NEC is in the packet, but neither the income nor a Schedule C reached the return. The IRS already has a copy of this form, so a mismatch here is the kind that generates a CP2000 notice.`,
    taxImpact: `Adding ${fmtUsd(NEC_SOURCE_AMOUNT)} of nonemployee compensation triggers income tax at 35% plus self-employment tax on 92.35% of net profit, roughly ${fmtUsd(Math.round(NEC_SOURCE_AMOUNT * 0.4665))} before any expenses. It also creates the Schedule C that the expense and retirement items depend on.`,
    rootCause: `Import read the 1099-NEC but never mapped Box 1 onto a business schedule, so the income silently landed nowhere. Nothing on the return flags it because a missing form looks identical to a form that does not exist.`,
    clientResponseNote:
      'Jessica Drake (Mar 5, 2025): "Yes. I had expenses for software, home office supplies, and some travel. Nothing for expenses is on the return yet."',
    questionnaireResponseId: 'necExpenses',
    tableRows: [
      {
        label: '1099-NEC Box 1 on source',
        cols: [
          fmtUsd(NEC_SOURCE_AMOUNT),
          'Nonemployee compensation on the Summit Advisory 1099-NEC that the IRS already received.',
        ],
        fixField: 'nec-box1',
        fixTab: '1099-necs',
      },
      {
        label: 'Amount on the return',
        cols: [
          '$0',
          'No NEC income is posted anywhere on the return yet, so the IRS copy will not match.',
        ],
        viewForm: 'schC',
        viewFormLabel: 'Schedule C',
      },
      {
        label: 'Schedule C',
        cols: [
          'Not created',
          'A Schedule C is required to report this self-employment income and any related expenses.',
        ],
        viewForm: 'schC',
        viewFormLabel: 'Schedule C',
      },
      {
        label: 'Income plus SE tax when added',
        cols: [
          fmtUsd(Math.round(NEC_SOURCE_AMOUNT * 0.4665)),
          'Rough combined cost of income tax at 35% plus self-employment tax before any expenses.',
        ],
        viewForm: 'sch1',
        viewFormLabel: 'Schedule 1',
        total: true,
      },
    ],
    tableHeaders: ['Item', 'Amount', 'What this means', 'Action'],
    suggestedActions: [
      'Post the 1099-NEC Box 1 amount and let the return create Schedule C.',
      'Matching tip: the IRS receives its own copy of every 1099-NEC, so omitted amounts surface through automated underreporter matching rather than audit.',
      'Once the schedule exists, work the expense and retirement contribution items that depend on it.',
    ],
    actions: [
      { type: 'goToInput', label: 'Go to NEC income', tab: '1099-necs', field: 'nec-box1' },
      { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'necExpenses' },
      {
        type: 'openForm',
        label: 'Open Schedule C',
      },
    ],
    sources: [
      {
        id: 'irs-schedule-c',
        sourceName: 'Schedule C',
        title: 'Profit or Loss From Business (Sole Proprietorship)',
        description:
          'Self-employment and nonemployee compensation generally belong on Schedule C. Ordinary and necessary business expenses (software, supplies, travel) reduce net profit and self-employment tax.',
        meta: 'IRS.gov · About Schedule C',
        href: 'https://www.irs.gov/forms-pubs/about-schedule-c-form-1040',
      },
    ],
    viewSourceTab: '1099-necs',
    viewSourceField: 'nec-box1',
  }
}

function buildOptItemizeIssue(amounts: LiveAmounts): DiagnosticIssueCard {
  const enteredMortgage = amounts.mortgageInterest
  const mortgageForProjection =
    enteredMortgage > 0 ? enteredMortgage : ESTIMATED_MORTGAGE_INTEREST
  const p = projectItemizedDeduction(amounts, mortgageForProjection)
  const scheduleABase = p.saltTaxes + p.charitableContributions
  const mortgageDisplay =
    enteredMortgage > 0
      ? fmtUsd(enteredMortgage)
      : `${fmtUsd(ESTIMATED_MORTGAGE_INTEREST)} (estimate)`

  return {
    issueKey: 'optItemize',
    dotColor: 'blue',
    title: `Missing Form 1098 is likely worth ${fmtUsd(p.taxSaved)}`,
    category: 'Planning opportunities',
    summary: `The return takes the ${fmtUsd(p.stdDeduction)} standard deduction, but Jordan confirmed about ${fmtUsd(ESTIMATED_MORTGAGE_INTEREST)} in mortgage interest and never uploaded the 1098. At that estimate, Schedule A clears the standard deduction by a wide margin.`,
    taxImpact: `Using ${fmtUsd(mortgageForProjection)} of interest, Schedule A totals ${fmtUsd(p.itemizedTotal)} against a ${fmtUsd(p.stdDeduction)} standard deduction. That is ${fmtUsd(p.advantage)} of additional deduction, worth about ${fmtUsd(p.taxSaved)} at a 35% marginal rate.`,
    rootCause: `The 1098 is not in the import packet, so nothing populated Schedule A and the return defaulted to the standard deduction. SALT and charitable gifts on file (${fmtUsd(p.saltTaxes)} + ${fmtUsd(p.charitableContributions)}) are not enough on their own — mortgage interest is what makes itemizing win.`,
    clientResponseNote:
      'Jessica Drake (Feb 28, 2025): "Yes. I own my home and paid mortgage interest in 2025. I think I got a Form 1098 from my lender but I haven\'t uploaded it yet."',
    questionnaireResponseId: 'mortgage',
    tableRows: [
      {
        label: 'Schedule A from inputs today',
        cols: [
          fmtUsd(scheduleABase),
          enteredMortgage > 0
            ? `SALT ${fmtUsd(p.saltTaxes)} + charitable ${fmtUsd(p.charitableContributions)} + mortgage ${fmtUsd(enteredMortgage)} on the return.`
            : `SALT ${fmtUsd(p.saltTaxes)} + charitable ${fmtUsd(p.charitableContributions)} on the return; mortgage interest is still $0.`,
        ],
        viewForm: 'schA',
        viewFormLabel: 'Schedule A',
        actionLabel: 'View Schedule A',
      },
      {
        label: 'Mortgage interest (client declared)',
        cols: [
          mortgageDisplay,
          enteredMortgage > 0
            ? `Posted on Schedule A line 8a from the Form 1098 amount you entered.`
            : `Jordan confirmed ${fmtUsd(ESTIMATED_MORTGAGE_INTEREST)} mortgage interest in the questionnaire.`,
        ],
        ...(enteredMortgage === 0
          ? {
              fixTab: 'questionnaire',
              fixField: 'mortgage',
              actionLabel: 'View source',
            }
          : {}),
      },
      {
        label: 'Projected Schedule A total',
        cols: [
          fmtUsd(p.itemizedTotal),
          `${fmtUsd(scheduleABase)} + ${fmtUsd(mortgageForProjection)} = ${fmtUsd(p.itemizedTotal)}. Beats the ${fmtUsd(p.stdDeduction)} standard deduction by ${fmtUsd(p.advantage)}.`,
        ],
        viewForm: 'schA',
        viewFormLabel: 'Schedule A',
        actionLabel: 'View Schedule A',
      },
      {
        label: 'Estimated federal tax saved',
        cols: [
          fmtUsd(p.taxSaved),
          `${fmtUsd(p.advantage)} extra deduction × 35% marginal rate.`,
        ],
        viewForm: '1040',
        viewFormLabel: 'Form 1040',
        total: true,
        actionLabel: 'View on Form 1040',
      },
    ],
    tableHeaders: ['Calculation', 'Amount', 'Projection', 'Action'],
    suggestedActions:
      enteredMortgage > 0
        ? [
            `Schedule A now totals ${fmtUsd(p.itemizedTotal)} — confirm line 8a and the itemized total before sign-off.`,
            `Switching from the standard deduction saves about ${fmtUsd(p.taxSaved)} on this return.`,
          ]
        : [
            'Enter the mortgage interest amount from Jordan\'s Form 1098 in the input section below.',
            `Adding mortgage interest projects Schedule A at ${fmtUsd(p.itemizedTotal)} — about ${fmtUsd(p.taxSaved)} in federal tax saved.`,
            'Open Schedule A to confirm the itemized total before you sign off.',
          ],
    actions:
      enteredMortgage > 0
        ? [
            { type: 'openForm', label: 'Open Schedule A' },
            { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'mortgage' },
          ]
        : [
            {
              type: 'goToInput',
              label: 'View on input screen',
              tab: 'sch-a-interest',
              field: 'mortgage1098',
            },
            {
              type: 'openForm',
              label: 'Open Schedule A',
            },
            { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'mortgage' },
          ],
    sources: [
      {
        id: 'irs-topic-501',
        sourceName: 'Tax Topic 501',
        title: 'Should I itemize?',
        description:
          'Compare the standard deduction to itemized amounts such as mortgage interest, state and local taxes, and charitable gifts. If itemized deductions are higher, Schedule A usually produces a lower tax.',
        meta: 'IRS.gov · Topic 501',
        href: 'https://www.irs.gov/taxtopics/tc501',
      },
    ],
    viewSourceField: 'stdDeduction',
    summaryOnlyGoToInput: true,
  }
}

function buildQualifiedDivClassificationIssue(amounts: LiveAmounts): DiagnosticIssueCard {
  const { overstated, taxDelta } = computeQualifiedDivOverstatement(amounts)
  return {
    issueKey: 'qualifiedDivClassification',
    dotColor: 'red',
    title: `${fmtUsd(overstated)} of dividends taxed at the wrong rate`,
    category: 'Import accuracy',
    summary: `The Token Financial 1099-DIV reports ${fmtUsd(SOURCE_AMOUNTS.qualifiedDivsToken)} in Box 1b, but the return carries ${fmtUsd(amounts.qualifiedDivsToken)}. The extra ${fmtUsd(overstated)} is ordinary dividend income being taxed at the qualified rate.`,
    taxImpact: `At this income level qualified dividends are taxed at 20% and ordinary dividends at 35%. Reclassifying the ${fmtUsd(overstated)} raises tax by about ${fmtUsd(taxDelta)}. Because Box 1a is correct, total income does not change, which is why no total-income check catches this.`,
    rootCause:
      'Import copied the Box 1a ordinary dividend total into Box 1b instead of the smaller qualified figure printed on the 1099-DIV. Box 1b can never exceed Box 1a, and here it was set equal to it.',
    tableRows: [
      {
        label: 'Box 1a ordinary dividends (Token)',
        cols: [
          fmtUsd(amounts.ordinaryDivsToken),
          'Total ordinary dividends on the 1099-DIV. This amount matches the source document.',
        ],
        fixField: 'ordinaryDivs',
        fixTab: '1099-divs',
      },
      {
        label: 'Box 1b qualified dividends on return',
        cols: [
          fmtUsd(amounts.qualifiedDivsToken),
          'Qualified dividends on the return are overstated because import copied the Box 1a total into Box 1b.',
        ],
        fixField: 'qualifiedDivs',
        fixTab: '1099-divs',
      },
      {
        label: 'Box 1b qualified dividends on source',
        cols: [
          fmtUsd(SOURCE_AMOUNTS.qualifiedDivsToken),
          'Correct qualified dividend amount printed in Box 1b on the Token 1099-DIV.',
        ],
        fixField: 'qualifiedDivs',
        fixTab: '1099-divs',
      },
      {
        label: 'Additional tax when corrected',
        cols: [
          fmtUsd(taxDelta),
          'Extra tax from reclassifying the overstated amount at the 15 point spread between ordinary and qualified rates.',
        ],
        viewForm: '1040',
        viewFormLabel: 'Form 1040',
        total: true,
      },
    ],
    tableHeaders: ['Item', 'Amount', 'What this means', 'Action'],
    suggestedActions: [
      'Open the Token 1099-DIV and read Box 1b directly off the form.',
      'Correct Box 1b: qualified dividends are a subset of Box 1a, never equal to it here.',
      'Re-check Form 8960 afterward, since net investment income uses the Box 1a total and does not change.',
    ],
    actions: [
      { type: 'goToInput', label: 'Go to qualified dividends', tab: '1099-divs', field: 'qualifiedDivs' },
      { type: 'reviewSource', label: 'View 1099-DIV source', tab: '1099-divs' },
    ],
    sources: [
      {
        id: 'irs-qualified-dividends',
        sourceName: 'Publication 550',
        title: 'Qualified dividends and the holding period test',
        description:
          'Qualified dividends are the portion of ordinary dividends that meet holding period and payer requirements. They appear in Box 1b of Form 1099-DIV and are always less than or equal to the Box 1a ordinary dividend total.',
        meta: 'IRS.gov · Publication 550',
        href: 'https://www.irs.gov/publications/p550',
      },
    ],
    viewSourceTab: '1099-divs',
    viewSourceField: 'qualifiedDivs',
  }
}

function buildW2Box12Issue(amounts: LiveAmounts): DiagnosticIssueCard {
  const blanks = getBlankBox12Rows(amounts)
  const codes = blanks.map(b => b.code).join(', ')
  return {
    issueKey: 'w2Box12Missing',
    dotColor: 'orange',
    title: `W-2 Box 12 imported ${blanks.length} code${blanks.length === 1 ? '' : 's'} without amounts`,
    category: 'Compliance',
    summary: `The Tech Circle W-2 shows Box 12 code${blanks.length === 1 ? '' : 's'} ${codes}, but every amount came across blank. Code AA in particular tells you how much Jessica put into her Roth 401(k), which is the input for the contribution headroom question.`,
    taxImpact:
      'Blank Box 12 amounts do not change tax on their own, but they remove the evidence behind Box 1 and Box 13. Code C is taxable group-term life already inside Box 1 wages, so a blank amount makes the wage mismatch harder to reconcile, and a blank code AA leaves retirement contribution room unquantified.',
    rootCause:
      'Import read the Box 12 code letters from the W-2 but not the paired dollar amounts. This is a common OCR failure on the stacked Box 12 grid, and nothing on the return flags it because a blank amount is treated as zero.',
    tableRows: [
      ...blanks.map(b => ({
        label: `Box 12${b.slot} · Code ${b.code}`,
        cols: [
          'Blank',
          `${b.meaning}. Import read the code letter but not the dollar amount from the W-2.`,
        ],
        fixField: 'box12',
        fixTab: 'w2s',
      })),
      {
        label: 'Box 13 retirement plan',
        cols: [
          'Checked',
          'Retirement plan box matches Jessica\'s answer that she participates in a workplace plan.',
        ],
        viewForm: '1040',
        viewFormLabel: 'Form 1040',
        total: true,
      },
    ],
    tableHeaders: ['Item', 'Amount', 'What this means', 'Action'],
    suggestedActions: [
      'Open the W-2 preview and key the Box 12 amounts from the printed form.',
      'Code AA feeds the retirement contribution review: capture it before evaluating additional contribution room.',
      'Confirm the code C amount is already inside Box 1 wages once the wage mismatch is corrected.',
    ],
    actions: [
      { type: 'goToInput', label: 'Go to Box 12', tab: 'w2s', field: 'box12' },
      { type: 'reviewSource', label: 'View W-2 source', tab: 'w2s' },
      { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'workplacePlan' },
    ],
    sources: [
      {
        id: 'irs-w2-box12',
        sourceName: 'Form W-2 instructions',
        title: 'Box 12 codes and what each reports',
        description:
          'Box 12 reports items such as elective deferrals, designated Roth contributions, and employer-sponsored health coverage. Each code carries a dollar amount that supports the wage, deferral, and coverage figures elsewhere on the return.',
        meta: 'IRS.gov · General Instructions for Forms W-2 and W-3',
        href: 'https://www.irs.gov/instructions/iw2w3',
      },
    ],
    questionnaireResponseId: 'workplacePlan',
    viewSourceTab: 'w2s',
    viewSourceField: 'box12',
  }
}

function buildSchCExpensesIssue(live: LiveReturnTotals): DiagnosticIssueCard {
  const grossProfit = live.schCGross || NEC_SOURCE_AMOUNT
  return {
    issueKey: 'schCExpenses',
    dotColor: 'blue',
    title: 'Client-confirmed business expenses are not on Schedule C',
    category: 'Planning opportunities',
    summary:
      'Jessica told us in writing that the Summit consulting work had software, home office, and travel costs. None of it is on the return. Every dollar she substantiates is worth roughly 50 cents back.',
    taxImpact: `Schedule C expenses reduce both income tax at 35% and self-employment tax on 92.35% of profit, so the combined benefit is about 47 cents on the dollar. Against ${fmtUsd(grossProfit)} of gross receipts, even a modest $6,000 of documented expenses saves close to ${fmtUsd(Math.round(6_000 * 0.4665))}.`,
    rootCause:
      'The import packet has no receipts or expense schedule, so nothing populated Schedule C Part II. The client flagged the costs herself but said she does not have a clean receipt packet yet, which is why this needs a request rather than a data fix.',
    clientResponseNote:
      'Jessica Drake (Mar 5, 2025): "Yes. I had expenses for software, home office supplies, and some travel for that consulting work. I don\'t have a clean receipt packet yet and I\'m not sure what\'s deductible."',
    questionnaireResponseId: 'necExpenses',
    tableRows: [
      {
        label: 'Schedule C gross receipts',
        cols: [
          fmtUsd(grossProfit),
          'Consulting income that should flow to Schedule C line 1 once the 1099-NEC is posted.',
        ],
        viewForm: 'schC',
        viewFormLabel: 'Schedule C',
      },
      {
        label: 'Expenses on return',
        cols: [
          '$0',
          'Jessica confirmed software, home office, and travel costs, but nothing is on Schedule C line 28 yet.',
        ],
        viewForm: 'schC',
        viewFormLabel: 'Schedule C',
      },
      {
        label: 'Benefit per $1,000 substantiated',
        cols: [
          fmtUsd(467),
          'Combined income tax and self-employment tax savings for each $1,000 of documented business expenses.',
        ],
        viewForm: 'schC',
        viewFormLabel: 'Schedule C',
        total: true,
      },
    ],
    tableHeaders: ['Item', 'Amount', 'What this means', 'Action'],
    suggestedActions: [
      'Send a targeted request: software subscriptions, home office square footage, and mileage or travel receipts.',
      'Home office tip: the simplified method allows $5 per square foot up to 300 square feet, which avoids a full Form 8829 workup.',
      'Enter the substantiated total on Schedule C line 28 and confirm the self-employment tax recalculates.',
    ],
    actions: [
      { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'necExpenses' },
      { type: 'openForm', label: 'Open Schedule C' },
    ],
    sources: [
      {
        id: 'irs-pub-535',
        sourceName: 'Publication 535',
        title: 'Deducting business expenses',
        description:
          'A business expense must be both ordinary and necessary to be deductible. Software, supplies, and business travel for a sole proprietorship are deducted on Schedule C and reduce both income tax and self-employment tax.',
        meta: 'IRS.gov · Business Expenses',
        href: 'https://www.irs.gov/publications/p535',
      },
    ],
    viewSourceTab: '1099-necs',
    viewSourceField: 'nec-box1',
  }
}

function buildSepIraIssue(live: LiveReturnTotals): DiagnosticIssueCard {
  const netProfit = live.schCNetProfit || NEC_SOURCE_AMOUNT
  const { netEarnings, contribution, taxSaved } = computeSepIraCeiling(netProfit)
  return {
    issueKey: 'sepIra',
    dotColor: 'blue',
    title: `SEP-IRA could absorb about ${fmtUsd(contribution)} of consulting profit`,
    category: 'Planning opportunities',
    summary: `The Summit consulting income creates self-employment earnings that a SEP-IRA can shelter. At current profit the ceiling is roughly ${fmtUsd(contribution)}, worth about ${fmtUsd(taxSaved)} in federal tax, and the account can be opened and funded up to the extended filing deadline.`,
    taxImpact: `A SEP contribution is an above-the-line deduction, so it reduces AGI as well as taxable income. Lowering AGI also trims the Form 8960 base, which matters because this return is already well past the $200,000 NIIT threshold.`,
    rootCause: `Self-employed SEP contributions are capped at 20% of net earnings from self-employment, which is ${fmtUsd(netEarnings)} here. Nothing on the return indicates an existing SEP, SIMPLE, or solo 401(k) for this business.`,
    tableRows: [
      {
        label: 'Schedule C net profit',
        cols: [
          fmtUsd(netProfit),
          'Net profit from consulting that determines how much can go into a SEP-IRA.',
        ],
        viewForm: 'schC',
        viewFormLabel: 'Schedule C',
      },
      {
        label: 'Net earnings from self-employment',
        cols: [
          fmtUsd(netEarnings),
          '92.35% of net profit. This is the base for the 20% SEP contribution limit.',
        ],
        viewForm: 'schC',
        viewFormLabel: 'Schedule C',
      },
      {
        label: 'Maximum SEP contribution',
        cols: [
          fmtUsd(contribution),
          'Highest deductible SEP contribution at 20% of net earnings from self-employment.',
        ],
        viewForm: 'sch1',
        viewFormLabel: 'Schedule 1',
      },
      {
        label: 'Estimated federal tax saved',
        cols: [
          fmtUsd(taxSaved),
          'Federal tax reduction from the above-the-line SEP deduction at 35%.',
        ],
        viewForm: 'sch1',
        viewFormLabel: 'Schedule 1',
        total: true,
      },
    ],
    tableHeaders: ['Item', 'Amount', 'What this means', 'Action'],
    suggestedActions: [
      'Confirm she has no existing SEP, SIMPLE, or solo 401(k) tied to the consulting work before recommending a contribution.',
      'Ruled out: a deductible traditional IRA does not help here. Box 13 confirms workplace plan coverage and AGI is far above the deduction phase-out, and a Roth IRA is closed off by the same income.',
      'Note that the SEP ceiling moves with Schedule C profit, so settle the expense question first and compute the contribution last.',
    ],
    actions: [
      { type: 'viewClientResponse', label: 'View client response', questionnaireResponseId: 'workplacePlan' },
      { type: 'openForm', label: 'Open Schedule C' },
    ],
    sources: [
      {
        id: 'irs-sep-plans',
        sourceName: 'Publication 560',
        title: 'Retirement plans for small business (SEP, SIMPLE, and qualified plans)',
        description:
          'A self-employed taxpayer may deduct contributions to a SEP-IRA up to 20% of net earnings from self-employment. The plan can be established and funded as late as the due date of the return, including extensions.',
        meta: 'IRS.gov · Publication 560',
        href: 'https://www.irs.gov/publications/p560',
      },
    ],
    questionnaireResponseId: 'workplacePlan',
    viewSourceTab: '1099-necs',
    viewSourceField: 'nec-box1',
  }
}

export const ISSUE_FIELD: Partial<Record<IssueKey, string>> = {
  importMismatches: 'wages',
  qualifiedDivClassification: 'qualifiedDivs',
  niitForm8960: 'ordinaryDivs',
  underpaymentRisk: 'fedTaxWithheld',
  necScheduleC: 'nec-box1',
  w2Box12Missing: 'box12',
  optItemize: 'stdDeduction',
  schCExpenses: 'nec-box1',
  sepIra: 'nec-box1',
}

export function buildAllDiagnosticIssues(live: LiveReturnTotals, amounts: LiveAmounts): DiagnosticIssueCard[] {
  return [
    buildImportMismatchesIssue(amounts),
    buildQualifiedDivClassificationIssue(amounts),
    buildUnderpaymentRiskIssue(live),
    buildNecScheduleCIssue(),
    buildNiitForm8960Issue(live),
    buildW2Box12Issue(amounts),
    buildOptItemizeIssue(amounts),
    buildSchCExpensesIssue(live),
    buildSepIraIssue(live),
  ]
}

export default function AgentReportPane({
  onClose,
  onYoyToggle,
  onMarkReviewed,
  reviewedFields = new Map(),
  closing = false,
  embedded = false,
  onNavigateToTab,
  onHighlightField,
  onDiagnosticFocus,
  liveTotals,
  amounts = SEED_AMOUNTS,
  onOpenForm,
  onSignOff,
}: AgentReportPaneProps) {
  const live = liveTotals ?? computeLiveReturn(amounts)
  const ALL_ISSUES = buildAllDiagnosticIssues(live, amounts)
  const phase2Progress = getPhase2Progress({ reviewedFields, live, amounts })
  const activeOrder = phase2Progress.activeKeys
  const reviewedCount = phase2Progress.reviewed
  const totalActive = phase2Progress.total
  const remainingCount = phase2Progress.remaining
  const progressPct = totalActive === 0 ? 100 : Math.round((reviewedCount / totalActive) * 100)
  const allReviewed = phase2Progress.complete
  const [showCompletion, setShowCompletion] = useState(false)
  const prevAllReviewed = useRef(false)
  const [inputValue, setInputValue] = useState('')
  const [expandedCard, setExpandedCard] = useState<string | null>('Filing stoppers')
  const [issueDetailOpen, setIssueDetailOpen] = useState<string | null>(null)
  const [issueDetailClosing, setIssueDetailClosing] = useState(false)

  const handleSend = () => {
    if (!inputValue.trim()) return
    setInputValue('')
  }

  useEffect(() => {
    if (allReviewed && !prevAllReviewed.current) {
      const t = setTimeout(() => {
        setIssueDetailOpen(null)
        onHighlightField?.(null, null)
        onDiagnosticFocus?.(null)
        setShowCompletion(true)
      }, 600)
      return () => clearTimeout(t)
    }
    prevAllReviewed.current = allReviewed
  }, [allReviewed, onHighlightField, onDiagnosticFocus])

  const resolveHighlightField = (key: string): string | null => {
    const issue = getIssueConfig(key)
    if (key === 'importMismatches') {
      const first = getOutstandingImportMismatches(amounts)[0]
      return first?.field ?? ISSUE_FIELD[key as IssueKey] ?? null
    }
    return issue?.viewSourceField ?? ISSUE_FIELD[key as IssueKey] ?? null
  }

  useEffect(() => {
    if (issueDetailOpen && !activeOrder.includes(issueDetailOpen as IssueKey)) {
      setIssueDetailOpen(null)
      onHighlightField?.(null, null)
      onDiagnosticFocus?.(null)
    }
  }, [activeOrder, issueDetailOpen, onHighlightField, onDiagnosticFocus])

  const openDetail = (key: string) => {
    const field = resolveHighlightField(key)
    onHighlightField?.(field, key as IssueKey)
    onDiagnosticFocus?.(key as IssueKey)
    setIssueDetailOpen(key)
  }

  const handleCloseIssueDetail = () => {
    setIssueDetailClosing(true)
    onHighlightField?.(null, null)
    onDiagnosticFocus?.(null)
    setTimeout(() => { setIssueDetailOpen(null); setIssueDetailClosing(false) }, 200)
  }

  const handleNext = (currentKey: string) => {
    const idx = activeOrder.indexOf(currentKey as IssueKey)
    const nextKey = idx >= 0 && idx < activeOrder.length - 1 ? activeOrder[idx + 1] : null
    if (nextKey) {
      handleCloseIssueDetail()
      setTimeout(() => openDetail(nextKey), 220)
    } else {
      handleCloseIssueDetail()
      setTimeout(() => setShowCompletion(true), 220)
    }
  }

  const handlePrev = (currentKey: string) => {
    const idx = activeOrder.indexOf(currentKey as IssueKey)
    const prevKey = idx > 0 ? activeOrder[idx - 1] : null
    if (!prevKey) return
    handleCloseIssueDetail()
    setTimeout(() => openDetail(prevKey), 220)
  }

  const isLastIssue = (key: string) => activeOrder.indexOf(key as IssueKey) === activeOrder.length - 1
  const isFirstIssue = (key: string) => activeOrder.indexOf(key as IssueKey) === 0

  const handleCardClick = (label: string) => {
    setExpandedCard(prev => {
      const next = prev === label ? null : label
      onYoyToggle?.(false)
      return next
    })
  }

  const getIssueConfig = (key: string) => ALL_ISSUES.find(i => i.issueKey === key) ?? null
  const activeIssue = issueDetailOpen ? getIssueConfig(issueDetailOpen) : null

  const navigateFromAction = (action?: IssueAction, fallback?: {
    tab?: NavigateTab
    field?: string
    questionnaireResponseId?: QuestionnaireResponseId
    summaryOnly?: boolean
    focus?: 'preview' | 'details'
  }) => {
    if (issueDetailOpen) {
      setIssueDetailOpen(null)
      setIssueDetailClosing(false)
      onHighlightField?.(null, null)
      onDiagnosticFocus?.(null)
    }

    const tab = (action?.tab as NavigateTab | undefined) ?? fallback?.tab
    const field = action?.field ?? fallback?.field
    const qId = (action?.questionnaireResponseId as QuestionnaireResponseId | undefined)
      ?? fallback?.questionnaireResponseId
    // Per-action summaryOnly (e.g. "Summary - investment lines") wins over issue default
    const summaryOnly = Boolean(action?.summaryOnly || (fallback?.summaryOnly && !tab))
    // reviewSource → document preview; goToInput → Details field focus
    const focus: 'preview' | 'details' =
      fallback?.focus
      ?? (action?.type === 'reviewSource' ? 'preview' : 'details')

    if (summaryOnly && field) {
      // Highlight Summary only - never switch source tabs (avoids sticky prior-1040)
      onHighlightField?.(field)
      onNavigateToTab?.(undefined, undefined, field, undefined, 'details')
      return
    }

    if (action?.type === 'viewClientResponse' || tab === 'questionnaire') {
      onNavigateToTab?.(
        'questionnaire',
        undefined,
        undefined,
        qId ?? activeIssue?.questionnaireResponseId,
      )
      return
    }

    // Preview CTAs open the source doc; Details CTAs require a field target
    const navField = focus === 'preview' ? undefined : field
    onNavigateToTab?.(tab, activeIssue?.viewSourceSubTab, navField, qId, focus)
  }

  return (
    <div className={`${embedded ? styles.panelEmbedded : styles.panel} ${closing && !embedded ? styles.panelClosing : ''}`}>

      {!embedded && (
        <div className={styles.header}>
          <div className={styles.headerLeft} />
          <div className={styles.headerTitle}>
            <img src={intuitAssistIcon} alt="" className={styles.assistIcon} />
            <span className={styles.titleText}>AI diagnostics</span>
          </div>
          <div className={styles.headerRight}>
            <IconControl aria-label="Close" onClick={onClose}>
              <Close size="small" />
            </IconControl>
          </div>
        </div>
      )}

      <div className={styles.pane}>
        <div className={styles.chat}>

          <p className={styles.agentMessage}>
            Filing stoppers, compliance checks, and opportunities for this return.
          </p>

          <div className={styles.scoreCard}>
            <span className={styles.scoreTitle}>Diagnostics to review</span>
            <div className={styles.progressBarWrap}>
              <ProgressBar
                value={reviewedCount}
                max={totalActive || 1}
                persistent={allReviewed}
                automationId="diagnostics-progress"
                aria-label={`${reviewedCount} of ${totalActive} diagnostics reviewed`}
              />
            </div>
            <div className={styles.scoreCountRow}>
              <span className={styles.scoreCountNumber}>{Math.max(0, remainingCount)}</span>
              <span className={styles.scoreCountLabel}>diagnostics remaining</span>
            </div>
          </div>

          {allReviewed && showCompletion && (
            <div className={styles.completionScreen}>
              <div className={styles.completionHeader}>
                <span className={styles.completionCheckIcon}><CircleCheck size="small" /></span>
                <span className={styles.completionTitle}>Review complete</span>
              </div>
              <p className={styles.completionBody}>
                All {totalActive} diagnostics reviewed. This return is ready to move forward.
              </p>
              {[...reviewedFields.values()].slice(0, 1).map((v, idx) => (
                <p key={idx} className={styles.completionSignOff}>
                  Signed off by <strong>{v.by}</strong> · {v.at}
                </p>
              ))}
              <div className={styles.completionActions}>
                {onSignOff && (
                  <Button priority="primary" size="medium" onClick={onSignOff}>
                    Open sign-off summary
                  </Button>
                )}
                <Button priority="secondary" size="medium" onClick={() => setShowCompletion(false)}>
                  Review again
                </Button>
              </div>
            </div>
          )}

          <div className={styles.cardBundle} style={allReviewed && showCompletion ? { display: 'none' } : {}}>
            {REPORT_CARDS.map((card, i) => {
              const visibleKeys = card.keys.filter(k => activeOrder.includes(k as IssueKey))
              if (visibleKeys.length === 0) return null
              const remaining = visibleKeys.filter(k => !reviewedFields.has(k)).length
              const cardDone = remaining === 0
              return (
              <div key={card.label}>
                <button
                  className={`${styles.card} ${styles[`card_${card.position}`]} ${expandedCard === card.label ? styles.cardActive : ''}`}
                  onClick={() => handleCardClick(card.label)}
                >
                  <div className={styles.cardIcon}>{CARD_ICONS[i]}</div>
                  <div className={styles.cardContent}>
                    <span className={styles.cardLabel}>{card.label}</span>
                    {cardDone
                      ? <span className={`${styles.badge} ${styles.badgeGreen}`}>✓</span>
                      : <span className={`${styles.badge} ${card.badgeColor === 'red' ? styles.badgeRed : card.badgeColor === 'orange' ? styles.badgeOrange : styles.badgeBlue}`}>{remaining}</span>
                    }
                  </div>
                  <ChevronDown size="small" className={`${styles.chevron} ${expandedCard === card.label ? styles.chevronUp : ''}`} />
                </button>

                {expandedCard === card.label && (
                  <div className={styles.findingCard} style={{ gap: 12 }}>
                    {visibleKeys.map((key) => {
                      const issue = getIssueConfig(key)
                      if (!issue) return null
                      const signOff = reviewedFields.get(key)
                      const isReviewed = !!signOff
                      const issueNum = activeOrder.indexOf(key as IssueKey) + 1
                      return (
                        <div
                          key={key}
                          role="button"
                          tabIndex={0}
                          className={`${styles.findingInner} ${isReviewed ? styles.findingInnerReviewed : ''}`}
                          onClick={() => {
                            const field = resolveHighlightField(key)
                            onHighlightField?.(field, key as IssueKey)
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              const field = resolveHighlightField(key)
                              onHighlightField?.(field, key as IssueKey)
                            }
                          }}
                        >
                          <div className={styles.findingTitleRow}>
                            {isReviewed ? <span className={styles.findingCheckIcon}><CircleCheck size="small" /></span> : <span className={styles.findingDot} style={{ background: issue.dotColor === 'blue' ? '#0077c5' : issue.dotColor === 'orange' ? '#d68000' : '#c22929' }} />}
                            <span className={styles.findingTitle}>{issue.title}</span>
                            <span className={styles.issueChip}>{issueNum} of {activeOrder.length}</span>
                            {isReviewed && (
                              <Badge
                                className={styles.findingReviewedBadge}
                                status="success"
                                label="Reviewed"
                                capitalization="sentence"
                                priority="secondary"
                                shape="round"
                              >
                                <SuccessBadgeIcon />
                              </Badge>
                            )}
                          </div>
                          {signOff && <span className={styles.findingSignOff}>{signOff.by} · {signOff.at}</span>}
                          <p className={styles.findingBody}>{issue.summary}</p>
                          <div className={styles.findingActions} onClick={e => e.stopPropagation()}>
                            <Tooltip text="See the root cause, tax impact, and suggested next steps for this finding">
                              <Button priority="primary" size="small" onClick={() => openDetail(key)}>See details <ChevronRight size="small" /></Button>
                            </Tooltip>
                            <Tooltip text={isReviewed && signOff
                              ? `Reviewed · ${signOff.by} · ${signOff.at}`
                              : (isReviewed ? 'Click to unmark' : 'Mark as reviewed')}>
                              <IconControl
                                className={`${styles.findingMarkReviewedBtn} ${isReviewed ? styles.findingMarkReviewedBtnActive : ''}`}
                                aria-label={isReviewed ? `Unmark ${issue.title} as reviewed` : `Mark ${issue.title} as reviewed`}
                                onClick={() => onMarkReviewed?.(key)}
                              >
                                <CircleCheck size="small" />
                              </IconControl>
                            </Tooltip>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )})}
          </div>

        </div>
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputFade} />
        <div className={styles.inputBox}>
          <div className={styles.inputTextField}>
            <textarea
              className={styles.textarea}
              placeholder="Ask anything"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={1}
            />
          </div>
          <div className={styles.inputActions}>
            <div className={styles.inputActionsLeft}>
              <button className={styles.attachBtn} aria-label="Attach"><Plus size="medium" /></button>
            </div>
            <div className={styles.inputActionsRight}>
              <button
                type="button"
                className={`${styles.sendBtn} ${inputValue.trim() ? styles.sendBtnActive : ''}`}
                aria-label="Send"
                disabled={!inputValue.trim()}
                onClick={handleSend}
              >
                <Send size="medium" />
              </button>
            </div>
          </div>
        </div>
        <span className={styles.legal}>Important information about how we use generative AI</span>
      </div>

      {(!!issueDetailOpen || issueDetailClosing) && activeIssue && (
        <IssueDetailPane
          closing={issueDetailClosing}
          issueKey={activeIssue.issueKey}
          dotColor={activeIssue.dotColor}
          title={activeIssue.title}
          summary={activeIssue.summary}
          taxImpact={activeIssue.taxImpact}
          rootCause={activeIssue.rootCause}
          clientResponseNote={activeIssue.clientResponseNote}
          tableRows={activeIssue.tableRows}
          tableHeaders={activeIssue.tableHeaders}
          suggestedActions={activeIssue.suggestedActions}
          actions={activeIssue.actions}
          sources={activeIssue.sources}
          reviewedCount={reviewedCount}
          totalItems={totalActive}
          reviewedFields={reviewedFields}
          onBack={handleCloseIssueDetail}
          onClose={() => { handleCloseIssueDetail(); onClose?.() }}
          onGoToInput={(action) => {
            navigateFromAction(action, {
              tab: activeIssue.summaryOnlyGoToInput ? undefined : activeIssue.viewSourceTab,
              field: action?.field ?? activeIssue.viewSourceField,
              summaryOnly: activeIssue.summaryOnlyGoToInput,
              focus: 'details',
            })
          }}
          onViewSource={(action) => {
            navigateFromAction(action, {
              tab: activeIssue.viewSourceTab,
              // Preview-first: do not pin a Details field unless the action asks for one
              field: action?.field,
              focus: 'preview',
            })
          }}
          onViewClientResponse={(action) => {
            navigateFromAction(action, {
              tab: 'questionnaire',
              questionnaireResponseId: activeIssue.questionnaireResponseId,
            })
          }}
          onOpenForm={(action) => {
            onOpenForm?.(action?.label ?? 'Open Form 1040')
          }}
          onMarkReviewed={onMarkReviewed}
          issueNumber={activeOrder.indexOf(activeIssue.issueKey as IssueKey) + 1}
          category={activeIssue.category}
          totalIssues={activeOrder.length}
          onPrev={isFirstIssue(activeIssue.issueKey) ? undefined : () => handlePrev(activeIssue.issueKey)}
          onNext={isLastIssue(activeIssue.issueKey) ? undefined : () => handleNext(activeIssue.issueKey)}
        />
      )}

    </div>
  )
}

import type { SourceDocumentPopoutContext } from '../../lib/prototypeRoutes'
import type { OutputFormId } from '../data-review/outputForms'
import { CHECKED_NO_ACTION_ITEMS } from '../data-review/phase2FlagSync'

export type PreparerChecklistJump =
  | { type: 'source'; label: string; context: SourceDocumentPopoutContext }
  | { type: 'form'; label: string; formId: OutputFormId }
  | { type: 'questionnaire'; label: string; responseId: string; field?: string }

export type PreparerReviewChecklistItem = {
  id: string
  kind: 'cleared' | 'manual'
  title: string
  note: string
  jump?: PreparerChecklistJump
  externalReference?: {
    label: string
    href: string
  }
}

function clearedJumpForId(id: string): PreparerChecklistJump | undefined {
  switch (id) {
    case 'filing-status':
      return { type: 'form', label: 'Open Form 1040', formId: '1040' }
    case 'capital-gains':
      return { type: 'form', label: 'Open Form 1040', formId: '1040' }
    case 'ira-basis':
      return {
        type: 'source',
        label: 'Open 1099-R',
        context: { tab: '1099-rs', subTab: 'meridian', field: 'iraDistrib' },
      }
    case 'qbi-199a':
      return { type: 'form', label: 'Open Schedule C', formId: 'schC' }
    default:
      return undefined
  }
}

const CLEARED_FROM_INPUTS: PreparerReviewChecklistItem[] = CHECKED_NO_ACTION_ITEMS.map(item => ({
  id: item.id,
  kind: 'cleared' as const,
  title: item.title,
  note: item.conclusion,
  externalReference: item.source,
  jump: clearedJumpForId(item.id),
}))

/** Items the preparer should confirm manually — aligned with the shared review log checklist. */
const MANUAL_PREPARER_ITEMS: PreparerReviewChecklistItem[] = [
  {
    id: 'prep-review-w2-tie-out',
    kind: 'manual',
    title: 'W-2 wages & withholding tie out',
    note: 'All W-2 boxes match source PDFs exactly.',
    jump: {
      type: 'source',
      label: 'Open W-2',
      context: { tab: 'w2s', subTab: 'techCircle', field: 'wages' },
    },
  },
  {
    id: 'prep-review-1099div-tie-out',
    kind: 'manual',
    title: '1099-DIV investment income tie out',
    note: 'Dividends and qualified dividends match payer statements.',
    jump: {
      type: 'source',
      label: 'Open 1099-DIV',
      context: { tab: '1099-divs', divPayer: 'tokenFinancial', field: 'qualifiedDivs' },
    },
  },
  {
    id: 'prep-review-1099int-tie-out',
    kind: 'manual',
    title: '1099-INT interest income tie out',
    note: 'Taxable interest matches payer statements.',
    jump: {
      type: 'source',
      label: 'Open 1099-INT',
      context: { tab: '1099-ints', intPayer: 'unwaverIngFinancial', field: 'taxableInterest' },
    },
  },
  {
    id: 'prep-review-1099r-tie-out',
    kind: 'manual',
    title: '1099-R retirement distribution tie out',
    note: 'Gross distribution and taxable amount match source.',
    jump: {
      type: 'source',
      label: 'Open 1099-R',
      context: { tab: '1099-rs', subTab: 'meridian', field: 'iraDistrib' },
    },
  },
  {
    id: 'prep-review-prior-carryforwards',
    kind: 'manual',
    title: 'Prior-year carryforwards checked',
    note: 'Capital loss, passive activity, and charitable carryovers rolled correctly.',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-schedule-a',
    kind: 'manual',
    title: 'Schedule A itemized deductions',
    note: 'SALT cap, mortgage interest, and charitable donations verified.',
    jump: { type: 'form', label: 'Open Schedule A', formId: 'schA' },
  },
  {
    id: 'prep-review-schedule-c',
    kind: 'manual',
    title: 'Schedule C business expenses',
    note: 'Ordinary and necessary test; home office and mileage documented.',
    jump: { type: 'form', label: 'Open Schedule C', formId: 'schC' },
  },
  {
    id: 'prep-review-withholding',
    kind: 'manual',
    title: 'Withholding & estimated payments',
    note: 'Federal withholding and estimated payments tie to transcripts and client answers.',
    jump: {
      type: 'questionnaire',
      label: 'View estimated payments',
      responseId: 'estimatedPayments',
      field: 'estimatedPayments',
    },
  },
  {
    id: 'prep-review-unreported-income',
    kind: 'manual',
    title: 'Unreported income sanity check',
    note: 'Income reported aligns with client profession and lifestyle.',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-form-8960',
    kind: 'manual',
    title: 'NIIT — Form 8960 reviewed',
    note: 'Net investment income tax calculation confirmed.',
    jump: { type: 'form', label: 'Open Form 8960', formId: 'f8960' },
  },
]

export const PREPARER_REVIEW_CHECKLIST: PreparerReviewChecklistItem[] = [
  ...CLEARED_FROM_INPUTS,
  ...MANUAL_PREPARER_ITEMS,
]

export const PREPARER_CHECKLIST_CLEARED = CLEARED_FROM_INPUTS
export const PREPARER_CHECKLIST_MANUAL = MANUAL_PREPARER_ITEMS

export function getPreparerChecklistCounts(manualChecklistItems: Record<string, boolean>): {
  total: number
  clearedCount: number
  manualCount: number
  manualConfirmed: number
  manualRemaining: number
} {
  const clearedCount = PREPARER_CHECKLIST_CLEARED.length
  const manualCount = PREPARER_CHECKLIST_MANUAL.length
  const manualConfirmed = PREPARER_CHECKLIST_MANUAL.filter(item => manualChecklistItems[item.id]).length
  return {
    total: PREPARER_REVIEW_CHECKLIST.length,
    clearedCount,
    manualCount,
    manualConfirmed,
    manualRemaining: manualCount - manualConfirmed,
  }
}

import type { SourceDocumentPopoutContext } from '../../lib/prototypeRoutes'
import type { OutputFormId } from '../data-review/outputForms'
import { CHECKED_NO_ACTION_ITEMS } from '../data-review/phase2FlagSync'

export type PreparerChecklistJump =
  | { type: 'source'; label: string; context: SourceDocumentPopoutContext }
  | { type: 'form'; label: string; formId: OutputFormId }
  | { type: 'questionnaire'; label: string; responseId: string; field?: string }

export type PreparerChecklistPhase =
  | 'client-setup'
  | 'review-judgment'
  | 'deductions'
  | 'credits'
  | 'sign-off'

export type PreparerReviewChecklistItem = {
  id: string
  kind: 'cleared' | 'manual'
  title: string
  note: string
  phase?: PreparerChecklistPhase
  jump?: PreparerChecklistJump
  externalReference?: {
    label: string
    href: string
  }
}

export const PREPARER_CHECKLIST_PHASE_LABELS: Record<PreparerChecklistPhase, string> = {
  'client-setup': 'Client information & file setup',
  'review-judgment': 'Review judgment',
  deductions: 'Deductions & adjustments',
  credits: 'Credits & tax calculations',
  'sign-off': 'Sign-off readiness',
}

export const PREPARER_CHECKLIST_PHASE_ORDER: PreparerChecklistPhase[] = [
  'client-setup',
  'review-judgment',
  'deductions',
  'credits',
  'sign-off',
]

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

/**
 * Preparer attestation items from the shared review log checklist.
 * Excludes source tie-outs (import mismatches above) and items already
 * surfaced as active diagnostics (Schedule A/C, withholding, NIIT, etc.).
 */
const MANUAL_PREPARER_ITEMS: PreparerReviewChecklistItem[] = [
  {
    id: 'prep-review-filing-status',
    kind: 'manual',
    phase: 'client-setup',
    title: 'Filing status & demographics verified',
    note: 'Filing status, SSN, and address match source documents and the Tax Organizer.',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-prior-carryforwards',
    kind: 'manual',
    phase: 'client-setup',
    title: 'Prior-year carryforwards checked',
    note: 'Capital loss, passive activity, and charitable carryovers rolled correctly.',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-bank-info',
    kind: 'manual',
    phase: 'client-setup',
    title: 'Bank information verified',
    note: 'Routing and account numbers confirmed for refund or payment.',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-engagement-letter',
    kind: 'manual',
    phase: 'client-setup',
    title: 'Engagement letter on file',
    note: 'Client representation agreement signed and attached.',
  },
  {
    id: 'prep-review-unreported-income',
    kind: 'manual',
    phase: 'review-judgment',
    title: 'Unreported income sanity check',
    note: 'Income reported aligns with client profession and lifestyle.',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-digital-assets',
    kind: 'manual',
    phase: 'review-judgment',
    title: 'Digital assets & foreign account responses',
    note: 'Crypto question and FBAR / Form 8938 thresholds addressed.',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-schedule-1',
    kind: 'manual',
    phase: 'deductions',
    title: 'Schedule 1 above-the-line adjustments',
    note: 'HSA, self-employment tax, and other adjustments reviewed.',
    jump: { type: 'form', label: 'Open Schedule 1', formId: 'sch1' },
  },
  {
    id: 'prep-review-deductions-attestation',
    kind: 'manual',
    phase: 'deductions',
    title: 'Deductions & optimization attestation',
    note: 'Planning positions and deduction mix make sense for this client.',
    jump: { type: 'form', label: 'Open Schedule A', formId: 'schA' },
  },
  {
    id: 'prep-review-credits',
    kind: 'manual',
    phase: 'credits',
    title: 'Credits eligibility confirmed',
    note: 'Child Tax Credit and other credits verified for this return.',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-yoy-variance',
    kind: 'manual',
    phase: 'sign-off',
    title: 'Prior-year variance walkthrough',
    note: 'Material YoY changes in AGI, income sources, and tax liability explained.',
    jump: { type: 'form', label: 'View YoY totals', formId: 'summary' },
  },
]

export const PREPARER_REVIEW_CHECKLIST: PreparerReviewChecklistItem[] = [
  ...CLEARED_FROM_INPUTS,
  ...MANUAL_PREPARER_ITEMS,
]

export const PREPARER_CHECKLIST_CLEARED = CLEARED_FROM_INPUTS
export const PREPARER_CHECKLIST_MANUAL = MANUAL_PREPARER_ITEMS

export function getManualItemsByPhase(): Array<{
  phase: PreparerChecklistPhase
  label: string
  items: PreparerReviewChecklistItem[]
}> {
  return PREPARER_CHECKLIST_PHASE_ORDER.map(phase => ({
    phase,
    label: PREPARER_CHECKLIST_PHASE_LABELS[phase],
    items: PREPARER_CHECKLIST_MANUAL.filter(item => item.phase === phase),
  })).filter(group => group.items.length > 0)
}

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

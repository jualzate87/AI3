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

/** Items worth confirming manually — excludes source tie-outs covered by import mismatches above. */
const MANUAL_PREPARER_ITEMS: PreparerReviewChecklistItem[] = [
  {
    id: 'prep-review-prior-carryforwards',
    kind: 'manual',
    title: 'Prior-year carryforwards checked',
    note: '',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-unreported-income',
    kind: 'manual',
    title: 'Unreported income sanity check',
    note: '',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-bank-info',
    kind: 'manual',
    title: 'Bank information verified',
    note: '',
    jump: { type: 'form', label: 'Open Form 1040', formId: '1040' },
  },
  {
    id: 'prep-review-deductions-attestation',
    kind: 'manual',
    title: 'Deductions & optimization attestation',
    note: '',
    jump: { type: 'form', label: 'Open Schedule A', formId: 'schA' },
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

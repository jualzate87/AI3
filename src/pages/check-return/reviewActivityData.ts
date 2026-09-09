/**
 * Static category-card content for Check Return activity panel (Review segment).
 * Narrative aligns with reviewLogData.ts: Sara Chen preparer, Jordan Lee reviewer.
 */

import { actorInitials } from './reviewLogData'

export type ReviewActivityEntry = {
  id: string
  label: string
  detail?: string
  /** Two-letter initials shown under each row when set. */
  attribution?: string
  before?: string
  after?: string
}

export type ReviewActivityCategory = {
  id: string
  title: string
  badge: string | null
  entries: ReviewActivityEntry[]
}

export type ReviewProgressBrief = {
  heading: string
  intro: string
  completedLabel: string
  completedItems: { id: string; text: string; emphasis?: string }[]
  attentionLabel: string
  attentionText: string
  syncedAt: string
}

const SC = actorInitials('Sara Chen')
const JL = actorInitials('Jordan Lee')

function entry(
  id: string,
  label: string,
  opts: Omit<ReviewActivityEntry, 'id' | 'label'> = {},
): ReviewActivityEntry {
  return { id, label, ...opts }
}

export const CHECK_RETURN_REVIEW_BRIEF: ReviewProgressBrief = {
  heading: "Here's your review progress",
  intro: 'Your work syncs with the reviewer in real time.',
  completedLabel: 'Completed so far',
  completedItems: [
    { id: 'checklist', emphasis: '2 of 20', text: ' required checklist items complete' },
    { id: 'docs', emphasis: '5', text: ' source documents verified' },
    { id: 'flags', emphasis: '10', text: ' import flags cleared' },
  ],
  attentionLabel: 'Still open',
  attentionText:
    '18 items need your attention. Use the Checklist tab to track progress.',
  syncedAt: 'Synced just now',
}

export const CHECK_RETURN_ACTIVITY_CATEGORIES: ReviewActivityCategory[] = [
  {
    id: 'documents-verified',
    title: 'Documents verified',
    badge: 'All verified',
    entries: [
      entry('doc-w2-tech', 'W-2 · Tech Circle', {
        detail: 'Marked verified against employer copy',
        attribution: SC,
      }),
      entry('doc-div-token', '1099-DIV · Token Financial', {
        detail: 'Marked verified against payer statement',
        attribution: SC,
      }),
      entry('doc-div-northmark', '1099-DIV · Northmark Index Funds', {
        detail: 'Marked verified against payer statement',
        attribution: SC,
      }),
      entry('doc-int-unwavering', '1099-INT · Unwavering Financial', {
        detail: 'Marked verified against payer statement',
        attribution: SC,
      }),
      entry('doc-r-meridian', '1099-R · Meridian Retirement Trust', {
        detail: 'Marked verified against payer statement',
        attribution: SC,
      }),
    ],
  },
  {
    id: 'import-flags-cleared',
    title: 'Import flags cleared',
    badge: 'All cleared',
    entries: [
      entry('flag-w2-ssn', 'W-2 SSN', {
        detail: 'Marked correct after OCR mismatch on SSN',
        attribution: SC,
      }),
      entry('flag-w2-wages', 'W-2 wages', {
        detail: 'Verified Box 1 against W-2 source',
        before: '$118,940',
        after: '$148,940',
        attribution: SC,
      }),
      entry('flag-w2-box12', 'W-2 Box 12 codes', {
        detail: 'Confirmed Box 12 codes match W-2 source',
        attribution: SC,
      }),
      entry('flag-r-2a', '1099-R Box 2a, taxable amount', {
        detail: '$50,000 of taxable pension was missing from line 4b',
        before: '$100,000',
        after: '$150,000',
        attribution: SC,
      }),
      entry('flag-r-4', '1099-R Box 4, federal withholding', {
        detail: 'Entire Box 4 amount was dropped on import',
        before: '$0',
        after: '$30,000',
        attribution: SC,
      }),
      entry('flag-div-4', '1099-DIV Box 4, federal withholding', {
        before: '$24,925',
        after: '$26,363',
        attribution: SC,
      }),
      entry('flag-div-collectibles', '1099-DIV collectibles', {
        detail: 'Marked correct without changing amounts',
        attribution: SC,
      }),
      entry('flag-div-1b', '1099-DIV Box 1b, qualified dividends', {
        detail: 'Reclassified $143,750 to ordinary dividends',
        before: '$331,250',
        after: '$187,500',
        attribution: SC,
      }),
      entry('flag-w2-ein', 'W-2 EIN', {
        detail: 'Verified employer EIN against W-2 source',
        attribution: SC,
      }),
      entry('flag-int-taxable', '1099-INT taxable interest', {
        detail: 'Confirmed interest total against payer statements',
        attribution: SC,
      }),
    ],
  },
  {
    id: 'amount-edits-no-flag',
    title: 'Amount edits (no flag)',
    badge: 'All recorded',
    entries: [
      entry('edit-nec', '1099-NEC Box 1, nonemployee compensation', {
        detail: 'Income dropped on import; now flows to Schedule C and line 8',
        before: 'Not on return',
        after: '$24,000',
        attribution: SC,
      }),
      entry('edit-box12-amt', 'W-2 Box 12 amounts for codes C, AA and DD', {
        detail: 'Three codes imported without their amounts',
        before: 'Blank',
        after: '$1,020, $23,000, $14,760',
        attribution: SC,
      }),
    ],
  },
  {
    id: 'form-lines-checked',
    title: 'Form lines checked',
    badge: 'All verified',
    entries: [
      entry('form-1040-3ab', 'Line 3a and 3b, dividends', {
        detail: 'Checked against Schedule B totals',
        attribution: SC,
      }),
      entry('form-sch-b', 'Schedule B, interest and ordinary dividends', {
        detail: 'All six payers listed and totalled',
        attribution: SC,
      }),
      entry('form-sch1-l3', 'Schedule 1, line 3 business income', {
        detail: 'Summit 1099-NEC now included',
        attribution: SC,
      }),
      entry('form-1040-4b', 'Line 4b, taxable pension', {
        detail: 'Agrees with Meridian 1099-R after Box 2a correction',
        attribution: JL,
      }),
      entry('form-1040-25d', 'Line 25d, federal income tax withheld', {
        detail: 'Withholding ties to all three payers after Meridian Box 4 correction',
        attribution: JL,
      }),
    ],
  },
  {
    id: 'ai-diagnostics-reviewed',
    title: 'AI diagnostics reviewed',
    badge: 'All cleared',
    entries: [
      entry('diag-import', 'Import mismatches', {
        detail: 'Six fields disagreed with source documents',
        attribution: SC,
      }),
      entry('diag-box12', 'Blank Box 12 amounts', {
        detail: 'Three codes imported without their amounts',
        attribution: SC,
      }),
      entry('diag-nec', 'Nonemployee compensation missing from Schedule C', {
        detail: 'Summit income now on Schedule C and line 8',
        attribution: SC,
      }),
      entry('diag-qual-div', 'Qualified dividend classification', {
        detail: 'Box 1a was correct; only Box 1b was overstated',
        attribution: SC,
      }),
      entry('diag-underpay', 'Underpayment risk', {
        detail: 'Restored withholding closes the shortfall; Form 2210 not required',
        attribution: JL,
      }),
    ],
  },
]

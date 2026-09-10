/**
 * Fixed presentation content for the Review log and Activity feed.
 *
 * Each entry uses a standardized shape: action title, optional detail,
 * location label, and an optional deep link target for navigation.
 */

import type { ActivityDeepLink, ActivityEntryType } from './activityTypes'
import { entryTypeToReviewLogKind, type ReviewLogKind } from './activityTypes'

export type { ActivityDeepLink, ActivityEntryType, ReviewLogKind }
export { entryTypeToReviewLogKind } from './activityTypes'

export type ReviewLogEntry = {
  id: string
  entryType: ActivityEntryType
  actor: string
  time: string
  /** Standard version-style summary (verb + target). */
  title: string
  /** Optional context on why the change was made or what was confirmed. */
  detail?: string
  before?: string
  after?: string
  /** Where the activity happened (form, document, or diagnostic area). */
  location: string
  deepLink?: ActivityDeepLink
  /** CTA label for deepLink; defaults per target when omitted. */
  linkLabel?: string
}

export type ReviewLogDay = {
  id: string
  label: string
  entries: readonly ReviewLogEntry[]
}

const D1 = 'diagnostic-1' as const
const D2 = 'diagnostic-2' as const

export const REVIEW_LOG_DAYS: readonly ReviewLogDay[] = [
  {
    id: 'today',
    label: 'Today, March 10',
    entries: [
      {
        id: 't-1',
        entryType: 'return-sign-off',
        actor: 'Jordan Lee',
        time: '4:48 PM',
        title: 'Signed off federal return',
        detail: 'Federal return marked ready for filing.',
        location: 'Federal summary',
        deepLink: { target: 'federal-summary' },
        linkLabel: 'Open federal summary',
      },
      {
        id: 't-2',
        entryType: 'form-line-checked',
        actor: 'Jordan Lee',
        time: '4:41 PM',
        title: 'Checked Form 1040, line 25d',
        detail: 'Confirmed federal income tax withheld.',
        location: 'Form 1040, line 25d',
        deepLink: { target: 'form', formLabel: '1040' },
        linkLabel: 'Open Form 1040',
      },
      {
        id: 't-3',
        entryType: 'form-line-checked',
        actor: 'Jordan Lee',
        time: '4:36 PM',
        title: 'Checked Form 1040, line 4b',
        detail: 'Confirmed taxable pension amount.',
        location: 'Form 1040, line 4b',
        deepLink: { target: 'form', formLabel: '1040' },
        linkLabel: 'Open Form 1040',
      },
      {
        id: 't-4',
        entryType: 'compliance-diagnostic-fixed',
        actor: 'Jordan Lee',
        time: '4:22 PM',
        title: 'Resolved Underpayment risk',
        detail: 'Marked compliance diagnostic as resolved.',
        location: 'AI diagnostics · Compliance checks',
        deepLink: { target: 'ai-diagnostics', categoryId: 'compliance', subNavId: D2 },
        linkLabel: 'Open compliance checks',
      },
      {
        id: 't-5',
        entryType: 'document-verified',
        actor: 'Jordan Lee',
        time: '4:05 PM',
        title: 'Verified 1099-R, Meridian Retirement Trust',
        detail: 'Marked document as verified.',
        location: '1099-R · Meridian Retirement Trust',
        deepLink: { target: 'source-document', docId: '1099-r-meridian', focus: 'document' },
        linkLabel: 'Open 1099-R',
      },
      {
        id: 't-6',
        entryType: 'document-verified',
        actor: 'Jordan Lee',
        time: '3:58 PM',
        title: 'Verified W-2, Tech Circle Inc',
        detail: 'Marked document as verified.',
        location: 'W-2 · Tech Circle Inc',
        deepLink: { target: 'source-document', docId: 'w2-techCircle', focus: 'document' },
        linkLabel: 'Open W-2',
      },
    ],
  },
  {
    id: 'yesterday',
    label: 'Yesterday, March 9',
    entries: [
      {
        id: 'y-1',
        entryType: 'import-diagnostic-fixed',
        actor: 'Sara Chen',
        time: '5:32 PM',
        title: 'Resolved Qualified dividend classification',
        detail: 'Marked import mismatch as resolved.',
        location: 'AI diagnostics · Import mismatches',
        deepLink: { target: 'ai-diagnostics', categoryId: 'import-mismatches', subNavId: D1 },
        linkLabel: 'Open import mismatches',
      },
      {
        id: 'y-2',
        entryType: 'field-edited',
        actor: 'Sara Chen',
        time: '5:30 PM',
        title: 'Updated 1099-DIV Box 1b, qualified dividends',
        detail: 'Corrected value to match source document.',
        before: '$331,250',
        after: '$187,500',
        location: '1099-DIV · Token Financial · Box 1b',
        deepLink: {
          target: 'source-document',
          docId: '1099-div-token',
          detailFieldId: 'qualifiedDivs',
          focus: 'input',
        },
        linkLabel: 'Open Box 1b input',
      },
      {
        id: 'y-3',
        entryType: 'compliance-diagnostic-fixed',
        actor: 'Sara Chen',
        time: '4:57 PM',
        title: 'Resolved Nonemployee compensation missing from Schedule C',
        detail: 'Marked compliance diagnostic as resolved.',
        location: 'AI diagnostics · Compliance checks',
        deepLink: { target: 'ai-diagnostics', categoryId: 'compliance', subNavId: D2 },
        linkLabel: 'Open compliance checks',
      },
      {
        id: 'y-4',
        entryType: 'field-edited',
        actor: 'Sara Chen',
        time: '4:54 PM',
        title: 'Added 1099-NEC Box 1, nonemployee compensation',
        detail: 'Added missing income to the return.',
        before: 'Not on return',
        after: '$24,000',
        location: '1099-NEC · Summit Advisory Partners · Box 1',
        deepLink: {
          target: 'source-document',
          docId: '1099-nec-summit',
          detailFieldId: 'nec-box1',
          focus: 'input',
        },
        linkLabel: 'Open Box 1 input',
      },
      {
        id: 'y-5',
        entryType: 'compliance-diagnostic-fixed',
        actor: 'Sara Chen',
        time: '4:31 PM',
        title: 'Resolved Blank Box 12 amounts',
        detail: 'Marked compliance diagnostic as resolved.',
        location: 'AI diagnostics · Compliance checks',
        deepLink: { target: 'ai-diagnostics', categoryId: 'compliance', subNavId: D2 },
        linkLabel: 'Open compliance checks',
      },
      {
        id: 'y-6',
        entryType: 'field-edited',
        actor: 'Sara Chen',
        time: '4:28 PM',
        title: 'Updated W-2 Box 12 amounts (codes C, AA, DD)',
        detail: 'Entered missing Box 12 amounts.',
        before: 'Blank',
        after: '$1,020, $23,000, $14,760',
        location: 'W-2 · Tech Circle Inc · Box 12',
        deepLink: {
          target: 'source-document',
          docId: 'w2-techCircle',
          detailFieldId: 'wages',
          focus: 'input',
        },
        linkLabel: 'Open W-2 input',
      },
      {
        id: 'y-7',
        entryType: 'form-line-checked',
        actor: 'Sara Chen',
        time: '3:44 PM',
        title: 'Checked Schedule 1, line 3',
        detail: 'Confirmed business income on line 3.',
        location: 'Schedule 1, line 3',
        deepLink: { target: 'form', formLabel: 'Sch 1' },
        linkLabel: 'Open Schedule 1',
      },
      {
        id: 'y-8',
        entryType: 'form-line-checked',
        actor: 'Sara Chen',
        time: '3:40 PM',
        title: 'Checked Schedule B, interest and dividends',
        detail: 'Confirmed interest and dividend payers.',
        location: 'Schedule B',
        deepLink: { target: 'form', formLabel: '1040' },
        linkLabel: 'Open Form 1040 (lines 2b, 3a, 3b)',
      },
      {
        id: 'y-9',
        entryType: 'form-line-checked',
        actor: 'Sara Chen',
        time: '3:31 PM',
        title: 'Checked Form 1040, lines 3a and 3b',
        detail: 'Confirmed dividend amounts.',
        location: 'Form 1040, lines 3a and 3b',
        deepLink: { target: 'form', formLabel: '1040' },
        linkLabel: 'Open Form 1040',
      },
    ],
  },
  {
    id: 'mar-6',
    label: 'Friday, March 6',
    entries: [
      {
        id: 'm-1',
        entryType: 'import-diagnostic-fixed',
        actor: 'Sara Chen',
        time: '2:15 PM',
        title: 'Resolved Import mismatches (6 fields)',
        detail: 'Marked all import mismatches as resolved.',
        location: 'AI diagnostics · Import mismatches',
        deepLink: { target: 'ai-diagnostics', categoryId: 'import-mismatches', subNavId: D1 },
        linkLabel: 'Open import mismatches',
      },
      {
        id: 'm-2',
        entryType: 'field-edited',
        actor: 'Sara Chen',
        time: '2:11 PM',
        title: 'Updated 1099-R Box 4, federal withholding',
        detail: 'Corrected value to match source document.',
        before: '$0',
        after: '$30,000',
        location: '1099-R · Meridian Retirement Trust · Box 4',
        deepLink: {
          target: 'source-document',
          docId: '1099-r-meridian',
          detailFieldId: 'withholding99',
          focus: 'input',
        },
        linkLabel: 'Open Box 4 input',
      },
      {
        id: 'm-3',
        entryType: 'field-edited',
        actor: 'Sara Chen',
        time: '2:06 PM',
        title: 'Updated 1099-R Box 2a, taxable amount',
        detail: 'Corrected value to match source document.',
        before: '$100,000',
        after: '$150,000',
        location: '1099-R · Meridian Retirement Trust · Box 2a',
        deepLink: {
          target: 'source-document',
          docId: '1099-r-meridian',
          detailFieldId: 'r-taxableAmt',
          focus: 'input',
        },
        linkLabel: 'Open Box 2a input',
      },
      {
        id: 'm-4',
        entryType: 'field-edited',
        actor: 'Sara Chen',
        time: '1:58 PM',
        title: 'Updated W-2 Box 1, wages',
        detail: 'Corrected value to match source document.',
        before: '$118,940',
        after: '$148,940',
        location: 'W-2 · Tech Circle Inc · Box 1',
        deepLink: {
          target: 'source-document',
          docId: 'w2-techCircle',
          detailFieldId: 'wages',
          focus: 'input',
        },
        linkLabel: 'Open Box 1 input',
      },
      {
        id: 'm-5',
        entryType: 'field-edited',
        actor: 'Sara Chen',
        time: '1:52 PM',
        title: 'Updated 1099-DIV Box 4, federal withholding',
        detail: 'Corrected value to match source document.',
        before: '$24,925',
        after: '$26,363',
        location: '1099-DIV · Token Financial · Box 4',
        deepLink: {
          target: 'source-document',
          docId: '1099-div-token',
          detailFieldId: 'withholding99',
          focus: 'input',
        },
        linkLabel: 'Open Box 4 input',
      },
      {
        id: 'm-6',
        entryType: 'document-verified',
        actor: 'Sara Chen',
        time: '1:24 PM',
        title: 'Verified 1099-NEC, Summit Advisory Partners',
        detail: 'Marked document as verified.',
        location: '1099-NEC · Summit Advisory Partners',
        deepLink: { target: 'source-document', docId: '1099-nec-summit', focus: 'document' },
        linkLabel: 'Open 1099-NEC',
      },
      {
        id: 'm-7',
        entryType: 'document-verified',
        actor: 'Sara Chen',
        time: '1:20 PM',
        title: 'Verified 1099-R, Meridian Retirement Trust',
        detail: 'Marked document as verified.',
        location: '1099-R · Meridian Retirement Trust',
        deepLink: { target: 'source-document', docId: '1099-r-meridian', focus: 'document' },
        linkLabel: 'Open 1099-R',
      },
      {
        id: 'm-8',
        entryType: 'document-verified',
        actor: 'Sara Chen',
        time: '1:12 PM',
        title: 'Verified 1099-INT (3 payers)',
        detail: 'Marked documents as verified.',
        location: '1099-INT · Interest income',
        deepLink: { target: 'source-document', docId: '1099-int-harborline', focus: 'document' },
        linkLabel: 'Open 1099-INT list',
      },
      {
        id: 'm-9',
        entryType: 'document-verified',
        actor: 'Sara Chen',
        time: '1:03 PM',
        title: 'Verified 1099-DIV (3 payers)',
        detail: 'Marked documents as verified.',
        location: '1099-DIV · Dividend income',
        deepLink: { target: 'source-document', docId: '1099-div-token', focus: 'document' },
        linkLabel: 'Open 1099-DIV list',
      },
      {
        id: 'm-10',
        entryType: 'document-verified',
        actor: 'Sara Chen',
        time: '12:47 PM',
        title: 'Verified W-2, Tech Circle Inc',
        detail: 'Marked document as verified.',
        location: 'W-2 · Tech Circle Inc',
        deepLink: { target: 'source-document', docId: 'w2-techCircle', focus: 'document' },
        linkLabel: 'Open W-2',
      },
    ],
  },
]

/** Headline counts for the summary strip (legacy Review log panel). */
export function getReviewLogCounts() {
  const all = REVIEW_LOG_DAYS.flatMap(day => day.entries)
  return {
    total: all.length,
    edit: all.filter(e => entryTypeToReviewLogKind(e.entryType) === 'edit').length,
    document: all.filter(e => entryTypeToReviewLogKind(e.entryType) === 'document').length,
    'form-check': all.filter(e => entryTypeToReviewLogKind(e.entryType) === 'form-check').length,
    diagnostic: all.filter(e => entryTypeToReviewLogKind(e.entryType) === 'diagnostic').length,
  }
}

export function getEntryKind(entry: ReviewLogEntry): ReviewLogKind {
  return entryTypeToReviewLogKind(entry.entryType)
}

export function actorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

/** Legacy filter chips for ReviewLogPanel. */
export const REVIEW_LOG_FILTERS = [
  { id: 'all' as const, label: 'All' },
  { id: 'edit' as const, label: 'Edits' },
  { id: 'document' as const, label: 'Documents' },
  { id: 'form-check' as const, label: 'Form checks' },
  { id: 'diagnostic' as const, label: 'Diagnostics' },
] as const

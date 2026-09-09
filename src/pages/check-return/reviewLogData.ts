/**
 * Fixed presentation content for the Review log.
 *
 * This is a designed narrative, not derived state: it shows what a complete
 * two-person review looks like once the preparer has corrected the import and
 * the reviewer has confirmed it. Amounts match the seeded return so the log
 * reads true against the source documents and the 1040.
 */

export type ReviewLogKind = 'edit' | 'document' | 'form-check' | 'diagnostic'

export type ReviewLogEntry = {
  id: string
  kind: ReviewLogKind
  actor: string
  time: string
  /** Verb phrase plus what it applied to. */
  title: string
  /** One plain-language sentence on why it changed or what was confirmed. */
  detail?: string
  before?: string
  after?: string
  /** Where the value came from, or which form the check was made on. */
  source?: string
}

export type ReviewLogDay = {
  id: string
  label: string
  entries: readonly ReviewLogEntry[]
}

export const REVIEW_LOG_FILTERS: readonly {
  id: ReviewLogKind | 'all'
  label: string
}[] = [
  { id: 'all', label: 'All activity' },
  { id: 'edit', label: 'Fields edited' },
  { id: 'document', label: 'Documents reviewed' },
  { id: 'form-check', label: 'Form lines checked' },
  { id: 'diagnostic', label: 'Diagnostics resolved' },
]

export const REVIEW_LOG_DAYS: readonly ReviewLogDay[] = [
  {
    id: 'today',
    label: 'Today, March 10',
    entries: [
      {
        id: 't-1',
        kind: 'diagnostic',
        actor: 'Jordan Lee',
        time: '4:48 PM',
        title: 'Signed off on the federal return',
        detail:
          'All nine diagnostics resolved and every income line traced back to a source document.',
        source: 'Form 1040',
      },
      {
        id: 't-2',
        kind: 'form-check',
        actor: 'Jordan Lee',
        time: '4:41 PM',
        title: 'Confirmed line 25d, federal income tax withheld',
        detail:
          'Withholding now ties to all three payers after the Meridian Box 4 correction.',
        source: 'Form 1040',
      },
      {
        id: 't-3',
        kind: 'form-check',
        actor: 'Jordan Lee',
        time: '4:36 PM',
        title: 'Confirmed line 4b, taxable pension',
        detail: 'Agrees with the Meridian 1099-R after the Box 2a correction.',
        source: 'Form 1040',
      },
      {
        id: 't-4',
        kind: 'diagnostic',
        actor: 'Jordan Lee',
        time: '4:22 PM',
        title: 'Reviewed Underpayment risk',
        detail:
          'Restored withholding closes the shortfall, so Form 2210 is no longer required.',
        source: 'Compliance checks',
      },
      {
        id: 't-5',
        kind: 'document',
        actor: 'Jordan Lee',
        time: '4:05 PM',
        title: 'Confirmed 1099-R, Meridian',
        detail: 'Second review of the document that carried two of the six import errors.',
      },
      {
        id: 't-6',
        kind: 'document',
        actor: 'Jordan Lee',
        time: '3:58 PM',
        title: 'Confirmed W-2, Tech Circle',
        detail: 'Wages and all three Box 12 codes match the employer copy.',
      },
    ],
  },
  {
    id: 'yesterday',
    label: 'Yesterday, March 9',
    entries: [
      {
        id: 'y-1',
        kind: 'diagnostic',
        actor: 'Sara Chen',
        time: '5:32 PM',
        title: 'Resolved Qualified dividend classification',
        detail:
          'Box 1a was right, so the totals check never caught it. Only Box 1b was overstated.',
        source: 'Import mismatches',
      },
      {
        id: 'y-2',
        kind: 'edit',
        actor: 'Sara Chen',
        time: '5:30 PM',
        title: 'Corrected 1099-DIV Box 1b, qualified dividends',
        detail:
          'Reclassifying $143,750 to ordinary corrects tax by about $21,563 at the 15 point rate spread.',
        before: '$331,250',
        after: '$187,500',
        source: '1099-DIV, Token',
      },
      {
        id: 'y-3',
        kind: 'diagnostic',
        actor: 'Sara Chen',
        time: '4:57 PM',
        title: 'Resolved Nonemployee compensation missing from Schedule C',
        detail: 'Summit income now flows to Schedule C and line 8.',
        source: 'Compliance checks',
      },
      {
        id: 'y-4',
        kind: 'edit',
        actor: 'Sara Chen',
        time: '4:54 PM',
        title: 'Added 1099-NEC Box 1, nonemployee compensation',
        detail:
          'Dropped entirely on import. Carries income tax plus self employment tax, roughly 47 cents on the dollar.',
        before: 'Not on return',
        after: '$24,000',
        source: '1099-NEC, Summit',
      },
      {
        id: 'y-5',
        kind: 'diagnostic',
        actor: 'Sara Chen',
        time: '4:31 PM',
        title: 'Resolved Blank Box 12 amounts',
        detail: 'Three codes imported without their amounts.',
        source: 'Compliance checks',
      },
      {
        id: 'y-6',
        kind: 'edit',
        actor: 'Sara Chen',
        time: '4:28 PM',
        title: 'Entered W-2 Box 12 amounts for codes C, AA and DD',
        detail:
          'Code AA affects the Roth contribution record even though it does not change taxable wages.',
        before: 'Blank',
        after: '$1,020, $23,000, $14,760',
        source: 'W-2, Tech Circle',
      },
      {
        id: 'y-7',
        kind: 'form-check',
        actor: 'Sara Chen',
        time: '3:44 PM',
        title: 'Checked Schedule 1, line 3 business income',
        source: 'Schedule 1',
      },
      {
        id: 'y-8',
        kind: 'form-check',
        actor: 'Sara Chen',
        time: '3:40 PM',
        title: 'Checked Schedule B, interest and ordinary dividends',
        detail: 'All six payers listed and totalled.',
        source: 'Schedule B',
      },
      {
        id: 'y-9',
        kind: 'form-check',
        actor: 'Sara Chen',
        time: '3:31 PM',
        title: 'Checked line 3a and 3b, dividends',
        source: 'Form 1040',
      },
    ],
  },
  {
    id: 'mar-6',
    label: 'Friday, March 6',
    entries: [
      {
        id: 'm-1',
        kind: 'diagnostic',
        actor: 'Sara Chen',
        time: '2:15 PM',
        title: 'Resolved Import mismatches',
        detail:
          'Six fields disagreed with the source documents, together worth about $60,000 in tax.',
        source: 'Import mismatches',
      },
      {
        id: 'm-2',
        kind: 'edit',
        actor: 'Sara Chen',
        time: '2:11 PM',
        title: 'Corrected 1099-R Box 4, federal withholding',
        detail:
          'The entire Box 4 amount was dropped on import, overstating the balance due dollar for dollar.',
        before: '$0',
        after: '$30,000',
        source: '1099-R, Meridian',
      },
      {
        id: 'm-3',
        kind: 'edit',
        actor: 'Sara Chen',
        time: '2:06 PM',
        title: 'Corrected 1099-R Box 2a, taxable amount',
        detail: '$50,000 of taxable pension missing from line 4b, taxed at 35 percent.',
        before: '$100,000',
        after: '$150,000',
        source: '1099-R, Meridian',
      },
      {
        id: 'm-4',
        kind: 'edit',
        actor: 'Sara Chen',
        time: '1:58 PM',
        title: 'Corrected W-2 Box 1, wages',
        detail: '$30,000 of wages missing from the return, taxed at 35 percent.',
        before: '$118,940',
        after: '$148,940',
        source: 'W-2, Tech Circle',
      },
      {
        id: 'm-5',
        kind: 'edit',
        actor: 'Sara Chen',
        time: '1:52 PM',
        title: 'Corrected 1099-DIV Box 4, federal withholding',
        before: '$24,925',
        after: '$26,363',
        source: '1099-DIV, Token',
      },
      {
        id: 'm-6',
        kind: 'document',
        actor: 'Sara Chen',
        time: '1:24 PM',
        title: 'Marked 1099-NEC reviewed, Summit',
      },
      {
        id: 'm-7',
        kind: 'document',
        actor: 'Sara Chen',
        time: '1:20 PM',
        title: 'Marked 1099-R reviewed, Meridian',
      },
      {
        id: 'm-8',
        kind: 'document',
        actor: 'Sara Chen',
        time: '1:12 PM',
        title: 'Marked 1099-INT reviewed, Harborline, Cascade and Unwavering',
      },
      {
        id: 'm-9',
        kind: 'document',
        actor: 'Sara Chen',
        time: '1:03 PM',
        title: 'Marked 1099-DIV reviewed, Token, Northmark and Beacon',
      },
      {
        id: 'm-10',
        kind: 'document',
        actor: 'Sara Chen',
        time: '12:47 PM',
        title: 'Marked W-2 reviewed, Tech Circle and Bing Equipment',
      },
    ],
  },
]

/** Headline counts for the summary strip. */
export function getReviewLogCounts() {
  const all = REVIEW_LOG_DAYS.flatMap(day => day.entries)
  return {
    total: all.length,
    edit: all.filter(e => e.kind === 'edit').length,
    document: all.filter(e => e.kind === 'document').length,
    'form-check': all.filter(e => e.kind === 'form-check').length,
    diagnostic: all.filter(e => e.kind === 'diagnostic').length,
  }
}

export function actorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

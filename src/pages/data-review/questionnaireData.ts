/**
 * Seeded Jessica Drake Tax Organizer / Questionnaire responses.
 * Diagnostics cite these via responseId + View client response CTAs.
 */
import type { TopTab } from './ReviewTab'

export type QuestionnaireResponseId =
  | 'mortgage'
  | 'estimatedPayments'
  | 'necExpenses'
  | 'workplacePlan'

/** Where the client submitted this answer */
export type QuestionnaireSourceChannel =
  | 'intuit-link'
  | 'client-portal'
  | 'uploaded-pdf'
  | 'preparer-entered'

/** How the answer relates to return fields */
export type QuestionnaireFieldLinkStatus = 'applied' | 'pending' | 'flagged' | 'planning'

export type QuestionnaireFieldLink = {
  /** Detail or summary field key for navigation */
  fieldKey: string
  /** Human-readable destination label */
  label: string
  /** Override tab when fieldKey alone is ambiguous */
  tab?: TopTab
  status: QuestionnaireFieldLinkStatus
  /** Short note on what happened (e.g. "$0 — matches client answer") */
  statusNote?: string
  /** Navigate to 1040 Summary row instead of a source doc tab */
  summaryOnly?: boolean
}

export type QuestionnaireResponse = {
  id: QuestionnaireResponseId
  topic: string
  question: string
  answer: string
  date: string
  clientName: string
  /** Per-answer source when it differs from the panel default */
  sourceChannel: QuestionnaireSourceChannel
  /** One-line explanation of how this answer was used on the return */
  appliedSummary: string
  /** Return fields this answer informed or flagged */
  fieldLinks: QuestionnaireFieldLink[]
}

export const QUESTIONNAIRE_SOURCE_LABELS: Record<QuestionnaireSourceChannel, string> = {
  'intuit-link': 'Intuit Link questionnaire',
  'client-portal': 'Client portal',
  'uploaded-pdf': 'Uploaded organizer PDF',
  'preparer-entered': 'Preparer-entered',
}

export const QUESTIONNAIRE_PANEL_META = {
  clientName: 'Jessica Drake',
  primarySource: 'intuit-link' as QuestionnaireSourceChannel,
  /** Channels represented in this packet (shown in panel header) */
  sourceMix: ['intuit-link', 'client-portal', 'uploaded-pdf'] as QuestionnaireSourceChannel[],
  submittedRange: 'Feb 28 – Mar 5, 2025',
  responseCount: 4,
}

export const QUESTIONNAIRE_RESPONSES: QuestionnaireResponse[] = [
  {
    id: 'mortgage',
    topic: 'Home / mortgage',
    question:
      'Do you own a home and pay mortgage interest? If you received Form 1098, please upload it or confirm the interest amount.',
    answer:
      'Yes. I own my home and paid mortgage interest in 2025. I think I got a Form 1098 from my lender but I haven’t uploaded it yet. Interest was somewhere around the mid five figures; I can dig up the form if you need the exact amount.',
    date: 'Feb 28, 2025',
    clientName: 'Jessica Drake',
    sourceChannel: 'uploaded-pdf',
    appliedSummary:
      'Confirmed homeownership and mortgage interest from the uploaded organizer PDF. Return stays on the standard deduction until Form 1098 is uploaded and itemizing is evaluated.',
    fieldLinks: [
      {
        fieldKey: 'stdDeduction',
        label: '1040 · Deduction method',
        status: 'applied',
        statusNote: 'Standard deduction selected',
        summaryOnly: true,
      },
      {
        fieldKey: 'stdDeduction',
        label: 'Schedule A · Mortgage interest (planning)',
        status: 'planning',
        statusNote: 'Form 1098 not in packet — itemize review pending',
        summaryOnly: true,
      },
    ],
  },
  {
    id: 'estimatedPayments',
    topic: 'Estimated tax payments',
    question:
      'Did you make any quarterly Form 1040-ES estimated tax payments for 2025?',
    answer:
      'No. I didn’t make any estimated payments this year. I figured my W-2 and 1099 withholding would cover everything like usual.',
    date: 'Mar 2, 2025',
    clientName: 'Jessica Drake',
    sourceChannel: 'intuit-link',
    appliedSummary:
      'Set estimated tax payments to $0 on the return and flagged underpayment risk when combined withholding is below tax due.',
    fieldLinks: [
      {
        fieldKey: 'estimatedPayments',
        label: '1040 · Line 26 · Estimated tax payments',
        status: 'applied',
        statusNote: '$0 — matches client answer',
        summaryOnly: true,
      },
      {
        fieldKey: 'fedTaxWithheld',
        label: '1099-DIV · Federal withholding',
        tab: '1099-divs',
        status: 'flagged',
        statusNote: 'Low withholding vs total tax — review Form 2210',
      },
    ],
  },
  {
    id: 'necExpenses',
    topic: '1099-NEC / business expenses',
    question:
      'For your Summit Advisory Partners contracting work (1099-NEC), did you have business expenses we should claim on Schedule C?',
    answer:
      'Yes. I had expenses for software, home office supplies, and some travel for that consulting work. I don’t have a clean receipt packet yet and I’m not sure what’s deductible. Nothing for expenses is on the return yet.',
    date: 'Mar 5, 2025',
    clientName: 'Jessica Drake',
    sourceChannel: 'client-portal',
    appliedSummary:
      'NEC income is on the return; Schedule C expenses are not applied yet — waiting on receipt detail from the client.',
    fieldLinks: [
      {
        fieldKey: 'nec-box1',
        label: '1099-NEC · Box 1 · Nonemployee compensation',
        tab: '1099-necs',
        status: 'applied',
        statusNote: 'Income posted from import',
      },
      {
        fieldKey: 'nec-box1',
        label: 'Schedule C · Business expenses',
        tab: '1099-necs',
        status: 'pending',
        statusNote: 'Not on return — follow up on receipts',
      },
    ],
  },
  {
    id: 'workplacePlan',
    topic: 'Workplace retirement plan',
    question:
      'Were you covered by a workplace retirement plan in 2025 (for example, a 401(k) at Tech Circle)?',
    answer:
      'Yes. Tech Circle has a 401(k) and I contribute. Box 13 on my W-2 should show retirement plan coverage.',
    date: 'Mar 5, 2025',
    clientName: 'Jessica Drake',
    sourceChannel: 'intuit-link',
    appliedSummary:
      'Confirmed 401(k) coverage at Tech Circle. W-2 Box 13 retirement plan checkbox should reflect this answer.',
    fieldLinks: [
      {
        fieldKey: 'box13',
        label: 'W-2 · Box 13 · Retirement plan',
        tab: 'w2s',
        status: 'applied',
        statusNote: 'Retirement plan coverage checked',
      },
      {
        fieldKey: 'box12',
        label: 'W-2 · Box 12 · 401(k) deferral',
        tab: 'w2s',
        status: 'applied',
        statusNote: 'Deferral code on Tech Circle W-2',
      },
    ],
  },
]

export const QUESTIONNAIRE_DOC_KEY = 'questionnaire'

export function getQuestionnaireSourceLabel(channel: QuestionnaireSourceChannel): string {
  return QUESTIONNAIRE_SOURCE_LABELS[channel]
}

/** Hub / import packet label for the questionnaire source document */
export const QUESTIONNAIRE_HUB_LABEL = 'Tax Organizer questionnaire'
export const QUESTIONNAIRE_HUB_SOURCE_NOTE =
  'Answers from Intuit Link, client portal, and uploaded organizer PDF — applied to return fields during import.'

/** Compact label for the header source mix */
export function formatQuestionnaireSourceMix(channels: QuestionnaireSourceChannel[]): string {
  const labels = channels.map(getQuestionnaireSourceLabel)
  if (labels.length <= 1) return labels[0] ?? ''
  if (labels.length === 2) return `${labels[0]} + ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} + ${labels[labels.length - 1]}`
}

/** All questionnaire answers that touch a return field key (for reverse linkage). */
export function getQuestionnaireLinksForField(fieldKey: string): Array<{
  response: QuestionnaireResponse
  link: QuestionnaireFieldLink
}> {
  const matches: Array<{ response: QuestionnaireResponse; link: QuestionnaireFieldLink }> = []
  for (const response of QUESTIONNAIRE_RESPONSES) {
    for (const link of response.fieldLinks) {
      if (link.fieldKey === fieldKey) {
        matches.push({ response, link })
      }
    }
  }
  return matches
}

/**
 * Questionnaire notes for detail fields — only when the answer adds context
 * beyond what a source document already explains (planning, pending, flagged).
 */
export function getQuestionnaireFieldNotes(fieldKey: string): Array<{
  topic: string
  sourceLabel: string
  note: string
}> {
  return getQuestionnaireLinksForField(fieldKey)
    .filter(({ link }) => link.status === 'planning' || link.status === 'pending' || link.status === 'flagged')
    .map(({ response, link }) => ({
      topic: response.topic,
      sourceLabel: getQuestionnaireSourceLabel(response.sourceChannel),
      note: link.statusNote ?? response.appliedSummary,
    }))
}

/**
 * Supplemental questionnaire copy for 1040 popovers — shown when the answer
 * adds information beyond imported source documents on that line.
 */
export function getQuestionnairePopoverSupplement(
  fieldKey: string,
  hasSourceDocuments: boolean,
): Array<{ topic: string; sourceLabel: string; note: string }> {
  const links = getQuestionnaireLinksForField(fieldKey)
  if (links.length === 0) return []

  if (!hasSourceDocuments) {
    return links.map(({ response, link }) => ({
      topic: response.topic,
      sourceLabel: getQuestionnaireSourceLabel(response.sourceChannel),
      note: link.statusNote ?? response.appliedSummary,
    }))
  }

  return links
    .filter(({ link }) => link.status !== 'applied' || !!link.statusNote)
    .filter(({ link }) => link.status === 'planning' || link.status === 'pending' || link.status === 'flagged')
    .map(({ response, link }) => ({
      topic: response.topic,
      sourceLabel: getQuestionnaireSourceLabel(response.sourceChannel),
      note: link.statusNote ?? response.appliedSummary,
    }))
}

export function getQuestionnaireResponseById(
  id: QuestionnaireResponseId,
): QuestionnaireResponse | undefined {
  return QUESTIONNAIRE_RESPONSES.find(r => r.id === id)
}


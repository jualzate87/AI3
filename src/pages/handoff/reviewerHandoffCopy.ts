import { CATCH_UP_PRIOR_PREPARER, CATCH_UP_CLIENT_NAME } from '../agent-review/agentIntelligenceCopy'

const PREPARER_FIRST = CATCH_UP_PRIOR_PREPARER.split(' ')[0]

export const REVIEWER_AI_POPOVER_TITLE = 'AI-powered review available'

export function reviewerAiPopoverBody(
  clientName = CATCH_UP_CLIENT_NAME,
  taxYear = '2025',
  preparerFirstName = PREPARER_FIRST,
): string {
  return `${preparerFirstName} handed off ${clientName}'s ${taxYear} return with notes for you. Intuit Intelligence can summarize what she finished before you start Pass 2 review.`
}

export const REVIEWER_AI_CARD_FULL_REVIEW = {
  title: 'Run full review',
  body: 'AI analyzes the entire return for issues, mismatches, and optimization opportunities.',
} as const

export function reviewerAiCardGetCaughtUp(preparerFirstName = PREPARER_FIRST) {
  return {
    title: 'Get caught up',
    body: `See ${preparerFirstName}'s handoff note, what she resolved, and what she flagged for your review.`,
  } as const
}

export const REVIEWER_AI_GET_STARTED = 'View reviewer summary'

export function reviewerAiToastTitle(reviewerFirstName?: string): string {
  if (reviewerFirstName) {
    return `${reviewerFirstName}, Sarah left notes for you`
  }
  return 'Intuit Intelligence can help with this return'
}

export function reviewerAiToastBody(preparerFirstName = PREPARER_FIRST): string {
  return `${preparerFirstName} finished prep and AI review. Run a full pass or open a reviewer summary with her handoff notes.`
}

export const REVIEWER_AI_TOAST_PRIMARY = 'Run full review'

export const REVIEWER_AI_TOAST_SECONDARY = 'View reviewer summary'

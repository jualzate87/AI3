import { CATCH_UP_PRIOR_PREPARER } from '../agent-review/agentIntelligenceCopy'
import { getCurrentUser, getTeamMember } from '../../lib/returnWorkflow'

const PREPARER_FIRST = CATCH_UP_PRIOR_PREPARER.split(' ')[0]

/** Whoever handed the return to the person now holding it. */
export function handoffSenderFirstName(): string {
  const current = getCurrentUser()
  const sender = getTeamMember(current.role === 'preparer' ? 'jake' : 'sarah')
  return sender.name.split(' ')[0]
}

/** Client name matches Check return header (Jordan Wells). */
export const REVIEWER_HANDOFF_CLIENT = 'Jordan Wells'

/** Proactive toast — headline-only (Figma 34623:110601). */
export function reviewerAiProactiveHeadline(
  preparerFirstName = PREPARER_FIRST,
  clientName = REVIEWER_HANDOFF_CLIENT,
): string {
  return `${preparerFirstName} handed off ${clientName}'s return with notes for you.`
}

export const REVIEWER_AI_TOAST_CTA = 'View reviewer summary'

/** The summary is named for the person reading it, not the person who sent it. */
export function handoffToastCta(): string {
  return getCurrentUser().role === 'preparer' ? 'View handoff summary' : REVIEWER_AI_TOAST_CTA
}

/** Dynamic popover variant (?prompt=popover). */
export const REVIEWER_AI_POPOVER_TITLE = 'Ready for your review'

export function reviewerAiPopoverBody(
  clientName = REVIEWER_HANDOFF_CLIENT,
  preparerFirstName = PREPARER_FIRST,
): string {
  return `${preparerFirstName} finished prep on ${clientName}'s return. See what she resolved and what she flagged before you start Pass 2.`
}

export const REVIEWER_AI_CARD_FULL_REVIEW = {
  title: 'Run full review',
  body: 'Scan the return for issues, mismatches, and opportunities.',
} as const

export function reviewerAiCardGetCaughtUp(preparerFirstName = PREPARER_FIRST) {
  return {
    title: 'Get caught up',
    body: `Open ${preparerFirstName}'s handoff note and reviewer summary.`,
  } as const
}

export const REVIEWER_AI_GET_STARTED = 'View reviewer summary'

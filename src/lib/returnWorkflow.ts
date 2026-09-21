export type TeamRole = 'preparer' | 'reviewer' | 'manager'

export type TeamMember = {
  id: string
  name: string
  /** Single letter shown in the header avatars. */
  initial: string
  role: TeamRole
  avatarColor: string
}

export type ReturnStatusId = 'preparation' | 'review' | 'ready-to-file' | 'filed'

export type ReturnStatus = {
  id: ReturnStatusId
  label: string
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'sarah', name: 'Sarah Chen', initial: 'S', role: 'preparer', avatarColor: '#236cff' },
  { id: 'jake', name: 'Jake Morrison', initial: 'J', role: 'reviewer', avatarColor: '#7c00f6' },
  { id: 'alex', name: 'Alex Rivera', initial: 'A', role: 'manager', avatarColor: '#00856d' },
]

export const RETURN_STATUSES: ReturnStatus[] = [
  { id: 'preparation', label: 'Return preparation' },
  { id: 'review', label: 'Review' },
  { id: 'ready-to-file', label: 'Ready to file' },
  { id: 'filed', label: 'Filed' },
]

export type HandoffPreviewBullet = {
  text: string
  emphasis?: boolean
}

export type HandoffSummaryItem = {
  title: string
  detail: string
}

export type HandoffSummarySection = {
  id: 'checked' | 'heads-up'
  title: string
  intro: string
  items: HandoffSummaryItem[]
}

export type ReturnWorkflowState = {
  assigneeId: string
  statusId: ReturnStatusId
  currentUserId: string
}

/** 'assignee' hands the return to someone else; 'status' moves it forward in place. */
export type HandoffKind = 'assignee' | 'status'

export type PendingHandoff = {
  kind: HandoffKind
  fromAssigneeId: string
  /** Equals fromAssigneeId for a status handoff — nobody is receiving the return. */
  toAssigneeId: string
  fromStatusId: ReturnStatusId
  suggestedStatusId: ReturnStatusId
  previewBullets: HandoffPreviewBullet[]
  previewSections: HandoffSummarySection[]
}

export const WORKFLOW_STORAGE_KEY = 'protoc3-return-workflow'
export const REVIEWER_WELCOME_KEY = 'protoc3-reviewer-welcome'
export const OPEN_CATCH_UP_KEY = 'protoc3-open-catch-up'
export const JOINED_AS_KEY = 'protoc3-joined-as'
export const WORKFLOW_CHANGED_EVENT = 'protoc3-workflow-changed'
export const JOINED_AS_EVENT = 'protoc3-joined-as'

const DEFAULT_WORKFLOW: ReturnWorkflowState = {
  assigneeId: 'sarah',
  statusId: 'preparation',
  currentUserId: 'sarah',
}

export function getTeamMember(id: string): TeamMember {
  return TEAM_MEMBERS.find(member => member.id === id) ?? TEAM_MEMBERS[0]
}

export function getReturnStatus(id: ReturnStatusId): ReturnStatus {
  return RETURN_STATUSES.find(status => status.id === id) ?? RETURN_STATUSES[0]
}

export function loadReturnWorkflow(): ReturnWorkflowState {
  try {
    const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_WORKFLOW }
    const parsed = JSON.parse(raw) as Partial<ReturnWorkflowState>
    return {
      assigneeId: parsed.assigneeId ?? DEFAULT_WORKFLOW.assigneeId,
      statusId: parsed.statusId ?? DEFAULT_WORKFLOW.statusId,
      currentUserId: parsed.currentUserId ?? DEFAULT_WORKFLOW.currentUserId,
    }
  } catch {
    return { ...DEFAULT_WORKFLOW }
  }
}

export function saveReturnWorkflow(state: ReturnWorkflowState): void {
  localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(WORKFLOW_CHANGED_EVENT))
}

export function resetReturnWorkflow(): void {
  localStorage.removeItem(WORKFLOW_STORAGE_KEY)
  sessionStorage.removeItem(REVIEWER_WELCOME_KEY)
  sessionStorage.removeItem(OPEN_CATCH_UP_KEY)
  sessionStorage.removeItem(JOINED_AS_KEY)
  // Reset can land on the same hash route, so nothing reloads — tell the app
  // to drop back to Sarah.
  window.dispatchEvent(new Event(WORKFLOW_CHANGED_EVENT))
}

export function announceJoinedAs(userId: string): void {
  sessionStorage.setItem(JOINED_AS_KEY, userId)
  window.dispatchEvent(new CustomEvent(JOINED_AS_EVENT, { detail: userId }))
}

export function consumeJoinedAs(): string | null {
  const userId = sessionStorage.getItem(JOINED_AS_KEY)
  sessionStorage.removeItem(JOINED_AS_KEY)
  return userId
}

/** Launch point: join the return as `toId` right after `fromId` handed it over. */
export function prepareHandoffLaunch(fromId: string, toId: string): ReturnWorkflowState {
  const from = getTeamMember(fromId)
  const to = getTeamMember(toId)
  const state: ReturnWorkflowState = {
    assigneeId: to.id,
    statusId: suggestStatusForAssignee(from, to, from.role === 'preparer' ? 'preparation' : 'review'),
    currentUserId: to.id,
  }
  saveReturnWorkflow(state)
  sessionStorage.setItem(REVIEWER_WELCOME_KEY, '1')
  seedHandoffNoteIfMissing(from.id, to.id)
  return state
}

/** Launch point: join the return as Jake after Sarah's handoff. */
export function prepareReviewerHandoffLaunch(): ReturnWorkflowState {
  return prepareHandoffLaunch('sarah', 'jake')
}

/** Launch point: join the return as Sarah after Jake sends it back. */
export function preparePreparerHandoffLaunch(): ReturnWorkflowState {
  return prepareHandoffLaunch('jake', 'sarah')
}

const RETURN_NOTES_KEY = 'protoc3-notes'

/** Seed the `from` → `to` handoff note for a launch point when none exists yet. */
export function seedHandoffNoteIfMissing(fromId = 'sarah', toId = 'jake'): void {
  try {
    const raw = localStorage.getItem(RETURN_NOTES_KEY)
    const notes = raw ? (JSON.parse(raw) as { id?: string }[]) : []
    if (notes.some(note => note.id?.startsWith('handoff-'))) return

    const from = getTeamMember(fromId)
    const to = getTeamMember(toId)
    const seeded = {
      id: 'handoff-seed',
      text: buildDefaultHandoffNote(from, to),
      author: from.name,
      at: new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      context: `Handoff note for ${to.name}`,
      role: from.role === 'preparer' ? ('preparer' as const) : ('reviewer' as const),
      status: 'open' as const,
    }
    localStorage.setItem(RETURN_NOTES_KEY, JSON.stringify([seeded, ...notes]))
  } catch {
    // ignore prototype storage errors
  }
}

/** Who is using the prototype right now — drives handoff-aware copy. */
export function getCurrentUser(): TeamMember {
  return getTeamMember(loadReturnWorkflow().currentUserId)
}

export function firstName(member: TeamMember): string {
  return member.name.split(' ')[0]
}

function statusIndex(id: ReturnStatusId): number {
  return RETURN_STATUSES.findIndex(status => status.id === id)
}

/** Where the return should land once someone else picks it up. */
function suggestStatusForAssignee(
  from: TeamMember,
  to: TeamMember,
  currentStatusId: ReturnStatusId,
): ReturnStatusId {
  if (to.role === 'preparer') return 'preparation'
  if (from.role === 'preparer') return currentStatusId === 'preparation' ? 'review' : currentStatusId
  if (from.role === 'reviewer' && to.role === 'manager') {
    return currentStatusId === 'review' ? 'ready-to-file' : currentStatusId
  }
  return currentStatusId
}

/** Any assignee change is a handoff — the summary adapts to who is handing off. */
export function detectHandoff(
  fromAssigneeId: string,
  toAssigneeId: string,
  currentStatusId: ReturnStatusId,
): PendingHandoff | null {
  if (fromAssigneeId === toAssigneeId) return null

  const from = getTeamMember(fromAssigneeId)
  const to = getTeamMember(toAssigneeId)

  return {
    kind: 'assignee',
    fromAssigneeId,
    toAssigneeId,
    fromStatusId: currentStatusId,
    suggestedStatusId: suggestStatusForAssignee(from, to, currentStatusId),
    previewSections: buildHandoffPreviewSections(from, to),
    previewBullets: buildHandoffPreviewBullets(from, to),
  }
}

/**
 * Moving the return forward is a sign-off and gets the same confirmation.
 * Sending it backward applies immediately — there is nothing to hand over.
 */
export function detectStatusHandoff(
  assigneeId: string,
  currentStatusId: ReturnStatusId,
  nextStatusId: ReturnStatusId,
): PendingHandoff | null {
  if (statusIndex(nextStatusId) <= statusIndex(currentStatusId)) return null

  const actor = getTeamMember(assigneeId)

  return {
    kind: 'status',
    fromAssigneeId: assigneeId,
    toAssigneeId: assigneeId,
    fromStatusId: currentStatusId,
    suggestedStatusId: nextStatusId,
    previewSections: buildHandoffPreviewSections(actor, null),
    previewBullets: buildHandoffPreviewBullets(actor, null),
  }
}

/**
 * The summary is cumulative: a preparer reports their own prep, and anyone
 * downstream reports the whole return so far. `to` is null on a status handoff.
 */
export function buildHandoffPreviewSections(
  from: TeamMember,
  to: TeamMember | null,
): HandoffSummarySection[] {
  return from.role === 'preparer' ? preparerSections(from, to) : reviewerSections(from, to)
}

function headsUpTitle(to: TeamMember | null): string {
  return to ? `Heads up for ${firstName(to)}` : 'Still open on this return'
}

function headsUpIntro(to: TeamMember | null): string {
  return to
    ? 'Call them out before you sign off — or leave them for the next person.'
    : 'Call them out before you sign off — or leave them for whoever picks this up.'
}

function preparerSections(
  from: TeamMember,
  to: TeamMember | null,
): HandoffSummarySection[] {
  return [
    {
      id: 'checked',
      title: 'Checked and ready',
      intro: `A concise version of the AI review ${from.name} already completed.`,
      items: [
        {
          title: 'W-2 income variance resolved',
          detail:
            'Tech Circle Box 1 differed from last year because of a mid-year raise — confirmed against the source PDF.',
        },
        {
          title: '1099-DIV classification corrected',
          detail:
            'Qualified vs. ordinary split was reclassified so the amounts match the broker statement.',
        },
        {
          title: 'Withholding reviewed',
          detail:
            'Federal withholding and state elections were checked against projected liability. No change needed.',
        },
        {
          title: 'Source documents imported',
          detail: 'W-2, 1099-INT, and 1099-DIV are in the packet and tied to the return.',
        },
      ],
    },
    {
      id: 'heads-up',
      title: headsUpTitle(to),
      intro: headsUpIntro(to),
      items: [
        {
          title: '1099-DIV split still needs a second look',
          detail: `${from.name} corrected the classification, but the broker formatting was unusual. Verify the split against the PDF.`,
        },
        {
          title: 'Form 1098 mortgage interest is an estimate',
          detail:
            'The deduction is based on an estimate. Confirm the amount with the client and upload the actual form when it arrives.',
        },
        {
          title: 'Form 2210 penalty is a judgment call',
          detail:
            'The underpayment shortfall is calculated, but whether to annualize income or accept the penalty is yours to decide.',
        },
      ],
    },
  ]
}

function reviewerSections(
  from: TeamMember,
  to: TeamMember | null,
): HandoffSummarySection[] {
  const preparer = getTeamMember('sarah')

  return [
    {
      id: 'checked',
      title: 'Reviewed and ready',
      intro: '',
      items: [
        {
          title: 'Prep and AI review hold up',
          detail: `The W-2 variance, 1099-DIV classification, and withholding resolutions ${firstName(preparer)} recorded were spot-checked against the source documents.`,
        },
        {
          title: '1099-DIV split verified against the broker PDF',
          detail: `The one item ${firstName(preparer)} flagged for a second look. The qualified vs. ordinary split matches the broker statement.`,
        },
        {
          title: 'Source documents carry two verifications',
          detail: `W-2, 1099-INT, and 1099-DIV are verified by ${preparer.name} and confirmed by ${from.name}.`,
        },
        {
          title: '1040 checks complete through L2',
          detail: `${firstName(from)}'s review marks sit alongside ${firstName(preparer)}'s on every checked line.`,
        },
      ],
    },
    {
      id: 'heads-up',
      title: headsUpTitle(to),
      intro: headsUpIntro(to),
      items: [
        {
          title: 'Form 1098 mortgage interest is still an estimate',
          detail:
            'The deduction has not been confirmed with the client. Upload the actual form when it arrives and update the amount.',
        },
        {
          title: 'Form 2210 penalty call is still open',
          detail:
            'The underpayment shortfall is calculated, but nobody has decided whether to annualize income or accept the penalty.',
        },
        {
          title: 'Client e-file authorization is not signed',
          detail: 'Form 8879 has to come back from the client before this return can be filed.',
        },
      ],
    },
  ]
}

export function buildHandoffPreviewBullets(
  from: TeamMember,
  to: TeamMember | null,
): HandoffPreviewBullet[] {
  return buildHandoffPreviewSections(from, to).flatMap(section =>
    section.items.map(item => ({
      text: `${item.title} — ${item.detail}`,
      emphasis: section.id === 'heads-up',
    })),
  )
}

export function buildDefaultHandoffNote(from: TeamMember, to: TeamMember | null): string {
  if (from.role === 'preparer') {
    const mention = to ? `@${firstName(to)} — please` : 'Next up:'
    return `${from.name} completed initial prep and AI review. ${mention} verify the 1099-DIV qualified vs. ordinary split against the broker PDF. Everything else is reconciled and ready for review.`
  }

  const mention = to ? `@${firstName(to)} — two items are still open: ` : 'Two items are still open: '
  return `${from.name} completed the detail review and every source document is verified. ${mention}Form 1098 mortgage interest is still an estimate, and the Form 2210 penalty call has not been made.`
}

/** Action label for the handoff modal's primary button. */
export function handoffConfirmLabel(handoff: PendingHandoff): string {
  if (handoff.kind === 'status') {
    return `Sign off and move to ${getReturnStatus(handoff.suggestedStatusId).label}`
  }
  const to = getTeamMember(handoff.toAssigneeId)
  return to.role === 'preparer' ? 'Send back with notes' : `Sign off and hand to ${firstName(to)}`
}

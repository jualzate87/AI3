export type TeamRole = 'preparer' | 'reviewer' | 'manager'

export type TeamMember = {
  id: string
  name: string
  initials: string
  role: TeamRole
  avatarColor: string
}

export type ReturnStatusId = 'preparation' | 'review' | 'ready-to-file' | 'filed'

export type ReturnStatus = {
  id: ReturnStatusId
  label: string
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'sarah', name: 'Sarah Chen', initials: 'SC', role: 'preparer', avatarColor: '#236cff' },
  { id: 'jake', name: 'Jake Morrison', initials: 'JM', role: 'reviewer', avatarColor: '#7c00f6' },
  { id: 'alex', name: 'Alex Rivera', initials: 'AR', role: 'manager', avatarColor: '#00856d' },
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

export type PendingHandoff = {
  fromAssigneeId: string
  toAssigneeId: string
  suggestedStatusId: ReturnStatusId
  previewBullets: HandoffPreviewBullet[]
  previewSections: HandoffSummarySection[]
}

export const WORKFLOW_STORAGE_KEY = 'protoc3-return-workflow'
export const REVIEWER_WELCOME_KEY = 'protoc3-reviewer-welcome'
export const OPEN_CATCH_UP_KEY = 'protoc3-open-catch-up'

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
}

export function resetReturnWorkflow(): void {
  localStorage.removeItem(WORKFLOW_STORAGE_KEY)
  sessionStorage.removeItem(REVIEWER_WELCOME_KEY)
  sessionStorage.removeItem(OPEN_CATCH_UP_KEY)
}

/** Launch point: join the return as Jake after Sarah's handoff. */
export function prepareReviewerHandoffLaunch(): ReturnWorkflowState {
  const state: ReturnWorkflowState = {
    assigneeId: 'jake',
    statusId: 'review',
    currentUserId: 'jake',
  }
  saveReturnWorkflow(state)
  sessionStorage.setItem(REVIEWER_WELCOME_KEY, '1')
  seedHandoffNoteIfMissing()
  return state
}

const RETURN_NOTES_KEY = 'protoc3-notes'

/** Seed Sarah → Jake handoff note for reviewer launch when none exists yet. */
export function seedHandoffNoteIfMissing(): void {
  try {
    const raw = localStorage.getItem(RETURN_NOTES_KEY)
    const notes = raw ? (JSON.parse(raw) as { id?: string }[]) : []
    if (notes.some(note => note.id?.startsWith('handoff-'))) return

    const sarah = getTeamMember('sarah')
    const jake = getTeamMember('jake')
    const seeded = {
      id: 'handoff-seed',
      text: buildDefaultHandoffNote(sarah.name, jake.name),
      author: sarah.name,
      at: new Date().toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      context: `Handoff note for ${jake.name}`,
      role: 'preparer' as const,
      status: 'open' as const,
    }
    localStorage.setItem(RETURN_NOTES_KEY, JSON.stringify([seeded, ...notes]))
  } catch {
    // ignore prototype storage errors
  }
}

/** Detect preparer → reviewer handoff and suggest status change. */
export function detectHandoff(
  fromAssigneeId: string,
  toAssigneeId: string,
  currentStatusId: ReturnStatusId,
): PendingHandoff | null {
  if (fromAssigneeId === toAssigneeId) return null

  const from = getTeamMember(fromAssigneeId)
  const to = getTeamMember(toAssigneeId)

  const isPreparerToReviewer =
    from.role === 'preparer' && (to.role === 'reviewer' || to.role === 'manager')
  if (!isPreparerToReviewer) return null

  const suggestedStatusId: ReturnStatusId =
    currentStatusId === 'preparation' ? 'review' : currentStatusId

  return {
    fromAssigneeId,
    toAssigneeId,
    suggestedStatusId,
    previewSections: buildHandoffPreviewSections(from.name, to.name),
    previewBullets: buildHandoffPreviewBullets(from.name, to.name),
  }
}

export function buildHandoffPreviewSections(
  fromName: string,
  toName: string,
): HandoffSummarySection[] {
  return [
    {
      id: 'checked',
      title: 'Checked and ready',
      intro: `A concise version of the AI review ${fromName} already completed.`,
      items: [
        {
          title: 'W-2 income variance resolved',
          detail: 'Tech Circle Box 1 differed from last year because of a mid-year raise — confirmed against the source PDF.',
        },
        {
          title: '1099-DIV classification corrected',
          detail: 'Qualified vs. ordinary split was reclassified so the amounts match the broker statement.',
        },
        {
          title: 'Withholding reviewed',
          detail: 'Federal withholding and state elections were checked against projected liability. No change needed.',
        },
        {
          title: 'Source documents imported',
          detail: 'W-2, 1099-INT, and 1099-DIV are in the packet and tied to the return.',
        },
      ],
    },
    {
      id: 'heads-up',
      title: `Heads up for ${toName.split(' ')[0]}`,
      intro: 'These were not fully proven during prep. Call them out before you sign off — or leave them for the next person.',
      items: [
        {
          title: '1099-DIV split still needs a second look',
          detail: `${fromName} corrected the classification, but the broker formatting was unusual. Verify the split against the PDF.`,
        },
        {
          title: 'Form 1098 mortgage interest is an estimate',
          detail: 'The deduction is based on an estimate. Confirm the amount with the client and upload the actual form when it arrives.',
        },
        {
          title: 'Form 2210 penalty is a judgment call',
          detail: 'The underpayment shortfall is calculated, but whether to annualize income or accept the penalty is yours to decide.',
        },
      ],
    },
  ]
}

export function buildHandoffPreviewBullets(
  fromName: string,
  toName: string,
): HandoffPreviewBullet[] {
  return buildHandoffPreviewSections(fromName, toName).flatMap(section =>
    section.items.map(item => ({
      text: `${item.title} — ${item.detail}`,
      emphasis: section.id === 'heads-up',
    })),
  )
}

export function buildDefaultHandoffNote(fromName: string, toName: string): string {
  return `${fromName} completed initial prep and AI review. @${toName.split(' ')[0]} — please verify the 1099-DIV qualified vs. ordinary split against the broker PDF. Everything else is reconciled and ready for your review.`
}

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
    previewBullets: buildHandoffPreviewBullets(from.name, to.name),
  }
}

export function buildHandoffPreviewBullets(
  fromName: string,
  toName: string,
): HandoffPreviewBullet[] {
  return [
    {
      text: 'AI review complete — 3 Intuit Intelligence items resolved during prep',
      emphasis: true,
    },
    { text: 'W-2, 1099-INT, and 1099-DIV imported and verified against source PDFs' },
    { text: 'Federal refund estimate updated after qualified dividend reclassification' },
    {
      text: `${fromName} flagged the 1099-DIV split for ${toName} to double-check against the broker statement`,
    },
  ]
}

export function buildDefaultHandoffNote(fromName: string, toName: string): string {
  return `${fromName} completed initial prep and AI review. @${toName.split(' ')[0]} — please verify the 1099-DIV qualified vs. ordinary split against the broker PDF. Everything else is reconciled and ready for your review.`
}

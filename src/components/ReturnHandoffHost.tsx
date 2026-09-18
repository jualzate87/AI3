import HandoffAssistModal from '../pages/handoff/HandoffAssistModal'
import { useReturnWorkflow } from '../contexts/ReturnWorkflowContext'
import { useReturnNotes } from '../hooks/useReturnNotes'
import { getReturnStatus, getTeamMember } from '../lib/returnWorkflow'

/** Global handoff modal wired to workflow + comments. */
export default function ReturnHandoffHost() {
  const { pendingHandoff, confirmHandoff, dismissHandoff } = useReturnWorkflow()
  const { addHandoffNote } = useReturnNotes()

  const handleConfirm = (notes: string, updateStatus: boolean) => {
    if (!pendingHandoff) return
    const from = getTeamMember(pendingHandoff.fromAssigneeId)
    const trimmed = notes.trim()
    confirmHandoff(trimmed, updateStatus)
    if (!trimmed) return

    const context =
      pendingHandoff.kind === 'assignee'
        ? `Handoff note for ${getTeamMember(pendingHandoff.toAssigneeId).name}`
        : `Sign-off note — ${getReturnStatus(pendingHandoff.suggestedStatusId).label}`
    addHandoffNote(trimmed, from.name, context, from.role === 'preparer' ? 'preparer' : 'reviewer')
  }

  return (
    <HandoffAssistModal
      open={Boolean(pendingHandoff)}
      handoff={pendingHandoff}
      onConfirm={handleConfirm}
      onDismiss={dismissHandoff}
    />
  )
}

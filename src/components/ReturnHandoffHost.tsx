import HandoffAssistModal from '../pages/handoff/HandoffAssistModal'
import { useReturnWorkflow } from '../contexts/ReturnWorkflowContext'
import { useReturnNotes } from '../hooks/useReturnNotes'
import { getTeamMember } from '../lib/returnWorkflow'

/** Global handoff modal wired to workflow + comments. */
export default function ReturnHandoffHost() {
  const { pendingHandoff, confirmHandoff, dismissHandoff } = useReturnWorkflow()
  const { addHandoffNote } = useReturnNotes()

  const handleConfirm = (notes: string) => {
    if (!pendingHandoff) return
    const from = getTeamMember(pendingHandoff.fromAssigneeId)
    const to = getTeamMember(pendingHandoff.toAssigneeId)
    const trimmed = notes.trim()
    confirmHandoff(trimmed)
    if (trimmed) {
      addHandoffNote(trimmed, from.name, to.name)
    }
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

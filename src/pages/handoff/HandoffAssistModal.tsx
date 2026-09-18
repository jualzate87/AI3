import { useEffect, useState } from 'react'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalActions } from '@ids-ts/modal-dialog'
import '@ids-ts/modal-dialog/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
import { useReturnWorkflow } from '../../contexts/ReturnWorkflowContext'
import {
  buildDefaultHandoffNote,
  getReturnStatus,
  getTeamMember,
  handoffConfirmLabel,
  type PendingHandoff,
} from '../../lib/returnWorkflow'
import HandoffNotesField from './HandoffNotesField'
import HandoffSummaryAccordion from './HandoffSummaryAccordion'
import styles from '../../styles/handoff/HandoffAssistModal.module.css'

interface HandoffAssistModalProps {
  open: boolean
  handoff: PendingHandoff | null
  onConfirm: (notes: string) => void
  onDismiss: () => void
}

export default function HandoffAssistModal({
  open,
  handoff,
  onConfirm,
  onDismiss,
}: HandoffAssistModalProps) {
  const [notes, setNotes] = useState('')
  const { workflow } = useReturnWorkflow()

  useEffect(() => {
    if (!open || !handoff) return
    const from = getTeamMember(handoff.fromAssigneeId)
    const to = handoff.kind === 'assignee' ? getTeamMember(handoff.toAssigneeId) : null
    setNotes(buildDefaultHandoffNote(from, to))
  }, [open, handoff])

  if (!handoff) return null
  const to = handoff.kind === 'assignee' ? getTeamMember(handoff.toAssigneeId) : null
  const currentStatus = getReturnStatus(workflow.statusId)
  const nextStatus = getReturnStatus(handoff.suggestedStatusId)
  const statusWillChange = workflow.statusId !== handoff.suggestedStatusId
  const toFirstName = to?.name.split(' ')[0] ?? ''
  const summaryLabel = to ? `Quick summary for ${to.name}` : 'Quick summary of this return'
  const notesLabel = to ? `Leave notes for ${to.name}` : 'Leave a note on this return'

  return (
    <Modal open={open} onClose={onDismiss} size="large" dismissible>
      <ModalHeader alignment="left" transparentBackground onClose={onDismiss}>
        <ModalTitle title="Handoff assist" />
      </ModalHeader>
      <ModalContent alignment="left" overflow maxHeight="70vh">
        <div className={styles.body}>
          <div className={styles.intro}>
            <p className={styles.lead}>
              {to ? (
                <>
                  We noticed you&apos;re changing the assignee to <strong>{to.name}</strong>.
                  {statusWillChange ? (
                    <>
                      {' '}
                      We&apos;ll update the return status from{' '}
                      <strong>{currentStatus.label}</strong> to <strong>{nextStatus.label}</strong> to
                      match this handoff.
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  We noticed you&apos;re moving this return from{' '}
                  <strong>{currentStatus.label}</strong> to <strong>{nextStatus.label}</strong>.
                </>
              )}
            </p>
            <p className={styles.instructions}>
              {to
                ? `Add anything ${toFirstName} should know in the notes, then open the generated summary to review what we'll include with this handoff.`
                : "Add a note on this return, then open the generated summary to review what we'll include with this status change."}
            </p>
          </div>

          <HandoffNotesField
            id="handoff-notes"
            label={notesLabel}
            value={notes}
            onChange={setNotes}
          />
          <HandoffSummaryAccordion
            label={summaryLabel}
            sections={handoff.previewSections}
          />
        </div>
      </ModalContent>
      <ModalActions>
        <div className={styles.actionsRow}>
          <LinkActionButton
            size="small"
            weight="regular"
            alignment="left"
            onClick={onDismiss}
          >
            {to ? 'Change assignee only' : 'Change status only'}
          </LinkActionButton>
          <Button priority="primary" onClick={() => onConfirm(notes.trim())}>
            {handoffConfirmLabel(handoff)}
          </Button>
        </div>
      </ModalActions>
    </Modal>
  )
}

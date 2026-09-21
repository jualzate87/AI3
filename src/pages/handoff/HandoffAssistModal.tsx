import { useEffect, useState } from 'react'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalActions } from '@ids-ts/modal-dialog'
import '@ids-ts/modal-dialog/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
import Switch from '@ids-ts/switch'
import '@ids-ts/switch/dist/main.css'
import {
  firstName,
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
  onConfirm: (notes: string, updateStatus: boolean) => void
  onDismiss: () => void
}

export default function HandoffAssistModal({
  open,
  handoff,
  onConfirm,
  onDismiss,
}: HandoffAssistModalProps) {
  const [notes, setNotes] = useState('')
  const [updateStatus, setUpdateStatus] = useState(true)

  useEffect(() => {
    if (!open || !handoff) return
    setNotes('')
    setUpdateStatus(true)
  }, [open, handoff])

  // Keep the IDS modal mounted while closed so its transition and focus manager
  // can respond when a handoff is requested.
  if (!handoff) return <Modal open={false} onClose={onDismiss} />
  const to = handoff.kind === 'assignee' ? getTeamMember(handoff.toAssigneeId) : null
  const nextStatus = getReturnStatus(handoff.suggestedStatusId)
  const summaryLabel = to ? `Quick summary for ${to.name}` : 'Quick summary of this return'
  const title = to ? `Hand off return to ${to.name}` : `Move return to ${nextStatus.label}`
  const intro = to
    ? `Add optional notes for ${to.name} and review the AI summary before you send.`
    : 'Add an optional note and review the AI summary before you update the return.'
  const notesLabel = to ? `Notes for ${firstName(to)}` : 'Notes'

  return (
    <Modal open={open} onClose={onDismiss} size="large" dismissible>
      <ModalHeader alignment="center" transparentBackground onClose={onDismiss}>
        <ModalTitle title={title} />
      </ModalHeader>
      <ModalContent alignment="left" overflow maxHeight="calc(100vh - 280px)">
        <div className={styles.body}>
          <p className={styles.lead}>{intro}</p>

          {to ? (
            <div className={styles.statusSwitch}>
              <Switch
                checked={updateStatus}
                onChange={() => setUpdateStatus(current => !current)}
              >
                Update return status to <strong>{nextStatus.label.toLowerCase()}</strong>
              </Switch>
            </div>
          ) : null}

          <HandoffNotesField
            id="handoff-notes"
            label={notesLabel}
            helperText="Notes appear in comments and the reviewer summary."
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
            {to ? 'Cancel handoff' : 'Cancel'}
          </LinkActionButton>
          <Button priority="primary" onClick={() => onConfirm(notes.trim(), updateStatus)}>
            {to ? 'Hand off return' : handoffConfirmLabel(handoff)}
          </Button>
        </div>
      </ModalActions>
    </Modal>
  )
}

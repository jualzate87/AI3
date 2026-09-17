import { useEffect, useState } from 'react'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalActions } from '@ids-ts/modal-dialog'
import '@ids-ts/modal-dialog/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { TextArea } from '@ids-ts/textarea'
import '@ids-ts/textarea/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { useReturnWorkflow } from '../../contexts/ReturnWorkflowContext'
import {
  buildDefaultHandoffNote,
  getReturnStatus,
  getTeamMember,
  type PendingHandoff,
} from '../../lib/returnWorkflow'
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
    const to = getTeamMember(handoff.toAssigneeId)
    setNotes(buildDefaultHandoffNote(from.name, to.name))
  }, [open, handoff])

  if (!handoff) return null
  const from = getTeamMember(handoff.fromAssigneeId)
  const to = getTeamMember(handoff.toAssigneeId)
  const currentStatus = getReturnStatus(workflow.statusId)
  const nextStatus = getReturnStatus(handoff.suggestedStatusId)
  const statusWillChange = workflow.statusId !== handoff.suggestedStatusId

  return (
    <Modal open={open} onClose={onDismiss} size="medium" dismissible>
      <ModalHeader alignment="left" transparentBackground onClose={onDismiss}>
        <div className={styles.titleRow}>
          <img src={intuitIntelligenceLogo} alt="" className={styles.sparkle} />
          <ModalTitle title="Handoff assist" />
        </div>
      </ModalHeader>
      <ModalContent alignment="left" overflow>
        <p className={styles.lead}>
          We noticed you&apos;re changing the assignee to <strong>{to.name}</strong>.
          {statusWillChange ? (
            <>
              {' '}
              We&apos;ll update the return status from{' '}
              <strong>{currentStatus.label}</strong> to <strong>{nextStatus.label}</strong> to match
              this handoff.
            </>
          ) : null}
        </p>

        <section className={styles.previewSection} aria-label="What the next reviewer will see">
          <h3 className={styles.previewHeading}>Quick summary for {to.name}</h3>
          <ul className={styles.previewList}>
            {handoff.previewBullets.map(bullet => (
              <li
                key={bullet.text}
                className={bullet.emphasis ? styles.previewItemEmphasis : styles.previewItem}
              >
                {bullet.text}
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.notesField}>
          <TextArea
            id="handoff-notes"
            label={`Leave notes for ${to.name}`}
            helperText="These notes appear in Comments and the reviewer summary."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
          />
        </div>
      </ModalContent>
      <ModalActions alignment="right">
        <Button priority="tertiary" onClick={onDismiss}>
          Change assignee only
        </Button>
        <Button priority="primary" onClick={() => onConfirm(notes.trim())}>
          Confirm handoff
        </Button>
      </ModalActions>
    </Modal>
  )
}

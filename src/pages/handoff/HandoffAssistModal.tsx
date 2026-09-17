import { useEffect, useState } from 'react'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalActions } from '@ids-ts/modal-dialog'
import '@ids-ts/modal-dialog/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
import { TextArea } from '@ids-ts/textarea'
import '@ids-ts/textarea/dist/main.css'
import { Badge, SuccessBadgeIcon, WarningBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import {
  Accordion,
  AccordionItem,
  AccordionItemHeader,
  AccordionItemBody,
} from '@ids-ts/accordion'
import '@ids-ts/accordion/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { useReturnWorkflow } from '../../contexts/ReturnWorkflowContext'
import {
  buildDefaultHandoffNote,
  getReturnStatus,
  getTeamMember,
  handoffConfirmLabel,
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
    const to = handoff.kind === 'assignee' ? getTeamMember(handoff.toAssigneeId) : null
    setNotes(buildDefaultHandoffNote(from, to))
  }, [open, handoff])

  if (!handoff) return null
  const to = handoff.kind === 'assignee' ? getTeamMember(handoff.toAssigneeId) : null
  const currentStatus = getReturnStatus(workflow.statusId)
  const nextStatus = getReturnStatus(handoff.suggestedStatusId)
  const statusWillChange = workflow.statusId !== handoff.suggestedStatusId
  const sections = handoff.previewSections
  const summaryLabel = to ? `Quick summary for ${to.name}` : 'Quick summary of this return'
  const notesLabel = to ? `Leave notes for ${to.name}` : 'Leave a note on this return'

  return (
    <Modal open={open} onClose={onDismiss} size="large" dismissible>
      <ModalHeader alignment="left" transparentBackground onClose={onDismiss}>
        <ModalTitle title="Handoff assist" />
      </ModalHeader>
      <ModalContent alignment="left" overflow maxHeight="70vh">
        <div className={styles.body}>
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

          <div className={styles.panel}>
            <div className={styles.notesField}>
              <TextArea
                id="handoff-notes"
                label={notesLabel}
                helperText="These notes appear in Comments and the reviewer summary."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={5}
                width="100%"
              />
            </div>

            <Accordion variant="text" size="small" allowZeroExpanded chevronPosition="right">
              <AccordionItem id="handoff-summary">
                <AccordionItemHeader className={styles.summaryHeader}>
                  <span className={styles.summaryHeaderLabel}>
                    <img src={intuitIntelligenceLogo} alt="" className={styles.sparkle} />
                    {summaryLabel}
                  </span>
                </AccordionItemHeader>
                <AccordionItemBody>
                  <div className={styles.sections}>
                    {sections.map(section => (
                      <section key={section.id} className={styles.section}>
                        <div className={styles.sectionHeader}>
                          {section.id === 'heads-up' ? (
                            <Badge shape="round" status="warning" aria-label="Needs attention">
                              <WarningBadgeIcon />
                            </Badge>
                          ) : (
                            <Badge shape="round" status="success" aria-label="Ready">
                              <SuccessBadgeIcon />
                            </Badge>
                          )}
                          <h4 className={styles.sectionTitle}>{section.title}</h4>
                        </div>
                        <p className={styles.sectionIntro}>{section.intro}</p>
                        <ul className={styles.itemList}>
                          {section.items.map(item => (
                            <li key={item.title} className={styles.item}>
                              <span className={styles.itemTitle}>{item.title}</span>
                              <span className={styles.itemDetail}>{item.detail}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </AccordionItemBody>
              </AccordionItem>
            </Accordion>
          </div>
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

import { Modal, ModalHeader, ModalTitle, ModalContent, ModalActions } from '@ids-ts/modal-dialog'
import '@ids-ts/modal-dialog/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { firstName, getTeamMember } from '../../lib/returnWorkflow'
import styles from '../../styles/handoff/JoinedAsModal.module.css'

interface JoinedAsModalProps {
  userId: string | null
  onContinue: () => void
}

export default function JoinedAsModal({ userId, onContinue }: JoinedAsModalProps) {
  const member = userId ? getTeamMember(userId) : null
  const givenName = member ? firstName(member) : ''

  return (
    <Modal open={Boolean(member)} onClose={onContinue} size="small" dismissible>
      <ModalHeader alignment="center" transparentBackground onClose={onContinue}>
        <ModalTitle title={member ? `Joined as ${givenName}` : ''} />
      </ModalHeader>
      <ModalContent alignment="center">
        {member ? (
          <p className={styles.body}>
            You&apos;re now working as {member.name}.
          </p>
        ) : null}
      </ModalContent>
      <ModalActions>
        <Button priority="primary" onClick={onContinue}>
          Continue
        </Button>
      </ModalActions>
    </Modal>
  )
}

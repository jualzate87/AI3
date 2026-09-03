import { Modal, ModalHeader, ModalTitle, ModalContent, ModalActions } from '@ids-ts/modal-dialog'
import '@ids-ts/modal-dialog/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../../styles/data-review/UnsavedChangesModal.module.css'

interface UnsavedChangesModalProps {
  open: boolean
  onStay: () => void
  onLeaveWithoutSaving: () => void
}

export default function UnsavedChangesModal({
  open,
  onStay,
  onLeaveWithoutSaving,
}: UnsavedChangesModalProps) {
  return (
    <Modal open={open} onClose={onStay} size="medium" dismissible>
      <ModalHeader alignment="center" transparentBackground onClose={onStay}>
        <ModalTitle title="Leave without saving?" />
      </ModalHeader>
      <ModalContent alignment="left">
        <p className={styles.body}>
          You have unsaved changes. Choose Save and recalculate return to keep your edits, or leave
          without saving to discard them.
        </p>
      </ModalContent>
      <ModalActions alignment="right">
        <Button priority="tertiary" onClick={onLeaveWithoutSaving}>
          Leave without saving
        </Button>
        <Button priority="primary" onClick={onStay}>
          Keep editing
        </Button>
      </ModalActions>
    </Modal>
  )
}

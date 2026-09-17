import type { ActivityEntry } from '../../hooks/useSyncedReviewState'
import AttestColumns, {
  AttestColumnHeaders,
  AttestColumnPlaceholders,
} from './AttestColumns'
import OutputRowActions from './OutputRowActions'
import styles from '../../styles/data-review/LeftPanel1040.module.css'

type VerificationStripCellProps = {
  label: string
  fieldKey?: string
  contextLabel: string
  showAnnotate?: boolean
  isFlagged?: boolean
  existingFlagNote?: string
  onAddNote?: (text: string, context: string) => void
  onToggleFlagged?: (fieldKey: string) => void
  onSetFlagNote?: (fieldKey: string, note: string) => void
  showAttest?: boolean
  field?: string
  preparerEntry?: ActivityEntry
  reviewerEntry?: ActivityEntry
  managerEntry?: ActivityEntry
  onTogglePreparer?: (fieldName: string) => void
  onToggleReviewer?: (fieldName: string) => void
  onToggleManager?: (fieldName: string) => void
  interactive?: boolean
}

export default function VerificationStripCell({
  label,
  fieldKey,
  contextLabel,
  showAnnotate = false,
  isFlagged = false,
  existingFlagNote = '',
  onAddNote,
  onToggleFlagged,
  onSetFlagNote,
  showAttest = false,
  field,
  preparerEntry,
  reviewerEntry,
  managerEntry,
  onTogglePreparer,
  onToggleReviewer,
  onToggleManager,
  interactive = true,
}: VerificationStripCellProps) {
  const hasStripContent = showAnnotate || showAttest

  return (
    <td className={styles.verifyStripCell}>
      {hasStripContent ? (
        <div className={styles.verificationStripRow}>
          <OutputRowActions
            className={styles.outputRowEndActionsCommentFlag}
            label={label}
            fieldKey={fieldKey ?? field ?? label}
            contextLabel={contextLabel}
            showAnnotate={showAnnotate}
            isFlagged={isFlagged}
            existingFlagNote={existingFlagNote}
            onAddNote={onAddNote}
            onToggleFlagged={onToggleFlagged}
            onSetFlagNote={onSetFlagNote}
          />
          {showAttest && field ? (
            <AttestColumns
              field={field}
              preparerEntry={preparerEntry}
              reviewerEntry={reviewerEntry}
              managerEntry={managerEntry}
              onTogglePreparer={onTogglePreparer}
              onToggleReviewer={onToggleReviewer}
              onToggleManager={onToggleManager}
              interactive={interactive}
            />
          ) : (
            <AttestColumnPlaceholders />
          )}
        </div>
      ) : null}
    </td>
  )
}

export function VerificationStripHeader() {
  return (
    <div className={styles.verificationStripHeader}>
      <span className={styles.verificationStripCommentSpacer} aria-hidden="true" />
      <div className={styles.verificationStripAttestHeaders}>
        <AttestColumnHeaders />
      </div>
    </div>
  )
}

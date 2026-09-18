import FieldAnnotationButton from './FieldAnnotationButton'
import styles from '../../styles/data-review/LeftPanel1040.module.css'

/** Single annotate control - note or flag with type selector (replaces separate comment + flag buttons). */
export default function OutputRowActions({
  fieldKey,
  contextLabel,
  isFlagged = false,
  existingFlagNote = '',
  hasComment = false,
  showAnnotate = false,
  onAddNote,
  onToggleFlagged,
  onSetFlagNote,
  className,
}: {
  label: string
  fieldKey: string
  contextLabel: string
  isFlagged?: boolean
  existingFlagNote?: string
  hasComment?: boolean
  showAnnotate?: boolean
  onAddNote?: (text: string, context: string) => void
  onToggleFlagged?: (fieldKey: string) => void
  onSetFlagNote?: (fieldKey: string, note: string) => void
  className?: string
}) {
  const base = className ?? styles.outputRowEndActions

  if (!showAnnotate) {
    return <div className={base} aria-hidden="true" />
  }

  // An annotation that already exists stays on screen; an empty row waits for hover.
  const annotated = isFlagged || hasComment
  const rootCls = annotated ? base : `${base} ${styles.rowControlOnHover}`

  return (
    <div className={rootCls}>
      <FieldAnnotationButton
        fieldKey={fieldKey}
        contextLabel={contextLabel}
        variant="summary"
        isFlagged={isFlagged}
        hasComment={hasComment}
        existingFlagNote={existingFlagNote}
        onAddNote={onAddNote}
        onToggleFlagged={onToggleFlagged}
        onSetFlagNote={onSetFlagNote}
      />
    </div>
  )
}

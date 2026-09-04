import FieldAnnotationButton from './FieldAnnotationButton'
import styles from '../../styles/data-review/LeftPanel1040.module.css'

/** Single annotate control - note or flag with type selector (replaces separate comment + flag buttons). */
export default function OutputRowActions({
  label,
  fieldKey,
  contextLabel,
  isFlagged = false,
  existingFlagNote = '',
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
  showAnnotate?: boolean
  onAddNote?: (text: string, context: string) => void
  onToggleFlagged?: (fieldKey: string) => void
  onSetFlagNote?: (fieldKey: string, note: string) => void
  className?: string
}) {
  const rootCls = className ?? styles.outputRowEndActions

  if (!showAnnotate) {
    return <div className={rootCls} aria-hidden="true" />
  }

  return (
    <div className={rootCls}>
      <FieldAnnotationButton
        fieldKey={fieldKey}
        contextLabel={contextLabel}
        variant="summary"
        isFlagged={isFlagged}
        existingFlagNote={existingFlagNote}
        onAddNote={onAddNote}
        onToggleFlagged={onToggleFlagged}
        onSetFlagNote={onSetFlagNote}
      />
    </div>
  )
}

import Tooltip from './Tooltip'
import styles from '../../styles/data-review/DetailFields.module.css'

export function isFieldUnsaved(fieldKey: string, unsavedFields?: Set<string>) {
  return unsavedFields?.has(fieldKey) ?? false
}

type FieldEditStatusBadgesProps = {
  fieldKey: string
  unsavedFields?: Set<string>
  recalculatedFields?: Set<string>
  /** When true, show "1040 recalculated" instead of "Saved" */
  flowsTo1040?: boolean
  editTooltip?: string
}

/** Unsaved → "Edited"; after save & recalculate → brief "1040 recalculated" flash */
export function FieldEditStatusBadges({
  fieldKey,
  unsavedFields,
  recalculatedFields,
  flowsTo1040 = false,
  editTooltip,
}: FieldEditStatusBadgesProps) {
  const showRecalc = recalculatedFields?.has(fieldKey)
  const showEdited = isFieldUnsaved(fieldKey, unsavedFields) && !showRecalc

  if (!showRecalc && !showEdited) return null

  return (
    <>
      {showRecalc && (
        <span className={styles.recalcBadge}>
          {flowsTo1040 ? '1040 recalculated' : 'Saved'}
        </span>
      )}
      {showEdited && (
        editTooltip ? (
          <Tooltip text={editTooltip} placement="top">
            <span className={styles.editedBadge}>Edited</span>
          </Tooltip>
        ) : (
          <span className={styles.editedBadge}>Edited</span>
        )
      )}
    </>
  )
}

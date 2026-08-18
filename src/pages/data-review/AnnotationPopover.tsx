import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  ANNOTATION_TYPE_OPTIONS,
  type AnnotationType,
  annotationTypeLabel,
} from './annotationTypes'
import styles from '../../styles/data-review/AnnotationPopover.module.css'

export interface AnnotationPopoverProps {
  open: boolean
  anchor: { top: number; left: number } | null
  anchorMode?: 'center' | 'below'
  contextLabel: string
  draft: string
  annotationType: AnnotationType
  onDraftChange: (value: string) => void
  onTypeChange: (type: AnnotationType) => void
  onClose: () => void
  onSubmit: () => void
  allowFlagTypes?: boolean
  submitLabel?: string
  cancelLabel?: string
  placeholder?: string
  metaLine?: string
  chipVariant?: 'default' | 'flag'
}

export default function AnnotationPopover({
  open,
  anchor,
  anchorMode = 'below',
  contextLabel,
  draft,
  annotationType,
  onDraftChange,
  onTypeChange,
  onClose,
  onSubmit,
  allowFlagTypes = true,
  submitLabel = 'Post',
  cancelLabel = 'Cancel',
  placeholder,
  metaLine,
  chipVariant = 'default',
}: AnnotationPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, onClose])

  if (!open || !anchor) return null

  const typeOptions = allowFlagTypes
    ? ANNOTATION_TYPE_OPTIONS
    : ANNOTATION_TYPE_OPTIONS.filter(o => o.value === 'note')

  const resolvedPlaceholder =
    placeholder ??
    (annotationType === 'note'
      ? 'Add a comment…'
      : `Why does this need a ${annotationTypeLabel(annotationType).toLowerCase()}?`)

  const canSubmit = annotationType === 'note' ? draft.trim().length > 0 : true

  const positionStyle: React.CSSProperties =
    anchorMode === 'center'
      ? { top: anchor.top, left: anchor.left, transform: 'translateY(-50%)' }
      : { top: anchor.top + 4, left: anchor.left }

  return createPortal(
    <div
      ref={ref}
      className={styles.popover}
      style={positionStyle}
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-label={`Annotate ${contextLabel}`}
    >
      <div className={styles.contextRow}>
        <span
          className={[
            styles.contextChip,
            chipVariant === 'flag' ? styles.contextChipFlag : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {contextLabel}
        </span>
      </div>

      <div className={styles.typeRow}>
        <label className={styles.typeLabel} htmlFor="annotation-type-select">
          Type
        </label>
        <select
          id="annotation-type-select"
          className={styles.typeSelect}
          value={annotationType}
          onChange={e => onTypeChange(e.target.value as AnnotationType)}
        >
          {typeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <textarea
        autoFocus
        className={styles.input}
        placeholder={resolvedPlaceholder}
        value={draft}
        onChange={e => onDraftChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
            e.preventDefault()
            onSubmit()
          }
        }}
        rows={3}
      />

      {metaLine ? <div className={styles.meta}>{metaLine}</div> : null}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`${styles.submitBtn} ${canSubmit ? styles.submitBtnActive : ''}`}
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {submitLabel}
        </button>
      </div>
    </div>,
    document.body,
  )
}

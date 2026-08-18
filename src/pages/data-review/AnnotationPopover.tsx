import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Dropdown, MenuItem } from '@ids-ts/dropdown'
import '@ids-ts/dropdown/dist/main.css'
import { TextArea } from '@ids-ts/textarea'
import '@ids-ts/textarea/dist/main.css'
import { B4 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import {
  getAnnotationTypeOptions,
  isNoteLikeAnnotation,
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

  const typeOptions = getAnnotationTypeOptions(allowFlagTypes)

  const resolvedPlaceholder =
    placeholder ??
    (isNoteLikeAnnotation(annotationType)
      ? `Add a ${annotationTypeLabel(annotationType).toLowerCase()}…`
      : `Why does this need a ${annotationTypeLabel(annotationType).toLowerCase()}?`)

  const canSubmit = isNoteLikeAnnotation(annotationType) ? draft.trim().length > 0 : true

  const positionStyle: React.CSSProperties =
    anchorMode === 'center'
      ? { top: anchor.top, left: anchor.left, transform: 'translateY(-50%)' }
      : { top: anchor.top + 4, left: anchor.left }

  const handleTypeChange = (e: React.KeyboardEvent | React.MouseEvent) => {
    const target = e.target as HTMLInputElement
    if (target?.value) onTypeChange(target.value as AnnotationType)
  }

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
        <Badge
          status={chipVariant === 'flag' ? 'warning' : 'info'}
          shape="round"
          capitalization="sentence"
          label={contextLabel}
        />
      </div>

      {typeOptions.length > 1 && (
        <div className={styles.typeRow}>
          <Dropdown
            label="Type"
            size="small"
            value={annotationType}
            width="100%"
            onChange={handleTypeChange}
          >
            {typeOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Dropdown>
        </div>
      )}

      <TextArea
        size="small"
        width="100%"
        placeholder={resolvedPlaceholder}
        value={draft}
        resizeTextArea={false}
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
      />

      {metaLine ? (
        <B4 className={styles.meta}>{metaLine}</B4>
      ) : null}

      <div className={styles.actions}>
        <Button priority="borderless" size="small" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button priority="primary" size="small" disabled={!canSubmit} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>,
    document.body,
  )
}

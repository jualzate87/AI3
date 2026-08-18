import { useCallback, useState } from 'react'
import { Comment, Flag } from '@design-systems/icons'
import Tooltip from './Tooltip'
import AnnotationPopover from './AnnotationPopover'
import {
  formatAnnotationNote,
  parseAnnotationType,
  stripAnnotationPrefix,
  type AnnotationType,
} from './annotationTypes'
import detailStyles from '../../styles/data-review/DetailFields.module.css'
import summaryStyles from '../../styles/data-review/LeftPanel1040.module.css'

type Variant = 'detail' | 'summary'

export interface FieldAnnotationButtonProps {
  fieldKey: string
  contextLabel: string
  variant?: Variant
  isFlagged?: boolean
  existingFlagNote?: string
  allowFlagTypes?: boolean
  onAddNote?: (text: string, context: string) => void
  onToggleFlagged?: (fieldKey: string) => void
  onSetFlagNote?: (fieldKey: string, note: string) => void
  buttonClassName?: string
}

function computeAnchor(btn: HTMLElement, variant: Variant) {
  const rect = btn.getBoundingClientRect()
  if (variant === 'summary') {
    return { top: rect.top + rect.height / 2, left: rect.left - 292 }
  }
  const popoverWidth = 300
  let left = rect.left - popoverWidth - 8
  if (left < 8) left = rect.right + 8
  return { top: rect.bottom, left }
}

export default function FieldAnnotationButton({
  fieldKey,
  contextLabel,
  variant = 'detail',
  isFlagged = false,
  existingFlagNote = '',
  allowFlagTypes = variant === 'summary',
  onAddNote,
  onToggleFlagged,
  onSetFlagNote,
  buttonClassName,
}: FieldAnnotationButtonProps) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const [draft, setDraft] = useState('')
  const [annotationType, setAnnotationType] = useState<AnnotationType>('note')

  const btnCls =
    buttonClassName ??
    (variant === 'summary' ? summaryStyles.summaryActionBtn : detailStyles.commentBtn)
  const activeCls =
    variant === 'summary'
      ? summaryStyles.summaryActionBtnActive
      : detailStyles.commentBtnActive
  const flagCls = variant === 'summary' ? summaryStyles.summaryActionBtnFlag : ''

  const close = useCallback(() => {
    setOpen(false)
    setAnchor(null)
    setDraft('')
    setAnnotationType('note')
  }, [])

  const openPopover = (btn: HTMLElement) => {
    const initialType = parseAnnotationType(existingFlagNote, isFlagged)
    setAnnotationType(initialType)
    setDraft(
      initialType === 'note' && !isFlagged
        ? ''
        : stripAnnotationPrefix(existingFlagNote),
    )
    setAnchor(computeAnchor(btn, variant))
    setOpen(true)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (open) close()
    else openPopover(e.currentTarget)
  }

  const handleSubmit = () => {
    const formatted = formatAnnotationNote(annotationType, draft)
    if (annotationType === 'note') {
      if (!formatted) return
      onAddNote?.(formatted, contextLabel)
    } else if (variant === 'summary' && onToggleFlagged && onSetFlagNote) {
      if (!isFlagged) onToggleFlagged(fieldKey)
      onSetFlagNote(fieldKey, formatted)
    } else {
      onAddNote?.(formatted, contextLabel)
    }
    close()
  }

  const showFlagIcon = isFlagged && variant === 'summary'
  const tooltip = showFlagIcon ? 'Edit flag or add note' : 'Add note or flag'

  return (
    <>
      <Tooltip text={tooltip} placement="top" disabled={open}>
        <button
          type="button"
          className={[btnCls, open ? activeCls : '', showFlagIcon ? flagCls : '']
            .filter(Boolean)
            .join(' ')}
          aria-label={`Annotate ${contextLabel}`}
          aria-pressed={isFlagged}
          onClick={handleClick}
        >
          {showFlagIcon ? <Flag size="small" aria-hidden /> : <Comment size="small" />}
        </button>
      </Tooltip>
      <AnnotationPopover
        open={open}
        anchor={anchor}
        anchorMode={variant === 'summary' ? 'center' : 'below'}
        contextLabel={contextLabel}
        draft={draft}
        annotationType={annotationType}
        onDraftChange={setDraft}
        onTypeChange={setAnnotationType}
        onClose={close}
        onSubmit={handleSubmit}
        allowFlagTypes={allowFlagTypes}
        submitLabel={annotationType === 'note' ? 'Post' : 'Save'}
        cancelLabel={annotationType === 'note' ? 'Cancel' : 'Skip'}
        chipVariant={annotationType !== 'note' ? 'flag' : 'default'}
      />
    </>
  )
}

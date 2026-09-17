import { useCallback, useEffect, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPEN_CATCH_UP_KEY, REVIEWER_WELCOME_KEY } from '../../lib/returnWorkflow'
import ReviewerAiDynamicPopover from './ReviewerAiDynamicPopover'
import ReviewerAiProactiveToast from './ReviewerAiProactiveToast'

export type ReviewerPromptVariant = 'popover' | 'toast'

interface ReviewerHandoffPromptProps {
  variant: ReviewerPromptVariant
  anchorRef: RefObject<HTMLButtonElement | null>
  onDismiss: () => void
}

/** Proactive Jake handoff nudge — Figma Dynamic Popover or Proactive toast. */
export default function ReviewerHandoffPrompt({
  variant,
  anchorRef,
  onDismiss,
}: ReviewerHandoffPromptProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setAnchor(anchorRef.current)
  }, [anchorRef])

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), 600)
    return () => window.clearTimeout(timer)
  }, [])

  const finish = useCallback(() => {
    sessionStorage.removeItem(REVIEWER_WELCOME_KEY)
    setOpen(false)
    onDismiss()
  }, [onDismiss])

  const handleClose = useCallback(() => {
    setOpen(false)
    finish()
  }, [finish])

  const openCatchUp = useCallback(() => {
    sessionStorage.setItem(OPEN_CATCH_UP_KEY, '1')
    finish()
    navigate('/ai-review', { state: { layoutMode: 'sidebar' } })
  }, [finish, navigate])

  const openFullReview = useCallback(() => {
    sessionStorage.removeItem(OPEN_CATCH_UP_KEY)
    finish()
    navigate('/ai-review', { state: { layoutMode: 'sidebar' } })
  }, [finish, navigate])

  if (variant === 'toast') {
    return (
      <ReviewerAiProactiveToast
        open={open}
        onClose={handleClose}
        onFullReview={openFullReview}
        onGetCaughtUp={openCatchUp}
      />
    )
  }

  return (
    <ReviewerAiDynamicPopover
      open={open}
      anchor={anchor}
      onClose={handleClose}
      onFullReview={openFullReview}
      onGetCaughtUp={openCatchUp}
    />
  )
}

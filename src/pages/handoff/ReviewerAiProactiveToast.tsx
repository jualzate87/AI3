import { useLayoutEffect, useState } from 'react'
import { Close } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import {
  handoffSenderFirstName,
  handoffToastCta,
  reviewerAiProactiveHeadline,
} from './reviewerHandoffCopy'
import styles from '../../styles/handoff/ReviewerAiProactiveToast.module.css'

const TOAST_OFFSET_PX = 8

interface ReviewerAiProactiveToastProps {
  open: boolean
  anchor: HTMLElement | null
  onClose: () => void
  onViewSummary: () => void
}

/** Figma Proactive toast — headline + tertiary CTA, anchored to the AI review button. */
export default function ReviewerAiProactiveToast({
  open,
  anchor,
  onClose,
  onViewSummary,
}: ReviewerAiProactiveToastProps) {
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setCoords(null)
      return
    }

    const update = () => {
      const rect = anchor.getBoundingClientRect()
      setCoords({
        top: rect.bottom + TOAST_OFFSET_PX,
        right: Math.max(TOAST_OFFSET_PX, window.innerWidth - rect.right),
      })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchor])

  if (!open || !coords) return null

  const headline = reviewerAiProactiveHeadline(handoffSenderFirstName())

  return (
    <div
      className={styles.wrap}
      style={{ top: coords.top, right: coords.right }}
      role="dialog"
      aria-labelledby="reviewer-ai-toast-headline"
      aria-describedby="reviewer-ai-toast-action"
    >
      <div className={styles.surface}>
        <div className={styles.border} aria-hidden />
        <div className={styles.inner}>
          <div className={styles.titleRow}>
            <div className={styles.titleMain}>
              <img src={intuitIntelligenceLogo} alt="" className={styles.logo} />
              <p id="reviewer-ai-toast-headline" className={styles.headline}>
                {headline}
              </p>
            </div>
            <IconControl aria-label="Dismiss" size="small" shape="square" onClick={onClose}>
              <Close size="small" />
            </IconControl>
          </div>
          <div className={styles.actions}>
            <Button
              id="reviewer-ai-toast-action"
              priority="tertiary"
              size="medium"
              onClick={onViewSummary}
            >
              {handoffToastCta()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

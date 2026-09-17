import { Close } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import {
  REVIEWER_AI_TOAST_CTA,
  reviewerAiProactiveHeadline,
} from './reviewerHandoffCopy'
import styles from '../../styles/handoff/ReviewerAiProactiveToast.module.css'

interface ReviewerAiProactiveToastProps {
  open: boolean
  onClose: () => void
  onViewSummary: () => void
}

/** Figma Proactive toast — headline + tertiary CTA, gradient border. */
export default function ReviewerAiProactiveToast({
  open,
  onClose,
  onViewSummary,
}: ReviewerAiProactiveToastProps) {
  if (!open) return null

  const headline = reviewerAiProactiveHeadline()

  return (
    <div
      className={styles.wrap}
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
            <IconControl label="Dismiss" size="small" shape="square" onClick={onClose}>
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
              {REVIEWER_AI_TOAST_CTA}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

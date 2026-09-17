import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { useReturnWorkflow } from '../../contexts/ReturnWorkflowContext'
import {
  REVIEWER_AI_TOAST_PRIMARY,
  REVIEWER_AI_TOAST_SECONDARY,
  reviewerAiToastBody,
  reviewerAiToastTitle,
} from './reviewerHandoffCopy'
import styles from '../../styles/handoff/ReviewerAiProactiveToast.module.css'

interface ReviewerAiProactiveToastProps {
  open: boolean
  onClose: () => void
  onFullReview: () => void
  onGetCaughtUp: () => void
}

export default function ReviewerAiProactiveToast({
  open,
  onClose,
  onFullReview,
  onGetCaughtUp,
}: ReviewerAiProactiveToastProps) {
  const { currentUser } = useReturnWorkflow()
  const reviewerFirst = currentUser.name.split(' ')[0]

  if (!open) return null

  return (
    <div className={styles.wrap} role="dialog" aria-labelledby="reviewer-ai-toast-title">
      <div className={styles.surface}>
        <div className={styles.border} aria-hidden />
        <div className={styles.inner}>
          <div className={styles.header}>
            <img src={intuitIntelligenceLogo} alt="" className={styles.logo} />
            <h2 id="reviewer-ai-toast-title" className={styles.title}>
              {reviewerAiToastTitle(reviewerFirst)}
            </h2>
          </div>
          <p className={styles.description}>{reviewerAiToastBody()}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} onClick={onGetCaughtUp}>
              {REVIEWER_AI_TOAST_SECONDARY}
            </button>
            <div className={styles.primaryWrap}>
              <Button
                purpose="standard"
                priority="primary"
                size="medium"
                onClick={() => {
                  onFullReview()
                  onClose()
                }}
              >
                {REVIEWER_AI_TOAST_PRIMARY}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

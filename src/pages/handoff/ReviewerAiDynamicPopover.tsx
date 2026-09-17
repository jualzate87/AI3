import { Close } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import { Popover, PopoverActions, PopoverContent } from '@ids-ts/popover'
import '@ids-ts/popover/dist/main.css'
import {
  REVIEWER_AI_CARD_FULL_REVIEW,
  REVIEWER_AI_GET_STARTED,
  REVIEWER_AI_POPOVER_TITLE,
  reviewerAiCardGetCaughtUp,
  reviewerAiPopoverBody,
} from './reviewerHandoffCopy'
import styles from '../../styles/handoff/ReviewerAiDynamicPopover.module.css'

interface ReviewerAiDynamicPopoverProps {
  open: boolean
  anchor: HTMLElement | null
  onClose: () => void
  onFullReview: () => void
  onGetCaughtUp: () => void
}

export default function ReviewerAiDynamicPopover({
  open,
  anchor,
  onClose,
  onFullReview,
  onGetCaughtUp,
}: ReviewerAiDynamicPopoverProps) {
  const getCaughtUp = reviewerAiCardGetCaughtUp()

  if (!anchor) return null

  return (
    <Popover
      aria-label={REVIEWER_AI_POPOVER_TITLE}
      open={open}
      dismissible
      animationOn
      suppressPointer={false}
      unmountDelay={200}
      variant="popover"
      position="bottom"
      alignment="right"
      popoverOffsetDistance={8}
      popoverOffsetSkidding={0}
      targetElement={anchor}
      onClose={onClose}
      onPosition={() => {}}
      stylePosition={{ zIndex: 1000 }}
    >
      <PopoverContent>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>{REVIEWER_AI_POPOVER_TITLE}</h2>
          <IconControl label="Dismiss" size="small" shape="square" onClick={onClose}>
            <Close size="small" />
          </IconControl>
        </div>
        <p className={styles.bodyText}>{reviewerAiPopoverBody()}</p>
        <div className={styles.cards}>
          <button type="button" className={styles.cardOption} onClick={onFullReview}>
            <span className={styles.cardTitle}>{REVIEWER_AI_CARD_FULL_REVIEW.title}</span>
            {' — '}
            <span className={styles.cardBody}>{REVIEWER_AI_CARD_FULL_REVIEW.body}</span>
          </button>
          <button type="button" className={styles.cardOption} onClick={onGetCaughtUp}>
            <span className={styles.cardTitle}>{getCaughtUp.title}</span>
            {' — '}
            <span className={styles.cardBody}>{getCaughtUp.body}</span>
          </button>
        </div>
      </PopoverContent>
      <PopoverActions isStacked={false}>
        <Button purpose="ai" priority="primary" size="medium" onClick={onGetCaughtUp}>
          {REVIEWER_AI_GET_STARTED}
        </Button>
      </PopoverActions>
    </Popover>
  )
}

import { ProgressBar } from '@ids-ts/progress-bar'
import '@ids-ts/progress-bar/dist/main.css'
import styles from '../../styles/data-review/DocReviewProgress.module.css'

type DocReviewProgressProps = {
  verified: number
  total: number
  /** compact = inline chip; default = stacked card (Phase 1 banner) */
  variant?: 'compact' | 'card'
  className?: string
}

/** Shared X of Y verified progress - Phase 1 banner, issue banner, panel header. */
export default function DocReviewProgress({
  verified,
  total,
  variant = 'card',
  className,
}: DocReviewProgressProps) {
  const remaining = Math.max(0, total - verified)
  const complete = total > 0 && verified >= total

  if (variant === 'compact') {
    return (
      <div
        className={[styles.compactWrap, className].filter(Boolean).join(' ')}
        aria-live="polite"
      >
        <p className={styles.compactLabel}>
          <strong className={styles.compactNum}>{verified}</strong>
          <span className={styles.compactOf}> / {total} Documents verified</span>
        </p>
        <div className={styles.compactProgressBar}>
          <ProgressBar
            value={verified}
            max={total || 1}
            persistent={complete}
            automationId="doc-review-progress"
            aria-label={`${verified} of ${total} documents verified${remaining > 0 ? `, ${remaining} remaining` : ''}`}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={[styles.card, className].filter(Boolean).join(' ')}
      aria-live="polite"
    >
      <span className={styles.cardLabel}>Document review</span>
      <span className={styles.cardPrimary}>
        <strong className={styles.cardNum}>{verified}</strong>
        <span className={styles.cardOf}> of {total} verified</span>
      </span>
      {remaining > 0 && (
        <span className={styles.cardHint}>{remaining} remaining</span>
      )}
    </div>
  )
}

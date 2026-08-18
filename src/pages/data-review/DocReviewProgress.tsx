import styles from '../../styles/data-review/DocReviewProgress.module.css'

type DocReviewProgressProps = {
  verified: number
  total: number
  /** compact = inline chip; default = stacked card (Phase 1 banner) */
  variant?: 'compact' | 'card'
  className?: string
}

/** Shared X of Y verified progress — Phase 1 banner, issue banner, panel header. */
export default function DocReviewProgress({
  verified,
  total,
  variant = 'card',
  className,
}: DocReviewProgressProps) {
  const remaining = Math.max(0, total - verified)

  if (variant === 'compact') {
    return (
      <span
        className={[styles.compact, className].filter(Boolean).join(' ')}
        aria-live="polite"
        aria-label={`${verified} of ${total} documents verified${remaining > 0 ? `, ${remaining} remaining` : ''}`}
      >
        <strong className={styles.compactNum}>{verified}</strong>
        <span className={styles.compactOf}> / {total} verified</span>
        {remaining > 0 && (
          <span className={styles.compactHint}> · {remaining} left</span>
        )}
      </span>
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

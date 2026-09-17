import styles from '../../styles/agent-review/AgentReviewBackdrop.module.css'

interface AgentReviewBackdropProps {
  onDismiss?: () => void
}

/** Dimmed return workspace visible behind sidebar-mode AI review. */
export default function AgentReviewBackdrop({ onDismiss }: AgentReviewBackdropProps) {
  return (
    <div className={styles.backdrop} aria-hidden={!onDismiss}>
      <button
        type="button"
        className={styles.dismissHitArea}
        aria-label="Close AI review"
        onClick={onDismiss}
      />
      <div className={styles.preview}>
        <div className={styles.previewHeader}>
          <span className={styles.previewTitle}>Check return</span>
          <span className={styles.previewMeta}>Jordan Wells · 1040 · 2025</span>
        </div>
        <div className={styles.previewTable}>
          {['Federal summary', 'Form 1040', 'Schedule C', 'AI diagnostics'].map(label => (
            <div key={label} className={styles.previewRow}>
              <span className={styles.previewCellLabel}>{label}</span>
              <span className={styles.previewCellValue}>—</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

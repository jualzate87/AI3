import { PopOut, Refresh } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../../styles/check-return/ReviewReturnPopoutHeader.module.css'

interface ReviewReturnPopoutHeaderProps {
  onViewSourceDocuments: () => void
  onRefreshForms?: () => void
}

export default function ReviewReturnPopoutHeader({
  onViewSourceDocuments,
  onRefreshForms,
}: ReviewReturnPopoutHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.metaGroup}>
        <div className={styles.clientName}>
          Jordan
          <br />
          Wells
        </div>
        <div className={styles.divider} aria-hidden />
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Tax year</span>
          <span className={styles.metaValue}>2025</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Return type</span>
          <span className={styles.metaValue}>1040</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          priority="secondary"
          purpose="passive"
          onClick={onViewSourceDocuments}
          automationId="review-return-popout-view-source-docs"
        >
          <PopOut size="small" aria-hidden />
          View source documents
        </Button>
        <Button
          priority="primary"
          onClick={onRefreshForms}
          automationId="review-return-popout-refresh-forms"
        >
          <Refresh size="small" aria-hidden />
          Refresh forms
        </Button>
      </div>
    </header>
  )
}

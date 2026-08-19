import { CircleCheck } from '@design-systems/icons'
import AttentionCountBadge from './AttentionCountBadge'
import Tooltip from './Tooltip'
import type { DocConfirmStatus } from './docReviewStatus'
import styles from '../../styles/data-review/PeelTab.module.css'

interface PeelTabProps {
  tabs: {
    key: string
    label: string
    /** True when this document is not yet mark-reviewed */
    needsReview?: boolean
    /** Unresolved Phase 1 import flags on this document */
    flagCount?: number
    /** True when this payer originally had flags (or is verified) and count is 0 */
    showClearedCheck?: boolean
    /** Reviewer doc confirm state (Pass 2) */
    confirmStatus?: DocConfirmStatus
  }[]
  activeKey: string
  onChange: (key: string) => void
}

export default function PeelTab({ tabs, activeKey, onChange }: PeelTabProps) {
  return (
    <div className={styles.container}>
      {tabs.map(tab => {
        const isActive = tab.key === activeKey
        const confirmStatus = tab.confirmStatus
        const flagCount = tab.flagCount ?? 0
        const needsReview = tab.needsReview && !tab.showClearedCheck && confirmStatus !== 'confirmed'
        const showNeedsReviewTip =
          needsReview && !flagCount && confirmStatus !== 'needs-confirm'

        const tabButton = (
          <button
            type="button"
            className={[
              styles.tab,
              isActive ? styles.tabActive : styles.tabInactive,
              needsReview && !isActive ? styles.tabNeedsReview : '',
              confirmStatus === 'confirmed' && !isActive ? styles.tabConfirmed : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onChange(tab.key)}
            aria-label={
              [
                tab.label,
                needsReview ? 'needs review' : '',
                flagCount > 0 ? `${flagCount} import flag${flagCount === 1 ? '' : 's'}` : '',
                tab.showClearedCheck ? 'reviewed' : '',
              ].filter(Boolean).join(', ')
            }
          >
            {tab.label}
            {flagCount > 0 && confirmStatus !== 'needs-confirm' && (
              <AttentionCountBadge
                count={flagCount}
                className={styles.flagBadge}
                tooltip={`${flagCount} import flag${flagCount === 1 ? '' : 's'} on this document`}
                aria-label={`${flagCount} import flag${flagCount === 1 ? '' : 's'}`}
              />
            )}
            {confirmStatus === 'needs-confirm' && (
              <AttentionCountBadge
                count={1}
                className={styles.flagBadge}
                tooltip="Waiting for reviewer confirmation"
                aria-label="Needs reviewer confirmation"
              />
            )}
            {confirmStatus === 'confirmed' && (
              <span
                className={`${styles.clearedCheck} ${isActive ? styles.clearedCheckActive : ''}`}
                aria-hidden
              >
                <CircleCheck size="small" />
              </span>
            )}
            {!confirmStatus && tab.showClearedCheck && (
              <span
                className={`${styles.clearedCheck} ${isActive ? styles.clearedCheckActive : ''}`}
                aria-hidden
              >
                <CircleCheck size="small" />
              </span>
            )}
          </button>
        )

        return showNeedsReviewTip ? (
          <Tooltip key={tab.key} text="Not yet marked reviewed" placement="top">
            {tabButton}
          </Tooltip>
        ) : (
          <span key={tab.key} className={styles.tabWrap}>
            {tabButton}
          </span>
        )
      })}
    </div>
  )
}

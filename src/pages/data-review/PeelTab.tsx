import { CircleCheck, PersonCheckDouble } from '@design-systems/icons'
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
    /** Full approval or blocker explanation for the tab tooltip. */
    statusTooltip?: string
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
        const statusTooltip =
          tab.statusTooltip ??
          (confirmStatus === 'confirmed'
            ? 'Verified by preparer and reviewer'
            : confirmStatus === 'needs-confirm'
              ? 'Verified by preparer · Waiting for reviewer verification'
              : flagCount > 0
                ? `${flagCount} import flag${flagCount === 1 ? '' : 's'} must be resolved before verification`
                : needsReview
                  ? 'Not verified yet'
                  : 'Document verified')

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
                confirmStatus === 'needs-confirm' ? 'waiting for reviewer verification' : '',
                confirmStatus === 'confirmed' ? 'verified by preparer and reviewer' : '',
              ].filter(Boolean).join(', ')
            }
          >
            {tab.label}
            {flagCount > 0 && confirmStatus !== 'needs-confirm' && (
              <AttentionCountBadge
                count={flagCount}
                className={styles.flagBadge}
                aria-label={`${flagCount} import flag${flagCount === 1 ? '' : 's'}`}
              />
            )}
            {confirmStatus === 'needs-confirm' && (
              <AttentionCountBadge
                count={1}
                className={styles.flagBadge}
                aria-label="Needs reviewer confirmation"
              />
            )}
            {confirmStatus === 'confirmed' && (
              <span
                className={`${styles.clearedCheck} ${isActive ? styles.clearedCheckActive : ''}`}
                aria-hidden
              >
                <PersonCheckDouble size="small" />
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

        return (
          <Tooltip key={tab.key} text={statusTooltip} placement="top">
            {tabButton}
          </Tooltip>
        )
      })}
    </div>
  )
}

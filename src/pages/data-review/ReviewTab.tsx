import { ChevronRight, CircleCheck, CirclePlus, PopIn } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import sparklesIcon from '../../assets/icons/sparkles.svg'
import AttentionCountBadge from './AttentionCountBadge'
import TabReviewCountBadge from './TabReviewCountBadge'
import type { DocConfirmStatus } from './docReviewStatus'
import styles from '../../styles/data-review/ReviewTab.module.css'

// Import docs first; Questionnaire last (reference / Organizer). Prior-year 1040 lives on Summary YoY only.
const TABS = [
  { label: 'W-2s', key: 'w2s' as const },
  { label: '1099-DIVs', key: '1099-divs' as const },
  { label: '1099-INTs', key: '1099-ints' as const },
  { label: '1099-Rs', key: '1099-rs' as const },
  { label: '1099-NECs', key: '1099-necs' as const },
  { label: 'Questionnaire', key: 'questionnaire' as const },
]

export type TopTab =
  | 'w2s'
  | '1099-divs'
  | '1099-ints'
  | '1099-rs'
  | '1099-necs'
  | 'questionnaire'

const TAB_KEYS = new Set<string>(TABS.map(t => t.key))

interface ReviewTabProps {
  activeTopTab?: string
  onTopTabChange?: (tab: TopTab) => void
  onTabChange?: (tab: string) => void
  /** Per-tab count of unreviewed documents — drives dynamic tab badges (preparer Phase 1) */
  unreviewedCounts?: Record<string, number>
  /** Per-tab reviewed/total — "X of Y" badges when provided (preferred in Phase 1) */
  tabReviewCounts?: Record<string, { reviewed: number; total: number }>
  /** @deprecated Use unreviewedCounts — kept for legacy flag-only flows */
  flagCounts?: Record<string, number>
  /** Initial flag totals — used when combining with verified semantics */
  initialFlagCounts?: Record<string, number>
  /** Docs the preparer marked verified */
  verifiedDocs?: Set<string>
  /** Map top-tab key → verified doc key(s) for type-level green check */
  tabVerifiedKeys?: Record<string, string[]>
  /**
   * Per-tab: true when every L2 doc in that type is reviewed/verified.
   * When provided, drives the L1 green check (preferred over internal heuristics).
   */
  typeReviewed?: Record<string, boolean>
  /** Pass 2 reviewer: aggregate confirm status per top tab */
  tabConfirmStatus?: Record<string, DocConfirmStatus>
  /** Pass 2 reviewer: count of docs awaiting confirmation per top tab */
  tabConfirmCounts?: Record<string, number>
  /** When true, shows Dock back control (popout window only) */
  isPopout?: boolean
  /** Phase 1 preparer: show "+ Add item to review" at end of tab row */
  showAddItem?: boolean
  onAddItemClick?: () => void
  /** Phase 1 preparer: jump to next unreviewed source document */
  showNextDocument?: boolean
  onNextDocumentClick?: () => void
  unreviewedDocCount?: number
}

export default function ReviewTab({
  activeTopTab = 'w2s',
  onTopTabChange,
  onTabChange,
  unreviewedCounts,
  tabReviewCounts,
  flagCounts,
  initialFlagCounts,
  verifiedDocs,
  tabVerifiedKeys,
  typeReviewed,
  tabConfirmStatus,
  tabConfirmCounts,
  isPopout = false,
  showAddItem = true,
  onAddItemClick,
  showNextDocument = false,
  onNextDocumentClick,
  unreviewedDocCount = 0,
}: ReviewTabProps) {
  const handleTabClick = (key: string, label: string) => {
    if (TAB_KEYS.has(key)) {
      onTopTabChange?.(key as TopTab)
    }
    onTabChange?.(label)
  }

  const renderBadge = (tabKey: string) => {
    const confirmStatus = tabConfirmStatus?.[tabKey]
    if (confirmStatus === 'needs-confirm') {
      const confirmCount = tabConfirmCounts?.[tabKey] ?? 1
      return (
        <AttentionCountBadge
          count={confirmCount}
          className={styles.tabCountBadge}
          tooltip="Documents waiting for reviewer confirmation"
          aria-label="Documents need reviewer confirmation"
        />
      )
    }
    if (confirmStatus === 'confirmed') {
      return (
        <span className={styles.tabClearedCheck} aria-label="All documents confirmed">
          <CircleCheck size="small" />
        </span>
      )
    }

    const docCounts = tabReviewCounts?.[tabKey]
    if (docCounts && docCounts.total > 0) {
      return (
        <TabReviewCountBadge
          reviewed={docCounts.reviewed}
          total={docCounts.total}
          className={styles.tabCountBadge}
          tooltip={
            docCounts.reviewed >= docCounts.total
              ? `All ${docCounts.total} document${docCounts.total === 1 ? '' : 's'} reviewed in this section`
              : `${docCounts.total - docCounts.reviewed} document${docCounts.total - docCounts.reviewed === 1 ? '' : 's'} not yet marked reviewed in this section`
          }
        />
      )
    }

    const docUnreviewed = unreviewedCounts?.[tabKey] ?? 0
    if (docUnreviewed > 0) {
      return (
        <TabReviewCountBadge
          reviewed={0}
          total={docUnreviewed}
          className={styles.tabCountBadge}
          tooltip={`${docUnreviewed} document${docUnreviewed === 1 ? '' : 's'} not yet marked reviewed in this section`}
        />
      )
    }

    if (!flagCounts && !typeReviewed && !verifiedDocs) return null
    const count = flagCounts?.[tabKey] ?? 0
    if (count > 0) {
      return (
        <AttentionCountBadge
          count={count}
          className={styles.tabCountBadge}
          tooltip={`${count} import flag${count === 1 ? '' : 's'} needing attention in this section`}
        />
      )
    }
    if (typeReviewed?.[tabKey]) {
      return (
        <span className={styles.tabClearedCheck} aria-label="All documents reviewed">
          <CircleCheck size="small" />
        </span>
      )
    }
    const verifiedKeys = tabVerifiedKeys?.[tabKey] ?? []
    const allVerified =
      verifiedKeys.length > 0 && verifiedKeys.every(k => verifiedDocs?.has(k))
    const initial = initialFlagCounts?.[tabKey] ?? 0
    const flagsCleared = initial > 0 && count === 0 && verifiedKeys.length <= 1
    if (allVerified || flagsCleared) {
      return (
        <span className={styles.tabClearedCheck} aria-label="All documents reviewed">
          <CircleCheck size="small" />
        </span>
      )
    }
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={styles.tab}
            onClick={() => handleTabClick(tab.key, tab.label)}
          >
            <div className={styles.tabContent}>
              <img src={sparklesIcon} alt="" className={`${styles.tabIcon} ${tab.key !== activeTopTab ? styles.tabIconInactive : ''}`} />
              <span className={`${styles.tabLabel} ${tab.key === activeTopTab ? styles.tabLabelActive : styles.tabLabelInactive}`}>
                {tab.label}
              </span>
              {renderBadge(tab.key)}
            </div>
            <div className={styles.tabUnderline}>
              <div className={tab.key === activeTopTab ? styles.tabUnderlineActive : styles.tabUnderlineInactive} />
            </div>
          </button>
        ))}
      </div>

      <div className={styles.tabActions}>
        {showAddItem && onAddItemClick && (
          <Button
            priority="tertiary"
            size="small"
            className={styles.addItemBtn}
            onClick={onAddItemClick}
          >
            <CirclePlus size="small" />
            Add item to review
          </Button>
        )}
        {showNextDocument && onNextDocumentClick && unreviewedDocCount > 0 && (
          <Button
            priority="primary"
            size="small"
            className={styles.nextDocBtn}
            onClick={onNextDocumentClick}
          >
            Next document
            <ChevronRight size="small" />
          </Button>
        )}
        {isPopout && (
          <button
            type="button"
            className={styles.dockBackBtn}
            aria-label="Dock back to main window"
            onClick={() => window.close()}
          >
            <PopIn size="small" />
            Dock back
          </button>
        )}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from '@design-systems/icons'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import {
  REVIEW_LOG_DAYS,
  REVIEW_LOG_FILTERS,
  actorInitials,
  getEntryKind,
  getReviewLogCounts,
  type ReviewLogEntry,
  type ReviewLogKind,
} from './reviewLogData'
import styles from '../../styles/check-return/ReviewLogPanel.module.css'

type ReviewLogFilterId = ReviewLogKind | 'all'

const KIND_DOT_CLASS: Record<ReviewLogKind, string> = {
  edit: styles.summaryDotAttention,
  document: styles.summaryDotInfo,
  'form-check': styles.summaryDotNeutral,
  diagnostic: styles.summaryDotPositive,
}

const SUMMARY_ITEMS: {
  key: keyof ReturnType<typeof getReviewLogCounts>
  label: string
  dotClass: string
}[] = [
  { key: 'edit', label: 'Edited', dotClass: styles.summaryDotAttention },
  { key: 'document', label: 'Documents', dotClass: styles.summaryDotInfo },
  { key: 'form-check', label: 'Form checks', dotClass: styles.summaryDotNeutral },
  { key: 'diagnostic', label: 'Diagnostics', dotClass: styles.summaryDotPositive },
]

type ReviewLogPanelProps = {
  isOpen: boolean
  onToggle: () => void
}

function ValueChange({ before, after }: { before: string; after: string }) {
  return (
    <p className={styles.valueChange}>
      <span className={styles.valueBefore}>{before}</span>
      <span className={styles.valueArrow} aria-hidden>
        to
      </span>
      <span className={styles.valueAfter}>{after}</span>
    </p>
  )
}

function LogEntryRow({ entry }: { entry: ReviewLogEntry }) {
  const initials = actorInitials(entry.actor)

  return (
    <li className={styles.entry}>
      <div className={styles.entryRail} aria-hidden>
        <span className={`${styles.summaryDot} ${KIND_DOT_CLASS[getEntryKind(entry)]}`} />
        <span className={styles.entryLine} />
      </div>
      <div className={styles.entryBody}>
        <div className={styles.entryHeader}>
          <span className={styles.actorAvatar} title={entry.actor} aria-label={entry.actor}>
            {initials}
          </span>
          <p className={styles.entryTitle}>{entry.title}</p>
        </div>
        {entry.before != null && entry.after != null ? (
          <ValueChange before={entry.before} after={entry.after} />
        ) : null}
        {entry.detail ? <p className={styles.entryDetail}>{entry.detail}</p> : null}
        <p className={styles.entryMeta}>
          <span className={styles.entrySource}>{entry.location}</span>
          <span className={styles.entryTime}>{entry.time}</span>
        </p>
      </div>
    </li>
  )
}

export default function ReviewLogPanel({ isOpen, onToggle }: ReviewLogPanelProps) {
  const [activeFilter, setActiveFilter] = useState<ReviewLogFilterId>('all')
  const counts = useMemo(() => getReviewLogCounts(), [])

  const filteredDays = useMemo(() => {
    if (activeFilter === 'all') return REVIEW_LOG_DAYS
    return REVIEW_LOG_DAYS.map(day => ({
      ...day,
      entries: day.entries.filter(entry => getEntryKind(entry) === activeFilter),
    })).filter(day => day.entries.length > 0)
  }, [activeFilter])

  if (!isOpen) {
    return (
      <aside className={styles.collapsedShell} aria-label="Review log">
        <button
          type="button"
          className={styles.expandButton}
          onClick={onToggle}
          aria-expanded={false}
          aria-controls="review-log-panel"
        >
          <ChevronLeft size="medium" aria-hidden />
          <span className={styles.expandLabel}>Review log</span>
        </button>
      </aside>
    )
  }

  return (
    <aside
      id="review-log-panel"
      className={styles.panel}
      aria-label="Review log"
    >
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.title}>Review log</h2>
          <IconControl
            size="medium"
            onClick={onToggle}
            aria-label="Collapse review log"
          >
            <ChevronRight aria-hidden />
          </IconControl>
        </div>
        <p className={styles.intro}>
          Edits, document confirmations, form checks, and diagnostic resolutions for this return.
        </p>
      </header>

      <div className={styles.summaryStrip}>
        <span className={styles.summaryTotal}>
          <span className={`${styles.summaryDot} ${styles.summaryDotNeutral}`} aria-hidden />
          {counts.total} entries
        </span>
        <div className={styles.summaryMetrics}>
          {SUMMARY_ITEMS.map(item => (
            <span key={item.key} className={styles.summaryMetric}>
              <span
                className={`${styles.summaryDot} ${item.dotClass}`}
                aria-hidden
              />
              {counts[item.key]} {item.label}
            </span>
          ))}
        </div>
      </div>

      <div
        className={styles.filterRow}
        role="tablist"
        aria-label="Filter review log activity"
      >
        {REVIEW_LOG_FILTERS.map(filter => {
          const isActive = activeFilter === filter.id
          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={[styles.filterChip, isActive ? styles.filterChipActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      <div className={styles.timelineScroll}>
        {filteredDays.length === 0 ? (
          <p className={styles.emptyState}>No activity matches this filter.</p>
        ) : (
          filteredDays.map(day => (
            <section key={day.id} className={styles.dayGroup} aria-labelledby={`day-${day.id}`}>
              <h3 id={`day-${day.id}`} className={styles.dayLabel}>
                {day.label}
              </h3>
              <ul className={styles.entryList}>
                {day.entries.map(entry => (
                  <LogEntryRow key={entry.id} entry={entry} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </aside>
  )
}

import { useMemo, useState } from 'react'
import { ChevronLeft, Close, Refresh } from '@design-systems/icons'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Dropdown, MenuItem } from '@ids-ts/dropdown'
import '@ids-ts/dropdown/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import SegmentedButton from '@ids-ts/segmented-button'
import '@ids-ts/segmented-button/dist/main.css'
import { TextField } from '@ids-ts/text-field'
import '@ids-ts/text-field/dist/main.css'
import {
  ACTIVITY_FEED_ENTRIES,
  ACTIVITY_KIND_BADGE,
  ACTIVITY_TYPE_FILTER_OPTIONS,
  AUTHOR_FILTER_OPTIONS,
  DATE_FILTER_OPTIONS,
  filterActivityEntries,
  groupActivityEntriesByDay,
  type ActivityFeedEntry,
  type ActivityKind,
  type ActivityTypeFilterValue,
  type AuthorFilterValue,
  type DateFilterValue,
} from './activityFeedData'
import styles from '../../styles/check-return/ActivityPanel.module.css'

type ActivitySegment = 'data-entry' | 'review' | 'client'

type ActivityPanelProps = {
  isOpen: boolean
  onToggle: () => void
}

const KIND_DOT_CLASS: Record<ActivityKind, string> = {
  edit: styles.dotAttention,
  document: styles.dotInfo,
  'form-check': styles.dotNeutral,
  diagnostic: styles.dotPositive,
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

function ActivityEntryRow({ entry }: { entry: ActivityFeedEntry }) {
  const badge = ACTIVITY_KIND_BADGE[entry.kind]

  return (
    <li className={styles.entry}>
      <span
        className={`${styles.statusDot} ${KIND_DOT_CLASS[entry.kind]}`}
        aria-hidden
      />
      <div className={styles.entryBody}>
        <div className={styles.entryTop}>
          <p className={styles.entryTitle}>{entry.title}</p>
          <Badge
            status={badge.status}
            capitalization="sentence"
            priority="secondary"
            className={styles.typeBadge}
          >
            {badge.label}
          </Badge>
        </div>
        {entry.detail ? <p className={styles.entryDetail}>{entry.detail}</p> : null}
        {entry.before != null && entry.after != null ? (
          <ValueChange before={entry.before} after={entry.after} />
        ) : null}
        <p className={styles.entryMeta}>
          <span>{entry.actor}</span>
          {entry.source ? (
            <>
              <span className={styles.metaSep} aria-hidden>
                ·
              </span>
              <span>{entry.source}</span>
            </>
          ) : null}
          <span className={styles.metaSep} aria-hidden>
            ·
          </span>
          <span>{entry.time}</span>
        </p>
      </div>
    </li>
  )
}

function ReviewFeed({
  searchQuery,
  dateFilter,
  authorFilter,
  activityTypeFilter,
}: {
  searchQuery: string
  dateFilter: DateFilterValue
  authorFilter: AuthorFilterValue
  activityTypeFilter: ActivityTypeFilterValue
}) {
  const filteredDays = useMemo(() => {
    const filtered = filterActivityEntries(ACTIVITY_FEED_ENTRIES, {
      date: dateFilter,
      author: authorFilter,
      activityType: activityTypeFilter,
      search: searchQuery,
    })
    return groupActivityEntriesByDay(filtered)
  }, [searchQuery, dateFilter, authorFilter, activityTypeFilter])

  if (filteredDays.length === 0) {
    return <p className={styles.emptyState}>No activity matches your filters.</p>
  }

  return (
    <>
      {filteredDays.map(day => (
        <section
          key={day.id}
          className={styles.dayGroup}
          aria-labelledby={`activity-day-${day.id}`}
        >
          <h3 id={`activity-day-${day.id}`} className={styles.dayLabel}>
            {day.label}
          </h3>
          <ul className={styles.entryList}>
            {day.entries.map(entry => (
              <ActivityEntryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

function PlaceholderSegment({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.placeholderBlock}>
      <p className={styles.placeholderTitle}>{title}</p>
      <p className={styles.placeholder}>{body}</p>
    </div>
  )
}

export default function ActivityPanel({ isOpen, onToggle }: ActivityPanelProps) {
  const [segment, setSegment] = useState<ActivitySegment>('review')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilterValue>('any')
  const [authorFilter, setAuthorFilter] = useState<AuthorFilterValue>('any')
  const [activityTypeFilter, setActivityTypeFilter] =
    useState<ActivityTypeFilterValue>('any')

  const filteredCount = useMemo(() => {
    if (segment !== 'review') return 0
    return filterActivityEntries(ACTIVITY_FEED_ENTRIES, {
      date: dateFilter,
      author: authorFilter,
      activityType: activityTypeFilter,
      search: searchQuery,
    }).length
  }, [segment, searchQuery, dateFilter, authorFilter, activityTypeFilter])

  const handleRefresh = () => {
    setSearchQuery('')
    setDateFilter('any')
    setAuthorFilter('any')
    setActivityTypeFilter('any')
  }

  if (!isOpen) {
    return (
      <aside className={styles.collapsedShell} aria-label="Activity feed">
        <button
          type="button"
          className={styles.expandButton}
          onClick={onToggle}
          aria-expanded={false}
          aria-controls="activity-feed-panel"
        >
          <ChevronLeft size="medium" aria-hidden />
          <span className={styles.expandLabel}>Activity feed</span>
        </button>
      </aside>
    )
  }

  return (
    <aside id="activity-feed-panel" className={styles.panel} aria-label="Activity feed">
      <header className={styles.header}>
        <h2 className={styles.title}>Activity feed</h2>
        <IconControl size="medium" onClick={onToggle} aria-label="Close activity feed">
          <Close aria-hidden />
        </IconControl>
      </header>

      <div className={styles.segmentRow}>
        <SegmentedButton
          ariaLabel="Activity segment"
          buttonPosition="center"
          buttonType="mini"
          buttonInfos={[
            {
              label: 'Data entry',
              selected: segment === 'data-entry',
              onClick: () => setSegment('data-entry'),
            },
            {
              label: 'Review',
              selected: segment === 'review',
              onClick: () => setSegment('review'),
            },
            {
              label: 'Client',
              selected: segment === 'client',
              onClick: () => setSegment('client'),
            },
          ]}
        />
      </div>

      {segment === 'review' ? (
        <div className={styles.toolbar}>
          <span className={styles.entryCount} aria-live="polite">
            {filteredCount} {filteredCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      ) : null}

      <div className={styles.filters}>
        <div className={styles.searchRow}>
          <TextField
            aria-label="Search activity"
            placeholder="Search activity"
            size="small"
            width="100%"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <Dropdown
              label="Date"
              size="small"
              value={dateFilter}
              width="100%"
              preventMenuOverflow={{ enabled: true, padding: 8 }}
              positions={['bottom', 'top']}
              onChange={e => {
                const target = e.target as HTMLInputElement
                if (target?.value) setDateFilter(target.value as DateFilterValue)
              }}
            >
              {DATE_FILTER_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Dropdown>
          </div>

          <div className={styles.filterField}>
            <Dropdown
              label="Author"
              size="small"
              value={authorFilter}
              width="100%"
              preventMenuOverflow={{ enabled: true, padding: 8 }}
              positions={['bottom', 'top']}
              onChange={e => {
                const target = e.target as HTMLInputElement
                if (target?.value) setAuthorFilter(target.value as AuthorFilterValue)
              }}
            >
              {AUTHOR_FILTER_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Dropdown>
          </div>

          <div className={styles.filterField}>
            <Dropdown
              label="Activity type"
              size="small"
              value={activityTypeFilter}
              width="100%"
              preventMenuOverflow={{ enabled: true, padding: 8 }}
              positions={['bottom', 'top']}
              onChange={e => {
                const target = e.target as HTMLInputElement
                if (target?.value) {
                  setActivityTypeFilter(target.value as ActivityTypeFilterValue)
                }
              }}
            >
              {ACTIVITY_TYPE_FILTER_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Dropdown>
          </div>

          <IconControl
            size="medium"
            className={styles.refreshButton}
            onClick={handleRefresh}
            aria-label="Refresh filters"
          >
            <Refresh aria-hidden />
          </IconControl>
        </div>
      </div>

      <div className={styles.scroll}>
        {segment === 'review' ? (
          <ReviewFeed
            searchQuery={searchQuery}
            dateFilter={dateFilter}
            authorFilter={authorFilter}
            activityTypeFilter={activityTypeFilter}
          />
        ) : null}
        {segment === 'data-entry' ? (
          <PlaceholderSegment
            title="Data entry activity"
            body="Data entry history is in the audit log workspace."
          />
        ) : null}
        {segment === 'client' ? (
          <PlaceholderSegment
            title="Client activity"
            body="Client messages and uploads will appear here in a future prototype pass."
          />
        ) : null}
      </div>
    </aside>
  )
}

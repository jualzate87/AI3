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
  ACTIVITY_ENTRY_BADGE,
  ACTIVITY_FEED_ENTRIES,
  ACTIVITY_TYPE_FILTER_OPTIONS,
  AUTHOR_FILTER_OPTIONS,
  DATE_FILTER_OPTIONS,
  defaultLinkLabel,
  filterActivityEntries,
  groupActivityEntriesByDay,
  type ActivityDeepLink,
  type ActivityEntryType,
  type ActivityFeedEntry,
  type ActivityTypeFilterValue,
  type AuthorFilterValue,
  type DateFilterValue,
} from './activityFeedData'
import styles from '../../styles/check-return/ActivityPanel.module.css'

type ActivitySegment = 'data-entry' | 'review' | 'client'

type ActivityPanelProps = {
  isOpen: boolean
  onToggle: () => void
  onNavigate?: (link: ActivityDeepLink) => void
}

const ENTRY_DOT_CLASS: Record<ActivityEntryType, string> = {
  'field-edited': styles.dotAttention,
  'form-line-checked': styles.dotNeutral,
  'document-verified': styles.dotInfo,
  'import-diagnostic-fixed': styles.dotAttention,
  'compliance-diagnostic-fixed': styles.dotPositive,
  'planning-diagnostic-fixed': styles.dotInfo,
  'return-sign-off': styles.dotPositive,
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

function ActivityEntryRow({
  entry,
  onNavigate,
}: {
  entry: ActivityFeedEntry
  onNavigate?: (link: ActivityDeepLink) => void
}) {
  const badge = ACTIVITY_ENTRY_BADGE[entry.entryType]
  const linkLabel = defaultLinkLabel(entry)

  return (
    <li className={styles.entry}>
      <span
        className={`${styles.statusDot} ${ENTRY_DOT_CLASS[entry.entryType]}`}
        aria-hidden
      />
      <div className={styles.entryBody}>
        <p className={styles.entryTitle}>{entry.title}</p>
        {entry.detail ? <p className={styles.entryDetail}>{entry.detail}</p> : null}
        {entry.before != null && entry.after != null ? (
          <ValueChange before={entry.before} after={entry.after} />
        ) : null}
        {entry.deepLink && linkLabel && onNavigate ? (
          <p className={styles.entryLinkRow}>
            <button
              type="button"
              className={styles.entryLink}
              onClick={() => onNavigate(entry.deepLink!)}
            >
              {linkLabel}
            </button>
          </p>
        ) : null}
        <p className={styles.entryMeta}>
          <Badge
            status={badge.status}
            capitalization="sentence"
            priority="secondary"
            className={styles.typeBadge}
          >
            {badge.label}
          </Badge>
          <span className={styles.metaSep} aria-hidden>
            ·
          </span>
          <span className={styles.metaText}>{entry.location}</span>
          <span className={styles.metaSep} aria-hidden>
            ·
          </span>
          <span className={styles.metaText}>{entry.actor}</span>
          <span className={styles.metaSep} aria-hidden>
            ·
          </span>
          <span className={styles.metaText}>{entry.time}</span>
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
  onNavigate,
}: {
  searchQuery: string
  dateFilter: DateFilterValue
  authorFilter: AuthorFilterValue
  activityTypeFilter: ActivityTypeFilterValue
  onNavigate?: (link: ActivityDeepLink) => void
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
              <ActivityEntryRow key={entry.id} entry={entry} onNavigate={onNavigate} />
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

export default function ActivityPanel({ isOpen, onToggle, onNavigate }: ActivityPanelProps) {
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
        <span className={styles.headerSpacer} aria-hidden />
        <h2 className={styles.title}>Activity feed</h2>
        <IconControl
          size="medium"
          className={styles.closeControl}
          onClick={onToggle}
          aria-label="Close activity feed"
        >
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
            onNavigate={onNavigate}
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

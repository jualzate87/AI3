/**
 * Unified chronological activity feed for Check Return (Review segment).
 */

import {
  REVIEW_LOG_DAYS,
  type ReviewLogEntry,
} from './reviewLogData'
import {
  ACTIVITY_ENTRY_BADGE,
  ACTIVITY_ENTRY_DOT_CLASS,
  entryTypeToFilterCategory,
  type ActivityDeepLink,
  type ActivityEntryType,
  type ActivityFilterCategory,
} from './activityTypes'

export type { ActivityDeepLink, ActivityEntryType, ActivityFilterCategory }

export type ActivityFeedEntry = ReviewLogEntry & {
  filterCategory: ActivityFilterCategory
  dayGroupId: ActivityDayGroupId
  dayGroupLabel: string
}

export type ActivityDayGroupId = 'today' | 'yesterday' | 'mar-6' | 'older'

export type ActivityFeedDayGroup = {
  id: ActivityDayGroupId
  label: string
  entries: ActivityFeedEntry[]
}

export const DATE_FILTER_OPTIONS = [
  { value: 'any', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-7', label: 'Last 7 days' },
] as const

export const AUTHOR_FILTER_OPTIONS = [
  { value: 'any', label: 'Any author' },
  { value: 'Sara Chen', label: 'Sara Chen' },
  { value: 'Jordan Lee', label: 'Jordan Lee' },
] as const

export const ACTIVITY_TYPE_FILTER_OPTIONS = [
  { value: 'any', label: 'Any type' },
  { value: 'field-edited', label: 'Fields edited' },
  { value: 'document-verified', label: 'Documents verified' },
  { value: 'form-line-checked', label: 'Form lines checked' },
  { value: 'diagnostic-fixed', label: 'Diagnostics fixed' },
] as const

export type DateFilterValue = (typeof DATE_FILTER_OPTIONS)[number]['value']
export type AuthorFilterValue = (typeof AUTHOR_FILTER_OPTIONS)[number]['value']
export type ActivityTypeFilterValue = (typeof ACTIVITY_TYPE_FILTER_OPTIONS)[number]['value']

const DAY_GROUP_IDS = new Set<ActivityDayGroupId>(['today', 'yesterday', 'mar-6'])

function toDayGroupId(id: string): ActivityDayGroupId {
  if (DAY_GROUP_IDS.has(id as ActivityDayGroupId)) {
    return id as ActivityDayGroupId
  }
  return 'older'
}

export const ACTIVITY_FEED_ENTRIES: readonly ActivityFeedEntry[] = REVIEW_LOG_DAYS.flatMap(day =>
  day.entries.map(entry => ({
    ...entry,
    filterCategory: entryTypeToFilterCategory(entry.entryType),
    dayGroupId: toDayGroupId(day.id),
    dayGroupLabel: day.label,
  })),
)

export { ACTIVITY_ENTRY_BADGE, ACTIVITY_ENTRY_DOT_CLASS }

export function defaultLinkLabel(entry: ActivityFeedEntry): string | null {
  if (!entry.deepLink) return null
  if (entry.linkLabel) return entry.linkLabel
  switch (entry.deepLink.target) {
    case 'form':
      return `Open ${entry.deepLink.formLabel}`
    case 'ai-diagnostics':
      return 'Open AI diagnostics'
    case 'federal-summary':
      return 'Open federal summary'
    case 'source-document':
      return 'Open source document'
    default:
      return 'View'
  }
}

export function groupActivityEntriesByDay(
  entries: readonly ActivityFeedEntry[],
): ActivityFeedDayGroup[] {
  const order: ActivityDayGroupId[] = ['today', 'yesterday', 'mar-6', 'older']
  const labels = new Map<string, string>()
  const buckets = new Map<ActivityDayGroupId, ActivityFeedEntry[]>()

  for (const entry of entries) {
    labels.set(entry.dayGroupId, entry.dayGroupLabel)
    const list = buckets.get(entry.dayGroupId) ?? []
    list.push(entry)
    buckets.set(entry.dayGroupId, list)
  }

  return order
    .filter(id => (buckets.get(id)?.length ?? 0) > 0)
    .map(id => ({
      id,
      label: labels.get(id) ?? id,
      entries: buckets.get(id) ?? [],
    }))
}

export function filterActivityEntries(
  entries: readonly ActivityFeedEntry[],
  filters: {
    date: DateFilterValue
    author: AuthorFilterValue
    activityType: ActivityTypeFilterValue
    search: string
  },
): ActivityFeedEntry[] {
  const query = filters.search.trim().toLowerCase()

  return entries.filter(entry => {
    if (filters.author !== 'any' && entry.actor !== filters.author) {
      return false
    }

    if (filters.activityType !== 'any' && entry.filterCategory !== filters.activityType) {
      return false
    }

    if (filters.date === 'today' && entry.dayGroupId !== 'today') {
      return false
    }
    if (filters.date === 'yesterday' && entry.dayGroupId !== 'yesterday') {
      return false
    }
    if (filters.date === 'last-7' && entry.dayGroupId === 'older') {
      return false
    }

    if (query) {
      const badge = ACTIVITY_ENTRY_BADGE[entry.entryType].label
      const haystack = [
        entry.title,
        entry.detail,
        entry.location,
        entry.actor,
        entry.before,
        entry.after,
        badge,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) {
        return false
      }
    }

    return true
  })
}

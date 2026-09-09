/**
 * Unified chronological activity feed for Check Return (Review segment).
 * Merged from reviewLogData day groups into a single filterable list.
 */

import { REVIEW_LOG_DAYS, type ReviewLogEntry, type ReviewLogKind } from './reviewLogData'

export type ActivityKind = ReviewLogKind

export type ActivityDayGroupId = 'today' | 'yesterday' | 'mar-6' | 'older'

export type ActivityFeedEntry = ReviewLogEntry & {
  dayGroupId: ActivityDayGroupId
  dayGroupLabel: string
}

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
  { value: 'edit', label: 'Fields changed' },
  { value: 'document', label: 'Documents verified' },
  { value: 'form-check', label: 'Form lines checked' },
  { value: 'diagnostic', label: 'Diagnostics fixed' },
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

/** Flat list, newest day first; within each day entries stay in narrative order (newest first). */
export const ACTIVITY_FEED_ENTRIES: readonly ActivityFeedEntry[] = REVIEW_LOG_DAYS.flatMap(day =>
  day.entries.map(entry => ({
    ...entry,
    dayGroupId: toDayGroupId(day.id),
    dayGroupLabel: day.label,
  })),
)

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

    if (filters.activityType !== 'any' && entry.kind !== filters.activityType) {
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
      const haystack = [entry.title, entry.detail, entry.source, entry.actor, entry.before, entry.after]
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

export const ACTIVITY_KIND_BADGE: Record<
  ActivityKind,
  { label: string; status: 'warning' | 'info' | 'success' | 'pending' }
> = {
  edit: { label: 'Edit', status: 'warning' },
  document: { label: 'Document', status: 'info' },
  'form-check': { label: 'Form check', status: 'pending' },
  diagnostic: { label: 'Diagnostic', status: 'success' },
}

export const ACTIVITY_KIND_DOT_CLASS: Record<ActivityKind, string> = {
  edit: 'dotAttention',
  document: 'dotInfo',
  'form-check': 'dotNeutral',
  diagnostic: 'dotPositive',
}

import type { ActivityEntry } from '../../hooks/useSyncedReviewState'
import type { ReviewLevel } from './AttestColumns'

/** Full role names for legend and column-header tooltips (L1/L2/L3 stay in headers). */
export const VERIFICATION_LEVEL_LABELS: Record<ReviewLevel, string> = {
  1: 'Preparer verified',
  2: 'Reviewer confirmed',
  3: 'Manager confirmed',
}

/** Everyone who stamped a check at one level, in the order they first appear. */
export function checkAuthorNames(meta?: Map<string, ActivityEntry>): string[] {
  if (!meta) return []
  const names: string[] = []
  for (const entry of meta.values()) {
    const name = entry?.by?.trim()
    if (name && !names.includes(name)) names.push(name)
  }
  return names
}

/**
 * Legend label for a check level. Roles are not modeled in the prototype, so the
 * level number is the default and the name appears once someone has checked a row.
 */
export function verificationLevelLegendLabel(
  level: ReviewLevel,
  meta?: Map<string, ActivityEntry>,
): string {
  const names = checkAuthorNames(meta)
  return names.length > 0 ? `L${level} · ${names.join(', ')}` : `L${level}`
}

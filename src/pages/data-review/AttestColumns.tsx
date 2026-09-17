import { CircleCheck } from '@design-systems/icons'
import {
  isCurrentManagerActor,
  isCurrentReviewerActor,
  type ActivityEntry,
} from '../../hooks/useSyncedReviewState'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/LeftPanel1040.module.css'

export type ReviewLevel = 1 | 2 | 3

export function firstNameFromFull(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export function ownerFirstName(meta?: Map<string, ActivityEntry>): string | null {
  if (!meta) return null
  for (const entry of meta.values()) {
    if (entry?.by) return firstNameFromFull(entry.by)
  }
  return null
}

export function isManagerActor(): boolean {
  return isCurrentManagerActor()
}

export function currentReviewLevel(): ReviewLevel {
  if (isManagerActor()) return 3
  if (isCurrentReviewerActor()) return 2
  return 1
}

export function levelCheckTooltip(
  level: ReviewLevel,
  entry?: ActivityEntry | null,
): string {
  const label = `L${level}`
  if (entry) return `${label} · Checked by ${entry.by} · ${entry.at}`
  if (currentReviewLevel() === level) return `Add your ${label} check`
  return `${label} check`
}

function LevelHeader({
  level,
  name,
}: {
  level: ReviewLevel
  name?: string | null
}) {
  return (
    <span className={styles.summaryColCheckLabel}>
      <span className={styles.levelCode}>L{level}</span>
      {name ? <span className={styles.levelName}>{name}</span> : null}
    </span>
  )
}

export function AttestColumnHeaders({
  l1Name,
  l2Name,
  l3Name,
}: {
  l1Name?: string | null
  l2Name?: string | null
  l3Name?: string | null
}) {
  return (
    <>
      <LevelHeader level={1} name={l1Name} />
      <LevelHeader level={2} name={l2Name} />
      <LevelHeader level={3} name={l3Name} />
    </>
  )
}

function LevelCheck({
  level,
  field,
  entry,
  onToggle,
  interactive,
}: {
  level: ReviewLevel
  field: string
  entry?: ActivityEntry
  onToggle?: (fieldName: string) => void
  interactive: boolean
}) {
  const actorLevel = currentReviewLevel()
  const canToggle = interactive && actorLevel === level && !!onToggle
  const emptyCls =
    level === 1
      ? styles.summaryAttestColPrepEmpty
      : level === 2
        ? styles.summaryAttestColRevEmpty
        : styles.summaryAttestColL3Empty
  const activeCls =
    level === 1
      ? styles.summaryAttestColPrepActive
      : level === 2
        ? styles.summaryAttestColRevActive
        : styles.summaryAttestColL3Active

  return (
    <Tooltip text={levelCheckTooltip(level, entry)} placement="top">
      <button
        type="button"
        className={[
          styles.summaryAttestCol,
          entry ? activeCls : `${styles.summaryAttestColEmpty} ${emptyCls}`,
          canToggle ? '' : styles.summaryAttestColReadonly,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={entry ? `L${level} checked by ${entry.by}` : `L${level} check`}
        disabled={!canToggle}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          if (canToggle) onToggle?.(field)
        }}
      >
        <CircleCheck size="small" aria-hidden />
      </button>
    </Tooltip>
  )
}

export default function AttestColumns({
  field,
  preparerEntry,
  reviewerEntry,
  managerEntry,
  onTogglePreparer,
  onToggleReviewer,
  onToggleManager,
  interactive = true,
}: {
  field: string
  preparerEntry?: ActivityEntry
  reviewerEntry?: ActivityEntry
  managerEntry?: ActivityEntry
  onTogglePreparer?: (fieldName: string) => void
  onToggleReviewer?: (fieldName: string) => void
  onToggleManager?: (fieldName: string) => void
  interactive?: boolean
}) {
  if (!onTogglePreparer && !onToggleReviewer && !onToggleManager) return null

  return (
    <div className={styles.formAttestGroup}>
      <LevelCheck
        level={1}
        field={field}
        entry={preparerEntry}
        onToggle={onTogglePreparer}
        interactive={interactive}
      />
      <LevelCheck
        level={2}
        field={field}
        entry={reviewerEntry}
        onToggle={onToggleReviewer}
        interactive={interactive}
      />
      <LevelCheck
        level={3}
        field={field}
        entry={managerEntry}
        onToggle={onToggleManager}
        interactive={interactive}
      />
    </div>
  )
}

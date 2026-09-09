import { CircleCheckFill } from '@design-systems/icons'
import type { ReviewActivityCategory, ReviewActivityEntry } from './reviewActivityData'
import handoffStyles from '../../styles/data-review/HandoffSummary.module.css'
import styles from '../../styles/check-return/ActivityPanel.module.css'

function hasValueChange(entry: ReviewActivityEntry): entry is ReviewActivityEntry & {
  before: string
  after: string
} {
  return entry.before != null && entry.after != null
}

function ValueChange({ before, after }: { before: string; after: string }) {
  return (
    <p className={styles.valueChange}>
      <span className={styles.valueBefore}>{before}</span>
      <span className={styles.valueArrow} aria-hidden>
        to
      </span>
      <span className={styles.valueAfter}>{after}</span>
      <span className={styles.valueChangeSrOnly}>
        Changed from {before} to {after}
      </span>
    </p>
  )
}

function ActivityEntryRow({ entry }: { entry: ReviewActivityEntry }) {
  return (
    <>
      <span className={handoffStyles.activityCheckIcon} aria-hidden>
        <CircleCheckFill size="small" />
      </span>
      <div className={handoffStyles.activityEntryText}>
        <span className={handoffStyles.activityEntryLabel}>{entry.label}</span>
        {hasValueChange(entry) ? (
          <ValueChange before={entry.before} after={entry.after} />
        ) : null}
        {entry.detail ? (
          <p className={handoffStyles.activityEntryDetail}>{entry.detail}</p>
        ) : null}
        {entry.attribution ? (
          <span className={styles.entryAttribution}>{entry.attribution}</span>
        ) : null}
      </div>
    </>
  )
}

export function ActivityCategoryCard({ category }: { category: ReviewActivityCategory }) {
  return (
    <article className={handoffStyles.activityCard}>
      <header className={handoffStyles.activityCardHead}>
        <h3 className={handoffStyles.activityCardTitle}>{category.title}</h3>
        {category.badge ? (
          <span className={handoffStyles.activityBadge}>
            <CircleCheckFill size="x-small" aria-hidden />
            {category.badge}
          </span>
        ) : null}
      </header>
      {category.entries.length === 0 ? (
        <p className={handoffStyles.activityEmpty}>Nothing recorded yet.</p>
      ) : (
        <ul className={handoffStyles.activityList}>
          {category.entries.map((entryItem, index) => (
            <li
              key={entryItem.id}
              className={[
                handoffStyles.activityEntry,
                index > 0 ? handoffStyles.activityEntryDivider : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <ActivityEntryRow entry={entryItem} />
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

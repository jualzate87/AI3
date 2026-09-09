import { useState } from 'react'
import { ChevronLeft, ChevronRight, CircleCheckFill } from '@design-systems/icons'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import SegmentedButton from '@ids-ts/segmented-button'
import '@ids-ts/segmented-button/dist/main.css'
import { ActivityCategoryCard } from './ReviewActivityCards'
import {
  CHECK_RETURN_ACTIVITY_CATEGORIES,
  CHECK_RETURN_REVIEW_BRIEF,
} from './reviewActivityData'
import styles from '../../styles/check-return/ActivityPanel.module.css'

type ActivitySegment = 'data-entry' | 'review' | 'client'

type ActivityPanelProps = {
  isOpen: boolean
  onToggle: () => void
}

function ReviewProgressBrief() {
  const brief = CHECK_RETURN_REVIEW_BRIEF

  return (
    <section className={styles.progressBrief} aria-labelledby="review-progress-heading">
      <h3 id="review-progress-heading" className={styles.progressHeading}>
        {brief.heading}
      </h3>
      <p className={styles.progressIntro}>{brief.intro}</p>

      <div className={styles.progressSection}>
        <h4 className={styles.progressSectionLabel}>
          <CircleCheckFill size="x-small" className={styles.progressSectionIconDone} aria-hidden />
          {brief.completedLabel}
        </h4>
        <ul className={styles.progressList}>
          {brief.completedItems.map(item => (
            <li key={item.id} className={styles.progressListItem}>
              {item.emphasis ? (
                <span className={styles.progressEmphasis}>{item.emphasis}</span>
              ) : null}
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.progressSection}>
        <h4 className={styles.progressSectionLabel}>{brief.attentionLabel}</h4>
        <p className={styles.progressAttentionText}>{brief.attentionText}</p>
      </div>

      <p className={styles.progressSynced}>{brief.syncedAt}</p>
    </section>
  )
}

function ReviewSegment() {
  return (
    <>
      <ReviewProgressBrief />
      <p className={styles.activityIntro}>
        Shared activity trail. Updates sync in real time for preparer and reviewer.
      </p>
      <div className={styles.activityStack}>
        {CHECK_RETURN_ACTIVITY_CATEGORIES.map(category => (
          <ActivityCategoryCard key={category.id} category={category} />
        ))}
      </div>
    </>
  )
}

function PlaceholderSegment({ label }: { label: string }) {
  return (
    <p className={styles.placeholder}>
      {label} activity will appear here in a future prototype pass.
    </p>
  )
}

export default function ActivityPanel({ isOpen, onToggle }: ActivityPanelProps) {
  const [segment, setSegment] = useState<ActivitySegment>('review')

  if (!isOpen) {
    return (
      <aside className={styles.collapsedShell} aria-label="Activity">
        <button
          type="button"
          className={styles.expandButton}
          onClick={onToggle}
          aria-expanded={false}
          aria-controls="activity-panel"
        >
          <ChevronLeft size="medium" aria-hidden />
          <span className={styles.expandLabel}>Activity</span>
        </button>
      </aside>
    )
  }

  return (
    <aside id="activity-panel" className={styles.panel} aria-label="Activity">
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.title}>Activity</h2>
          <IconControl size="medium" onClick={onToggle} aria-label="Collapse activity panel">
            <ChevronRight aria-hidden />
          </IconControl>
        </div>
      </header>

      <div className={styles.segmentRow}>
        <div className={styles.segmentControl}>
          <SegmentedButton
            ariaLabel="Activity segment"
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
      </div>

      <div className={styles.scroll}>
        {segment === 'review' ? <ReviewSegment /> : null}
        {segment === 'data-entry' ? (
          <PlaceholderSegment label="Data entry" />
        ) : null}
        {segment === 'client' ? <PlaceholderSegment label="Client" /> : null}
      </div>
    </aside>
  )
}

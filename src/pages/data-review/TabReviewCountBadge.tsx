import { NumericBadge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/TabReviewCountBadge.module.css'

type TabReviewCountBadgeProps = {
  reviewed: number
  total: number
  className?: string
  tooltip?: string
  'aria-label'?: string
}

/** Peel / review tab numeric badge - "X of Y" with success styling when complete. */
export default function TabReviewCountBadge({
  reviewed,
  total,
  className,
  tooltip,
  'aria-label': ariaLabel,
}: TabReviewCountBadgeProps) {
  if (total <= 0) return null

  const complete = reviewed >= total
  const quantity = `${reviewed} of ${total}`

  const badge = (
    <span
      className={[
        styles.wrap,
        complete ? styles.complete : styles.pending,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel ?? `${reviewed} of ${total} documents reviewed`}
    >
      <NumericBadge quantity={quantity} maxLimit={99} />
    </span>
  )

  if (!tooltip) return badge

  return (
    <Tooltip text={tooltip} placement="top">
      {badge}
    </Tooltip>
  )
}

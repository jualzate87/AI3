import { NumericBadge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import styles from '../../styles/data-review/DocumentCountBadge.module.css'

type DocumentCountBadgeProps = {
  count: number
  className?: string
  /** Parent control should expose full meaning when decorative. */
  'aria-hidden'?: boolean
  'aria-label'?: string
}

/** Neutral numeric badge — unreviewed document counts (not import flags). */
export default function DocumentCountBadge({
  count,
  className,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
}: DocumentCountBadgeProps) {
  if (count <= 0) return null

  return (
    <span
      className={[styles.wrap, className].filter(Boolean).join(' ')}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
    >
      <NumericBadge quantity={count} maxLimit={99} />
    </span>
  )
}

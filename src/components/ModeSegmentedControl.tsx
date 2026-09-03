import styles from './ModeSegmentedControl.module.css'

export type ModeSegmentOption = {
  id: string
  label: string
  onClick?: () => void
}

type ModeSegmentedControlProps = {
  ariaLabel: string
  options: ModeSegmentOption[]
  activeId: string
  className?: string
}

/** Two-option segmented control — light blue active state with bottom indicator bar. */
export default function ModeSegmentedControl({
  ariaLabel,
  options,
  activeId,
  className,
}: ModeSegmentedControlProps) {
  return (
    <div
      className={[styles.switch, className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map(option => {
        const isActive = option.id === activeId

        if (isActive) {
          return (
            <span
              key={option.id}
              className={`${styles.segment} ${styles.segmentActive}`}
              role="tab"
              aria-selected
            >
              {option.label}
            </span>
          )
        }

        return (
          <button
            key={option.id}
            type="button"
            className={styles.segment}
            role="tab"
            aria-selected={false}
            onClick={option.onClick}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

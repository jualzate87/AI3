import styles from '../../styles/data-review/DetailFields.module.css'
import type { DetailFieldsVariant } from './fieldEditability'

interface DetailSectionHeaderProps {
  children: React.ReactNode
  variant?: DetailFieldsVariant
}

export default function DetailSectionHeader({
  children,
  variant,
}: DetailSectionHeaderProps) {
  return (
    <div
      className={[
        styles.sectionHeader,
        variant === 'input' ? styles.sectionHeaderInput : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.sectionHeaderLabel}>{children}</span>
    </div>
  )
}

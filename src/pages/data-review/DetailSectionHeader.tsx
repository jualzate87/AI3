import ViewSourceDocumentsButton from '../../components/ViewSourceDocumentsButton'
import styles from '../../styles/data-review/DetailFields.module.css'
import type { DetailFieldsVariant } from './fieldEditability'

interface DetailSectionHeaderProps {
  children: React.ReactNode
  variant?: DetailFieldsVariant
  onViewSourceDocuments?: () => void
}

export default function DetailSectionHeader({
  children,
  variant,
  onViewSourceDocuments,
}: DetailSectionHeaderProps) {
  const showViewSource = variant === 'input' && onViewSourceDocuments

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
      {showViewSource && (
        <ViewSourceDocumentsButton onClick={onViewSourceDocuments} />
      )}
    </div>
  )
}

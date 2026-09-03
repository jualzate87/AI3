import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
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
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionHeaderLabel}>{children}</span>
      {variant === 'input' && onViewSourceDocuments && (
        <Button
          priority="secondary"
          purpose="passive"
          size="small"
          className={styles.viewSourceDocumentsBtn}
          onClick={onViewSourceDocuments}
        >
          <span className={styles.viewSourceDocumentsDot} aria-hidden />
          View source documents
        </Button>
      )}
    </div>
  )
}

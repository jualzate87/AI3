import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../styles/data-review/DetailFields.module.css'

interface ViewSourceDocumentsButtonProps {
  onClick?: () => void
  className?: string
}

export default function ViewSourceDocumentsButton({
  onClick,
  className,
}: ViewSourceDocumentsButtonProps) {
  if (!onClick) return null

  return (
    <Button
      priority="secondary"
      purpose="passive"
      size="small"
      className={[styles.viewSourceDocumentsBtn, className].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <span className={styles.viewSourceDocumentsDot} aria-hidden />
      View source documents
    </Button>
  )
}

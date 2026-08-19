import { getDocumentImportMeta, isManualImportDoc } from '../../data/documentImportMeta'
import styles from './ManualDocNotice.module.css'

type Props = {
  docKey: string | null | undefined
  /** Optional — jump to matched input doc tab */
  onLinkToInput?: () => void
}

export default function ManualDocNotice({ docKey, onLinkToInput }: Props) {
  if (!docKey || !isManualImportDoc(docKey)) return null

  const meta = getDocumentImportMeta(docKey)
  const pdfOnly = meta?.importMode === 'pdf-only'

  return (
    <p className={styles.notice} role="status">
      <span>
        {pdfOnly
          ? 'Document attached · data entered manually. Extraction is not supported for this form — use the PDF for reference while you key values.'
          : 'No structured import for this document · values were entered manually.'}
      </span>
      {onLinkToInput && (
        <button type="button" className={styles.linkBtn} onClick={onLinkToInput}>
          Link to input
        </button>
      )}
    </p>
  )
}

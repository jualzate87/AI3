import { Document, TriangleExclamationFill } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../../styles/data-review/DataReviewPage.module.css'

export type Phase1IssueBannerMode = 'flags' | 'documents'

interface Phase1IssueBannerProps {
  /** Which attention strip to show — flags (orange) or remaining docs (info chrome, same shell) */
  mode?: Phase1IssueBannerMode
  /** Unresolved Phase 1 flags — used when mode is `flags` */
  unresolvedCount?: number
  /** Packet source docs still needing mark-reviewed — used when mode is `documents` */
  unreviewedDocCount?: number
  verifiedDocCount?: number
  totalDocCount?: number
  /** Optional secondary note when docs mode still has open flags */
  unresolvedFlagCount?: number
  /** Jump to next open flag */
  onVerify?: () => void
  /** Jump to next source document that still needs a review */
  onReviewNextDocument?: () => void
}

/**
 * Issue banner under the source-panel header (above tabs).
 * Same shell for open flags and remaining-document review; only icon, copy, and CTA change.
 */
export default function Phase1IssueBanner({
  mode = 'flags',
  unresolvedCount = 0,
  unreviewedDocCount = 0,
  verifiedDocCount = 0,
  totalDocCount = 0,
  unresolvedFlagCount = 0,
  onVerify,
  onReviewNextDocument,
}: Phase1IssueBannerProps) {
  if (mode === 'documents' && unreviewedDocCount > 0 && onReviewNextDocument) {
    return (
      <div className={`${styles.issueBanner} ${styles.issueBannerDocuments}`}>
        <Document size="small" className={styles.issueBannerIcon} aria-hidden />
        <span className={styles.issueBannerCopy}>
          <span className={styles.issueBannerHeader}>
            {unreviewedDocCount}{' '}
            {unreviewedDocCount === 1 ? 'document still needs review' : 'documents still need review'}
          </span>
          <span className={styles.issueBannerBody}>
            Open each source document and mark it verified when the imported data matches.
            {unresolvedFlagCount > 0 && (
              <> {unresolvedFlagCount} import {unresolvedFlagCount === 1 ? 'flag also needs' : 'flags also need'} attention — document review comes first.</>
            )}
          </span>
        </span>
        <Button priority="primary" size="small" onClick={onReviewNextDocument}>
          Review next document
        </Button>
      </div>
    )
  }

  if (mode === 'flags' && unresolvedCount > 0 && onVerify) {
    return (
      <div className={styles.issueBanner}>
        <TriangleExclamationFill size="small" className={styles.issueBannerIcon} aria-hidden />
        <span className={styles.issueBannerCopy}>
          <span className={styles.issueBannerHeader}>
            {unresolvedCount} {unresolvedCount === 1 ? 'field needs' : 'fields need'} your attention
          </span>
        </span>
        <Button priority="primary" size="small" onClick={onVerify}>
          Review next issue
        </Button>
      </div>
    )
  }

  return null
}

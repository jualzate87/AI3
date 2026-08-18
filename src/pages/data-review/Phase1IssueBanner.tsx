import { Document } from '@design-systems/icons'
import styles from '../../styles/data-review/DataReviewPage.module.css'

export type Phase1IssueBannerMode = 'flags' | 'documents'

interface Phase1IssueBannerProps {
  /** Which attention strip to show — flags (orange) or remaining docs (info chrome, same shell) */
  mode?: Phase1IssueBannerMode
  /** Unresolved Phase 1 flags — used when mode is `flags` */
  unresolvedCount?: number
  /** Packet source docs still needing mark-reviewed — used when mode is `documents` */
  unreviewedDocCount?: number
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
        <button type="button" className={styles.issueBannerPill} onClick={onReviewNextDocument}>
          Review next document
        </button>
      </div>
    )
  }

  if (mode === 'flags' && unresolvedCount > 0 && onVerify) {
    return (
      <div className={styles.issueBanner}>
        <svg className={styles.issueBannerIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10 2L18.66 17H1.34L10 2Z" fill="rgba(255,187,0,0.6)" stroke="#ff6a00" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M10 8v4" stroke="#cc5500" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="10" cy="14.5" r="0.9" fill="#cc5500"/>
        </svg>
        <span className={styles.issueBannerCopy}>
          <span className={styles.issueBannerHeader}>
            {unresolvedCount} {unresolvedCount === 1 ? 'field needs' : 'fields need'} your attention
          </span>
        </span>
        <button type="button" className={styles.issueBannerPill} onClick={onVerify}>
          Review next issue
        </button>
      </div>
    )
  }

  return null
}

import PageMessage from '@ids-ts/page-message'
import '@ids-ts/page-message/dist/main.css'
import { B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import styles from '../../styles/data-review/Phase1IssueBanner.module.css'

export type Phase1IssueBannerMode = 'flags' | 'documents'

interface Phase1IssueBannerProps {
  /** Which attention strip to show — flags (warn) or remaining docs (info) */
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
 * Uses IDS PageMessage for flags (warn) and remaining-document review (info).
 */
export default function Phase1IssueBanner({
  mode = 'flags',
  unresolvedCount = 0,
  unreviewedDocCount = 0,
  verifiedDocCount: _verifiedDocCount = 0,
  totalDocCount: _totalDocCount = 0,
  unresolvedFlagCount = 0,
  onVerify,
  onReviewNextDocument,
}: Phase1IssueBannerProps) {
  if (mode === 'documents' && unreviewedDocCount > 0 && onReviewNextDocument) {
    const docLabel =
      unreviewedDocCount === 1 ? 'document still needs review' : 'documents still need review'

    return (
      <div className={styles.wrap}>
        <PageMessage
          type="info"
          title={`${unreviewedDocCount} ${docLabel}`}
          open
          dismissible={false}
          actionLabel="Review next document"
          onActionClick={onReviewNextDocument}
        >
          <B3 className={styles.body}>
            Open each source document and mark it verified when the imported data matches.
            {unresolvedFlagCount > 0 && (
              <>
                {' '}
                {unresolvedFlagCount} import{' '}
                {unresolvedFlagCount === 1 ? 'flag also needs' : 'flags also need'} attention —
                document review comes first.
              </>
            )}
          </B3>
        </PageMessage>
      </div>
    )
  }

  if (mode === 'flags' && unresolvedCount > 0 && onVerify) {
    const fieldLabel = unresolvedCount === 1 ? 'field needs' : 'fields need'

    return (
      <div className={styles.wrap}>
        <PageMessage
          type="warn"
          title={`${unresolvedCount} ${fieldLabel} your attention`}
          open
          dismissible={false}
          actionLabel="Review next issue"
          onActionClick={onVerify}
        />
      </div>
    )
  }

  return null
}

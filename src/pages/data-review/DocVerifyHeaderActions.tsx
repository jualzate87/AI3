import { useEffect, useRef, useState } from 'react'
import {
  getReviewActor,
  REVIEWER_NAME,
  type ActivityEntry,
} from '../../hooks/useSyncedReviewState'
import Tooltip from './Tooltip'
import { Badge, SuccessBadgeIcon, WarningBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import InlineValidationMessage from '@ids-ts/inline-validation-message'
import '@ids-ts/inline-validation-message/dist/main.css'
import { getVerifiedDocEntry, isVerifiedInSet } from '../../data/verifiedDocKeys'
import type { LiveAmounts } from '../../data/liveReturn'
import {
  canVerifyDoc,
  getDocVerifyIdentityBlockedHint,
  getDocVerifyIdentityBlockedMessage,
} from './docReviewStatus'
import {
  getDocVerifyBlockedHint,
  getDocVerifyBlockedMessage,
} from './phase1FieldSync'
import styles from '../../styles/data-review/DetailFields.module.css'

type Props = {
  docKey: string
  verifiedDocs?: Set<string>
  verifiedDocsMeta?: Map<string, ActivityEntry>
  reviewerConfirmedDocs?: Set<string>
  reviewerConfirmedDocsMeta?: Map<string, ActivityEntry>
  reviewedFields?: Map<string, unknown>
  /** Live return amounts — used for Tech Circle SSN/EIN verify gate */
  amounts?: Pick<LiveAmounts, 'employeeSsn' | 'employerEin'>
  onVerifyDoc?: (docKey: string) => void
}

function VerifiedBadge({
  label,
  tooltip,
  clickable,
  onClick,
}: {
  label: string
  tooltip: string
  clickable: boolean
  onClick?: () => void
}) {
  const badge = (
    <Badge
      shape="round"
      status="success"
      label={label}
      aria-label={label}
    >
      <SuccessBadgeIcon />
    </Badge>
  )

  if (!clickable) return badge

  return (
    <button
      type="button"
      className={styles.verifiedBadgeBtn}
      onClick={onClick}
      aria-label={tooltip}
    >
      {badge}
    </button>
  )
}

export default function DocVerifyHeaderActions({
  docKey,
  verifiedDocs,
  verifiedDocsMeta,
  reviewerConfirmedDocs,
  reviewerConfirmedDocsMeta,
  reviewedFields,
  amounts,
  onVerifyDoc,
}: Props) {
  const blockedMessageRef = useRef<HTMLDivElement>(null)
  const [verifyAttempted, setVerifyAttempted] = useState(false)

  const isPreparerVerified = verifiedDocs ? isVerifiedInSet(verifiedDocs, docKey) : false
  const isReviewerConfirmed = reviewerConfirmedDocs ? isVerifiedInSet(reviewerConfirmedDocs, docKey) : false
  const isReviewerActor = getReviewActor() === REVIEWER_NAME
  const preparerMeta = getVerifiedDocEntry(verifiedDocsMeta, docKey)
  const reviewerMeta = getVerifiedDocEntry(reviewerConfirmedDocsMeta, docKey)
  const preparerName = preparerMeta?.by ?? 'preparer'
  const reviewerName = reviewerMeta?.by ?? REVIEWER_NAME
  const preparerTooltip = preparerMeta
    ? `Verified by ${preparerMeta.by} · ${preparerMeta.at}`
    : 'Click to unmark verified'
  const reviewerTooltip = reviewerMeta
    ? `Confirmed by ${reviewerMeta.by} · ${reviewerMeta.at}`
    : 'Click to remove confirmation'

  const verifyCheck = reviewedFields
    ? canVerifyDoc({
        docKey,
        reviewedFields,
        amounts,
        isReviewer: isReviewerActor,
      })
    : { allowed: true as const }
  const verifyBlocked = !isReviewerActor && !verifyCheck.allowed
  const blockedHint = verifyBlocked
    ? verifyCheck.reason === 'critical-flags'
      ? getDocVerifyBlockedHint(verifyCheck.uncorrectedCriticalCount ?? 0)
      : getDocVerifyIdentityBlockedHint(verifyCheck.missingIdentityFields ?? [])
    : ''
  const blockedMessage = verifyBlocked
    ? verifyCheck.reason === 'critical-flags'
      ? getDocVerifyBlockedMessage(verifyCheck.uncorrectedCriticalCount ?? 0)
      : getDocVerifyIdentityBlockedMessage(verifyCheck.missingIdentityFields ?? [])
    : ''

  useEffect(() => {
    if (!verifyBlocked) setVerifyAttempted(false)
  }, [verifyBlocked])

  const handlePreparerMark = () => {
    if (verifyBlocked) {
      setVerifyAttempted(true)
      blockedMessageRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      return
    }
    onVerifyDoc?.(docKey)
  }

  const needsReviewerConfirm =
    isReviewerActor && isPreparerVerified && !isReviewerConfirmed

  return (
    <div className={styles.verifyHeaderActionsCol}>
      <div className={styles.verifyStatusGroup}>
        {needsReviewerConfirm && (
          <Tooltip text="Needs confirmation" placement="top">
            <span className={styles.needsConfirmIconWrap}>
              <Badge
                shape="round"
                status="warning"
                aria-label="Needs confirmation"
              >
                <WarningBadgeIcon />
              </Badge>
            </span>
          </Tooltip>
        )}

        {isPreparerVerified && (
          <Tooltip text={preparerTooltip} placement="top">
            <VerifiedBadge
              label={`Verified by ${preparerName}`}
              tooltip={preparerTooltip}
              clickable={!isReviewerActor}
              onClick={() => onVerifyDoc?.(docKey)}
            />
          </Tooltip>
        )}

        {!isPreparerVerified && !isReviewerActor && (
          <Button size="small" priority="secondary" onClick={handlePreparerMark}>
            Mark as verified
          </Button>
        )}

        {needsReviewerConfirm && (
          <Button size="small" priority="secondary" onClick={() => onVerifyDoc?.(docKey)}>
            Confirm document
          </Button>
        )}

        {isReviewerConfirmed && (
          <Tooltip text={reviewerTooltip} placement="top">
            <VerifiedBadge
              label={`Confirmed by ${reviewerName}`}
              tooltip={reviewerTooltip}
              clickable={isReviewerActor}
              onClick={() => onVerifyDoc?.(docKey)}
            />
          </Tooltip>
        )}
      </div>

      {verifyBlocked && (
        <div
          ref={blockedMessageRef}
          className={styles.verifyBlockedMessage}
          role="status"
          aria-live="polite"
        >
          <p className={styles.verifyBlockedHint}>{blockedHint}</p>
          {verifyAttempted && (
            <InlineValidationMessage type="warning" message={blockedMessage} />
          )}
        </div>
      )}
    </div>
  )
}

import { useCallback, useState } from 'react'
import {
  getReviewActor,
  isCurrentReviewerActor,
  REVIEWER_NAME,
  type ActivityEntry,
} from '../../hooks/useSyncedReviewState'
import { useReturnNotes } from '../../hooks/useReturnNotes'
import { useReturnWorkflow } from '../../contexts/ReturnWorkflowContext'
import Tooltip from './Tooltip'
import AnnotationPopover from './AnnotationPopover'
import { formatAnnotationNote, isNoteLikeAnnotation, type AnnotationType } from './annotationTypes'
import { Badge, SuccessBadgeIcon, WarningBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { getVerifiedDocEntry, isVerifiedInSet, verifiedDocLabel } from '../../data/verifiedDocKeys'
import type { LiveAmounts } from '../../data/liveReturn'
import {
  canVerifyDoc,
  getDocVerifyIdentityBlockedHint,
} from './docReviewStatus'
import { getDocVerifyBlockedHint } from './phase1FieldSync'
import styles from '../../styles/data-review/DetailFields.module.css'

type Props = {
  docKey: string
  verifiedDocs?: Set<string>
  verifiedDocsMeta?: Map<string, ActivityEntry>
  reviewerConfirmedDocs?: Set<string>
  reviewerConfirmedDocsMeta?: Map<string, ActivityEntry>
  reviewedFields?: Map<string, unknown>
  /** Live return amounts - used for Tech Circle SSN/EIN verify gate */
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
    <Button
      priority="borderless"
      size="small"
      className={styles.verifiedBadgeBtn}
      onClick={onClick}
      aria-label={tooltip}
    >
      {badge}
    </Button>
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
  const { currentUser } = useReturnWorkflow()
  const { addNote } = useReturnNotes()
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentAnchor, setCommentAnchor] = useState<{ top: number; left: number } | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentType, setCommentType] = useState<AnnotationType>('note')

  const isPreparerVerified = verifiedDocs ? isVerifiedInSet(verifiedDocs, docKey) : false
  const isReviewerConfirmed = reviewerConfirmedDocs ? isVerifiedInSet(reviewerConfirmedDocs, docKey) : false
  const isReviewerActor = isCurrentReviewerActor()
  const preparerMeta = getVerifiedDocEntry(verifiedDocsMeta, docKey)
  const reviewerMeta = getVerifiedDocEntry(reviewerConfirmedDocsMeta, docKey)
  const preparerName = preparerMeta?.by ?? 'preparer'
  const reviewerName = reviewerMeta?.by ?? (isReviewerActor ? getReviewActor() : REVIEWER_NAME)
  const docLabel = verifiedDocLabel(docKey)
  const preparerTooltip = preparerMeta
    ? `Verified by ${preparerMeta.by} · ${preparerMeta.at}`
    : 'Click to unmark verified'
  const reviewerTooltip = reviewerMeta
    ? `Verified by ${reviewerMeta.by} · ${reviewerMeta.at}`
    : 'Click to remove your stamp'

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

  const handlePreparerMark = () => {
    if (verifyBlocked) return
    onVerifyDoc?.(docKey)
  }

  const needsReviewerConfirm =
    isReviewerActor && isPreparerVerified && !isReviewerConfirmed

  const closeComment = useCallback(() => {
    setCommentOpen(false)
    setCommentAnchor(null)
    setCommentDraft('')
    setCommentType('note')
  }, [])

  const openComment = (btn: HTMLElement) => {
    const rect = btn.getBoundingClientRect()
    const popoverWidth = 300
    let left = rect.left - popoverWidth - 8
    if (left < 8) left = rect.right + 8
    setCommentAnchor({ top: rect.bottom, left })
    setCommentOpen(true)
  }

  const submitComment = () => {
    const formatted = formatAnnotationNote(commentType, commentDraft)
    if (isNoteLikeAnnotation(commentType) && !formatted.trim()) return
    addNote(
      formatted || 'Note',
      currentUser.name,
      currentUser.role === 'reviewer' || currentUser.role === 'manager' ? 'reviewer' : 'preparer',
      docLabel,
    )
    closeComment()
  }

  return (
    <div className={styles.verifyHeaderActionsCol}>
      <div className={styles.verifyStatusGroup}>
        {needsReviewerConfirm && (
          <Tooltip text="Needs your stamp" placement="top">
            <span className={styles.needsConfirmIconWrap}>
              <Badge
                shape="round"
                status="warning"
                aria-label="Needs your stamp"
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
            Verify as {getReviewActor().split(' ')[0]}
          </Button>
        )}

        {isReviewerConfirmed && (
          <Tooltip text={reviewerTooltip} placement="top">
            <VerifiedBadge
              label={`Verified by ${reviewerName}`}
              tooltip={reviewerTooltip}
              clickable={isReviewerActor}
              onClick={() => onVerifyDoc?.(docKey)}
            />
          </Tooltip>
        )}

        <Button
          size="small"
          priority="tertiary"
          onClick={e => {
            e.stopPropagation()
            if (commentOpen) closeComment()
            else openComment(e.currentTarget)
          }}
          aria-label={`Add a comment on ${docLabel}`}
        >
          Comment
        </Button>
      </div>

      {verifyBlocked && (
        <Badge
          className={styles.verifyBlockedBadge}
          status="warning"
          label={blockedHint}
          capitalization="sentence"
          priority="secondary"
          aria-live="polite"
        />
      )}

      <AnnotationPopover
        open={commentOpen}
        anchor={commentAnchor}
        contextLabel={docLabel}
        draft={commentDraft}
        annotationType={commentType}
        onDraftChange={setCommentDraft}
        onTypeChange={setCommentType}
        onClose={closeComment}
        onSubmit={submitComment}
        submitLabel={isNoteLikeAnnotation(commentType) ? 'Post' : 'Save'}
        cancelLabel={isNoteLikeAnnotation(commentType) ? 'Cancel' : 'Skip'}
        chipVariant={commentType === 'note' ? 'default' : 'flag'}
      />
    </div>
  )
}

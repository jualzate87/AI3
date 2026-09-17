import { useCallback, useState } from 'react'
import {
  actorInitials,
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
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import { ChevronDown, CircleCheckFill, Comment } from '@design-systems/icons'
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

function ApprovalMark({
  entry,
  tooltip,
  own,
  onRemove,
}: {
  entry: ActivityEntry
  tooltip: string
  own: boolean
  onRemove?: () => void
}) {
  const content = (
    <>
      <CircleCheckFill size="x-small" className={styles.approvalCheck} aria-hidden />
      <span>{actorInitials(entry.by)}</span>
      {own && <ChevronDown size="x-small" aria-hidden />}
    </>
  )

  if (!own) {
    return (
      <Tooltip text={tooltip} placement="top">
        <span className={styles.approvalMark} aria-label={tooltip} tabIndex={0}>
          {content}
        </span>
      </Tooltip>
    )
  }

  return (
    <Tooltip text={tooltip} placement="top">
      <Button
        priority="borderless"
        size="small"
        className={styles.approvalMarkButton}
        onClick={onRemove}
        aria-label={`${tooltip}. Remove your verification`}
      >
        {content}
      </Button>
    </Tooltip>
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
  const docLabel = verifiedDocLabel(docKey)
  const reviewerName = reviewerMeta?.by ?? (isReviewerActor ? getReviewActor() : REVIEWER_NAME)
  const preparerTooltip = preparerMeta
    ? `Verified by ${preparerMeta.by} · ${preparerMeta.at}`
    : 'Verified by preparer'
  const reviewerTooltip = reviewerMeta
    ? `Verified by ${reviewerMeta.by} · ${reviewerMeta.at}`
    : `Verified by ${isReviewerActor ? getReviewActor() : REVIEWER_NAME}`

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

  /** Verification is per person, not a chain - a reviewer can verify a doc the preparer never touched. */
  const canReviewerVerify = isReviewerActor && !isReviewerConfirmed

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
        {isPreparerVerified && (
          <ApprovalMark
            entry={preparerMeta ?? { by: 'Preparer', at: 'Earlier' }}
            tooltip={preparerTooltip}
            own={preparerMeta ? preparerMeta.by === getReviewActor() : !isReviewerActor}
            onRemove={() => onVerifyDoc?.(docKey)}
          />
        )}

        {!isPreparerVerified && !isReviewerActor && (
          <Button size="small" priority="secondary" onClick={handlePreparerMark}>
            Mark as verified
          </Button>
        )}

        {canReviewerVerify && (
          <Button size="small" priority="secondary" onClick={() => onVerifyDoc?.(docKey)}>
            Mark as verified
          </Button>
        )}

        {isReviewerConfirmed && (
          <ApprovalMark
            entry={reviewerMeta ?? { by: reviewerName, at: 'Earlier' }}
            tooltip={reviewerTooltip}
            own={reviewerMeta ? reviewerMeta.by === getReviewActor() : isReviewerActor}
            onRemove={() => onVerifyDoc?.(docKey)}
          />
        )}

        <Tooltip
          text={commentOpen ? 'Close document comment' : `Comment on ${docLabel}`}
          placement="top"
          disabled={commentOpen}
        >
          <IconControl
            size="x-small"
            shape="square"
            selected={commentOpen}
            onClick={e => {
              e.stopPropagation()
              if (commentOpen) closeComment()
              else openComment(e.currentTarget)
            }}
            aria-label={`${commentOpen ? 'Close' : 'Add'} comment on ${docLabel}`}
          >
            <Comment size="small" aria-hidden />
          </IconControl>
        </Tooltip>
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

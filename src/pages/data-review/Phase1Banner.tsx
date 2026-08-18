import { ArrowRight, CircleCheck } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import CoachTip from './CoachTip'
import DocReviewProgress from './DocReviewProgress'
import styles from '../../styles/data-review/Phase1Banner.module.css'

interface Phase1BannerProps {
  /** Resolved import flags (hard gate for AI diagnostics) */
  flagsResolved: number
  flagsTotal: number
  /** Packet docs mark-reviewed (soft progress after imports start) */
  verifiedDocCount: number
  totalDocCount: number
  /** All import flags resolved — hard gate for AI diagnostics */
  flagsCleared: boolean
  /** Count of packet source docs (incl. Questionnaire) not yet mark-reviewed */
  unreviewedDocCount?: number
  /** Soft complete: all packet docs mark-reviewed (primary Phase 1 progress signal) */
  complete: boolean
  /** Continue to Phase 2 — AI Diagnostics (enabled when flags cleared) */
  onContinue?: () => void
  /** Whether the CPA has started opening source docs for import review */
  importsStarted?: boolean
  /** Begin import review — reveals source documents on the right */
  onStartImports?: () => void
  /** One-shot coach tip on Continue when Phase 1 is fully complete */
  continueCoachOpen?: boolean
  onDismissContinueCoach?: () => void
}

/**
 * ProtoC Phase 1 step header. Progress, start CTA, AI-diagnostics lock, and complete state.
 * Remaining-document attention (copy + CTA) lives on Phase1IssueBanner (documents mode).
 * Document review is the primary gate for Continue; unresolved flags are secondary.
 */
export default function Phase1Banner({
  flagsResolved,
  flagsTotal,
  verifiedDocCount,
  totalDocCount,
  flagsCleared,
  unreviewedDocCount = 0,
  complete,
  onContinue,
  importsStarted = false,
  onStartImports,
  continueCoachOpen = false,
  onDismissContinueCoach,
}: Phase1BannerProps) {
  const docsReviewComplete = complete
  const flagsRemaining = flagsTotal - flagsResolved

  return (
    <div
      className={[styles.banner, docsReviewComplete ? styles.bannerComplete : ''].filter(Boolean).join(' ')}
    >
      <div className={styles.left}>
        <img src={intuitAssistIcon} alt="" className={styles.icon} />
        <div className={styles.text}>
          {docsReviewComplete ? (
            <>
              <span className={styles.title}>Source documents reviewed</span>
              <span className={styles.subtitle}>
                {flagsCleared
                  ? 'All source documents and import flags are resolved. Ready to move to Step 2?'
                  : `${flagsRemaining} import ${flagsRemaining === 1 ? 'flag remains' : 'flags remain'} — you can continue to AI diagnostics or resolve them first.`}
              </span>
            </>
          ) : (
            <>
              <span className={styles.title}>Step 1: Import accuracy</span>
              {!importsStarted && (
                <span className={styles.subtitle}>
                  Review each source document and mark it verified, then continue to AI diagnostics.
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {importsStarted && !docsReviewComplete && (
          <DocReviewProgress
            verified={verifiedDocCount}
            total={totalDocCount}
            variant="compact"
          />
        )}

        {!importsStarted && onStartImports && (
          <Button
            priority="primary"
            size="medium"
            onClick={onStartImports}
          >
            Start reviewing imports
          </Button>
        )}

        {docsReviewComplete && onContinue ? (
          <CoachTip
            open={!!continueCoachOpen && complete}
            title="Ready for AI diagnostics"
            message="Source document review is complete. Continue to Step 2 for compliance, year-over-year, and planning insights."
            onClose={() => onDismissContinueCoach?.()}
            position="bottom"
            alignment="right"
          >
            <Button
              priority="primary"
              size="medium"
              onClick={() => {
                if (continueCoachOpen) onDismissContinueCoach?.()
                onContinue()
              }}
            >
              Continue to AI diagnostics <ArrowRight size="small" />
            </Button>
          </CoachTip>
        ) : null}
      </div>

      {docsReviewComplete && (
        <span className={styles.completeBadge}>
          <CircleCheck size="small" /> All documents reviewed
        </span>
      )}
    </div>
  )
}

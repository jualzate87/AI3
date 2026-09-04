import type { ReactNode } from 'react'
import { Badge, SuccessBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/Phase1Banner.module.css'

interface Phase2BannerProps {
  reviewed: number
  total: number
  complete: boolean
  /** When agent is closed with work left - open AI Review from the counter link */
  onOpenDiagnostics?: () => void
  /** True while Review AI panel is open (counter stays plain text) */
  diagnosticsOpen?: boolean
  /** Sign-off CTA - sits on the same row as Step 2 title / progress */
  signOffSlot?: ReactNode
  /** e.g. { complete: 4, total: 6 } for "Review · 4/6 steps" */
  checklistProgress?: { complete: number; total: number }
}

export default function Phase2Banner({
  reviewed,
  total,
  complete,
  onOpenDiagnostics,
  diagnosticsOpen = false,
  signOffSlot,
  checklistProgress,
}: Phase2BannerProps) {
  const remaining = Math.max(0, total - reviewed)
  const showProgressLink = !complete && !!onOpenDiagnostics && !diagnosticsOpen && remaining > 0

  return (
    <div className={`${styles.banner} ${complete ? styles.bannerComplete : ''}`}>
      <div className={styles.left}>
        <img src={intuitAssistIcon} alt="" className={styles.icon} />
        <div className={styles.text}>
          {complete ? (
            <>
              <span className={styles.title}>Review complete</span>
              <span className={styles.subtitle}>All diagnostics have been addressed. This return is ready for your sign-off.</span>
            </>
          ) : (
            <>
              <span className={styles.title}>Step 2: AI diagnostics</span>
              <span className={styles.subtitle}>
                Filing stoppers, compliance checks, and opportunities for this return.
              </span>
            </>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {!complete && (
          showProgressLink ? (
            <Button
              priority="borderless"
              size="medium"
              className={styles.counterLink}
              onClick={onOpenDiagnostics}
              aria-label={`Open AI diagnostics - ${reviewed} of ${total} diagnostics reviewed, ${remaining} diagnostics remaining`}
            >
              <strong className={styles.counterNum}>{reviewed}</strong> of {total} diagnostics reviewed
            </Button>
          ) : (
            <span className={styles.counter}>
              <strong className={styles.counterNum}>{reviewed}</strong> of {total} diagnostics reviewed
            </span>
          )
        )}
        {complete && (
          <Badge
            className={styles.completeBadge}
            shape="round"
            status="success"
            label="All diagnostics reviewed"
            capitalization="sentence"
            priority="secondary"
          >
            <SuccessBadgeIcon />
          </Badge>
        )}
        {checklistProgress && (
          <span className={styles.checklistHint} aria-live="polite">
            Review · {checklistProgress.complete}/{checklistProgress.total} steps
          </span>
        )}
        {signOffSlot}
      </div>
    </div>
  )
}

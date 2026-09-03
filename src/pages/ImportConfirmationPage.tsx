import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheckFill, ChevronLeft, ChevronRight } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Link } from '@ids-ts/link'
import '@ids-ts/link/dist/main.css'
import { ProgressBar } from '@ids-ts/progress-bar'
import '@ids-ts/progress-bar/dist/main.css'
import { H5, B2, B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import SmartReturnHeader from './SmartReturnHeader'
import LeftNavPTO from './data-review/LeftNavPTO'
import styles from '../styles/ImportConfirmationPage.module.css'
import { completeDocumentImport } from '../hooks/useSyncedReviewState'
import { openHashRoute, PREPARER_DATA_REVIEW_PATH } from '../lib/prototypeRoutes'

export default function ImportConfirmationPage() {
  const navigate = useNavigate()

  useEffect(() => {
    completeDocumentImport()
  }, [])

  useEffect(() => {
    const el = document.documentElement
    const prevTheme = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#205ea3')
    el.style.setProperty('--color-action-standard-hover', '#174d87')
    el.style.setProperty('--color-action-standard-active', '#174d87')
    return () => {
      if (prevTheme) el.setAttribute('data-theme', prevTheme)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
      el.style.removeProperty('--color-action-standard-active')
    }
  }, [])

  const handleBackToSmartReturn = () => {
    navigate('/smart-return')
  }

  const handleReviewReturn = () => {
    openHashRoute(PREPARER_DATA_REVIEW_PATH)
  }

  return (
    <div className={styles.page} data-theme="intuit">
      <SmartReturnHeader activeTab="smartreturn" />

      <div className={styles.body}>
        <LeftNavPTO />
        <div className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Button
            priority="borderless"
            size="small"
            className={styles.breadcrumbBtn}
            onClick={handleBackToSmartReturn}
          >
            <ChevronLeft size="small" aria-hidden />
            Back to SmartReturn
          </Button>
        </nav>

        <div className={styles.card} role="status" aria-live="polite">
          <CircleCheckFill size="xlarge" className={styles.checkIcon} aria-hidden />
          <H5 as="h1" weight="demi" className={styles.cardTitle}>
            The return is ready for review
          </H5>
          <B2 className={styles.cardBody}>
            Your review starts in a <strong>new tab</strong>, showing output forms first
          </B2>

          <ProgressBar
            className={styles.progressBar}
            value={100}
            max={100}
            persistent
            automationId="import-complete-progress"
            aria-label="Import complete"
          />

          <Button
            priority="primary"
            onClick={handleReviewReturn}
            automationId="review-return-confirmation-cta"
          >
            Review the return
            <ChevronRight size="small" aria-hidden />
          </Button>

          <B3 className={styles.feedback}>
            How was your import?{' '}
            <Link href="#" onClick={e => e.preventDefault()}>
              Share your feedback
            </Link>
          </B3>
        </div>

        <div className={styles.bottomBar}>
          <Button priority="borderless" onClick={handleBackToSmartReturn}>
            Back
          </Button>
        </div>
        </div>
      </div>
    </div>
  )
}

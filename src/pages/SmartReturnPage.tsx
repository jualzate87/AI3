import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SmartReturnHeader from './SmartReturnHeader'
import SmartReturnDocumentHub from './SmartReturnDocumentHub'
import LeftNavPTO from './data-review/LeftNavPTO'
import layout from '../styles/CoreScreenLayout.module.css'
import styles from '../styles/SmartReturnPage.module.css'
import {
  openReviewReturnPopout,
  setStoredDemoRole,
} from '../lib/prototypeRoutes'

export default function SmartReturnPage() {
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const [reviewRole, setReviewRole] = useState<'preparer' | 'reviewer'>(() =>
    roleParam === 'reviewer' ? 'reviewer' : 'preparer',
  )

  useEffect(() => {
    setStoredDemoRole(reviewRole)
  }, [reviewRole])

  useEffect(() => {
    setReviewRole(roleParam === 'reviewer' ? 'reviewer' : 'preparer')
  }, [roleParam])

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

  const handleReviewReturn = () => {
    openReviewReturnPopout('1040')
  }

  const isReviewer = reviewRole === 'reviewer'

  return (
    <div className={`${layout.page} ${styles.page}`} data-theme="intuit">
      <div className={layout.body}>
        <LeftNavPTO />
        <div className={layout.rightSide}>
          <SmartReturnHeader
            activeTab="smartreturn"
            showReviewReturn={isReviewer}
            onReviewReturn={handleReviewReturn}
          />

          <SmartReturnDocumentHub readOnly={isReviewer} />
        </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CheckReturnNav, { type ContentView } from './check-return/CheckReturnNav'
import CheckReturnMainContent from './check-return/CheckReturnMainContent'
import ReviewReturnPopoutHeader from './check-return/ReviewReturnPopoutHeader'
import { checkReturnFormToOutputId } from './check-return/outputFormNav'
import type { OutputFormId } from './data-review/outputForms'
import { openSourceDocumentReviewPopout } from '../lib/prototypeRoutes'
import styles from '../styles/check-return/CheckReturnPopoutPage.module.css'

function resolveInitialOutputForm(searchParams: URLSearchParams): OutputFormId {
  const formParam = searchParams.get('form')
  if (formParam === '1040' || formParam === 'sch1' || formParam === 'schC' || formParam === 'schD' || formParam === 'schA') {
    return formParam as OutputFormId
  }
  return '1040'
}

const FORM_PARAM_LABELS: Record<string, string> = {
  '1040': '1040',
  sch1: 'Sch 1',
  schC: 'Sch C',
  schD: 'Sch D',
  schA: 'Sch A',
}

/** Focused review-return window - tax summary + output forms only (Figma 34240:165563). */
export default function CheckReturnPopoutPage() {
  const [searchParams] = useSearchParams()
  const initialForm = useMemo(() => resolveInitialOutputForm(searchParams), [searchParams])

  const [contentView, setContentView] = useState<ContentView>('form-output')
  const [selectedForm, setSelectedForm] = useState<string | null>('1040')
  const [outputFormId, setOutputFormId] = useState<OutputFormId>(initialForm)

  useEffect(() => {
    const el = document.documentElement
    const prev = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#205ea3')
    el.style.setProperty('--color-action-standard-hover', '#174d87')
    el.style.setProperty('--color-action-standard-active', '#174d87')
    return () => {
      if (prev) el.setAttribute('data-theme', prev)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
      el.style.removeProperty('--color-action-standard-active')
    }
  }, [])

  useEffect(() => {
    const formParam = searchParams.get('form')
    if (!formParam) return
    setOutputFormId(resolveInitialOutputForm(searchParams))
    setSelectedForm(FORM_PARAM_LABELS[formParam] ?? '1040')
    setContentView('form-output')
  }, [searchParams])

  const handleSelectFederal = () => {
    setContentView('federal-summary')
    setSelectedForm(null)
  }

  const handleSelectCalifornia = () => {
    setContentView('california-summary')
    setSelectedForm(null)
  }

  const handleSelectForm = (form: string) => {
    setSelectedForm(form)
    const mapped = checkReturnFormToOutputId(form)
    if (mapped) {
      setOutputFormId(mapped)
      setContentView('form-output')
    }
  }

  const handleRefreshForms = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <div className={styles.page} data-theme="intuit">
      <ReviewReturnPopoutHeader
        onViewSourceDocuments={() => openSourceDocumentReviewPopout()}
        onRefreshForms={handleRefreshForms}
      />
      <div className={styles.body}>
        <CheckReturnNav
          variant="focused"
          contentView={contentView}
          selectedForm={selectedForm}
          onSelectFederal={handleSelectFederal}
          onSelectCalifornia={handleSelectCalifornia}
          onSelectForm={handleSelectForm}
        />
        <CheckReturnMainContent
          contentView={contentView}
          selectedForm={selectedForm}
          outputFormId={outputFormId}
        />
      </div>
    </div>
  )
}

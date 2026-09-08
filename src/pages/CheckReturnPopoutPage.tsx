import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CheckReturnNav, { type ContentView } from './check-return/CheckReturnNav'
import CheckReturnMainContent from './check-return/CheckReturnMainContent'
import ReviewReturnPopoutHeader from './check-return/ReviewReturnPopoutHeader'
import { checkReturnFormToOutputId } from './check-return/outputFormNav'
import type { OutputFormId } from './data-review/outputForms'
import { OUTPUT_FORM_OPTIONS } from './data-review/outputForms'
import {
  PHASE2_DIAGNOSTIC_ORDER,
  type Phase2IssueKey,
} from './data-review/phase2FlagSync'
import { openSourceDocumentReviewPopout } from '../lib/prototypeRoutes'
import styles from '../styles/check-return/CheckReturnPopoutPage.module.css'

const VALID_OUTPUT_FORMS = new Set<OutputFormId>([
  '1040',
  'sch1',
  'schC',
  'schD',
  'schA',
  'f8960',
  'f2210',
])

function resolveInitialOutputForm(searchParams: URLSearchParams): OutputFormId {
  const formParam = searchParams.get('form')
  if (formParam && VALID_OUTPUT_FORMS.has(formParam as OutputFormId)) {
    return formParam as OutputFormId
  }
  return '1040'
}

function resolveDiagnosticKey(searchParams: URLSearchParams): Phase2IssueKey | null {
  const diagnostic = searchParams.get('diagnostic')
  if (!diagnostic) return null
  return PHASE2_DIAGNOSTIC_ORDER.includes(diagnostic as Phase2IssueKey)
    ? (diagnostic as Phase2IssueKey)
    : null
}

function navLabelForForm(formId: OutputFormId): string {
  const opt = OUTPUT_FORM_OPTIONS.find(o => o.id === formId)
  return opt?.shortLabel ?? '1040'
}

/** Focused review-return window - tax summary + output forms only (Figma 34240:165563). */
export default function CheckReturnPopoutPage() {
  const [searchParams] = useSearchParams()
  const initialForm = useMemo(() => resolveInitialOutputForm(searchParams), [searchParams])
  const initialDiagnostic = useMemo(() => resolveDiagnosticKey(searchParams), [searchParams])

  const [contentView, setContentView] = useState<ContentView>('form-output')
  const [selectedForm, setSelectedForm] = useState<string | null>(() =>
    navLabelForForm(initialForm),
  )
  const [outputFormId, setOutputFormId] = useState<OutputFormId>(initialForm)
  const [diagnosticHighlightKey, setDiagnosticHighlightKey] = useState<Phase2IssueKey | null>(
    initialDiagnostic,
  )

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
    const formId = resolveInitialOutputForm(searchParams)
    setOutputFormId(formId)
    setSelectedForm(navLabelForForm(formId))
    setContentView('form-output')
    setDiagnosticHighlightKey(resolveDiagnosticKey(searchParams))
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
          diagnosticHighlightKey={diagnosticHighlightKey}
        />
      </div>
    </div>
  )
}

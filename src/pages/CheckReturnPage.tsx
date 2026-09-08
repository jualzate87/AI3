import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LeftNavPTO from './data-review/LeftNavPTO'
import SmartReturnHeader from './SmartReturnHeader'
import ReturnContextRail from '../components/ReturnContextRail'
import CheckReturnNav, { type ContentView } from './check-return/CheckReturnNav'
import CheckReturnMainContent from './check-return/CheckReturnMainContent'
import {
  checkReturnFormToOutputId,
} from './check-return/outputFormNav'
import type { OutputFormId } from './data-review/outputForms'
import { computeLiveReturn } from '../data/liveReturn'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import { getPhase2Progress } from './data-review/phase2FlagSync'
import type { Phase2IssueKey } from './data-review/phase2FlagSync'
import {
  AI_DIAGNOSTIC_CATEGORIES,
  primaryIssueKeyForCategory,
} from './check-return/aiDiagnosticCategories'
import type { AiDiagnosticsView } from './check-return/AiDiagnosticsPanel'
import { openSourceDocumentReviewPopout } from '../lib/prototypeRoutes'
import layout from '../styles/CoreScreenLayout.module.css'
import styles from '../styles/CheckReturnPage.module.css'

function resolveInitialOutputForm(searchParams: URLSearchParams): OutputFormId {
  const formParam = searchParams.get('form')
  if (formParam === '1040' || formParam === 'sch1' || formParam === 'schC' || formParam === 'schD' || formParam === 'schA') {
    return formParam as OutputFormId
  }
  return '1040'
}

export default function CheckReturnPage() {
  const [searchParams] = useSearchParams()
  const initialForm = useMemo(() => resolveInitialOutputForm(searchParams), [searchParams])
  const openFormFromUrl = searchParams.get('form') != null

  const [contentView, setContentView] = useState<ContentView>(() =>
    openFormFromUrl ? 'form-output' : 'federal-summary',
  )
  const [selectedForm, setSelectedForm] = useState<string | null>(() =>
    openFormFromUrl ? '1040' : null,
  )
  const [outputFormId, setOutputFormId] = useState<OutputFormId>(initialForm)
  const [aiDiagnosticsView, setAiDiagnosticsView] = useState<AiDiagnosticsView>('overview')
  const [selectedDiagnosticKey, setSelectedDiagnosticKey] = useState<Phase2IssueKey | null>(null)
  const [selectedAiDiagnosticSubId, setSelectedAiDiagnosticSubId] = useState<string | null>(null)

  const { amounts, reviewedFields } = useSyncedReviewState()
  const live = useMemo(() => computeLiveReturn(amounts), [amounts])
  const phase2Progress = useMemo(
    () => getPhase2Progress({ reviewedFields, live, amounts }),
    [reviewedFields, live, amounts],
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
    if (!openFormFromUrl) return
    setContentView('form-output')
    setSelectedForm('1040')
    setOutputFormId(initialForm)
  }, [openFormFromUrl, initialForm])

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

  const handleSelectAiDiagnosticsOverview = () => {
    setContentView('ai-diagnostics')
    setAiDiagnosticsView('overview')
    setSelectedDiagnosticKey(null)
    setSelectedAiDiagnosticSubId(null)
  }

  const handleSelectAiDiagnosticSub = (subId: string) => {
    const index = Number(subId.replace('diagnostic-', '')) - 1
    const category = AI_DIAGNOSTIC_CATEGORIES[index]
    if (!category) return
    const issueKey = primaryIssueKeyForCategory(category.id, phase2Progress.activeKeys)
    setContentView('ai-diagnostics')
    setSelectedAiDiagnosticSubId(subId)
    if (issueKey) {
      setSelectedDiagnosticKey(issueKey)
      setAiDiagnosticsView('detail')
    } else {
      setSelectedDiagnosticKey(null)
      setAiDiagnosticsView('overview')
    }
  }

  const handleAiDiagnosticsViewChange = (
    view: AiDiagnosticsView,
    issueKey?: Phase2IssueKey | null,
  ) => {
    setAiDiagnosticsView(view)
    setSelectedDiagnosticKey(issueKey ?? null)
    if (view === 'overview') {
      setSelectedAiDiagnosticSubId(null)
    }
  }

  return (
    <div className={`${layout.page} ${styles.page}`} data-theme="intuit">
      <div className={layout.body}>
        <LeftNavPTO />
        <div className={layout.rightSide}>
          <SmartReturnHeader
            activeTab="checkreturns"
            showViewSourceDocuments
            onViewSourceDocuments={() => openSourceDocumentReviewPopout()}
          />
          <div className={styles.contentArea}>
            <CheckReturnNav
              contentView={contentView}
              selectedForm={selectedForm}
              aiDiagnosticCount={phase2Progress.total}
              selectedAiDiagnosticSubId={selectedAiDiagnosticSubId}
              onSelectFederal={handleSelectFederal}
              onSelectCalifornia={handleSelectCalifornia}
              onSelectForm={handleSelectForm}
              onSelectAiDiagnostics={handleSelectAiDiagnosticsOverview}
              onSelectAiDiagnosticSub={handleSelectAiDiagnosticSub}
            />

            <CheckReturnMainContent
              contentView={contentView}
              selectedForm={selectedForm}
              outputFormId={outputFormId}
              aiDiagnosticsView={aiDiagnosticsView}
              selectedDiagnosticKey={selectedDiagnosticKey}
              onAiDiagnosticsViewChange={handleAiDiagnosticsViewChange}
            />
            <ReturnContextRail className={styles.contextRail} />
          </div>
        </div>
      </div>
    </div>
  )
}

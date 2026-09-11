import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
import { getDiagnosticOverviewCounts } from './check-return/aiDiagnosticCategories'
import type { Phase2IssueKey } from './data-review/phase2FlagSync'
import {
  AI_DIAGNOSTIC_CATEGORIES,
  primaryIssueKeyForCategory,
} from './check-return/aiDiagnosticCategories'
import type { AiDiagnosticsView } from './check-return/AiDiagnosticsPanel'
import ActivityPanel from './check-return/ActivityPanel'
import { navigateToActivityTarget } from './check-return/activityNavigation'
import type { ActivityDeepLink } from './check-return/activityTypes'
import { isAgentModeEnabled, openSourceDocumentReviewPopout } from '../lib/prototypeRoutes'
import type { ReturnContextRailItemId } from '../components/ReturnContextRail'
import layout from '../styles/CoreScreenLayout.module.css'
import styles from '../styles/CheckReturnPage.module.css'
import agentLayout from '../styles/check-return/AgentDiagnosticsPanel.module.css'

export default function CheckReturnAgentPage() {
  const agentAllowed = isAgentModeEnabled()

  const [contentView, setContentView] = useState<ContentView>('ai-diagnostics')
  const [selectedForm, setSelectedForm] = useState<string | null>(null)
  const [outputFormId, setOutputFormId] = useState<OutputFormId>('1040')
  const [aiDiagnosticsView, setAiDiagnosticsView] = useState<AiDiagnosticsView>('overview')
  const [selectedDiagnosticKey, setSelectedDiagnosticKey] = useState<Phase2IssueKey | null>(null)
  const [selectedAiDiagnosticSubId, setSelectedAiDiagnosticSubId] = useState<string | null>(null)
  const [reviewLogOpen, setReviewLogOpen] = useState(false)

  const { amounts, reviewedFields } = useSyncedReviewState()
  const live = useMemo(() => computeLiveReturn(amounts), [amounts])
  const diagnosticOverview = useMemo(
    () => getDiagnosticOverviewCounts({ reviewedFields, live, amounts }),
    [reviewedFields, live, amounts],
  )

  useEffect(() => {
    const el = document.documentElement
    const prev = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#236cff')
    el.style.setProperty('--color-action-standard-hover', '#1b56cc')
    el.style.setProperty('--color-action-standard-active', '#1748aa')
    return () => {
      if (prev) el.setAttribute('data-theme', prev)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
      el.style.removeProperty('--color-action-standard-active')
    }
  }, [])

  if (!agentAllowed) {
    return <Navigate to="/check-return" replace />
  }

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
    const issueKey = primaryIssueKeyForCategory(category.id, diagnosticOverview.activeKeys)
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

  const handleContextRailItem = (id: ReturnContextRailItemId) => {
    if (id === 'activity') {
      setReviewLogOpen(open => !open)
    }
  }

  const handleActivityNavigate = (link: ActivityDeepLink) => {
    navigateToActivityTarget(link, {
      setContentView,
      setSelectedForm,
      setOutputFormId,
      handleSelectAiDiagnosticSub,
      handleSelectFederal,
    })
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
          <div className={`${styles.contentArea} ${agentLayout.pageShell}`}>
            <CheckReturnNav
              contentView={contentView}
              selectedForm={selectedForm}
              aiDiagnosticCount={diagnosticOverview.total}
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
              diagnosticHighlightKey={selectedDiagnosticKey}
              diagnosticsMode="agent"
            />
            <ReturnContextRail
              className={styles.contextRail}
              activeItem={reviewLogOpen ? 'activity' : undefined}
              onItemClick={handleContextRailItem}
            />
            <ActivityPanel
              isOpen={reviewLogOpen}
              onToggle={() => setReviewLogOpen(open => !open)}
              onNavigate={handleActivityNavigate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

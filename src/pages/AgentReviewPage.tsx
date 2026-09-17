import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Close,
  MenuExpand,
  CommentPencil,
  ClockCounterclockwise,
  PopOut,
  PanelArrowRight,
  OverflowWeb,
} from '@design-systems/icons'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import intuitWordmark from '../assets/intuit-wordmark.svg'
import {
  CTA_ACCEPT_ALL_FIXES,
  CTA_FIX_ONE_BY_ONE,
  INTELLIGENCE_CHAT_PLACEHOLDER,
  INTELLIGENCE_LEGAL_DISCLAIMER,
  INTELLIGENCE_CLOSE_ARIA,
  INTELLIGENCE_LOADING_SUBTEXT,
  INTELLIGENCE_LOADING_TITLE,
  STARTER_PROMPT_CATCH_UP,
  STARTER_PROMPT_FULL_REVIEW,
} from './agent-review/agentIntelligenceCopy'
import AgentWelcomePane from './agent-review/AgentWelcomePane'
import AgentReviewDiagnosticsPane from './agent-review/AgentReviewDiagnosticsPane'
import AgentCatchUpPane from './agent-review/AgentCatchUpPane'
import AgentReviewProcessingPane from './agent-review/AgentReviewProcessingPane'
import AgentReviewBackdrop from './agent-review/AgentReviewBackdrop'
import AgentReviewLayoutMenu from './agent-review/AgentReviewLayoutMenu'
import {
  persistLayoutMode,
  resolveInitialLayoutMode,
  type AgentReviewLayoutMode,
} from './agent-review/agentReviewLayout'
import type { ProcessingMode } from './agent-review/useAgentProcessingAnimation'
import AgentLoadingPane from './data-review/AgentLoadingPane'
import ChatInput from './automated/ChatInput'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import { openSourceDocumentReviewPopout } from '../lib/prototypeRoutes'
import chipStyles from '../styles/agent-review/AgentReviewFooterChips.module.css'
import styles from '../styles/AgentReviewPage.module.css'

type AgentStep = 'welcome' | 'diagnostics' | 'processing' | 'catch-up' | 'workspace'

const ASSESSING_MS = 3200

export default function AgentReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<AgentStep>(() =>
    sessionStorage.getItem('protoc3-open-catch-up') === '1' ? 'catch-up' : 'welcome',
  )
  const [layoutMode, setLayoutMode] = useState<AgentReviewLayoutMode>(() =>
    resolveInitialLayoutMode({
      navigationState: location.state,
      searchParams,
    }),
  )
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('batch')
  const [isAssessing, setIsAssessing] = useState(false)
  const [footerChips, setFooterChips] = useState<ReactNode>(null)
  const assessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const agentFixesAppliedRef = useRef(false)
  const { applyAgentIntelligenceFixes } = useSyncedReviewState()

  const isSidebar = layoutMode === 'sidebar'

  useEffect(() => {
    persistLayoutMode(layoutMode)
  }, [layoutMode])

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
      if (assessTimerRef.current) clearTimeout(assessTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem('protoc3-open-catch-up') === '1') {
      sessionStorage.removeItem('protoc3-open-catch-up')
    }
  }, [])

  useEffect(() => {
    if (step !== 'processing') {
      setFooterChips(null)
    }
  }, [step])

  const handleClose = () => {
    navigate('/check-return')
  }

  const handleLayoutChange = (mode: AgentReviewLayoutMode) => {
    if (mode === 'floating') return
    setLayoutMode(mode)
  }

  const startAssessing = () => {
    setIsAssessing(true)
    if (assessTimerRef.current) clearTimeout(assessTimerRef.current)
    assessTimerRef.current = setTimeout(() => {
      setIsAssessing(false)
      assessTimerRef.current = null
    }, ASSESSING_MS)
  }

  const beginDiagnostics = () => {
    setStep('diagnostics')
    startAssessing()
  }

  const beginProcessing = (mode: ProcessingMode = 'batch') => {
    agentFixesAppliedRef.current = false
    setProcessingMode(mode)
    setStep('processing')
  }

  const persistAgentFixes = () => {
    if (agentFixesAppliedRef.current) return
    agentFixesAppliedRef.current = true
    applyAgentIntelligenceFixes()
  }

  const openWorkspace = () => {
    persistAgentFixes()
    navigate('/data-review?entry=review-return&startReview=true')
  }

  const handlePromptClick = (prompt: string) => {
    if (prompt === STARTER_PROMPT_FULL_REVIEW) {
      beginDiagnostics()
      return
    }
    if (prompt === STARTER_PROMPT_CATCH_UP) {
      setStep('catch-up')
    }
  }

  const showChatInput =
    step !== 'workspace' && !(step === 'diagnostics' && isAssessing)

  const showDiagnosticsChips = step === 'diagnostics' && !isAssessing

  return (
    <>
      {isSidebar ? <AgentReviewBackdrop onDismiss={handleClose} /> : null}

      <div
        className={`${styles.shell} ${isSidebar ? styles.shellSidebar : styles.shellFullscreen}`}
        data-layout={layoutMode}
        data-theme="intuit"
      >
        <header className={isSidebar ? styles.headerSidebar : styles.header}>
          {isSidebar ? (
            <>
              <div className={styles.headerSidebarStart}>
                <IconControl
                  label="Menu"
                  size="medium"
                  shape="square"
                  onClick={() => undefined}
                >
                  <MenuExpand size="medium" />
                </IconControl>
              </div>
              <img src={intuitWordmark} alt="Intuit" className={styles.wordmarkCenter} />
              <div className={styles.headerSidebarEnd}>
                <IconControl
                  label="Open full screen"
                  size="medium"
                  shape="square"
                  onClick={() => setLayoutMode('fullscreen')}
                >
                  <PopOut size="medium" />
                </IconControl>
                <AgentReviewLayoutMenu mode={layoutMode} onChange={handleLayoutChange} />
                <IconControl
                  aria-label={INTELLIGENCE_CLOSE_ARIA}
                  size="medium"
                  shape="square"
                  onClick={handleClose}
                >
                  <Close size="medium" />
                </IconControl>
              </div>
            </>
          ) : (
            <>
              <img src={intuitWordmark} alt="Intuit" className={styles.wordmark} />
              <div className={styles.headerFullscreenEnd}>
                <IconControl label="More options" size="medium" shape="square">
                  <OverflowWeb size="medium" />
                </IconControl>
                <AgentReviewLayoutMenu mode={layoutMode} onChange={handleLayoutChange} />
                <IconControl
                  label="Sidebar layout"
                  size="medium"
                  shape="square"
                  onClick={() => setLayoutMode('sidebar')}
                >
                  <PanelArrowRight size="medium" />
                </IconControl>
                <IconControl
                  aria-label={INTELLIGENCE_CLOSE_ARIA}
                  size="medium"
                  shape="square"
                  onClick={handleClose}
                >
                  <Close size="medium" />
                </IconControl>
              </div>
            </>
          )}
        </header>

        <div className={styles.body}>
          {!isSidebar ? (
            <aside className={styles.threadRail} aria-label="Chat navigation">
              <button type="button" className={styles.railBtn} aria-label="Hide chat history">
                <MenuExpand size="medium" />
              </button>
              <button type="button" className={styles.railBtn} aria-label="New chat">
                <CommentPencil size="medium" />
              </button>
              <button type="button" className={styles.railBtn} aria-label="Recent chats">
                <ClockCounterclockwise size="medium" />
              </button>
            </aside>
          ) : null}

          <div className={styles.main}>
            <div className={styles.pane}>
              {step === 'welcome' && (
                <AgentWelcomePane onPromptClick={handlePromptClick} compact={isSidebar} />
              )}
              {step === 'diagnostics' && (
                <AgentLoadingPane
                  embedded
                  loadingTitle={INTELLIGENCE_LOADING_TITLE}
                  loadingSubtext={INTELLIGENCE_LOADING_SUBTEXT}
                  isLoading={isAssessing}
                  showReport={!isAssessing}
                  reportContent={<AgentReviewDiagnosticsPane />}
                />
              )}
              {step === 'catch-up' && (
                <AgentCatchUpPane
                  onViewUpdatedReturn={() => openWorkspace()}
                  onViewDocuments={() => openSourceDocumentReviewPopout()}
                  onApproveReturn={() => openWorkspace()}
                />
              )}
              {step === 'processing' && (
                <AgentReviewProcessingPane
                  mode={processingMode}
                  compact={isSidebar}
                  onViewUpdatedReturn={() => openWorkspace()}
                  onViewSourceDocuments={() => openSourceDocumentReviewPopout()}
                  onViewReturnSummary={() => navigate('/check-return')}
                  onGetCaughtUp={() => setStep('catch-up')}
                  onFooterChipsChange={setFooterChips}
                  onFixesComplete={persistAgentFixes}
                />
              )}
            </div>

            {showChatInput && (
              <div className={styles.pageFooter}>
                {(showDiagnosticsChips || footerChips) && (
                  <div className={styles.footerChips}>
                    {showDiagnosticsChips && (
                      <>
                        <button
                          type="button"
                          className={chipStyles.chip}
                          onClick={() => beginProcessing('batch')}
                        >
                          {CTA_ACCEPT_ALL_FIXES}
                        </button>
                        <button
                          type="button"
                          className={chipStyles.chip}
                          onClick={() => beginProcessing('sequential')}
                        >
                          {CTA_FIX_ONE_BY_ONE}
                        </button>
                      </>
                    )}
                    {!showDiagnosticsChips && footerChips}
                  </div>
                )}
                <ChatInput
                  variant="mini"
                  placeholder={INTELLIGENCE_CHAT_PLACEHOLDER}
                  legalDisclaimer={INTELLIGENCE_LEGAL_DISCLAIMER}
                  onSend={() => {
                    if (step === 'welcome') beginDiagnostics()
                    else if (step === 'diagnostics' && !isAssessing) beginProcessing()
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

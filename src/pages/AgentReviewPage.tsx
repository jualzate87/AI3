import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Close,
  MenuExpand,
  CommentPencil,
  ClockCounterclockwise,
  PopOut,
} from '@design-systems/icons'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import intuitWordmark from '../assets/intuit-wordmark.svg'
import {
  INTELLIGENCE_CHAT_PLACEHOLDER,
  INTELLIGENCE_LEGAL_DISCLAIMER,
  INTELLIGENCE_CLOSE_ARIA,
  INTELLIGENCE_LOADING_TITLE,
  STARTER_PROMPT_CATCH_UP,
  STARTER_PROMPT_FULL_REVIEW,
} from './agent-review/agentIntelligenceCopy'
import AgentWelcomePane from './agent-review/AgentWelcomePane'
import AgentReviewDiagnosticsPane from './agent-review/AgentReviewDiagnosticsPane'
import AgentCatchUpPane from './agent-review/AgentCatchUpPane'
import AgentReviewProcessingPane from './agent-review/AgentReviewProcessingPane'
import AgentReviewLayoutMenu from './agent-review/AgentReviewLayoutMenu'
import CheckReturnPage from './CheckReturnPage'
import {
  persistLayoutMode,
  resolveInitialLayoutMode,
  type AgentReviewLayoutMode,
} from './agent-review/agentReviewLayout'
import type { ProcessingMode } from './agent-review/useAgentProcessingAnimation'
import {
  clearAgentSession,
  isResumableStep,
  loadAgentSession,
  saveAgentSession,
  type AgentStep,
} from './agent-review/agentReviewSession'
import AgentLoadingPane from './data-review/AgentLoadingPane'
import ChatInput from './automated/ChatInput'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import styles from '../styles/AgentReviewPage.module.css'

const ASSESSING_MS = 3200

/**
 * Reopening the panel lands on the last conversation when there is one. An
 * explicit "get caught up" request always starts that summary fresh.
 */
function resolveInitialSession() {
  if (sessionStorage.getItem('protoc3-open-catch-up') === '1') {
    return {
      step: 'catch-up' as AgentStep,
      processingMode: 'batch' as ProcessingMode,
      resumed: false,
    }
  }
  const saved = loadAgentSession()
  if (saved) return { ...saved, resumed: true }
  return { step: 'welcome' as AgentStep, processingMode: 'batch' as ProcessingMode, resumed: false }
}

export default function AgentReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [initialSession] = useState(resolveInitialSession)
  const [step, setStep] = useState<AgentStep>(initialSession.step)
  /** The step restored from a past session — it renders finished instead of replaying. */
  const [resumedStep, setResumedStep] = useState<AgentStep | null>(
    initialSession.resumed ? initialSession.step : null,
  )
  const [layoutMode, setLayoutMode] = useState<AgentReviewLayoutMode>(() =>
    resolveInitialLayoutMode({
      navigationState: location.state,
      searchParams,
    }),
  )
  const [processingMode, setProcessingMode] = useState<ProcessingMode>(
    initialSession.processingMode,
  )
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

  useEffect(() => {
    if (isResumableStep(step)) saveAgentSession({ step, processingMode })
  }, [processingMode, step])

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

  /** Any step the user starts here is generated live, so it is never a resumed one. */
  const goToStep = (next: AgentStep) => {
    setResumedStep(null)
    setStep(next)
  }

  const beginDiagnostics = () => {
    goToStep('diagnostics')
    startAssessing()
  }

  const beginProcessing = (mode: ProcessingMode = 'batch') => {
    agentFixesAppliedRef.current = false
    setProcessingMode(mode)
    goToStep('processing')
  }

  const handleNewChat = () => {
    clearAgentSession()
    if (assessTimerRef.current) {
      clearTimeout(assessTimerRef.current)
      assessTimerRef.current = null
    }
    setIsAssessing(false)
    setFooterChips(null)
    goToStep('welcome')
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
      goToStep('catch-up')
    }
  }

  const showChatInput = step !== 'workspace' && !(step === 'diagnostics' && isAssessing)

  return (
    <>
      {isSidebar ? (
        <div className={styles.proConnectUnderlay}>
          <CheckReturnPage embeddedUnderlay />
        </div>
      ) : null}

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
                  aria-label="Menu"
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
                  aria-label="Open full screen"
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
          )}
        </header>

        <div className={styles.body}>
          {!isSidebar ? (
            <aside className={styles.threadRail} aria-label="Chat navigation">
              <button type="button" className={styles.railBtn} aria-label="Hide chat history">
                <MenuExpand size="medium" />
              </button>
              <button
                type="button"
                className={styles.railBtn}
                aria-label="New chat"
                onClick={handleNewChat}
              >
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
                  isLoading={isAssessing}
                  showReport={!isAssessing}
                  reportContent={
                    <AgentReviewDiagnosticsPane
                      onAcceptAllFixes={() => beginProcessing('batch')}
                      onFixOneByOne={() => beginProcessing('sequential')}
                    />
                  }
                />
              )}
              {step === 'catch-up' && (
                <AgentCatchUpPane
                  onApproveReturn={() => openWorkspace()}
                  resumed={resumedStep === 'catch-up'}
                />
              )}
              {step === 'processing' && (
                <AgentReviewProcessingPane
                  mode={processingMode}
                  compact={isSidebar}
                  onViewReturnSummary={() => navigate('/check-return')}
                  onGetCaughtUp={() => goToStep('catch-up')}
                  onFooterChipsChange={setFooterChips}
                  onFixesComplete={persistAgentFixes}
                  resumed={resumedStep === 'processing'}
                />
              )}
            </div>

            {showChatInput && (
              <div
                className={`${styles.pageFooter} ${footerChips ? styles.pageFooterWithChips : ''}`}
              >
                {footerChips ? <div className={styles.footerChips}>{footerChips}</div> : null}
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

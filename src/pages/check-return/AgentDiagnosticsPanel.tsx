import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircleCheckFill, Send } from '@design-systems/icons'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
import { ProgressBar } from '@ids-ts/progress-bar'
import '@ids-ts/progress-bar/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { computeLiveReturn } from '../../data/liveReturn'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import {
  buildAgentFixPlan,
  getAgentFixContext,
  type AgentFixPlanItem,
} from '../../lib/agentAutoFix'
import {
  buildHashRouteUrl,
  openReviewReturnPopout,
  openSourceDocumentReviewPopout,
  PREPARER_DATA_REVIEW_PATH,
} from '../../lib/prototypeRoutes'
import { getDiagnosticOverviewCounts } from './aiDiagnosticCategories'
import styles from '../../styles/check-return/AgentDiagnosticsPanel.module.css'

type AgentPhase = 'ready' | 'running' | 'complete'

type ThreadEntry =
  | { id: string; kind: 'agent'; text: string }
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'thinking'; issueTitle: string; steps: string[]; activeStep: number }
  | { id: string; kind: 'fixed'; title: string; summary: string }

const STEP_MS = 900
const ISSUE_GAP_MS = 400

let threadEntryCounter = 0
function nextThreadEntryId(): string {
  threadEntryCounter += 1
  return `agent-thread-${threadEntryCounter}`
}

export default function AgentDiagnosticsPanel() {
  const { amounts, reviewedFields, updateAmounts, markReviewedBulk } = useSyncedReviewState()
  const live = useMemo(() => computeLiveReturn(amounts), [amounts])
  const syncCtx = useMemo(
    () => ({ reviewedFields, live, amounts }),
    [reviewedFields, live, amounts],
  )
  const overview = useMemo(() => getDiagnosticOverviewCounts(syncCtx), [syncCtx])
  const fixPlan = useMemo(() => buildAgentFixPlan(syncCtx), [syncCtx])

  const [phase, setPhase] = useState<AgentPhase>('ready')
  const [thread, setThread] = useState<ThreadEntry[]>([])
  const [progressValue, setProgressValue] = useState(0)
  const [progressMax, setProgressMax] = useState(1)
  const [chatInput, setChatInput] = useState('')
  const runRef = useRef(false)
  const welcomeAddedRef = useRef(false)

  const remaining = overview.remaining
  const total = overview.total

  const appendThread = useCallback((entry: Omit<ThreadEntry, 'id'> & { id?: string }) => {
    const withId = { ...entry, id: entry.id ?? nextThreadEntryId() } as ThreadEntry
    setThread(prev => [...prev, withId])
  }, [])

  const applyFixForIssue = useCallback(
    (item: AgentFixPlanItem) => {
      if (Object.keys(item.amountPatch).length > 0) {
        updateAmounts(item.amountPatch)
      }
      markReviewedBulk([item.issueKey])
    },
    [updateAmounts, markReviewedBulk],
  )

  const runFixSequence = useCallback(
    async (plan: AgentFixPlanItem[]) => {
      if (runRef.current || plan.length === 0) return
      runRef.current = true
      setPhase('running')
      setProgressMax(plan.length)
      setProgressValue(0)

      appendThread({
        kind: 'agent',
        text: `I'll work through ${plan.length} item${plan.length === 1 ? '' : 's'} on this return — updating inputs and marking each diagnostic resolved.`,
      })

      for (let i = 0; i < plan.length; i++) {
        const item = plan[i]
        const thinkingId = nextThreadEntryId()
        appendThread({
          id: thinkingId,
          kind: 'thinking',
          issueTitle: item.title,
          steps: item.thinkingSteps,
          activeStep: 0,
        })

        for (let s = 0; s < item.thinkingSteps.length; s++) {
          await new Promise(r => setTimeout(r, STEP_MS))
          setThread(prev =>
            prev.map(entry =>
              entry.id === thinkingId && entry.kind === 'thinking'
                ? { ...entry, activeStep: s + 1 }
                : entry,
            ),
          )
        }

        applyFixForIssue(item)
        setProgressValue(i + 1)

        appendThread({
          kind: 'fixed',
          title: item.title,
          summary: item.fixSummary,
        })

        await new Promise(r => setTimeout(r, ISSUE_GAP_MS))
      }

      setPhase('complete')
      appendThread({
        kind: 'agent',
        text: 'All diagnostics are resolved. You can review what changed on source documents, inputs, or the 1040 below.',
      })
      runRef.current = false
    },
    [appendThread, applyFixForIssue],
  )

  const handleFixAll = useCallback(() => {
    if (fixPlan.length === 0) {
      setPhase('complete')
      appendThread({
        kind: 'agent',
        text: 'This return has no open diagnostics — you are ready to sign off.',
      })
      return
    }
    void runFixSequence(fixPlan)
  }, [fixPlan, runFixSequence, appendThread])

  const handleChatSend = useCallback(() => {
    const text = chatInput.trim()
    if (!text) return
    appendThread({ kind: 'user', text })
    setChatInput('')

    const lower = text.toLowerCase()
    if (lower.includes('fix') || lower.includes('resolve') || lower.includes('all')) {
      appendThread({
        kind: 'agent',
        text: 'Starting automated fixes now…',
      })
      void runFixSequence(buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields)))
    } else {
      appendThread({
        kind: 'agent',
        text: `I found ${remaining} open diagnostic${remaining === 1 ? '' : 's'}. Say "fix all" or use Fix all issues to let me apply corrections automatically.`,
      })
    }
  }, [chatInput, appendThread, runFixSequence, amounts, reviewedFields, remaining])

  useEffect(() => {
    // StrictMode re-runs effects with the same render closure; guard with a ref
    // so the welcome message is not appended twice on mount.
    if (welcomeAddedRef.current) return
    welcomeAddedRef.current = true
    appendThread({
      kind: 'agent',
      text: `I've reviewed Jordan's 2025 return and found ${total} item${total === 1 ? '' : 's'} that need attention. I can fix them automatically — you'll see each step as I work.`,
    })
  }, [appendThread, total])

  const showCompletion = phase === 'complete' || (total > 0 && overview.complete)

  return (
    <div className={styles.panel}>
      <div className={styles.headerArea}>
        <div className={styles.logoTitleRow}>
          <img src={intuitIntelligenceLogo} alt="" className={styles.logoIcon} />
          <h1 className={styles.pageTitle}>Smart review — Agent mode</h1>
        </div>
        <Badge
          className={styles.agentBadge}
          status="info"
          label="AI AGENT"
          capitalization="uppercase"
          priority="secondary"
        />
        <p className={styles.introText}>
          Intuit Intelligence can resolve diagnostics for you — with full visibility into
          what changed and why.
        </p>
      </div>

      {(phase === 'running' || phase === 'ready') && remaining > 0 && (
        <div className={styles.progressCard}>
          <p className={styles.progressLabel}>
            {phase === 'running' ? 'Fixing issues…' : 'Diagnostics to resolve'}
          </p>
          <ProgressBar
            value={phase === 'running' ? progressValue : overview.reviewed}
            max={phase === 'running' ? progressMax : total || 1}
            persistent={phase === 'complete'}
            automationId="agent-diagnostics-progress"
            aria-label={`${phase === 'running' ? progressValue : overview.reviewed} of ${phase === 'running' ? progressMax : total} diagnostics`}
          />
          <p className={styles.progressMeta}>
            {phase === 'running'
              ? `${progressValue} of ${progressMax} complete`
              : `${remaining} remaining · ${overview.reviewed} of ${total} reviewed`}
          </p>
        </div>
      )}

      {phase === 'ready' && remaining > 0 && (
        <div className={styles.actionsRow}>
          <Button priority="primary" onClick={handleFixAll}>
            Fix all issues
          </Button>
        </div>
      )}

      <div className={styles.thread}>
        {thread.map(entry => {
          if (entry.kind === 'user') {
            return (
              <div key={entry.id} className={styles.threadMessage}>
                <p className={styles.threadBody}>{entry.text}</p>
              </div>
            )
          }
          if (entry.kind === 'agent') {
            return (
              <div key={entry.id} className={`${styles.threadMessage} ${styles.threadMessageAgent}`}>
                <div className={styles.threadHeader}>
                  <img src={intuitIntelligenceLogo} alt="" className={styles.logoIcon} />
                  <span className={styles.wordmark}>Intuit Intelligence</span>
                </div>
                <p className={styles.threadBody}>{entry.text}</p>
              </div>
            )
          }
          if (entry.kind === 'thinking') {
            return (
              <div key={entry.id} className={`${styles.threadMessage} ${styles.threadMessageAgent}`}>
                <div className={styles.threadHeader}>
                  <img src={intuitIntelligenceLogo} alt="" className={styles.logoIcon} />
                  <span className={styles.wordmark}>Working on {entry.issueTitle}</span>
                </div>
                <ul className={styles.thinkingList}>
                  {entry.steps.map((step, si) => (
                    <li
                      key={si}
                      className={`${styles.thinkingItem} ${si < entry.activeStep ? styles.thinkingItemActive : ''}`}
                    >
                      <span className={styles.thinkingDot} aria-hidden />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )
          }
          if (entry.kind === 'fixed') {
            return (
              <div key={entry.id} className={styles.fixResult}>
                <p className={styles.fixResultTitle}>
                  <CircleCheckFill size="small" className={styles.successIcon} aria-hidden />
                  {' '}
                  Fixed: {entry.title}
                </p>
                <p className={styles.fixResultBody}>{entry.summary}</p>
              </div>
            )
          }
          return null
        })}
      </div>

      {showCompletion && (
        <div className={styles.completionCard}>
          <div className={styles.completionHeader}>
            <CircleCheckFill size="medium" className={styles.successIcon} aria-hidden />
            <h2 className={styles.completionTitle}>All issues fixed</h2>
          </div>
          <p className={styles.completionBody}>
            Every diagnostic has been resolved. Review the changes on source documents, input
            fields, or the output forms.
          </p>
          <div className={styles.reviewLinks}>
            <LinkActionButton
              size="small"
              weight="regular"
              alignment="left"
              onClick={() => openSourceDocumentReviewPopout()}
            >
              View source documents
            </LinkActionButton>
            <LinkActionButton
              size="small"
              weight="regular"
              alignment="left"
              onClick={() => {
                window.location.assign(buildHashRouteUrl(PREPARER_DATA_REVIEW_PATH))
              }}
            >
              View inputs
            </LinkActionButton>
            <LinkActionButton
              size="small"
              weight="regular"
              alignment="left"
              onClick={() => openReviewReturnPopout('1040')}
            >
              View 1040
            </LinkActionButton>
          </div>
        </div>
      )}

      {phase !== 'running' && (
        <div className={styles.chatComposer}>
          <textarea
            className={styles.chatInput}
            rows={1}
            placeholder="Ask Intuit Intelligence to fix issues…"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleChatSend()
              }
            }}
            aria-label="Message Intuit Intelligence"
          />
          <Button
            priority="secondary"
            size="small"
            onClick={handleChatSend}
            aria-label="Send message"
          >
            <Send size="small" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  )
}

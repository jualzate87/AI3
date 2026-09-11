import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  Plus,
  Send,
  StopFill,
} from '@design-systems/icons'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Link } from '@ids-ts/link'
import '@ids-ts/link/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { computeLiveReturn } from '../../data/liveReturn'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import { navigateToScheduleAInterestInput } from '../../lib/inputReturnNavigation'
import {
  buildAgentFixPlan,
  getAgentFixContext,
  type AgentFixPlanItem,
  type AgentViewLink,
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
  | {
      id: string
      kind: 'agent'
      isWelcome?: boolean
      isPlan?: boolean
      heading?: string
      text: string
      bullets?: string[]
    }
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'milestone'; text: string }
  | { id: string; kind: 'thinking'; issueTitle: string; steps: string[]; activeStep: number }
  | {
      id: string
      kind: 'fixed'
      title: string
      summary: string
      viewLinks: AgentViewLink[]
    }

const STEP_MS = 900
const ISSUE_GAP_MS = 400

let threadEntryCounter = 0
function nextThreadEntryId(): string {
  threadEntryCounter += 1
  return `agent-thread-${threadEntryCounter}`
}

function runAgentViewLink(link: AgentViewLink): void {
  if (link.schAInterest) {
    navigateToScheduleAInterestInput(link.field ?? 'mortgage1098')
    return
  }
  if (link.formId) {
    openReviewReturnPopout({
      form: link.formId,
      diagnostic: link.diagnostic,
    })
    return
  }
  if (link.tab === 'questionnaire') {
    openSourceDocumentReviewPopout({
      tab: 'questionnaire',
      field: link.field ?? link.questionnaireResponseId,
    })
    return
  }
  if (link.tab && link.field) {
    openSourceDocumentReviewPopout({
      tab: link.tab,
      field: link.field,
    })
  }
}

function AgentAvatar() {
  return (
    <img
      src={intuitIntelligenceLogo}
      alt=""
      className={styles.agentAvatar}
      aria-hidden
    />
  )
}

function ThinkingBlock({
  entry,
}: {
  entry: Extract<ThreadEntry, { kind: 'thinking' }>
}) {
  const isComplete = entry.activeStep >= entry.steps.length
  const [expanded, setExpanded] = useState(!isComplete)

  useEffect(() => {
    if (isComplete) setExpanded(false)
  }, [isComplete])

  return (
    <div className={styles.generationBlock}>
      <button
        type="button"
        className={styles.generationHeader}
        onClick={() => setExpanded(open => !open)}
        aria-expanded={expanded}
      >
        <img
          src={intuitIntelligenceLogo}
          alt=""
          className={styles.generationIcon}
          aria-hidden
        />
        <span className={styles.generationTitle}>Response generation</span>
        <span className={styles.generationSubtitle}>{entry.issueTitle}</span>
        <span className={styles.generationChevron} aria-hidden>
          {expanded ? <ChevronUp size="small" /> : <ChevronDown size="small" />}
        </span>
      </button>
      {expanded && (
        <ol className={styles.stepper} aria-label={`Steps for ${entry.issueTitle}`}>
          {entry.steps.map((step, si) => {
            const isActive = si === entry.activeStep && !isComplete
            const isDone = si < entry.activeStep || isComplete
            return (
              <li
                key={si}
                className={`${styles.stepperItem} ${isDone ? styles.stepperItemDone : ''} ${isActive ? styles.stepperItemActive : ''}`}
              >
                <span className={styles.stepperRail} aria-hidden>
                  <span className={styles.stepperDot} />
                  {si < entry.steps.length - 1 && <span className={styles.stepperLine} />}
                </span>
                <div className={styles.stepperContent}>
                  <p className={styles.stepperTitle}>{step}</p>
                  {(isActive || isDone) && (
                    <p className={styles.stepperBody}>
                      {isDone
                        ? 'Complete'
                        : 'Analyzing return data and source documents…'}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function ProgressRail({
  plan,
  completedCount,
  activeIndex,
  phase,
}: {
  plan: AgentFixPlanItem[]
  completedCount: number
  activeIndex: number
  phase: AgentPhase
}) {
  if (plan.length === 0) return null

  return (
    <aside className={styles.progressRail} aria-label="Fix progress">
      <div className={styles.progressCard}>
        <div className={styles.progressCardHeader}>
          <span className={styles.progressLabel}>Progress</span>
          <span className={styles.progressCount}>
            {phase === 'complete' ? plan.length : completedCount}/{plan.length}
          </span>
        </div>
        <ol className={styles.progressTimeline}>
          {plan.map((item, index) => {
            const isDone = index < completedCount || phase === 'complete'
            const isActive = phase === 'running' && index === activeIndex
            return (
              <li
                key={item.issueKey}
                className={`${styles.progressStep} ${isDone ? styles.progressStepDone : ''} ${isActive ? styles.progressStepActive : ''}`}
              >
                <span className={styles.progressStepMarker} aria-hidden>
                  {isDone ? <CircleCheck size="small" /> : null}
                </span>
                <div className={styles.progressStepBody}>
                  <p className={styles.progressStepTitle}>{item.title}</p>
                  {isActive && (
                    <p className={styles.progressStepMeta}>Fixing now…</p>
                  )}
                  {isDone && !isActive && (
                    <p className={styles.progressStepMeta}>Fixed</p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <button
        type="button"
        className={styles.readinessCard}
        onClick={() => openSourceDocumentReviewPopout()}
      >
        <span className={styles.readinessLabel}>Document readiness</span>
        <span className={styles.readinessValue}>
          {phase === 'complete' ? '100%' : `${Math.round((completedCount / plan.length) * 100)}%`}
          <ChevronRight size="small" aria-hidden />
        </span>
      </button>
    </aside>
  )
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
  const [activeFixIndex, setActiveFixIndex] = useState(-1)
  const [chatInput, setChatInput] = useState('')
  const runRef = useRef(false)
  const welcomeAddedRef = useRef(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const remaining = overview.remaining
  const total = overview.total

  const scrollToBottom = useCallback(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [thread, scrollToBottom])

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
      setProgressValue(0)
      setActiveFixIndex(0)

      appendThread({
        kind: 'milestone',
        text: 'Automated fix started',
      })

      appendThread({
        kind: 'agent',
        isPlan: true,
        heading: 'Fix plan',
        text: `I'll work through ${plan.length} item${plan.length === 1 ? '' : 's'} on this return.`,
        bullets: plan.map(p => p.title),
      })

      for (let i = 0; i < plan.length; i++) {
        const item = plan[i]
        setActiveFixIndex(i)
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
          kind: 'milestone',
          text: `Fixed: ${item.title}`,
        })

        appendThread({
          kind: 'fixed',
          title: item.title,
          summary: item.fixSummary,
          viewLinks: item.viewLinks,
        })

        await new Promise(r => setTimeout(r, ISSUE_GAP_MS))
      }

      setActiveFixIndex(-1)
      setPhase('complete')
      appendThread({
        kind: 'milestone',
        text: 'All diagnostics resolved',
      })
      appendThread({
        kind: 'agent',
        heading: 'Review complete',
        text: 'Every open item has been corrected. Use the links below to inspect what changed on source documents, inputs, or the 1040.',
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
        heading: 'No open diagnostics',
        text: 'This return has no open diagnostics — you are ready to sign off.',
      })
      return
    }
    appendThread({ kind: 'user', text: 'Fix all issues' })
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
    } else if (lower.includes('pending') || lower.includes('open')) {
      appendThread({
        kind: 'agent',
        isPlan: true,
        heading: 'Open diagnostics',
        text: `${remaining} item${remaining === 1 ? '' : 's'} still need attention on this return.`,
        bullets: fixPlan.map(p => p.title),
      })
    } else {
      appendThread({
        kind: 'agent',
        text: `I found ${remaining} open diagnostic${remaining === 1 ? '' : 's'}. Say "fix all" or use the quick actions below.`,
      })
    }
  }, [chatInput, appendThread, runFixSequence, amounts, reviewedFields, remaining, fixPlan])

  useEffect(() => {
    if (welcomeAddedRef.current) return
    welcomeAddedRef.current = true
    appendThread({
      kind: 'agent',
      isWelcome: true,
      heading: 'Return review by Intuit Intelligence',
      text: `I've reviewed Jordan's 2025 return and found ${total} item${total === 1 ? '' : 's'} that need attention.`,
      bullets: [
        'I can fix them automatically with full visibility into each step',
        'You will see response generation progress as I work',
      ],
    })
  }, [appendThread, total])

  const showCompletion = phase === 'complete' || (total > 0 && overview.complete)

  return (
    <div className={styles.panel}>
      <div className={styles.workspace}>
        <div className={styles.mainColumn}>
          <div className={styles.chatScroll} ref={chatScrollRef}>
            <div className={styles.thread}>
              {thread.map(entry => {
                if (entry.kind === 'user') {
                  return (
                    <div key={entry.id} className={styles.userRow}>
                      <div className={styles.userBubble}>{entry.text}</div>
                    </div>
                  )
                }
                if (entry.kind === 'milestone') {
                  return (
                    <div key={entry.id} className={styles.milestoneRow} role="separator">
                      <span className={styles.milestoneLine} aria-hidden />
                      <span className={styles.milestonePill}>{entry.text}</span>
                      <span className={styles.milestoneLine} aria-hidden />
                    </div>
                  )
                }
                if (entry.kind === 'agent') {
                  return (
                    <div key={entry.id} className={styles.agentRow}>
                      <AgentAvatar />
                      <div className={styles.agentContent}>
                        {entry.isWelcome ? (
                          <h1 className={styles.welcomeTitle}>{entry.heading}</h1>
                        ) : (
                          entry.heading && (
                            <h2 className={styles.agentHeading}>{entry.heading}</h2>
                          )
                        )}
                        <p className={styles.agentBody}>{entry.text}</p>
                        {entry.isPlan && entry.bullets && entry.bullets.length > 0 && (
                          <div className={styles.interactiveCard}>
                            <p className={styles.cardEyebrow}>Items to fix</p>
                            <ul className={styles.cardChecklist}>
                              {entry.bullets.map((bullet, bi) => (
                                <li key={bi}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {!entry.isPlan && entry.bullets && entry.bullets.length > 0 && (
                          <ul className={styles.agentList}>
                            {entry.bullets.map((bullet, bi) => (
                              <li key={bi}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                        {entry.isWelcome && remaining > 0 && phase === 'ready' && (
                          <div className={styles.inlineActions}>
                            <Button priority="primary" onClick={handleFixAll}>
                              Fix all issues
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
                if (entry.kind === 'thinking') {
                  return (
                    <div key={entry.id} className={styles.agentRow}>
                      <AgentAvatar />
                      <div className={styles.agentContentWide}>
                        <ThinkingBlock entry={entry} />
                      </div>
                    </div>
                  )
                }
                if (entry.kind === 'fixed') {
                  return (
                    <div key={entry.id} className={styles.agentRow}>
                      <AgentAvatar />
                      <div className={styles.agentContentWide}>
                        <div className={styles.interactiveCard}>
                          <div className={styles.fixedHeader}>
                            <Badge
                              status="success"
                              label="Fixed"
                              capitalization="sentence"
                              priority="secondary"
                            />
                            <h3 className={styles.fixedTitle}>{entry.title}</h3>
                          </div>
                          <p className={styles.cardBody}>{entry.summary}</p>
                          {entry.viewLinks.length > 0 && (
                            <div className={styles.cardActions}>
                              {entry.viewLinks.map(link => (
                                <Button
                                  key={link.label}
                                  priority="secondary"
                                  size="medium"
                                  onClick={() => runAgentViewLink(link)}
                                >
                                  {link.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })}
            </div>

            {showCompletion && (
              <div className={styles.completionCard}>
                <div className={styles.completionHeader}>
                  <Badge
                    status="success"
                    label="Complete"
                    capitalization="sentence"
                    priority="secondary"
                  />
                  <h2 className={styles.completionTitle}>All issues fixed</h2>
                </div>
                <p className={styles.completionBody}>
                  Every diagnostic has been resolved. Review the changes on source documents,
                  input fields, or the output forms.
                </p>
                <div className={styles.cardActions}>
                  <Button
                    priority="secondary"
                    size="medium"
                    onClick={() => openSourceDocumentReviewPopout()}
                  >
                    View source documents
                  </Button>
                  <Button
                    priority="secondary"
                    size="medium"
                    onClick={() => {
                      window.location.assign(buildHashRouteUrl(PREPARER_DATA_REVIEW_PATH))
                    }}
                  >
                    View inputs
                  </Button>
                  <Button
                    priority="secondary"
                    size="medium"
                    onClick={() => openReviewReturnPopout('1040')}
                  >
                    View 1040
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.composerArea}>
            <div className={styles.composerFade} aria-hidden />
            <div className={styles.quickActions} role="toolbar" aria-label="Quick actions">
              {phase !== 'running' && remaining > 0 && (
                <button type="button" className={styles.quickChip} onClick={handleFixAll}>
                  Fix all issues
                </button>
              )}
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => {
                  appendThread({ kind: 'user', text: "What's pending?" })
                  appendThread({
                    kind: 'agent',
                    isPlan: true,
                    heading: 'Open diagnostics',
                    text: `${remaining} item${remaining === 1 ? '' : 's'} still need attention.`,
                    bullets: fixPlan.map(p => p.title),
                  })
                }}
              >
                What&apos;s pending?
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => openSourceDocumentReviewPopout()}
              >
                View source documents
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => openReviewReturnPopout('1040')}
              >
                View 1040
              </button>
            </div>
            <div className={styles.composerBox}>
              <textarea
                className={styles.composerInput}
                rows={1}
                placeholder="Ask or attach anything"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (phase !== 'running') handleChatSend()
                  }
                }}
                aria-label="Ask Intuit Intelligence"
                disabled={phase === 'running'}
              />
              <div className={styles.composerActions}>
                <button type="button" className={styles.attachBtn} aria-label="Attach">
                  <Plus size="medium" />
                </button>
                {phase === 'running' ? (
                  <button
                    type="button"
                    className={`${styles.sendBtn} ${styles.sendBtnActive}`}
                    aria-label="Stop generation"
                    disabled
                  >
                    <StopFill size="medium" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.sendBtn} ${chatInput.trim() ? styles.sendBtnActive : ''}`}
                    aria-label="Send message"
                    disabled={!chatInput.trim()}
                    onClick={handleChatSend}
                  >
                    <Send size="medium" />
                  </button>
                )}
              </div>
            </div>
            <Link
              href="#"
              size="body-4"
              inline
              onClick={e => e.preventDefault()}
              className={styles.legalLink}
            >
              Important information about how we use generative AI
            </Link>
          </div>
        </div>

        <ProgressRail
          plan={fixPlan}
          completedCount={progressValue}
          activeIndex={activeFixIndex}
          phase={phase}
        />
      </div>
    </div>
  )
}

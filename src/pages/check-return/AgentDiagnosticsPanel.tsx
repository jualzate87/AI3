import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  Plus,
  Send,
  StopFill,
  Upload,
} from '@design-systems/icons'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Link } from '@ids-ts/link'
import '@ids-ts/link/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
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
import styles from '../../styles/check-return/AgentDiagnosticsPanel.module.css'

type AgentPhase = 'ready' | 'running' | 'complete' | 'awaiting-next'

type ThreadEntry =
  | {
      id: string
      kind: 'agent'
      isWelcome?: boolean
      showNextActions?: boolean
      remainingCount?: number
      heading?: string
      text: string
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
  if (link.inputScreens) {
    window.location.assign(buildHashRouteUrl(PREPARER_DATA_REVIEW_PATH))
    return
  }
  if (link.schAInterest) {
    navigateToScheduleAInterestInput(link.field ?? 'mortgage1098')
    return
  }
  if (link.formId) {
    openReviewReturnPopout({ form: link.formId, diagnostic: link.diagnostic })
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
    openSourceDocumentReviewPopout({ tab: link.tab, field: link.field })
  }
}

function AgentAvatar() {
  return (
    <img src={intuitIntelligenceLogo} alt="" className={styles.agentAvatar} aria-hidden />
  )
}

/** Single card listing open diagnostics — the initial diagnosis state. */
function DiagnosisCard({
  plan,
  phase,
  onFixItem,
  onFixAll,
}: {
  plan: AgentFixPlanItem[]
  phase: AgentPhase
  onFixItem: (item: AgentFixPlanItem) => void
  onFixAll: () => void
}) {
  const canFix = phase === 'ready' || phase === 'awaiting-next'

  if (plan.length === 0) {
    return (
      <div className={styles.diagnosisCard}>
        <Badge status="success" label="Clear" capitalization="sentence" priority="secondary" />
        <p className={styles.diagnosisEmpty}>
          No open diagnostics on this return — you are ready to sign off.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.diagnosisCard}>
      <div className={styles.diagnosisHeader}>
        <p className={styles.cardEyebrow}>Diagnostics found</p>
        <span className={styles.diagnosisCount}>
          {plan.length} open
        </span>
      </div>
      <ul className={styles.diagnosisList}>
        {plan.map(item => (
          <li key={item.issueKey} className={styles.diagnosisItem}>
            <div className={styles.diagnosisItemMain}>
              <Badge
                status="warning"
                label="Needs fix"
                capitalization="sentence"
                priority="secondary"
              />
              <div className={styles.diagnosisItemText}>
                <p className={styles.diagnosisItemTitle}>{item.title}</p>
                <p className={styles.diagnosisItemSummary}>{item.fixSummary}</p>
              </div>
            </div>
            <div className={styles.diagnosisItemActions}>
              {item.viewLinks[0] && (
                <LinkActionButton
                  size="small"
                  weight="regular"
                  alignment="left"
                  onClick={() => runAgentViewLink(item.viewLinks[0])}
                >
                  {item.viewLinks[0].label}
                </LinkActionButton>
              )}
              {canFix && (
                <Button priority="secondary" size="medium" onClick={() => onFixItem(item)}>
                  Fix this
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {canFix && plan.length > 1 && (
        <div className={styles.diagnosisFooter}>
          <Button priority="primary" onClick={onFixAll}>
            Fix all {plan.length} issues
          </Button>
        </div>
      )}
    </div>
  )
}

function ThinkingBlock({
  entry,
}: {
  entry: Extract<ThreadEntry, { kind: 'thinking' }>
}) {
  const isComplete = entry.activeStep >= entry.steps.length
  const doneCount = isComplete ? entry.steps.length : entry.activeStep
  const [expanded, setExpanded] = useState(true)

  return (
    <div
      className={`${styles.generationBlock} ${isComplete ? styles.generationBlockDone : ''}`}
    >
      <button
        type="button"
        className={styles.generationHeader}
        onClick={() => setExpanded(open => !open)}
        aria-expanded={expanded}
      >
        <img src={intuitIntelligenceLogo} alt="" className={styles.generationIcon} aria-hidden />
        <span className={styles.generationTitle}>
          {isComplete ? 'Reasoning complete' : 'Reasoning in progress'}
        </span>
        <span className={styles.generationSubtitle}>
          {entry.issueTitle} · {doneCount}/{entry.steps.length} steps
        </span>
        <span className={styles.generationChevron} aria-hidden>
          {expanded ? <ChevronUp size="small" /> : <ChevronDown size="small" />}
        </span>
      </button>
      {expanded && (
        <ol className={styles.stepper} aria-label={`Reasoning for ${entry.issueTitle}`}>
          {entry.steps.map((step, si) => {
            const isActive = si === entry.activeStep && !isComplete
            const isDone = si < entry.activeStep || isComplete
            return (
              <li
                key={si}
                className={`${styles.stepperItem} ${isDone ? styles.stepperItemDone : ''} ${isActive ? styles.stepperItemActive : ''}`}
              >
                <span className={styles.stepperRail} aria-hidden>
                  {isDone ? (
                    <CircleCheck size="small" color="var(--color-action-standard)" />
                  ) : (
                    <span className={styles.stepperDot} />
                  )}
                  {si < entry.steps.length - 1 && <span className={styles.stepperLine} />}
                </span>
                <div className={styles.stepperContent}>
                  <p className={styles.stepperTitle}>{step}</p>
                  {(isActive || isDone) && (
                    <p className={styles.stepperBody}>
                      {isDone ? 'Complete' : 'Analyzing return data and source documents…'}
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
  if (plan.length === 0 && phase !== 'complete') return null

  const total = plan.length || completedCount
  const readinessPct =
    phase === 'complete' || total === 0
      ? 100
      : Math.round((completedCount / total) * 100)

  return (
    <aside className={styles.progressRail} aria-label="Fix progress">
      <div className={styles.progressCard}>
        <div className={styles.progressCardHeader}>
          <span className={styles.progressLabel}>Progress</span>
          <span className={styles.progressCount}>
            {phase === 'complete' ? total : completedCount}/{total || 1}
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
                  {isActive && <p className={styles.progressStepMeta}>Reasoning…</p>}
                  {isDone && !isActive && <p className={styles.progressStepMeta}>Fixed</p>}
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
          {readinessPct}%
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
  const fixPlan = useMemo(() => buildAgentFixPlan(syncCtx), [syncCtx])

  const [phase, setPhase] = useState<AgentPhase>('ready')
  const [thread, setThread] = useState<ThreadEntry[]>([])
  const [progressValue, setProgressValue] = useState(0)
  const [sessionPlan, setSessionPlan] = useState<AgentFixPlanItem[]>([])
  const [activeFixIndex, setActiveFixIndex] = useState(-1)
  const [chatInput, setChatInput] = useState('')
  const runRef = useRef(false)
  const welcomeAddedRef = useRef(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const openCount = fixPlan.length

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

  const runFixForItems = useCallback(
    async (
      items: AgentFixPlanItem[],
      opts?: { single?: boolean; progressOffset?: number },
    ) => {
      if (runRef.current || items.length === 0) return
      runRef.current = true
      setPhase('running')
      setSessionPlan(items)

      const openBefore = buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields)).length
      const progressStart = opts?.progressOffset ?? 0

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        setActiveFixIndex(i)

        appendThread({
          kind: 'agent',
          heading: opts?.single ? 'Working on this issue' : `Issue ${i + 1} of ${items.length}`,
          text: `Reviewing source documents and return inputs before applying a fix.`,
        })

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
        setProgressValue(progressStart + i + 1)

        appendThread({ kind: 'milestone', text: `Fixed: ${item.title}` })
        appendThread({
          kind: 'fixed',
          title: item.title,
          summary: item.fixSummary,
          viewLinks: item.viewLinks,
        })

        await new Promise(r => setTimeout(r, ISSUE_GAP_MS))
      }

      setActiveFixIndex(-1)
      runRef.current = false

      const remainingAfter = Math.max(0, openBefore - items.length)

      if (opts?.single && remainingAfter > 0) {
        setPhase('awaiting-next')
        appendThread({
          kind: 'agent',
          showNextActions: true,
          remainingCount: remainingAfter,
          text: `${remainingAfter} issue${remainingAfter === 1 ? '' : 's'} still open. Review the reasoning above, then continue.`,
        })
        return
      }

      setPhase('complete')
      appendThread({ kind: 'milestone', text: 'All diagnostics resolved' })
      appendThread({
        kind: 'agent',
        heading: 'Review complete',
        text: 'Every open item has been corrected. Expand any reasoning block above to see how each fix was derived.',
      })
    },
    [appendThread, applyFixForIssue, amounts, reviewedFields],
  )

  const handleFixAll = useCallback(() => {
    const plan = buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields))
    if (plan.length === 0) return
    appendThread({ kind: 'user', text: 'Fix all issues' })
    setProgressValue(0)
    void runFixForItems(plan)
  }, [amounts, reviewedFields, runFixForItems, appendThread])

  const handleFixOne = useCallback(
    (item?: AgentFixPlanItem) => {
      const plan = buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields))
      const target = item ?? plan[0]
      if (!target) return
      appendThread({ kind: 'user', text: `Fix: ${target.title}` })
      void runFixForItems([target], { single: true, progressOffset: progressValue })
    },
    [amounts, reviewedFields, runFixForItems, appendThread, progressValue],
  )

  const handleFixNext = useCallback(() => {
    const plan = buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields))
    if (plan.length === 0) return
    appendThread({ kind: 'user', text: 'Fix next issue' })
    void runFixForItems([plan[0]], { single: true, progressOffset: progressValue })
  }, [amounts, reviewedFields, runFixForItems, appendThread, progressValue])

  const handleChatSend = useCallback(() => {
    const text = chatInput.trim()
    if (!text) return
    appendThread({ kind: 'user', text })
    setChatInput('')

    const lower = text.toLowerCase()
    if (lower.includes('next')) {
      handleFixNext()
    } else if (lower.includes('all')) {
      handleFixAll()
    } else if (lower.includes('one') || lower.includes('single')) {
      handleFixOne()
    } else if (lower.includes('fix') || lower.includes('resolve')) {
      handleFixAll()
    } else {
      appendThread({
        kind: 'agent',
        text: `You have ${openCount} open diagnostic${openCount === 1 ? '' : 's'}. Use Fix all or Fix one at a time above, or say "fix all".`,
      })
    }
  }, [chatInput, appendThread, openCount, handleFixNext, handleFixAll, handleFixOne])

  useEffect(() => {
    if (welcomeAddedRef.current) return
    welcomeAddedRef.current = true
    appendThread({
      kind: 'agent',
      isWelcome: true,
      heading: 'Return review',
      text:
        openCount > 0
          ? `I've analyzed Jordan's 2025 return and found ${openCount} issue${openCount === 1 ? '' : 's'} to resolve. Review each diagnostic below, then tell me how you'd like to proceed.`
          : `I've analyzed Jordan's 2025 return — no open diagnostics remain.`,
    })
  }, [appendThread, openCount])

  const railPlan = sessionPlan.length > 0 ? sessionPlan : fixPlan
  const showCompletion = phase === 'complete'

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
                      <div className={styles.messageColumn}>
                        {entry.isWelcome && (
                          <header className={styles.welcomeHeader}>
                            <div className={styles.logoGroup}>
                              <img
                                src={intuitIntelligenceLogo}
                                alt=""
                                className={styles.brandLogo}
                                aria-hidden
                              />
                              <span className={styles.wordmark}>Intuit Intelligence</span>
                            </div>
                            <span className={styles.brandMeta}>Analyzed just now</span>
                          </header>
                        )}
                        {entry.heading && (
                          <h2
                            className={
                              entry.isWelcome ? styles.welcomeTitle : styles.agentHeading
                            }
                          >
                            {entry.heading}
                          </h2>
                        )}
                        <p className={styles.agentBody}>{entry.text}</p>

                        {entry.isWelcome && (
                          <>
                            <DiagnosisCard
                              plan={fixPlan}
                              phase={phase}
                              onFixItem={handleFixOne}
                              onFixAll={handleFixAll}
                            />
                            {openCount > 0 && phase === 'ready' && (
                              <div className={styles.responsePills}>
                                <Button priority="primary" onClick={handleFixAll}>
                                  Fix all issues
                                </Button>
                                <Button priority="secondary" onClick={() => handleFixOne()}>
                                  Fix one at a time
                                </Button>
                              </div>
                            )}
                          </>
                        )}

                        {entry.showNextActions && entry.remainingCount != null && (
                          <div className={styles.responsePills}>
                            <Button priority="primary" onClick={handleFixNext}>
                              Fix next issue
                            </Button>
                            <Button priority="secondary" onClick={handleFixAll}>
                              Fix all remaining ({entry.remainingCount})
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
                      <div className={styles.messageColumn}>
                        <ThinkingBlock entry={entry} />
                      </div>
                    </div>
                  )
                }
                if (entry.kind === 'fixed') {
                  return (
                    <div key={entry.id} className={styles.agentRow}>
                      <AgentAvatar />
                      <div className={styles.messageColumn}>
                        <div className={styles.fixedCard}>
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
                            <div className={styles.viewLinkRow}>
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

              {showCompletion && (
                <div className={styles.completionCard}>
                  <Badge
                    status="success"
                    label="Complete"
                    capitalization="sentence"
                    priority="secondary"
                  />
                  <h2 className={styles.completionTitle}>All issues fixed</h2>
                  <p className={styles.completionBody}>
                    Review source documents or the 1040 to verify changes.
                  </p>
                  <div className={styles.responsePills}>
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
                      onClick={() => openReviewReturnPopout('1040')}
                    >
                      View 1040
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.composerArea}>
            <div className={styles.composerInner}>
              <div className={styles.quickActions} role="toolbar" aria-label="Quick actions">
                {phase === 'awaiting-next' && openCount > 0 && (
                  <button type="button" className={styles.quickChip} onClick={handleFixNext}>
                    Fix next issue
                  </button>
                )}
                {(phase === 'ready' || phase === 'awaiting-next') && openCount > 0 && (
                  <>
                    <button type="button" className={styles.quickChip} onClick={handleFixAll}>
                      Fix all issues
                    </button>
                    <button
                      type="button"
                      className={styles.quickChip}
                      onClick={() => handleFixOne()}
                    >
                      Fix one at a time
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className={styles.quickChip}
                  onClick={() => openSourceDocumentReviewPopout()}
                >
                  <Upload size="small" aria-hidden />
                  View source documents
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
        </div>

        <ProgressRail
          plan={railPlan}
          completedCount={progressValue}
          activeIndex={activeFixIndex}
          phase={phase}
        />
      </div>
    </div>
  )
}

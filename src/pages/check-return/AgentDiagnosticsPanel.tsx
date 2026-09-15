import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ChevronDown,
  ChevronUp,
  NewWindow,
  Plus,
  Send,
  StopFill,
} from '@design-systems/icons'
import { Badge, SuccessBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Link } from '@ids-ts/link'
import '@ids-ts/link/dist/main.css'
import AgentSparkleIcon from '../../components/AgentSparkleIcon/AgentSparkleIcon'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { computeLiveReturn } from '../../data/liveReturn'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import {
  buildAgentFixPlan,
  buildBatchThinkingSteps,
  getAgentFixContext,
  openAgentViewLinkInWindow,
  type AgentFixPlanItem,
  type AgentThinkingStep,
  type AgentViewLink,
} from '../../lib/agentAutoFix'
import {
  buildAgentReviewModels,
  buildPersistentReviewCallouts,
} from '../../lib/agentDiagnosisReview'
import { getCategoryScopedActiveKeys } from './aiDiagnosticCategories'
import { buildAllDiagnosticIssues } from '../data-review/AgentReportPane'
import { openReviewReturnPopout } from '../../lib/prototypeRoutes'
import AgentDiagnosticExpandableCard from './AgentDiagnosticExpandableCard'
import styles from '../../styles/check-return/AgentDiagnosticsPanel.module.css'

type AgentPhase = 'ready' | 'running' | 'complete' | 'awaiting-next'

type FixedItemSummary = {
  outcomeLabel: string
  viewLinks: AgentViewLink[]
}

const SOURCE_DOCUMENTS_VIEW_LINK: AgentViewLink = {
  label: 'Source documents',
  tab: 'w2s',
  field: 'wages',
}

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
  | { id: string; kind: 'user'; text: string; asChip?: boolean }
  | { id: string; kind: 'milestone'; text: string; variant?: 'default' | 'fixes-started' }
  | { id: string; kind: 'thinking'; issueTitle: string; steps: AgentThinkingStep[]; activeStep: number }
  | {
      id: string
      kind: 'fixed'
      outcomeLabel: string
      summary: string
      viewLinks: AgentViewLink[]
    }
  | {
      id: string
      kind: 'complete-summary'
      introText: string
      fixedItems: FixedItemSummary[]
      totalCount: number
    }

const AGENT_VISIT_SESSION_KEY = 'protoc3-agent-visit-active'

const STEP_MS = 900
const BATCH_STEP_MS = 1300
const ISSUE_GAP_MS = 400

let threadEntryCounter = 0
function nextThreadEntryId(): string {
  threadEntryCounter += 1
  return `agent-thread-${threadEntryCounter}`
}

/** Sparkle avatar — secondary agent attribution (Figma "Intuit AI Sparkle"). */
function SparkleAvatar() {
  return (
    <span className={styles.sparkleAvatar} aria-hidden>
      <AgentSparkleIcon size="inline" />
    </span>
  )
}

/** Row with sparkle avatar for follow-up / completed agent messages. */
function AgentSparkleRow({ children }: { children: ReactNode }) {
  return (
    <div className={styles.sparkleRow}>
      <SparkleAvatar />
      <div className={styles.messageColumn}>{children}</div>
    </div>
  )
}

function ActionChip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className={`${styles.actionChip} ${active ? styles.actionChipActive : ''}`}
      onClick={onClick}
      disabled={!onClick}
    >
      {children}
    </button>
  )
}

function SourceLinkChip({ link }: { link: AgentViewLink }) {
  return (
    <button
      type="button"
      className={styles.sourceLinkChip}
      onClick={() => openAgentViewLinkInWindow(link)}
      aria-label={`${link.label} (opens in a new window)`}
    >
      {link.label}
      <NewWindow size="small" className={styles.sourceLinkChipIcon} aria-hidden />
    </button>
  )
}

function FixProgressSummaryCard({
  fixedItems,
  totalCount,
}: {
  fixedItems: FixedItemSummary[]
  totalCount: number
}) {
  const doneCount = fixedItems.length
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100

  return (
    <div className={styles.fixProgressCard}>
      <div className={styles.fixProgressHeader}>
        <span className={styles.fixProgressTitle}>Fixes progress</span>
        <span className={styles.fixProgressCount}>
          {doneCount} of {totalCount} fixed
        </span>
      </div>
      <div className={styles.fixProgressTrack} aria-hidden>
        <div className={styles.fixProgressFill} style={{ width: `${pct}%` }} />
      </div>
      <ul className={styles.fixProgressList}>
        {fixedItems.map(item => (
          <li key={item.outcomeLabel} className={styles.fixProgressItem}>
            <div className={styles.fixProgressItemHeader}>
              <span className={styles.fixProgressItemLabel}>{item.outcomeLabel}</span>
              <Badge status="success" label="Fixed" shape="round" aria-label="Fixed">
                <SuccessBadgeIcon />
              </Badge>
            </div>
            {item.viewLinks.length > 0 && (
              <div className={styles.sourceLinkRow}>
                {item.viewLinks.map(link => (
                  <SourceLinkChip key={link.label} link={link} />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ReminderCard() {
  return (
    <div className={styles.reminderCard}>
      <div className={styles.reminderHeader}>
        <AgentSparkleIcon size="inline" className={styles.reminderIcon} />
        <span className={styles.reminderTitle}>Reminder</span>
      </div>
      <p className={styles.reminderBody}>
        Before we finalize, please confirm the{' '}
        <strong>estimated Form 1098 mortgage interest</strong> amount with the client and upload the
        actual form when available.
      </p>
    </div>
  )
}

/** Verified + needs-review callouts — persist after fixes; independent expand from issue accordion. */
function PreparerReviewCallouts({
  syncCtx,
  collapseCards = false,
  ariaLabel = 'Preparer review callouts',
}: {
  syncCtx: ReturnType<typeof getAgentFixContext>
  collapseCards?: boolean
  ariaLabel?: string
}) {
  const callouts = useMemo(() => buildPersistentReviewCallouts(syncCtx), [syncCtx])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (collapseCards) setExpandedIds(new Set())
  }, [collapseCards])

  const handleToggle = (cardId: string, nextExpanded: boolean) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (nextExpanded) next.add(cardId)
      else next.delete(cardId)
      return next
    })
  }

  return (
    <div className={styles.preparerCalloutStack} role="list" aria-label={ariaLabel}>
      {callouts.map(card => (
        <AgentDiagnosticExpandableCard
          key={card.id}
          card={card}
          expanded={!collapseCards && expandedIds.has(card.id)}
          onExpandedChange={next => handleToggle(card.id, next)}
        />
      ))}
    </div>
  )
}

function InitialDiagnosisFeed({
  syncCtx,
  phase,
  fixPlan,
  collapseCards,
  onFixIssueKey,
}: {
  syncCtx: ReturnType<typeof getAgentFixContext>
  phase: AgentPhase
  fixPlan: AgentFixPlanItem[]
  collapseCards: boolean
  onFixIssueKey: (issueKey: AgentFixPlanItem['issueKey']) => void
}) {
  const canFixActions = phase === 'ready' || phase === 'awaiting-next'
  const fixableKeys = useMemo(() => new Set(fixPlan.map(item => item.issueKey)), [fixPlan])
  const activeIssueKeys = useMemo(() => getCategoryScopedActiveKeys(syncCtx), [syncCtx])
  const reviewCards = useMemo(() => {
    const issues = buildAllDiagnosticIssues(syncCtx.live, syncCtx.amounts)
    return buildAgentReviewModels(syncCtx, issues, { forDisplay: true })
  }, [syncCtx])
  const issueCards = useMemo(
    () => reviewCards.filter(card => card.variant === 'issue'),
    [reviewCards],
  )

  const defaultExpandedId = useMemo(() => {
    const firstIssue = issueCards[0]
    return firstIssue?.id ?? null
  }, [issueCards])

  const [expandedCardId, setExpandedCardId] = useState<string | null>(defaultExpandedId)

  useEffect(() => {
    if (collapseCards) {
      setExpandedCardId(null)
      return
    }
    setExpandedCardId(prev => {
      if (prev && issueCards.some(c => c.id === prev)) return prev
      return defaultExpandedId
    })
  }, [collapseCards, defaultExpandedId, issueCards])

  const allIssuesResolved =
    phase === 'complete' &&
    activeIssueKeys.length === 0 &&
    fixPlan.length === 0

  const handleToggle = (cardId: string, nextExpanded: boolean) => {
    setExpandedCardId(nextExpanded ? cardId : null)
  }

  return (
    <div className={styles.diagnosisFeed}>
      <div className={styles.diagnosticsFoundRow}>
        <SparkleAvatar />
        <span className={styles.diagnosticsFoundLabel}>
          {allIssuesResolved ? 'Diagnostics resolved' : 'Diagnostics found'}
        </span>
      </div>
      {allIssuesResolved && (
        <div className={styles.diagnosisClearNote}>
          <Badge status="success" capitalization="sentence" priority="secondary">
            Clear
          </Badge>
          <p className={styles.diagnosisEmpty}>
            No open diagnostics on this return. Review verified checks and your checklist below
            before sign-off.
          </p>
        </div>
      )}
      {issueCards.length > 0 && (
        <div className={styles.diagnosisCardStack} role="list" aria-label="Diagnostic accordion">
          {issueCards.map(card => (
            <AgentDiagnosticExpandableCard
              key={card.id}
              card={card}
              expanded={!collapseCards && expandedCardId === card.id}
              onExpandedChange={next => handleToggle(card.id, next)}
              canFix={
                canFixActions &&
                !!card.issueKey &&
                fixableKeys.has(card.issueKey)
              }
              onFix={onFixIssueKey}
            />
          ))}
        </div>
      )}
      <PreparerReviewCallouts syncCtx={syncCtx} collapseCards={collapseCards} />
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
  const [expanded, setExpanded] = useState(!isComplete)

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
        {!isComplete && (
          <img src={intuitIntelligenceLogo} alt="" className={styles.generationIcon} aria-hidden />
        )}
        {isComplete && expanded && (
          <AgentSparkleIcon size="inline" className={styles.generationSparkle} />
        )}
        <span
          className={`${styles.generationTitle} ${isComplete && !expanded ? styles.generationTitleMuted : ''}`}
        >
          {isComplete && !expanded ? 'Show thinking' : 'Response generation'}
        </span>
        {(expanded || !isComplete) && (
          <span className={styles.generationSubtitle}>
            {entry.issueTitle} · Step {Math.min(doneCount, entry.steps.length)} of{' '}
            {entry.steps.length}
          </span>
        )}
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
                    <AgentSparkleIcon size="inline" className={styles.stepperSparkle} />
                  ) : (
                    <span className={styles.stepperDot} />
                  )}
                  {si < entry.steps.length - 1 && <span className={styles.stepperLine} />}
                </span>
                <div className={styles.stepperContent}>
                  <p className={styles.stepperTitle}>{step.title}</p>
                  {(isActive || isDone) && step.description && (
                    <p className={styles.stepperBody}>{step.description}</p>
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

export default function AgentDiagnosticsPanel() {
  const { amounts, reviewedFields, updateAmounts, markReviewedBulk, clearReviewedForKeys } =
    useSyncedReviewState()
  const live = useMemo(() => computeLiveReturn(amounts), [amounts])
  const syncCtx = useMemo(
    () => ({ reviewedFields, live, amounts }),
    [reviewedFields, live, amounts],
  )
  const fixPlan = useMemo(() => buildAgentFixPlan(syncCtx), [syncCtx])

  const [phase, setPhase] = useState<AgentPhase>('ready')
  const [thread, setThread] = useState<ThreadEntry[]>([])
  const [progressValue, setProgressValue] = useState(0)
  const [chatInput, setChatInput] = useState('')
  const runRef = useRef(false)
  const welcomeAddedRef = useRef(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const openCount = fixPlan.length
  const diagnosisIssueCount = useMemo(
    () => getCategoryScopedActiveKeys(syncCtx).length,
    [syncCtx],
  )
  useLayoutEffect(() => {
    if (sessionStorage.getItem(AGENT_VISIT_SESSION_KEY)) return
    sessionStorage.setItem(AGENT_VISIT_SESSION_KEY, '1')
    const scopedKeys = getCategoryScopedActiveKeys(getAgentFixContext(amounts, reviewedFields))
    const staleReviewed = scopedKeys.filter(key => reviewedFields.has(key))
    if (staleReviewed.length > 0) {
      clearReviewedForKeys(staleReviewed)
    }
  }, [amounts, reviewedFields, clearReviewedForKeys])

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
      const openBefore = buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields)).length
      const progressStart = opts?.progressOffset ?? 0
      const isBatch = !opts?.single && items.length > 1

      appendThread({
        kind: 'milestone',
        variant: 'fixes-started',
        text: 'Fixes started by Intuit Intelligence',
      })

      const batchFixed: FixedItemSummary[] = []

      if (isBatch) {
        const batchSteps = buildBatchThinkingSteps(items)
        const thinkingId = nextThreadEntryId()
        appendThread({
          id: thinkingId,
          kind: 'thinking',
          issueTitle: `${items.length} diagnostics`,
          steps: batchSteps,
          activeStep: 0,
        })

        for (let s = 0; s < batchSteps.length; s++) {
          await new Promise(r => setTimeout(r, BATCH_STEP_MS))
          setThread(prev =>
            prev.map(entry =>
              entry.id === thinkingId && entry.kind === 'thinking'
                ? { ...entry, activeStep: s + 1 }
                : entry,
            ),
          )
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          applyFixForIssue(item)
          setProgressValue(progressStart + i + 1)
          batchFixed.push({
            outcomeLabel: item.outcomeLabel,
            viewLinks: item.viewLinks,
          })
        }
      } else {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
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

          const fixedSummary: FixedItemSummary = {
            outcomeLabel: item.outcomeLabel,
            viewLinks: item.viewLinks,
          }
          batchFixed.push(fixedSummary)

          if (openBefore > 1) {
            appendThread({
              kind: 'fixed',
              outcomeLabel: item.outcomeLabel,
              summary: item.fixSummary,
              viewLinks: item.viewLinks,
            })
          }

          await new Promise(r => setTimeout(r, ISSUE_GAP_MS))
        }
      }

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
      appendThread({
        kind: 'complete-summary',
        introText: `I've resolved all ${batchFixed.length} diagnostic${batchFixed.length === 1 ? '' : 's'}. Here's the progress summary.`,
        fixedItems: batchFixed,
        totalCount: batchFixed.length,
      })
    },
    [appendThread, applyFixForIssue, amounts, reviewedFields],
  )

  const handleFixAll = useCallback(() => {
    const plan = buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields))
    if (plan.length === 0) return
    appendThread({ kind: 'user', text: 'Accept all fixes', asChip: true })
    setProgressValue(0)
    void runFixForItems(plan)
  }, [amounts, reviewedFields, runFixForItems, appendThread])

  const handleFixOne = useCallback(
    (item?: AgentFixPlanItem) => {
      const plan = buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields))
      const target = item ?? plan[0]
      if (!target) return
      appendThread({ kind: 'user', text: `Fix: ${target.title}`, asChip: true })
      void runFixForItems([target], { single: true, progressOffset: progressValue })
    },
    [amounts, reviewedFields, runFixForItems, appendThread, progressValue],
  )

  const handleFixByIssueKey = useCallback(
    (issueKey: AgentFixPlanItem['issueKey']) => {
      const plan = buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields))
      const target = plan.find(item => item.issueKey === issueKey)
      if (target) handleFixOne(target)
    },
    [amounts, reviewedFields, handleFixOne],
  )

  const handleFixNext = useCallback(() => {
    const plan = buildAgentFixPlan(getAgentFixContext(amounts, reviewedFields))
    if (plan.length === 0) return
    appendThread({ kind: 'user', text: 'Fix next issue', asChip: true })
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
      text:
        diagnosisIssueCount > 0
          ? `I've analyzed Jordan's 2025 return and found ${diagnosisIssueCount} issue${diagnosisIssueCount === 1 ? '' : 's'} to resolve. I compared source documents, questionnaire answers, and return inputs.\nReview each diagnostic below, then tell me how you'd like to proceed.`
          : `I've analyzed Jordan's 2025 return. No diagnostics need a fix right now — review the verified checks and your checklist below before sign-off.`,
    })
  }, [appendThread, diagnosisIssueCount])

  const collapseDiagnosisCards = phase !== 'ready'

  return (
    <div className={styles.panel}>
      <div className={styles.workspace}>
        <div className={styles.mainColumn}>
          <div className={styles.chatScroll} ref={chatScrollRef}>
            <div className={styles.thread}>
              {thread.map(entry => {
                if (entry.kind === 'user') {
                  if (entry.asChip) {
                    return (
                      <div key={entry.id} className={styles.userChipRow}>
                        <ActionChip active>{entry.text}</ActionChip>
                      </div>
                    )
                  }
                  return (
                    <div key={entry.id} className={styles.userRow}>
                      <div className={styles.userBubble}>{entry.text}</div>
                    </div>
                  )
                }
                if (entry.kind === 'milestone') {
                  const pillClass =
                    entry.variant === 'fixes-started'
                      ? styles.milestonePillAccent
                      : styles.milestonePill
                  return (
                    <div key={entry.id} className={styles.milestoneRow} role="separator">
                      <span className={styles.milestoneLine} aria-hidden />
                      <span className={pillClass}>{entry.text}</span>
                      <span className={styles.milestoneLine} aria-hidden />
                    </div>
                  )
                }
                if (entry.kind === 'agent') {
                  if (entry.isWelcome) {
                    return (
                      <div key={entry.id} className={styles.welcomeBlock}>
                        <header className={styles.welcomeBrandRow}>
                          <img
                            src={intuitIntelligenceLogo}
                            alt=""
                            className={styles.brandLogo}
                            aria-hidden
                          />
                          <span className={styles.welcomeBrandTitle}>
                            Return review by Intuit Intelligence
                          </span>
                        </header>
                        <p className={`${styles.agentBody} ${styles.agentBodyPreWrap}`}>
                          {entry.text}
                        </p>
                        <InitialDiagnosisFeed
                          syncCtx={syncCtx}
                          phase={phase}
                          fixPlan={fixPlan}
                          collapseCards={collapseDiagnosisCards}
                          onFixIssueKey={handleFixByIssueKey}
                        />
                        {openCount > 0 && phase === 'ready' && (
                          <div className={`${styles.responsePills} ${styles.responsePillsEnd}`}>
                            <ActionChip onClick={handleFixAll}>Accept all fixes</ActionChip>
                            <ActionChip onClick={() => handleFixOne()}>
                              Fix each issue individually
                            </ActionChip>
                          </div>
                        )}
                      </div>
                    )
                  }
                  return (
                    <AgentSparkleRow key={entry.id}>
                      {entry.heading && (
                        <h2 className={styles.agentHeading}>{entry.heading}</h2>
                      )}
                      <p className={styles.agentBody}>{entry.text}</p>
                      {entry.showNextActions && entry.remainingCount != null && (
                        <div className={`${styles.responsePills} ${styles.responsePillsEnd}`}>
                          <ActionChip onClick={handleFixNext}>Fix next issue</ActionChip>
                          <ActionChip onClick={handleFixAll}>
                            Fix all remaining ({entry.remainingCount})
                          </ActionChip>
                        </div>
                      )}
                    </AgentSparkleRow>
                  )
                }
                if (entry.kind === 'thinking') {
                  return (
                    <div key={entry.id} className={styles.thinkingRow}>
                      <ThinkingBlock entry={entry} />
                    </div>
                  )
                }
                if (entry.kind === 'fixed') {
                  return (
                    <AgentSparkleRow key={entry.id}>
                      <div className={styles.fixedCard}>
                        <div className={styles.fixedHeader}>
                          <Badge status="success" label="Fixed" shape="round" aria-label="Fixed">
                            <SuccessBadgeIcon />
                          </Badge>
                          <h3 className={styles.fixedTitle}>{entry.outcomeLabel}</h3>
                        </div>
                        <p className={styles.cardBody}>{entry.summary}</p>
                        {entry.viewLinks.length > 0 && (
                          <div className={styles.sourceLinkRow}>
                            {entry.viewLinks.map(link => (
                              <SourceLinkChip key={link.label} link={link} />
                            ))}
                          </div>
                        )}
                      </div>
                    </AgentSparkleRow>
                  )
                }
                if (entry.kind === 'complete-summary') {
                  return (
                    <AgentSparkleRow key={entry.id}>
                      <p className={styles.agentBody}>{entry.introText}</p>
                      <FixProgressSummaryCard
                        fixedItems={entry.fixedItems}
                        totalCount={entry.totalCount}
                      />
                      <ReminderCard />
                      <PreparerReviewCallouts
                        syncCtx={syncCtx}
                        collapseCards
                        ariaLabel="Sign-off reminders after fixes"
                      />
                      <div className={`${styles.responsePills} ${styles.responsePillsEnd}`}>
                        <ActionChip
                          onClick={() =>
                            openAgentViewLinkInWindow({
                              label: 'Updated return',
                              formId: '1040',
                            })
                          }
                        >
                          Updated return
                          <NewWindow size="small" className={styles.actionChipIcon} aria-hidden />
                        </ActionChip>
                        <SourceLinkChip link={SOURCE_DOCUMENTS_VIEW_LINK} />
                        <ActionChip
                          onClick={() =>
                            openReviewReturnPopout({ form: '1040' })
                          }
                        >
                          View summary
                        </ActionChip>
                      </div>
                    </AgentSparkleRow>
                  )
                }
                return null
              })}
            </div>
          </div>

          <div className={styles.composerArea}>
            <div className={styles.composerInner}>
              <div className={styles.composerBox}>
                <textarea
                  className={styles.composerInput}
                  rows={1}
                  placeholder="Type or ask something"
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
              <span className={styles.legalLink}>
                <Link href="#" size="body-4" inline onClick={e => e.preventDefault()}>
                  Important information about how we use generative AI
                </Link>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  CircleExclamation,
  Comment,
  List,
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
  buildStandardSourceLinks,
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
import {
  AI_DIAGNOSTIC_CATEGORIES,
  getCategoryDiagnosticCount,
  getDiagnosticOverviewCounts,
  primaryIssueKeyForCategory,
} from './aiDiagnosticCategories'
import type { DiagnosticSyncContext } from '../data-review/phase2FlagSync'
import styles from '../../styles/check-return/AgentDiagnosticsPanel.module.css'

type AgentPhase = 'ready' | 'running' | 'complete'

type ThreadEntry =
  | {
      id: string
      kind: 'agent'
      isWelcome?: boolean
      isPlan?: boolean
      showSources?: boolean
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
  if (link.inputScreens) {
    window.location.assign(buildHashRouteUrl(PREPARER_DATA_REVIEW_PATH))
    return
  }
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

function IntelligenceBrand({ meta }: { meta?: string }) {
  return (
    <div className={styles.brandRow}>
      <div className={styles.logoGroup}>
        <img src={intuitIntelligenceLogo} alt="" className={styles.brandLogo} aria-hidden />
        <span className={styles.wordmark}>Intuit Intelligence</span>
      </div>
      {meta && <span className={styles.brandMeta}>{meta}</span>}
    </div>
  )
}

function ReturnStandingCard({ ctx, phase }: { ctx: DiagnosticSyncContext; phase: AgentPhase }) {
  const overview = getDiagnosticOverviewCounts(ctx)
  const stillNeeded = fixPlanTitlesFromCtx(ctx)

  return (
    <div className={styles.interactiveCard}>
      <p className={styles.cardEyebrow}>Return status</p>
      <h3 className={styles.cardTitle}>Here&apos;s where Jordan&apos;s 2025 return stands</h3>
      <ul className={styles.statusList}>
        {AI_DIAGNOSTIC_CATEGORIES.map(category => {
          const count = getCategoryDiagnosticCount(category.id, ctx)
          const issueKey = primaryIssueKeyForCategory(category.id, overview.activeKeys)
          const isDone =
            !issueKey ||
            ctx.reviewedFields.has(issueKey) ||
            (phase === 'complete' && count === 0)
          const isActive = count > 0 && !isDone
          return (
            <li key={category.id} className={styles.statusRow}>
              <span className={styles.statusIcon} aria-hidden>
                {isDone ? (
                  <CircleCheck size="small" color="var(--color-action-standard)" />
                ) : isActive ? (
                  <CircleExclamation size="small" color="var(--color-ui-attention)" />
                ) : (
                  <span className={styles.statusDot} />
                )}
              </span>
              <div className={styles.statusCopy}>
                <span className={styles.statusLabel}>{category.navLabel}</span>
                <span className={styles.statusMeta}>
                  {isDone ? 'Done' : isActive ? `${count} open` : 'Not started'}
                </span>
              </div>
              {isActive && issueKey && (
                <LinkActionButton
                  size="small"
                  weight="regular"
                  alignment="left"
                  onClick={() => {
                    const planItem = buildAgentFixPlan(ctx).find(p => p.issueKey === issueKey)
                    const firstLink = planItem?.viewLinks[0]
                    if (firstLink) runAgentViewLink(firstLink)
                  }}
                >
                  View
                </LinkActionButton>
              )}
            </li>
          )
        })}
      </ul>
      {stillNeeded.length > 0 && phase !== 'complete' && (
        <div className={styles.stillNeededBlock}>
          <p className={styles.stillNeededLabel}>Still needed</p>
          <ul className={styles.stillNeededList}>
            {stillNeeded.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function fixPlanTitlesFromCtx(ctx: DiagnosticSyncContext): string[] {
  return buildAgentFixPlan(ctx).map(item => item.title)
}

function SourceExplorerCard({ links }: { links: AgentViewLink[] }) {
  return (
    <div className={styles.interactiveCard}>
      <p className={styles.cardEyebrow}>Review sources</p>
      <p className={styles.cardBody}>
        Jump to any source document, input screen, or output form tied to these diagnostics.
      </p>
      <div className={styles.sourceButtonGrid}>
        {links.map(link => (
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
    </div>
  )
}

function DiagnosticsPlanCard({
  bullets,
  plan,
}: {
  bullets: string[]
  plan: AgentFixPlanItem[]
}) {
  return (
    <div className={styles.interactiveCard}>
      <p className={styles.cardEyebrow}>Open diagnostics</p>
      <ul className={styles.planList}>
        {bullets.map((bullet, bi) => {
          const item = plan[bi]
          const primaryLink = item?.viewLinks[0]
          return (
            <li key={bullet} className={styles.planRow}>
              <div className={styles.planRowMain}>
                <Badge
                  status="warning"
                  label="Open"
                  capitalization="sentence"
                  priority="secondary"
                />
                <span className={styles.planRowTitle}>{bullet}</span>
              </div>
              {primaryLink && (
                <LinkActionButton
                  size="small"
                  weight="regular"
                  alignment="left"
                  onClick={() => runAgentViewLink(primaryLink)}
                >
                  {primaryLink.label}
                </LinkActionButton>
              )}
            </li>
          )
        })}
      </ul>
      {plan.some(item => item.viewLinks.length > 1) && (
        <div className={styles.cardActions}>
          {plan.flatMap(item => item.viewLinks).slice(0, 4).map(link => (
            <Button
              key={`${link.label}-${link.tab ?? link.formId}`}
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
  ctx,
  plan,
  completedCount,
  activeIndex,
  phase,
}: {
  ctx: DiagnosticSyncContext
  plan: AgentFixPlanItem[]
  completedCount: number
  activeIndex: number
  phase: AgentPhase
}) {
  const overview = getDiagnosticOverviewCounts(ctx)
  const totalSteps = plan.length || AI_DIAGNOSTIC_CATEGORIES.length
  const readinessPct =
    phase === 'complete' || plan.length === 0
      ? 100
      : Math.round((completedCount / plan.length) * 100)

  return (
    <aside className={styles.progressRail} aria-label="Fix progress">
      <div className={styles.progressCard}>
        <div className={styles.progressCardHeader}>
          <span className={styles.progressLabel}>Progress</span>
          <span className={styles.progressCount}>
            {phase === 'complete' ? totalSteps : completedCount}/{totalSteps || 1}
          </span>
        </div>
        <ol className={styles.progressTimeline}>
          {(plan.length > 0 ? plan : buildAgentFixPlan(ctx)).map((item, index) => {
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
                  {isActive && <p className={styles.progressStepMeta}>Fixing now…</p>}
                  {isDone && !isActive && <p className={styles.progressStepMeta}>Fixed</p>}
                  {!isDone && !isActive && item.viewLinks[0] && (
                    <LinkActionButton
                      size="small"
                      weight="regular"
                      alignment="left"
                      onClick={() => runAgentViewLink(item.viewLinks[0])}
                    >
                      {item.viewLinks[0].label}
                    </LinkActionButton>
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
          {readinessPct}%
          <ChevronRight size="small" aria-hidden />
        </span>
      </button>

      <div className={styles.taxProfileCard}>
        <div className={styles.progressCardHeader}>
          <span className={styles.progressLabel}>Tax profile</span>
          <ChevronRight size="small" aria-hidden />
        </div>
        <dl className={styles.taxProfileGrid}>
          <div className={styles.taxProfileItem}>
            <dt>Taxpayer</dt>
            <dd>Jordan Patel</dd>
          </div>
          <div className={styles.taxProfileItem}>
            <dt>Filing status</dt>
            <dd>Single</dd>
          </div>
          <div className={styles.taxProfileItem}>
            <dt>Open diagnostics</dt>
            <dd>{overview.remaining}</dd>
          </div>
        </dl>
      </div>
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
  const standardSourceLinks = useMemo(() => buildStandardSourceLinks(), [])

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
      heading: 'Return review',
      text: `I've reviewed Jordan's 2025 return and found ${total} diagnostic${total === 1 ? '' : 's'} that need attention. I can fix them automatically — you'll see each step as I work.`,
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
                          <>
                            <IntelligenceBrand meta="Analyzed just now" />
                            <div className={styles.titleRow}>
                              <h1 className={styles.welcomeTitle}>{entry.heading}</h1>
                            </div>
                          </>
                        ) : (
                          <>
                            <IntelligenceBrand />
                            {entry.heading && (
                              <h2 className={styles.agentHeading}>{entry.heading}</h2>
                            )}
                          </>
                        )}
                        <p className={styles.agentBody}>{entry.text}</p>
                        {entry.isWelcome && (
                          <>
                            <ReturnStandingCard ctx={syncCtx} phase={phase} />
                            <SourceExplorerCard links={standardSourceLinks} />
                          </>
                        )}
                        {entry.showSources && (
                          <SourceExplorerCard links={standardSourceLinks} />
                        )}
                        {entry.isPlan && entry.bullets && entry.bullets.length > 0 && (
                          <DiagnosticsPlanCard bullets={entry.bullets} plan={fixPlan} />
                        )}
                        {!entry.isPlan && entry.bullets && entry.bullets.length > 0 && (
                          <ul className={styles.agentList}>
                            {entry.bullets.map((bullet, bi) => (
                              <li key={bi}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                        {entry.isWelcome && remaining > 0 && phase === 'ready' && (
                          <div className={styles.responsePills}>
                            <Button priority="primary" onClick={handleFixAll}>
                              Fix all issues
                            </Button>
                            <Button
                              priority="secondary"
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
                            </Button>
                            <Button
                              priority="secondary"
                              onClick={() => openSourceDocumentReviewPopout()}
                            >
                              Review sources
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
                          <IntelligenceBrand meta="Fixed just now" />
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
                            <>
                              <p className={styles.cardEyebrow}>Review changes</p>
                              <div className={styles.sourceButtonGrid}>
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
                            </>
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
                <IntelligenceBrand meta="Review complete" />
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
                <p className={styles.cardEyebrow}>Review changes</p>
                <div className={styles.sourceButtonGrid}>
                  {standardSourceLinks.map(link => (
                    <Button
                      key={`done-${link.label}`}
                      priority="secondary"
                      size="medium"
                      onClick={() => runAgentViewLink(link)}
                    >
                      {link.label}
                    </Button>
                  ))}
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
                <List size="small" aria-hidden />
                What&apos;s pending?
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => openSourceDocumentReviewPopout()}
              >
                <Upload size="small" aria-hidden />
                View source documents
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => {
                  appendThread({ kind: 'user', text: 'Show me all review sources' })
                  appendThread({
                    kind: 'agent',
                    showSources: true,
                    text: 'Open any source below to inspect documents, inputs, or the 1040.',
                  })
                }}
              >
                <Comment size="small" aria-hidden />
                Review sources
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
          ctx={syncCtx}
          plan={fixPlan}
          completedCount={progressValue}
          activeIndex={activeFixIndex}
          phase={phase}
        />
      </div>
    </div>
  )
}

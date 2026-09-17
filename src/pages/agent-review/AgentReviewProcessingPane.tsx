import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleCheckFill, PopOut } from '@design-systems/icons'
import Badge from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Link } from '@ids-ts/link'
import '@ids-ts/link/dist/main.css'
import AgentDiagnosticExpandableCard from '../check-return/AgentDiagnosticExpandableCard'
import AgentReviewSummaryFooter from './AgentReviewSummaryFooter'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { SEED_AMOUNTS } from '../../data/liveReturn'
import { openSourceDocumentReviewPopout } from '../../lib/prototypeRoutes'
import {
  buildIntelligenceReviewModel,
  CTA_CONTINUE_NEXT_FIX,
  CTA_VIEW,
  getActiveIntelligenceIssues,
  INTELLIGENCE_FIX_PROGRESS_SECTIONS,
  INTELLIGENCE_FIXES_DIVIDER_LABEL,
  INTELLIGENCE_FIXES_PROGRESS_TITLE,
  INTELLIGENCE_NEED_ACTION_COPY,
  INTELLIGENCE_PROGRESS_ITEMS,
  INTELLIGENCE_REASONING_STEPS,
  INTELLIGENCE_REASONING_TITLE,
  INTELLIGENCE_REMINDER_TITLE,
  INTELLIGENCE_SHELL_TITLE,
  intelligenceFixCompleteMessage,
  intelligenceFixProgressLabel,
  intelligenceProcessingIntro,
  LABEL_NEED_ACTION,
  type IntelligenceFixLink,
} from './agentIntelligenceCopy'
import {
  useAgentProcessingAnimation,
  type ProcessingMode,
} from './useAgentProcessingAnimation'
import {
  AgentIntelligenceReasoningLive,
  AgentIntelligenceShowThinking,
} from './AgentIntelligenceReasoning'
import AgentReviewSuggestionChips, { SuggestionChip } from './AgentReviewSuggestionChips'
import styles from '../../styles/agent-review/AgentReviewProcessingPane.module.css'

interface AgentReviewProcessingPaneProps {
  mode?: ProcessingMode
  compact?: boolean
  onViewUpdatedReturn: () => void
  onViewSourceDocuments: () => void
  onViewReturnSummary: () => void
  onGetCaughtUp: () => void
  onFooterChipsChange?: (chips: ReactNode | null) => void
  /** Fired once when the fix animation finishes — use to persist demo amount corrections. */
  onFixesComplete?: () => void
}

function openDocLink(link: IntelligenceFixLink) {
  if (link.popoutTab) {
    openSourceDocumentReviewPopout({ tab: link.popoutTab, subTab: link.popoutSubTab })
    return
  }
  openSourceDocumentReviewPopout()
}

export default function AgentReviewProcessingPane({
  mode = 'batch',
  compact = false,
  onViewUpdatedReturn,
  onViewSourceDocuments,
  onViewReturnSummary,
  onGetCaughtUp,
  onFooterChipsChange,
  onFixesComplete,
}: AgentReviewProcessingPaneProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false)
  const fixSectionRefs = useRef<Record<number, HTMLElement | null>>({})

  const { issues, issueCount, totalWithholding, live } = useMemo(
    () => getActiveIntelligenceIssues(),
    [],
  )

  const reviewCards = useMemo(
    () =>
      issues.map(issue =>
        buildIntelligenceReviewModel(issue, live, SEED_AMOUNTS, totalWithholding),
      ),
    [issues, live, totalWithholding],
  )

  const {
    phase,
    reasoningHeaderVisible,
    visibleSteps,
    reasoningExiting,
    resultsVisible,
    visibleFixSections,
    showReminder,
    showFooter,
    activeProgressIndex,
    completedProgress,
    showSuggestionChips,
    awaitingContinue,
    allFixesComplete,
    advanceToNextFix,
    fixSectionCount,
  } = useAgentProcessingAnimation(mode)

  useEffect(() => {
    if (allFixesComplete) onFixesComplete?.()
  }, [allFixesComplete, onFixesComplete])

  useEffect(() => {
    if (!onFooterChipsChange) return

    if (!showSuggestionChips && !awaitingContinue) {
      onFooterChipsChange(null)
      return
    }

    if (awaitingContinue && !allFixesComplete) {
      onFooterChipsChange(
        <AgentReviewSuggestionChips>
          <SuggestionChip onClick={advanceToNextFix}>{CTA_CONTINUE_NEXT_FIX}</SuggestionChip>
        </AgentReviewSuggestionChips>,
      )
      return
    }

    onFooterChipsChange(null)
  }, [
    advanceToNextFix,
    allFixesComplete,
    awaitingContinue,
    onFooterChipsChange,
    onGetCaughtUp,
    showSuggestionChips,
  ])

  useEffect(() => {
    return () => onFooterChipsChange?.(null)
  }, [onFooterChipsChange])

  const scrollToFixSection = (index: number) => {
    fixSectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleProgressView = (index: number) => {
    if (index < fixSectionCount) {
      scrollToFixSection(index + 1)
      return
    }
    onViewReturnSummary()
  }

  return (
    <div className={styles.container}>
      <div className={styles.scrollArea}>
        <div className={`${styles.layout} ${compact ? styles.layoutCompact : ''}`}>
          <div className={styles.lockup}>
            <img src={intuitIntelligenceLogo} alt="" className={styles.sparkleIcon} />
            <h1 className={styles.title}>{INTELLIGENCE_SHELL_TITLE}</h1>
          </div>

          <p className={styles.intro}>{intelligenceProcessingIntro(issueCount, mode)}</p>

          <div className={styles.cardsRow}>
            <div className={styles.cardsColumn}>
              <div className={styles.cardList} role="list" aria-label="Diagnostic issues">
                {reviewCards.map(card => (
                  <AgentDiagnosticExpandableCard
                    key={card.id}
                    card={card}
                    expanded={false}
                    onExpandedChange={() => undefined}
                  />
                ))}
              </div>
            </div>

            <aside className={styles.progressRail} aria-label="Run progress">
              <div className={styles.progressRailHeader}>
                <img src={intuitIntelligenceLogo} alt="" className={styles.progressRailLogo} />
                <span className={styles.progressLabel}>
                  PROGRESS {completedProgress}/{INTELLIGENCE_PROGRESS_ITEMS.length}
                </span>
              </div>
              <ol className={styles.progressList}>
                {INTELLIGENCE_PROGRESS_ITEMS.map((item, index) => {
                  const done = index < completedProgress
                  const active = index === activeProgressIndex
                  return (
                    <li
                      key={item.id}
                      className={`${styles.progressItem} ${active ? styles.progressItemActive : ''}`}
                    >
                      <span
                        className={`${styles.progressDot} ${done ? styles.progressDotDone : ''} ${active ? styles.progressDotActive : ''}`}
                        aria-hidden
                      >
                        {done && (
                          <CircleCheckFill size="x-small" className={styles.progressCheck} />
                        )}
                      </span>
                      <div className={styles.progressItemBody}>
                        <div className={styles.progressItemMain}>
                          <span className={done ? styles.progressItemDone : undefined}>
                            {item.label}
                          </span>
                          {item.subtitle && done && (
                            <span className={styles.progressItemSubtitle}>{item.subtitle}</span>
                          )}
                        </div>
                        {(done || index === fixSectionCount) && (
                          <Link
                            href="#"
                            onClick={e => {
                              e.preventDefault()
                              handleProgressView(index)
                            }}
                          >
                            {CTA_VIEW}
                          </Link>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </aside>
          </div>

          <div className={styles.belowCards}>
            {phase === 'reasoning' && (
              <AgentIntelligenceReasoningLive
                title={INTELLIGENCE_REASONING_TITLE}
                steps={INTELLIGENCE_REASONING_STEPS}
                visibleSteps={visibleSteps}
                headerVisible={reasoningHeaderVisible}
                exiting={reasoningExiting}
              />
            )}

            {resultsVisible && (
              <div className={`${styles.resultsBlock} ${styles.revealIn}`}>
                <div className={styles.fixesDivider} role="separator">
                  <span className={styles.fixesDividerLine} aria-hidden />
                  <span className={styles.fixesDividerLabel}>
                    {INTELLIGENCE_FIXES_DIVIDER_LABEL}
                  </span>
                  <span className={styles.fixesDividerLine} aria-hidden />
                </div>

                <AgentIntelligenceShowThinking
                  expanded={thinkingExpanded}
                  onToggle={() => setThinkingExpanded(v => !v)}
                  steps={INTELLIGENCE_REASONING_STEPS}
                />

                <div className={styles.agentMessageRow}>
                  <img src={intuitIntelligenceLogo} alt="" className={styles.agentAvatar} />
                  <p className={styles.agentMessageText}>
                    {intelligenceFixCompleteMessage(visibleFixSections, fixSectionCount)}
                  </p>
                </div>

                <div className={styles.progressCard}>
                  <div className={styles.progressCardHeader}>
                    <span className={styles.progressCardTitle}>
                      {INTELLIGENCE_FIXES_PROGRESS_TITLE}
                    </span>
                    <span className={styles.progressCardCount}>
                      {intelligenceFixProgressLabel(visibleFixSections, fixSectionCount)}
                    </span>
                  </div>

                  <div className={styles.progressCardDivider} role="separator" />

                  {INTELLIGENCE_FIX_PROGRESS_SECTIONS.map((section, sectionIndex) => {
                    const visible = sectionIndex < visibleFixSections
                    if (!visible) return null
                    return (
                      <div
                        key={section.title}
                        ref={el => {
                          fixSectionRefs.current[sectionIndex + 1] = el
                        }}
                        className={`${styles.fixSection} ${styles.revealIn}`}
                        style={{ animationDelay: `${sectionIndex * 80}ms` }}
                      >
                        <div className={styles.fixSectionHeader}>
                          <CircleCheckFill size="small" className={styles.summaryCheck} />
                          <span className={styles.fixSectionTitle}>{section.title}</span>
                        </div>
                        <ul className={styles.fixLinkList}>
                          {section.links.map(link => (
                            <li key={`${section.title}-${link.docLabel}`} className={styles.fixLinkRow}>
                              <button
                                type="button"
                                className={styles.richDocLink}
                                onClick={() => openDocLink(link)}
                              >
                                {link.docLabel}
                                <PopOut size="x-small" aria-hidden />
                              </button>
                              <span className={styles.fixLinkDetail}>— {link.detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                {showReminder && (
                  <div className={`${styles.reminderCard} ${styles.revealIn}`}>
                    <div className={styles.reminderHeader}>
                      <img src={intuitIntelligenceLogo} alt="" className={styles.reminderIcon} />
                      <span className={styles.reminderTitle}>{INTELLIGENCE_REMINDER_TITLE}</span>
                      <Badge status="warning" priority="primary" capitalization="caps">
                        {LABEL_NEED_ACTION}
                      </Badge>
                    </div>
                    <p className={styles.reminderText}>
                      {INTELLIGENCE_NEED_ACTION_COPY.before}
                      <strong>{INTELLIGENCE_NEED_ACTION_COPY.emphasis}</strong>
                      {INTELLIGENCE_NEED_ACTION_COPY.after}
                    </p>
                  </div>
                )}

                {showFooter && (
                  <div className={`${styles.revealIn}`}>
                    <AgentReviewSummaryFooter
                      onViewUpdatedReturn={onViewUpdatedReturn}
                      onViewSourceDocuments={onViewSourceDocuments}
                      onPrimaryAction={onGetCaughtUp}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

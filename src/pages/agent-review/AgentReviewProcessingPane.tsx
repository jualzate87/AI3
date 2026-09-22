import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CircleCheckFill, NewWindow } from '@design-systems/icons'
import Badge from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import AgentDiagnosticExpandableCard from '../check-return/AgentDiagnosticExpandableCard'
import AgentReviewSummaryFooter from './AgentReviewSummaryFooter'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { SEED_AMOUNTS } from '../../data/liveReturn'
import {
  openDocOrFormLink,
  type DocOrFormLink,
} from '../../lib/prototypeRoutes'
import {
  buildIntelligenceReviewModel,
  CTA_CONTINUE_NEXT_FIX,
  getActiveIntelligenceIssues,
  INTELLIGENCE_ATTENTION_INTRO,
  INTELLIGENCE_FIX_PROGRESS_SECTIONS,
  INTELLIGENCE_FIXES_DIVIDER_LABEL,
  INTELLIGENCE_FIXES_PROGRESS_TITLE,
  INTELLIGENCE_NEEDS_ATTENTION_ITEMS,
  INTELLIGENCE_PROGRESS_ITEMS,
  INTELLIGENCE_REASONING_STEPS,
  INTELLIGENCE_REASONING_TITLE,
  INTELLIGENCE_SHELL_TITLE,
  intelligenceAttentionTitle,
  intelligenceFinalStepSubtitle,
  intelligenceFixCompleteMessage,
  intelligenceFixProgressLabel,
  intelligenceProcessingIntro,
  LABEL_NEED_ACTION,
} from './agentIntelligenceCopy'
import { useAgentProcessingAnimation, type ProcessingMode } from './useAgentProcessingAnimation'
import {
  AgentIntelligenceReasoningLive,
  AgentIntelligenceShowThinking,
} from './AgentIntelligenceReasoning'
import AgentReviewSuggestionChips, { SuggestionChip } from './AgentReviewSuggestionChips'
import styles from '../../styles/agent-review/AgentReviewProcessingPane.module.css'

interface AgentReviewProcessingPaneProps {
  mode?: ProcessingMode
  compact?: boolean
  onGetCaughtUp: () => void
  onFooterChipsChange?: (chips: ReactNode | null) => void
  /** Fired once when the fix animation finishes — use to persist demo amount corrections. */
  onFixesComplete?: () => void
  /** Reopening an existing conversation — show the finished results without replaying them. */
  resumed?: boolean
}

function openDocLink(link: {
  popoutTab?: string
  popoutSubTab?: string
  divPayer?: string
  field?: string
  formId?: string
  diagnostic?: string
}) {
  const dest: DocOrFormLink = {
    tab: link.popoutTab,
    subTab: link.popoutSubTab,
    divPayer: link.divPayer,
    field: link.field,
    formId: link.formId,
    diagnostic: link.diagnostic,
  }
  openDocOrFormLink(dest)
}

export default function AgentReviewProcessingPane({
  mode = 'batch',
  compact = false,
  onGetCaughtUp,
  onFooterChipsChange,
  onFixesComplete,
  resumed = false,
}: AgentReviewProcessingPaneProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false)

  const { issues, issueCount, totalWithholding, live } = useMemo(
    () => getActiveIntelligenceIssues(),
    [],
  )

  const reviewCards = useMemo(
    () =>
      issues.map((issue) =>
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
  } = useAgentProcessingAnimation(mode, resumed)

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
                {reviewCards.map((card) => (
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
                  /* The closing step is not agent work — it is what the run hands back
                     to the reviewer, so it never completes here. It opens instead, and
                     reports how many items are waiting. */
                  const isFinal = index === INTELLIGENCE_PROGRESS_ITEMS.length - 1
                  const done = index < completedProgress
                  const awaiting = isFinal && allFixesComplete
                  const active = index === activeProgressIndex || awaiting
                  const subtitle = awaiting
                    ? intelligenceFinalStepSubtitle(INTELLIGENCE_NEEDS_ATTENTION_ITEMS.length)
                    : done
                      ? item.subtitle
                      : undefined

                  return (
                    <li
                      key={item.id}
                      className={`${styles.progressItem} ${active ? styles.progressItemActive : ''}`}
                    >
                      <span
                        className={`${styles.progressDot} ${done ? styles.progressDotDone : ''} ${awaiting ? styles.progressDotAwaiting : ''} ${active && !awaiting ? styles.progressDotActive : ''}`}
                        aria-hidden
                      >
                        {done && (
                          <CircleCheckFill size="x-small" className={styles.progressCheck} />
                        )}
                      </span>
                      <div className={styles.progressItemMain}>
                        <span
                          className={`${styles.progressItemLabel} ${done ? styles.progressItemDone : ''}`}
                        >
                          {item.label}
                        </span>
                        {subtitle && (
                          <span className={styles.progressItemSubtitle}>{subtitle}</span>
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
                working={!reasoningExiting}
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
                  onToggle={() => setThinkingExpanded((v) => !v)}
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
                    {/* The card keeps its name once complete — the count beside it
                        already reports the finished state. */}
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
                        className={`${styles.fixSection} ${styles.revealIn}`}
                        style={{ animationDelay: `${sectionIndex * 80}ms` }}
                      >
                        <div className={styles.fixSectionHeader}>
                          <CircleCheckFill size="small" className={styles.summaryCheck} />
                          <span className={styles.fixSectionTitle}>{section.title}</span>
                        </div>
                        <ul className={styles.fixLinkList}>
                          {section.links.map((link) => (
                            <li
                              key={`${section.title}-${link.docLabel}`}
                              className={styles.fixLinkRow}
                            >
                              <button
                                type="button"
                                className={styles.richDocLink}
                                onClick={() => openDocLink(link)}
                              >
                                {link.docLabel}
                                <NewWindow size="small" className={styles.richDocLinkIcon} aria-hidden />
                              </button>
                              <span className={styles.fixLinkDetail}>— {link.detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                {/* What the agent settled lands first; what it could not settle closes the list. */}
                {showReminder && (
                  <section
                    className={`${styles.attentionCard} ${styles.revealIn}`}
                    aria-labelledby="ai-review-attention-title"
                  >
                    <div className={styles.progressCardHeader}>
                      <span className={styles.attentionTitleGroup}>
                        <span id="ai-review-attention-title" className={styles.progressCardTitle}>
                          {intelligenceAttentionTitle(INTELLIGENCE_NEEDS_ATTENTION_ITEMS.length)}
                        </span>
                        <Badge status="warning" priority="secondary" capitalization="caps">
                          {LABEL_NEED_ACTION}
                        </Badge>
                      </span>
                    </div>

                    <div className={styles.progressCardDivider} role="separator" />

                    <p className={styles.attentionIntro}>{INTELLIGENCE_ATTENTION_INTRO}</p>

                    <ul className={styles.attentionList}>
                      {INTELLIGENCE_NEEDS_ATTENTION_ITEMS.map((item) => (
                        <li key={item.id} className={styles.attentionItem}>
                          <span className={styles.attentionItemTitle}>{item.title}</span>
                          <p className={styles.attentionItemDetail}>{item.detail}</p>
                          <button
                            type="button"
                            className={styles.richDocLink}
                            onClick={() => openDocLink(item)}
                          >
                            {item.linkLabel}
                            <NewWindow size="small" className={styles.richDocLinkIcon} aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {showFooter && (
                  <div className={`${styles.revealIn}`}>
                    <AgentReviewSummaryFooter onPrimaryAction={onGetCaughtUp} />
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

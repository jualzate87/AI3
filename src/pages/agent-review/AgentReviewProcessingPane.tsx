import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, CircleCheckFill, PopOut } from '@design-systems/icons'
import Badge from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Link } from '@ids-ts/link'
import '@ids-ts/link/dist/main.css'
import AgentReviewSummaryFooter from './AgentReviewSummaryFooter'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { openSourceDocumentReviewPopout } from '../../lib/prototypeRoutes'
import {
  CTA_CONTINUE_NEXT_FIX,
  CTA_SHOW_THINKING,
  CTA_VIEW,
  getActiveIntelligenceIssues,
  INTELLIGENCE_FIX_PROGRESS_SECTIONS,
  INTELLIGENCE_FIXES_DIVIDER_LABEL,
  INTELLIGENCE_FIXES_PROGRESS_TITLE,
  INTELLIGENCE_NEED_ACTION_COPY,
  INTELLIGENCE_PROGRESS_ITEMS,
  INTELLIGENCE_REASONING_STEPS,
  INTELLIGENCE_REMINDER_TITLE,
  INTELLIGENCE_SHELL_TITLE,
  intelligenceBadge,
  intelligenceCardTitle,
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
import chipStyles from '../../styles/agent-review/AgentReviewFooterChips.module.css'
import styles from '../../styles/agent-review/AgentReviewProcessingPane.module.css'

interface AgentReviewProcessingPaneProps {
  mode?: ProcessingMode
  compact?: boolean
  onViewUpdatedReturn: () => void
  onViewSourceDocuments: () => void
  onViewReturnSummary: () => void
  onGetCaughtUp: () => void
  onFooterChipsChange?: (chips: ReactNode | null) => void
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
}: AgentReviewProcessingPaneProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false)
  const fixSectionRefs = useRef<Record<number, HTMLElement | null>>({})

  const { issues, issueCount, totalWithholding } = useMemo(
    () => getActiveIntelligenceIssues(),
    [],
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
    if (!onFooterChipsChange) return

    if (!showSuggestionChips && !awaitingContinue) {
      onFooterChipsChange(null)
      return
    }

    if (awaitingContinue && !allFixesComplete) {
      onFooterChipsChange(
        <button
          type="button"
          className={chipStyles.chipPrimary}
          onClick={advanceToNextFix}
        >
          {CTA_CONTINUE_NEXT_FIX}
        </button>,
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
          <div className={styles.mainColumn}>
            <div className={styles.lockup}>
              <img src={intuitIntelligenceLogo} alt="" className={styles.sparkleIcon} />
              <h1 className={styles.title}>{INTELLIGENCE_SHELL_TITLE}</h1>
            </div>

            <p className={styles.intro}>{intelligenceProcessingIntro(issueCount, mode)}</p>

            <div className={styles.cardList}>
              {issues.map(issue => {
                const badge = intelligenceBadge(issue)
                return (
                  <article key={issue.issueKey} className={styles.card}>
                    <div className={styles.cardHeaderStatic}>
                      <span className={styles.cardTitle}>
                        {intelligenceCardTitle(issue, totalWithholding)}
                      </span>
                      <span className={`${styles.badge} ${styles[`badge_${badge.tone}`]}`}>
                        {badge.label}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>

            {phase === 'reasoning' && (
              <div
                className={`${styles.reasoningBlock} ${reasoningExiting ? styles.revealOut : ''}`}
              >
                <div
                  className={`${styles.reasoningHeader} ${reasoningHeaderVisible ? styles.revealIn : styles.revealHidden}`}
                >
                  <img src={intuitIntelligenceLogo} alt="" className={styles.reasoningSparkle} />
                  <span className={styles.reasoningTitle}>Applying fixes</span>
                </div>
                <ol className={styles.reasoningSteps}>
                  {INTELLIGENCE_REASONING_STEPS.map((step, index) => (
                    <li
                      key={step.title}
                      className={`${styles.reasoningStep} ${index < visibleSteps ? styles.revealIn : styles.revealHidden}`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <span className={styles.reasoningStepTitle}>{step.title}</span>
                      <p className={styles.reasoningStepBody}>{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
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

                <button
                  type="button"
                  className={styles.showThinkingBtn}
                  aria-expanded={thinkingExpanded}
                  onClick={() => setThinkingExpanded(v => !v)}
                >
                  {CTA_SHOW_THINKING}
                  <ChevronDown
                    size="small"
                    className={`${styles.chevron} ${thinkingExpanded ? styles.chevronUp : ''}`}
                  />
                </button>

                {thinkingExpanded && (
                  <ol className={styles.reasoningSteps}>
                    {INTELLIGENCE_REASONING_STEPS.map((step, index) => (
                      <li
                        key={step.title}
                        className={`${styles.reasoningStep} ${styles.revealIn}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <span className={styles.reasoningStepTitle}>{step.title}</span>
                        <p className={styles.reasoningStepBody}>{step.body}</p>
                      </li>
                    ))}
                  </ol>
                )}

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
                      {done && <CircleCheckFill size="x-small" className={styles.progressCheck} />}
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
      </div>

    </div>
  )
}

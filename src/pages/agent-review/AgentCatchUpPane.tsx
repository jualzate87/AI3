import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from '@design-systems/icons'
import { Checkbox } from '@ids-ts/checkbox'
import '@ids-ts/checkbox/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import {
  CATCH_UP_AI_REVIEW_BULLETS,
  CATCH_UP_AI_REVIEW_CALLOUT,
  CATCH_UP_AI_REVIEW_INTRO,
  CATCH_UP_CALCULATIONS_BULLETS,
  CATCH_UP_CALCULATIONS_INTRO,
  CATCH_UP_CHECKLIST_INTRO,
  CATCH_UP_CHECKLIST_ITEMS,
  CATCH_UP_DOCUMENTS_BULLETS,
  CATCH_UP_DOCUMENTS_INTRO,
  CATCH_UP_FOOTER_QUESTION,
  CATCH_UP_HANDOFF_PARAGRAPH,
  CATCH_UP_LOADING_SUBTEXT,
  CATCH_UP_LOADING_TITLE,
  getCatchUpPriorNotes,
  CATCH_UP_REASONING_STEPS,
  CATCH_UP_REASONING_TITLE,
  CATCH_UP_RETURN_STATUS_CALLOUT,
  CATCH_UP_RETURN_STATUS_ITEMS,
  CATCH_UP_REVIEWER_FOCUS_BULLETS,
  CATCH_UP_REVIEWER_FOCUS_INTRO,
  CATCH_UP_APPROVE_RETURN,
  CTA_SHOW_THINKING,
  STARTER_PROMPT_CATCH_UP,
  catchUpReturnSummaryTitle,
  type CatchUpListEntry,
} from './agentIntelligenceCopy'
import AgentReviewSummaryFooter from './AgentReviewSummaryFooter'
import { useCatchUpAnimation } from './useCatchUpAnimation'
import styles from '../../styles/agent-review/AgentCatchUpPane.module.css'

interface AgentCatchUpPaneProps {
  onViewUpdatedReturn: () => void
  onViewDocuments: () => void
  onApproveReturn: () => void
}

function BulletList({ items }: { items: readonly CatchUpListEntry[] }) {
  return (
    <ul className={styles.bulletList}>
      {items.map(item => (
        <li
          key={item.text}
          className={`${styles.bulletItem} ${item.emphasis ? styles.bulletItemEmphasis : styles.bulletItemDetail}`}
        >
          {item.text}
        </li>
      ))}
    </ul>
  )
}

function RevealBlock({
  visible,
  children,
  delayMs = 0,
}: {
  visible: boolean
  children: ReactNode
  delayMs?: number
}) {
  if (!visible) return null
  return (
    <div
      className={styles.revealIn}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}

export default function AgentCatchUpPane({
  onViewUpdatedReturn,
  onViewDocuments,
  onApproveReturn,
}: AgentCatchUpPaneProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const {
    isLoading,
    loadingSubphase,
    isReasoning,
    reasoningHeaderVisible,
    visibleReasoningSteps,
    reasoningExiting,
    showGenerating,
    generatingVisible,
    visibleBlocks,
    showControls,
  } = useCatchUpAnimation()

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.scrollArea}>
        <div className={styles.chatContent}>
          <div className={styles.userMessageRow}>
            <div className={styles.userBubble}>{STARTER_PROMPT_CATCH_UP}</div>
          </div>

          <div className={styles.agentResponse} aria-live="polite">
            {isLoading && (
              <div className={styles.loadingPane} aria-busy="true">
                {loadingSubphase === 'spinning' && (
                  <div className={styles.spinOnlyPhase}>
                    <div className={styles.spinningIcon}>
                      <img
                        src={intuitIntelligenceLogo}
                        alt=""
                        className={styles.spinningLogo}
                      />
                    </div>
                  </div>
                )}
                {(loadingSubphase === 'greeting' || loadingSubphase === 'exiting') && (
                  <div
                    className={
                      loadingSubphase === 'exiting'
                        ? styles.greetingExiting
                        : styles.greetingPhase
                    }
                  >
                    <div className={styles.spinningIcon}>
                      <img
                        src={intuitIntelligenceLogo}
                        alt=""
                        className={styles.spinningLogo}
                      />
                    </div>
                    <div className={styles.loadingCopy}>
                      <p className={styles.loadingTitle}>{CATCH_UP_LOADING_TITLE}</p>
                      <p className={styles.loadingSubtext}>{CATCH_UP_LOADING_SUBTEXT}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isReasoning && (
              <div
                className={`${styles.reasoningBlock} ${reasoningExiting ? styles.revealOut : ''}`}
              >
                <div
                  className={`${styles.reasoningHeader} ${reasoningHeaderVisible ? styles.revealIn : styles.revealHidden}`}
                >
                  <img src={intuitIntelligenceLogo} alt="" className={styles.reasoningSparkle} />
                  <span className={styles.reasoningTitle}>{CATCH_UP_REASONING_TITLE}</span>
                </div>
                <ol className={styles.reasoningSteps}>
                  {CATCH_UP_REASONING_STEPS.map((step, index) => (
                    <li
                      key={step.title}
                      className={`${styles.reasoningStep} ${index < visibleReasoningSteps ? styles.revealIn : styles.revealHidden}`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <span className={styles.reasoningStepTitle}>{step.title}</span>
                      <p className={styles.reasoningStepBody}>{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {showGenerating && generatingVisible && (
              <>
                <button
                  type="button"
                  className={`${styles.showThinkingBtn} ${styles.revealIn}`}
                  aria-expanded={thinkingExpanded}
                  onClick={() => setThinkingExpanded(v => !v)}
                >
                  {CTA_SHOW_THINKING}
                  {thinkingExpanded ? (
                    <ChevronUp size="small" className={styles.showThinkingIcon} />
                  ) : (
                    <ChevronDown size="small" className={styles.showThinkingIcon} />
                  )}
                </button>

                {thinkingExpanded && (
                  <ol className={styles.reasoningSteps}>
                    {CATCH_UP_REASONING_STEPS.map((step, index) => (
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

                <article className={styles.summaryDoc}>
                  <RevealBlock visible={visibleBlocks >= 1}>
                    <h1 className={styles.summaryTitle}>{catchUpReturnSummaryTitle()}</h1>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 2}>
                    <h2 className={styles.sectionHeading}>Notes from Sarah Chen (prior preparer)</h2>
                    <div className={styles.textStack}>
                      <p className={styles.bodyText}>{getCatchUpPriorNotes()}</p>
                      <p className={styles.bodyText}>{CATCH_UP_HANDOFF_PARAGRAPH}</p>
                    </div>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 3}>
                    <hr className={styles.divider} aria-hidden />
                    <h2 className={styles.sectionHeading}>1. AI review — all items resolved</h2>
                    <div className={styles.listGroup}>
                      <p className={styles.bodyText}>{CATCH_UP_AI_REVIEW_INTRO}</p>
                      <BulletList items={CATCH_UP_AI_REVIEW_BULLETS} />
                      <blockquote className={styles.callout}>{CATCH_UP_AI_REVIEW_CALLOUT}</blockquote>
                    </div>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 4}>
                    <hr className={styles.divider} aria-hidden />
                    <h2 className={styles.sectionHeading}>2. Data entry and reconciliation</h2>
                    <div className={styles.listGroup}>
                      <p className={styles.subheading}>Documents imported</p>
                      <p className={styles.bodyText}>{CATCH_UP_DOCUMENTS_INTRO}</p>
                      <BulletList items={CATCH_UP_DOCUMENTS_BULLETS} />
                    </div>
                    <div className={styles.listGroup}>
                      <p className={styles.subheading}>Calculations confirmed</p>
                      <p className={styles.bodyText}>{CATCH_UP_CALCULATIONS_INTRO}</p>
                      <BulletList items={CATCH_UP_CALCULATIONS_BULLETS} />
                    </div>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 5}>
                    <div className={styles.listGroup}>
                      <p className={styles.subheading}>3. Your focus as final reviewer</p>
                      <p className={styles.bodyText}>{CATCH_UP_REVIEWER_FOCUS_INTRO}</p>
                      <BulletList items={CATCH_UP_REVIEWER_FOCUS_BULLETS} />
                    </div>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 6}>
                    <hr className={styles.dividerWide} aria-hidden />
                    <h2 className={styles.sectionHeading}>4. Return status</h2>
                    <div className={styles.listGroup}>
                      <ol className={styles.numberedList}>
                        {CATCH_UP_RETURN_STATUS_ITEMS.map(item => (
                          <li key={item} className={styles.numberedItem}>
                            {item}
                          </li>
                        ))}
                      </ol>
                      <blockquote className={`${styles.callout} ${styles.calloutItalic}`}>
                        {CATCH_UP_RETURN_STATUS_CALLOUT}
                      </blockquote>
                    </div>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 7}>
                    <hr className={styles.dividerWide} aria-hidden />
                    <h2 className={styles.sectionHeading}>Final review checklist</h2>
                    <p className={styles.bodyText}>{CATCH_UP_CHECKLIST_INTRO}</p>
                    <div className={styles.checklist}>
                      {CATCH_UP_CHECKLIST_ITEMS.map(item => (
                        <Checkbox
                          key={item}
                          checked={checkedIds.has(item)}
                          onChange={() => toggleCheck(item)}
                          size="medium"
                        >
                          {item}
                        </Checkbox>
                      ))}
                    </div>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 8}>
                    <hr className={styles.dividerWide} aria-hidden />
                    <p className={styles.bodyText}>{CATCH_UP_FOOTER_QUESTION}</p>
                  </RevealBlock>
                </article>

                {showControls ? (
                  <div className={styles.revealIn}>
                    <AgentReviewSummaryFooter
                      showPrompt={false}
                      onViewUpdatedReturn={onViewUpdatedReturn}
                      onViewSourceDocuments={onViewDocuments}
                      onPrimaryAction={onApproveReturn}
                      primaryLabel={CATCH_UP_APPROVE_RETURN}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, type ReactNode } from 'react'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import {
  CATCH_UP_AI_REVIEW_CALLOUT,
  CATCH_UP_AI_REVIEW_INTRO,
  CATCH_UP_AI_REVIEW_ITEMS,
  CATCH_UP_CALCULATIONS_BULLETS,
  CATCH_UP_CALCULATIONS_INTRO,
  CATCH_UP_CHECKLIST_INTRO,
  CATCH_UP_CONFIRMED_BY_PREPARER,
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
  CATCH_UP_REVIEWER_CHECKLIST,
  CATCH_UP_REVIEWER_FOCUS_BULLETS,
  CATCH_UP_REVIEWER_FOCUS_INTRO,
  CATCH_UP_APPROVE_RETURN,
  STARTER_PROMPT_CATCH_UP,
  catchUpReturnSummaryTitle,
  type CatchUpDetailItem,
  type CatchUpListEntry,
} from './agentIntelligenceCopy'
import {
  AgentIntelligenceReasoningLive,
  AgentIntelligenceShowThinking,
} from './AgentIntelligenceReasoning'
import AgentReviewSummaryFooter from './AgentReviewSummaryFooter'
import CatchUpReviewChecklist from './CatchUpReviewChecklist'
import { useCatchUpAnimation } from './useCatchUpAnimation'
import styles from '../../styles/agent-review/AgentCatchUpPane.module.css'

interface AgentCatchUpPaneProps {
  onViewUpdatedReturn: () => void
  onViewDocuments: () => void
  onApproveReturn: () => void
}

function DetailList({ items }: { items: readonly CatchUpDetailItem[] }) {
  return (
    <ul className={styles.detailList}>
      {items.map(item => (
        <li key={item.title} className={styles.detailItem}>
          <p className={styles.detailTitle}>{item.title}</p>
          <p className={styles.detailBody}>{item.detail}</p>
        </li>
      ))}
    </ul>
  )
}

function SimpleBulletList({ items }: { items: readonly CatchUpListEntry[] }) {
  return (
    <ul className={styles.simpleBulletList}>
      {items.map(item => (
        <li
          key={item.text}
          className={item.emphasis ? styles.simpleBulletEmphasis : styles.simpleBullet}
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
    <div className={styles.revealIn} style={{ animationDelay: `${delayMs}ms` }}>
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
                      <img src={intuitIntelligenceLogo} alt="" className={styles.spinningLogo} />
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
                      <img src={intuitIntelligenceLogo} alt="" className={styles.spinningLogo} />
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
              <AgentIntelligenceReasoningLive
                title={CATCH_UP_REASONING_TITLE}
                steps={CATCH_UP_REASONING_STEPS}
                visibleSteps={visibleReasoningSteps}
                headerVisible={reasoningHeaderVisible}
                exiting={reasoningExiting}
              />
            )}

            {showGenerating && generatingVisible && (
              <>
                <AgentIntelligenceShowThinking
                  expanded={thinkingExpanded}
                  onToggle={() => setThinkingExpanded(v => !v)}
                  steps={CATCH_UP_REASONING_STEPS}
                />

                <article className={styles.summaryDoc}>
                  <RevealBlock visible={visibleBlocks >= 1}>
                    <h1 className={styles.summaryTitle}>{catchUpReturnSummaryTitle()}</h1>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 2}>
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>Notes from Sarah Chen (prior preparer)</h2>
                      <div className={styles.textStack}>
                        <blockquote className={styles.handoffQuote}>{getCatchUpPriorNotes()}</blockquote>
                        <p className={styles.bodyText}>{CATCH_UP_HANDOFF_PARAGRAPH}</p>
                      </div>
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 3}>
                    <hr className={styles.divider} aria-hidden />
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>1. AI review — all items resolved</h2>
                      <div className={styles.listGroup}>
                        <p className={styles.bodyText}>{CATCH_UP_AI_REVIEW_INTRO}</p>
                        <DetailList items={CATCH_UP_AI_REVIEW_ITEMS} />
                        <blockquote className={styles.callout}>{CATCH_UP_AI_REVIEW_CALLOUT}</blockquote>
                      </div>
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 4}>
                    <hr className={styles.divider} aria-hidden />
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>2. Data entry and reconciliation</h2>
                      <div className={styles.listGroup}>
                        <p className={styles.subheading}>Documents imported</p>
                        <p className={styles.bodyText}>{CATCH_UP_DOCUMENTS_INTRO}</p>
                        <SimpleBulletList items={CATCH_UP_DOCUMENTS_BULLETS} />
                      </div>
                      <div className={styles.listGroup}>
                        <p className={styles.subheading}>Calculations confirmed</p>
                        <p className={styles.bodyText}>{CATCH_UP_CALCULATIONS_INTRO}</p>
                        <SimpleBulletList items={CATCH_UP_CALCULATIONS_BULLETS} />
                      </div>
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 5}>
                    <hr className={styles.divider} aria-hidden />
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>3. Your focus as final reviewer</h2>
                      <div className={styles.listGroup}>
                        <p className={styles.bodyText}>{CATCH_UP_REVIEWER_FOCUS_INTRO}</p>
                        <SimpleBulletList items={CATCH_UP_REVIEWER_FOCUS_BULLETS} />
                      </div>
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 6}>
                    <hr className={styles.divider} aria-hidden />
                    <section className={styles.section}>
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
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 7}>
                    <hr className={styles.divider} aria-hidden />
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>Review checklist</h2>
                      <p className={styles.bodyText}>{CATCH_UP_CHECKLIST_INTRO}</p>
                      <CatchUpReviewChecklist
                        confirmedItems={CATCH_UP_CONFIRMED_BY_PREPARER}
                        reviewItems={CATCH_UP_REVIEWER_CHECKLIST}
                        checkedIds={checkedIds}
                        onToggle={toggleCheck}
                      />
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 8}>
                    <hr className={styles.divider} aria-hidden />
                    <p className={styles.footerPrompt}>{CATCH_UP_FOOTER_QUESTION}</p>
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

import { useState, type ReactNode } from 'react'
import { CircleCheck, CircleCheckFill, NewWindow } from '@design-systems/icons'
import {
  CATCH_UP_FOOTER_QUESTION,
  getCatchUpContent,
  getCatchUpPriorNotes,
  CATCH_UP_REASONING_TITLE,
  STARTER_PROMPT_CATCH_UP,
  catchUpReturnSummaryTitle,
  type CatchUpChecklistItem,
  type CatchUpDetailItem,
  type CatchUpDocLink,
  type CatchUpListEntry,
} from './agentIntelligenceCopy'
import { getCurrentUser } from '../../lib/returnWorkflow'
import {
  AgentIntelligenceReasoningLive,
  AgentIntelligenceShowThinking,
} from './AgentIntelligenceReasoning'
import AgentReviewSummaryFooter from './AgentReviewSummaryFooter'
import { useCatchUpAnimation } from './useCatchUpAnimation'
import { openDocOrFormLink } from '../../lib/prototypeRoutes'
import styles from '../../styles/agent-review/AgentCatchUpPane.module.css'

interface AgentCatchUpPaneProps {
  onApproveReturn: () => void
  /** Reopening an existing conversation — show the finished summary without replaying it. */
  resumed?: boolean
}

function openDocLink(link: CatchUpDocLink) {
  openDocOrFormLink({
    tab: link.popoutTab,
    subTab: link.popoutSubTab,
    divPayer: link.divPayer,
    field: link.field,
    formId: link.formId,
  })
}

/** Blue source-link chip — same treatment as the review experience's fix results. */
function DocLink({ link }: { link: CatchUpDocLink }) {
  return (
    <button
      type="button"
      className={styles.docLink}
      aria-label={`${link.docLabel} (opens in a new window)`}
      onClick={() => openDocLink(link)}
    >
      {link.docLabel}
      <NewWindow size="small" className={styles.docLinkIcon} aria-hidden />
    </button>
  )
}

function DetailList({ items }: { items: readonly CatchUpDetailItem[] }) {
  return (
    <ul className={styles.detailList}>
      {items.map((item) => (
        <li key={item.title} className={styles.detailItem}>
          <p className={styles.detailTitle}>{item.title}</p>
          <p className={styles.detailBody}>{item.detail}</p>
          {item.link ? <DocLink link={item.link} /> : null}
        </li>
      ))}
    </ul>
  )
}

function ReviewCheckList({
  items,
  checkedIds,
  onToggle,
}: {
  items: readonly CatchUpChecklistItem[]
  checkedIds: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <ul className={styles.checkList}>
      {items.map((item) => {
        const checked = checkedIds.has(item.id)
        return (
          <li key={item.id} className={styles.checkItem}>
            <button
              type="button"
              className={styles.checkToggle}
              aria-pressed={checked}
              aria-label={
                checked
                  ? `Mark "${item.title}" as not confirmed`
                  : `Mark "${item.title}" as confirmed`
              }
              onClick={() => onToggle(item.id)}
            >
              {checked ? (
                <CircleCheckFill size="small" className={styles.checkIconDone} aria-hidden />
              ) : (
                <CircleCheck size="small" className={styles.checkIcon} aria-hidden />
              )}
            </button>
            <div className={styles.checkBody}>
              <span className={`${styles.checkTitle} ${checked ? styles.checkTitleDone : ''}`}>
                {item.title}
              </span>
              {item.note ? <p className={styles.checkNote}>{item.note}</p> : null}
              {item.link ? <DocLink link={item.link} /> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function SimpleBulletList({ items }: { items: readonly CatchUpListEntry[] }) {
  return (
    <ul className={styles.simpleBulletList}>
      {items.map((item) => (
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
  onApproveReturn,
  resumed = false,
}: AgentCatchUpPaneProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  /** Read once — the summary narrates the handoff as it stood when the pane opened. */
  const [content] = useState(() => getCatchUpContent(getCurrentUser().role))

  const {
    isReasoning,
    reasoningHeaderVisible,
    visibleReasoningSteps,
    reasoningExiting,
    showGenerating,
    generatingVisible,
    visibleBlocks,
    showControls,
  } = useCatchUpAnimation(resumed)

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
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
            {isReasoning && (
              <AgentIntelligenceReasoningLive
                title={CATCH_UP_REASONING_TITLE}
                steps={content.reasoningSteps}
                visibleSteps={visibleReasoningSteps}
                headerVisible={reasoningHeaderVisible}
                exiting={reasoningExiting}
                working={!reasoningExiting}
              />
            )}

            {showGenerating && generatingVisible && (
              <>
                <AgentIntelligenceShowThinking
                  expanded={thinkingExpanded}
                  onToggle={() => setThinkingExpanded((v) => !v)}
                  steps={content.reasoningSteps}
                />

                <article className={styles.summaryDoc}>
                  <RevealBlock visible={visibleBlocks >= 1}>
                    <h1 className={styles.summaryTitle}>{catchUpReturnSummaryTitle()}</h1>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 2}>
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>{content.notesHeading}</h2>
                      <div className={styles.textStack}>
                        <blockquote className={styles.handoffQuote}>
                          {getCatchUpPriorNotes()}
                        </blockquote>
                        <p className={styles.bodyText}>{content.handoffParagraph}</p>
                      </div>
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 3}>
                    <hr className={styles.divider} aria-hidden />
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>{content.workHeading}</h2>
                      <div className={styles.listGroup}>
                        <p className={styles.bodyText}>{content.workIntro}</p>
                        <DetailList items={content.workItems} />
                        <blockquote className={styles.callout}>{content.workCallout}</blockquote>
                      </div>
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 4}>
                    <hr className={styles.divider} aria-hidden />
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>2. Data entry and reconciliation</h2>
                      <div className={styles.listGroup}>
                        <p className={styles.subheading}>Documents imported</p>
                        <p className={styles.bodyText}>{content.documentsIntro}</p>
                        <SimpleBulletList items={content.documentsBullets} />
                      </div>
                      <div className={styles.listGroup}>
                        <p className={styles.subheading}>Calculations confirmed</p>
                        <p className={styles.bodyText}>{content.calculationsIntro}</p>
                        <SimpleBulletList items={content.calculationsBullets} />
                      </div>
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 5}>
                    <hr className={styles.divider} aria-hidden />
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>{content.focusHeading}</h2>
                      <div className={styles.listGroup}>
                        <p className={styles.bodyText}>{content.focusIntro}</p>
                        <ReviewCheckList
                          items={content.checklist}
                          checkedIds={checkedIds}
                          onToggle={toggleCheck}
                        />
                      </div>
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 6}>
                    <hr className={styles.divider} aria-hidden />
                    <section className={styles.section}>
                      <h2 className={styles.sectionHeading}>4. Return status</h2>
                      <div className={styles.listGroup}>
                        <ol className={styles.numberedList}>
                          {content.statusItems.map((item) => (
                            <li key={item} className={styles.numberedItem}>
                              {item}
                            </li>
                          ))}
                        </ol>
                        <blockquote className={`${styles.callout} ${styles.calloutItalic}`}>
                          {content.statusCallout}
                        </blockquote>
                      </div>
                    </section>
                  </RevealBlock>

                  <RevealBlock visible={visibleBlocks >= 7}>
                    <hr className={styles.divider} aria-hidden />
                    <p className={styles.footerPrompt}>{CATCH_UP_FOOTER_QUESTION}</p>
                  </RevealBlock>
                </article>

                {showControls ? (
                  <div className={styles.revealIn}>
                    <AgentReviewSummaryFooter
                      showPrompt={false}
                      onPrimaryAction={onApproveReturn}
                      primaryLabel={content.primaryAction}
                      actionVariant="button"
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

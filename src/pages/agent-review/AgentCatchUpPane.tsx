import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ThumbDown,
  ThumbUp,
} from '@design-systems/icons'
import { Checkbox } from '@ids-ts/checkbox'
import '@ids-ts/checkbox/dist/main.css'
import {
  CATCH_UP_AI_REVIEW_BULLETS,
  CATCH_UP_AI_REVIEW_CALLOUT,
  CATCH_UP_AI_REVIEW_INTRO,
  CATCH_UP_CALCULATIONS_BULLETS,
  CATCH_UP_CALCULATIONS_INTRO,
  CATCH_UP_CHECKLIST_INTRO,
  CATCH_UP_CHECKLIST_ITEMS,
  CATCH_UP_CHIP_APPROVE_RETURN,
  CATCH_UP_CHIP_SHOW_REVIEW_LOG,
  CATCH_UP_CHIP_VIEW_DOCUMENTS,
  CATCH_UP_DOCUMENTS_BULLETS,
  CATCH_UP_DOCUMENTS_INTRO,
  CATCH_UP_FOOTER_QUESTION,
  CATCH_UP_HANDOFF_PARAGRAPH,
  CATCH_UP_PRIOR_NOTES,
  CATCH_UP_RETURN_STATUS_CALLOUT,
  CATCH_UP_RETURN_STATUS_ITEMS,
  CATCH_UP_REVIEWER_FOCUS_BULLETS,
  CATCH_UP_REVIEWER_FOCUS_INTRO,
  CTA_SHOW_THINKING,
  STARTER_PROMPT_CATCH_UP,
  catchUpReturnSummaryTitle,
} from './agentIntelligenceCopy'
import styles from '../../styles/agent-review/AgentCatchUpPane.module.css'

interface AgentCatchUpPaneProps {
  onViewDocuments: () => void
  onShowReviewLog: () => void
  onApproveReturn: () => void
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className={styles.bulletList}>
      {items.map(item => (
        <li key={item} className={styles.bulletItem}>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function AgentCatchUpPane({
  onViewDocuments,
  onShowReviewLog,
  onApproveReturn,
}: AgentCatchUpPaneProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

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

          <div className={styles.agentResponse}>
            <button
              type="button"
              className={styles.showThinkingBtn}
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
              <p className={styles.thinkingBody}>
                Reviewing prior preparer notes, resolved Intuit Intelligence flags, imported
                documents, and what still needs final reviewer confirmation.
              </p>
            )}

            <article className={styles.summaryDoc}>
              <h1 className={styles.summaryTitle}>{catchUpReturnSummaryTitle()}</h1>

              <h2 className={styles.sectionHeading}>Notes from Sarah Chen (prior preparer)</h2>
              <p className={styles.bodyText}>{CATCH_UP_PRIOR_NOTES}</p>
              <p className={styles.bodyText}>{CATCH_UP_HANDOFF_PARAGRAPH}</p>

              <hr className={styles.divider} />

              <h2 className={styles.sectionHeading}>1. AI review — all items resolved</h2>
              <p className={styles.bodyText}>{CATCH_UP_AI_REVIEW_INTRO}</p>
              <BulletList items={CATCH_UP_AI_REVIEW_BULLETS} />
              <blockquote className={styles.callout}>{CATCH_UP_AI_REVIEW_CALLOUT}</blockquote>

              <hr className={styles.divider} />

              <h2 className={styles.sectionHeading}>2. Data entry and reconciliation</h2>
              <p className={styles.subheading}>Documents imported</p>
              <p className={styles.bodyText}>{CATCH_UP_DOCUMENTS_INTRO}</p>
              <BulletList items={CATCH_UP_DOCUMENTS_BULLETS} />
              <p className={styles.subheading}>Calculations confirmed</p>
              <p className={styles.bodyText}>{CATCH_UP_CALCULATIONS_INTRO}</p>
              <BulletList items={CATCH_UP_CALCULATIONS_BULLETS} />

              <p className={styles.subheading}>3. Your focus as final reviewer</p>
              <p className={styles.bodyText}>{CATCH_UP_REVIEWER_FOCUS_INTRO}</p>
              <BulletList items={CATCH_UP_REVIEWER_FOCUS_BULLETS} />

              <hr className={styles.dividerWide} />

              <h2 className={styles.sectionHeading}>4. Return status</h2>
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

              <hr className={styles.dividerWide} />

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

              <hr className={styles.dividerWide} />

              <p className={styles.bodyText}>{CATCH_UP_FOOTER_QUESTION}</p>
            </article>

            <div className={styles.cardControlBar}>
              <button type="button" className={styles.iconBtn} aria-label="Copy">
                <Copy size="small" />
              </button>
              <button type="button" className={styles.iconBtn} aria-label="Download">
                <Download size="small" />
              </button>
              <button type="button" className={styles.iconBtn} aria-label="Like">
                <ThumbUp size="small" />
              </button>
              <button type="button" className={styles.iconBtn} aria-label="Dislike">
                <ThumbDown size="small" />
              </button>
            </div>

            <div className={styles.suggestionChipsRow}>
              <button type="button" className={styles.suggestionChip} onClick={onViewDocuments}>
                {CATCH_UP_CHIP_VIEW_DOCUMENTS}
              </button>
              <button type="button" className={styles.suggestionChip} onClick={onShowReviewLog}>
                {CATCH_UP_CHIP_SHOW_REVIEW_LOG}
              </button>
              <button type="button" className={styles.suggestionChip} onClick={onApproveReturn}>
                {CATCH_UP_CHIP_APPROVE_RETURN}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

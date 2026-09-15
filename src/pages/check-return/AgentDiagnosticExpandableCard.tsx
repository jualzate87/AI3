import { useState } from 'react'
import { ChevronDown, ChevronUp, NewWindow } from '@design-systems/icons'
import { Badge, InfoBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Checkbox } from '@ids-ts/checkbox'
import '@ids-ts/checkbox/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
import AgentSparkleIcon from '../../components/AgentSparkleIcon/AgentSparkleIcon'
import type { AgentReviewCardModel } from '../../lib/agentDiagnosisReview'
import { openAgentViewLinkInWindow } from '../../lib/agentAutoFix'
import type { Phase2IssueKey } from '../data-review/phase2FlagSync'
import styles from '../../styles/check-return/AgentDiagnosticExpandableCard.module.css'

type Props = {
  card: AgentReviewCardModel
  /** Controlled expanded state (accordion parent owns this). */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  canFix?: boolean
  onFix?: (issueKey: Phase2IssueKey) => void
  /** When true, card is in a stacked accordion list (shared container styling). */
  inAccordionList?: boolean
  /** First/last item in accordion list for corner radius. */
  accordionPosition?: 'first' | 'middle' | 'last' | 'only'
}

function badgeStatusForCard(
  card: AgentReviewCardModel,
): 'warning' | 'success' | 'info' | 'pending' {
  if (card.badgeStatus === 'success') return 'success'
  if (card.badgeStatus === 'info') return 'info'
  if (card.badgeStatus === 'pending') return 'pending'
  if (card.variant === 'needs-review') return 'pending'
  return 'warning'
}

function isImportLayout(headers: string[]): boolean {
  return headers[0] === 'Field'
}

export default function AgentDiagnosticExpandableCard({
  card,
  expanded,
  onExpandedChange,
  canFix = false,
  onFix,
  inAccordionList = false,
  accordionPosition = 'only',
}: Props) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const importLayout = isImportLayout(card.tableHeaders)
  const visibleHeaders = card.tableHeaders.map(h => (h.length > 0 ? h : 'Action'))
  const tableLayoutClass = importLayout ? styles.tableLayoutImport : styles.tableLayoutStandard

  const accordionPosClass =
    inAccordionList && accordionPosition === 'first'
      ? styles.accordionItemFirst
      : inAccordionList && accordionPosition === 'middle'
        ? styles.accordionItemMiddle
        : inAccordionList && accordionPosition === 'last'
          ? styles.accordionItemLast
          : ''

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <article
      className={`${styles.card} ${inAccordionList ? styles.cardInList : ''} ${accordionPosClass}`}
      data-variant={card.variant}
      data-expanded={expanded ? 'true' : 'false'}
    >
      <button
        type="button"
        className={styles.cardHeaderBtn}
        onClick={() => onExpandedChange(!expanded)}
        aria-expanded={expanded}
      >
        <div className={styles.cardHeaderMain}>
          <div className={styles.titleRow}>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            {card.metaSubtitle && (
              <>
                <span className={styles.titleDot} aria-hidden>
                  ·
                </span>
                <span className={styles.cardMeta}>{card.metaSubtitle}</span>
              </>
            )}
            <span className={styles.categoryBadge}>
              <Badge
                status={badgeStatusForCard(card)}
                priority={card.badgePriority}
                capitalization={card.badgeCapitalization}
                icon={
                  card.showBadgeIcon &&
                  card.badgePriority === 'secondary' &&
                  card.badgeCapitalization === 'sentence'
                    ? InfoBadgeIcon
                    : undefined
                }
              >
                {card.badgeLabel}
              </Badge>
            </span>
          </div>
          {!expanded && <p className={styles.cardSummary}>{card.summary}</p>}
        </div>
        <span className={styles.cardChevron} aria-hidden>
          {expanded ? <ChevronUp size="small" /> : <ChevronDown size="small" />}
        </span>
      </button>

      {expanded && (
        <div className={styles.cardBody}>
          <p className={styles.cardSummary}>{card.summary}</p>

          {card.rootCause && (
            <div className={styles.whatHappened}>
              <p className={styles.sectionLabel}>
                {card.variant === 'verified' ? 'What I verified' : 'What happened'}
              </p>
              <p className={styles.sectionBody}>{card.rootCause}</p>
            </div>
          )}

          {card.tableRows.length > 0 && (
            <div className={styles.tableCard}>
              <div className={`${styles.tableHeader} ${tableLayoutClass}`}>
                {visibleHeaders.map(header => (
                  <span
                    key={header}
                    className={`${styles.tableHeaderCell} ${header === 'Action' ? styles.alignEnd : ''}`}
                  >
                    {header}
                  </span>
                ))}
              </div>
              {card.tableRows.map(row => {
                const dataCols = importLayout ? row.cols.slice(0, 3) : row.cols.filter(c => c.length > 0)

                return (
                  <div
                    key={row.id}
                    className={`${styles.tableRow} ${tableLayoutClass} ${row.total ? styles.tableRowTotal : ''}`}
                  >
                    {card.variant === 'needs-review' && row.checklist ? (
                      <div className={styles.checklistCell}>
                        <Checkbox
                          checked={checkedIds.has(row.id)}
                          onChange={() => toggleCheck(row.id)}
                          size="small"
                        >
                          {row.label}
                        </Checkbox>
                      </div>
                    ) : (
                      <span className={styles.rowLabelLink}>{row.label}</span>
                    )}

                    {dataCols.map((col, ci) => (
                      <span
                        key={ci}
                        className={`${styles.tableCell} ${importLayout && ci === 1 ? styles.tableCellEmphasis : ''} ${!importLayout && ci === 1 ? styles.tableCellMuted : ''}`}
                      >
                        {col}
                      </span>
                    ))}

                    <div className={styles.actionCell}>
                      {row.viewLink ? (
                        <LinkActionButton
                          size="small"
                          weight="regular"
                          alignment="right"
                          onClick={() => openAgentViewLinkInWindow(row.viewLink!)}
                          aria-label={`${row.viewLink.label} (opens in a new window)`}
                        >
                          <span className={styles.viewLinkContent}>
                            {row.viewLink.label}
                            <NewWindow size="small" className={styles.viewLinkIcon} aria-hidden />
                          </span>
                        </LinkActionButton>
                      ) : card.variant === 'needs-review' && row.checklist ? (
                        <span className={styles.checklistHint}>
                          {checkedIds.has(row.id) ? 'Reviewed' : 'Pending'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {card.suggestedActions && card.suggestedActions.length > 0 && card.variant !== 'verified' && (
            <div className={styles.suggestedFix}>
              <div className={styles.suggestedFixHeader}>
                <AgentSparkleIcon size="medium" className={styles.suggestedFixIcon} />
                <span className={styles.suggestedFixTitle}>
                  {card.variant === 'needs-review' ? 'Suggested next steps' : 'Suggested fix'}
                </span>
              </div>
              <ul className={styles.suggestedFixList}>
                {card.suggestedActions.map(tip => (
                  <li key={tip} className={styles.suggestedFixItem}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canFix && card.issueKey && onFix && (
            <div className={styles.cardFooter}>
              <Button priority="primary" size="small" onClick={() => onFix(card.issueKey!)}>
                Fix this
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from '@design-systems/icons'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Checkbox } from '@ids-ts/checkbox'
import '@ids-ts/checkbox/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import type { AgentReviewCardModel } from '../../lib/agentDiagnosisReview'
import type { AgentViewLink } from '../../lib/agentAutoFix'
import type { Phase2IssueKey } from '../data-review/phase2FlagSync'
import styles from '../../styles/check-return/AgentDiagnosticExpandableCard.module.css'

type Props = {
  card: AgentReviewCardModel
  defaultExpanded?: boolean
  /** When true, collapse the card (e.g. after the user starts a fix run). */
  forceCollapsed?: boolean
  canFix?: boolean
  onFix?: (issueKey: Phase2IssueKey) => void
  onOpenEvidence: (link: AgentViewLink) => void
}

function badgeStatusForCard(
  card: AgentReviewCardModel,
): 'warning' | 'success' | 'info' {
  if (card.badgeStatus === 'success') return 'success'
  if (card.badgeStatus === 'info') return 'info'
  if (card.variant === 'needs-review') return 'info'
  return 'warning'
}

function isImportLayout(headers: string[]): boolean {
  return headers[0] === 'Field'
}

export default function AgentDiagnosticExpandableCard({
  card,
  defaultExpanded = true,
  forceCollapsed = false,
  canFix = false,
  onFix,
  onOpenEvidence,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  useEffect(() => {
    if (forceCollapsed) setExpanded(false)
  }, [forceCollapsed])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const importLayout = isImportLayout(card.tableHeaders)
  const visibleHeaders = card.tableHeaders.map(h => (h.length > 0 ? h : 'Action'))
  const tableLayoutClass = importLayout ? styles.tableLayoutImport : styles.tableLayoutStandard

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <article className={styles.card} data-variant={card.variant}>
      <button
        type="button"
        className={styles.cardHeaderBtn}
        onClick={() => setExpanded(open => !open)}
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
            <Badge
              status={badgeStatusForCard(card)}
              label={card.badgeLabel}
              capitalization="caps"
              priority="primary"
            />
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
                          onClick={() => onOpenEvidence(row.viewLink!)}
                        >
                          {row.viewLink.label}
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
                <img
                  src={intuitIntelligenceLogo}
                  alt=""
                  className={styles.suggestedFixIcon}
                  aria-hidden
                />
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

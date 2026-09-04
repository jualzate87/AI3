import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Send } from '@design-systems/icons'
import { Badge, InfoBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { computeLiveReturn } from '../../data/liveReturn'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import { openSourceDocumentReviewPopout } from '../../lib/prototypeRoutes'
import { buildAllDiagnosticIssues, ISSUE_FIELD } from '../data-review/AgentReportPane'
import {
  getOutstandingImportMismatches,
  getPhase2Progress,
  type Phase2IssueKey,
} from '../data-review/phase2FlagSync'
import {
  AI_DIAGNOSTIC_CATEGORIES,
  categoryForIssueKey,
  primaryIssueKeyForCategory,
  type AiDiagnosticCategoryId,
} from './aiDiagnosticCategories'
import styles from '../../styles/check-return/AiDiagnosticsPanel.module.css'

export type AiDiagnosticsView = 'overview' | 'detail'

interface AiDiagnosticsPanelProps {
  view: AiDiagnosticsView
  selectedIssueKey: Phase2IssueKey | null
  onViewChange: (view: AiDiagnosticsView, issueKey?: Phase2IssueKey | null) => void
}

function AiChatInput({ placeholder }: { placeholder: string }) {
  const [value, setValue] = useState('')

  return (
    <div className={styles.chatWrapper}>
      <div className={styles.chatBox}>
        <div className={styles.chatInputRow}>
          <input
            type="text"
            className={styles.chatInput}
            placeholder={placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            aria-label={placeholder}
          />
          <IconControl
            className={styles.chatSend}
            aria-label="Send message"
            onClick={() => setValue('')}
          >
            <Send size="medium" />
          </IconControl>
        </div>
        <a
          className={styles.disclaimerLink}
          href="https://www.intuit.com/legal/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Important information about how we use generative AI
        </a>
      </div>
    </div>
  )
}

export default function AiDiagnosticsPanel({
  view,
  selectedIssueKey,
  onViewChange,
}: AiDiagnosticsPanelProps) {
  const { amounts, reviewedFields, markReviewed } = useSyncedReviewState()
  const live = useMemo(() => computeLiveReturn(amounts), [amounts])
  const allIssues = useMemo(() => buildAllDiagnosticIssues(live, amounts), [live, amounts])
  const progress = useMemo(
    () => getPhase2Progress({ reviewedFields, live, amounts }),
    [reviewedFields, live, amounts],
  )
  const importMismatchCount = getOutstandingImportMismatches(amounts).length
  const activeKeys = progress.activeKeys

  const complianceCount = AI_DIAGNOSTIC_CATEGORIES.find(c => c.id === 'compliance')!
    .issueKeys.filter(k => activeKeys.includes(k)).length
  const optimizationCount = activeKeys.includes('optItemize') ? 1 : 0

  const [expandedCategory, setExpandedCategory] = useState<AiDiagnosticCategoryId | null>(
    'import-mismatches',
  )

  const selectedIssue = selectedIssueKey
    ? allIssues.find(i => i.issueKey === selectedIssueKey) ?? null
    : null

  const openDetail = (issueKey: Phase2IssueKey) => {
    onViewChange('detail', issueKey)
  }

  const handleViewSourceForField = (field?: string, tab?: string) => {
    openSourceDocumentReviewPopout({
      tab,
      field,
    })
  }

  if (view === 'detail' && selectedIssue) {
    const category = categoryForIssueKey(selectedIssue.issueKey)
    const mismatchRows =
      selectedIssue.issueKey === 'importMismatches'
        ? getOutstandingImportMismatches(amounts)
        : []

    return (
      <div className={styles.panel}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => onViewChange('overview', null)}
        >
          ← Back to AI Diagnostics
        </button>

        <div className={styles.detailHeader}>
          {category && (
            <Badge
              status={category.badgeStatus === 'success' ? 'success' : 'warning'}
              priority="primary"
              capitalization="caps"
              label={category.badgeLabel}
              icon={InfoBadgeIcon}
            />
          )}
          <h1 className={styles.detailTitle}>{selectedIssue.title}</h1>
          <p className={styles.detailSubtitle}>
            {selectedIssue.issueKey === 'importMismatches'
              ? `${mismatchRows.length} field${mismatchRows.length === 1 ? '' : 's'} on this return disagree with the source documents.`
              : selectedIssue.summary}
          </p>
        </div>

        <div className={styles.explanationCard}>
          <div className={styles.explanationHeader}>
            <div className={styles.logoGroup}>
              <img src={intuitIntelligenceLogo} alt="" className={styles.logoIcon} />
              <span className={styles.wordmark}>Intuit Intelligence</span>
            </div>
            <span className={styles.explanationMeta}>Analyzed just now</span>
          </div>
          <div className={styles.explanationBlock}>
            <p className={styles.explanationLabel}>What happened</p>
            <p className={styles.explanationBody}>{selectedIssue.rootCause}</p>
          </div>
          <div className={styles.explanationBlock}>
            <p className={styles.explanationLabel}>Why it matters</p>
            <p className={styles.explanationBody}>{selectedIssue.taxImpact}</p>
          </div>
        </div>

        {mismatchRows.length > 0 && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span>Field</span>
              <span>On return</span>
              <span>On source</span>
              <span className={styles.tableHeaderAction}>Action</span>
            </div>
            {mismatchRows.map(row => (
              <div key={row.id} className={styles.tableRow}>
                <LinkActionButton
                  className={styles.fieldLink}
                  size="small"
                  onClick={() => handleViewSourceForField(row.field, row.tab)}
                >
                  {row.label}
                </LinkActionButton>
                <span>{row.returnValue}</span>
                <strong>{row.sourceValue}</strong>
                <span className={styles.tableHeaderAction}>
                  <Button
                    priority="primary"
                    size="small"
                    onClick={() => handleViewSourceForField(row.field, row.tab)}
                  >
                    View source
                  </Button>
                </span>
              </div>
            ))}
          </div>
        )}

        {selectedIssue.suggestedActions.length > 0 && (
          <div className={styles.tipsCard}>
            <div className={styles.logoGroup}>
              <img src={intuitIntelligenceLogo} alt="" className={styles.logoIcon} />
              <span className={styles.wordmark}>Tips from Intuit Assist</span>
            </div>
            <ul className={styles.tipsList}>
              {selectedIssue.suggestedActions.slice(0, 3).map(tip => {
                const colonIdx = tip.indexOf(':')
                const lead = colonIdx > 0 ? tip.slice(0, colonIdx) : tip.split(' ').slice(0, 4).join(' ')
                const rest = colonIdx > 0 ? tip.slice(colonIdx) : tip.slice(lead.length)
                return (
                  <li key={tip} className={styles.tipItem}>
                    <span aria-hidden>•</span>
                    <span>
                      <span className={styles.tipStrong}>{lead}</span>
                      {rest}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {selectedIssue.sources?.[0] && (
          <div className={styles.sourceRow}>
            <a
              className={styles.sourceChip}
              href={selectedIssue.sources[0].href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {selectedIssue.sources[0].title}
            </a>
            <span className={styles.sourceNote}>
              — {selectedIssue.sources[0].description}
            </span>
          </div>
        )}

        <div className={styles.actionBar}>
          <Button
            priority="primary"
            size="medium"
            onClick={() => {
              const first = mismatchRows[0]
              if (first) {
                handleViewSourceForField(first.field, first.tab)
              } else {
                handleViewSourceForField(
                  selectedIssue.viewSourceField ?? ISSUE_FIELD[selectedIssue.issueKey],
                  selectedIssue.viewSourceTab,
                )
              }
            }}
          >
            Go to first mismatch
          </Button>
          <Button
            priority="secondary"
            size="medium"
            onClick={() => markReviewed(selectedIssue.issueKey)}
            disabled={reviewedFields.has(selectedIssue.issueKey)}
          >
            {reviewedFields.has(selectedIssue.issueKey) ? 'Reviewed' : 'Mark as reviewed'}
          </Button>
        </div>

        <AiChatInput placeholder="Ask about this diagnostic..." />
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.headerArea}>
        <div className={styles.logoTitleRow}>
          <div className={styles.logoGroup}>
            <img src={intuitIntelligenceLogo} alt="" className={styles.logoIcon} />
            <span className={styles.wordmark}>Intuit Intelligence</span>
          </div>
          <span className={styles.titleDivider} aria-hidden />
          <h1 className={styles.pageTitle}>AI Diagnostics</h1>
        </div>
        <p className={styles.introText}>
          I&apos;ve reviewed Jordan&apos;s 2025 return and found {progress.total} item
          {progress.total === 1 ? '' : 's'} that need attention before filing.
        </p>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryMetrics}>
          <span className={styles.summaryMetric}>
            <span className={`${styles.metricDot} ${styles.metricDotWarning}`} aria-hidden />
            {importMismatchCount} import mismatch{importMismatchCount === 1 ? '' : 'es'}
          </span>
          <span className={styles.summaryMetric}>
            <span className={`${styles.metricDot} ${styles.metricDotWarning}`} aria-hidden />
            {complianceCount} compliance check{complianceCount === 1 ? '' : 's'}
          </span>
          <span className={styles.summaryMetric}>
            <span className={`${styles.metricDot} ${styles.metricDotSuccess}`} aria-hidden />
            {optimizationCount} optimization
          </span>
        </div>
        <span className={styles.reviewStatus}>
          {progress.reviewed} of {progress.total} reviewed
        </span>
      </div>

      <div className={styles.findingsStack}>
        {AI_DIAGNOSTIC_CATEGORIES.map(category => {
          const visibleKeys = category.issueKeys.filter(k => activeKeys.includes(k))
          if (visibleKeys.length === 0) return null

          const isExpanded = expandedCategory === category.id
          const itemCount =
            category.id === 'import-mismatches'
              ? importMismatchCount
              : visibleKeys.length

          return (
            <div
              key={category.id}
              className={`${styles.findingCard} ${isExpanded ? '' : styles.findingCardCollapsed}`}
            >
              <button
                type="button"
                className={styles.findingHeader}
                aria-expanded={isExpanded}
                onClick={() =>
                  setExpandedCategory(prev => (prev === category.id ? null : category.id))
                }
              >
                <span className={styles.findingHeaderLeft}>
                  <span className={styles.findingTitle}>{category.title}</span>
                  <Badge
                    status={category.badgeStatus === 'success' ? 'success' : 'warning'}
                    priority="primary"
                    capitalization="caps"
                    label={category.badgeLabel}
                    icon={InfoBadgeIcon}
                  />
                  {!isExpanded && (
                    <span className={styles.itemCount}>• {itemCount} item{itemCount === 1 ? '' : 's'}</span>
                  )}
                </span>
                {isExpanded ? (
                  <ChevronUp size="small" className={styles.findingChevron} aria-hidden />
                ) : (
                  <ChevronDown size="small" className={styles.findingChevron} aria-hidden />
                )}
              </button>

              {isExpanded && (
                <>
                  <p className={styles.findingDescription}>{category.description}</p>
                  <div className={styles.findingActions}>
                    <Button
                      priority="primary"
                      size="small"
                      onClick={() => {
                        const key = primaryIssueKeyForCategory(category.id, activeKeys)
                        if (key) openDetail(key)
                      }}
                    >
                      Review diagnostic
                    </Button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <AiChatInput placeholder="Ask about Jordan's return..." />
    </div>
  )
}

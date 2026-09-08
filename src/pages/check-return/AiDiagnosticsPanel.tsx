import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronUp, Send } from '@design-systems/icons'
import { Badge, SuccessBadgeIcon, WarningBadgeIcon } from '@ids-ts/badge'
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
import { SOURCE_DOCUMENTS } from '../../data/sourceDocuments'
import { openSourceDocumentReviewPopout } from '../../lib/prototypeRoutes'
import { buildAllDiagnosticIssues } from '../data-review/AgentReportPane'
import {
  CHECKED_NO_ACTION_ITEMS,
  getImportMismatchTaxImpact,
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

function categoryBadgeStatus(
  status: (typeof AI_DIAGNOSTIC_CATEGORIES)[number]['badgeStatus'],
): 'warning' | 'success' {
  return status
}

const formatUsd = (n: number) => `$${Math.round(n).toLocaleString()}`

/**
 * Where a preparer goes to resolve each diagnostic.
 *
 * `docId` opens the uploaded document side by side and always takes precedence.
 * When no document backs the finding, `questionnaire` opens the client's answers instead.
 * `fix` is the single place the number is actually entered or corrected.
 */
const DIAGNOSTIC_ACCESS: Record<
  Phase2IssueKey,
  {
    docId?: string
    questionnaire?: boolean
    fix: { kind: 'input'; navId: string } | { kind: 'form'; formId: string; label: string }
  }
> = {
  importMismatches: { docId: 'w2-techCircle', fix: { kind: 'input', navId: 'w2' } },
  qualifiedDivClassification: {
    docId: '1099-div-token',
    fix: { kind: 'input', navId: '1099-div' },
  },
  w2Box12Missing: { docId: 'w2-techCircle', fix: { kind: 'input', navId: 'w2' } },
  underpaymentRisk: {
    docId: '1099-r-meridian',
    fix: { kind: 'form', formId: 'f2210', label: 'Form 2210' },
  },
  necScheduleC: {
    docId: '1099-nec-summit',
    fix: { kind: 'form', formId: 'schC', label: 'Schedule C' },
  },
  niitForm8960: {
    docId: '1099-div-token',
    fix: { kind: 'form', formId: 'f8960', label: 'Form 8960' },
  },
  optItemize: { questionnaire: true, fix: { kind: 'form', formId: 'schA', label: 'Schedule A' } },
  schCExpenses: { questionnaire: true, fix: { kind: 'form', formId: 'schC', label: 'Schedule C' } },
  sepIra: { docId: '1099-nec-summit', fix: { kind: 'form', formId: 'sch1', label: 'Schedule 1' } },
}

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
  const navigate = useNavigate()
  const { amounts, reviewedFields } = useSyncedReviewState()
  const live = useMemo(() => computeLiveReturn(amounts), [amounts])
  const allIssues = useMemo(() => buildAllDiagnosticIssues(live, amounts), [live, amounts])
  const progress = useMemo(
    () => getPhase2Progress({ reviewedFields, live, amounts }),
    [reviewedFields, live, amounts],
  )
  const importMismatchCount = getOutstandingImportMismatches(amounts).length
  const activeKeys = progress.activeKeys

  const countForCategory = (id: AiDiagnosticCategoryId) =>
    AI_DIAGNOSTIC_CATEGORIES.find(c => c.id === id)!.issueKeys.filter(k =>
      activeKeys.includes(k),
    ).length
  const complianceCount = countForCategory('compliance')
  const optimizationCount = countForCategory('optimization')

  const [expandedCategory, setExpandedCategory] = useState<AiDiagnosticCategoryId | null>(
    'import-mismatches',
  )
  const [checkedExpanded, setCheckedExpanded] = useState(false)

  const selectedIssue = selectedIssueKey
    ? allIssues.find(i => i.issueKey === selectedIssueKey) ?? null
    : null

  const openDetail = (issueKey: Phase2IssueKey) => {
    onViewChange('detail', issueKey)
  }

  const handleViewSourceForField = (field?: string, tab?: string, subTab?: string) => {
    openSourceDocumentReviewPopout({
      tab,
      subTab,
      field,
    })
  }

  const goToFix = (issueKey: Phase2IssueKey) => {
    const { fix } = DIAGNOSTIC_ACCESS[issueKey]
    if (fix.kind === 'form') {
      navigate(`/check-return?form=${fix.formId}`)
      return
    }
    const doc = SOURCE_DOCUMENTS.find(d => d.id === DIAGNOSTIC_ACCESS[issueKey].docId)
    navigate(`/input-return?form=${fix.navId}${doc?.subTab ? `&doc=${doc.subTab}` : ''}`)
  }

  if (view === 'detail' && selectedIssue) {
    const category = categoryForIssueKey(selectedIssue.issueKey)
    const mismatchRows =
      selectedIssue.issueKey === 'importMismatches'
        ? getOutstandingImportMismatches(amounts)
        : []

    const accessConfig = DIAGNOSTIC_ACCESS[selectedIssue.issueKey]
    const access = {
      sourceDoc: accessConfig.docId
        ? SOURCE_DOCUMENTS.find(d => d.id === accessConfig.docId)
        : undefined,
      fixLabel:
        accessConfig.fix.kind === 'form'
          ? `Open ${accessConfig.fix.label}`
          : 'Go to input section',
    }

    return (
      <div className={styles.panel}>
        <LinkActionButton
          className={styles.backLink}
          size="small"
          alignment="left"
          onClick={() => onViewChange('overview', null)}
        >
          <ChevronLeft size="small" aria-hidden />
          Back to AI Diagnostics
        </LinkActionButton>

        <div className={styles.detailHeader}>
          {category && (
            <Badge
              status={categoryBadgeStatus(category.badgeStatus)}
              priority="primary"
              capitalization="caps"
            >
              {category.badgeLabel}
            </Badge>
          )}
          <h1 className={styles.detailTitle}>{selectedIssue.title}</h1>
          <p className={styles.detailSubtitle}>
            {selectedIssue.issueKey === 'importMismatches'
              ? `${mismatchRows.length} field${mismatchRows.length === 1 ? '' : 's'} on this return disagree with the source documents.`
              : selectedIssue.summary}
          </p>
        </div>

        <div className={styles.accessRow}>
          {access.sourceDoc ? (
            <Button
              priority="primary"
              size="small"
              onClick={() =>
                handleViewSourceForField(
                  selectedIssue.viewSourceField ?? undefined,
                  access.sourceDoc?.tab,
                  access.sourceDoc?.subTab,
                )
              }
            >
              {`Open ${access.sourceDoc.formType} side by side`}
            </Button>
          ) : (
            <Button
              priority="primary"
              size="small"
              onClick={() => handleViewSourceForField(undefined, 'questionnaire')}
            >
              Open client answers side by side
            </Button>
          )}
          <Button priority="secondary" size="small" onClick={() => goToFix(selectedIssue.issueKey)}>
            {access.fixLabel}
          </Button>
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
              <span>Tax impact</span>
              <span className={styles.tableHeaderAction}>Action</span>
            </div>
            {mismatchRows.map(row => (
              <div key={row.id} className={styles.tableRow}>
                <LinkActionButton
                  className={styles.fieldLink}
                  size="small"
                  alignment="left"
                  onClick={() => handleViewSourceForField(row.field, row.tab)}
                >
                  {row.label}
                </LinkActionButton>
                <span className={styles.tableCellReturn}>{row.returnValue}</span>
                <strong className={styles.tableCellSource}>{row.sourceValue}</strong>
                <span className={styles.tableCellImpact} title={row.taxImpactNote}>
                  {formatUsd(row.taxImpact)}
                </span>
                <span className={styles.tableCellAction}>
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
            <div className={`${styles.tableRow} ${styles.tableTotalRow}`}>
              <span className={styles.tableTotalLabel}>Total tax impact</span>
              <span className={styles.tableCellReturn} aria-hidden />
              <span className={styles.tableCellSource} aria-hidden />
              <strong className={styles.tableCellImpact}>
                {formatUsd(getImportMismatchTaxImpact(amounts))}
              </strong>
              <span className={styles.tableCellAction} aria-hidden />
            </div>
          </div>
        )}

        {mismatchRows.length === 0 && selectedIssue.tableRows.length > 0 && (
          <div className={styles.tableCard}>
            <div className={styles.detailTableHeader}>
              {selectedIssue.tableHeaders.slice(0, 3).map((header, i) => (
                <span key={header || i} className={i === 0 ? undefined : styles.detailTableCellRight}>
                  {header}
                </span>
              ))}
            </div>
            {selectedIssue.tableRows.map(row => (
              <div
                key={row.label}
                className={`${styles.detailTableRow} ${row.total ? styles.detailTableRowTotal : ''}`}
              >
                <span className={styles.detailTableLabel}>{row.label}</span>
                <span className={`${styles.detailTableValue} ${styles.detailTableCellRight}`}>
                  {row.cols[0]}
                </span>
                <span className={`${styles.detailTableNote} ${styles.detailTableCellRight}`}>
                  {row.cols[1]}
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
          <Badge
            shape="round"
            status="warning"
            priority="secondary"
            capitalization="sentence"
            label={`${importMismatchCount} import mismatch${importMismatchCount === 1 ? '' : 'es'}`}
          >
            <WarningBadgeIcon />
          </Badge>
          <Badge
            shape="round"
            status="warning"
            priority="secondary"
            capitalization="sentence"
            label={`${complianceCount} compliance check${complianceCount === 1 ? '' : 's'}`}
          >
            <WarningBadgeIcon />
          </Badge>
          <Badge
            shape="round"
            status="success"
            priority="secondary"
            capitalization="sentence"
            label={`${optimizationCount} optimization${optimizationCount === 1 ? '' : 's'}`}
          >
            <SuccessBadgeIcon />
          </Badge>
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
          // The importMismatches card stands for every mismatched field, so count
          // rows rather than cards when sizing this category.
          const itemCount =
            category.id === 'import-mismatches'
              ? importMismatchCount + visibleKeys.filter(k => k !== 'importMismatches').length
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
                    status={categoryBadgeStatus(category.badgeStatus)}
                    priority="primary"
                    capitalization="caps"
                  >
                    {category.badgeLabel}
                  </Badge>
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

        <div
          className={`${styles.findingCard} ${styles.checkedCard} ${checkedExpanded ? '' : styles.findingCardCollapsed}`}
        >
          <button
            type="button"
            className={styles.findingHeader}
            aria-expanded={checkedExpanded}
            onClick={() => setCheckedExpanded(prev => !prev)}
          >
            <span className={styles.findingHeaderLeft}>
              <span className={styles.findingTitle}>Checked, no action needed</span>
              <Badge
                shape="round"
                status="success"
                priority="secondary"
                capitalization="sentence"
                label={`${CHECKED_NO_ACTION_ITEMS.length} rules cleared`}
              >
                <SuccessBadgeIcon />
              </Badge>
            </span>
            {checkedExpanded ? (
              <ChevronUp size="small" className={styles.findingChevron} aria-hidden />
            ) : (
              <ChevronDown size="small" className={styles.findingChevron} aria-hidden />
            )}
          </button>

          {checkedExpanded && (
            <ul className={styles.checkedList}>
              {CHECKED_NO_ACTION_ITEMS.map(item => (
                <li key={item.id} className={styles.checkedItem}>
                  <span className={styles.checkedTitle}>{item.title}</span>
                  <span className={styles.checkedConclusion}>{item.conclusion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AiChatInput placeholder="Ask about Jordan's return..." />
    </div>
  )
}

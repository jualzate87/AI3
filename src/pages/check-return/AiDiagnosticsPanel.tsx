import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleCheck,
  CircleCheckFill,
  NewWindow,
} from '@design-systems/icons'
import { Badge, SuccessBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Link } from '@ids-ts/link'
import '@ids-ts/link/dist/main.css'
import { LinkActionButton } from '@ids-ts/link-action-button'
import '@ids-ts/link-action-button/dist/main.css'
import intuitIntelligenceLogo from '../../assets/icons/intuit-intelligence-logo-small.svg'
import { computeLiveReturn } from '../../data/liveReturn'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import { navigateToScheduleAInterestInput } from '../../lib/inputReturnNavigation'
import { openReviewReturnPopout, openSourceDocumentReviewPopout } from '../../lib/prototypeRoutes'
import {
  buildAllDiagnosticIssues,
  type DiagnosticIssueCard,
} from '../data-review/AgentReportPane'
import type { IssueAction } from '../data-review/IssueDetailPane'
import type { OutputFormId } from '../data-review/outputForms'
import {
  getImportMismatchTaxImpact,
  getOutstandingImportMismatches,
  type Phase2IssueKey,
} from '../data-review/phase2FlagSync'
import {
  getPreparerChecklistCounts,
  getManualItemsByPhase,
  PREPARER_CHECKLIST_CLEARED,
  type PreparerChecklistJump,
  type PreparerReviewChecklistItem,
} from './preparerReviewChecklist'
import ItemizeDiagnosticEmbed from './ItemizeDiagnosticEmbed'
import ImportMismatchDiagnosticEmbed from './ImportMismatchDiagnosticEmbed'
import QualifiedDivDiagnosticEmbed from './QualifiedDivDiagnosticEmbed'
import UnderpaymentDiagnosticEmbed from './UnderpaymentDiagnosticEmbed'
import {
  AI_DIAGNOSTIC_CATEGORIES,
  categoryForIssueKey,
  getDiagnosticOverviewCounts,
  primaryIssueKeyForCategory,
  type AiDiagnosticCategory,
  type AiDiagnosticCategoryId,
} from './aiDiagnosticCategories'
import styles from '../../styles/check-return/AiDiagnosticsPanel.module.css'

export type AiDiagnosticsView = 'overview' | 'detail'

/** Keeps the overview dots on the same source of truth as the category badges. */
const DOT_CLASS_BY_STATUS: Record<AiDiagnosticCategory['badgeStatus'], string> = {
  warning: styles.summaryDotAttention,
  info: styles.summaryDotInfo,
  success: styles.summaryDotPositive,
}

function categoryBadgeStatus(
  status: AiDiagnosticCategory['badgeStatus'],
): 'warning' | 'success' | 'info' {
  return status
}

function CategoryBadge({ category }: { category: AiDiagnosticCategory }) {
  return (
    <Badge
      status={categoryBadgeStatus(category.badgeStatus)}
      priority="secondary"
      capitalization="caps"
    >
      {category.badgeLabel}
    </Badge>
  )
}

const formatUsd = (n: number) => `$${Math.round(n).toLocaleString()}`

interface AiDiagnosticsPanelProps {
  view: AiDiagnosticsView
  selectedIssueKey: Phase2IssueKey | null
  onViewChange: (view: AiDiagnosticsView, issueKey?: Phase2IssueKey | null) => void
}

function ExternalReferenceLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      size="B3"
      weight="regular"
      type="standalone"
      className={styles.checkedReferenceLink}
      aria-label={`${label} (opens in a new window)`}
    >
      {label}
      <NewWindow aria-hidden />
    </Link>
  )
}

function RowActionLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <LinkActionButton size="small" weight="regular" alignment="right" onClick={onClick}>
      {label}
    </LinkActionButton>
  )
}

function PreparerChecklistStatusIcon({
  checked,
  onToggle,
  itemId,
  title,
}: {
  checked: boolean
  onToggle?: (itemId: string, checked: boolean) => void
  itemId: string
  title: string
}) {
  if (!onToggle) {
    return checked ? (
      <CircleCheckFill size="small" className={styles.checklistSuccessIcon} aria-hidden />
    ) : (
      <CircleCheck size="small" aria-hidden />
    )
  }

  return (
    <button
      type="button"
      className={styles.checklistToggle}
      aria-pressed={checked}
      aria-label={checked ? `Mark "${title}" as not confirmed` : `Mark "${title}" as confirmed`}
      onClick={() => onToggle(itemId, !checked)}
    >
      {checked ? (
        <CircleCheckFill size="small" className={styles.checklistSuccessIcon} aria-hidden />
      ) : (
        <CircleCheck size="small" aria-hidden />
      )}
    </button>
  )
}

function PreparerChecklistRow({
  item,
  checked,
  onJump,
  onToggle,
  showDivider,
}: {
  item: PreparerReviewChecklistItem
  checked?: boolean
  onJump: (jump: PreparerChecklistJump) => void
  onToggle?: (itemId: string, checked: boolean) => void
  showDivider?: boolean
}) {
  const isManual = item.kind === 'manual'
  const isComplete = isManual ? Boolean(checked) : true

  return (
    <li
      className={[
        styles.checklistRow,
        isComplete ? styles.checklistRowComplete : '',
        showDivider ? styles.checklistRowDivider : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.checklistRowMain}>
        <div className={styles.checklistCheck}>
          <PreparerChecklistStatusIcon
            checked={isComplete}
            onToggle={isManual ? onToggle : undefined}
            itemId={item.id}
            title={item.title}
          />
          <div className={styles.checklistText}>
            <span className={styles.checklistTitle}>{item.title}</span>
            {item.note.trim() && (
              <p className={styles.checklistNote}>{item.note}</p>
            )}
            {item.externalReference && item.kind === 'cleared' && (
              <ExternalReferenceLink
                href={item.externalReference.href}
                label={item.externalReference.label}
              />
            )}
          </div>
        </div>
        {item.jump && (
          <RowActionLink label={item.jump.label} onClick={() => onJump(item.jump!)} />
        )}
      </div>
    </li>
  )
}

const OPEN_FORM_BY_ACTION_LABEL: Partial<Record<string, OutputFormId>> = {
  'Open Form 8960': 'f8960',
  'Open Form 2210': 'f2210',
  'Open Schedule C': 'schC',
  'Open Schedule A': 'schA',
  'Open Schedule 1': 'sch1',
}

type FixStep = {
  text: string
  action?: IssueAction
}

function resolveFixStepAction(
  action: IssueAction | undefined,
  mismatchRow?: ReturnType<typeof getOutstandingImportMismatches>[number],
): IssueAction | undefined {
  if (!action) {
    if (!mismatchRow) return undefined
    return {
      type: 'goToInput',
      label: `Fix ${mismatchRow.label}`,
      tab: mismatchRow.tab,
      field: mismatchRow.field,
    }
  }

  if (action.menuItems?.length) {
    const first = action.menuItems[0]
    return {
      type: 'goToInput',
      label: first.label,
      tab: first.tab,
      field: first.field,
      summaryOnly: first.summaryOnly,
    }
  }

  return action
}

function buildFixSteps(
  issue: DiagnosticIssueCard,
  mismatchRows: ReturnType<typeof getOutstandingImportMismatches>,
): FixStep[] {
  const navigableActions = issue.actions.filter(
    action => action.type === 'goToInput' || action.type === 'openForm',
  )

  return issue.suggestedActions.slice(0, 3).map((text, index) => ({
    text,
    action: resolveFixStepAction(
      navigableActions[index],
      issue.issueKey === 'importMismatches' ? mismatchRows[index] : undefined,
    ),
  }))
}

export default function AiDiagnosticsPanel({
  view,
  selectedIssueKey,
  onViewChange,
}: AiDiagnosticsPanelProps) {
  const { amounts, reviewedFields, manualChecklistItems, setManualChecklistItem } =
    useSyncedReviewState()
  const live = useMemo(() => computeLiveReturn(amounts), [amounts])
  const syncCtx = useMemo(
    () => ({ reviewedFields, live, amounts }),
    [reviewedFields, live, amounts],
  )
  const allIssues = useMemo(() => buildAllDiagnosticIssues(live, amounts), [live, amounts])
  const overview = useMemo(() => getDiagnosticOverviewCounts(syncCtx), [syncCtx])
  const activeKeys = overview.activeKeys

  const [expandedCategory, setExpandedCategory] = useState<AiDiagnosticCategoryId | null>(
    'import-mismatches',
  )
  const [checklistExpanded, setChecklistExpanded] = useState(false)
  const checklistCounts = useMemo(
    () => getPreparerChecklistCounts(manualChecklistItems),
    [manualChecklistItems],
  )

  const selectedIssue = selectedIssueKey
    ? allIssues.find(i => i.issueKey === selectedIssueKey) ?? null
    : null

  const openDetail = (issueKey: Phase2IssueKey) => {
    onViewChange('detail', issueKey)
  }

  const handleViewSourceForField = (field?: string, tab?: string, subTab?: string) => {
    if (tab === 'sch-a-interest') {
      navigateToScheduleAInterestInput(field ?? 'mortgage1098')
      return
    }
    if (tab === 'questionnaire') {
      openSourceDocumentReviewPopout({
        tab: 'questionnaire',
        field: field ?? 'mortgage',
      })
      return
    }
    openSourceDocumentReviewPopout({
      tab,
      subTab,
      field,
    })
  }

  const handleViewForm = (formId: OutputFormId, issueKey: Phase2IssueKey) => {
    openReviewReturnPopout({ form: formId, diagnostic: issueKey })
  }

  const runPreparerChecklistJump = (jump: PreparerChecklistJump) => {
    switch (jump.type) {
      case 'source':
        openSourceDocumentReviewPopout(jump.context)
        break
      case 'form':
        openReviewReturnPopout({ form: jump.formId })
        break
      case 'questionnaire':
        openSourceDocumentReviewPopout({
          tab: 'questionnaire',
          field: jump.field ?? jump.responseId,
        })
        break
      default:
        break
    }
  }

  const runIssueAction = (issueKey: Phase2IssueKey, action: IssueAction) => {
    switch (action.type) {
      case 'goToInput':
        if (action.tab === 'sch-a-interest') {
          navigateToScheduleAInterestInput(action.field ?? 'mortgage1098')
          return
        }
        if (action.tab === 'questionnaire') {
          handleViewSourceForField(action.field ?? 'mortgage', 'questionnaire')
          return
        }
        if (action.summaryOnly) {
          openReviewReturnPopout({ diagnostic: issueKey })
          return
        }
        handleViewSourceForField(action.field, action.tab)
        break
      case 'openForm': {
        const formId = OPEN_FORM_BY_ACTION_LABEL[action.label]
        if (formId) handleViewForm(formId, issueKey)
        break
      }
      default:
        break
    }
  }

  if (view === 'detail' && selectedIssue) {
    const category = categoryForIssueKey(selectedIssue.issueKey)
    const mismatchRows =
      selectedIssue.issueKey === 'importMismatches'
        ? getOutstandingImportMismatches(amounts)
        : []
    const fixSteps = buildFixSteps(selectedIssue, mismatchRows)

    return (
      <div className={styles.panel}>
        <LinkActionButton
          className={styles.backLink}
          size="small"
          weight="regular"
          alignment="left"
          onClick={() => onViewChange('overview', null)}
        >
          <ChevronLeft size="xsmall" aria-hidden />
          Back to return review
        </LinkActionButton>

        <div className={styles.detailHeader}>
          {category && <CategoryBadge category={category} />}
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
                  size="small"
                  weight="regular"
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
                  <RowActionLink
                    label="View source"
                    onClick={() => handleViewSourceForField(row.field, row.tab)}
                  />
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
              {selectedIssue.tableHeaders.slice(0, 4).map((header, i) => (
                <span
                  key={header || i}
                  className={
                    i === 1
                      ? styles.detailTableCellRight
                      : i === 3
                        ? styles.detailTableCellAction
                        : undefined
                  }
                >
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
                <span className={styles.detailTableNote}>{row.cols[1]}</span>
                <span className={styles.detailTableCellAction}>
                  {row.fixTab ? (
                    <RowActionLink
                      label={row.actionLabel ?? 'View source'}
                      onClick={() =>
                        handleViewSourceForField(
                          row.fixField ?? row.questionnaireResponseId,
                          row.fixTab,
                          undefined,
                        )
                      }
                    />
                  ) : row.viewForm ? (
                    <RowActionLink
                      label={row.actionLabel ?? `View on ${row.viewFormLabel ?? row.viewForm}`}
                      onClick={() => handleViewForm(row.viewForm!, selectedIssue.issueKey)}
                    />
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}

        {fixSteps.length > 0 && (
          <div className={styles.tipsCard}>
            <div className={styles.logoGroup}>
              <img src={intuitIntelligenceLogo} alt="" className={styles.logoIcon} />
              <span className={styles.wordmark}>Steps to fix</span>
            </div>
            <ul className={styles.fixStepsList}>
              {fixSteps.map((step, index) => (
                <li key={`${selectedIssue.issueKey}-step-${index}`} className={styles.fixStepItem}>
                  <span className={styles.fixStepText}>{step.text}</span>
                  {step.action ? (
                    <RowActionLink
                      label={step.action.label}
                      onClick={() => runIssueAction(selectedIssue.issueKey, step.action!)}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedIssue.issueKey === 'importMismatches' && mismatchRows.length > 0 && (
          <ImportMismatchDiagnosticEmbed rows={mismatchRows} />
        )}

        {selectedIssue.issueKey === 'qualifiedDivClassification' && (
          <QualifiedDivDiagnosticEmbed />
        )}

        {selectedIssue.issueKey === 'underpaymentRisk' && (
          <UnderpaymentDiagnosticEmbed />
        )}

        {selectedIssue.issueKey === 'optItemize' && amounts.mortgageInterest === 0 && (
          <ItemizeDiagnosticEmbed />
        )}
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.headerArea}>
        <div className={styles.logoTitleRow}>
          <img src={intuitIntelligenceLogo} alt="" className={styles.logoIcon} />
          <h1 className={styles.pageTitle}>Return review by Intuit Intelligence</h1>
        </div>
        <p className={styles.introText}>
          I&apos;ve reviewed Jordan&apos;s 2025 return and found {overview.total} item
          {overview.total === 1 ? '' : 's'} that need attention.
        </p>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryMetrics}>
          {AI_DIAGNOSTIC_CATEGORIES.map(category => {
            const count = overview.byCategory[category.id]
            return (
              <span key={category.id} className={styles.summaryMetric}>
                <span
                  className={`${styles.summaryDot} ${DOT_CLASS_BY_STATUS[category.badgeStatus]}`}
                  aria-hidden
                />
                {count} {category.metricLabel}
              </span>
            )
          })}
        </div>
        <span className={styles.reviewStatus}>
          {overview.reviewed} of {overview.total} reviewed
        </span>
      </div>

      <div className={styles.findingsStack}>
        {AI_DIAGNOSTIC_CATEGORIES.map(category => {
          const visibleKeys = category.issueKeys.filter(k => activeKeys.includes(k))
          if (visibleKeys.length === 0) return null

          const isExpanded = expandedCategory === category.id
          const itemCount = overview.byCategory[category.id]

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
                  <CategoryBadge category={category} />
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
                  <p className={styles.findingDescription}>
                    {category.id === 'import-mismatches'
                      ? `${itemCount} field${itemCount === 1 ? '' : 's'} don\u2019t match source documents. Some were marked correct during import without fixing amounts, and I found gaps the import missed.`
                      : category.description}
                  </p>
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
          className={`${styles.findingCard} ${checklistExpanded ? '' : styles.findingCardCollapsed}`}
        >
          <button
            type="button"
            className={styles.findingHeader}
            aria-expanded={checklistExpanded}
            onClick={() => setChecklistExpanded(prev => !prev)}
          >
            <span className={styles.findingHeaderLeft}>
              <span className={styles.findingTitle}>Preparer review checklist</span>
              <Badge
                shape="round"
                status="success"
                capitalization="sentence"
                label={`${checklistCounts.clearedCount} checked · ${checklistCounts.manualConfirmed} of ${checklistCounts.manualCount} confirmed`}
              >
                <SuccessBadgeIcon />
              </Badge>
            </span>
            {checklistExpanded ? (
              <ChevronUp size="small" className={styles.findingChevron} aria-hidden />
            ) : (
              <ChevronDown size="small" className={styles.findingChevron} aria-hidden />
            )}
          </button>

          {checklistExpanded && (
            <>
              <p className={styles.findingDescription}>
                Rules Intuit Intelligence already cleared, plus preparer attestation items not
                covered by the import mismatches and diagnostics above.
              </p>

              <p className={styles.checklistGroupLabel}>Checked from inputs</p>
              <ul className={styles.checklistList}>
                {PREPARER_CHECKLIST_CLEARED.map((item, index) => (
                  <PreparerChecklistRow
                    key={item.id}
                    item={item}
                    onJump={runPreparerChecklistJump}
                    showDivider={index > 0}
                  />
                ))}
              </ul>

              <p className={styles.checklistGroupLabel}>Worth confirming</p>
              {getManualItemsByPhase().map(group => (
                <div key={group.phase} className={styles.checklistPhaseBlock}>
                  <p className={styles.checklistPhaseLabel}>{group.label}</p>
                  <ul className={styles.checklistList}>
                    {group.items.map((item, index) => (
                      <PreparerChecklistRow
                        key={item.id}
                        item={item}
                        checked={manualChecklistItems[item.id]}
                        onJump={runPreparerChecklistJump}
                        onToggle={setManualChecklistItem}
                        showDivider={index > 0}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

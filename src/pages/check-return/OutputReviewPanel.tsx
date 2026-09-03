import { useCallback, useMemo } from 'react'
import { CircleCheck } from '@design-systems/icons'
import { computeLiveReturn } from '../../data/liveReturn'
import type { FieldOriginSource } from '../../data/fieldOrigins'
import { useSyncedReviewState, getReviewActor, REVIEWER_NAME } from '../../hooks/useSyncedReviewState'
import {
  openSourceDocumentById,
  openSourceDocumentFromFieldOrigin,
} from '../../lib/sourceDocPopoutNavigation'
import LeftPanel1040 from '../data-review/LeftPanel1040'
import type { OutputFormId } from '../data-review/outputForms'
import { field1040ToDetail } from '../data-review/phase1FieldSync'
import { resolveOutputFieldFromIssueField } from '../data-review/phase2FlagSync'
import { outputFormDisplayTitle } from './outputFormNav'
import styles from '../../styles/check-return/OutputReviewPanel.module.css'

interface OutputReviewPanelProps {
  outputFormId: OutputFormId
}

export default function OutputReviewPanel({ outputFormId }: OutputReviewPanelProps) {
  const {
    selectedField,
    setSelectedField,
    amounts,
    reviewedFields,
    summaryCheckedFields,
    summaryCheckedMeta,
    reviewerConfirmedFields,
    reviewerConfirmedMeta,
    reviewerConfirmStaleFields,
    toggleSummaryChecked,
    toggleSummaryPreparerCheck,
    toggleSummaryReviewerConfirm,
    summaryFlaggedFields,
    summaryFlaggedMeta,
    toggleSummaryFlagged,
    summaryFlagNotes,
    summaryFlagActivity,
    setSummaryFlagNote,
    editedFields,
    reviewerSignedOffForms,
    reviewerSignedOffFormsMeta,
    toggleReviewerFormSignOff,
  } = useSyncedReviewState()

  const liveTotals = useMemo(() => computeLiveReturn(amounts), [amounts])
  const reviewRole = getReviewActor() === REVIEWER_NAME ? 'reviewer' : 'preparer'
  const highlightField1040 = resolveOutputFieldFromIssueField(selectedField)

  const handle1040FieldClick = useCallback(
    (field1040: string | null) => {
      if (!field1040) {
        setSelectedField(null)
        return
      }
      const mapped = field1040ToDetail(field1040)
      setSelectedField(mapped?.field ?? field1040)
    },
    [setSelectedField],
  )

  const handleNavigateSource = useCallback(
    (source: FieldOriginSource) => {
      openSourceDocumentFromFieldOrigin(source, setSelectedField)
    },
    [setSelectedField],
  )

  const handleNavigateToSourceDoc = useCallback(
    (docId: string) => {
      openSourceDocumentById(docId, selectedField, setSelectedField)
    },
    [selectedField, setSelectedField],
  )

  const title = outputFormDisplayTitle(outputFormId)

  return (
    <div className={styles.panel}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <p className={styles.pageHelper}>
          Choose highlighted items to jump to the input field, or use the info icon to see
          source documents and calculations.
        </p>
        <div className={styles.legend} aria-label="Verification legend">
          <span className={styles.legendItem}>
            <CircleCheck size="small" className={styles.legendIconPrep} aria-hidden />
            Preparer verified
          </span>
          <span className={styles.legendItem}>
            <CircleCheck size="small" className={styles.legendIconRev} aria-hidden />
            Reviewer confirmed
          </span>
        </div>
      </header>

      <div className={styles.formHost}>
        <LeftPanel1040
          embeddedInCheckReturn
          showFormSelector={false}
          selectedField={selectedField}
          highlightField={highlightField1040}
          onFieldClick={handle1040FieldClick}
          total1a={liveTotals.wages}
          wages={{ techCircle: amounts.wages }}
          reviewedFields={reviewedFields}
          checkedFields={summaryCheckedFields}
          checkedMeta={summaryCheckedMeta}
          reviewerConfirmedFields={reviewerConfirmedFields}
          reviewerConfirmedMeta={reviewerConfirmedMeta}
          reviewerConfirmStaleFields={reviewerConfirmStaleFields}
          onToggleChecked={toggleSummaryChecked}
          onTogglePreparerCheck={toggleSummaryPreparerCheck}
          onToggleReviewerConfirm={toggleSummaryReviewerConfirm}
          reviewRole={reviewRole}
          reviewerSignedOffForms={reviewerSignedOffForms}
          reviewerSignedOffFormsMeta={reviewerSignedOffFormsMeta}
          onToggleFormSignOff={toggleReviewerFormSignOff}
          flaggedFields={summaryFlaggedFields}
          flaggedMeta={summaryFlaggedMeta}
          onToggleFlagged={toggleSummaryFlagged}
          flagNotes={summaryFlagNotes}
          flagActivity={summaryFlagActivity}
          onSetFlagNote={setSummaryFlagNote}
          liveTotals={liveTotals}
          liveAmounts={amounts}
          editedFields={editedFields}
          outputFormId={outputFormId}
          onNavigateSource={handleNavigateSource}
          onNavigateToSourceDoc={handleNavigateToSourceDoc}
        />
      </div>
    </div>
  )
}

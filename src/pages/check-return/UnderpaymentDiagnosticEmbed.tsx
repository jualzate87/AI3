import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { computeLiveReturn } from '../../data/liveReturn'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import type { DivPayer } from '../data-review/DetailFieldsDiv'
import OutputFormViews from '../data-review/OutputFormViews'
import QuestionnaireResponsesPanel from '../data-review/QuestionnaireResponsesPanel'
import { SOURCE_AMOUNTS } from '../data-review/phase2FlagSync'
import type { QuestionnaireResponseId } from '../data-review/questionnaireData'
import { DiagnosticFieldEmbed } from './DiagnosticFieldEmbed'
import styles from '../../styles/check-return/DiagnosticEmbed.module.css'

type UnderpaymentStep =
  | {
      id: string
      label: string
      kind: 'field'
      highlightField: string
      tab: string
      divPayer?: DivPayer
      ariaLabel: string
    }
  | { id: string; label: string; kind: 'form'; formId: 'f2210' }
  | { id: string; label: string; kind: 'questionnaire'; responseId: QuestionnaireResponseId }

function buildUnderpaymentSteps(
  amounts: ReturnType<typeof useSyncedReviewState>['amounts'],
): UnderpaymentStep[] {
  const steps: UnderpaymentStep[] = []

  if (amounts.rWithholding < SOURCE_AMOUNTS.rWithholding) {
    steps.push({
      id: 'r-withholding',
      label: '1099-R Box 4 federal withholding (Meridian)',
      kind: 'field',
      highlightField: 'withholding1099',
      tab: '1099-rs',
      ariaLabel: '1099-R federal withholding input',
    })
  }

  if (amounts.divWithholding < SOURCE_AMOUNTS.divWithholding) {
    steps.push({
      id: 'div-withholding',
      label: '1099-DIV Box 4 federal withholding (Token)',
      kind: 'field',
      highlightField: 'fedTaxWithheld',
      tab: '1099-divs',
      divPayer: 'tokenFinancial',
      ariaLabel: '1099-DIV federal withholding input',
    })
  }

  steps.push({
    id: 'f2210',
    label: 'Form 2210 — underpayment penalty',
    kind: 'form',
    formId: 'f2210',
  })

  steps.push({
    id: 'estimated-payments',
    label: 'Client response — estimated tax payments',
    kind: 'questionnaire',
    responseId: 'estimatedPayments',
  })

  return steps
}

export default function UnderpaymentDiagnosticEmbed() {
  const {
    amounts,
    setSelectedField,
    summaryCheckedFields,
    summaryCheckedMeta,
    reviewerConfirmedFields,
    reviewerConfirmedMeta,
    reviewerConfirmStaleFields,
    toggleSummaryPreparerCheck,
    toggleSummaryReviewerConfirm,
    summaryFlaggedFields,
    summaryFlagNotes,
    toggleSummaryFlagged,
    setSummaryFlagNote,
  } = useSyncedReviewState()

  const steps = useMemo(() => buildUnderpaymentSteps(amounts), [amounts])
  const [index, setIndex] = useState(0)
  const live = useMemo(() => computeLiveReturn(amounts), [amounts])

  useEffect(() => {
    setIndex(prev => Math.min(prev, Math.max(0, steps.length - 1)))
  }, [steps.length])

  if (steps.length === 0) return null

  const safeIndex = Math.min(index, steps.length - 1)
  const step = steps[safeIndex]

  return (
    <div className={styles.embedStack} aria-label="Fix underpayment risk inline">
      <div className={styles.embedNav}>
        <p className={styles.embedNavLabel}>
          <span className={styles.embedNavCount}>
            {safeIndex + 1} of {steps.length}
          </span>
          <span className={styles.embedNavField}>{step.label}</span>
        </p>
        <div className={styles.embedNavActions}>
          <Button
            priority="secondary"
            size="small"
            disabled={safeIndex === 0}
            onClick={() => setIndex(prev => Math.max(0, prev - 1))}
            aria-label="Previous fix step"
          >
            <ChevronLeft size="small" aria-hidden />
            Previous
          </Button>
          <Button
            priority="secondary"
            size="small"
            disabled={safeIndex >= steps.length - 1}
            onClick={() => setIndex(prev => Math.min(steps.length - 1, prev + 1))}
            aria-label="Next fix step"
          >
            Next
            <ChevronRight size="small" aria-hidden />
          </Button>
        </div>
      </div>

      {step.kind === 'field' && (
        <DiagnosticFieldEmbed
          key={step.id}
          highlightField={step.highlightField}
          tab={step.tab}
          ariaLabel={step.ariaLabel}
          divPayer={step.divPayer}
        />
      )}

      {step.kind === 'form' && (
        <section className={styles.embed} aria-label="Form 2210 underpayment review">
          <OutputFormViews
            formId={step.formId}
            live={live}
            amounts={amounts}
            highlightField="f2210-17"
            issueField="f2210-17"
            embeddedInCheckReturn
            checkedFields={summaryCheckedFields}
            checkedMeta={summaryCheckedMeta}
            reviewerConfirmedFields={reviewerConfirmedFields}
            reviewerConfirmedMeta={reviewerConfirmedMeta}
            reviewerConfirmStaleFields={reviewerConfirmStaleFields}
            onTogglePreparerCheck={toggleSummaryPreparerCheck}
            onToggleReviewerConfirm={toggleSummaryReviewerConfirm}
            flaggedFields={summaryFlaggedFields}
            flagNotes={summaryFlagNotes}
            onToggleFlagged={toggleSummaryFlagged}
            onSetFlagNote={setSummaryFlagNote}
            onFieldClick={setSelectedField}
          />
        </section>
      )}

      {step.kind === 'questionnaire' && (
        <section className={styles.embed} aria-label="Estimated tax payments client response">
          <QuestionnaireResponsesPanel highlightResponseId={step.responseId} />
        </section>
      )}
    </div>
  )
}

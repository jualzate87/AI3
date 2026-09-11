import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import type { DivPayer } from '../data-review/DetailFieldsDiv'
import { SOURCE_AMOUNTS } from '../data-review/phase2FlagSync'
import { DiagnosticFieldEmbed } from './DiagnosticFieldEmbed'
import styles from '../../styles/check-return/DiagnosticEmbed.module.css'

type UnderpaymentStep = {
  id: string
  label: string
  highlightField: string
  tab: string
  divPayer?: DivPayer
  ariaLabel: string
}

function buildUnderpaymentSteps(
  amounts: ReturnType<typeof useSyncedReviewState>['amounts'],
): UnderpaymentStep[] {
  const steps: UnderpaymentStep[] = []

  if (amounts.rWithholding < SOURCE_AMOUNTS.rWithholding) {
    steps.push({
      id: 'r-withholding',
      label: '1099-R Box 4 federal withholding (Meridian)',
      highlightField: 'withholding1099',
      tab: '1099-rs',
      ariaLabel: '1099-R federal withholding input',
    })
  }

  if (amounts.divWithholding < SOURCE_AMOUNTS.divWithholding) {
    steps.push({
      id: 'div-withholding',
      label: '1099-DIV Box 4 federal withholding (Token)',
      highlightField: 'fedTaxWithheld',
      tab: '1099-divs',
      divPayer: 'tokenFinancial',
      ariaLabel: '1099-DIV federal withholding input',
    })
  }

  return steps
}

export default function UnderpaymentDiagnosticEmbed() {
  const { amounts } = useSyncedReviewState()

  const steps = useMemo(() => buildUnderpaymentSteps(amounts), [amounts])
  const [index, setIndex] = useState(0)

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

      <DiagnosticFieldEmbed
        key={step.id}
        highlightField={step.highlightField}
        tab={step.tab}
        ariaLabel={step.ariaLabel}
        divPayer={step.divPayer}
      />
    </div>
  )
}

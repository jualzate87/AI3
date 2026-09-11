import { useEffect, useRef, useState } from 'react'
import { CircleInfo, Plus } from '@design-systems/icons'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import InputFormPageHeader from './InputFormPageHeader'
import detailStyles from '../../styles/data-review/DetailFields.module.css'
import styles from '../../styles/input-return/ScheduleAInterestInput.module.css'

export const SCHEDULE_A_MORTGAGE_FIELD = 'mortgage1098'

type ScheduleAInterestInputPanelProps = {
  variant?: 'embed' | 'input'
  autoFocusField?: boolean
  highlightField?: string | null
}

function fmtCurrency(value: number): string {
  return value > 0 ? value.toLocaleString('en-US') : ''
}

export default function ScheduleAInterestInputPanel({
  variant = 'input',
  autoFocusField = false,
  highlightField,
}: ScheduleAInterestInputPanelProps) {
  const { amounts, updateAmounts, markEdited, selectedField } = useSyncedReviewState()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isHighlighted =
    highlightField === SCHEDULE_A_MORTGAGE_FIELD ||
    selectedField === SCHEDULE_A_MORTGAGE_FIELD ||
    autoFocusField

  useEffect(() => {
    if (!autoFocusField) return
    setEditing(true)
    setDraft(amounts.mortgageInterest > 0 ? String(amounts.mortgageInterest) : '')
    inputRef.current?.focus()
  }, [autoFocusField, amounts.mortgageInterest])

  const commitEdit = () => {
    const parsed = Number(draft.replace(/,/g, ''))
    if (Number.isFinite(parsed) && parsed >= 0) {
      updateAmounts({ mortgageInterest: parsed })
      if (parsed > 0) markEdited(SCHEDULE_A_MORTGAGE_FIELD)
    }
    setEditing(false)
  }

  const federalValue = editing ? draft : fmtCurrency(amounts.mortgageInterest)

  return (
    <div
      className={[
        detailStyles.container,
        variant === 'embed' ? styles.embedRoot : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {variant === 'input' ? (
        <InputFormPageHeader title="Interest" />
      ) : (
        <header className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Interest</h3>
          <button type="button" className={styles.helpBtn} aria-label="Help for Interest">
            <CircleInfo size="small" />
          </button>
        </header>
      )}

      <div
        className={`${detailStyles.inputContainer} ${detailStyles.inputContainerInput}`}
      >
        <div className={styles.grid}>
          <div className={styles.gridHeaderRow} role="row">
            <span className={styles.colLabel} role="columnheader">
              Labels
            </span>
            <span className={styles.colFederal} role="columnheader">
              FEDERAL
            </span>
            <span className={styles.colPrior} role="columnheader">
              PRIOR YEAR AMOUNT
            </span>
          </div>

          <div
            className={`${styles.gridRow} ${isHighlighted ? styles.gridRowHighlighted : ''}`}
            role="row"
          >
            <div className={styles.rowLabelCell} role="cell">
              <span className={styles.rowLabel}>
                Home mortgage interest &amp; points on Form 1098 [Adjust]{' '}
                <span className={styles.rowLabelHint}>(Click on button to expand)</span>
              </span>
              <button type="button" className={styles.labelInfoBtn} aria-label="More information">
                <CircleInfo size="small" />
              </button>
            </div>

            <div className={styles.federalCell} role="cell">
              <div className={styles.inputWithExpand}>
                <input
                  ref={inputRef}
                  className={`${styles.federalInput} ${isHighlighted ? styles.federalInputHighlighted : ''}`}
                  value={federalValue}
                  inputMode="numeric"
                  aria-label="Home mortgage interest and points on Form 1098"
                  onChange={event => setDraft(event.target.value.replace(/[^\d]/g, ''))}
                  onFocus={() => {
                    setEditing(true)
                    setDraft(
                      amounts.mortgageInterest > 0
                        ? String(amounts.mortgageInterest)
                        : '',
                    )
                  }}
                  onBlur={commitEdit}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      commitEdit()
                    }
                  }}
                />
                <button type="button" className={styles.expandBtn} aria-label="Expand details">
                  <Plus size="small" />
                </button>
              </div>
            </div>

            <div className={styles.priorCell} role="cell">
              <input
                className={styles.priorInput}
                readOnly
                value=""
                tabIndex={-1}
                aria-label="Prior year home mortgage interest and points on Form 1098"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

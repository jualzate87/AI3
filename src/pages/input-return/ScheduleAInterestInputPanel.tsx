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

type StaticRow = {
  id: string
  label: string
  showInfo?: boolean
}

const STATIC_ROWS: StaticRow[] = [
  {
    id: 'mortgageNot1098',
    label: 'Home mortgage interest not on Form 1098',
    showInfo: true,
  },
  {
    id: 'pointsNot1098',
    label: 'Points not on Form 1098 [Adjust]',
    showInfo: true,
  },
  {
    id: 'amtPrincipal',
    label:
      'Home mortgage interest on principal residence for AMT. Do not include points not reported in box 2 on Form 1098 [Adjust]',
    showInfo: true,
  },
  {
    id: 'investmentInterest',
    label: 'Investment interest',
    showInfo: true,
  },
]

function fmtCurrency(value: number): string {
  return value > 0 ? value.toLocaleString('en-US') : ''
}

function ReadOnlyFederalCell() {
  return (
    <div className={styles.inputWithExpand}>
      <input className={styles.federalInput} readOnly value="" tabIndex={-1} aria-hidden />
      <button type="button" className={styles.expandBtn} aria-label="Expand details">
        <Plus size="small" />
      </button>
    </div>
  )
}

function PriorYearCell({ label }: { label: string }) {
  return (
    <input
      className={styles.priorInput}
      readOnly
      value=""
      tabIndex={-1}
      aria-label={label}
    />
  )
}

function LabelCell({ label, showInfo = false }: { label: string; showInfo?: boolean }) {
  return (
    <div className={styles.rowLabelCell} role="cell">
      <span className={styles.rowLabel}>
        {label}
        {showInfo ? (
          <CircleInfo size="small" className={styles.inlineInfoIcon} aria-hidden />
        ) : null}
      </span>
    </div>
  )
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

      <div className={`${detailStyles.inputContainer} ${detailStyles.inputContainerInput}`}>
        <div className={styles.grid}>
          <div className={styles.gridSpacer} aria-hidden />

          <div className={styles.gridHeaderRow} role="row">
            <span className={styles.colLabel} role="columnheader" aria-hidden />
            <span className={styles.colFederal} role="columnheader">
              FEDERAL
            </span>
            <span className={styles.colPrior} role="columnheader">
              PRIOR YEAR AMOUNT
            </span>
          </div>

          <div className={styles.checkboxRow} role="row">
            <div className={styles.checkboxLabelCell} role="cell">
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} disabled />
                Taxpayer did not use all mortgages to buy, build, or improve the home
              </label>
            </div>
            <div className={styles.federalCell} role="cell" aria-hidden />
            <div className={styles.priorCell} role="cell" aria-hidden />
          </div>

          <div
            className={`${styles.gridRow} ${isHighlighted ? styles.gridRowHighlighted : ''}`}
            role="row"
          >
            <LabelCell
              label="Home mortgage interest & points on Form 1098 [Adjust] (Click on button to expand)"
            />

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
                      amounts.mortgageInterest > 0 ? String(amounts.mortgageInterest) : '',
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
              <PriorYearCell label="Prior year home mortgage interest and points on Form 1098" />
            </div>
          </div>

          {STATIC_ROWS.map(row => (
            <div key={row.id} className={styles.gridRow} role="row">
              <LabelCell label={row.label} showInfo={row.showInfo} />
              <div className={styles.federalCell} role="cell">
                <ReadOnlyFederalCell />
              </div>
              <div className={styles.priorCell} role="cell">
                <PriorYearCell label={`Prior year ${row.label}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

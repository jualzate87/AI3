import { useEffect } from 'react'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import DetailFields from '../data-review/DetailFields'
import type { W2Employer } from '../data-review/DetailFields'
import DetailFields1099R from '../data-review/DetailFields1099R'
import DetailFieldsDiv from '../data-review/DetailFieldsDiv'
import type { DivPayer } from '../data-review/DetailFieldsDiv'
import DetailFieldsNec from '../data-review/DetailFieldsNec'
import type { TopTab } from '../data-review/ReviewTab'
import styles from '../../styles/check-return/DiagnosticEmbed.module.css'

export type DiagnosticFieldEmbedProps = {
  highlightField: string
  tab: string
  ariaLabel: string
  divPayer?: DivPayer
  intPayer?: string
  subTab?: W2Employer
}

export function DiagnosticFieldEmbed({
  highlightField,
  tab,
  ariaLabel,
  divPayer,
  subTab,
}: DiagnosticFieldEmbedProps) {
  const {
    setActiveTopTab,
    activeSubTab,
    setActiveSubTab,
    activeDivPayer,
    setActiveDivPayer,
    selectedField,
    wages,
    setWages,
    amounts,
    updateAmounts,
    fieldValues,
    updateFieldValue,
    markEdited,
    fieldOverrides,
    setFieldOverride,
    setSelectedField,
  } = useSyncedReviewState()

  useEffect(() => {
    setActiveTopTab(tab as TopTab)
    if (subTab) setActiveSubTab(subTab)
    if (divPayer) setActiveDivPayer(divPayer)
    if (selectedField !== highlightField) {
      setSelectedField(highlightField)
    }
  }, [
    tab,
    subTab,
    divPayer,
    highlightField,
    selectedField,
    setActiveTopTab,
    setActiveSubTab,
    setActiveDivPayer,
    setSelectedField,
  ])

  const totalWithholding =
    fieldValues.withholding.techCircle + amounts.intWithholding + amounts.divWithholding

  return (
    <section className={styles.embed} aria-label={ariaLabel}>
      {tab === 'w2s' && (
        <DetailFields
          variant="input"
          formTitle="Details: Wages, Salaries, Tips (W-2)"
          selectedField={highlightField}
          activeSubTab={subTab ?? activeSubTab}
          wages={wages}
          onWageChange={(employer, value) => {
            setWages({ ...wages, [employer]: value })
            markEdited(`wages-${employer}`)
          }}
          fieldValues={{ ...fieldValues, withholding: fieldValues.withholding[subTab ?? activeSubTab] }}
          onFieldValueChange={(key, value) => {
            if (key === 'withholding' && typeof value === 'number') {
              updateFieldValue('withholding', { techCircle: value })
              markEdited('withholding')
            } else if (typeof value === 'number') {
              updateFieldValue(key as keyof typeof fieldValues, value)
              markEdited(String(key))
            }
          }}
          box12Rows={amounts.box12Rows}
          onBox12RowChange={(patchSub, patch) => {
            updateAmounts({
              box12Rows: {
                ...amounts.box12Rows,
                [patchSub]: { ...amounts.box12Rows[patchSub], ...patch },
              },
            })
            markEdited(`box12${patchSub}-${subTab ?? activeSubTab}`)
          }}
          onIdentityChange={(kind, value) => {
            if (kind === 'ssn') updateAmounts({ employeeSsn: value })
            else updateAmounts({ employerEin: value })
            markEdited(kind === 'ssn' ? `ssn-${subTab ?? activeSubTab}` : `ein-${subTab ?? activeSubTab}`)
          }}
          identityValues={{ ssn: amounts.employeeSsn, ein: amounts.employerEin }}
          box13={{
            retirementPlan: amounts.box13RetirementPlan,
            statutoryEmployee: amounts.box13StatutoryEmployee,
            thirdPartySickPay: amounts.box13ThirdPartySickPay,
          }}
          onBox13Change={patch => {
            updateAmounts({
              ...(patch.retirementPlan !== undefined
                ? { box13RetirementPlan: patch.retirementPlan }
                : {}),
              ...(patch.statutoryEmployee !== undefined
                ? { box13StatutoryEmployee: patch.statutoryEmployee }
                : {}),
              ...(patch.thirdPartySickPay !== undefined
                ? { box13ThirdPartySickPay: patch.thirdPartySickPay }
                : {}),
            })
            markEdited('box13')
          }}
          fieldOverrides={fieldOverrides}
          onFieldOverride={setFieldOverride}
        />
      )}

      {tab === '1099-divs' && (
        <DetailFieldsDiv
          variant="input"
          activePayer={divPayer ?? activeDivPayer}
          selectedField={highlightField}
          fieldValues={{
            ...fieldValues,
            withholding: totalWithholding,
            divWithholding: amounts.divWithholding,
          }}
          onFieldValueChange={(key, value) => {
            updateFieldValue(key as keyof typeof fieldValues, value)
            markEdited(String(key))
          }}
          onAmountChange={(patch, editedKey) => {
            updateAmounts(patch)
            if (editedKey) markEdited(editedKey)
          }}
          amounts={amounts}
          fieldOverrides={fieldOverrides}
          onFieldOverride={setFieldOverride}
        />
      )}

      {tab === '1099-rs' && (
        <DetailFields1099R
          variant="input"
          selectedField={highlightField}
          amounts={amounts}
          onAmountChange={(patch, editedKey) => {
            updateAmounts(patch)
            if (editedKey) markEdited(editedKey)
          }}
          fieldOverrides={fieldOverrides}
          onFieldOverride={setFieldOverride}
        />
      )}

      {tab === '1099-necs' && (
        <DetailFieldsNec
          variant="input"
          selectedField={highlightField}
          amounts={amounts}
          onAmountChange={(patch, editedKey) => {
            updateAmounts(patch)
            if (editedKey) markEdited(editedKey)
          }}
          fieldOverrides={fieldOverrides}
          onFieldOverride={setFieldOverride}
        />
      )}
    </section>
  )
}

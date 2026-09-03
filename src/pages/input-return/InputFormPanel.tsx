import { useEffect } from 'react'
import PageMessage from '@ids-ts/page-message'
import '@ids-ts/page-message/dist/main.css'
import { useSyncedReviewState } from '../../hooks/useSyncedReviewState'
import DetailFields from '../data-review/DetailFields'
import DetailFields1099 from '../data-review/DetailFields1099'
import DetailFieldsDiv from '../data-review/DetailFieldsDiv'
import DetailFields1099R from '../data-review/DetailFields1099R'
import DetailFieldsNec from '../data-review/DetailFieldsNec'
import { resolveActiveVerifyDocKey } from '../../data/documentImportMeta'
import { openHashRoute, PREPARER_DATA_REVIEW_PATH } from '../../lib/prototypeRoutes'
import {
  applyInputDocKey,
  getInputDocTabs,
  readActiveDocKey,
} from '../../data/inputDocTabs'
import { inputNavItemById, type InputNavItemId } from '../../data/inputMenuNav'
import panelStyles from '../../styles/shared/ReturnMainPanel.module.css'
import styles from '../../styles/InputReturnPage.module.css'

interface InputFormPanelProps {
  activeItemId: InputNavItemId
  showMissingEinDiagnostic?: boolean
  onDocChange?: (docKey: string) => void
}

export default function InputFormPanel({
  activeItemId,
  showMissingEinDiagnostic = false,
  onDocChange,
}: InputFormPanelProps) {
  const navItem = inputNavItemById(activeItemId)
  const {
    activeTopTab,
    setActiveTopTab,
    activeSubTab,
    setActiveSubTab,
    selectedField,
    setSelectedField,
    wages,
    setWages,
    amounts,
    updateAmounts,
    fieldValues,
    updateFieldValue,
    markEdited,
    fieldOverrides,
    setFieldOverride,
    activeDivPayer,
    setActiveDivPayer,
    activeIntPayer,
    setActiveIntPayer,
  } = useSyncedReviewState()

  const docTabs = getInputDocTabs(navItem.topTab)
  const activeDocKey =
    readActiveDocKey(navItem.topTab, {
      activeSubTab,
      activeDivPayer,
      activeIntPayer,
    }) ?? docTabs[0]?.key ?? ''

  const verifyDocKey = resolveActiveVerifyDocKey({
    activeTopTab: navItem.topTab,
    activeSubTab,
    activeDivPayer,
    activeIntPayer,
  })

  const docSetters = { setActiveSubTab, setActiveDivPayer, setActiveIntPayer }

  useEffect(() => {
    if (activeTopTab !== navItem.topTab) {
      setActiveTopTab(navItem.topTab)
    }
  }, [activeTopTab, navItem.topTab, setActiveTopTab])

  useEffect(() => {
    if (showMissingEinDiagnostic && activeItemId === 'w2') {
      setSelectedField('ein')
    }
  }, [showMissingEinDiagnostic, activeItemId, setSelectedField])

  const totalWithholding =
    fieldValues.withholding.techCircle + amounts.intWithholding + amounts.divWithholding

  const handleDocTabChange = (docKey: string) => {
    applyInputDocKey(navItem.topTab, docKey, docSetters)
    onDocChange?.(docKey)
  }

  const handleViewSourceDocuments = () => {
    openHashRoute(PREPARER_DATA_REVIEW_PATH)
  }

  return (
    <div className={`${panelStyles.pageScroll} ${styles.formPanel}`}>
      {showMissingEinDiagnostic && activeItemId === 'w2' && (
        <div className={styles.diagnosticBanner}>
          <PageMessage
            type="error"
            title="Form W-2: Employer Identification Number (EIN) is missing and is required for e-file."
            open
            dismissible={false}
          />
        </div>
      )}

      <div className={styles.formScroll}>
        {navItem.topTab === 'w2s' && (
          <DetailFields
            variant="input"
            formTitle="Details: Wages, Salaries, Tips (W-2)"
            selectedField={selectedField}
            onFieldSelect={setSelectedField}
            activeSubTab={activeSubTab}
            onSubTabChange={tab => handleDocTabChange(tab)}
            wages={{ bingEquipment: 0, techCircle: wages.techCircle }}
            onWageChange={(employer, value) => {
              setWages({ ...wages, [employer]: value })
              markEdited(`wages-${employer}`)
            }}
            fieldValues={{ ...fieldValues, withholding: fieldValues.withholding[activeSubTab] }}
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
            onBox12RowChange={(sub, patch) => {
              updateAmounts({
                box12Rows: {
                  ...amounts.box12Rows,
                  [sub]: { ...amounts.box12Rows[sub], ...patch },
                },
              })
              markEdited(`box12${sub}-${activeSubTab}`)
            }}
            onIdentityChange={(kind, value) => {
              if (kind === 'ssn') updateAmounts({ employeeSsn: value })
              else updateAmounts({ employerEin: value })
              markEdited(kind === 'ssn' ? `ssn-${activeSubTab}` : `ein-${activeSubTab}`)
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
            onViewSourceDocuments={handleViewSourceDocuments}
            docTabs={docTabs}
            activeDocKey={activeDocKey}
            onDocTabChange={handleDocTabChange}
          />
        )}

        {navItem.topTab === '1099-divs' && (
          <DetailFieldsDiv
            variant="input"
            activePayer={activeDivPayer}
            fieldValues={{ ...fieldValues, withholding: totalWithholding, divWithholding: amounts.divWithholding }}
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
            onViewSourceDocuments={handleViewSourceDocuments}
            docTabs={docTabs}
            activeDocKey={activeDocKey}
            onDocTabChange={handleDocTabChange}
          />
        )}

        {navItem.topTab === '1099-ints' && (
          <DetailFields1099
            variant="input"
            activePayer={activeIntPayer}
            fieldValues={{ ...fieldValues, withholding: totalWithholding }}
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
            onViewSourceDocuments={handleViewSourceDocuments}
            docTabs={docTabs}
            activeDocKey={activeDocKey}
            onDocTabChange={handleDocTabChange}
          />
        )}

        {navItem.topTab === '1099-rs' && (
          <DetailFields1099R
            variant="input"
            fieldValues={{ ...fieldValues, withholding: totalWithholding }}
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
            onViewSourceDocuments={handleViewSourceDocuments}
          />
        )}

        {navItem.topTab === '1099-necs' && (
          <DetailFieldsNec
            variant="input"
            onAmountChange={(patch, editedKey) => {
              updateAmounts(patch)
              if (editedKey) markEdited(editedKey)
            }}
            amounts={amounts}
            fieldOverrides={fieldOverrides}
            onFieldOverride={setFieldOverride}
            onViewSourceDocuments={handleViewSourceDocuments}
          />
        )}
      </div>
    </div>
  )
}

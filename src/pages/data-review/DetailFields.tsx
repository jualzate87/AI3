import { useEffect, useRef, useState } from 'react'
import { CircleCheck, TriangleExclamationFill } from '@design-systems/icons'
import { Badge, SuccessBadgeIcon } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import DocVerifyHeaderActions from './DocVerifyHeaderActions'
import QuestionnaireFieldNote from './QuestionnaireFieldNote'
import { DestinationFieldLabel } from './DestinationFieldLabel'
import FieldAnnotationButton from './FieldAnnotationButton'
import Tooltip from './Tooltip'
import DetailSectionHeader from './DetailSectionHeader'
import InputFormPageHeader, { type InputDocTabItem } from '../input-return/InputFormPageHeader'
import styles from '../../styles/data-review/DetailFields.module.css'
import { displayEditableAmount } from '../../data/liveReturn'
import { canEditField, type DetailFieldsVariant } from './fieldEditability'
import { FieldEditStatusBadges } from './fieldEditStatus'
import { getBox12SubRowKeys, isBox12FlagResolved } from './phase1FieldSync'

type FieldValuesKey = 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs'

export const W2_PAYER_TABS: { key: W2Employer; label: string }[] = [
  { key: 'techCircle', label: 'Tech Circle' },
  { key: 'bingEquipment', label: 'Bing Equipment' },
]

type FieldValuesKey = 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs'

export type Box12Sub = 'a' | 'b' | 'c' | 'd'
export type Box12RowsState = Record<Box12Sub, { code: string; amount: number }>

interface DetailFieldsProps {
  formTitle: string
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string | null) => void
  activeSubTab?: W2Employer
  onSubTabChange?: (tab: string) => void
  wages?: { bingEquipment: number; techCircle: number }
  onWageChange?: (employer: string, value: number) => void
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: FieldValuesKey, value: number) => void
  /** Synced Box 12 a–d codes + amounts (persists across Save / refresh) */
  box12Rows?: Box12RowsState
  onBox12RowChange?: (sub: Box12Sub, patch: { code?: string; amount?: number }) => void
  /** Synced SSN / EIN (blank at session start — planted import errors) */
  identityValues?: { ssn: string; ein: string }
  onIdentityChange?: (kind: 'ssn' | 'ein', value: string) => void
  /** W-2 Box 13 checkboxes */
  box13?: {
    retirementPlan: boolean
    statutoryEmployee: boolean
    thirdPartySickPay: boolean
  }
  onBox13Change?: (patch: Partial<{
    retirementPlan: boolean
    statutoryEmployee: boolean
    thirdPartySickPay: boolean
  }>) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  /** Field keys with unsaved edits — show "Edited" until Save and recalculate */
  unsavedFields?: Set<string>
  /** Brief flash after save — show "1040 recalculated" */
  recalculatedFields?: Set<string>
  /** @deprecated Audit trail only — not used for Edited badge */
  editedFields?: Set<string>
  /** Who/when for last edit — optional; shown on Edited badge tooltip */
  editedFieldsMeta?: Map<string, { by: string; at: string }>
  /** Persisted static field values (employer name, addresses, …) */
  fieldOverrides?: Record<string, string>
  /** Persist a static field edit (also stamps Edited badge) */
  onFieldOverride?: (fieldKey: string, value: string) => void
  /** Map of doc field key → issue summary shown as a hover tooltip */
  flaggedFields?: Record<string, string>
  verifiedDocs?: Set<string>
  /** Who/when for preparer Mark as verified */
  verifiedDocsMeta?: Map<string, { by: string; at: string }>
  /** Reviewer doc confirmations — separate slot */
  reviewerConfirmedDocs?: Set<string>
  reviewerConfirmedDocsMeta?: Map<string, { by: string; at: string }>
  onVerifyDoc?: (docKey: string) => void
  /** Called when user posts a note from a field popover: (text, contextLabel) */
  onAddFieldNote?: (text: string, context: string) => void
  /** Reviewer confirm mode — preparer attestations read-only; no import/OCR edit actions */
  importReadOnly?: boolean
  /** Input return mode — plain editable fields without verify header or review flags */
  variant?: DetailFieldsVariant
  /** When true (pre-import manual entry), zero amounts render blank */
  showEmptyWhenZero?: boolean
  /** Input return — open source document preview for current doc */
  onViewSourceDocuments?: () => void
  /** Input return — L2 document tabs below page title */
  docTabs?: InputDocTabItem[]
  activeDocKey?: string
  onDocTabChange?: (key: string) => void
}

// Static non-wages fields per employer
const EMPLOYER_DATA = {
  bingEquipment: {
    id: '12-3456789',
    name: 'Bing Equipment',
    street: '3833 Soundtech Ct SE',
    city: 'Kentwood', state: 'CA', zip: '93004',
    federalTax: '10,000',
    socialSecurityWages: '60,000', ssTax: '3,720',
    medicareWages: '60,000', medicareTax: '870',
    ssTips: '25', allocatedTips: '0',
    dependentCare: '25', nonqualified: '39',
    box12Code: '' as string, box12Amount: '' as string,
  },
  techCircle: {
    id: '94-1234567',
    name: 'Tech Circle Inc',
    street: '321 Main Orchard Dr',
    city: 'Reno', state: 'NV', zip: '89501',
    federalTax: '15,840',
    socialSecurityWages: '148,940', ssTax: '9,234.28',
    medicareWages: '148,940', medicareTax: '2,159.63',
    ssTips: '0', allocatedTips: '0',
    dependentCare: '0', nonqualified: '0',
    box12Code: '' as string, box12Amount: '' as string,
    box12Entries: [
      { sub: 'a', code: 'C', amount: '' },
      { sub: 'b', code: 'AA', amount: '' },
      { sub: 'c', code: 'DD', amount: '' },
      { sub: 'd', code: '', amount: '' },
    ],
  },
}

export default function DetailFields({
  formTitle,
  selectedField,
  highlightMode = 'blue',
  onFieldSelect,
  activeSubTab = 'techCircle',
  onSubTabChange,
  wages = { bingEquipment: 0, techCircle: 118940 },
  onWageChange,
  fieldValues,
  onFieldValueChange,
  box12Rows,
  onBox12RowChange,
  identityValues,
  onIdentityChange,
  box13,
  onBox13Change,
  onMarkReviewed,
  onMarkReviewedBulk,
  reviewedFields,
  unsavedFields,
  recalculatedFields,
  editedFieldsMeta,
  fieldOverrides = {},
  onFieldOverride,
  flaggedFields = {},
  verifiedDocs,
  verifiedDocsMeta,
  reviewerConfirmedDocs,
  reviewerConfirmedDocsMeta,
  onVerifyDoc,
  onAddFieldNote,
  importReadOnly = false,
  variant = 'review',
  showEmptyWhenZero = false,
  onViewSourceDocuments,
  docTabs,
  activeDocKey,
  onDocTabChange,
}: DetailFieldsProps) {
  const employer = EMPLOYER_DATA[activeSubTab]
  const currentWages = wages[activeSubTab]
  const fmt = (n: number) => displayEditableAmount(n, showEmptyWhenZero)
  const highlightedRef = useRef<HTMLDivElement>(null)
  const withholdingRef = useRef<HTMLDivElement>(null)
  const box12Ref = useRef<HTMLDivElement>(null)

  // Track which field is in edit mode, its draft value, and original for undo
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  const editMetaText = (key: string) => {
    const m = editedFieldsMeta?.get(key)
    return m ? `Edited · ${m.by} · ${m.at}` : 'Edited'
  }
  const reviewedTip = (key: string, active: boolean) => {
    if (!active) return 'Mark as correct'
    const m = reviewedFields?.get(key)
    return m ? `Marked correct · ${m.by} · ${m.at}` : 'Click to unmark'
  }
  useEffect(() => {
    const ref =
      selectedField === 'withholding' ? withholdingRef :
      selectedField === 'box12'       ? box12Ref       :
      highlightedRef
    if (selectedField && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedField])

  const startEdit = (field: string, currentValue: string) => {
    if (!canEditField(field, variant, importReadOnly)) return
    const clean = currentValue.replace(/,/g, '')
    setEditingField(field)
    setDraftValue(clean)
    setOriginalValue(clean)
  }

  const commitEdit = (field: FieldValuesKey) => {
    if (editingField !== field) return
    const num = parseFloat(draftValue.replace(/,/g, '')) || 0
    if (draftValue !== originalValue) {
      onFieldValueChange?.(field, num)
      onMarkReviewed?.(field)
    }
    setEditingField(null)
  }

  const commitWagesEdit = () => {
    if (editingField !== 'wages') return
    const num = parseFloat(draftValue.replace(/,/g, '')) || 0
    if (draftValue !== originalValue) {
      onWageChange?.(activeSubTab, num)
      onMarkReviewed?.(`wages-${activeSubTab}`)
    }
    setEditingField(null)
  }

  const cancelEdit = () => {
    setEditingField(null)
    setDraftValue('')
    setOriginalValue('')
  }

  const box12Resolved = isBox12FlagResolved(reviewedFields ?? new Map(), activeSubTab)

  /** Mark a Box 12 sub-row reviewed and sync the Phase 1 `box12` flag when all rows are done. */
  const markBox12RowReviewed = (rowKey: string) => {
    onMarkReviewed?.(rowKey)
    const subRows = getBox12SubRowKeys(activeSubTab)
    const allReviewed = subRows.every(k => k === rowKey || reviewedFields?.has(k))
    if (allReviewed) onMarkReviewed?.('box12')
  }

  // Renders label text with an orange dot when the field is flagged by an AI issue
  const FlaggedLabel = ({ fieldKey, children }: { fieldKey: string; children: string }) => {
    const issue = flaggedFields[fieldKey]
    if (!issue) {
      return (
        <DestinationFieldLabel fieldKey={fieldKey} className={styles.fieldLabel}>
          {children}
        </DestinationFieldLabel>
      )
    }
    return (
      <DestinationFieldLabel fieldKey={fieldKey} className={`${styles.fieldLabel} ${styles.fieldLabelFlagged}`}>
        <span className={styles.issueIndicator} />
        {children}
      </DestinationFieldLabel>
    )
  }

  // Renders an inline validation note beneath a flagged field row.
  // When the field is reviewed: note stays but icon turns green and text gets a strikethrough.
  const ValidationNote = ({ fieldKey }: { fieldKey: string }) => {
    const issue = flaggedFields[fieldKey]
    if (!issue) return null
    // Use the correct reviewed key — wages uses `wages-${activeSubTab}`, box12 aggregates sub-rows
    const reviewedKey = fieldKey === 'wages' ? `wages-${activeSubTab}` : fieldKey
    const isReviewed = fieldKey === 'box12'
      ? box12Resolved
      : reviewedFields?.has(reviewedKey)
    if (isReviewed) return null
    return (
      <div className={styles.validationNote} style={isReviewed ? { color: '#1a6b35', borderBottomColor: '#e8edf0' } : {}}>
        {isReviewed ? (
          <CircleCheck size="small" style={{ flexShrink: 0 }} />
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="6" cy="6" r="5.5" fill="#c9500f"/>
            <path d="M6 3.5V6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="6" cy="8.5" r="0.6" fill="white"/>
          </svg>
        )}
        <span style={isReviewed ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>{issue}</span>
      </div>
    )
  }

  const renderAnnotationBtn = (fieldKey: string, label: string, section: string) => (
    <FieldAnnotationButton
      fieldKey={fieldKey}
      contextLabel={`${section} · ${label}`}
      variant="detail"
      allowFlagTypes
      onAddNote={onAddFieldNote}
    />
  )

  // Generic editable row — auto-saves on blur / Enter (no Save button)
  const renderStaticRow = (fieldKey: string, label: string, defaultValue: string, inputClass = styles.fieldInputSmall) => {
    const key = `${fieldKey}-${activeSubTab}`
    const identitySynced =
      fieldKey === 'ssn' && identityValues?.ssn
        ? identityValues.ssn
        : fieldKey === 'ein' && identityValues?.ein
          ? identityValues.ein
          : null
    const currentVal = identitySynced ?? fieldOverrides[key] ?? defaultValue
    const editable = canEditField(key, variant, importReadOnly)
    const isEditing = editable && editingField === key
    const isReviewed = reviewedFields?.has(key)
    // A flagged static row (e.g. missing EIN) shows the same orange dot + validation note as other import flags
    const isFlagged = !!flaggedFields[fieldKey] && !isReviewed
    const commitStatic = () => {
      if (editingField !== key) return
      const next = draftValue
      if (next !== originalValue) {
        onFieldOverride?.(key, next)
        if (fieldKey === 'ssn') onIdentityChange?.('ssn', next.trim())
        if (fieldKey === 'ein') onIdentityChange?.('ein', next.trim())
        if (next.trim()) onMarkReviewed?.(key)
      }
      setEditingField(null)
    }
    return (
      <>
      <div
        className={`${styles.fieldRow} ${isFlagged ? styles.fieldRowHasNote : ''}`}
        onClick={() => onFieldSelect?.(key)}
        style={{ cursor: 'pointer' }}
      >
        {flaggedFields[fieldKey] ? (
          <DestinationFieldLabel fieldKey={key} className={`${styles.fieldLabel} ${isFlagged ? styles.fieldLabelFlagged : ''}`}>
            {isFlagged && <span className={styles.issueIndicator} />}
            {label}
          </DestinationFieldLabel>
        ) : (
          <DestinationFieldLabel fieldKey={key} className={styles.fieldLabel}>
            {label}
          </DestinationFieldLabel>
        )}
        <input
          className={`${styles.fieldInput} ${inputClass} ${!editable ? styles.fieldInputDisplay : ''} ${isEditing ? styles.fieldInputEditing : ''}`}
          readOnly
          tabIndex={editable ? undefined : -1}
          aria-readonly={!editable}
          value={isEditing ? draftValue : currentVal}
          onChange={editable ? (e => setDraftValue(e.target.value)) : undefined}
          autoFocus={isEditing}
          onClick={editable ? (e => { e.stopPropagation(); if (!isEditing) startEdit(key, currentVal) }) : undefined}
          onBlur={editable ? commitStatic : undefined}
          onKeyDown={editable ? (e => {
            if (e.key === 'Enter') { e.preventDefault(); commitStatic() }
            if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
          }) : undefined}
        />
        {isEditing ? (
          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.undoBtn}
              onMouseDown={e => e.preventDefault()}
              onClick={cancelEdit}
            >
              Undo
            </button>
          </div>
        ) : isReviewed ? (
          <Tooltip text={reviewedTip(key, true)} placement="top">
            {importReadOnly ? (
              <span className={styles.reviewedBadge} style={{ display: 'inline-flex', alignItems: 'center' }}><CircleCheck size="small" /></span>
            ) : (
              <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(key) }}><CircleCheck size="small" /></button>
            )}
          </Tooltip>
        ) : importReadOnly || variant === 'input' || !editable ? null : (
          <div className={styles.fieldActions}>
            <Tooltip text={reviewedTip(key, false)} placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(key) }}><CircleCheck size="small" /></button></Tooltip>
            {renderAnnotationBtn(key, label, employer.name)}
          </div>
        )}
        {editable && (
          <FieldEditStatusBadges
            fieldKey={key}
            unsavedFields={unsavedFields}
            recalculatedFields={recalculatedFields}
            editTooltip={editMetaText(key)}
          />
        )}
      </div>
      {flaggedFields[fieldKey] && !isReviewed && (
        <div className={styles.validationNote} style={isReviewed ? { color: '#1a6b35', borderBottomColor: '#e8edf0' } : {}}>
          {isReviewed ? (
            <CircleCheck size="small" style={{ flexShrink: 0 }} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="6" cy="6" r="5.5" fill="#c9500f"/>
              <path d="M6 3.5V6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="6" cy="8.5" r="0.6" fill="white"/>
            </svg>
          )}
          <span style={isReviewed ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>{flaggedFields[fieldKey]}</span>
        </div>
      )}
      </>
    )
  }

  return (
    <div className={styles.container}>
      {variant === 'input' ? (
        <InputFormPageHeader
          title={formTitle}
          onViewSourceDocuments={onViewSourceDocuments}
          docTabs={docTabs}
          activeDocKey={activeDocKey}
          onDocTabChange={onDocTabChange}
        />
      ) : (
        <div className={styles.pageHeader}>
          <div className={styles.headerActions}>
            <div className={styles.headerTitleRow}>
              <h2 className={styles.headerTitle}>{formTitle}</h2>
            </div>
            <DocVerifyHeaderActions
              docKey={activeSubTab}
              verifiedDocs={verifiedDocs}
              verifiedDocsMeta={verifiedDocsMeta}
              reviewerConfirmedDocs={reviewerConfirmedDocs}
              reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
              onVerifyDoc={onVerifyDoc}
              reviewedFields={reviewedFields}
              amounts={{
                employeeSsn: identityValues?.ssn ?? '',
                employerEin: identityValues?.ein ?? '',
              }}
            />
          </div>
        </div>
      )}

      {/* Scrollable input fields */}
      <div
        className={[
          styles.inputContainer,
          variant === 'input' ? styles.inputContainerInput : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Employer Information section */}
        <DetailSectionHeader variant={variant}>
          Employer Information (MANDATORY for e-file)
        </DetailSectionHeader>

        {renderStaticRow('ssn', '(a) Employee social security number', 'Not found')}
        {renderStaticRow('ein', '(b) Employer identification number', activeSubTab === 'techCircle' ? 'Not found' : (employer.id || 'Not found'))}
        {renderStaticRow('employerName', '(c) Name of employer', employer.name, styles.fieldInputWide)}
        {renderStaticRow('street', 'Street address', employer.street, styles.fieldInputWide)}
        {renderStaticRow('cityStateZip', 'City / State / ZIP code', `${employer.city}, ${employer.state} ${employer.zip}`, styles.fieldInputWide)}

        {/* Wages section — same grey header as Employer Information */}
        <DetailSectionHeader variant={variant}>
          Wages
        </DetailSectionHeader>

        {/* (1) Wages — editable, drives 1040 line 1a */}
        <div
          ref={selectedField === 'wages' ? highlightedRef : undefined}
          className={`${styles.fieldRow} ${flaggedFields['wages'] ? styles.fieldRowHasNote : ''} ${selectedField === 'wages' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
          onClick={() => onFieldSelect?.('wages')}
          style={{ cursor: 'pointer' }}
        >
          <FlaggedLabel fieldKey="wages">(1) Wages, tips, etc.</FlaggedLabel>
          <input
            className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'wages' ? styles.fieldInputEditing : flaggedFields['wages'] && !reviewedFields?.has(`wages-${activeSubTab}`) ? styles.fieldInputHighlightedOrange : selectedField === 'wages' ? styles.fieldInputHighlighted : ''}`}
            readOnly={editingField !== 'wages'}
            value={editingField === 'wages' ? draftValue : fmt(currentWages)}
            onChange={e => setDraftValue(e.target.value)}
            autoFocus={editingField === 'wages'}
            onClick={e => { e.stopPropagation(); if (canEditField('wages', variant, importReadOnly) && editingField !== 'wages') startEdit('wages', currentWages.toString()) }}
            onBlur={commitWagesEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitWagesEdit() }
              if (e.key === 'Escape') cancelEdit()
            }}
          />
          {editingField === 'wages' ? (
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.undoBtn}
                onMouseDown={e => e.preventDefault()}
                onClick={cancelEdit}
              >
                Undo
              </button>
            </div>
          ) : reviewedFields?.has(`wages-${activeSubTab}`) ? (
            <Tooltip text="Click to unmark" placement="top">
              <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(`wages-${activeSubTab}`) }}><CircleCheck size="small" /></button>
            </Tooltip>
          ) : (
            <div className={styles.fieldActions}>
              <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(`wages-${activeSubTab}`) }}><CircleCheck size="small" /></button></Tooltip>
              {renderAnnotationBtn(`wages-${activeSubTab}`, '(1) Wages, tips, etc.', employer.name)}
            </div>
          )}
          <FieldEditStatusBadges
            fieldKey={`wages-${activeSubTab}`}
            unsavedFields={unsavedFields}
            recalculatedFields={recalculatedFields}
            flowsTo1040
          />
        </div>
        <ValidationNote fieldKey="wages" />

        <div
          ref={withholdingRef}
          className={`${styles.fieldRow} ${selectedField === 'withholding' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
          onClick={() => onFieldSelect?.('withholding')}
          style={{ cursor: 'pointer' }}
        >
          <FlaggedLabel fieldKey="withholding">(2) Federal income tax withheld</FlaggedLabel>
          <input
            className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'withholding' ? styles.fieldInputEditing : selectedField === 'withholding' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
            readOnly={editingField !== 'withholding'}
            value={editingField === 'withholding' ? draftValue : (fieldValues?.withholding !== undefined ? fmt(fieldValues.withholding) : (showEmptyWhenZero ? '' : employer.federalTax))}
            onChange={e => setDraftValue(e.target.value)}
            autoFocus={editingField === 'withholding'}
            onClick={e => { e.stopPropagation(); if (canEditField('withholding', variant, importReadOnly) && editingField !== 'withholding') startEdit('withholding', fieldValues?.withholding?.toString() ?? employer.federalTax) }}
            onBlur={() => commitEdit('withholding')}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit('withholding') } if (e.key === 'Escape') cancelEdit() }}
          />
          {editingField === 'withholding' ? (
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.undoBtn}
                onMouseDown={e => e.preventDefault()}
                onClick={cancelEdit}
              >
                Undo
              </button>
            </div>
          ) : reviewedFields?.has('withholding') ? (
            <span className={styles.reviewedBadge}><CircleCheck size="small" /></span>
          ) : (
            <div className={styles.fieldActions}>
              <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('withholding') }}><CircleCheck size="small" /></button></Tooltip>
              {renderAnnotationBtn(`withholding-${activeSubTab}`, '(2) Federal income tax withheld', employer.name)}
            </div>
          )}
          <FieldEditStatusBadges
            fieldKey="withholding"
            unsavedFields={unsavedFields}
            recalculatedFields={recalculatedFields}
            flowsTo1040
          />
        </div>
        {renderStaticRow('sswages', '(3) Social security wages', employer.socialSecurityWages)}
        {renderStaticRow('sstax', '(4) Social security tax withheld', employer.ssTax)}
        {renderStaticRow('medicarewages', '(5) Medicare wages and tips', employer.medicareWages)}
        {renderStaticRow('medicaretax', '(6) Medicare tax withheld', employer.medicareTax)}
        {renderStaticRow('sstips', '(7) Social security tips', employer.ssTips)}
        {renderStaticRow('allocatedtips', '(8) Allocated tips', employer.allocatedTips)}
        {renderStaticRow('dependentcare', '(10) Dependent care benefits', employer.dependentCare)}
        {renderStaticRow('nonqualified', '(11) Nonqualified plans', employer.nonqualified)}
        {'box12Entries' in employer && employer.box12Entries ? (
          <>
            {/* Box 12 column headers */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '4px 20px 2px', borderBottom: '1px solid #e8edf0', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, width: 32, flexShrink: 0 }}>
                {flaggedFields['box12'] && !box12Resolved && <span className={styles.issueIndicator} />}
              </span>
              <span style={{ fontFamily: 'var(--font-family-component)', fontSize: 13, fontWeight: 500, color: '#21262a', flex: '0 0 auto' }}>(12) Box 12 — Codes</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--font-family-component)', fontSize: 11, fontWeight: 500, color: '#859299', width: 64, flexShrink: 0, textAlign: 'center' }}>Code</span>
              <span style={{ fontFamily: 'var(--font-family-component)', fontSize: 11, fontWeight: 500, color: '#859299', width: 120, flexShrink: 0 }}>Amount</span>
            </div>
            {(employer.box12Entries as { sub: string; code: string; amount: string }[]).map((entry, i) => {
              const isLast = i === (employer.box12Entries as unknown[]).length - 1
              const sub = entry.sub as Box12Sub
              const codeKey = `box12${entry.sub}-code-${activeSubTab}`
              const amtKey = `box12${entry.sub}-amt-${activeSubTab}`
              const rowKey = `box12${entry.sub}-${activeSubTab}`
              const isFlagged = !!(flaggedFields['box12'] && !box12Resolved)
              const isEditingAmt = editingField === amtKey
              const isRowReviewed = reviewedFields?.has(rowKey)
              const syncedRow = box12Rows?.[sub]
              const codeVal = syncedRow?.code ?? fieldOverrides[codeKey] ?? entry.code
              // Seed amount 0 must stay blank (codes shown, amounts missing) — only show once > 0
              const syncedAmt = syncedRow?.amount ?? 0
              const amtVal = syncedAmt > 0
                ? syncedAmt.toLocaleString()
                : (fieldOverrides[amtKey] ?? (entry.sub === 'a' && fieldValues?.box12 ? fmt(fieldValues.box12) : (showEmptyWhenZero ? '' : entry.amount)))
              const BOX12_CODES = ['', 'A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','V','W','AA','BB','DD','EE','FF','GG','HH']
              const commitAmt = () => {
                if (editingField !== amtKey) return
                if (draftValue !== originalValue) {
                  const num = parseFloat(draftValue.replace(/,/g, '')) || 0
                  if (onBox12RowChange) {
                    onBox12RowChange(sub, { amount: num, code: codeVal })
                  } else if (entry.sub === 'a') {
                    onFieldValueChange?.('box12', num)
                  }
                  onFieldOverride?.(amtKey, draftValue)
                  markBox12RowReviewed(rowKey)
                }
                setEditingField(null)
              }
              return (
                <div key={entry.sub}>
                  <div
                    ref={i === 0 ? box12Ref : undefined}
                    className={`${styles.fieldRow} ${isFlagged ? styles.fieldRowHasNote : ''}`}
                    style={isLast ? { borderBottom: 'none', cursor: 'pointer' } : { cursor: 'pointer' }}
                    onClick={() => onFieldSelect?.(rowKey)}
                  >
                    {/* Sub-label */}
                    <span style={{ color: '#859299', fontSize: 12, fontWeight: 500, width: 32, flexShrink: 0 }}>12{entry.sub}</span>
                    <span style={{ flex: 1 }} />
                    {/* Code dropdown */}
                    <select
                      value={codeVal}
                      onChange={e => {
                        const nextCode = e.target.value
                        if (onBox12RowChange) {
                          onBox12RowChange(sub, { code: nextCode })
                        }
                        onFieldOverride?.(codeKey, nextCode)
                      }}
                      style={{ width: 64, fontSize: 13, height: 32, padding: '0 4px', boxSizing: 'border-box', border: `1px solid ${isFlagged ? '#ff6a00' : '#c3ced5'}`, borderRadius: 4, background: isFlagged ? 'rgba(255,187,0,0.25)' : '#fff', color: codeVal ? '#21262a' : '#859299', fontFamily: 'var(--font-family-component)', outline: 'none', flexShrink: 0, cursor: 'pointer', appearance: 'auto' }}
                    >
                      {BOX12_CODES.map(c => <option key={c} value={c}>{c || '—'}</option>)}
                    </select>
                    {/* Amount input */}
                    <input
                      readOnly={!isEditingAmt}
                      value={isEditingAmt ? draftValue : amtVal}
                      placeholder="—"
                      onChange={e => setDraftValue(e.target.value)}
                      autoFocus={isEditingAmt}
                      onBlur={commitAmt}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitAmt() }
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      style={{ width: 120, fontSize: 13, height: 32, padding: '5px 8px', boxSizing: 'border-box', border: `${isEditingAmt ? '2px' : '1px'} solid ${isEditingAmt ? '#205ea3' : isFlagged ? '#ff6a00' : '#c3ced5'}`, borderRadius: 4, background: isEditingAmt ? '#fff' : isFlagged ? 'rgba(255,187,0,0.25)' : '#fff', color: '#21262a', fontFamily: 'var(--font-family-component)', outline: 'none', flexShrink: 0, cursor: 'text' }}
                      onClick={e => { e.stopPropagation(); if (canEditField(amtKey, variant, importReadOnly) && !isEditingAmt) { startEdit(amtKey, amtVal) } }}
                    />
                    {isEditingAmt ? (
                      <div className={styles.editActions}>
                        <button
                          type="button"
                          className={styles.undoBtn}
                          onMouseDown={e => e.preventDefault()}
                          onClick={cancelEdit}
                        >
                          Undo
                        </button>
                      </div>
                    ) : isRowReviewed ? (
                      <Tooltip text="Click to unmark" placement="top">
                        <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); markBox12RowReviewed(rowKey) }}><CircleCheck size="small" /></button>
                      </Tooltip>
                    ) : (
                      <div className={styles.fieldActions}>
                        <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); markBox12RowReviewed(rowKey) }}><CircleCheck size="small" /></button></Tooltip>
                        {renderAnnotationBtn(rowKey, `(12${entry.sub}) Box 12 code`, employer.name)}
                      </div>
                    )}
                    <FieldEditStatusBadges
                      fieldKey={amtKey}
                      unsavedFields={unsavedFields}
                      recalculatedFields={recalculatedFields}
                    />
                  </div>
                  {isLast && <ValidationNote fieldKey="box12" />}
                </div>
              )
            })}
          </>
        ) : (
          <>
            <div
              ref={box12Ref}
              className={`${styles.fieldRow} ${selectedField === 'box12' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
              onClick={() => onFieldSelect?.('box12')}
              style={{ cursor: 'pointer' }}
            >
              <FlaggedLabel fieldKey="box12">(12) Code {employer.box12Code || '—'} — 401(k) deferral</FlaggedLabel>
              <input
                className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'box12' ? styles.fieldInputEditing : selectedField === 'box12' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
                readOnly={editingField !== 'box12'}
                value={editingField === 'box12' ? draftValue : (fieldValues?.box12 !== undefined && employer.box12Amount ? fieldValues.box12.toLocaleString() : (employer.box12Amount || '—'))}
                onChange={e => setDraftValue(e.target.value)}
                autoFocus={editingField === 'box12'}
                onClick={e => { e.stopPropagation(); if (canEditField('box12', variant, importReadOnly) && editingField !== 'box12') startEdit('box12', fieldValues?.box12?.toString() ?? employer.box12Amount ?? '') }}
                onBlur={() => commitEdit('box12')}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit('box12') } if (e.key === 'Escape') cancelEdit() }}
              />
              {editingField === 'box12' ? (
                <div className={styles.editActions}>
                  <button
                    type="button"
                    className={styles.undoBtn}
                    onMouseDown={e => e.preventDefault()}
                    onClick={cancelEdit}
                  >
                    Undo
                  </button>
                </div>
              ) : reviewedFields?.has('box12') ? (
                <span className={styles.reviewedBadge}><CircleCheck size="small" /></span>
              ) : (
                <div className={styles.fieldActions}>
                  <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('box12') }}><CircleCheck size="small" /></button></Tooltip>
                  {renderAnnotationBtn(`box12-${activeSubTab}`, `(12) Code ${employer.box12Code || '—'} — 401(k) deferral`, employer.name)}
                </div>
              )}
              <FieldEditStatusBadges
                fieldKey="box12"
                unsavedFields={unsavedFields}
                recalculatedFields={recalculatedFields}
              />
            </div>
            <ValidationNote fieldKey="box12" />
          </>
        )}

        {/* Box 13 — Statutory employee / Retirement plan / Third-party sick pay */}
        <div
          className={`${styles.fieldRow} ${selectedField === 'box13' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
          onClick={() => onFieldSelect?.('box13')}
          style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: 8, paddingTop: 10, paddingBottom: 10 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DestinationFieldLabel fieldKey="box13" className={styles.fieldLabel}>
              (13) Box 13
            </DestinationFieldLabel>
            {flaggedFields['box13'] && !reviewedFields?.has('box13') && (
              <span className={styles.issueIndicator} />
            )}
            <span style={{ flex: 1 }} />
            {flaggedFields['box13'] && (
              reviewedFields?.has('box13') ? (
                <span className={styles.reviewedBadge}><CircleCheck size="small" /></span>
              ) : (
                <div className={styles.fieldActions}>
                  <Tooltip text="Mark as correct" placement="top">
                    <button
                      className={styles.markCorrectBtn}
                      onClick={e => { e.stopPropagation(); onMarkReviewed?.('box13') }}
                    >
                      <CircleCheck size="small" />
                    </button>
                  </Tooltip>
                </div>
              )
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, paddingLeft: 8 }}>
            {(
              [
                { key: 'statutoryEmployee' as const, label: 'Statutory employee' },
                { key: 'retirementPlan' as const, label: 'Retirement plan' },
                { key: 'thirdPartySickPay' as const, label: 'Third-party sick pay' },
              ] as const
            ).map(opt => {
              const checked = !!box13?.[opt.key]
              return (
                <label
                  key={opt.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-family-component)',
                    fontSize: 13,
                    color: '#21262a',
                    cursor: 'pointer',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                      onBox13Change?.({ [opt.key]: e.target.checked })
                    }}
                  />
                  {opt.label}
                </label>
              )
            })}
          </div>
          <FieldEditStatusBadges
            fieldKey="box13"
            unsavedFields={unsavedFields}
            recalculatedFields={recalculatedFields}
          />
          {flaggedFields['box13'] && !reviewedFields?.has('box13') && (
            <ValidationNote fieldKey="box13" />
          )}
        </div>
        <QuestionnaireFieldNote fieldKey="box13" />
      </div>
    </div>
  )
}

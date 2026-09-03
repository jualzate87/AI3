import { useEffect, useRef, useState } from 'react'
import { CircleCheck } from '@design-systems/icons'
import FieldAnnotationButton from './FieldAnnotationButton'
import Tooltip from './Tooltip'
import { DestinationFieldLabel } from './DestinationFieldLabel'
import { CLIENT_ADDRESS } from '../../data/clientAddress'
import { displayEditableAmount, parseAmountDraft, type LiveAmounts } from '../../data/liveReturn'
import DocVerifyHeaderActions from './DocVerifyHeaderActions'
import DetailSectionHeader from './DetailSectionHeader'
import InputFormPageHeader, { type InputDocTabItem } from '../input-return/InputFormPageHeader'
import styles from '../../styles/data-review/DetailFields.module.css'
import { canEditField, type DetailFieldsVariant } from './fieldEditability'

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M19.0711 7.0506C18.8836 6.86313 18.6293 6.75781 18.3641 6.75781C18.099 6.75781 17.8447 6.86313 17.6571 7.0506L9.87916 14.8286L6.34316 11.2936C6.15456 11.1115 5.90195 11.0107 5.63976 11.0129C5.37756 11.0152 5.12675 11.1204 4.94134 11.3058C4.75593 11.4912 4.65076 11.742 4.64848 12.0042C4.6462 12.2664 4.747 12.519 4.92916 12.7076L9.17216 16.9506C9.35968 17.1381 9.61399 17.2434 9.87916 17.2434C10.1443 17.2434 10.3986 17.1381 10.5861 16.9506L19.0711 8.4646C19.2586 8.27707 19.3639 8.02276 19.3639 7.7576C19.3639 7.49244 19.2586 7.23813 19.0711 7.0506Z" fill="currentColor"/>
    </svg>
  )
}

export type IntPayer = 'unwaverIngFinancial' | 'harborlineCredit' | 'cascadeFederal'

export const INT_PAYER_TABS: { key: IntPayer; label: string }[] = [
  { key: 'unwaverIngFinancial', label: 'Unwavering Financial' },
  { key: 'harborlineCredit',    label: 'Harborline Credit Union' },
  { key: 'cascadeFederal',      label: 'Cascade Federal Savings' },
]

/** Verified-docs key — canonical definition in verifiedDocKeys.ts */
import { intVerifiedDocKey } from '../../data/verifiedDocKeys'
export { intVerifiedDocKey }

// 1099-INT payers — Jessica Drake TY 2025
const PAYER_DATA: Record<IntPayer, { ein: string; name: string; street: string; city: string; state: string; zip: string; payerPhone: string }> = {
  unwaverIngFinancial: {
    ein: '47-8821034',
    name: 'Unwavering Financial LLC',
    street: '800 Capital Way, Suite 1100',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    payerPhone: '(720) 555-0188',
  },
  harborlineCredit: {
    ein: '88-1122334',
    name: 'Harborline Credit Union',
    street: '100 Bank Plaza',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    payerPhone: '',
  },
  cascadeFederal: {
    ein: '91-4455667',
    name: 'Cascade Federal Savings',
    street: '88 Riverside Ave',
    city: 'Portland',
    state: 'OR',
    zip: '97204',
    payerPhone: '',
  },
}

const RECIPIENT_DATA = {
  // Full SSN visible during import accuracy review so preparers can verify against source
  ssn: '987-65-4321',
  ...CLIENT_ADDRESS,
}

// Form 1099-INT boxes per payer — Jessica Drake values
const FORM_DATA: Record<IntPayer, {
  box1_interest: string; box2_earlyPenalty: string; box3_usBonds: string;
  box4_fedTaxWithheld: string; box5_investExpenses: string; box6_foreignTax: string;
  box7_foreignCountry: string; box8_taxExempt: string; box9_specPrivActivity: string;
  box10_marketDiscount: string; box11_bondPremium: string; box13_stateTaxId: string;
  box14_stateTax: string; box15_stateIncome: string;
}> = {
  unwaverIngFinancial: {
    box1_interest:        '1,986',   // Box 1 — Interest income
    box2_earlyPenalty:    '',        // Box 2 — Early withdrawal penalty
    box3_usBonds:         '',        // Box 3 — Dropped on return (source has $1,500)
    box4_fedTaxWithheld:  '',        // Box 4 — Federal income tax withheld
    box5_investExpenses:  '',        // Box 5 — Investment expenses
    box6_foreignTax:      '',        // Box 6 — Foreign tax paid
    box7_foreignCountry:  '',        // Box 7 — Foreign country or U.S. possession
    box8_taxExempt:       '180',     // Box 8 — Tax-exempt interest
    box9_specPrivActivity:'',        // Box 9 — Specified private activity bond interest
    box10_marketDiscount: '',        // Box 10 — Market discount
    box11_bondPremium:    '',        // Box 11 — Bond premium
    box13_stateTaxId:     '',
    box14_stateTax:       '',
    box15_stateIncome:    '',
  },
  harborlineCredit: {
    box1_interest:        '3,200',
    box2_earlyPenalty:    '',
    box3_usBonds:         '',
    box4_fedTaxWithheld:  '',
    box5_investExpenses:  '',
    box6_foreignTax:      '',
    box7_foreignCountry:  '',
    box8_taxExempt:       '',
    box9_specPrivActivity:'',
    box10_marketDiscount: '',
    box11_bondPremium:    '',
    box13_stateTaxId:     '',
    box14_stateTax:       '',
    box15_stateIncome:    '',
  },
  cascadeFederal: {
    box1_interest:        '1,150',
    box2_earlyPenalty:    '',
    box3_usBonds:         '',
    box4_fedTaxWithheld:  '',
    box5_investExpenses:  '',
    box6_foreignTax:      '',
    box7_foreignCountry:  '',
    box8_taxExempt:       '',
    box9_specPrivActivity:'',
    box10_marketDiscount: '',
    box11_bondPremium:    '',
    box13_stateTaxId:     '',
    box14_stateTax:       '',
    box15_stateIncome:    '',
  },
}

interface DetailFields1099Props {
  activePayer: IntPayer
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string) => void
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
  amounts?: LiveAmounts
  onAmountChange?: (patch: Partial<LiveAmounts>, editedKey?: string) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  editedFields?: Set<string>
  editedFieldsMeta?: Map<string, { by: string; at: string }>
  /** Persisted static field values (payer/recipient info, box amounts as text) */
  fieldOverrides?: Record<string, string>
  /** Persist a static field edit (also stamps Edited badge) */
  onFieldOverride?: (fieldKey: string, value: string) => void
  verifiedDocs?: Set<string>
  verifiedDocsMeta?: Map<string, { by: string; at: string }>
  reviewerConfirmedDocs?: Set<string>
  reviewerConfirmedDocsMeta?: Map<string, { by: string; at: string }>
  onVerifyDoc?: (docKey: string) => void
  flaggedFields?: Record<string, string>
  onAddFieldNote?: (text: string, context: string) => void
  importReadOnly?: boolean
  variant?: DetailFieldsVariant
  showEmptyWhenZero?: boolean
  onViewSourceDocuments?: () => void
  docTabs?: InputDocTabItem[]
  activeDocKey?: string
  onDocTabChange?: (key: string) => void
}

export default function DetailFields1099({
  activePayer,
  selectedField,
  highlightMode = 'blue',
  onFieldSelect,
  fieldValues,
  onFieldValueChange,
  amounts,
  onAmountChange,
  onMarkReviewed,
  onMarkReviewedBulk,
  reviewedFields,
  editedFields: syncedEditedFields,
  editedFieldsMeta,
  fieldOverrides = {},
  onFieldOverride,
  verifiedDocs,
  verifiedDocsMeta,
  reviewerConfirmedDocs,
  reviewerConfirmedDocsMeta,
  onVerifyDoc,
  flaggedFields = {},
  onAddFieldNote,
  importReadOnly = false,
  variant = 'review',
  showEmptyWhenZero = false,
  onViewSourceDocuments,
  docTabs,
  activeDocKey,
  onDocTabChange,
}: DetailFields1099Props) {
  const fmt = (n: number) => displayEditableAmount(n, showEmptyWhenZero)
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  const [savedField, setSavedField] = useState<string | null>(null)
  const [localEdited, setLocalEdited] = useState<Set<string>>(new Set())
  const isEdited = (key: string) => syncedEditedFields?.has(key) || localEdited.has(key)
  const editMetaText = (key: string) => {
    const m = editedFieldsMeta?.get(key)
    return m ? `Edited · ${m.by} · ${m.at}` : 'Edited'
  }
  const reviewedTip = (key: string, active: boolean) => {
    if (!active) return 'Mark as correct'
    const m = reviewedFields?.get(key)
    return m ? `Marked correct · ${m.by} · ${m.at}` : 'Click to unmark'
  }
  // Field key whose comment popover is currently open + its anchor position (fixed)
  useEffect(() => {
    if (selectedField && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedField])

  const startEdit = (field: string, currentValue: string) => {
    if (!canEditField(field, variant, importReadOnly)) return
    const clean = currentValue.replace(/,/g, '')
    setEditingField(field)
    setDraftValue(clean)
    setOriginalValue(clean)
  }

  const commitEdit = (field: 'taxableInterest') => {
    if (editingField !== field) return
    if (draftValue !== originalValue) {
      const num = parseFloat(draftValue.replace(/,/g, '')) || 0
      onFieldValueChange?.(field, num)
      onAmountChange?.({ interestUnwavering: num }, 'taxableInterest')
      setLocalEdited(prev => new Set(prev).add(field))
      setSavedField(field)
      setTimeout(() => setSavedField(null), 3500)
      onMarkReviewed?.(field)
    }
    setEditingField(null)
  }

  const cancelEdit = () => { setEditingField(null); setDraftValue(''); setOriginalValue('') }

  const renderAnnotationBtn = (fieldKey: string, label: string) => (
    <FieldAnnotationButton
      fieldKey={fieldKey}
      contextLabel={`1099-INT · ${label}`}
      variant="detail"
      allowFlagTypes
      onAddNote={onAddFieldNote}
    />
  )

  const ValidationNote = ({ fieldKey }: { fieldKey: string }) => {
    const issue = flaggedFields[fieldKey]
    if (!issue) return null
    const isReviewed = reviewedFields?.has(fieldKey)
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

  // Editable row with hover-revealed Edit + Mark as correct + Comment — same pattern as
  // the W-2 panel's renderStaticRow. Per-payer Box 1 interest also updates live amounts.
  const renderReadOnlyRow = (
    fieldKey: string,
    label: string,
    defaultValue: string,
    inputClass = styles.fieldInputSmall,
    placeholder?: string,
    /** Phase 1 flag key — when set, drives orange attention styling until resolved */
    flagKey?: string,
  ) => {
    const syncedInterest =
      amounts && fieldKey.startsWith('taxableInterest-')
        ? activePayer === 'unwaverIngFinancial'
          ? fmt(amounts.interestUnwavering)
          : activePayer === 'harborlineCredit'
          ? fmt(amounts.interestHarborline)
          : activePayer === 'cascadeFederal'
            ? fmt(amounts.interestCascade)
            : null
        : null
    const currentVal = syncedInterest !== null
      ? syncedInterest
      : (fieldOverrides[fieldKey] ?? (showEmptyWhenZero ? '' : defaultValue))
    const editable = canEditField(fieldKey, variant, importReadOnly)
    const isEditing = editable && editingField === fieldKey
    const isReviewed = reviewedFields?.has(fieldKey)
    const isSelected = selectedField === fieldKey
    const flagUnresolved = !!(flagKey && flaggedFields[flagKey] && !reviewedFields?.has(flagKey))
    const flowsTo1040 = fieldKey.startsWith('taxableInterest-') || fieldKey.startsWith('taxExempt-')
    const commitStatic = () => {
      if (editingField !== fieldKey) return
      if (draftValue !== originalValue) {
        onFieldOverride?.(fieldKey, draftValue)
        setLocalEdited(prev => new Set(prev).add(fieldKey))
        setSavedField(fieldKey)
        setTimeout(() => setSavedField(null), 3500)
        const num = parseAmountDraft(draftValue)
        if (fieldKey.startsWith('taxableInterest-')) {
          if (activePayer === 'harborlineCredit') onAmountChange?.({ interestHarborline: num }, fieldKey)
          else if (activePayer === 'cascadeFederal') onAmountChange?.({ interestCascade: num }, fieldKey)
        }
        if (draftValue.trim()) onMarkReviewed?.(fieldKey)
      }
      setEditingField(null)
    }
    return (
      <div
        ref={isSelected ? highlightedRef : undefined}
        className={`${styles.fieldRow} ${flagUnresolved ? styles.fieldRowHasNote : ''} ${isSelected ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
        onClick={() => onFieldSelect?.(fieldKey)}
        style={{ cursor: 'pointer' }}
      >
        <DestinationFieldLabel
          fieldKey={fieldKey}
          className={`${styles.fieldLabel} ${flagUnresolved ? styles.fieldLabelFlagged : ''}`}
        >
          {flagUnresolved && <span className={styles.issueIndicator} />}
          {label}
        </DestinationFieldLabel>
        <input
          className={`${styles.fieldInput} ${inputClass} ${!editable ? styles.fieldInputDisplay : ''} ${isEditing ? styles.fieldInputEditing : flagUnresolved ? styles.fieldInputHighlightedOrange : isSelected ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
          readOnly
          tabIndex={editable ? undefined : -1}
          aria-readonly={!editable}
          value={isEditing ? draftValue : currentVal}
          onChange={editable ? (e => setDraftValue(e.target.value)) : undefined}
          placeholder={placeholder}
          autoFocus={isEditing}
          onClick={editable ? (e => { e.stopPropagation(); if (!isEditing) startEdit(fieldKey, currentVal) }) : undefined}
          onBlur={editable ? commitStatic : undefined}
          onKeyDown={editable ? (e => { if (e.key === 'Enter') { e.preventDefault(); commitStatic() } if (e.key === 'Escape') cancelEdit() }) : undefined}
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
          <Tooltip text={reviewedTip(fieldKey, true)} placement="top">
            <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button>
          </Tooltip>
        ) : importReadOnly || variant === 'input' || !editable ? null : (
          <div className={styles.fieldActions}>
            <Tooltip text={reviewedTip(fieldKey, false)} placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button></Tooltip>
            {renderAnnotationBtn(fieldKey, label)}
          </div>
        )}
        {savedField === fieldKey && <span className={styles.recalcBadge}>{flowsTo1040 ? '1040 updated' : 'Saved'}</span>}
        {isEdited(fieldKey) && savedField !== fieldKey && (
          <Tooltip text={editMetaText(fieldKey)} placement="top">
            <span className={styles.editedBadge}>Edited</span>
          </Tooltip>
        )}
      </div>
    )
  }

  const payer = PAYER_DATA[activePayer]
  const form = FORM_DATA[activePayer]
  const docKey = intVerifiedDocKey(activePayer)
  const isPrimary = activePayer === 'unwaverIngFinancial'

  return (
    <div className={styles.container}>
      {variant === 'input' ? (
        <InputFormPageHeader
          title="Details: Interest Income (1099-INT)"
          onViewSourceDocuments={onViewSourceDocuments}
          docTabs={docTabs}
          activeDocKey={activeDocKey}
          onDocTabChange={onDocTabChange}
        />
      ) : (
        <div className={styles.pageHeader}>
          <div className={styles.headerActions}>
            <div className={styles.headerTitleRow}>
              <h2 className={styles.headerTitle}>Details: Interest Income (1099-INT)</h2>
            </div>
            <DocVerifyHeaderActions
              docKey={docKey}
              verifiedDocs={verifiedDocs}
              verifiedDocsMeta={verifiedDocsMeta}
              reviewerConfirmedDocs={reviewerConfirmedDocs}
              reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
              onVerifyDoc={onVerifyDoc}
              reviewedFields={reviewedFields}
            />
          </div>
        </div>
      )}

      <div className={styles.inputContainer}>

        {/* ── Payer Information ── */}
        <DetailSectionHeader variant={variant}>
          Payer Information (MANDATORY for e-file)
        </DetailSectionHeader>

        {renderReadOnlyRow(`payerEin-${activePayer}`, "(a) Payer's federal ID number (EIN)", payer.ein)}
        {renderReadOnlyRow(`payerName-${activePayer}`, "(b) Payer's name", payer.name, styles.fieldInputWide)}
        {renderReadOnlyRow(`payerStreet-${activePayer}`, 'Street address', payer.street, styles.fieldInputWide)}
        {renderReadOnlyRow(`payerCityStateZip-${activePayer}`, 'City / State / ZIP code', `${payer.city}, ${payer.state} ${payer.zip}`, styles.fieldInputWide)}
        {renderReadOnlyRow(`payerPhone-${activePayer}`, "Payer's telephone number", payer.payerPhone)}

        {/* ── Recipient Information ── */}
        <DetailSectionHeader variant={variant}>
          Recipient Information
        </DetailSectionHeader>

        {renderReadOnlyRow(`recipientSsn-${activePayer}`, "(c) Recipient's SSN or ITIN", RECIPIENT_DATA.ssn)}
        {renderReadOnlyRow(`recipientName-${activePayer}`, "(d) Recipient's name", RECIPIENT_DATA.name, styles.fieldInputWide)}
        {renderReadOnlyRow(`recipientStreet-${activePayer}`, 'Street address', RECIPIENT_DATA.street, styles.fieldInputWide)}
        {renderReadOnlyRow(`recipientCityStateZip-${activePayer}`, 'City / State / ZIP code', `${RECIPIENT_DATA.city}, ${RECIPIENT_DATA.state} ${RECIPIENT_DATA.zip}`, styles.fieldInputWide)}

        {/* ── Interest Income ── */}
        <DetailSectionHeader variant={variant}>
          Interest Income
        </DetailSectionHeader>

        {isPrimary ? (
          <>
            <div
              ref={selectedField === 'taxableInterest' ? highlightedRef : undefined}
              className={`${styles.fieldRow} ${flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') ? styles.fieldRowHasNote : ''} ${selectedField === 'taxableInterest' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
              onClick={() => onFieldSelect?.('taxableInterest')}
              style={{ cursor: 'pointer' }}
            >
              <DestinationFieldLabel
                fieldKey="taxableInterest"
                className={`${styles.fieldLabel} ${flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') ? styles.fieldLabelFlagged : ''}`}
              >
                {flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') && <span className={styles.issueIndicator} />}
                (1) Interest income
              </DestinationFieldLabel>
              <input
                className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'taxableInterest' ? styles.fieldInputEditing : flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') ? styles.fieldInputHighlightedOrange : selectedField === 'taxableInterest' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
                readOnly={editingField !== 'taxableInterest'}
                value={editingField === 'taxableInterest' ? draftValue : (fieldValues?.taxableInterest !== undefined ? fmt(fieldValues.taxableInterest) : (showEmptyWhenZero ? '' : form.box1_interest))}
                onChange={e => setDraftValue(e.target.value)}
                autoFocus={editingField === 'taxableInterest'}
                onClick={e => { e.stopPropagation(); if (canEditField('taxableInterest', variant, importReadOnly) && editingField !== 'taxableInterest') startEdit('taxableInterest', fieldValues?.taxableInterest?.toString() ?? form.box1_interest) }}
                onBlur={() => commitEdit('taxableInterest')}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit('taxableInterest') } if (e.key === 'Escape') cancelEdit() }}
              />
              {editingField === 'taxableInterest' ? (
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
              ) : reviewedFields?.has('taxableInterest') ? (
                <Tooltip text="Click to unmark" placement="top">
                  <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.('taxableInterest') }}><CircleCheck size="small" /></button>
                </Tooltip>
              ) : (
                <div className={styles.fieldActions}>
                  <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('taxableInterest') }}><CircleCheck size="small" /></button></Tooltip>
                  {renderAnnotationBtn('taxableInterest', '(1) Interest income')}
                </div>
              )}
              {savedField === 'taxableInterest' && <span className={styles.recalcBadge}>1040 updated</span>}
              {isEdited('taxableInterest') && savedField !== 'taxableInterest' && <span className={styles.editedBadge}>Edited</span>}
            </div>
            <ValidationNote fieldKey="taxableInterest" />
          </>
        ) : (
          renderReadOnlyRow(`taxableInterest-${activePayer}`, '(1) Interest income', form.box1_interest)
        )}
        {renderReadOnlyRow(`earlyPenalty-${activePayer}`, '(2) Early withdrawal penalty', form.box2_earlyPenalty)}
        {renderReadOnlyRow(`usBonds-${activePayer}`, '(3) Interest on U.S. Savings Bonds & T-bills', form.box3_usBonds)}
        {renderReadOnlyRow(`fedTaxWithheld-${activePayer}`, '(4) Federal income tax withheld', form.box4_fedTaxWithheld)}
        {renderReadOnlyRow(`investExpenses-${activePayer}`, '(5) Investment expenses', form.box5_investExpenses)}
        {renderReadOnlyRow(`foreignTax-${activePayer}`, '(6) Foreign tax paid', form.box6_foreignTax)}
        {renderReadOnlyRow(`foreignCountry-${activePayer}`, '(7) Foreign country or U.S. possession', form.box7_foreignCountry, styles.fieldInputWide, 'N/A')}
        {renderReadOnlyRow(`taxExempt-${activePayer}`, '(8) Tax-exempt interest', form.box8_taxExempt)}
        {renderReadOnlyRow(`specPrivActivity-${activePayer}`, '(9) Specified private activity bond interest', form.box9_specPrivActivity)}
        {renderReadOnlyRow(`marketDiscount-${activePayer}`, '(10) Market discount', form.box10_marketDiscount)}
        {renderReadOnlyRow(`bondPremium-${activePayer}`, '(11) Bond premium', form.box11_bondPremium)}

        {/* ── State Tax Information ── */}
        <DetailSectionHeader variant={variant}>
          State Tax Information
        </DetailSectionHeader>

        {renderReadOnlyRow(`stateTaxId-${activePayer}`, "(13) State / Payer's state ID number", form.box13_stateTaxId)}
        {renderReadOnlyRow(`stateTax-${activePayer}`, '(14) State income tax withheld', form.box14_stateTax)}
        {renderReadOnlyRow(`stateIncome-${activePayer}`, '(15) State income', form.box15_stateIncome)}

      </div>
    </div>
  )
}

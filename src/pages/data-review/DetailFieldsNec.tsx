import { useEffect, useRef, useState } from 'react'
import { CircleCheck } from '@design-systems/icons'
import PageMessage from '@ids-ts/page-message'
import '@ids-ts/page-message/dist/main.css'
import { B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import FieldAnnotationButton from './FieldAnnotationButton'
import Tooltip from './Tooltip'
import { DestinationFieldLabel } from './DestinationFieldLabel'
import { CLIENT_ADDRESS } from '../../data/clientAddress'
import { displayEditableAmount, NEC_SOURCE_AMOUNT, parseAmountDraft, type LiveAmounts } from '../../data/liveReturn'
import DocVerifyHeaderActions from './DocVerifyHeaderActions'
import QuestionnaireFieldNote from './QuestionnaireFieldNote'
import styles from '../../styles/data-review/DetailFields.module.css'
import { canEditField, type DetailFieldsVariant } from './fieldEditability'

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M19.0711 7.0506C18.8836 6.86313 18.6293 6.75781 18.3641 6.75781C18.099 6.75781 17.8447 6.86313 17.6571 7.0506L9.87916 14.8286L6.34316 11.2936C6.15456 11.1115 5.90195 11.0107 5.63976 11.0129C5.37756 11.0152 5.12675 11.1204 4.94134 11.3058C4.75593 11.4912 4.65076 11.742 4.64848 12.0042C4.6462 12.2664 4.747 12.519 4.92916 12.7076L9.17216 16.9506C9.35968 17.1381 9.61399 17.2434 9.87916 17.2434C10.1443 17.2434 10.3986 17.1381 10.5861 16.9506L19.0711 8.4646C19.2586 8.27707 19.3639 8.02276 19.3639 7.7576C19.3639 7.49244 19.2586 7.23813 19.0711 7.0506Z" fill="currentColor"/>
    </svg>
  )
}

export type NecPayer = 'summit'

export const NEC_PAYER_TABS: { key: NecPayer; label: string }[] = [
  { key: 'summit', label: 'Summit Advisory Partners' },
]

// 1099-NEC — Summit Advisory Partners (Jessica Drake TY 2025)
const PAYER_DATA = {
  ein: '47-2201893',
  name: 'Summit Advisory Partners LLC',
  street: '410 Congress Street, Suite 900',
  city: 'Boston',
  state: 'MA',
  zip: '02210',
  payerPhone: '617 555-0143',
}

const RECIPIENT_DATA = {
  ssn: 'XXX-XX-4321',
  ...CLIENT_ADDRESS,
}

const FORM_DATA = {
  // Box 1 — silent omit (error #10): source doc shows $24,000; return starts at $0
  box1_nonemployeeComp: '0',
  box4_fedTaxWithheld:  '',
  box5_stateTaxId:      '',
  box6_stateTax:        '',
  box7_stateIncome:     '',
}

const DOC_KEY = '1099-nec'

interface DetailFieldsNecProps {
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string) => void
  amounts?: LiveAmounts
  onAmountChange?: (patch: Partial<LiveAmounts>, editedKey?: string) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  editedFields?: Set<string>
  /** Persisted static field values */
  fieldOverrides?: Record<string, string>
  /** Persist a static field edit (also stamps Edited badge) */
  onFieldOverride?: (fieldKey: string, value: string) => void
  verifiedDocs?: Set<string>
  verifiedDocsMeta?: Map<string, { by: string; at: string }>
  reviewerConfirmedDocs?: Set<string>
  reviewerConfirmedDocsMeta?: Map<string, { by: string; at: string }>
  onVerifyDoc?: (docKey: string) => void
  onAddFieldNote?: (text: string, context?: string) => void
  importReadOnly?: boolean
  /** Phase 1 import flags — field key → validation message */
  flaggedFields?: Record<string, string>
  /** Input return mode — plain editable fields without verify header */
  variant?: DetailFieldsVariant
  showEmptyWhenZero?: boolean
  /** Navigate to Schedule C gross receipts when NEC flows to the return */
  onOpenScheduleC?: () => void
}

export default function DetailFieldsNec({
  selectedField,
  highlightMode = 'blue',
  onFieldSelect,
  amounts,
  onAmountChange,
  onMarkReviewed,
  onMarkReviewedBulk,
  reviewedFields,
  editedFields: syncedEditedFields,
  fieldOverrides = {},
  onFieldOverride,
  verifiedDocs,
  verifiedDocsMeta,
  reviewerConfirmedDocs,
  reviewerConfirmedDocsMeta,
  onVerifyDoc,
  onAddFieldNote,
  importReadOnly = false,
  flaggedFields = {},
  variant = 'review',
  showEmptyWhenZero = false,
  onOpenScheduleC,
}: DetailFieldsNecProps) {
  const fmt = (n: number) => displayEditableAmount(n, showEmptyWhenZero)
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  const [savedField, setSavedField] = useState<string | null>(null)
  const [localEdited, setLocalEdited] = useState<Set<string>>(new Set())
  const isEdited = (key: string) => syncedEditedFields?.has(key) || localEdited.has(key)

  const scheduleCNeedsSetup =
    variant === 'review' &&
    !amounts?.necOnReturn &&
    (NEC_SOURCE_AMOUNT > 0 || (amounts?.necIncome ?? 0) > 0 || !!flaggedFields['nec-box1'])

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

  const cancelEdit = () => { setEditingField(null); setDraftValue(''); setOriginalValue('') }

  const renderAnnotationBtn = (fieldKey: string, label: string) => (
    <FieldAnnotationButton
      fieldKey={fieldKey}
      contextLabel={`1099-NEC · ${label}`}
      variant="detail"
      allowFlagTypes
      onAddNote={onAddFieldNote}
    />
  )

  const ValidationNote = ({ fieldKey }: { fieldKey: string }) => {
    const issue = flaggedFields[fieldKey]
    if (!issue) return null
    const resolved = reviewedFields?.has(fieldKey)
    return (
      <div className={styles.validationNote} style={resolved ? { color: '#1a6b35' } : {}}>
        {resolved ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" fill="#1a6b35"/><path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="6" cy="6" r="5.5" fill="#c9500f"/><path d="M6 3.5V6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="8.5" r="0.6" fill="white"/></svg>
        )}
        <span style={resolved ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>{issue}</span>
      </div>
    )
  }

  const renderStaticRow = (
    fieldKey: string,
    label: string,
    defaultValue: string,
    inputClass = styles.fieldInputSmall,
    selectKey?: string,
  ) => {
    const select = selectKey ?? fieldKey
    // Box 1 always reads from synced amounts (seeded 0 / necOnReturn false).
    // Source $24,000 lives only on the JPEG preview until the user edits+saves.
    const syncedNecDisplay =
      fieldKey === 'nec-box1' && amounts
        ? fmt(amounts.necIncome)
        : null
    const currentVal = syncedNecDisplay ?? fieldOverrides[fieldKey] ?? (showEmptyWhenZero ? '' : defaultValue)
    const editable = canEditField(fieldKey, variant, importReadOnly)
    const isEditing = editable && editingField === fieldKey
    const isFlagged = fieldKey === 'nec-box1' && !!flaggedFields['nec-box1'] && !reviewedFields?.has(fieldKey)
    const isReviewed = reviewedFields?.has(fieldKey)
    const isSelected = selectedField === select || selectedField === fieldKey || selectedField === 'necIncome'
    const commitStatic = () => {
      if (editingField !== fieldKey) return
      if (draftValue !== originalValue) {
        onFieldOverride?.(fieldKey, draftValue)
        setLocalEdited(prev => new Set(prev).add(fieldKey))
        setSavedField(fieldKey)
        setTimeout(() => setSavedField(null), 3500)
        // Saving NEC Box 1 confirms omitted income onto Form 1040 line 8
        if (fieldKey === 'nec-box1') {
          const parsed = parseAmountDraft(draftValue)
          // Empty save defaults to source amount (the planted miss the preparer is correcting)
          const num = parsed > 0 ? parsed : NEC_SOURCE_AMOUNT
          onAmountChange?.({ necIncome: num, necOnReturn: true }, 'nec-box1')
        }
        if (draftValue.trim() || fieldKey === 'nec-box1') onMarkReviewed?.(fieldKey)
      }
      setEditingField(null)
    }
    const row = (
      <div
        ref={isSelected ? highlightedRef : undefined}
        className={`${styles.fieldRow} ${isFlagged ? styles.fieldRowHasNote : ''} ${isSelected ? (highlightMode === 'orange' && isFlagged ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
        onClick={() => onFieldSelect?.(select)}
        style={{ cursor: 'pointer' }}
      >
        <DestinationFieldLabel fieldKey={fieldKey} className={`${styles.fieldLabel} ${isFlagged ? styles.fieldLabelFlagged : ''}`}>
          {isFlagged && <span className={styles.issueIndicator} />}
          {label}
        </DestinationFieldLabel>
        <input
          className={`${styles.fieldInput} ${inputClass} ${!editable ? styles.fieldInputDisplay : ''} ${isEditing ? styles.fieldInputEditing : isFlagged ? styles.fieldInputHighlightedOrange : isSelected ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
          readOnly
          tabIndex={editable ? undefined : -1}
          aria-readonly={!editable}
          value={isEditing ? draftValue : currentVal}
          onChange={editable ? (e => setDraftValue(e.target.value)) : undefined}
          placeholder={!isEditing && isFlagged ? 'Not imported' : undefined}
          autoFocus={isEditing}
          onClick={editable ? (e => { e.stopPropagation(); if (!isEditing) startEdit(fieldKey, currentVal) }) : undefined}
          onBlur={editable ? commitStatic : undefined}
          onKeyDown={editable ? (e => {
            if (e.key === 'Enter') { e.preventDefault(); commitStatic() }
            if (e.key === 'Escape') cancelEdit()
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
          (() => {
            const meta = reviewedFields?.get(fieldKey)
            const tip = meta ? `Reviewed by ${meta.by} · ${meta.at}. Click to unmark` : 'Click to unmark'
            return (
              <Tooltip text={tip} placement="top">
                <button className={styles.markCorrectBtn} style={{ color: '#108000' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button>
              </Tooltip>
            )
          })()
        ) : importReadOnly || variant === 'input' || !editable ? null : (
          <div className={styles.fieldActions}>
            <Tooltip text="Mark as correct" placement="top">
              <button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button>
            </Tooltip>
            {renderAnnotationBtn(fieldKey, label)}
          </div>
        )}
        {savedField === fieldKey && <span className={styles.recalcBadge}>{fieldKey === 'nec-box1' ? '1040 updated' : 'Saved'}</span>}
        {isEdited(fieldKey) && savedField !== fieldKey && <span className={styles.editedBadge}>Edited</span>}
      </div>
    )
    if (fieldKey === 'nec-box1' && flaggedFields['nec-box1']) {
      return (
        <>
          {row}
          <ValidationNote fieldKey="nec-box1" />
        </>
      )
    }
    return row
  }

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerActions}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Details: Nonemployee Comp (1099-NEC)</h2>
          </div>
          {variant !== 'input' && (
          <DocVerifyHeaderActions
            docKey={DOC_KEY}
            verifiedDocs={verifiedDocs}
            verifiedDocsMeta={verifiedDocsMeta}
            reviewerConfirmedDocs={reviewerConfirmedDocs}
            reviewerConfirmedDocsMeta={reviewerConfirmedDocsMeta}
            onVerifyDoc={onVerifyDoc}
            reviewedFields={reviewedFields}
          />
          )}
        </div>
      </div>

      <div
        className={[
          styles.inputContainer,
          variant === 'input' ? styles.inputContainerInput : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >

        {scheduleCNeedsSetup && (
          <div className={styles.necSchCMessage}>
            <PageMessage
              type="warn"
              title="NEC income may need Schedule C"
              open
              dismissible={false}
              actionLabel={onOpenScheduleC ? 'Open Schedule C' : undefined}
              onActionClick={onOpenScheduleC}
            >
              <B3>
                Nonemployee compensation flows to return income, but Schedule C may still need
                business info and expenses before you can finalize self-employment tax.
              </B3>
            </PageMessage>
          </div>
        )}

        {/* ── Payer Information ── */}
        <div className={styles.sectionHeader}>
          Payer Information (MANDATORY for e-file)
        </div>

        {renderStaticRow('nec-ein', "(a) Payer's federal ID number (EIN)", PAYER_DATA.ein)}
        {renderStaticRow('nec-payerName', "(b) Payer's name", PAYER_DATA.name, styles.fieldInputWide)}
        {renderStaticRow('nec-street', 'Street address', PAYER_DATA.street, styles.fieldInputWide)}
        {renderStaticRow('nec-cityStateZip', 'City / State / ZIP code', `${PAYER_DATA.city}, ${PAYER_DATA.state} ${PAYER_DATA.zip}`, styles.fieldInputWide)}
        {renderStaticRow('nec-phone', "Payer's telephone number", PAYER_DATA.payerPhone)}

        {/* ── Recipient Information ── */}
        <div className={styles.sectionHeader}>Recipient Information</div>

        {renderStaticRow('nec-ssn', "(c) Recipient's SSN or ITIN", RECIPIENT_DATA.ssn)}
        {renderStaticRow('nec-recipientName', "(d) Recipient's name", RECIPIENT_DATA.name, styles.fieldInputWide)}
        {renderStaticRow('nec-recipientStreet', 'Street address', RECIPIENT_DATA.street, styles.fieldInputWide)}
        {renderStaticRow('nec-recipientCityStateZip', 'City / State / ZIP code', `${RECIPIENT_DATA.city}, ${RECIPIENT_DATA.state} ${RECIPIENT_DATA.zip}`, styles.fieldInputWide)}

        {/* ── Nonemployee Compensation ── */}
        <div className={styles.sectionHeader}>Nonemployee Compensation</div>

        {renderStaticRow('nec-box1', '(1) Nonemployee compensation', FORM_DATA.box1_nonemployeeComp, styles.fieldInputSmall, 'nec-box1')}
        <QuestionnaireFieldNote fieldKey="nec-box1" />
        {renderStaticRow('nec-fedTaxWithheld', '(4) Federal income tax withheld', FORM_DATA.box4_fedTaxWithheld)}

        {/* ── State Tax Information ── */}
        <div className={styles.sectionHeader}>State Tax Information</div>

        {renderStaticRow('nec-stateTaxId', "(5) State / Payer's state ID number", FORM_DATA.box5_stateTaxId)}
        {renderStaticRow('nec-stateTax', '(6) State income tax withheld', FORM_DATA.box6_stateTax)}
        {renderStaticRow('nec-stateIncome', '(7) State income', FORM_DATA.box7_stateIncome)}

      </div>
    </div>
  )
}

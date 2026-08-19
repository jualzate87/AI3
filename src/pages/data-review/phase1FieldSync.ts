import type { TopTab } from './ReviewTab'
import type { DivPayer } from './DetailFieldsDiv'
import { normalizeVerifiedDocKey } from '../../data/verifiedDocKeys'
import type { IntPayer } from './DetailFields1099'
import type { W2Employer } from './DetailFields'
import type { NecPayer } from './DetailFieldsNec'

/** Import-flag keys emitted by DetailFields mark-reviewed controls. */
export const PHASE1_FLAG_KEYS = [
  'ssn-techCircle',
  'wages-techCircle',
  'box12',
  'ein-techCircle',
  'divCollectibles',
  'divNonDiv',
  'fedTaxWithheld',
  'taxableInterest',
  'grossDistrib-meridian',
  'ordinaryDivs-northmark',
  'nec-box1',
] as const

export type Phase1FlagKey = (typeof PHASE1_FLAG_KEYS)[number]

export type Phase1VerifyItem = {
  flagKey: Phase1FlagKey
  /** Detail-fields selection key (canonical selectedField value) */
  field: string
  tab: TopTab
  divPayer?: DivPayer
  intPayer?: IntPayer
}

/** Ordered Verify queue — W-2 flags first, then DIV, INT, 1099-R. */
export const PHASE1_VERIFY_QUEUE: Phase1VerifyItem[] = [
  { flagKey: 'ssn-techCircle',           field: 'ssn',             tab: 'w2s' },
  { flagKey: 'wages-techCircle',         field: 'wages',           tab: 'w2s' },
  { flagKey: 'box12',                    field: 'box12',           tab: 'w2s' },
  { flagKey: 'ein-techCircle',           field: 'ein',             tab: 'w2s' },
  { flagKey: 'divCollectibles',          field: 'divCollectibles', tab: '1099-divs', divPayer: 'tokenFinancial' },
  { flagKey: 'divNonDiv',                field: 'divNonDiv',       tab: '1099-divs', divPayer: 'tokenFinancial' },
  { flagKey: 'fedTaxWithheld',           field: 'fedTaxWithheld',  tab: '1099-divs', divPayer: 'tokenFinancial' },
  { flagKey: 'ordinaryDivs-northmark',   field: 'ordinaryDivs',    tab: '1099-divs', divPayer: 'northmarkIndex' },
  { flagKey: 'taxableInterest',          field: 'taxableInterest', tab: '1099-ints', intPayer: 'unwaverIngFinancial' },
  { flagKey: 'grossDistrib-meridian',    field: 'grossDistrib',    tab: '1099-rs' },
  { flagKey: 'nec-box1',                 field: 'nec-box1',        tab: '1099-necs' },
]

/** Detail field key → 1040 row field (when a 1040 line exists). */
const DETAIL_TO_1040: Record<string, string> = {
  wages: 'wages',
  taxableInterest: 'taxableInterest',
  ordinaryDivs: 'ordinaryDivs',
  qualifiedDivs: 'qualifiedDivs',
  fedTaxWithheld: 'withholding',
  /** 1099-R Box 4 — highlights 1040 line 25b (combined 1099 withholding) */
  withholding1099: 'withholding',
  'r-fedTaxWithheld': 'withholding',
  iraDistrib: 'iraDistrib',
  'r-taxableAmt': 'iraDistrib',
  grossDistrib: 'iraDistrib',
  /** NEC Box 1 → Form 1040 line 8 (other income) once confirmed onto return */
  necIncome: 'otherIncome',
  'nec-box1': 'otherIncome',
  otherIncome: 'otherIncome',
  /** 1099-INT Box 8 — tax-exempt interest → line 2a */
  'taxExempt-unwaverIngFinancial': 'taxExemptInterest',
  withholding: 'w2Withholding',
}

/** 1040 row field → detail field key + navigation. */
const FIELD_1040_TO_DETAIL: Record<string, Pick<Phase1VerifyItem, 'field' | 'tab' | 'divPayer' | 'intPayer'>> = {
  wages: { field: 'wages', tab: 'w2s' },
  taxableInterest: { field: 'taxableInterest', tab: '1099-ints', intPayer: 'unwaverIngFinancial' },
  taxExemptInterest: { field: 'taxExempt-unwaverIngFinancial', tab: '1099-ints', intPayer: 'unwaverIngFinancial' },
  ordinaryDivs: { field: 'ordinaryDivs', tab: '1099-divs', divPayer: 'northmarkIndex' },
  qualifiedDivs: { field: 'qualifiedDivs', tab: '1099-divs', divPayer: 'tokenFinancial' },
  withholding: { field: 'fedTaxWithheld', tab: '1099-divs', divPayer: 'tokenFinancial' },
  withholding1099: { field: 'withholding1099', tab: '1099-rs' },
  iraDistrib: { field: 'r-taxableAmt', tab: '1099-rs' },
  otherIncome: { field: 'nec-box1', tab: '1099-necs' },
  w2Withholding: { field: 'withholding', tab: 'w2s' },
}

export function detailTo1040Field(detailField: string | null): string | null {
  if (!detailField) return null
  if (DETAIL_TO_1040[detailField]) return DETAIL_TO_1040[detailField]
  // Per-payer detail keys: taxableInterest-harborlineCredit → taxableInterest
  if (detailField.startsWith('taxableInterest-')) return 'taxableInterest'
  if (detailField.startsWith('taxExempt-')) return 'taxExemptInterest'
  if (detailField.startsWith('ordinaryDivs-')) return 'ordinaryDivs'
  if (detailField.startsWith('qualifiedDivs-')) return 'qualifiedDivs'
  if (detailField.startsWith('fedTaxWithheld-')) return 'withholding'
  return null
}

export function field1040ToDetail(field1040: string): Phase1VerifyItem | null {
  const nav = FIELD_1040_TO_DETAIL[field1040]
  if (!nav) return null
  const queueItem = PHASE1_VERIFY_QUEUE.find(q => q.field === nav.field)
  return queueItem ?? { flagKey: 'wages-techCircle', ...nav } as Phase1VerifyItem
}

export function get1040HighlightField(selectedField: string | null): string | null {
  if (!selectedField) return null
  return detailTo1040Field(selectedField) ?? selectedField
}

/** Map a source-doc detail field key → Summary / 1040 row field for output highlight sync. */
export function resolveOutputFieldFromSource(detailField: string | null): string | null {
  return get1040HighlightField(detailField)
}

/** Box 12 sub-row reviewed keys for Tech Circle (multi-code W-2 layout). */
export function getBox12SubRowKeys(employer: W2Employer): string[] {
  if (employer === 'techCircle') {
    return ['box12a-techCircle', 'box12b-techCircle', 'box12c-techCircle', 'box12d-techCircle']
  }
  return []
}

/** True when the single Phase 1 `box12` flag is cleared — directly or via all sub-rows. */
export function isBox12FlagResolved(
  reviewedFields: Map<string, unknown>,
  employer: W2Employer = 'techCircle',
): boolean {
  if (reviewedFields.has('box12')) return true
  const subRows = getBox12SubRowKeys(employer)
  return subRows.length > 0 && subRows.every(k => reviewedFields.has(k))
}

export function isPhase1FlagResolved(
  flagKey: Phase1FlagKey,
  reviewedFields: Map<string, unknown>,
): boolean {
  if (flagKey === 'box12') return isBox12FlagResolved(reviewedFields)
  return reviewedFields.has(flagKey)
}

export function countPhase1Remaining(reviewedFields: Map<string, unknown>): number {
  return PHASE1_FLAG_KEYS.filter(k => !isPhase1FlagResolved(k, reviewedFields)).length
}

export function getUnresolvedVerifyQueue(reviewedFields: Map<string, unknown>): Phase1VerifyItem[] {
  return PHASE1_VERIFY_QUEUE.filter(q => !isPhase1FlagResolved(q.flagKey, reviewedFields))
}

export function getNextVerifyItem(
  reviewedFields: Map<string, unknown>,
  selectedField: string | null,
): Phase1VerifyItem | null {
  const unresolved = getUnresolvedVerifyQueue(reviewedFields)
  if (!unresolved.length) return null
  const currentIdx = unresolved.findIndex(q => q.field === selectedField)
  return unresolved[(currentIdx + 1) % unresolved.length]
}

export function navigationForDetailField(field: string): Pick<Phase1VerifyItem, 'tab' | 'divPayer' | 'intPayer'> | null {
  const fromQueue = PHASE1_VERIFY_QUEUE.find(q => q.field === field)
  if (fromQueue) return { tab: fromQueue.tab, divPayer: fromQueue.divPayer, intPayer: fromQueue.intPayer }
  const from1040 = Object.values(FIELD_1040_TO_DETAIL).find(n => n.field === field)
  if (from1040) return from1040

  // Per-payer detail keys used by FieldPopover source navigation
  if (field === 'taxExempt-unwaverIngFinancial' || field.startsWith('taxableInterest-')) {
    if (field.includes('harborline')) return { tab: '1099-ints', intPayer: 'harborlineCredit' }
    if (field.includes('cascade')) return { tab: '1099-ints', intPayer: 'cascadeFederal' }
    return { tab: '1099-ints', intPayer: 'unwaverIngFinancial' }
  }
  if (field.startsWith('ordinaryDivs-') || field.startsWith('qualifiedDivs-') || field.startsWith('fedTaxWithheld-')) {
    if (field.includes('northmark')) return { tab: '1099-divs', divPayer: 'northmarkIndex' }
    if (field.includes('beacon')) return { tab: '1099-divs', divPayer: 'beaconDividend' }
    return { tab: '1099-divs', divPayer: 'tokenFinancial' }
  }
  if (field === 'r-taxableAmt' || field === 'withholding1099' || field === 'r-fedTaxWithheld' || field === 'grossDistrib') {
    return { tab: '1099-rs' }
  }
  if (field === 'nec-box1' || field === 'necIncome') {
    return { tab: '1099-necs' }
  }
  if (field === 'wages' || field === 'withholding' || field === 'box13' || field === 'box12') {
    return { tab: 'w2s' }
  }
  if (field === 'fedTaxWithheld') {
    return { tab: '1099-divs', divPayer: 'tokenFinancial' }
  }
  return null
}

/** Phase 1 import flags per W-2 employer — keys match DetailFields reviewed-field ids. */
const W2_PAYER_FLAG_KEYS: Record<W2Employer, readonly string[]> = {
  techCircle: ['ssn-techCircle', 'wages-techCircle', 'box12', 'ein-techCircle'],
  bingEquipment: ['ssn-bingEquipment', 'wages-bingEquipment', 'box12', 'ein-bingEquipment'],
}

function isW2PayerFlagResolved(
  flagKey: string,
  employer: W2Employer,
  reviewedFields: Map<string, unknown>,
): boolean {
  if (flagKey === 'box12') return isBox12FlagResolved(reviewedFields, employer)
  return reviewedFields.has(flagKey)
}

/** Phase 1 import flags per 1099-DIV payer — primary + Northmark carry flags. */
const DIV_PAYER_FLAG_KEYS: Record<DivPayer, Phase1FlagKey[]> = {
  tokenFinancial: ['divCollectibles', 'divNonDiv', 'fedTaxWithheld'],
  northmarkIndex: ['ordinaryDivs-northmark'],
  beaconDividend: [],
}

/** Phase 1 import flags per 1099-R payer — Meridian gross distribution flagged. */
const R_PAYER_FLAG_KEYS: Record<'meridian', Phase1FlagKey[]> = {
  meridian: ['grossDistrib-meridian'],
}

/** Phase 1 import flags per 1099-INT payer — only primary payer carries flags. */
const INT_PAYER_FLAG_KEYS: Record<IntPayer, Phase1FlagKey[]> = {
  unwaverIngFinancial: ['taxableInterest'],
  harborlineCredit: [],
  cascadeFederal: [],
}

/** Phase 1 import flags per 1099-NEC payer — Summit Box 1 silent omit. */
const NEC_PAYER_FLAG_KEYS: Record<NecPayer, Phase1FlagKey[]> = {
  summit: ['nec-box1'],
}

export function countPhase1FlagsForW2Payer(
  employer: W2Employer,
  reviewedFields: Map<string, unknown>,
): number {
  return W2_PAYER_FLAG_KEYS[employer].filter(
    k => !isW2PayerFlagResolved(k, employer, reviewedFields),
  ).length
}

/** Unresolved W-2 Phase 1 flags across all payers — used for the W-2s top tab badge. */
export function countPhase1FlagsForW2Tab(reviewedFields: Map<string, unknown>): number {
  const seen = new Set<string>()
  let count = 0
  for (const employer of Object.keys(W2_PAYER_FLAG_KEYS) as W2Employer[]) {
    for (const k of W2_PAYER_FLAG_KEYS[employer]) {
      if (seen.has(k)) continue
      seen.add(k)
      if (!isW2PayerFlagResolved(k, employer, reviewedFields)) count++
    }
  }
  return count
}

/** Single source of truth for ReviewTab badge counts during Phase 1. */
export function getTabFlagCounts(reviewedFields: Map<string, unknown>): Record<string, number> {
  const divCount = (Object.keys(DIV_PAYER_FLAG_KEYS) as DivPayer[]).reduce(
    (sum, payer) => sum + countPhase1FlagsForDivPayer(payer, reviewedFields),
    0,
  )
  const intCount = (Object.keys(INT_PAYER_FLAG_KEYS) as IntPayer[]).reduce(
    (sum, payer) => sum + countPhase1FlagsForIntPayer(payer, reviewedFields),
    0,
  )
  const necCount = (Object.keys(NEC_PAYER_FLAG_KEYS) as NecPayer[]).reduce(
    (sum, payer) => sum + countPhase1FlagsForNecPayer(payer, reviewedFields),
    0,
  )
  return {
    w2s: countPhase1FlagsForW2Tab(reviewedFields),
    '1099-divs': divCount,
    '1099-ints': intCount,
    '1099-rs': R_PAYER_FLAG_KEYS.meridian.filter(k => !isPhase1FlagResolved(k, reviewedFields)).length,
    '1099-necs': necCount,
    'prior-1040': 0,
  }
}

/** Initial unresolved counts (empty reviewed map) — distinguishes “never had flags” from “cleared”. */
export function getTabInitialFlagCounts(): Record<string, number> {
  return getTabFlagCounts(new Map())
}

/** Summary 1040 field → related Phase 1 import flags (attention cue on Summary rows). */
const SUMMARY_FIELD_PHASE1_FLAGS: Record<string, Phase1FlagKey[]> = {
  wages: ['wages-techCircle', 'ssn-techCircle', 'ein-techCircle', 'box12'],
  taxableInterest: ['taxableInterest'],
  ordinaryDivs: ['ordinaryDivs-northmark'],
  qualifiedDivs: ['divCollectibles', 'divNonDiv'],
  withholding: ['fedTaxWithheld'],
  iraDistrib: ['grossDistrib-meridian'],
  otherIncome: ['nec-box1'],
}

/** True when any Phase 1 flag tied to this Summary row is still unresolved. */
export function summaryFieldHasUnresolvedFlags(
  field: string,
  reviewedFields: Map<string, unknown>,
): boolean {
  const keys = SUMMARY_FIELD_PHASE1_FLAGS[field]
  if (!keys?.length) return false
  return keys.some(k => !isPhase1FlagResolved(k, reviewedFields))
}

export function getInitialW2PayerFlagCount(employer: W2Employer): number {
  return W2_PAYER_FLAG_KEYS[employer].length
}

export function getInitialDivPayerFlagCount(payer: DivPayer): number {
  return DIV_PAYER_FLAG_KEYS[payer].length
}

export function getInitialIntPayerFlagCount(payer: IntPayer): number {
  return INT_PAYER_FLAG_KEYS[payer].length
}

export function getInitialRPayerFlagCount(): number {
  return R_PAYER_FLAG_KEYS.meridian.length
}

export function countPhase1FlagsForDivPayer(
  payer: DivPayer,
  reviewedFields: Map<string, unknown>,
): number {
  return DIV_PAYER_FLAG_KEYS[payer].filter(k => !isPhase1FlagResolved(k, reviewedFields)).length
}

export function countPhase1FlagsForRPayer(
  reviewedFields: Map<string, unknown>,
): number {
  return R_PAYER_FLAG_KEYS.meridian.filter(k => !isPhase1FlagResolved(k, reviewedFields)).length
}

export function countPhase1FlagsForIntPayer(
  payer: IntPayer,
  reviewedFields: Map<string, unknown>,
): number {
  return INT_PAYER_FLAG_KEYS[payer].filter(k => !isPhase1FlagResolved(k, reviewedFields)).length
}

export function countPhase1FlagsForNecPayer(
  payer: NecPayer,
  reviewedFields: Map<string, unknown>,
): number {
  return NEC_PAYER_FLAG_KEYS[payer].filter(k => !isPhase1FlagResolved(k, reviewedFields)).length
}

/**
 * Phase 1 flag keys (and box12 sub-rows) cleared when "Mark as verified" is used
 * for a given verified-docs key. Single source of truth for verify → clear flags.
 */
/** Unresolved Phase 1 import flags for one source document (data-critical until corrected). */
export function countUncorrectedCriticalFlagsForDoc(
  docKey: string,
  reviewedFields: Map<string, unknown>,
): number {
  docKey = normalizeVerifiedDocKey(docKey)
  if (docKey === 'techCircle' || docKey === 'bingEquipment') {
    return countPhase1FlagsForW2Payer(docKey, reviewedFields)
  }
  if (docKey.startsWith('1099-div-')) {
    const payer = docKey.slice('1099-div-'.length) as DivPayer
    return countPhase1FlagsForDivPayer(payer, reviewedFields)
  }
  if (docKey.startsWith('1099-int-')) {
    const payer = docKey.slice('1099-int-'.length) as IntPayer
    return countPhase1FlagsForIntPayer(payer, reviewedFields)
  }
  if (docKey === '1099-r') {
    return countPhase1FlagsForRPayer(reviewedFields)
  }
  if (docKey === '1099-nec') {
    return countPhase1FlagsForNecPayer('summit', reviewedFields)
  }
  return 0
}

export function docHasUncorrectedCriticalFlags(
  docKey: string,
  reviewedFields: Map<string, unknown>,
): boolean {
  return countUncorrectedCriticalFlagsForDoc(docKey, reviewedFields) > 0
}

/** Short persistent hint under Mark as verified while critical flags remain. */
export function getDocVerifyBlockedHint(uncorrectedCount: number): string {
  if (uncorrectedCount === 1) {
    return '1 critical issue must be corrected before you can mark this document verified.'
  }
  return `${uncorrectedCount} critical issues must be corrected before you can mark this document verified.`
}

/** Full message shown after the preparer clicks Mark as verified while blocked. */
export function getDocVerifyBlockedMessage(uncorrectedCount: number): string {
  if (uncorrectedCount === 1) {
    return 'Correct the critical flagged issue on this document before you mark it as verified.'
  }
  return `Correct ${uncorrectedCount} critical flagged issues on this document before you mark it as verified.`
}

export function getPhase1FlagKeysForVerifiedDoc(docKey: string): string[] {
  docKey = normalizeVerifiedDocKey(docKey)
  if (docKey === 'techCircle' || docKey === 'bingEquipment') {
    const flags = [...W2_PAYER_FLAG_KEYS[docKey]]
    if (docKey === 'techCircle') {
      return [...flags, ...getBox12SubRowKeys(docKey)]
    }
    return flags
  }
  if (docKey.startsWith('1099-div-')) {
    const payer = docKey.slice('1099-div-'.length) as DivPayer
    return [...(DIV_PAYER_FLAG_KEYS[payer] ?? [])]
  }
  if (docKey.startsWith('1099-int-')) {
    const payer = docKey.slice('1099-int-'.length) as IntPayer
    return [...(INT_PAYER_FLAG_KEYS[payer] ?? [])]
  }
  if (docKey === '1099-r') {
    return [...R_PAYER_FLAG_KEYS.meridian]
  }
  if (docKey === '1099-nec') {
    return [...NEC_PAYER_FLAG_KEYS.summit]
  }
  return []
}

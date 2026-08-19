import type { LiveAmounts } from '../../data/liveReturn'
import type { W2Employer } from './DetailFields'
import { W2_PAYER_TABS } from './DetailFields'
import type { DivPayer } from './DetailFieldsDiv'
import { DIV_PAYER_TABS, divVerifiedDocKey } from './DetailFieldsDiv'
import type { IntPayer } from './DetailFields1099'
import { INT_PAYER_TABS, intVerifiedDocKey } from './DetailFields1099'
import { R_PAYER_TABS } from './DetailFields1099R'
import { NEC_PAYER_TABS } from './DetailFieldsNec'
import {
  countUncorrectedCriticalFlagsForDoc,
  getInitialDivPayerFlagCount,
  getInitialIntPayerFlagCount,
  getInitialRPayerFlagCount,
  getInitialW2PayerFlagCount,
} from './phase1FieldSync'
import type { TopTab } from './ReviewTab'
import { QUESTIONNAIRE_DOC_KEY, QUESTIONNAIRE_HUB_LABEL } from './questionnaireData'
import { isManualImportDoc } from '../../data/documentImportMeta'
import { isDocShownVerified, isVerifiedInSet, normalizeVerifiedDocKey } from '../../data/verifiedDocKeys'

export type IdentityField = 'ssn' | 'ein'

export type DocVerifyBlockReason =
  | 'critical-flags'
  | 'missing-ssn'
  | 'missing-ein'
  | 'missing-identity'

export type CanVerifyDocResult = {
  allowed: boolean
  reason?: DocVerifyBlockReason
  uncorrectedCriticalCount?: number
  missingIdentityFields?: IdentityField[]
}

function isBlankIdentity(value: string | undefined | null): boolean {
  return !value?.trim()
}

/** Missing SSN/EIN on Tech Circle W-2 (LiveAmounts identity fields). */
export function getTechCircleIdentityGaps(
  amounts: Pick<LiveAmounts, 'employeeSsn' | 'employerEin'>,
): IdentityField[] {
  const gaps: IdentityField[] = []
  if (isBlankIdentity(amounts.employeeSsn)) gaps.push('ssn')
  if (isBlankIdentity(amounts.employerEin)) gaps.push('ein')
  return gaps
}

/** Whether a preparer may mark this document verified (critical flags + identity gates). */
export function canVerifyDoc(args: {
  docKey: string
  reviewedFields: Map<string, unknown>
  amounts?: Pick<LiveAmounts, 'employeeSsn' | 'employerEin'>
  isReviewer?: boolean
}): CanVerifyDocResult {
  if (args.isReviewer) return { allowed: true }

  const key = normalizeVerifiedDocKey(args.docKey)

  /** PDF-only / manual docs — preparer attests manual match; skip OCR flag + identity gates. */
  if (isManualImportDoc(key)) {
    return { allowed: true }
  }

  const uncorrectedCriticalCount = countUncorrectedCriticalFlagsForDoc(
    args.docKey,
    args.reviewedFields,
  )
  if (uncorrectedCriticalCount > 0) {
    return { allowed: false, reason: 'critical-flags', uncorrectedCriticalCount }
  }

  if (key === 'techCircle' && args.amounts) {
    const missingIdentityFields = getTechCircleIdentityGaps(args.amounts)
    if (missingIdentityFields.length > 0) {
      const reason: DocVerifyBlockReason =
        missingIdentityFields.length === 2
          ? 'missing-identity'
          : missingIdentityFields[0] === 'ssn'
            ? 'missing-ssn'
            : 'missing-ein'
      return { allowed: false, reason, missingIdentityFields }
    }
  }

  return { allowed: true }
}

/** Short persistent hint under Mark as verified while identity fields are missing. */
export function getDocVerifyIdentityBlockedHint(missing: IdentityField[]): string {
  if (missing.length === 2) {
    return 'Employee SSN and employer EIN must be entered before you can mark this document verified.'
  }
  if (missing.includes('ssn')) {
    return 'Employee SSN must be entered before you can mark this document verified.'
  }
  return 'Employer EIN must be entered before you can mark this document verified.'
}

/** Full message after clicking Mark as verified while identity fields are missing. */
export function getDocVerifyIdentityBlockedMessage(missing: IdentityField[]): string {
  if (missing.length === 2) {
    return 'Enter the employee SSN and employer EIN on this W-2 before you mark it as verified.'
  }
  if (missing.includes('ssn')) {
    return 'Enter the employee SSN on this W-2 before you mark it as verified.'
  }
  return 'Enter the employer EIN on this W-2 before you mark it as verified.'
}

/** Packet doc verify progress for Phase 1 banner (incl. Questionnaire). Prior-year 1040 is Summary YoY only. */
export function countVerifiedPacketDocs(args: {
  verifiedDocs: Set<string>
  reviewerConfirmedDocs?: Set<string>
}): { verified: number; total: number } {
  const docs = listPacketSourceDocs()
  const verified = docs.filter(d =>
    isDocShownVerified(args.verifiedDocs, d.key, args.reviewerConfirmedDocs),
  ).length
  return { verified, total: docs.length }
}

export type DocConfirmStatus = 'confirmed' | 'needs-confirm' | 'unverified'

/** Reviewer-facing confirm state for a single source document. */
export function getDocConfirmStatus(
  verifiedDocs: Set<string>,
  docKey: string,
  reviewerConfirmedDocs?: Set<string>,
): DocConfirmStatus {
  if (reviewerConfirmedDocs && isVerifiedInSet(reviewerConfirmedDocs, docKey)) {
    return 'confirmed'
  }
  if (isVerifiedInSet(verifiedDocs, docKey)) {
    return 'needs-confirm'
  }
  return 'unverified'
}

/** Count packet docs awaiting reviewer confirmation (preparer verified, reviewer not). */
export function countDocsNeedingReviewerConfirm(args: {
  verifiedDocs: Set<string>
  reviewerConfirmedDocs: Set<string>
  docKeys: readonly string[]
}): number {
  const { verifiedDocs, reviewerConfirmedDocs, docKeys } = args
  return docKeys.filter(
    k => isVerifiedInSet(verifiedDocs, k) && !isVerifiedInSet(reviewerConfirmedDocs, k),
  ).length
}

/** Count docs not yet reviewer-confirmed (includes unverified + needs-confirm). */
export function countDocsIncompleteForReviewer(args: {
  verifiedDocs: Set<string>
  reviewerConfirmedDocs: Set<string>
  docKeys: readonly string[]
}): number {
  const { verifiedDocs, reviewerConfirmedDocs, docKeys } = args
  return docKeys.filter(
    k => getDocConfirmStatus(verifiedDocs, k, reviewerConfirmedDocs) !== 'confirmed',
  ).length
}

/** Per L1 tab: count of packet docs not yet mark-reviewed (preparer Phase 1 badges). */
export function buildTabUnreviewedCounts(args: {
  verifiedDocs: Set<string>
  reviewerConfirmedDocs?: Set<string>
  tabVerifiedKeys: Record<string, string[]>
}): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [tabKey, keys] of Object.entries(args.tabVerifiedKeys)) {
    const unreviewed = keys.filter(
      k => !isDocShownVerified(args.verifiedDocs, k, args.reviewerConfirmedDocs),
    ).length
    if (unreviewed > 0) out[tabKey] = unreviewed
  }
  return out
}

/** Peel-tab badge: 1 when doc unreviewed, 0 when verified (replaces flag counts for doc progress). */
export function unreviewedDocBadge(
  verifiedDocs: Set<string>,
  docKey: string,
  reviewerConfirmedDocs?: Set<string>,
): number {
  return isDocShownVerified(verifiedDocs, docKey, reviewerConfirmedDocs) ? 0 : 1
}

/**
 * A document shows a green check when marked verified, OR when it originally
 * had import flags and those are all cleared (legacy “cleared” signal).
 */
export function isDocReviewed(
  verifiedDocs: Set<string>,
  docKey: string,
  remainingFlagCount: number,
  initialFlagCount: number,
  reviewerConfirmedDocs?: Set<string>,
): boolean {
  if (isDocShownVerified(verifiedDocs, docKey, reviewerConfirmedDocs)) return true
  return initialFlagCount > 0 && remainingFlagCount === 0
}

/** Count docs awaiting reviewer confirmation per L1 document type tab. */
export function buildTabConfirmCounts(args: {
  verifiedDocs: Set<string>
  reviewerConfirmedDocs: Set<string>
  tabVerifiedKeys: Record<string, string[]>
  isReviewer: boolean
}): Record<string, number> {
  if (!args.isReviewer) return {}
  const out: Record<string, number> = {}
  for (const [tabKey, keys] of Object.entries(args.tabVerifiedKeys)) {
    const count = countDocsNeedingReviewerConfirm({
      verifiedDocs: args.verifiedDocs,
      reviewerConfirmedDocs: args.reviewerConfirmedDocs,
      docKeys: keys,
    })
    if (count > 0) out[tabKey] = count
  }
  return out
}

/** Aggregate reviewer confirm state per L1 document type tab. */
export function buildTabConfirmStatus(args: {
  verifiedDocs: Set<string>
  reviewerConfirmedDocs: Set<string>
  tabVerifiedKeys: Record<string, string[]>
  isReviewer: boolean
}): Record<string, DocConfirmStatus> {
  if (!args.isReviewer) return {}
  const out: Record<string, DocConfirmStatus> = {}
  for (const [tabKey, keys] of Object.entries(args.tabVerifiedKeys)) {
    if (keys.length === 0) continue
    const statuses = keys.map(k =>
      getDocConfirmStatus(args.verifiedDocs, k, args.reviewerConfirmedDocs),
    )
    if (statuses.every(s => s === 'confirmed')) {
      out[tabKey] = 'confirmed'
    } else if (statuses.some(s => s === 'needs-confirm')) {
      out[tabKey] = 'needs-confirm'
    }
  }
  return out
}

/** First packet doc key still awaiting reviewer confirmation (or preparer verify). */
export function getFirstDocNeedingReviewerAttention(args: {
  verifiedDocs: Set<string>
  reviewerConfirmedDocs: Set<string>
  docKeys: readonly string[]
}): string | undefined {
  return args.docKeys.find(
    k => !isDocShownVerified(args.verifiedDocs, k, args.reviewerConfirmedDocs),
  )
}

export function buildTabVerifiedKeys(): Record<string, string[]> {
  return {
    w2s: W2_PAYER_TABS.map(t => t.key),
    '1099-divs': DIV_PAYER_TABS.map(t => divVerifiedDocKey(t.key)),
    '1099-ints': INT_PAYER_TABS.map(t => intVerifiedDocKey(t.key)),
    '1099-rs': ['1099-r'],
    '1099-necs': ['1099-nec'],
    questionnaire: [QUESTIONNAIRE_DOC_KEY],
  }
}

/** True when every L2 doc under a type tab is preparer-verified or reviewer-confirmed. */
export function buildTypeReviewed(args: {
  verifiedDocs: Set<string>
  w2Counts: Record<W2Employer, number>
  divCounts: Record<DivPayer, number>
  intCounts: Record<IntPayer, number>
  rRemaining: number
  reviewerConfirmedDocs?: Set<string>
}): Record<string, boolean> {
  const { verifiedDocs, w2Counts, divCounts, intCounts, rRemaining, reviewerConfirmedDocs } = args

  const w2s = W2_PAYER_TABS.every(t =>
    isDocShownVerified(verifiedDocs, t.key, reviewerConfirmedDocs),
  )

  const divs = DIV_PAYER_TABS.every(t =>
    isDocShownVerified(verifiedDocs, divVerifiedDocKey(t.key), reviewerConfirmedDocs),
  )

  const ints = INT_PAYER_TABS.every(t =>
    isDocShownVerified(verifiedDocs, intVerifiedDocKey(t.key), reviewerConfirmedDocs),
  )

  const rs = isDocShownVerified(verifiedDocs, '1099-r', reviewerConfirmedDocs)

  const necs = isDocShownVerified(verifiedDocs, '1099-nec', reviewerConfirmedDocs)

  return {
    w2s,
    '1099-divs': divs,
    '1099-ints': ints,
    '1099-rs': rs,
    '1099-necs': necs,
    questionnaire: isDocShownVerified(verifiedDocs, QUESTIONNAIRE_DOC_KEY, reviewerConfirmedDocs),
  }
}

/** Navigation target for one packet source document (incl. Questionnaire). */
export type PacketSourceDoc = {
  key: string
  label: string
  tab: TopTab
  w2SubTab?: W2Employer
  divPayer?: DivPayer
  intPayer?: IntPayer
}

/** Canonical packet inventory used for “review remaining documents” after flags clear. */
export function listPacketSourceDocs(): PacketSourceDoc[] {
  return [
    ...W2_PAYER_TABS.map(t => ({
      key: t.key,
      label: `W-2 · ${t.label}`,
      tab: 'w2s' as const,
      w2SubTab: t.key,
    })),
    ...DIV_PAYER_TABS.map(t => ({
      key: divVerifiedDocKey(t.key),
      label: `1099-DIV · ${t.label}`,
      tab: '1099-divs' as const,
      divPayer: t.key,
    })),
    ...INT_PAYER_TABS.map(t => ({
      key: intVerifiedDocKey(t.key),
      label: `1099-INT · ${t.label}`,
      tab: '1099-ints' as const,
      intPayer: t.key,
    })),
    ...R_PAYER_TABS.map(t => ({
      key: '1099-r',
      label: `1099-R · ${t.label}`,
      tab: '1099-rs' as const,
    })),
    ...NEC_PAYER_TABS.map(t => ({
      key: '1099-nec',
      label: `1099-NEC · ${t.label}`,
      tab: '1099-necs' as const,
    })),
    {
      key: QUESTIONNAIRE_DOC_KEY,
      label: QUESTIONNAIRE_HUB_LABEL,
      tab: 'questionnaire',
    },
  ]
}

export function getUnreviewedSourceDocs(args: {
  verifiedDocs: Set<string>
  w2Counts: Record<W2Employer, number>
  divCounts: Record<DivPayer, number>
  intCounts: Record<IntPayer, number>
  rRemaining: number
}): PacketSourceDoc[] {
  const { verifiedDocs } = args
  return listPacketSourceDocs().filter(doc => !isVerifiedInSet(verifiedDocs, doc.key))
}

/** Cycle to the next unreviewed packet doc after the one matching current tab/payer. */
export function getNextUnreviewedSourceDoc(
  unreviewed: PacketSourceDoc[],
  current: { tab: TopTab; w2SubTab?: W2Employer; divPayer?: DivPayer; intPayer?: IntPayer },
): PacketSourceDoc | null {
  if (unreviewed.length === 0) return null

  const matchesCurrent = (doc: PacketSourceDoc) => {
    if (doc.tab !== current.tab) return false
    if (doc.w2SubTab) return doc.w2SubTab === current.w2SubTab
    if (doc.divPayer) return doc.divPayer === current.divPayer
    if (doc.intPayer) return doc.intPayer === current.intPayer
    return true
  }

  const idx = unreviewed.findIndex(matchesCurrent)
  if (idx === -1) return unreviewed[0]
  return unreviewed[(idx + 1) % unreviewed.length]
}

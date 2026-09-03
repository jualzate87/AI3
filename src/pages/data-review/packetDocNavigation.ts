import { applyInputDocKey, getDefaultDocKey } from '../../data/inputDocTabs'
import type { W2Employer } from './DetailFields'
import type { DivPayer } from './DetailFieldsDiv'
import type { IntPayer } from './DetailFields1099'
import type { TopTab } from './ReviewTab'
import type { PacketSourceDoc } from './docReviewStatus'
import {
  getNextUnreviewedSourceDoc,
  getUnreviewedSourceDocs,
} from './docReviewStatus'
import {
  countPhase1FlagsForDivPayer,
  countPhase1FlagsForIntPayer,
  countPhase1FlagsForW2Payer,
  getTabFlagCounts,
} from './phase1FieldSync'
import { DIV_PAYER_TABS } from './DetailFieldsDiv'
import { INT_PAYER_TABS } from './DetailFields1099'
import { W2_PAYER_TABS } from './DetailFields'

export type PacketDocNavSetters = {
  setActiveTopTab: (tab: TopTab) => void
  setActiveSubTab: (tab: W2Employer) => void
  setActiveDivPayer: (payer: DivPayer) => void
  setActiveIntPayer: (payer: IntPayer) => void
  setSelectedField?: (field: string | null) => void
}

export type PacketDocNavPosition = {
  tab: TopTab
  w2SubTab?: W2Employer
  divPayer?: DivPayer
  intPayer?: IntPayer
}

/** Apply a packet inventory row to synced review navigation state. */
export function navigateToPacketDoc(
  doc: PacketSourceDoc,
  setters: PacketDocNavSetters,
): void {
  setters.setActiveTopTab(doc.tab)
  if (doc.w2SubTab) setters.setActiveSubTab(doc.w2SubTab)
  if (doc.divPayer) setters.setActiveDivPayer(doc.divPayer)
  if (doc.intPayer) setters.setActiveIntPayer(doc.intPayer)
  setters.setSelectedField?.(null)
}

/** Switch L1 doc type and land on the first L2 instance when one exists. */
export function navigateToTopTab(tab: TopTab, setters: PacketDocNavSetters): void {
  setters.setActiveTopTab(tab)
  setters.setSelectedField?.(null)
  const defaultDocKey = getDefaultDocKey(tab)
  if (defaultDocKey) {
    applyInputDocKey(tab, defaultDocKey, setters)
  }
}

/** Switch L2 payer / employer tab within the active doc type. */
export function navigateToPeelDocKey(
  topTab: TopTab,
  docKey: string,
  setters: PacketDocNavSetters,
): void {
  applyInputDocKey(topTab, docKey, setters)
  setters.setSelectedField?.(null)
}

export function buildUnreviewedSourceDocs(args: {
  verifiedDocs: Set<string>
  reviewedFields: Map<string, unknown>
}): PacketSourceDoc[] {
  const tabFlagCounts = getTabFlagCounts(args.reviewedFields)
  const divPayerFieldCounts: Record<DivPayer, number> = Object.fromEntries(
    DIV_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForDivPayer(p, args.reviewedFields)]),
  ) as Record<DivPayer, number>
  const intPayerFieldCounts: Record<IntPayer, number> = Object.fromEntries(
    INT_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForIntPayer(p, args.reviewedFields)]),
  ) as Record<IntPayer, number>
  const w2PayerFieldCounts: Record<W2Employer, number> = Object.fromEntries(
    W2_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForW2Payer(p, args.reviewedFields)]),
  ) as Record<W2Employer, number>

  return getUnreviewedSourceDocs({
    verifiedDocs: args.verifiedDocs,
    w2Counts: w2PayerFieldCounts,
    divCounts: divPayerFieldCounts,
    intCounts: intPayerFieldCounts,
    rRemaining: tabFlagCounts['1099-rs'] ?? 0,
  })
}

/** Cycle to the next unreviewed packet document from the current position. */
export function selectNextUnreviewedPacketDoc(
  unreviewed: PacketSourceDoc[],
  current: PacketDocNavPosition,
  setters: PacketDocNavSetters,
): PacketSourceDoc | null {
  const next = getNextUnreviewedSourceDoc(unreviewed, current)
  if (!next) return null
  navigateToPacketDoc(next, setters)
  return next
}

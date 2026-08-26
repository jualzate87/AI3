import type { TopTab } from '../pages/data-review/ReviewTab'
import type { W2Employer } from '../pages/data-review/DetailFields'
import type { DivPayer } from '../pages/data-review/DetailFieldsDiv'
import type { IntPayer } from '../pages/data-review/DetailFields1099'
import { divVerifiedDocKey, intVerifiedDocKey, normalizeVerifiedDocKey } from './verifiedDocKeys'

/** How a source document entered the return — drives badge + verify rules. */
export type ImportMode = 'api-filed' | 'extracted' | 'pdf-only' | 'manual'

export type DocumentImportMeta = {
  importMode: ImportMode
  /** PDF/stub attached in the source preview */
  hasPdf: boolean
  /** Field values imported (API or OCR) — not hand-keyed */
  hasStructuredInput: boolean
}

/** Per-document import metadata for Jessica Drake TY 2025 packet. */
const DOC_IMPORT_META: Record<string, DocumentImportMeta> = {
  techCircle: { importMode: 'extracted', hasPdf: true, hasStructuredInput: true },
  bingEquipment: { importMode: 'manual', hasPdf: true, hasStructuredInput: false },
  '1099-div-tokenFinancial': { importMode: 'extracted', hasPdf: true, hasStructuredInput: true },
  '1099-div-northmarkIndex': { importMode: 'extracted', hasPdf: true, hasStructuredInput: true },
  '1099-div-beaconDividend': { importMode: 'extracted', hasPdf: true, hasStructuredInput: true },
  '1099-int-unwaverIngFinancial': { importMode: 'extracted', hasPdf: true, hasStructuredInput: true },
  '1099-int-harborlineCredit': { importMode: 'extracted', hasPdf: true, hasStructuredInput: true },
  '1099-int-cascadeFederal': { importMode: 'extracted', hasPdf: true, hasStructuredInput: true },
  '1099-r': { importMode: 'extracted', hasPdf: true, hasStructuredInput: true },
  '1099-nec': { importMode: 'extracted', hasPdf: true, hasStructuredInput: true },
}

export function getDocumentImportMeta(docKey: string): DocumentImportMeta | null {
  const key = normalizeVerifiedDocKey(docKey)
  return DOC_IMPORT_META[key] ?? null
}

export function isManualImportDoc(docKey: string): boolean {
  const meta = getDocumentImportMeta(docKey)
  if (!meta) return false
  return meta.importMode === 'pdf-only' || meta.importMode === 'manual'
}

/** Resolve the active packet document key from review tab state. */
export function resolveActiveVerifyDocKey(args: {
  activeTopTab: TopTab
  activeSubTab: W2Employer
  activeDivPayer: DivPayer
  activeIntPayer: IntPayer
}): string | null {
  switch (args.activeTopTab) {
    case 'w2s':
      return args.activeSubTab
    case '1099-divs':
      return divVerifiedDocKey(args.activeDivPayer)
    case '1099-ints':
      return intVerifiedDocKey(args.activeIntPayer)
    case '1099-rs':
      return '1099-r'
    case '1099-necs':
      return '1099-nec'
    default:
      return null
  }
}

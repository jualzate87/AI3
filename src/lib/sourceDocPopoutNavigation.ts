import { navigationForSourceDoc } from '../data/sourceDocuments'
import type { FieldOriginSource } from '../data/fieldOrigins'
import {
  openSourceDocumentReviewPopout,
  type SourceDocumentPopoutContext,
} from './prototypeRoutes'

export function popoutContextFromDocId(docId: string): SourceDocumentPopoutContext {
  const nav = navigationForSourceDoc(docId)
  if (!nav) return {}
  return {
    tab: nav.tab,
    subTab: nav.subTab,
    divPayer: nav.divPayer,
    intPayer: nav.intPayer,
  }
}

/** Open detached source-document review focused on a field origin row. */
export function openSourceDocumentFromFieldOrigin(
  source: FieldOriginSource,
  onSelectField?: (detailFieldId: string) => void,
): void {
  onSelectField?.(source.detailFieldId)
  openSourceDocumentReviewPopout(popoutContextFromDocId(source.docId))
}

/** Open popout for a source document id (optional detail field highlight). */
export function openSourceDocumentById(
  docId: string,
  detailFieldId?: string | null,
  onSelectField?: (detailFieldId: string) => void,
): void {
  if (detailFieldId) onSelectField?.(detailFieldId)
  openSourceDocumentReviewPopout(popoutContextFromDocId(docId))
}

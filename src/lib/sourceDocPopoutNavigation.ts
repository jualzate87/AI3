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

/** Open popout on document preview (no input field focus). */
export function openSourceDocumentForView(docId: string): void {
  openSourceDocumentReviewPopout(popoutContextFromDocId(docId))
}

/** Open popout with a detail input field selected (View input). */
export function openSourceDocumentForInput(
  docId: string,
  detailFieldId: string,
  onSelectField?: (detailFieldId: string) => void,
): void {
  onSelectField?.(detailFieldId)
  openSourceDocumentReviewPopout({
    ...popoutContextFromDocId(docId),
    field: detailFieldId,
  })
}

/** Open detached source-document review focused on a field origin row. */
export function openSourceDocumentFromFieldOrigin(
  source: FieldOriginSource,
  onSelectField?: (detailFieldId: string) => void,
  focus: 'document' | 'input' = 'input',
): void {
  if (focus === 'document') {
    openSourceDocumentForView(source.docId)
    return
  }
  openSourceDocumentForInput(source.docId, source.detailFieldId, onSelectField)
}

/** Open popout for a source document id (optional detail field highlight). */
export function openSourceDocumentById(
  docId: string,
  detailFieldId?: string | null,
  onSelectField?: (detailFieldId: string) => void,
  focus: 'document' | 'input' = 'input',
): void {
  if (focus === 'document' || !detailFieldId) {
    openSourceDocumentForView(docId)
    return
  }
  openSourceDocumentForInput(docId, detailFieldId, onSelectField)
}

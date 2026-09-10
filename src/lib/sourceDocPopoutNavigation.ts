import { navigationForSourceDoc } from '../data/sourceDocuments'
import type { FieldOriginSource } from '../data/fieldOrigins'
import {
  navigateToInputFromFieldOrigin,
  navigateToInputReturn,
} from './inputReturnNavigation'
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

/** Open source-document popout on the PDF preview (View document). */
export function openSourceDocumentForView(docId: string): void {
  openSourceDocumentReviewPopout(popoutContextFromDocId(docId))
}

/** Navigate to Input return tab with the detail field focused (View input). */
export function openSourceDocumentForInput(
  docId: string,
  detailFieldId: string,
  onSelectField?: (detailFieldId: string) => void,
): void {
  navigateToInputReturn(docId, detailFieldId, onSelectField)
}

/** View document → source popout; View input → Input return tab. */
export function openSourceDocumentFromFieldOrigin(
  source: FieldOriginSource,
  onSelectField?: (detailFieldId: string) => void,
  focus: 'document' | 'input' = 'input',
): void {
  if (focus === 'document') {
    openSourceDocumentForView(source.docId)
    return
  }
  navigateToInputFromFieldOrigin(source, onSelectField)
}

/** Open source popout (document) or Input return (input field). */
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
  navigateToInputReturn(docId, detailFieldId, onSelectField)
}

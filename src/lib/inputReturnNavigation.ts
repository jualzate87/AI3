import { navigationForSourceDoc } from '../data/sourceDocuments'
import {
  docKeyFromVerifiedDocId,
  INPUT_FIELD_PARAM,
  writeInputReturnParams,
} from '../data/inputDocTabs'
import { inputNavItemByTopTab } from '../data/inputMenuNav'
import { navigationForVerifiedDocKey, normalizeVerifiedDocKey } from '../data/verifiedDocKeys'
import { patchSyncedReviewNavigation } from '../hooks/useSyncedReviewState'
import type { FieldOriginSource } from '../data/fieldOrigins'

function resolveDocNavigation(docId: string) {
  const canonical = normalizeVerifiedDocKey(docId)
  return navigationForVerifiedDocKey(canonical) ?? navigationForSourceDoc(docId)
}

/** Hash route for Input return deep link (form + doc + optional field). */
export function buildInputReturnRoute(docId: string, detailFieldId?: string): string | null {
  const nav = resolveDocNavigation(docId)
  if (!nav) return null
  const navItem = inputNavItemByTopTab(nav.tab)
  const docKey = docKeyFromVerifiedDocId(normalizeVerifiedDocKey(docId))
  const params = new URLSearchParams()
  writeInputReturnParams(params, navItem.id, navItem.topTab, docKey)
  if (detailFieldId) params.set(INPUT_FIELD_PARAM, detailFieldId)
  return `/input-return?${params.toString()}`
}

/** Navigate to Input return tab with the matching form, document, and field focused. */
export function navigateToInputReturn(
  docId: string,
  detailFieldId?: string,
  onSelectField?: (field: string) => void,
): void {
  const nav = resolveDocNavigation(docId)
  if (!nav) return

  if (detailFieldId) onSelectField?.(detailFieldId)

  patchSyncedReviewNavigation({
    activeTopTab: nav.tab,
    ...(nav.subTab ? { activeSubTab: nav.subTab } : {}),
    ...(nav.divPayer ? { activeDivPayer: nav.divPayer } : {}),
    ...(nav.intPayer ? { activeIntPayer: nav.intPayer } : {}),
    selectedField: detailFieldId ?? null,
  })

  const route = buildInputReturnRoute(docId, detailFieldId)
  if (!route) return
  window.location.hash = route
}

/** From a field-origin row — View input goes to Input return, not source-doc popout. */
export function navigateToInputFromFieldOrigin(
  source: FieldOriginSource,
  onSelectField?: (field: string) => void,
): void {
  navigateToInputReturn(source.docId, source.detailFieldId, onSelectField)
}
